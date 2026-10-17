# Pack file standard (`.fap`)

Status: implemented. This document is the reference for the content format and
the rules the engine enforces when reading it.

## 1. Purpose

A `.fap` file is a zip archive holding all of a game's content. Its goals are:

- One file to ship, update, or verify, instead of a directory tree.
- A content layout that is identical whether the content is loose on disk or
  packed, so the engine has exactly one set of paths to ask for.
- No runtime zip extraction, so the game never writes game content to disk.
- Optional password protection without storing the password in the container.

The engine is read-only with respect to game content. It never creates or
modifies a pack, and it never extracts one to a temp directory. Pack authoring
is a separate, offline concern.

## 2. Container format

- File extension: `.fap`. The MIME type is `application/x-sm-fap` in spirit; it
  is not registered with the OS, so the extension is the only signal.
- A `.fap` file is a standard zip archive (PKZIP), read with `unzipper`.
- Entries use forward slashes, are case-sensitive, and are stored under a
  canonical layout (section 3).
- Compression is permitted but not required. Stored entries are valid.
- Archive comment, zip64, and multi-range requests are not used.
- The engine locates the pack in this order inside a candidate root:
  `game.fap` first, then the first other `*.fap` by sorted name.

## 3. Canonical layout

```
Metadata.json                        (required, never encrypted)
Assets/
  Title.png                          (title screen image)
  Characters/
    <Character Name>/
      <Sprite Name>.png
  Scenes/
    <Background Name>.png|jpg
  Sounds/
    <Track Name>.mp3|wav|ogg
Scripts/
  Scenarios/
    <Scenario Name>.txt
```

Rules:

- Folder and file names are matched case-sensitively, exactly as stored in the
  archive. A loose folder on Windows is case-insensitive, so a name that works
  in development can still fail inside a pack. Keep them identical.
- `Metadata.json` sits at the root of the archive.
- The title screen image name comes from `Metadata.json`
  (`TitleScreenImageName`), resolved as `Assets/<name>.<ext>`. The engine probes
  `.png`, `.jpg`, then `.jpeg` and uses the first that loads.
- The start scenario is `Scripts/Scenarios/<StartFile>.<ScenarioExtension>`.
  `StartFile` is stored without its extension, because `ScenarioExtension` is
  applied separately.
- A `JUMP SCENARIO` target is resolved in the same folder.
- There is no separate GameOver screen. The end of a scenario may end the game;
  an image placed at `Assets/Scenes/GameOver.png` is just an ordinary scene.

## 4. `Metadata.json`

UTF-8 JSON at the archive root. It must not be encrypted: the engine reads it to
learn whether a password is needed, so an encrypted copy is unsatisfiable and
the engine refuses to start.

| Field | Type | Notes |
| --- | --- | --- |
| `Title` | string | Shown in the title screen. |
| `TitleScreenImageName` | string | File name without extension, under `Assets/`. |
| `Author` | string | Optional. |
| `Version` | string | Optional. |
| `DateGenerated` | string | Optional, ISO 8601. |
| `VersionHash` | string | Optional, legacy field. |
| `StartFile` | string | Scenario name without extension. |
| `ScenarioExtension` | string | `txt` in practice. |
| `PictureFormatType` | number | `2` selects PNG as the primary image format. |
| `PackFormatVersion` | number | Format version; see below. |
| `Password` | string | Optional password used to decrypt encrypted packs. |
| `Encryption` | object | Present only for password-protected packs; see below. |

### 4.1 `PackFormatVersion`

A single number. The engine computes `major = floor(version)`; a version with a
`major` above the supported major is refused, so a pack built by a newer format
fails loudly instead of rendering wrongly. A missing field is treated as `0` and
accepted, so pre-standard content keeps working.

Currently supported: `1`.

## 5. Encryption

Pack encryption uses ZipCrypto, read through `unzipper`. ZipCrypto is weak by
modern standards; it is used here because it is what the format requires and it
is widely readable. It is obfuscation, not strong protection.

The password itself is **never** stored in the pack. `Metadata.json` carries
only a verifier:

```json
"Encryption": {
  "Algorithm": "ZipCrypto",
  "Kdf": "pbkdf2-sha256",
  "Iterations": 100000,
  "Salt": "<base64, 16 bytes>",
  "Verifier": "<base64, 32 bytes>"
}
```

- `Verifier` is `PBKDF2-HMAC-SHA256(password, Salt, Iterations, 32)`.
- Verification compares in constant time.
- A salt, verifier, or verifier of the wrong length is treated as a failure
  rather than being allowed to throw.
