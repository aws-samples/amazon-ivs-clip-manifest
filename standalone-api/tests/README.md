# Standalone API Tests

Curl-based integration tests for the ClipManifest standalone API.

## Setup

1. Deploy the standalone API stack (see [parent README](../README.md))
2. Run the setup script to fetch CloudFormation outputs:

```bash
cd standalone-api/tests
./setup.sh
```

This creates `test.conf` with your API endpoint, CloudFront domain, and S3 bucket.

3. Edit `test.conf` and set `MASTER_URL` to a real IVS recording in your bucket.

## Running Tests

```bash
./test-clipmanifest.sh
```

The script runs four tests:

| Test | Description | Expected |
|------|-------------|----------|
| 1 | Missing required fields | 400/500 |
| 2 | end_time <= start_time | 400/500 |
| 3 | Non-numeric times | 400/500 |
| 4 | Create clip from recording | 200 (requires real recording) |

Tests 1-3 validate error handling and work without a real recording.
Test 4 requires `MASTER_URL` pointing to an actual IVS recording in S3.

## Files

| File | Description |
|------|-------------|
| `setup.sh` | Fetches CFN outputs → writes `test.conf` |
| `test-clipmanifest.sh` | Curl-based test runner |
| `test.conf.example` | Template config (committed) |
| `test.conf` | Your local config (gitignored) |
