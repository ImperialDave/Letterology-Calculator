#!/usr/bin/env python3
"""Chroma-key, strip cell gutters, and trim Glyphbound FX / weapon sheets."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "glyphbound"


def magentalike(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    dist = abs(r - 255) + abs(g - 0) + abs(b - 255)
    if dist < 180:
        return True
    if r > 140 and g < 90 and b > 50 and r > g * 1.5 and (r + b) > g * 2.4:
        return True
    if r > 200 and g > 200 and b > 200 and a < 40:
        return True
    if r > 225 and g > 225 and b > 225 and (max(r, g, b) - min(r, g, b)) < 28:
        return True
    return False


def chroma(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    px = list(rgba.getdata())
    out = []
    for r, g, b, a in px:
        if magentalike(r, g, b, a):
            out.append((0, 0, 0, 0))
        else:
            dist = abs(r - 255) + abs(g - 0) + abs(b - 255)
            if dist < 260 and r > 120 and b > 80 and g < 140:
                fade = int(a * (dist - 180) / 80) if dist > 180 else 0
                out.append((r, g, b, max(0, min(255, fade))))
            else:
                out.append((r, g, b, a))
    rgba.putdata(out)
    return rgba


def strip_dividers(cell: Image.Image, inset: int = 8) -> Image.Image:
    """Clear a thin frame so dashed/magenta gutters do not survive the slice."""
    w, h = cell.size
    px = cell.load()
    for y in range(h):
        for x in range(w):
            if x < inset or y < inset or x >= w - inset or y >= h - inset:
                r, g, b, a = px[x, y]
                bright = r > 180 and g > 180 and b > 180
                if magentalike(r, g, b, a) or bright or a < 40:
                    px[x, y] = (0, 0, 0, 0)
    return cell


def opaque_bbox(im: Image.Image, alpha=24) -> tuple[int, int, int, int] | None:
    px = im.load()
    w, h = im.size
    xs = []
    ys = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] >= alpha:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def trim_sheet(path: Path, cols: int, rows: int, pad: int = 4, size: int = 256) -> None:
    im = chroma(Image.open(path))
    w, h = im.size
    cw, ch = w // cols, h // rows
    cells: list[Image.Image] = []
    boxes = []
    for r in range(rows):
        for c in range(cols):
            cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            cell = strip_dividers(cell)
            box = opaque_bbox(cell)
            cells.append(cell)
            boxes.append(box)
    max_w = max((b[2] - b[0] for b in boxes if b), default=1)
    max_h = max((b[3] - b[1] for b in boxes if b), default=1)
    cell_w = max_w + pad * 2
    cell_h = max_h + pad * 2
    out = Image.new("RGBA", (cell_w * cols, cell_h * rows), (0, 0, 0, 0))
    for i, cell in enumerate(cells):
        c, r = i % cols, i // cols
        box = boxes[i]
        dest = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
        if box:
            cropped = cell.crop(box)
            ox = (cell_w - cropped.size[0]) // 2
            oy = (cell_h - cropped.size[1]) // 2
            dest.paste(cropped, (ox, oy), cropped)
        out.paste(dest, (c * cell_w, r * cell_h), dest)
    if size:
        out = out.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path)
    print(f"trimmed {path} -> {out.size[0]}x{out.size[1]} {cols}x{rows}")


def trim_still(path: Path, pad: int = 6, size: int = 160) -> None:
    im = chroma(Image.open(path))
    box = opaque_bbox(im)
    if not box:
        print(f"empty {path}")
        return
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.size[0], x1 + pad)
    y1 = min(im.size[1], y1 + pad)
    cropped = im.crop((x0, y0, x1, y1))
    side = max(cropped.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cropped, ((side - cropped.size[0]) // 2, (side - cropped.size[1]) // 2), cropped)
    canvas = canvas.resize((size, size), Image.Resampling.LANCZOS)
    canvas.save(path)
    print(f"trimmed still {path} -> {size}x{size} from {box}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--kind", choices=["fx", "weapons", "all"], default="all")
    args = p.parse_args()
    if args.kind in ("fx", "all"):
        for name in [
            "slash-arc",
            "slash-smash",
            "slash-thrust",
            "slash-ember",
            "impact-hit",
            "flourish-ring",
            "flourish-reaper",
            "flourish-slam",
            "flourish-thrust",
            "flourish-ember",
            "slash-side",
            "slash-up",
            "slash-down",
            "slash-back",
            "slash-dash",
            "smash-burst",
        ]:
            path = ROOT / "fx" / f"{name}.png"
            if path.exists():
                trim_sheet(path, 2, 2)
    if args.kind in ("weapons", "all"):
        for name in "csberknt":
            path = ROOT / "weapons" / f"{name}.png"
            if path.exists():
                trim_still(path)


if __name__ == "__main__":
    main()
