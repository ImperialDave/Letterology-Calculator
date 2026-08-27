#!/usr/bin/env python3
"""Chroma-key magenta sprites and scale Glyphbound art into public/glyphbound."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "glyphbound"


def chroma(img: Image.Image, thresh: int = 110) -> Image.Image:
    rgba = img.convert("RGBA")
    px = list(rgba.getdata())
    out = []
    for r, g, b, a in px:
        dist = abs(r - 255) + abs(g - 0) + abs(b - 255)
        magenta_like = r > 150 and b > 120 and g < min(r, b) * 0.62 and (r + b) > g * 3
        if dist < thresh or magenta_like:
            out.append((r, g, b, 0))
        elif dist < thresh * 2:
            fade = int(a * (dist - thresh) / thresh)
            out.append((r, g, b, max(0, min(255, fade))))
        else:
            out.append((r, g, b, a))
    rgba.putdata(out)
    return rgba


def crop_center(im: Image.Image, frac: float = 0.72) -> Image.Image:
    w, h = im.size
    cw, ch = int(w * frac), int(h * frac)
    x0 = (w - cw) // 2
    y0 = (h - ch) // 2
    return im.crop((x0, y0, x0 + cw, y0 + ch))


def tint(im: Image.Image, rgb: tuple[float, float, float]) -> Image.Image:
    r, g, b = im.convert("RGBA").split()[:3]
    a = im.convert("RGBA").split()[3]
    r = r.point(lambda v: max(0, min(255, int(v * rgb[0]))))
    g = g.point(lambda v: max(0, min(255, int(v * rgb[1]))))
    b = b.point(lambda v: max(0, min(255, int(v * rgb[2]))))
    return Image.merge("RGBA", (r, g, b, a))


def process(src: Path, dest: Path, mode: str, size: int, crop: float = 0) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src)
    if crop > 0:
        im = crop_center(im, crop)
    if mode == "sprite":
        im = chroma(im)
    else:
        im = im.convert("RGBA")
    im = im.resize((size, size), Image.Resampling.LANCZOS)
    im.save(dest)
    print(f"wrote {dest} ({size}x{size} {mode})")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--src", required=True)
    p.add_argument("--kind", required=True, choices=["tiles", "hazards", "movers", "props"])
    p.add_argument("--name", required=True)
    p.add_argument("--mode", default="sprite", choices=["sprite", "tile"])
    p.add_argument("--size", type=int, default=96)
    p.add_argument("--crop", type=float, default=0)
    p.add_argument("--tint", default="")
    args = p.parse_args()
    dest = ROOT / args.kind / f"{args.name}.png"
    process(Path(args.src), dest, args.mode, args.size, args.crop)
    if args.tint:
        r, g, b = (float(x) for x in args.tint.split(","))
        tint(Image.open(dest), (r, g, b)).save(dest)
        print(f"tinted {dest}")


if __name__ == "__main__":
    main()
