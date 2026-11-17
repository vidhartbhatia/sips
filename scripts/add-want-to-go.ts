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
  const { error } = await sb.from("want_to_go").insert({
    name: "Piedmont Café",
    address: "4056 Stone Way N, Seattle, WA 98103",
    lat: 47.6555,
    lng: -122.3425,
    source: "manual",
    notes: "Currently here — need to review!",
    cafe_id: null,
  });

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Added Piedmont Café to want-to-go list!");
  }
}

main();
