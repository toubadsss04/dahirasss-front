"""Generate the application icons from the source logo.

Run once when the logo changes:

    python scripts/generate_icons.py

The source is a transparent PNG. Home screen icons must be opaque: iOS fills
transparency with black, and Android launchers render it inconsistently, so
every icon here is composited onto a solid background.

Two families are produced. The plain icons keep a small margin. The maskable
one keeps the logo inside the inner 80 percent of the canvas, because Android
crops adaptive icons to a shape the launcher chooses and anything outside that
safe zone can be cut off.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / "logo.png"
PUBLIC = ROOT / "public"

BACKGROUND = (255, 255, 255, 255)

# Plain icons: the logo fills most of the tile, with a light margin.
PLAIN_SCALE = 0.88
# Maskable icon: the launcher may crop the outer fifth, so stay well inside.
MASKABLE_SCALE = 0.62


def trim(image: Image.Image) -> Image.Image:
    """Crop the transparent border so the logo fills the canvas evenly."""
    bounds = image.getbbox()
    return image.crop(bounds) if bounds else image


def render(logo: Image.Image, size: int, scale: float) -> Image.Image:
    """Paste the logo, centred and scaled, onto an opaque square."""
    canvas = Image.new("RGBA", (size, size), BACKGROUND)

    target = int(size * scale)
    ratio = min(target / logo.width, target / logo.height)
    resized = logo.resize(
        (max(1, round(logo.width * ratio)), max(1, round(logo.height * ratio))),
        Image.LANCZOS,
    )

    offset = ((size - resized.width) // 2, (size - resized.height) // 2)
    canvas.paste(resized, offset, resized)
    return canvas.convert("RGB")


def main() -> None:
    """Write every icon the manifest and iOS refer to."""
    if not SOURCE.exists():
        raise SystemExit(f"Logo introuvable : {SOURCE}")

    logo = trim(Image.open(SOURCE).convert("RGBA"))
    PUBLIC.mkdir(exist_ok=True)

    outputs = [
        ("pwa-192.png", 192, PLAIN_SCALE),
        ("pwa-512.png", 512, PLAIN_SCALE),
        ("pwa-maskable-512.png", 512, MASKABLE_SCALE),
        ("apple-touch-icon.png", 180, PLAIN_SCALE),
        ("favicon-64.png", 64, PLAIN_SCALE),
    ]

    for name, size, scale in outputs:
        path = PUBLIC / name
        render(logo, size, scale).save(path, "PNG", optimize=True)
        print(f"{name:<26} {size}x{size}  {path.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
