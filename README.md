# Sips ☕

A personal cafe journal for Seattle (coffee and matcha), written by two friends who like good
cups and quiet corners. Live at **[oursips.com](https://oursips.com)**.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions), React 19, TypeScript
- [Supabase](https://supabase.com): Postgres with row-level security, magic-link auth, Storage
- [Tailwind CSS 4](https://tailwindcss.com), [Mapbox GL](https://www.mapbox.com), [Framer Motion](https://motion.dev)
- Hosted on [Vercel](https://vercel.com)

Anyone can read the site. Writing is limited to the two authors through an email allowlist,
which is checked in middleware, in every server action, and by database RLS.

## Running locally

```bash
npm install
cp .env.local.example .env.local   # fill in your own Supabase / Mapbox values
npm run dev                        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run typecheck`, `npm run lint`. The schema is in
`supabase/migrations/`.

## Design

"Ink & Paper" pairs hand-drawn illustrations with an editorial layout: cream, espresso and
terracotta, set in Caveat, Instrument Serif, Plus Jakarta Sans and IBM Plex Mono. See
`docs/design-system.md`.

## Working with AI agents

`AGENTS.md` holds the project rules every coding agent follows (Claude Code, Codex, Copilot).
Project skills are in `.agents/skills/`.

## Contributing

This is a personal project, so it isn't looking for feature PRs. Bug reports and fixes are
welcome.

## License

All rights reserved for now. The code may get an open-source license later. Reviews, posts and
illustrations stay all rights reserved.
