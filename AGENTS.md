# AGENTS.md — Sips

Canonical instructions for every coding agent (Claude Code, Codex, Copilot CLI, others).
`CLAUDE.md` imports this file and adds only Claude-specific notes. Keep project rules **here**.

## What this is

Sips is a personal cafe review journal for Seattle, live at **oursips.com**. Two co-owners,
V. (engineer) and L. (UX designer), write it. Anyone can read it.

## Who you might be working with

Check `git config user.email` or ask. Behave differently depending on who's driving:

- **V. (engineer):** terse, technical, autonomous. Normal engineering workflow.
- **L. (designer):** co-owner of the site. She owns look, feel, copy and content, and can change
  any code. She isn't expected to know git, Supabase or Next.js internals. When working with her:
  - Just do the work. She has full write access. Don't add process she didn't ask for.
  - Do the git work for her. For small, safe changes (copy, styles, posts, UI tweaks), run
    `npm run typecheck` and `npm run build`, fix any failures, then commit and push to `main`.
    It's live on oursips.com a couple of minutes later. For big or risky changes, or anything in
    "Check with V." below, use a branch and PR so V. can look first.
  - Show her the change before pushing: `npm run dev` plus a screenshot or the local URL.
  - Explain trade-offs in plain language, with one recommendation and no jargon.
  - If a request falls under **"Check with V."** below, pause. Tell her in one or two
    plain sentences what the consequence would be, and suggest she run it by V. Then do what
    she decides. It's a heads-up, not a lock.
  - She mostly works in the Claude desktop app. Follow the `sips-design-loop` skill: keep a
    live preview in the app's browser pane, show screenshots (desktop and mobile), and iterate
    visually. For blog posts use `publish-post`.
  - Local dev uses the **live** database. Don't create test data in `/admin`.

### Check with V. (decisions with real technical consequences)

These are the stack choices the two of them agreed on. Don't change them on your own, and don't
let a design task quietly turn into one:

- **Hosting, infra, providers:** stay on Vercel + Supabase + Mapbox. Images live in Supabase
  Storage. The planned scale-up is Cloudflare R2, swapped in behind `lib/storage.ts` once
  monthly image egress nears the free tier, and that's V.'s call. No moving to AWS or other
  platforms, no new paid services, no new databases.
- **Data:** never delete or bulk-edit cafes, reviews or photos, drop tables, or reset the DB.
  Schema changes (`supabase/migrations/`) and RLS or Storage policies are V.'s.
- **Auth and security:** login flow, `ALLOWED_EMAILS`, `proxy.ts` (formerly `middleware.ts`)/CSP, `lib/auth.ts`,
  service-role usage (`lib/supabase/admin.ts`), env vars and API keys.
- **Framework-level changes:** swapping or adding major libraries or frameworks (another CSS or
  UI framework, a state library, a CMS), Next.js/React upgrades, rewrites of whole areas.
- Small dependencies for a UI need (an icon set, a date helper) are fine. Mention them in the
  commit message.

Everything else is fair game for her: pages, components, styles, layout, animation, copy, images,
blog posts, and new UI features that use the existing data.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions), React 19, TypeScript strict
- **Supabase**: Postgres, magic-link auth, Storage buckets `photos` (private, review photos)
  and `blog` (public, blog images)
- **Tailwind CSS 4** with CSS custom properties in `app/globals.css`
- **Mapbox GL** via `react-map-gl`; **Framer Motion** for animation
- **Vercel** hosting — `main` auto-deploys to production. **A push to `main` is a publish.**

## Commands

```bash
npm run dev        # local dev server → http://localhost:3000
npm run build      # production build (must pass before pushing to main)
npm run typecheck  # tsc --noEmit (must pass)
npm run lint       # ESLint (0 problems; blocking in CI)
npm run test:e2e   # Playwright smoke suite (read-only); run `npm run build` first
```

Env vars: copy `.env.local.example` → `.env.local` and ask V. for values. Never commit
`.env*`, secrets, images, or `public/photos/`.

## Architecture

