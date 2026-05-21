# Release Notes

## Version 1.4.0 - IVS Real-Time Recording Support

### IVS Real-Time Clipping

The clipping solution now supports Amazon IVS Real-Time recordings alongside the existing low-latency support. A single `POST /clipmanifest` endpoint handles all recording formats transparently.

**Supported formats:**

| Format | Master Manifest | Segments | Clipping Method |
|--------|----------------|----------|-----------------|
| IVS Low-Latency | `master.m3u8` | MPEG-TS (`.ts`) | PDT per segment |
| RT Composite | `multivariant.m3u8` | MPEG-TS (`.ts`) | Offset-based |
| RT Individual | `multivariant.m3u8` | fMP4 (`.mp4`) + init segments | PDT + cumulative |

### Real-Time Recorder Stack (`realtime-recorder/`)

New minimal SAM deployment (option 7 in the install wizard) for producing IVS Real-Time recordings:

- IVS Real-Time Stage with auto participant recording
- Storage + Encoder configuration for composite recording
- `GET /token` — create participant tokens to join the stage
- `POST /composition/start` and `POST /composition/stop` — composite recording control
- S3 bucket + CloudFront for playback

### Parser & Clipper Enhancements (`lib/`)

- `parseMaster()` — now parses `#EXT-X-STREAM-INF` tags properly instead of relying on filename regex. Handles all rendition naming styles (`720p30/`, `720p30-hash/`, `high/`).
- `parsePlaylistWithPDT()` — supports `#EXT-X-MAP` init segments (fMP4), single-PDT-at-start playlists with computed per-segment timestamps, and playlists with no PDT at all.
- `clipPlaylistByPDT()` — uses PDT-based filtering when available, falls back to offset-based (cumulative duration) for playlists without PDT tags.
- `createPlaylistManifest()` — emits `#EXT-X-MAP` tags for fMP4 clips, uses HLS version 7 when init segments are present, preserves all discontinuity markers.
- `rewriteMaster()` — uses full URI replacement for rendition paths (handles nested/hash-suffixed paths).

### UI Updates

- **RT Publisher page** (`/rt-publisher`) — join an IVS Real-Time stage, publish video, and start/stop composite recordings directly from the browser.
- **Recording discovery** — `GET /getrecordings` now lists both standard and Real-Time recordings with `[RT Composite]` / `[RT Individual]` labels.
- **IVS Channel Info** — updated to show both Low-Latency channel details and Real-Time stage information.
- **Navigation** — top navbar with "Clip Editor" and "Real-Time Publisher" links.

### Lambda Path Fix

- `clipmanifest` Lambda now uses `lastIndexOf('/')` for path extraction instead of hardcoded `replace('/master.m3u8', '')`, supporting both `master.m3u8` and `multivariant.m3u8` URLs.

### AI Agent Configuration

- Added `.claude/rules/` with shared behavioral rules (error handling, deployments, code style, protected files).
- Added `.claude/README.md` explaining the agent configuration for contributors.
- Updated `.kiro/steering/` files to reflect Real-Time support.
- Updated `.gitignore` to track shared `.claude/` config while ignoring private settings.

---

## Version 1.3.0 - Testing Infrastructure & Runtime Upgrade

### 🧪 Integration Test Suites

Added curl-based integration tests for both deployment modes, with auto-configuration from CloudFormation outputs:

- `standalone-api/tests/` — 4 tests covering validation and clip creation
- `serverless/tests/` — 8 tests covering all 3 APIs (getrecordings, getclips, clipmanifest)
- `setup.sh` scripts fetch CFN outputs and write `test.conf` automatically
- `test.conf.example` templates committed; real configs gitignored

### 🎨 Sample Colorbar HLS Recording

SMPTE color bar test fixture (12s, 720p, 6 segments with PDT tags) generated via ffmpeg and committed to `sample-colorbar/`. Enables end-to-end clip creation testing without a live IVS stream.

- Custom resource Lambda uploads fixtures to S3 at deploy time
- Cleans up on stack delete
- Added to both standalone and serverless SAM templates
- `SampleRecordingMasterURL` output auto-populates test config

### ⬆️ Runtime Upgrade

- Lambda runtime upgraded from `nodejs22.x` to `nodejs24.x` (both templates)
- Requires SAM CLI >= 1.156.0

### 🔒 Migrate Frontend from CRA to Vite

Replaced `react-scripts@5.0.1` (unmaintained since April 2022) with Vite 8, eliminating all 27 security vulnerabilities locked behind CRA's transitive dependencies.

- 27 vulnerabilities → 0
- 1,348 packages → 148
- Build time: ~10s → ~300ms
- `REACT_APP_*` env vars → `VITE_*` (`import.meta.env`)
- `require()` config loading → `import.meta.glob` (gracefully handles missing `config.json`)
- `.js` → `.jsx` for all files containing JSX
- `index.html` moved to project root (Vite convention)
- Output dir remains `build/` for deploy compatibility
- `install.js` config bridge verified — no changes needed

---

