import { describe, it, expect } from 'vitest';
import { parseRangeHeader, corsHeaders } from '../src/main/content/protocol';

describe('protocol - Range header parsing', () => {
  it('returns null when no range is requested', () => {
    expect(parseRangeHeader(null, 1000)).toBeNull();
  });

  it('parses an explicit closed range', () => {
    expect(parseRangeHeader('bytes=0-499', 1000)).toEqual({ start: 0, end: 499 });
  });

  it('parses an open-ended range to the end of the entry', () => {
    expect(parseRangeHeader('bytes=500-', 1000)).toEqual({ start: 500, end: 999 });
  });

  it('parses a suffix range as the trailing bytes', () => {
    expect(parseRangeHeader('bytes=-300', 1000)).toEqual({ start: 700, end: 999 });
  });

  it('clamps an end beyond the entry size', () => {
    expect(parseRangeHeader('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
  });

  it('clamps a suffix range longer than the entry', () => {
    expect(parseRangeHeader('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 });
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseRangeHeader('  bytes=0-99  ', 1000)).toEqual({ start: 0, end: 99 });
  });

  it('ignores multi-range requests and falls back to a full response', () => {
    expect(parseRangeHeader('bytes=0-99,200-299', 1000)).toBeNull();
  });

  it('ignores malformed and non-byte units', () => {
    expect(parseRangeHeader('bytes=abc-def', 1000)).toBeNull();
    expect(parseRangeHeader('bytes=-', 1000)).toBeNull();
    expect(parseRangeHeader('items=0-99', 1000)).toBeNull();
    expect(parseRangeHeader('0-99', 1000)).toBeNull();
  });

  it('rejects inverted and out-of-bounds ranges', () => {
    expect(parseRangeHeader('bytes=500-100', 1000)).toBeNull();
    expect(parseRangeHeader('bytes=2000-3000', 1000)).toBeNull();
  });

  it('rejects a zero-length suffix range', () => {
    expect(parseRangeHeader('bytes=-0', 1000)).toBeNull();
  });
});

describe('protocol - CORS headers', () => {
  function requestWith(origin: string | null): Request {
    return new Request('sm://game/Assets/Title.png', {
      headers: origin === null ? {} : { Origin: origin },
    });
  }

  it('always allows the origin, which image textures depend on', () => {
    // Without this the image still decodes but is tainted, and a tainted image
    // cannot be uploaded to WebGL, so sprites never appear.
    expect(corsHeaders(requestWith('null'))['access-control-allow-origin']).toBe('null');
    expect(corsHeaders(requestWith('file://'))['access-control-allow-origin']).toBe('file://');
  });

  it('echoes the origin rather than using a wildcard for opaque origins', () => {
    // A file:// page has an opaque origin serialized as the literal "null",
    // and a wildcard does not satisfy it.
    expect(corsHeaders(requestWith('null'))['access-control-allow-origin']).not.toBe('*');
  });

  it('falls back to a wildcard when no Origin header is present', () => {
    const headers = corsHeaders(requestWith(null));
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['vary']).toBeUndefined();
  });

  it('varies on Origin only when it echoes one', () => {
    expect(corsHeaders(requestWith('null'))['vary']).toBe('Origin');
  });

  it('permits Range, which is not a CORS-safelisted header', () => {
    const headers = corsHeaders(requestWith('null'));
    expect(headers['access-control-allow-headers']).toContain('Range');
  });

  it('exposes the headers a media element needs to read', () => {
    const exposed = corsHeaders(requestWith(null))['access-control-expose-headers'];
    expect(exposed).toContain('Content-Length');
    expect(exposed).toContain('Content-Range');
  });
});
