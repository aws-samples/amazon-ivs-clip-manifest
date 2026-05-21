---
description: Code style and conventions for this repository
---

# Code Style

## JavaScript

- Use `'use strict'` in all Node.js files (Lambda handlers, lib/).
- Prefer `const`; use `let` only when reassignment is needed.
- Use single quotes for strings.
- 2-space indentation.
- No semicolons in React components (manifest-clip-ui/); use semicolons in lib/ and Lambda code.
- Error objects for API responses use `Object.assign(new Error(msg), { statusCode: N })` pattern.

## React (manifest-clip-ui/)

- Functional components only.
- CSS files per component in `src/components/styles/`.
- API calls in `src/components/apis/` as separate modules.
- Use Video.js for playback (not the IVS Player SDK for recorded VOD content).

## File Organization

- Shared clipping logic lives in `lib/` only — Lambdas import via relative path.
- Each SAM stack is self-contained in its own directory with template.yaml + samconfig.toml.
- Test fixtures go in `sample-*/` directories with upload Lambdas (CloudFormation custom resources).

## License Headers

All source files must include:
```
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
```
