---
description: Files and directories that should not be modified without explicit user approval
---

# Protected Files

## Do Not Modify Without Asking

- `package.json` — version bumps or workspace changes require user approval.
- `serverless/template.yaml` — IVS channel and recording configuration changes can break existing recordings.
- `.claude/steering/` — private configuration, never commit or reference contents.

## Do Not Delete

- `sample-colorbar/` — test fixture used by deployments (CloudFormation custom resource).
- `lib/` — shared library; changes here affect all stacks simultaneously.
- `.deployed-resources.json` — tracks active CloudFormation stacks for cleanup.

## Sensitive Files (Never Commit)

- `.env`, `.env.*` — environment variables with secrets.
- `manifest-clip-ui/src/config.json` — generated from CloudFormation outputs, contains account-specific endpoints.
- `*/tests/test.conf` — real API endpoints and credentials for integration tests.
- `.claude/steering/` — private agent configuration (AWS profiles, account IDs).
