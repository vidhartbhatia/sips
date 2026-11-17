import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function main() {
  const { count: cafes } = await sb.from("cafes").select("*", { count: "exact", head: true });
  const { count: reviews } = await sb.from("reviews").select("*", { count: "exact", head: true });
  const { data: rated } = await sb
    .from("cafes")
    .select("name, overall_rating, neighborhood")
    .not("overall_rating", "is", null)
    .order("overall_rating", { ascending: false })
    .limit(10);

  console.log(`Cafes: ${cafes} | Reviews: ${reviews}`);
  console.log("\nTop rated:");
  for (const c of rated ?? []) {
    console.log(`  ${c.overall_rating}★ ${c.name} (${c.neighborhood})`);
  }
}

main().catch(console.error);
