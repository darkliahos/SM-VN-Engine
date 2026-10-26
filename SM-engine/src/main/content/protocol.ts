import { Readable } from 'stream';
import { protocol } from 'electron';
import {
  isSafeEntryPath,
  mimeTypeFor,
  normalizeEntryPath,
  PACK_HOST,
  SCHEME,
} from '../../services/GamePaths';
import {
  BadPasswordError,
  EntryNotFoundError,
  GameSource,
  PasswordRequiredError,
} from './GameSource';

/**
 * Registers the `sm://` scheme as privileged. Must be called before the app
 * ready event, and only once.
 *
 * `stream: true` is required rather than optional: Howler runs with `html5: true`,
 * so playback is driven by a real <audio> element that fetches the URL itself and
 * must be told to expect a streaming response.
 */
export function registerAssetScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

interface ByteRange {
  start: number;
  end: number;
}

/**
 * Parses a single-range `Range: bytes=a-b` header. Multi-range requests are not
 * supported and return null so the caller can fall back to a full 200 response,
 * which is what the file:// handler effectively does for audio seeking.
 */
export function parseRangeHeader(header: string | null, size: number): ByteRange | null {
  if (!header) {
    return null;
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) {
    return null;
  }

  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') {
    return null;
  }

  let start: number;
  let end: number;
  if (rawStart === '') {
    // Suffix range: the last N bytes.
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) {
      return null;
    }
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === '' ? size - 1 : Number(rawEnd);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

/** Wraps a readable so it emits only the requested byte range. */
function sliceStream(source: Readable, range: ByteRange): Readable {
  let seen = 0;
  let remaining = range.end - range.start + 1;

  const transform = new Readable({
    read() {
      // no-op; data is pulled via the 'data' handler below
    },
  });

  source.on('data', (chunk: Buffer) => {
    const offset = seen;
    seen += chunk.length;
    if (remaining <= 0) {
      return;
    }
    const from = Math.max(0, range.start - offset);
    const to = Math.min(chunk.length, from + remaining);
    if (to > from) {
      remaining -= to - from;
      transform.push(chunk.subarray(from, to));
    }
  });

  source.on('end', () => {
    transform.push(null);
  });
  source.on('error', error => transform.destroy(error as Error));

  return transform;
}

/**
 * CORS headers for a response.
 *
 * These are not optional. The renderer loads images from a `file://` page, and
 * an `<img>` loaded without `crossOrigin` is tainted even though it renders.
 * A tainted image cannot be uploaded to WebGL, so `texImage2D` throws and the
 * texture never appears. Making the request CORS-mode in the renderer is only
 * half the fix; the response also has to allow it.
 *
 * The Origin is echoed rather than using `*` because a `file://` page has an
 * opaque origin, which serializes as the literal string "null". A wildcard does
 * not satisfy a "null" origin, so it would be rejected.
 */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const headers: Record<string, string> = {
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-methods': 'GET, HEAD, OPTIONS',
    'access-control-allow-headers': 'Range, Content-Type',
    'access-control-expose-headers': 'Content-Length, Content-Range, Accept-Ranges',
  };
  if (origin) {
    headers['vary'] = 'Origin';
  }
  return headers;
}

function errorResponse(status: number, message: string, request: Request): Response {
  return new Response(message, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      ...corsHeaders(request),
    },
  });
}

function toWebStream(stream: Readable): ReadableStream<Uint8Array> {
  return Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>;
}

/**
 * Handles `sm://game/<entry>` by streaming the entry out of the active game
 * source. The source is read through a getter at request time so the handler can
 * be registered before the source has been opened.
 */
export function registerAssetProtocol(getSource: () => GameSource | null): void {
  protocol.handle(SCHEME, async (request): Promise<Response> => {
    // Range is not a CORS-safelisted header, so any ranged or otherwise
    // non-simple request is preflighted before the real one is sent.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const source = getSource();
    if (!source) {
      return errorResponse(503, 'Game content source is not available', request);
    }

    let entryPath: string;
    try {
      const url = new URL(request.url);
      if (url.hostname !== PACK_HOST) {
        return errorResponse(404, `Unknown host: ${url.hostname}`, request);
      }
      entryPath = normalizeEntryPath(decodeURIComponent(url.pathname));
    } catch {
      return errorResponse(400, 'Malformed asset URL', request);
    }

    if (entryPath === '' || !isSafeEntryPath(entryPath)) {
      return errorResponse(400, `Rejected unsafe asset path: ${entryPath}`, request);
    }

    const size = source.size(entryPath);
    if (size === null) {
      return errorResponse(404, `Asset not found: ${entryPath}`, request);
    }

    const contentType = mimeTypeFor(entryPath);
    const rangeHeader = request.headers.get('Range');
    const range = parseRangeHeader(rangeHeader, size);

    try {
      const full = await source.readStream(entryPath);
      const body = range ? sliceStream(full, range) : full;

      const headers: Record<string, string> = {
        'content-type': contentType,
        'accept-ranges': 'bytes',
        'cache-control': 'no-cache',
        ...corsHeaders(request),
      };

      if (range) {
        headers['content-length'] = String(range.end - range.start + 1);
        headers['content-range'] = `bytes ${range.start}-${range.end}/${size}`;
        return new Response(toWebStream(body), { status: 206, headers });
      }

      headers['content-length'] = String(size);
      return new Response(toWebStream(body), { status: 200, headers });
    } catch (error) {
      if (error instanceof PasswordRequiredError) {
        return errorResponse(401, error.message, request);
      }
      if (error instanceof BadPasswordError) {
        return errorResponse(403, error.message, request);
      }
      if (error instanceof EntryNotFoundError) {
        return errorResponse(404, error.message, request);
      }
      console.error(`Failed to serve asset ${entryPath}:`, error);
      return errorResponse(500, `Failed to read asset: ${entryPath}`, request);
    }
  });
}