## Version 1.2.0 - Developer Experience & Core Library Extraction

### 🚀 Zero-AWS Quick Start

New developers can now run the full UI locally in ~30 seconds:

```bash
npm install
npm run dev:mock
```

- Added mock API server (`mock-server.js`) serving all 3 endpoints + HLS manifests
- Added `config.example.json` with graceful fallback — UI no longer crashes without `config.json`
- Added `.env.example` with `REACT_APP_*` env var overrides for the UI
- Added npm workspaces for single-command dependency installation

### 📦 Shared Library Extraction (`lib/`)

Extracted pure HLS manifest clipping logic from Lambda handlers into `lib/` — a vendor-agnostic module with zero dependencies. Both `serverless/` and `standalone-api/` Lambdas now import from the shared library, eliminating code duplication.

- `lib/parser.js` — M3U8 master + media playlist parsing
- `lib/clipper.js` — PDT-based time-range filtering, manifest generation
- `lib/validation.js` — Input validation

### 🐛 Clipping Bug Fixes

- **Multi-rendition corruption**: Master manifest now rewrites each rendition filename individually instead of a global regex on the first filename
- **Crash on empty segments**: Proper error when playlist has no PDT tags instead of TypeError on `segments[0]`
- **Byte-range parsing**: Scans forward for EXTINF/BYTERANGE/URI tags instead of assuming hardcoded line offsets
- **Discontinuity tags dropped**: `#EXT-X-DISCONTINUITY` markers are now preserved in clipped manifests
- **Empty clip result**: Returns a 400 error instead of an unplayable empty manifest
- **1080p+ renditions ignored**: Regex now matches 4-digit resolutions (`{1,4}` instead of `{1,3}`)

### 🔧 Installer Improvements

- Pre-flight checks for `aws`, `sam`, `node` with detected account/region display
- Single wizard flow — no more nested `sam deploy --guided` inside inquirer prompts
- All deployed stacks now tracked for cleanup (backend deploy was previously untracked)
- "Local Development" option added as menu item 1 (no AWS needed)
- Removed dead `createIVSChannel()` function
- All commands use `cwd` option instead of `process.chdir()` — no more broken state on errors

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev:mock` | Mock server + React UI (no AWS needed) |
| `npm run dev` | React UI only |
| `npm run mock` | Mock API server only |
| `npm run deploy` | Interactive AWS deployment |
| `npm run build` | Production build |
| `npm run cleanup` | Remove deployed AWS resources |

---

## Version 1.1.0 - UI Enhancements & Configuration Improvements

### 🎨 User Interface Improvements

**Video Player Enhancements**
- Added rounded corners to video elements for modern appearance
- Removed black background from video player containers
- Enhanced glassmorphism effects with improved shadows and blur

**Clip Modal Player**
- Redesigned modal positioning for better accessibility
- Removed unnecessary container styling around video player
- Fixed modal overlay to allow page scrolling
- Simplified modal structure for cleaner presentation

**Progress Bar & Timeline Controls**
- Completely redesigned clip timeline interface
- Separated progress track from markers for better visual clarity
- Added color-coded start (green) and end (red) markers
- Improved marker positioning and labeling
- Removed slider thumb for cleaner progress indication
- Enhanced progress fill visualization

### 🔧 Configuration & Setup

**IVS Channel Integration**
- Added automatic IVS channel information display in UI
- Implemented OBS-compatible streaming configuration format
- Added server URL and stream key fields with copy functionality
- Integrated stream key masking with show/hide toggle
- Fixed configuration loading from deployment outputs

**Installation Process**
- Enhanced interactive installer with better resource tracking
- Improved configuration file handling during deployment
- Streamlined API endpoint extraction from CloudFormation

### 🐛 Bug Fixes

**UI Stability**
- Fixed error handling for empty data states in components
- Resolved array mapping crashes when data is undefined
- Improved component rendering with proper null checks

**Modal & Navigation**
- Fixed modal positioning issues that prevented user interaction
- Resolved scroll blocking when clip modal is open
- Improved modal accessibility and keyboard navigation

### 📋 Technical Details

**Component Updates**
- `IVSChannelInfo`: New component for displaying channel configuration
- `ClipPlayerModal`: Simplified structure and improved positioning
- `ClipControls`: Complete redesign of timeline and progress controls
- `HomePage`: Enhanced configuration loading and error handling

**Styling Improvements**
- Updated CSS for modern glassmorphism effects
- Enhanced video player styling with rounded corners
- Improved responsive design for various screen sizes
- Added consistent color scheme across components

### 🚀 Getting Started

The enhanced UI provides a more intuitive experience for:
1. **Streaming Setup**: Easy copy-paste configuration for OBS
2. **Clip Creation**: Visual timeline with clear start/end markers  
3. **Video Playback**: Modern player with rounded corners and clean design
4. **Modal Interaction**: Improved accessibility and positioning

### 🔗 Links

- [Main Documentation](README.md)
- [Backend API Documentation](serverless/README.md)
- [Frontend Setup Guide](manifest-clip-ui/README.md)
