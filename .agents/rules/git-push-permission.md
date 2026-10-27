# Git Push Permission Rule

- **CRITICAL**: Never run `git push` to `origin/main` or any remote branch automatically.
- **MANDATORY**: You MUST always ask the user for explicit permission first, present a summary of the staged/committed changes, and only proceed when the user explicitly confirms (e.g. "yes", "push").
