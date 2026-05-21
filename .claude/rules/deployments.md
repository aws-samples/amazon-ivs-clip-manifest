---
description: Rules for deploying AWS resources via SAM CLI
paths:
  - "serverless/**"
  - "standalone-api/**"
  - "realtime-recorder/**"
  - "install.js"
---

# Deployment Rules

## SAM Deployments

- Always run `sam build` before `sam deploy` in the target directory.
- Use `--no-confirm-changeset` only for iterative development, never for production.
- Use `--resolve-s3` to auto-manage the SAM artifacts bucket.
- Always include `--capabilities CAPABILITY_IAM` for stacks with IAM roles.
- Track deployed stacks in `.deployed-resources.json` via the `trackStack()` helper in install.js.

## Stack Naming

- Default stack names: `clip-manifest-ui` (serverless), `ivs-clip-standalone` (standalone), `ivs-rt-recorder` (realtime).
- Stack names must match regex: `/^[a-zA-Z0-9-]+$/`.

## CloudFormation Failures

- If a stack is in `ROLLBACK_COMPLETE` state, it must be deleted before redeploying.
- If a stack is in `ROLLBACK_IN_PROGRESS`, wait for completion before taking action.
- Check for orphaned resources (S3 buckets, IVS channels) from previous failed stacks before deploying.

## Lambda Runtime

- Use `nodejs24.x` for all Lambda functions.
- AWS SDK v3 is included in the runtime — no need for package.json dependencies for S3, IVS clients.
