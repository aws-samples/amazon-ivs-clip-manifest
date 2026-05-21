# .claude/ — AI Agent Configuration

This directory contains configuration files for [Claude Code](https://claude.ai/code), Anthropic's AI coding assistant CLI. These files guide Claude's behavior when working in this repository.

## Structure

```
.claude/
├── README.md              ← You are here
├── CLAUDE.md              ← Project context (architecture, commands, technical details)
├── rules/                 ← Behavioral rules (scoped by topic or file path)
│   ├── code-style.md      — Code conventions and patterns
│   ├── deployments.md     — SAM/AWS deployment procedures
│   ├── error-handling.md  — How to handle failures and retries
│   └── protected-files.md — Files that require approval before modifying
├── steering/              ← PRIVATE (gitignored) — personal/account-specific config
└── settings.local.json    ← PRIVATE (gitignored) — local permission settings
```

## What's Committed vs Private

| Path | Committed | Purpose |
|------|-----------|---------|
| `CLAUDE.md` | Yes | Project architecture and commands |
| `rules/*.md` | Yes | Shared team rules for agent behavior |
| `README.md` | Yes | This file |
| `steering/` | No | Private config (AWS profiles, account IDs) |
| `settings.local.json` | No | Personal permission allowlists |
| `plans/` | No | Temporary implementation plans |

## How It Works

When Claude Code starts a session in this repo:
1. **CLAUDE.md** loads automatically — gives Claude context about the project
2. **rules/*.md** load based on relevance — guide behavior for specific tasks
3. **steering/** (if present) loads privately — account-specific info like AWS profiles

## For Team Members

If you use Claude Code on this project:
- The committed files (`CLAUDE.md`, `rules/`) apply automatically
- Create your own `steering/` directory for private config (it's gitignored):
  ```bash
  mkdir -p .claude/steering
  echo '---\ninclusion: always\n---\n\n# AWS Profile\nexport AWS_PROFILE=your-profile' > .claude/steering/aws-profile.md
  ```

## For Other AI Tools

These files are Claude Code-specific. For other tools:
- **Cursor** — use `.cursorrules` at project root
- **GitHub Copilot** — use `.github/copilot-instructions.md`
- The rules content here can be adapted to those formats

## Writing Rules

Rules use markdown with optional YAML frontmatter for path scoping:

```markdown
---
description: Brief description of what this rule covers
paths:
  - "src/**/*.js"
  - "lib/**"
---

# Rule Title

- Bullet points with clear directives
- Use "Do" / "Do not" language
```

See [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code) for full reference.
