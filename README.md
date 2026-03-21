# Amazon IVS Manifest Clipping Solution

The Amazon IVS manifest clipping solution provides a reference implementation demonstrating how to create video clips from live stream recordings without video re-encoding. This solution leverages HTTP Live Streaming (HLS) [Program-Date-Time (PDT) tags](https://datatracker.ietf.org/doc/html/rfc8216#section-4.3.2.6) and [HLS byte-range requests](https://datatracker.ietf.org/doc/html/rfc8216#section-4.3.2.2) to efficiently extract video segments from recordings stored on [Amazon Simple Storage Service (Amazon S3)](https://aws.amazon.com/s3/) using [Amazon IVS Auto-Record to S3](https://docs.aws.amazon.com/ivs/latest/userguide/record-to-s3.html).

This serverless solution leverages [Amazon IVS](https://aws.amazon.com/ivs/) HLS recordings with automatic PDT tags and byte-range support to enable precise video clipping. The frontend UI uses [React.js](https://reactjs.org/) with [Amazon IVS Player SDK](https://docs.aws.amazon.com/ivs/latest/userguide/player.html) and [Video.js](https://videojs.com/) for clip management and playback.

Deployed using [AWS SAM](https://aws.amazon.com/serverless/sam/) on serverless infrastructure, this approach delivers fast, cost-effective clipping while preserving original video quality through HLS manifest manipulation.

**Key Benefits:**
- **Zero Transcoding** - No video processing required, preserving quality and reducing costs
- **Fast Processing** - Clips generated in seconds through manifest manipulation
- **Serverless Architecture** - Auto-scaling, pay-per-use infrastructure
- **Frame Accuracy** - Precise timing using HLS Program-Date-Time tags

<img src="/docs/UI-Sample-Clip.png" width=100%>

## 🚀 Quick Start (No AWS Required)

Run the UI locally with mock data — no AWS account needed:

```bash
git clone https://github.com/aws-samples/amazon-ivs-clip-manifest.git
cd amazon-ivs-clip-manifest
npm install
npm run dev:mock
```

This starts a mock API server on port 3001 and the React UI on port 3000 with sample recordings.

## ☁️ Deploy to AWS

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

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev:mock` | Start mock server + React UI (no AWS needed) |
| `npm run dev` | Start React UI only (needs backend or mock running) |
| `npm run mock` | Start mock API server only |
| `npm run deploy` | Interactive AWS deployment wizard |
| `npm run build` | Production build of the React UI |
| `npm run cleanup` | Remove all deployed AWS resources |

## 🧭 Quick Navigation

- **[📦 Serverless Backend](./serverless/README.md)** - Architecture & API documentation
- **[🔧 Standalone API](./standalone-api/README.md)** - API-only deployment & integration
- **[⚛️ Frontend UI](./manifest-clip-ui/README.md)** - React application & components
- **[🎨 UI Deployment](./manifest-clip-ui/public-deploy/README.md)** - Public hosting setup
- **[📋 Release Notes](./RELEASE_NOTES.md)** - Latest updates & improvements

## 📋 What Gets Deployed

**Backend Services:**
- 🔧 **ClipManifest API** - Creates clips using HLS manifest manipulation
- 📁 **GetRecordings API** - Lists available IVS recordings
- 📋 **GetClips API** - Retrieves created clips
- ☁️ **S3 + CloudFront** - Storage and CDN
- 📺 **IVS Channel** - Automatically configured with recording

**Frontend Application:**
- ⚛️ **React UI** - Video player and clip management
- 🎥 **Amazon IVS Player** - Optimized video playback
- ✂️ **Clip Controls** - Visual timeline for clip creation
- 🔗 **Auto-configured APIs** - Endpoints extracted from deployment

## 🔧 Technical Details

**Manifest Clipping Technology:**
- **HLS Program-Date-Time (PDT) Tags** - Precise timestamp mapping for clip boundaries
- **Byte-Range Requests** - Efficient segment extraction without re-encoding
- **M3U8 Manipulation** - Dynamic playlist generation for clipped content
- **Zero Transcoding** - Fast, cost-effective clipping using existing segments

### How It Works

**1. HLS Program-Date-Time (PDT) Tags**
Amazon IVS automatically inserts PDT tags in HLS manifests, providing wall-clock timestamps for each segment:
```m3u8
#EXT-X-PROGRAM-DATE-TIME:2024-01-15T10:30:00.000Z
#EXTINF:2.000,
segment001.ts
```

**2. Byte-Range Manifest Clipping**
Instead of re-encoding video, the solution creates new manifests referencing specific byte ranges:
```m3u8
#EXT-X-BYTERANGE:1024000@2048000
segment001.ts
```

**3. Clip Generation Process**
- Parse original manifest for PDT timestamps
- Calculate segment boundaries for desired time range
- Generate new manifest with filtered segments
- Preserve original video quality and encoding

The solution leverages HLS manifest files to create clips by referencing specific byte ranges and PDT timestamps, eliminating the need for video processing while maintaining frame-accurate timing.

## ⚠️ Security Note

**This is a reference solution** - The APIs are deployed without authentication for demonstration purposes. For production use, consider adding:
- API Gateway API Keys
- AWS Cognito authentication
- IAM-based access control
- VPC deployment for internal access

## 🧹 Cleanup

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
* [API Reference](https://docs.aws.amazon.com/ivs/latest/APIReference/)
* [Learn more about Amazon IVS on IVS.rocks](https://ivs.rocks/)
* [View more demos like this](https://ivs.rocks/examples)