- A pack that declares no `Encryption` block but does have encrypted entries is
  allowed; any password is then accepted, because there is nothing to check
  against. This is a weak configuration and is not recommended.

## 6. Locating game content

1. `--pack <path>` (or `--pack=<path>`) on the command line. A path given this
   way is used as-is. If it is missing or cannot be opened, startup fails.
2. `process.resourcesPath`, when running a packaged build.
3. `dist/`, relative to the compiled main process module.
4. The current working directory.

Within a root, a pack wins over loose folders. A pack that exists but cannot be
opened is a hard error, not a silent downgrade to loose folders: running the
wrong content is worse than refusing to start.

A loose folder is accepted when it contains `Metadata.json`, and it must use the
same canonical layout as a pack.

## 7. Content access over `sm://`

Handled-scheme URLs are network requests, so relative URLs such as
`../Scenes/x.png` do not resolve. All content is addressed absolutely:

```
sm://game/<entry path>
```

`sm` is registered as a privileged, streaming scheme before the app is ready.

- The path after the host is percent-decoded, then validated, then looked up.
- Rejected as unsafe: `..` and `.` segments, a leading `/`, a drive-letter
  prefix, and any backslash. Rejected entries are skipped at index time and
  reported, so a hostile pack cannot escape the archive.
- Lookups are normalization-insensitive for redundant separators and a leading
  `./`, but case-sensitive.
- Responses carry the MIME type inferred from the extension, defaulting to
  `application/octet-stream`.
- Every response, including errors, carries CORS headers, and the renderer sets
  `crossOrigin = 'anonymous'` on images before assigning `src`. Both halves are
  required: an image loaded without `crossOrigin` still decodes and displays,
  but it is tainted, and a tainted image cannot be uploaded to WebGL, so
  `texImage2D` throws and the sprite silently never renders. The response
  echoes the request `Origin` rather than using `*`, because a `file://` page
  has an opaque origin serialized as the literal `null`, which a wildcard does
  not satisfy.
- `Range` is not a CORS-safelisted header, so `OPTIONS` preflight is answered
  and `Range` is listed in `Access-Control-Allow-Headers`.
- Status codes: `404` for an entry that is not in the source, `401` when an
  entry is encrypted and no password has been supplied, `403` for a wrong
  password, `206` for a satisfied range, `200` otherwise.
- Single byte ranges are supported, including open-ended and suffix ranges.
  Multi-range requests, and ranges that cannot be satisfied, are answered in
  full with `200` rather than refused.

## 8. Passwords at runtime

- A password is read directly from `Metadata.json` (`Password` field).
- When a pack contains encrypted entries (`requiresPassword`), the engine uses the password defined in `Metadata.json`.
- If no password (or an invalid password) is found in `Metadata.json`, the pack cannot be decrypted and game startup fails.
- There is no interactive modal window or runtime password prompt.

## 9. How the engine reads content

- The renderer receives absolute `sm://` URLs; it never builds filesystem paths
  and never sees a pack or folder path.
- Main-process code addresses content by canonical entry path through a single
  source interface, so pack and folder are interchangeable.
- Metadata is read through the same interface, and the format version is
  validated when the source is opened.
- Scene images use the metadata's primary format, then fall back to the
  extension probe chain.
- Characters resolve to `Assets/Characters/<Character Name>/<Sprite Name>.png`.
- Sounds resolve to `Assets/Sounds/<Track Name>.<ext>`; the engine's track name
  has no extension and the stored extension is not relied upon.

## 10. Build and packaging

- The `scripts/` directory was renamed to `tools/`.
- Content is copied into `dist/` under the canonical layout. The destination
  content folders are cleared first, so a rename cannot leave a stale copy
  behind and the loose-folder development path matches a fresh checkout.
- `Metadata.json`, `Scripts/**/*` and `Assets/**/*` ship as `extraResources`, so
  a packaged build finds them under `process.resourcesPath`.
- `SM-cli` generates `Metadata.json`, including `PackFormatVersion` and,
  with `--password` / `--iterations`, the `Encryption` verifier block.

## 11. Verification

Automated tests cover path safety, index admission and encryption detection,
pack reading and validation failures, the loose-folder fallback, URL-to-entry
resolution, the range header parser, the password verifier, and an end-to-end
play-through of a choice fork with a pack as the only content source.

Known gap: the test suite simulates the ZipCrypto encryption flag rather than
producing a genuinely encrypted archive, so decryption of real ZipCrypto
content is not covered automatically. That path is exercised by
`unzipper` and should be confirmed with a real encrypted pack.
