---
name: sips-onboarding
description: One-time setup of a new Mac for working on Sips (oursips.com), mainly for L. (designer, co-owner). Use when someone says "set me up for Sips", "onboard me", "finish my Sips setup", or right after a fresh clone where .env.local or node_modules is missing.
---

# Sips onboarding (run by the agent, hands-off for the human)

The person is a designer, not an engineer. Do everything yourself. Ask her only for things
that need her: a browser login, a password prompt, or a file from V. Keep each message short
and friendly, and explain jargon in plain words. Make it feel like a guided tour, not homework.

Report progress as a checklist. Skip any step that's already done. Re-running this skill is
safe.

## 1. Tools

Check first, then install only what's missing:

- `xcode-select -p` fails: run `xcode-select --install`. Tell her a macOS dialog will appear;
  she clicks Install and waits a few minutes.
- `brew` missing: install Homebrew from https://brew.sh. It asks for her Mac password in the
  terminal, so tell her that's expected.
- `brew install node gh gitleaks` (Node 22+ is fine; gitleaks powers the pre-commit secret check).

## 2. GitHub

- `gh auth status`. If she isn't logged in: `gh auth login --web --git-protocol https`. Tell
  her a browser page opens with a code to paste. She signs in with her own GitHub account.
- Accept the repo invite if it's still pending:
  `gh api user/repository_invitations --jq '.[] | select(.repository.full_name=="vidhartbhatia/sips") | .id'`
  then `gh api -X PATCH user/repository_invitations/<id>`.
- **Always** set her git identity to her GitHub login and GitHub *noreply* email, even if an
  identity is already set. The repo is public, and a personal email in a commit is visible to
  everyone:
  `git config --global user.name "$(gh api user --jq .login)"` and
  `git config --global user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"`.
  Then ask her to turn on GitHub → Settings → Emails → "Keep my email addresses private" and
  "Block command line pushes that expose my email". Open the page for her.

## 3. Code

- Clone to `~/projects/sips` if it isn't there yet: `gh repo clone vidhartbhatia/sips ~/projects/sips`.
- `cd ~/projects/sips && npm install`

## 4. Secrets (`.env.local`)

The app needs `.env.local`, which V. sends by AirDrop. Look for it in this order:
`~/Downloads/.env.local`, `~/Downloads/env.local`, `~/Downloads/sips.env`. If it isn't there,
ask her to AirDrop-accept the file from V., then look again.

- Move it to `~/projects/sips/.env.local` and run `chmod 600`.
- Check that the keys are present without printing any values:
  `grep -c '^NEXT_PUBLIC_SUPABASE_URL=\|^SUPABASE_SECRET_KEY=\|^NEXT_PUBLIC_MAPBOX_TOKEN=' .env.local`
  should print 3.
- Never print, paste, upload or commit its contents. If she shares it in chat, tell her
  gently not to do that again.

## 5. Agent plugins

These give Claude the design, workflow and web-platform skills declared in `.claude/settings.json`:

```bash
claude plugin marketplace add pbakaus/impeccable
claude plugin marketplace add mattpocock/skills
claude plugin marketplace add supabase/agent-skills
claude plugin marketplace add GoogleChrome/modern-web-guidance
for p in superpowers@claude-plugins-official context7@claude-plugins-official \
  typescript-lsp@claude-plugins-official impeccable@impeccable mattpocock-skills@mattpocock \
  supabase@supabase-agent-skills postgres-best-practices@supabase-agent-skills \
  modern-web-guidance@googlechrome; do claude plugin install "$p" --scope user; done
```

If she has access to the private companion repo (`gh repo view vidhartbhatia/sips-private`
succeeds; accept that invite the same way as above), also run:
`claude plugin marketplace add vidhartbhatia/sips-private && claude plugin install sips-ops@sips-private`.

Tell her the plugins load in her next Claude session.

## 6. See it run

- `npm run dev`. Open http://localhost:3000 in the app's browser pane (or tell her to open it),
  then show her `/`, `/cafes` and `/blog`.
- Run `npm run build` once to confirm everything compiles.

## 7. Site login (for writing reviews on the live site)

Have her go to https://oursips.com/login, enter her Gmail, and click the magic link in the
email. She should land in `/admin`. If she sees "not allowed", tell V. Her email may need
adding to `ALLOWED_EMAILS`.

## 8. Wrap up

Give her a short welcome covering:

- How to ask for things: "make the cafe cards warmer", "publish this doc as a blog post", "fix
  the spacing on mobile".
- How changes go live: Claude checks the build and pushes, and the change is live a couple of
  minutes later. Bigger changes go through a PR with a preview link.
- That Claude will flag anything that touches hosting, the database or login and suggest
  checking with V.
- Where the rules live: `AGENTS.md` (she doesn't need to read it, but it's there).

Celebrate her first change: let her pick a tiny copy tweak she'd like on the site. Make it,
show it, push it, and show her the live page. 🎉
