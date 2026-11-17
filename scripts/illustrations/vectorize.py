"""Turn the picked illustration candidates into production assets.

Line art: knock out the paper, split into ink / terracotta / sage layers, trace each layer with
potrace, stack them (fills under ink), then SVGO. The hero stays a feathered WebP.

Sources live in the git-excluded `.design-samples/set/` folder, so this script documents the
pipeline more than it is meant to be re-run in CI.

    python3 scripts/illustrations/vectorize.py <set-dir> <out-dir>

Needs: python3 with pillow, numpy, scipy; potrace and cwebp on PATH; npx (for svgo).
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

INK, TERRA, SAGE = "#2C2420", "#C4735B", "#8BAA8F"
SVGO = ["npx", "-y", "svgo@4.0.0"]

# slot file -> (source, kind). "raw" sources are the full-size generator PNGs (spots were
# downscaled to 800px in the candidate WebPs); sheet items only exist as split WebPs.
LINE_ART: dict[str, tuple[str, str]] = {
    "logo.svg": ("raw/logo-1.png", "raw"),
    "empty.svg": ("raw/empty-1.png", "raw"),
    "404.svg": ("raw/404-2.png", "raw"),
    "about.svg": ("raw/about-1.png", "raw"),
    "doodles/coffee.svg": ("doodle2-3.webp", "item"),
    "doodles/matcha.svg": ("doodle2-5.webp", "item"),
    "doodles/tea.svg": ("doodle2-6.webp", "item"),
    "doodles/pastry.svg": ("doodle2-7.webp", "item"),
    "dividers/sprig.svg": ("orn1-3.webp", "item"),
    "ornaments/ornament-1.svg": ("orn1-5.webp", "item"),
    "ornaments/ornament-2.svg": ("orn1-4.webp", "item"),
}
# Every candidate in the picked sheets, traced for the contact sheet only (not shipped).
EXTRAS = {f"_extra/doodle2-{i}.svg": (f"doodle2-{i}.webp", "item") for i in range(1, 10)} | {
    f"_extra/orn1-{i}.svg": (f"orn1-{i}.webp", "item") for i in range(1, 6)
}


def knockout(rgb: np.ndarray, t0: float = 6.0, t1: float = 40.0) -> np.ndarray:
    """Paper -> alpha, un-premultiplied against the corner paper colour (same as process.py)."""
    h, w, _ = rgb.shape
    k = max(8, min(h, w) // 60)
    corners = np.concatenate([rgb[:k, :k].reshape(-1, 3), rgb[:k, -k:].reshape(-1, 3),
                              rgb[-k:, :k].reshape(-1, 3), rgb[-k:, -k:].reshape(-1, 3)])
    paper = np.median(corners, axis=0)
    d = np.sqrt(((rgb - paper) ** 2).sum(axis=2))
    a = np.clip((d - t0) / (t1 - t0), 0, 1)
    a3 = np.maximum(a, 1e-3)[..., None]
    fg = np.clip((rgb - (1 - a3) * paper) / a3, 0, 255)
    return np.dstack([fg, a * 255])


def load(set_dir: Path, src: str, kind: str) -> np.ndarray:
    im = Image.open(set_dir / src)
    if kind == "raw":
        rgba = knockout(np.asarray(im.convert("RGB")).astype(np.float32))
    else:
        rgba = np.asarray(im.convert("RGBA")).astype(np.float32)
    # crop to content
    ys, xs = np.where(rgba[..., 3] > 40)
    pad = 12
    y0, y1 = max(0, ys.min() - pad), min(rgba.shape[0], ys.max() + 1 + pad)
    x0, x1 = max(0, xs.min() - pad), min(rgba.shape[1], xs.max() + 1 + pad)
    return rgba[y0:y1, x0:x1]


def upscale(rgba: np.ndarray, target: int) -> np.ndarray:
    h, w = rgba.shape[:2]
    s = max(1.0, target / max(h, w))
    if s == 1.0:
        return rgba
    # premultiply so colour from transparent pixels doesn't bleed when resampling
    a = rgba[..., 3:4] / 255
    pre = np.concatenate([rgba[..., :3] * a, rgba[..., 3:4]], axis=2).astype(np.float32)
    size = (round(w * s), round(h * s))
    chans = [np.asarray(Image.fromarray(pre[..., i], "F").resize(size, Image.LANCZOS)) for i in range(4)]
    out = np.stack(chans, axis=2)
    a2 = np.clip(out[..., 3:4], 0, 255) / 255
    rgb = np.clip(out[..., :3] / np.maximum(a2, 1e-3), 0, 255)
    return np.concatenate([rgb, a2 * 255], axis=2)


def lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb / 255
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def layers(rgba: np.ndarray, sigma: float, grow: int) -> dict[str, np.ndarray]:
    a = rgba[..., 3] / 255
    on_white = rgba[..., :3] * a[..., None] + 255 * (1 - a[..., None])
    L, A, B = np.moveaxis(lab(on_white), -1, 0)
    chroma = np.hypot(A, B)
    hue = np.degrees(np.arctan2(B, A))
    ink = (L < 40) | ((L < 62) & (chroma < 14))
    terra = ~ink & (L < 80) & (chroma > 18) & (hue > 15) & (hue < 75)
    sage = ~ink & (L < 86) & (A < -2) & (B > -4) & (chroma > 6)

    def smooth(m: np.ndarray) -> np.ndarray:
        return ndimage.gaussian_filter(m.astype(np.float32), sigma) > 0.5

    ink_s = smooth(ink)
    out = {INK: ink_s}
    for colour, m in ((TERRA, terra), (SAGE, sage)):
        m = smooth(m)
        # tuck fills under the ink so anti-aliasing leaves no cream hairline between them
        # (grow only into the ink, never outward past the line)
        out[colour] = m | (ndimage.binary_dilation(m, iterations=grow) & ndimage.binary_dilation(ink_s, iterations=1))
    return out


def potrace(mask: np.ndarray, turd: int) -> str:
    with tempfile.TemporaryDirectory() as td:
        pbm = Path(td) / "m.pbm"
        Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).convert("1").save(pbm)
        svg = subprocess.run(["potrace", str(pbm), "-s", "-o", "-", "-t", str(turd), "-a", "1.15",
                              "-O", "1.0", "-u", "1", "--flat"], capture_output=True, text=True, check=True).stdout
    import re
    return " ".join(re.findall(r'\bd="([^"]+)"', svg))


def trace(rgba: np.ndarray, target: int) -> str:
    big = upscale(rgba, target)
    h, w = big.shape[:2]
    scale = max(h, w) / target
    ls = layers(big, sigma=1.2 * scale, grow=max(2, round(2 * scale)))
    paths = []
    for colour in (SAGE, TERRA, INK):  # fills first, ink on top
        m = ls[colour]
        if m.sum() < 50:
            continue
        d = potrace(m, turd=int(30 * scale * scale))
        if d:
            paths.append(f'<path fill="{colour}" d="{d}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
            f'<g transform="translate(0 {h}) scale(1 -1)">{"".join(paths)}</g></svg>')


def svgo(path: Path) -> None:
    subprocess.run(SVGO + ["--multipass", "-p", "0", "-q", str(path)], check=True)


def hero(set_dir: Path, out_dir: Path) -> None:
    """Watercolour stays raster: knock out the paper, feather top/right/bottom into cream."""
    rgb = np.asarray(Image.open(set_dir / "raw/hero-1.png").convert("RGB")).astype(np.float32)
    rgba = knockout(rgb)
    h, w = rgba.shape[:2]
    y = np.arange(h)[:, None] / h
    x = np.arange(w)[None, :] / w

    def ramp(t: np.ndarray, width: float) -> np.ndarray:
        t = np.clip(t / width, 0, 1)
        return t * t * (3 - 2 * t)  # smoothstep

    feather = ramp(y, 0.10) * ramp(1 - y, 0.12) * ramp(1 - x, 0.08)
    rgba[..., 3] *= feather
    img = Image.fromarray(rgba.astype(np.uint8), "RGBA")
    webp(img, out_dir / "hero.webp", 1536, q=70)
    # mobile: the art only (the left ~40% is empty headline room), roughly 4:3
    x0 = int(w * 0.38)
    mob = img.crop((x0, 0, w, h))
    webp(mob, out_dir / "hero-mobile.webp", 750, q=70)


def favicon(set_dir: Path, out_dir: Path) -> None:
    """logo-1 without the steam, square, with the ink thickened so it survives 16px."""
    rgba = load(set_dir, "raw/logo-1.png", "raw")
    solid = rgba[..., 3] > 40
    lab_, n = ndimage.label(ndimage.binary_dilation(solid, iterations=3))
    sizes = ndimage.sum(solid, lab_, range(1, n + 1))
    cup = lab_ == (int(np.argmax(sizes)) + 1)  # the cup and saucer; the steam is a separate stroke
    rgba[..., 3] *= cup
    ys, xs = np.where(rgba[..., 3] > 40)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = rgba.shape[:2]
    side = max(h, w) + 16
    sq = np.zeros((side, side, 4), np.float32)
    sq[(side - h) // 2:(side - h) // 2 + h, (side - w) // 2:(side - w) // 2 + w] = rgba

    ls = layers(sq, sigma=1.5, grow=3)
    # thicker ink for small sizes: ~1px at 32px
    ink = ndimage.binary_dilation(ls[INK], iterations=max(1, side // 160))

    (out_dir / "icon.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side} {side}">'
        f'<g transform="translate(0 {side}) scale(1 -1)">'
        f'<path fill="{TERRA}" d="{potrace(ls[TERRA], 200)}"/><path fill="{INK}" d="{potrace(ink, 200)}"/></g></svg>')
    svgo(out_dir / "icon.svg")

    def flat(bg: tuple[int, int, int, int] | None) -> Image.Image:
        canvas = np.zeros((side, side, 4), np.uint8) if bg is None else np.full((side, side, 4), bg, np.uint8)
        for colour, m in ((TERRA, ls[TERRA]), (INK, ink)):
            rgb = tuple(int(colour[i:i + 2], 16) for i in (1, 3, 5))
            canvas[m] = (*rgb, 255)
        return Image.fromarray(canvas, "RGBA")

    big = flat(None)
    big.resize((32, 32), Image.LANCZOS).save(out_dir / "favicon-32.png", optimize=True)
    big.resize((256, 256), Image.LANCZOS).save(out_dir / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    # apple-touch-icon: iOS ignores transparency (renders black), so put it on cream with margin
    cream = Image.new("RGBA", (180, 180), (0xFF, 0xF8, 0xF0, 255))
    cream.alpha_composite(big.resize((132, 132), Image.LANCZOS), (24, 24))
    cream.convert("RGB").save(out_dir / "apple-icon.png", optimize=True)


def webp(img: Image.Image, path: Path, maxdim: int, q: int = 80) -> None:
    if max(img.size) > maxdim:
        img = img.copy()
        img.thumbnail((maxdim, maxdim), Image.LANCZOS)
    with tempfile.TemporaryDirectory() as td:
        png = Path(td) / "i.png"
        img.save(png)
        subprocess.run(["cwebp", "-quiet", "-q", str(q), "-alpha_q", "90", "-m", "6", "-sharp_yuv",
                        "-exact", str(png), "-o", str(path)], check=True)


def main() -> None:
    set_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    only = set(sys.argv[3:])
    jobs = LINE_ART | EXTRAS
    for name, (src, kind) in jobs.items():
        if only and name not in only and "all" not in only:
            continue
        dst = out_dir / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        rgba = load(set_dir, src, kind)
        target = 1000 if kind == "raw" else 800
        dst.write_text(trace(rgba, target))
        svgo(dst)
        print(f"{name:28s} {dst.stat().st_size / 1024:6.1f} KB")
    if not only or "hero" in only or "all" in only:
        hero(set_dir, out_dir)
        for n in ("hero.webp", "hero-mobile.webp"):
            print(f"{n:28s} {(out_dir / n).stat().st_size / 1024:6.1f} KB")
    if not only or "favicon" in only or "all" in only:
        favicon(set_dir, out_dir)
        for n in ("icon.svg", "favicon.ico", "favicon-32.png", "apple-icon.png"):
            print(f"{n:28s} {(out_dir / n).stat().st_size / 1024:6.1f} KB")


if __name__ == "__main__":
    main()
