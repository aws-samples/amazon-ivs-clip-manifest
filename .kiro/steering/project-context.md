---
inclusion: always
name: project-context
description: Project architecture, commands, and technical context for the Amazon IVS Manifest Clipping Solution
---

# Project Context

## Overview

Amazon IVS Manifest Clipping Solution — creates video clips from Amazon IVS recordings without video re-encoding through HLS manifest manipulation. Supports standard IVS Low-Latency recordings.

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
npm run deploy          # Interactive wizard (6 options)
npm run cleanup         # Removes all deployed CloudFormation stacks
npm run export-config   # Exports stack outputs to UI config.json
```

## Architecture

npm workspace monorepo: root (clipping library + deployment tooling) + `manifest-clip-ui` (React frontend).

### Core Clipping Library (`lib/`)

Pure JS library — parses HLS manifests, filters segments by PDT timestamps, generates clipped manifests.

- `parser.js` — Master manifest parsing, media playlist parsing with PDT extraction
- `clipper.js` — PDT-based segment filtering, manifest generation, master rewriting
- `validation.js` — Input validation (required fields, numeric types, time range)

### Serverless Backend (`serverless/`)

SAM template with three Lambda functions behind API Gateway:
- `POST /clipmanifest` — Creates a clip
- `GET /getrecordings` — Lists IVS recordings from S3
- `GET /getclips` — Lists previously created clips

Also: S3 bucket, CloudFront (regional endpoint), IVS channel + recording config, sample colorbar upload.

### Standalone API (`standalone-api/`)

Minimal SAM deployment with only `POST /clipmanifest`. Separate stack for integration use cases.

### React Frontend (`manifest-clip-ui/`)

Vite 8 + React 19. Config resolution: `VITE_*` env vars → `config.json` → `config.example.json`.

### Deployment Tooling (root)

- `install.js` — Interactive wizard (6 deployment options)
- `cleanup.js` — Deletes tracked stacks (empties S3 buckets first)
- `mock-server.js` — Express mock API
- `export-config.js` — Stack outputs → `config.json`

## Config Bridge (Backend → Frontend)

1. `install.js` / `export-config.js` runs `aws cloudformation describe-stacks --query 'Stacks[].Outputs'`
2. Writes JSON to `manifest-clip-ui/src/config.json`
3. Vite app reads via `import.meta.glob` and maps `OutputKey` → `OutputValue`

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

Response: Array with `execution`, `path`, `bucket`, `clip_master`, `master_url` fields.

## Key Technical Concepts

- **PDT-based clipping**: Segments filtered by `#EXT-X-PROGRAM-DATE-TIME` vs requested time range
- **Byte-range mode**: Uses `byte-range-multivariant.m3u8` and preserves `#EXT-X-BYTERANGE` tags
- **Clip filenames**: `{timestamp}_clip_master.m3u8` and `{timestamp}_clip_playlist.m3u8`
- **CloudFront origin**: Must use `RegionalDomainName` (not `DomainName`) for non-us-east-1 buckets
- **Lambda runtime**: `nodejs24.x` — AWS SDK v3 included, no package.json needed
