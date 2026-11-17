import { describe, expect, it, vi } from "vitest";
import { uploadVisitPhotos, type PendingPhoto } from "@/lib/capture-upload";

const photo = (name: string, extra: Partial<PendingPhoto> = {}): PendingPhoto => ({
  file: new File([name], name, { type: "image/jpeg" }),
  ...extra,
});

function deps(opts: { failNames?: string[]; setCover?: (id: string) => Promise<{ error: string | null }> } = {}) {
  const added: { name: string; itemId?: string }[] = [];
  return {
    added,
    resize: async (f: File) => f,
    addPhoto: vi.fn(async (blob: Blob, itemId?: string) => {
      const name = await blob.text();
      if (opts.failNames?.includes(name)) return { error: `failed ${name}` };
      added.push({ name, itemId });
      return { photoId: `id-${name}`, error: null };
    }),
    setCover: vi.fn(opts.setCover ?? (async () => ({ error: null }))),
  };
}

describe("uploadVisitPhotos", () => {
  it("sets the photo marked as cover, not just the first that uploaded", async () => {
    const d = deps({ failNames: ["a"] });
    const first = await uploadVisitPhotos([photo("a", { isCover: true }), photo("b")], d);
    expect(d.setCover).not.toHaveBeenCalled(); // the cover failed: no stand-in cover
    expect(first.failed.map((f) => f.file.name)).toEqual(["a"]);

    const retry = deps();
    const second = await uploadVisitPhotos(first.failed, retry);
    expect(retry.setCover).toHaveBeenCalledWith("id-a");
    expect(second.failed).toEqual([]);
  });

  it("keeps the failed-photo list when setting the cover throws", async () => {
    const d = deps({ failNames: ["b"], setCover: async () => { throw new Error("network"); } });
    const result = await uploadVisitPhotos([photo("a", { isCover: true }), photo("b")], d);
    expect(result.failed.map((f) => f.file.name)).toEqual(["b"]);
    expect(result.coverError).toMatch(/network/);
  });

  it("reports a cover error returned by the action", async () => {
    const d = deps({ setCover: async () => ({ error: "That photo isn't part of this review." }) });
    const result = await uploadVisitPhotos([photo("a", { isCover: true })], d);
    expect(result.coverError).toMatch(/isn't part/);
    expect(result.failed).toEqual([]);
  });

  it("passes the drink's item id with its photo", async () => {
    const d = deps();
    await uploadVisitPhotos([photo("a", { isCover: true }), photo("latte", { itemId: "item-1" })], d);
    expect(d.added).toEqual([{ name: "a", itemId: undefined }, { name: "latte", itemId: "item-1" }]);
  });
});