| Layer | Location | Notes |
|---|---|---|
| Pages/routes | `app/` | Server Components by default; `"use client"` only when needed |
| Server Actions | `lib/actions/` | `cafes.ts`, `reviews.ts`, `photos.ts`, `admin.ts`, `auth.ts` |
| DB queries | `lib/supabase/queries.ts` | Public reads use the anon client, not admin |
| Types | `lib/supabase/types.ts` | Keep aligned with the real schema |
| Storage | `lib/storage.ts` | Abstraction over Supabase Storage |
| Auth | `lib/auth.ts` | `getUser()`, `requireAuth()`, `isAllowedEmail()` |
| Stories | `content/blog/*.mdx` | Rendered by `app/stories/` at `/stories` (`/blog` redirects). Photos go in Supabase Storage via `scripts/upload-blog-images.mjs` |
| Admin UI | `app/admin/` | Review/cafe CRUD, quick-add, import. Protected by middleware |

## Conventions (hard rules)

- Public reads use the **anon** client; RLS is the guardrail. Service-role client only in
  authenticated Server Actions, plus one exception: `lib/storage.ts` signs photo URLs with it,
  and public queries pass it only paths that an anon (RLS-filtered) read just returned.
- Every Server Action calls `requireAuth()` before mutating. Never rely on middleware alone.
- Photos column is `photo_url` (renamed from `url`). It and `cafes.cover_photo_url` hold the
  object **path** in the private `photos` bucket, not a URL. Queries hand out signed URLs
  (`lib/storage.ts`); never build a public URL for a review photo.
- Geocoding goes through `lib/google/geocode.ts` only.
- Rating recalculation lives in `recalculateCafeRating()` (`lib/ratings.ts`), shared by every
  review mutation; zero reviews → `null`, never `0`. Keep it out of `"use server"` files.
- Resize images client-side before upload with `lib/image-utils.ts` (max 2000px, JPEG 0.85).
  Quick-add does this today; the review new/edit forms still upload originals, so fix that when
  touching them.
- Framer Motion: always use `useMotionSafe()` from `lib/motion.ts` (reduced-motion).
- Code style: ES2022+, `const`, no `any`, props interfaces, early returns.

## Auth

- Magic link only (`supabase.auth.signInWithOtp`). Google OAuth is off; restore guide in
  `docs/guides/google-oauth-setup.md`.
- Allowlist: `ALLOWED_EMAILS` env var (Vercel Production + Preview). Checked in middleware,
  the auth callback, and `requireAuth()`.

## Design system — "Ink & Paper"

Full context: `.impeccable.md` and `docs/design-system.md`. Use the impeccable skills for UI work.

- Colors via CSS vars only — cream `--color-cream`, espresso, terracotta (accent/CTA), sage, ink.
  Never hardcode hex.
- Fonts: `font-heading` (Caveat), `font-display` (Instrument Serif), `font-body`
  (Plus Jakarta Sans), `font-mono` (IBM Plex Mono).
- **Deprecated — do not use:** `text-brown`, `text-brown-muted`, `font-hand`,
  `hand-drawn-border`.
- Principle: hand-drawn soul, editorial structure. Restraint over decoration. Warm, not cute.

## Web platform target

- **Baseline: Widely available.** Use web features that work in all major browsers. For
  anything newer, fall back gracefully. For platform-API questions (dialog, popover,
  `@starting-style`, anchor positioning, forms), use the `modern-web-guidance` plugin.
  It's token-heavy, so query it for specific questions, not for blanket scans.

## Workflow

- **At the start of every session, run `git pull`** (on `main`, or rebase your branch) so you
  have the other person's latest changes and the newest rules and skills. If `package.json`
  changed, run `npm install`. Do this quietly, without asking.
- Small, safe changes go straight to `main` once `npm run typecheck` and `npm run build`
  pass. Use a branch and PR (`feat/…`, `fix/…`, `post/…`) for big or risky changes. PRs get
  a Vercel preview URL.
- CI runs typecheck and build on PRs and on `main`.
- Commits use GitHub **noreply** emails (`<id>+<user>@users.noreply.github.com`). This repo
  is public, so never commit with a personal email, and never put emails, keys or personal
  info in files.
- Never force-push or rewrite pushed history.
- Verify before claiming done: paste build/typecheck output or a preview screenshot.
- For non-trivial changes, get a cross-model review (`cross-model-review` skill → Codex).

## Where things live

- What's next: `docs/roadmap.md`. Known quirks: `docs/gotchas.md`. Open design and UX findings:
  `docs/design-ux-audit.md`.
- Collaboration setup: `docs/collaborating.md`. New-machine setup: `docs/onboarding.md`.
- Project skills (all agents): `.agents/skills/` (Claude reads them via `.claude/skills` symlinks).
