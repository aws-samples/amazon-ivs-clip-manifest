# IVS Real-Time Recorder

Minimal infrastructure to produce IVS Real-Time recordings for the clipping solution. Deploys a Stage with auto-participant recording (individual) and APIs to start composite recordings.

## What Gets Deployed

- **IVS Real-Time Stage** — with auto-participant recording enabled
- **IVS Storage Configuration** — links S3 bucket to IVS
- **IVS Encoder Configuration** — 720p30 at 2.5Mbps (for composite)
- **S3 Bucket** — stores HLS recordings
- **CloudFront Distribution** — serves recordings for playback
- **GET /token** — creates participant tokens to join the stage
- **POST /composition/start** — starts a composite recording
- **POST /composition/stop** — stops a composite recording

## Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed

## Deploy

From the repo root:
```bash
npm run deploy  # Select option 7
```

Or manually:
```bash
cd realtime-recorder
sam build
sam deploy --guided
```

## Recording Types

### Individual Participant Recording (Automatic)

When a participant joins the stage and publishes, their stream is automatically recorded to S3:

```
s3://bucket/{stageId}/{sessionId}/{participantId}/{timestamp}/
  events/
    recording-started.json
    recording-ended.json
  media/
    hls/
      multivariant.m3u8
      high/
        playlist.m3u8
        0.mp4, 1.mp4, ...
```

### Composite Recording (Manual)

All stage participants composited into a single video:

```
s3://bucket/{stageId}/{compositionId}/composite/
  events/
    recording-started.json
    recording-ended.json
  media/
    hls/
      multivariant.m3u8
      720p30-{hash}/
        playlist.m3u8
        0.mp4, 1.mp4, ...
```

## Test Workflow

### 1. Get a participant token

```bash
curl "<TokenApiUrl>?userId=test-user"
```

### 2. Join the stage

Use the [IVS Real-Time Web Broadcast SDK](https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/broadcast.html) to join and publish video. You can use the [IVS Real-Time Web Sample](https://codepen.io/nicabar/pen/GRBJwXw) with the token from step 1.

### 3. Individual recording

Starts automatically when you publish. Check S3 after disconnecting:
```bash
aws s3 ls s3://<RecordingBucket>/ --recursive
```

### 4. Composite recording

While participants are publishing:
```bash
# Start
curl -X POST "<CompositionStartApiUrl>"
# Response: {"compositionArn": "arn:aws:ivs:...", "state": "STARTING"}

# Stream for 30+ seconds, then stop
curl -X POST "<CompositionStopApiUrl>" \
  -H "Content-Type: application/json" \
  -d '{"compositionArn": "arn:aws:ivs:..."}'
```

### 5. Inspect recordings

Wait ~60 seconds after stopping for finalization, then:
```bash
# List recording files
aws s3 ls s3://<RecordingBucket>/ --recursive

# Download manifests for inspection
aws s3 cp s3://<RecordingBucket>/<path>/media/hls/multivariant.m3u8 ./
aws s3 cp s3://<RecordingBucket>/<path>/media/hls/high/playlist.m3u8 ./

# Or access via CloudFront
curl "<CloudfrontDomain>/<path>/media/hls/multivariant.m3u8"
```

## Region Availability

IVS Real-Time is available in: `us-east-1`, `us-west-2`, `eu-west-1`, `ap-northeast-1`, `ap-south-1`.

## Cost Warning

Composite recordings incur cost while running. They auto-stop after 60 seconds with no publishers, but always stop them explicitly when done testing.

## Cleanup

```bash
npm run cleanup  # Removes all deployed stacks including this one
```
