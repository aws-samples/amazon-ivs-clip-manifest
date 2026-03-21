# Serverless Backend API Tests

Curl-based integration tests for all three backend API endpoints.

## Setup

1. Deploy the serverless backend stack (see [parent README](../README.md))
2. Run the setup script to fetch CloudFormation outputs:

```bash
cd serverless/tests
./setup.sh
```

This creates `test.conf` with all API endpoints, CloudFront domain, and S3 bucket.
If the sample colorbar recording is deployed, `MASTER_URL` is auto-populated.

## Running Tests

```bash
./test-apis.sh
```

| Test | Endpoint | Description | Expected |
|------|----------|-------------|----------|
| 1 | GET /getrecordings | List recordings | 200 |
| 2 | GET /getclips | Missing vod param | 400/500 |
| 3 | GET /getclips?vod=test | Empty clips list | 200 |
| 4 | POST /clipmanifest | Missing fields | 400/500 |
| 5 | POST /clipmanifest | end <= start | 400/500 |
| 6 | POST /clipmanifest | Non-numeric times | 400/500 |
| 7 | POST /clipmanifest | Create clip | 200 |
| 8 | GET /getclips | Verify clip appears | 200 |

## Files

| File | Description |
|------|-------------|
| `setup.sh` | Fetches CFN outputs → writes `test.conf` |
| `test-apis.sh` | Curl-based test runner (8 tests) |
| `test.conf.example` | Template config (committed) |
| `test.conf` | Your local config (gitignored) |
