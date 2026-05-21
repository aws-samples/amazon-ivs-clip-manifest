---
inclusion: fileMatch
fileMatchPattern: '**/*.{js,jsx,ts,tsx,css}'
name: code-style
description: Code style and conventions for JavaScript, React, and Lambda code
---

# Code Style

## JavaScript (lib/, Lambda handlers)

- Use `'use strict'` in all Node.js files.
- Prefer `const`; use `let` only when reassignment is needed.
- Single quotes for strings.
- 2-space indentation.
- Semicolons in lib/ and Lambda code.
- Error objects for API responses: `Object.assign(new Error(msg), { statusCode: N })`.

## React (manifest-clip-ui/)

- Functional components only.
- CSS files per component in `src/components/styles/`.
- API calls in `src/components/apis/` as separate modules.
- Use Video.js for VOD playback.
- JSX files use `.jsx` extension.

## File Organization

- Shared clipping logic lives in `lib/` only — Lambdas import via relative path.
- Each SAM stack is self-contained: `template.yaml` + `samconfig.toml` in its directory.
- Test fixtures go in `sample-*/` directories with upload Lambdas (CloudFormation custom resources).

## License Headers

All source files must include:
```
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
```
