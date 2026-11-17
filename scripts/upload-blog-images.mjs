#!/usr/bin/env node
// Upload blog post photos to Supabase Storage (bucket `photos`, folder blog/<slug>/) and
// print the public URLs to paste into the MDX. Images never go into git.
//
// Usage: node --env-file=.env.local scripts/upload-blog-images.mjs <slug> <file> [file...]
// Resizes to max 2000px JPEG first (macOS `sips`), matching lib/image-utils.ts.
//
// When traffic grows, move storage to Cloudflare R2 (free egress); keep this script's output
// contract (one public URL per line) so the publish-post skill doesn't change.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const [slug, ...files] = process.argv.slice(2);

if (!slug || !SLUG_RE.test(slug) || files.length === 0) {
  console.error("Usage: node --env-file=.env.local scripts/upload-blog-images.mjs <slug> <file> [file...]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY — run with --env-file=.env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const work = mkdtempSync(path.join(tmpdir(), "sips-blog-"));

for (const file of files) {
  const base = path.basename(file).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const out = path.join(work, `${base}.jpg`);
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", "-Z", "2000", file, "--out", out], {
    stdio: "ignore",
  });
  const storagePath = `blog/${slug}/${base}.jpg`;
  const { error } = await supabase.storage
    .from("photos")
    .upload(storagePath, readFileSync(out), { contentType: "image/jpeg", upsert: true });
  if (error) {
    console.error(`✗ ${file}: ${error.message}`);
    process.exitCode = 1;
    continue;
  }
  const { data } = supabase.storage.from("photos").getPublicUrl(storagePath);
  console.log(`${data.publicUrl}  # ${Math.round(statSync(out).size / 1024)}KB from ${path.basename(file)}`);
}
