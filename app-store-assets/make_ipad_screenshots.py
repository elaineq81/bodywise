from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "ios-6.5"
OUTPUT = ROOT / "ipad-13"

WIDTH, HEIGHT = 2064, 2752


def build_ipad_screenshot(path: Path) -> Image.Image:
    source = Image.open(path).convert("RGB")

    background = ImageOps.fit(
        source,
        (WIDTH, HEIGHT),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    ).filter(ImageFilter.GaussianBlur(34))
    veil = Image.new("RGB", (WIDTH, HEIGHT), (248, 245, 236))
    background = Image.blend(background, veil, 0.82).convert("RGBA")

    scale = min(1300 / source.width, 2580 / source.height)
    shot_width = int(source.width * scale)
    shot_height = int(source.height * scale)
    shot = source.resize((shot_width, shot_height), Image.Resampling.LANCZOS).convert("RGBA")

    shadow = Image.new("RGBA", (shot_width, shot_height), (0, 0, 0, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(26))

    x = (WIDTH - shot_width) // 2
    y = (HEIGHT - shot_height) // 2
    background.alpha_composite(shadow, (x + 18, y + 24))
    background.alpha_composite(shot, (x, y))

    return background.convert("RGB")


def main() -> None:
    OUTPUT.mkdir(exist_ok=True)
    for source_file in sorted(SOURCE.glob("*.png")):
        output_file = OUTPUT / source_file.name
        build_ipad_screenshot(source_file).save(output_file, quality=95)
        print(f"{output_file} {WIDTH}x{HEIGHT}")


if __name__ == "__main__":
    main()
