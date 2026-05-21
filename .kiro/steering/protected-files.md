---
inclusion: always
name: protected-files
description: Files that should not be modified or deleted without explicit user approval
---

# Protected Files

## Do Not Modify Without Asking

- `package.json` — version bumps or workspace changes require user approval.
- `serverless/template.yaml` — IVS channel and recording config changes can break existing recordings.
- `lib/` — shared library; changes affect all stacks simultaneously.

## Do Not Delete

- `sample-colorbar/` — test fixture used by deployments (CloudFormation custom resource).
- `lib/` — shared clipping library.
- `.deployed-resources.json` — tracks active CloudFormation stacks for cleanup.

## Sensitive Files (Never Commit)

- `.env`, `.env.*` — environment variables with secrets.
- `manifest-clip-ui/src/config.json` — generated from CloudFormation outputs, contains account-specific endpoints.
- `*/tests/test.conf` — real API endpoints for integration tests.
- `.kiro/steering/` private files — personal agent configuration.
