---
inclusion: always
name: project-context
description: Project architecture, commands, and technical context for the Amazon IVS Manifest Clipping Solution
---

# Project Context

## Overview

Amazon IVS Manifest Clipping Solution — creates video clips from Amazon IVS recordings without video re-encoding through HLS manifest manipulation. Supports both IVS Low-Latency (standard) and IVS Real-Time (composite + individual participant) recordings.

## Commands

```bash
# Local development (no AWS needed)
npm install
npm run dev:mock        # Mock API (port 3001) + React UI (port 3000)

# UI only (requires backend or mock already running)
npm run dev             # Starts Vite dev server on port 3000

# Mock server only
npm run mock            # Express mock API on port 3001

# Build
npm run build           # Production build of React UI (output: manifest-clip-ui/build/)

# AWS deployment
npm run deploy          # Interactive wizard (7 options)
npm run cleanup         # Removes all deployed CloudFormation stacks
npm run export-config   # Exports stack outputs to UI config.json
```

## Architecture

npm workspace monorepo: root (clipping library + deployment tooling) + `manifest-clip-ui` (React frontend).

### Core Clipping Library (`lib/`)

Pure JS library — format-agnostic. Handles standard IVS, RT composite, and RT individual recordings.

- `parser.js` — `parseMaster()` extracts rendition URIs via `#EXT-X-STREAM-INF` (handles all naming styles). `parsePlaylistWithPDT()` extracts segments with PDT, `#EXT-X-MAP` init segments, byte-range, discontinuity markers. Computes synthetic PDTs for single-PDT playlists.
- `clipper.js` — `clipPlaylistByPDT()` filters segments (PDT-based or offset-based for no-PDT playlists). `createPlaylistManifest()` generates HLS output with init segment tags. `rewriteMaster()` rewrites master to point to clip playlists.
- `validation.js` — Input validation (required fields, numeric types, time range)

### Serverless Backend (`serverless/`)

SAM template with three Lambda functions behind API Gateway:
- `POST /clipmanifest` — Creates a clip (supports all recording formats)
- `GET /getrecordings` — Lists IVS recordings from S3 (standard + Real-Time)
- `GET /getclips` — Lists previously created clips

Also: S3 bucket, CloudFront, IVS channel + recording config, sample colorbar upload.

### Standalone API (`standalone-api/`)

Minimal SAM deployment with only `POST /clipmanifest`. Separate stack for integration use cases.

### Real-Time Recorder (`realtime-recorder/`)

Minimal SAM stack for IVS Real-Time recording infrastructure:
- IVS Stage with `AutoParticipantRecordingConfiguration` (individual recordings auto-start)
- StorageConfiguration + EncoderConfiguration (for composite recording)
- `GET /token` — Creates participant tokens
- `POST /composition/start` + `POST /composition/stop` — Composite recording control
- S3 bucket + CloudFront for playback

### React Frontend (`manifest-clip-ui/`)

Vite 8 + React 19. Two pages:
- **Clip Editor** (`/`) — Video player, clip controls, recordings selector, clips gallery
- **RT Publisher** (`/rt-publisher`) — Join RT stage, publish video, start/stop compositions

Config resolution: `VITE_*` env vars → `config.json` → `config.example.json`.

### Deployment Tooling (root)

- `install.js` — Interactive wizard (7 deployment options including RT recorder)
- `cleanup.js` — Deletes tracked stacks (empties S3 buckets first)
- `mock-server.js` — Express mock API
- `export-config.js` — Stack outputs → `config.json`

## Supported Recording Formats

| Format | Master Manifest | Segments | Clipping Method |
|--------|----------------|----------|-----------------|
| IVS Low-Latency | `master.m3u8` | MPEG-TS (`.ts`) | PDT per segment |
| RT Composite | `multivariant.m3u8` | MPEG-TS (`.ts`) | Offset-based (no PDT) |
| RT Individual | `multivariant.m3u8` | fMP4 (`.mp4`) + init segments | Single PDT + cumulative |

## API Contract

`POST /clipmanifest` body:
```json
{
  "start_time": 10,
  "end_time": 30,
  "master_url": "https://cloudfront.example/path/master.m3u8",
  "byte_range": false
}
```

Works with both `master.m3u8` and `multivariant.m3u8` URLs.

Response: Array with `execution`, `path`, `bucket`, `clip_master`, `master_url` fields.

## Key Technical Concepts

- **PDT-based clipping**: Segments filtered by `#EXT-X-PROGRAM-DATE-TIME` vs requested time range
- **Offset-based clipping**: For playlists without PDT (RT composite), uses cumulative segment durations
- **Init segment handling**: fMP4 playlists emit `#EXT-X-MAP:URI="init-0.mp4"` — preserved in clip output
- **Byte-range mode**: Uses `byte-range-multivariant.m3u8` and preserves `#EXT-X-BYTERANGE` tags
- **Clip filenames**: `{timestamp}_clip_master.m3u8` and `{timestamp}_clip_playlist.m3u8`
- **Master parsing**: `#EXT-X-STREAM-INF` tag followed by URI line (handles all rendition naming styles)
- **Lambda runtime**: `nodejs24.x` — AWS SDK v3 included, no package.json needed
