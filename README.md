# Amazon IVS Manifest Clipping Solution

The Amazon IVS manifest clipping solution provides a reference implementation demonstrating how to create video clips from live stream recordings without video re-encoding. This solution leverages HTTP Live Streaming (HLS) [Program-Date-Time (PDT) tags](https://datatracker.ietf.org/doc/html/rfc8216#section-4.3.2.6) and [HLS byte-range requests](https://datatracker.ietf.org/doc/html/rfc8216#section-4.3.2.2) to efficiently extract video segments from recordings stored on [Amazon Simple Storage Service (Amazon S3)](https://aws.amazon.com/s3/).

Supports both [Amazon IVS Low-Latency](https://aws.amazon.com/ivs/) recordings ([Auto-Record to S3](https://docs.aws.amazon.com/ivs/latest/userguide/record-to-s3.html)) and [Amazon IVS Real-Time](https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/what-is.html) recordings ([Composite Recording](https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/rt-composite-recording.html) and [Individual Participant Recording](https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/rt-individual-participant-recording.html)).

Deployed using [AWS SAM](https://aws.amazon.com/serverless/sam/) on serverless infrastructure, this approach delivers fast, cost-effective clipping while preserving original video quality through HLS manifest manipulation.

**Key Benefits:**
- **Zero Transcoding** - No video processing required, preserving quality and reducing costs
- **Fast Processing** - Clips generated in seconds through manifest manipulation
- **Serverless Architecture** - Auto-scaling, pay-per-use infrastructure
- **Frame Accuracy** - Precise timing using HLS Program-Date-Time tags
- **Multi-Format Support** - Works with IVS Low-Latency (MPEG-TS) and Real-Time (fMP4 + MPEG-TS) recordings

<img src="/docs/UI-Sample-Clip.png" width=100%>

## Quick Start (No AWS Required)

Run the UI locally with mock data — no AWS account needed:

```bash
git clone https://github.com/aws-samples/amazon-ivs-clip-manifest.git
cd amazon-ivs-clip-manifest
npm install
npm run dev:mock
```

This starts a mock API server on port 3001 and the React UI on port 3000 with sample recordings.

## Deploy to AWS

**Prerequisites:**
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed
- [Node.js](https://nodejs.org/) installed

**Interactive Installation:**
```bash
npm install
npm run deploy
```

Select your deployment option:
1. **Local Development (Mock + UI)** - No AWS needed, runs with sample data
2. **Deploy Backend APIs (Full Solution)** - Complete serverless backend with IVS Channel
3. **Start Local UI (Connected to AWS)** - Run React UI locally (requires backend deployed)
4. **Deploy Standalone API Only** - Just the clipping API (no UI support)
5. **Deploy UI to Cloud** - Host the React UI on CloudFront (public access)
6. **Full Solution (Backend + Local UI)** - Deploy backend with IVS channel and start local UI
7. **Deploy Real-Time Recorder** - IVS Real-Time Stage with recording infrastructure

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev:mock` | Start mock server + React UI (no AWS needed) |
| `npm run dev` | Start React UI only (needs backend or mock running) |
| `npm run mock` | Start mock API server only |
| `npm run deploy` | Interactive AWS deployment wizard |
| `npm run build` | Production build of the React UI |
| `npm run cleanup` | Remove all deployed AWS resources |

## Quick Navigation

- **[Serverless Backend](./serverless/README.md)** - Architecture & API documentation
- **[Standalone API](./standalone-api/README.md)** - API-only deployment & integration
- **[Frontend UI](./manifest-clip-ui/README.md)** - React application & components
- **[Real-Time Recorder](./realtime-recorder/README.md)** - IVS Real-Time recording infrastructure
- **[UI Deployment](./manifest-clip-ui/public-deploy/README.md)** - Public hosting setup
- **[Release Notes](./RELEASE_NOTES.md)** - Latest updates & improvements

## What Gets Deployed

**Backend Services:**
- **ClipManifest API** - Creates clips using HLS manifest manipulation
- **GetRecordings API** - Lists available IVS recordings (standard + Real-Time)
- **GetClips API** - Retrieves created clips
- **S3 + CloudFront** - Storage and CDN
- **IVS Channel** - Automatically configured with recording

**Real-Time Recorder (Option 7):**
- **IVS Real-Time Stage** - With auto participant recording
- **IVS Encoder + Storage Configuration** - For composite recording
- **Token API** - Creates participant tokens to join the stage
- **Composition API** - Start/stop composite recordings

**Frontend Application:**
- **React UI** - Video player, clip management, and RT Publisher
- **Clip Editor** - Visual timeline for clip creation
- **RT Publisher** - Join IVS Real-Time stages and trigger recordings

## Supported Recording Formats

The clipping API (`POST /clipmanifest`) supports all IVS recording formats through a single unified endpoint:

| Format | Source | Master Manifest | Segments | Clipping Method |
|--------|--------|----------------|----------|-----------------|
| **IVS Low-Latency** | Auto-Record to S3 | `master.m3u8` | MPEG-TS (`.ts`) | PDT-based |
| **IVS RT Composite** | StartComposition API | `multivariant.m3u8` | MPEG-TS (`.ts`) | Offset-based |
| **IVS RT Individual** | Auto (on publish) | `multivariant.m3u8` | fMP4 (`.mp4`) + init segments | PDT-based |

### API Usage

```bash
# Clip a standard IVS recording
curl -X POST https://<api>/clipmanifest/ \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": 10,
    "end_time": 30,
    "master_url": "https://<cloudfront>/path/master.m3u8",
    "byte_range": false
  }'

# Clip a Real-Time recording (same endpoint, same contract)
curl -X POST https://<api>/clipmanifest/ \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": 10,
    "end_time": 30,
    "master_url": "https://<cloudfront>/path/multivariant.m3u8",
    "byte_range": false
  }'
```

## Technical Details

### How Clipping Works

**1. HLS Program-Date-Time (PDT) Tags**
Amazon IVS inserts PDT tags in HLS manifests, providing wall-clock timestamps for each segment:
```m3u8
#EXT-X-PROGRAM-DATE-TIME:2024-01-15T10:30:00.000Z
#EXTINF:2.000,
segment001.ts
```

**2. Byte-Range Manifest Clipping**
For low-latency recordings, the solution can create manifests referencing specific byte ranges:
```m3u8
#EXT-X-BYTERANGE:1024000@2048000
segment001.ts
```

**3. fMP4 Init Segment Handling (Real-Time)**
For RT individual recordings using fMP4, the clipper preserves initialization segments:
```m3u8
#EXT-X-MAP:URI="init-0.mp4"
#EXT-X-PROGRAM-DATE-TIME:2026-05-21T10:58:08.490Z
#EXTINF:5.18055,
0.mp4
```

**4. Offset-Based Clipping (RT Composite)**
For composite recordings without PDT tags, segments are selected by cumulative time offset.

### Clip Generation Process
1. Parse master/multivariant manifest for rendition URIs
2. Fetch media playlist for the first rendition
3. Filter segments by time range (PDT-based or offset-based)
4. Generate new playlist with filtered segments (preserving init segments, discontinuity markers)
5. Rewrite master manifest to point to clip playlist
6. Write clip manifests to S3

## IVS Real-Time Recording

To produce recordings from IVS Real-Time stages:

1. Deploy the Real-Time Recorder: `npm run deploy` → option 7
2. Open the UI and navigate to **RT Publisher**
3. Click **Join & Publish** to start streaming (individual recording starts automatically)
4. Click **Start Composition** for a composite recording
5. After stopping, recordings appear in the **Clip Editor** dropdown

See [realtime-recorder/README.md](./realtime-recorder/README.md) for detailed setup.

## AI-Assisted Development

This repository includes configuration for AI coding agents to deploy, test, and iterate on the solution autonomously:

- **`.claude/`** — [Claude Code](https://claude.ai/code) project context and behavioral rules
- **`.kiro/`** — [Kiro](https://kiro.dev) steering files for project context and conventions

Agents can run the full deployment workflow (`npm run deploy`), create recordings via the RT Publisher, and test the clipping API end-to-end. See [.claude/README.md](.claude/README.md) for details on the instruction format.

## Security Note

**This is a reference solution** - The APIs are deployed without authentication for demonstration purposes. For production use, consider adding:
- API Gateway API Keys
- AWS Cognito authentication
- IAM-based access control
- VPC deployment for internal access

## Cleanup

Remove all deployed resources:
```bash
npm run cleanup
```

## Contributing guidelines
See [CONTRIBUTING](CONTRIBUTING.md) for more information.

## License
This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.


## About Amazon IVS
* Amazon Interactive Video Service (Amazon IVS) is a managed live streaming solution that is quick and easy to set up, and ideal for creating interactive video experiences. [Learn more](https://aws.amazon.com/ivs/).
* [Amazon IVS docs](https://docs.aws.amazon.com/ivs/)
* [User Guide](https://docs.aws.amazon.com/ivs/latest/userguide/)
* [Real-Time User Guide](https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/what-is.html)
* [API Reference](https://docs.aws.amazon.com/ivs/latest/APIReference/)
* [Learn more about Amazon IVS on IVS.rocks](https://ivs.rocks/)
* [View more demos like this](https://ivs.rocks/examples)
