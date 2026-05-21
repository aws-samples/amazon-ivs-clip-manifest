---
inclusion: fileMatch
fileMatchPattern: '**/template.yaml,**/samconfig.toml,install.js,cleanup.js,export-config.js'
name: deployments
description: SAM/AWS deployment procedures, stack management, and Lambda runtime rules
---

# Deployment Rules

## SAM Deployments

- Always run `sam build` before `sam deploy` in the target directory.
- Use `--no-confirm-changeset` only for iterative development, never for production.
- Use `--resolve-s3` to auto-manage the SAM artifacts bucket.
- Always include `--capabilities CAPABILITY_IAM` for stacks with IAM roles.
- Track deployed stacks in `.deployed-resources.json` via the `trackStack()` helper in install.js.

## Stack Naming

- Default stack names: `clip-manifest-ui` (serverless), `ivs-clip-standalone` (standalone).
- Stack names must match regex: `/^[a-zA-Z0-9-]+$/`.

## CloudFormation Failures

- If a stack is in `ROLLBACK_COMPLETE` state, it must be deleted before redeploying.
- If a stack is in `ROLLBACK_IN_PROGRESS`, wait for completion before taking action.
- S3 buckets must be emptied before stack deletion — the cleanup.js script handles this.

## Lambda Runtime

- Use `nodejs24.x` for all Lambda functions.
- AWS SDK v3 is included in the runtime — no need for package.json dependencies.
- Requires SAM CLI >= 1.156.0.

## CloudFront Origins

- Always use `!GetAtt Bucket.RegionalDomainName` (not `DomainName`) for S3 origins.
- `DomainName` causes TemporaryRedirect for buckets outside us-east-1.
