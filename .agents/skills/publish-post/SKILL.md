---
name: publish-post
description: Turn a draft (docx, markdown, Google Doc export, notes, voice-memo transcript, photos) into a published Sips blog post or cafe review. Use when someone says "publish this", "post this", "turn this into a blog post", "add a review for <cafe>", or hands over a writing file.
---

# Publish a post on Sips

The author (often L., a designer) writes in whatever is comfortable. You do the technical part.
Keep her voice: fix typos and structure, but don't rewrite her tone or opinions.

## 1. Decide what it is

- **Blog post** (story, guide, roundup): an MDX file in `content/blog/`. Follow the steps below.
- **Cafe review** (rating, drinks, one cafe): the web admin is the source of truth. Tell her to
  use https://oursips.com/admin/review/new, signed in with magic link. Offer to turn her notes
  into the form fields (rating 1–5, drinks/food items with ratings, vibe tags, note) so she can
  paste them. Don't write to the database directly.

## 2. Convert the draft

- `.docx`: `textutil -convert txt -stdout file.docx` (macOS). Use pandoc if it's installed
  (`pandoc file.docx -t gfm`).
- `.md` / `.txt`: read it directly.
- Photos are uploaded to Supabase Storage, never committed to git:
  `node --env-file=.env.local scripts/upload-blog-images.mjs <slug> photo1.heic photo2.jpg`
  The script resizes each photo to max 2000px JPEG, uploads it to the public `blog` bucket and
  prints one public URL per photo. Use those URLs in the MDX. Blog images are public by design;
  review photos are private and go through the admin UI instead.

## 3. Write `content/blog/<slug>.mdx`

```mdx
---
title: "Matcha crawl through Capitol Hill"
date: "2026-11-16"
author: "L."            # or "V."
excerpt: "One sentence for the blog index."
cover: "<url printed by the upload script>"   # optional
draft: false
---

Body in Markdown. Use ## headings, short paragraphs, and images like
![alt text](https://…supabase.co/storage/v1/object/public/blog/matcha-crawl/1.jpg).
```

The slug is lowercase-kebab and matches the filename. Write alt text for every image.

## 4. Preview, then publish

1. Run `npm run dev`, open `http://localhost:3000/blog/<slug>`, and show her a screenshot.
   Make any changes she asks for.
2. When she's happy, run `npm run build`, then commit (`Post: <title>`) and push to `main`.
3. Tell her it'll be live at `https://oursips.com/blog/<slug>` in a couple of minutes, then
   open it and show her.
4. If she wants V. to read it first, push to a `post/<slug>` branch and open a PR instead. It
   gets a preview link.

## Don't

- Don't publish without her OK on the final preview.
- Don't invent facts about cafes (hours, prices). Ask, or leave them out.
- Don't change the site code to make one post look different. If she wants a new layout, that's
  a design change on its own branch.
