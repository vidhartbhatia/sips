import { describe, expect, it } from "vitest";
import { uploadQueue } from "@/lib/upload-queue";

const file = (name: string) => new File([name], name, { type: "image/heic" });

describe("uploadQueue", () => {
  it("resizes before upload", async () => {
    const log: string[] = [];
    await uploadQueue(
      [file("a.heic"), file("b.heic")],
      async (blob) => {
        log.push(`upload:${await blob.text()}`);
        return { photoId: "p", error: null };
      },
      async (f) => {
        log.push(`resize:${f.name}`);
        return new Blob([`small-${f.name}`], { type: "image/jpeg" });
      },
    );
    // Each upload gets the resized blob, never the original, and resize comes first.
    expect(log).toEqual(["resize:a.heic", "upload:small-a.heic", "resize:b.heic", "upload:small-b.heic"]);
  });

  it("uploads one file per call, in order", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const result = await uploadQueue(
      [file("a"), file("b"), file("c")],
      async (blob) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
        return { photoId: `id-${await blob.text()}`, error: null };
      },
      async (f) => new Blob([f.name]),
    );
    expect(maxInFlight).toBe(1);
    expect(result).toEqual({ photoIds: ["id-a", "id-b", "id-c"], failures: [] });
  });

  it("continues after a failure and reports it", async () => {
    const result = await uploadQueue(
      [file("a"), file("bad-upload"), file("bad-resize"), file("d")],
      async (blob) => {
        const name = await blob.text();
        return name === "bad-upload" ? { error: "Upload failed: too big" } : { photoId: `id-${name}`, error: null };
      },
      async (f) => {
        if (f.name === "bad-resize") throw new Error("This photo can't be read here.");
        return new Blob([f.name]);
      },
    );
    expect(result).toEqual({
      photoIds: ["id-a", "id-d"],
      failures: [
        { name: "bad-upload", error: "Upload failed: too big" },
        { name: "bad-resize", error: "This photo can't be read here." },
      ],
    });
  });
});
