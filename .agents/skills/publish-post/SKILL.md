---
name: publish-post
description: Turn a draft (docx, markdown, Google Doc export, notes, voice-memo transcript, photos) into a published Sips story (blog post) or cafe review. Use when someone says "publish this", "post this", "turn this into a blog post", "add a review for <cafe>", or hands over a writing file.
---

# Publish a post on Sips

The author (often L., a designer) writes in whatever is comfortable. You do the technical part.
Keep her voice: fix typos and structure, but don't rewrite her tone or opinions.

## 1. Decide what it is

- **Story** (a free-form post: a guide, a roundup, a longer piece about one place): an MDX file
  in `content/blog/`, shown at `/stories/<slug>`. Follow the steps below and open a PR. The
  folder, the `blog` storage bucket and the upload script keep the old "blog" name; only the
  site says "Stories".
- **Cafe review** (one visit: photos, drinks, scores, verdict): the web admin is the source of
  truth. She captures it at https://oursips.com/admin/capture (signed in with the magic link or
  the 6-digit code from the email). It always saves a private draft; she publishes it later
  from the draft's edit page. Your part is the words: help her write the **verdict** (one line,
  what she'd tell a friend) and the **note/story** (1–4 short paragraphs in her voice), and
  turn her notes into the form fields (drink names, optional 1–5 scores, favourites, one-line
  drink notes) for her to paste or confirm. Don't write to the database directly, and don't
  invent scores: an unscored drink stays unscored until she scores it.
  See "Review photos" below for what to shoot.

## Review photos (for the capture form)

- Window light. No flash, no filters.
- **Hero:** landscape, framed for a 3:2 crop (the cafe, the counter, the table). Add it first:
  the first photo becomes the visit's cover.
- **Drinks:** portrait, framed for 4:5, shot from about 45°. Attach each to its drink in the
  form ("Add a photo of it").
- Aim for three or more photos per review.
- Photos straight off the iPhone are fine (HEIC or large JPEG). The form shrinks each one before
  upload. If a HEIC won't open in a desktop browser, use Safari or pick a JPEG.

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
author: "Lea"           # or "Vids" (the public names)
excerpt: "One sentence for the Stories page."
cover: "<url printed by the upload script>"   # optional
cafes:                  # optional: slugs of the cafes the story mentions
  - elm-coffee-roasters
draft: false
---

Body in Markdown. Use ## headings, short paragraphs, and images like
![alt text](https://…supabase.co/storage/v1/object/public/blog/matcha-crawl/1.jpg).
```

The slug is lowercase-kebab and matches the filename. Write alt text for every image.

`cafes:` lists the cafe slugs from `oursips.com/cafes/<slug>` (lowercase-kebab). Each listed
cafe's review page then links back to the story under "Featured in", once the story is
published. Entries that aren't valid slugs are ignored. Leave it out if the story names no
reviewed cafe.

## 4. Preview, then publish

1. Run `npm run dev`, open `http://localhost:3000/stories/<slug>`, and show her a screenshot.
   Make any changes she asks for.
2. When she's happy, run `npm run build`, then commit (`Post: <title>`) and push to `main`.
3. Tell her it'll be live at `https://oursips.com/stories/<slug>` in a couple of minutes, then
   open it and show her.
4. If she wants V. to read it first, push to a `post/<slug>` branch and open a PR instead. It
   gets a preview link.

## Don't

- Don't publish without her OK on the final preview.
- Don't invent facts about cafes (hours, prices). Ask, or leave them out.
- Don't change the site code to make one post look different. If she wants a new layout, that's
  a design change on its own branch.
