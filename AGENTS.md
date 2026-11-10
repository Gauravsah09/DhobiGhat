<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git Workflow Rules
- **CRITICAL / MANDATORY**: ALWAYS obtain explicit user permission before executing any `git push` command to `origin/main` or any remote branch. Never push changes automatically.

## UI Security & Credential Rules
- **ZERO CREDENTIAL LEAKAGE IN UI**: Never expose passwords, PINs, secret keys, default credential hints, or autofill buttons on any screen (Customer, Store, or Admin app). Real-world production enterprise standards must be strictly enforced: no "Use default (pwd)" buttons, no "Default pwd: ..." labels, and no credential cheat sheets on user interfaces.

