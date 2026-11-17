import { describe, expect, it } from "vitest";
import { resizeImage, type Decoder } from "@/lib/image-utils";

const failing: Decoder = async () => {
  throw new Error("decode failed");
};

function photo(name: string, type: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("resizeImage when the browser can't decode the photo", () => {
  it("uploads a small JPEG as it is", async () => {
    const file = photo("5353.jpg", "image/jpeg", 1_500_000);
    await expect(resizeImage(file, 2000, [failing, failing])).resolves.toBe(file);
  });

  it("rejects a JPEG too big to send unresized, naming its type and size", async () => {
    const file = photo("big.jpg", "image/jpeg", 6 * 1024 * 1024);
    await expect(resizeImage(file, 2000, [failing])).rejects.toThrow(/big\.jpg \(image\/jpeg, 6\.0 MB\)/);
  });

  it("rejects HEIC it can't decode, since no page could show it", async () => {
    const file = photo("IMG_1.heic", "image/heic", 500_000);
    await expect(resizeImage(file, 2000, [failing])).rejects.toThrow(/Safari or pick a JPEG/);
  });

  it("explains an empty file (a cloud photo not downloaded yet)", async () => {
    const file = photo("cloud.jpg", "image/jpeg", 0);
    await expect(resizeImage(file, 2000, [failing])).rejects.toThrow(/is empty/);
  });

  it("tries the next decoder when the first one fails", async () => {
    const file = photo("ok.jpg", "image/jpeg", 1_000_000);
    let tried = 0;
    const counting: Decoder = async () => {
      tried += 1;
      throw new Error("nope");
    };
    await resizeImage(file, 2000, [counting, counting]);
    expect(tried).toBe(2);
  });
});
