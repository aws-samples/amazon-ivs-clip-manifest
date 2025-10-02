# Amazon IVS Clip Manifest - Serverless Backend

Complete serverless solution with three APIs for managing IVS recordings and clips.

## 🏗️ Architecture

<img src="/doc/architecture.png" width=85%>

The solution uses AWS SAM to deploy a serverless architecture with:
- **AWS Lambda** - Serverless compute for API processing
- **API Gateway** - REST endpoints with CORS support
- **S3** - Storage for recordings and generated clips
- **CloudFront** - Global CDN for content delivery
- **IAM** - Secure access policies

## 📡 API Reference

### POST /clipmanifest
Creates video clips using HLS manifest manipulation.

**Request:**
```json
{
  "start_time": 1640995200,
  "end_time": 1640995260,
  "master_url": "https://domain.net/path/master.m3u8",
  "byte_range": true
}
```

**Response:**
```json
{
  "clip_url": "https://domain.net/clips/clip_123.m3u8",
  "duration": 60,
  "created_at": "2024-01-01T10:00:00Z"
}
```

### GET /getrecordings
Lists available IVS recordings from S3.

**Response:**
```json
{
  "recordings": [
    {
      "key": "ivs/v1/123/recording/2024/01/01/file.m3u8",
      "url": "https://domain.net/path/master.m3u8",
      "lastModified": "2024-01-01T10:00:00Z",
      "size": 1024000
    }
  ]
}
```

### GET /getclips
Retrieves created clips.

**Response:**
```json
{
  "clips": [
    {
      "key": "clips/clip_123.m3u8",
      "url": "https://domain.net/clips/clip_123.m3u8",
      "created": "2024-01-01T10:00:00Z"
    }
  ]
}
```

## 🔧 Technical Implementation

**Manifest Processing:**
- Parses HLS manifests for PDT timestamps
- Calculates segment boundaries using time ranges
- Generates new manifests with filtered segments
- Preserves original video quality (no transcoding)

**S3 Integration:**
- Automatic bucket creation with CORS configuration
- CloudFront OAI for secure access
- Organized folder structure for recordings and clips

**Lambda Functions:**
- Node.js 22.x runtime
- 128MB memory allocation
- 40-second timeout
- Environment variables for configuration

## 🚀 Deployment

Use the interactive installer from the project root:
```bash
npm run deploy
```

Select option 1: "Deploy Backend APIs (Full Solution)"

## 🔗 Related

- [Standalone API Only](../standalone-api/README.md)
- [Frontend UI](../manifest-clip-ui/README.md)
- [Main Documentation](../README.md)
