#!/usr/bin/env python3
"""Generate Android adaptive icon layers from assets/Logo.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "assets" / "Logo.png"
OUT = ROOT / "assets" / "images"
SIZE = 1024
LOGO_SCALE = 0.58
BACKGROUND = (247, 241, 232, 255)  # #F7F1E8 — matches splash


def _fit_logo(canvas: Image.Image, logo: Image.Image) -> Image.Image:
    target = int(SIZE * LOGO_SCALE)
    ratio = min(target / logo.width, target / logo.height)
    resized = logo.resize(
        (max(1, int(logo.width * ratio)), max(1, int(logo.height * ratio))),
        Image.Resampling.LANCZOS,
    )
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    x = (SIZE - resized.width) // 2
    y = (SIZE - resized.height) // 2
    layer.paste(resized, (x, y), resized if resized.mode == "RGBA" else None)
    return layer


def _strip_white(img: Image.Image, threshold: int = 245) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a > 0 and r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (255, 255, 255, 0)
    return rgba


def _monochrome(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    src = rgba.load()
    dst = out.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = src[x, y]
            if a < 16:
                continue
            if r >= 245 and g >= 245 and b >= 245:
                continue
            dst[x, y] = (255, 255, 255, a)
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    logo = Image.open(LOGO)
    logo_rgba = _strip_white(logo)

    foreground = _fit_logo(Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0)), logo_rgba)
    background = Image.new("RGBA", (SIZE, SIZE), BACKGROUND)
    monochrome = _monochrome(_fit_logo(Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0)), logo_rgba))

    foreground.save(OUT / "android-icon-foreground.png")
    background.save(OUT / "android-icon-background.png")
    monochrome.save(OUT / "android-icon-monochrome.png")
    print(f"Wrote adaptive icons to {OUT}")


if __name__ == "__main__":
    main()
