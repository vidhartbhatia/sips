@AGENTS.md

# Claude Code notes

Everything project-specific is in `AGENTS.md` (shared with Codex/Copilot). This file holds only
Claude-specific setup.

## Plugins

Declared in `.claude/settings.json` (auto-update on): superpowers, context7, typescript-lsp,
impeccable, mattpocock-skills, supabase + postgres-best-practices, modern-web-guidance (Google Chrome). Trust the folder when
prompted, then run `/plugin` to install any listed as missing.

Project skills live in `.agents/skills/` and are symlinked into `.claude/skills/`. Add new
project skills to `.agents/skills/` and symlink them, so Codex and Copilot see them too.

## Cross-model review

For non-trivial diffs, run the `cross-model-review` skill: it shells out to Codex
(`gpt-6-astra` for deep review, `gpt-6.1-sol` for quick checks) read-only and reports back.
Treat its findings like any reviewer's: verify before acting.

## Guardrails

`.claude/settings.json` blocks only destructive commands: reading `.env` secrets, force pushes,
`supabase db push/reset`, and `vercel env rm`. Everything else follows the "Check with V."
list in `AGENTS.md`. That list is a heads-up to the person, not a block.
