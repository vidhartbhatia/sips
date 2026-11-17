# Collaborating on Sips

Sips has two co-owners: **V.** (engineer) and **L.** (UX designer). Both have full write access. The
shared tech rules are in `AGENTS.md`, so every agent (Claude, Codex, Copilot) follows the same
rules, whoever is driving.

## How changes go live

- Small, safe changes: build and typecheck pass, then push to `main`. Vercel deploys
  oursips.com in a couple of minutes.
- Big or risky changes: branch, then PR. Vercel adds a preview link and CI checks the build. The
  other person reviews it.
- A failed build never takes the site down: Vercel keeps the last good version live.
- Agents flag anything that touches hosting, data, login or security, or the framework itself
  ("Check with V." in `AGENTS.md`). It's a heads-up, not a lock.

## Writing on the site

Reviews are written in the admin at oursips.com/admin, with a magic-link login. Only emails
in the `ALLOWED_EMAILS` allowlist can sign in. Blog posts are MDX files in `content/blog/`; see
the `publish-post` skill.

## New machine

See `docs/onboarding.md`. A single prompt in the Claude desktop app sets everything up.

## Privacy

The repo is public. Commit with GitHub noreply emails only, and keep emails, keys and personal
details out of files. Secrets live in `.env.local` (git-ignored) and in Vercel env vars.
