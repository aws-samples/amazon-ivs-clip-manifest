---
description: How to handle errors, failures, and stalling during development tasks
---

# Error Handling & Recovery

## Build/Deploy Failures

- On first failure: read the error message and logs carefully before retrying.
- Check CloudFormation stack events (`aws cloudformation describe-stack-events`) for deploy failures — the root cause is usually buried in the event list.
- For IAM permission errors: inspect the actual role policy (`aws iam get-role-policy`) before broadening permissions. Prefer least-privilege fixes over wildcards.
- For S3 bucket conflicts: check if the bucket already exists from a previous stack. CloudFormation won't create a bucket that already exists.
- For IVS Real-Time APIs: both `ivs:` and `ivsrealtime:` IAM action prefixes may be required.

## Retry Strategy

- Retry up to 2 times for transient errors (network timeouts, IAM propagation delays, eventual consistency).
- If the same error persists after 2 retries, stop and ask the user — do not loop.
- IAM policy changes can take up to 60 seconds to propagate. If a permission error occurs immediately after an IAM update, wait and retry once.

## When to Ask the User

- After 2 failed retries with the same error.
- Before any destructive operation (deleting resources, force-pushing, resetting).
- When the error suggests a fundamental design issue (wrong approach, missing prerequisites).
- When you need AWS credentials or account-specific information.

## What NOT to Do

- Do not add broad `*` IAM permissions as a first response. Diagnose the specific action needed.
- Do not delete and recreate CloudFormation stacks as a first response to update failures.
- Do not ignore CloudFormation rollback states — wait for rollback to complete, then delete the stack before redeploying.
- Do not use `--force`, `--no-verify`, or skip safety checks to work around errors.
