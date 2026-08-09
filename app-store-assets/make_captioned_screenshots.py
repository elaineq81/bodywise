from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'raw-mobile-captures'
IOS = ROOT / 'ios-6.5'
IPAD = ROOT / 'ipad-13'
IOS.mkdir(exist_ok=True)
IPAD.mkdir(exist_ok=True)

IOS_W, IOS_H = 1242, 2688
IPAD_W, IPAD_H = 2064, 2752
BG = (246, 242, 231)
INK = (21, 23, 17)
MUTED = (99, 101, 91)
LIME = (232, 255, 72)
RUST = (217, 101, 58)

CAPTIONS = [
    ('Your bodyweight plan, ready today.', 'Start with a clear calisthenics session matched to your body.'),
    ('Check mood, pain and energy first.', 'Three quick taps help Bodywise adjust the workout before you begin.'),
    ('Clear movement previews before every set.', 'See the move, read the cue, then follow the timer with confidence.'),
    ('Train core, knees, arms or full body.', 'Choose the target that matters today and let the plan adapt.'),
    ('Adjust time, pace and difficulty.', 'Keep the session realistic, safer and easier to finish.'),
    ('Swap moves when your body needs it.', 'Change the pace or avoid areas without losing the structure.'),
    ('Learn every move in the Vault.', 'Use coaching notes and progressions to understand each exercise.'),
    ('Track how each session felt.', 'Build consistency without pressure or confusing charts.'),
    ('Build your 4-week strength path.', 'Premium turns the first win into guided weekly progression.'),
    ('Recover smarter and keep momentum.', 'Bodywise explains why the plan fits your body today.'),
]

RAW_FILES = [
    '01-today-dashboard.png',
    '02-body-check.png',
    '03-movement-previews.png',
    '04-goal-targets.png',
    '05-start-flow.png',
    '06-adjust-workout.png',
    '07-vault.png',
    '08-progress.png',
    '09-premium-path.png',
    '10-guidance-reason.png',
]


def font(path, size, fallback='arial.ttf'):
    for candidate in [path, f'C:/Windows/Fonts/{fallback}', 'C:/Windows/Fonts/arial.ttf']:
        try:
            return ImageFont.truetype(candidate, size)
        except Exception:
            pass
    return ImageFont.load_default()

DISPLAY = font('C:/Windows/Fonts/impact.ttf', 118, 'arialbd.ttf')
DISPLAY_SMALL = font('C:/Windows/Fonts/impact.ttf', 56, 'arialbd.ttf')
BODY = font('C:/Windows/Fonts/arial.ttf', 34)
BODY_BOLD = font('C:/Windows/Fonts/arialbd.ttf', 30, 'arialbd.ttf')
KICKER = font('C:/Windows/Fonts/arialbd.ttf', 26, 'arialbd.ttf')
MARK = font('C:/Windows/Fonts/impact.ttf', 58, 'arialbd.ttf')


def rounded(im, radius):
    mask = Image.new('L', im.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, im.width, im.height), radius=radius, fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(im.convert('RGBA'), (0, 0), mask)
    return out


def wrap(draw, text, fnt, max_width):
    words = text.split()
    lines, current = [], ''
    for word in words:
        test = word if not current else current + ' ' + word
        if draw.textbbox((0, 0), test, font=fnt)[2] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_brand(draw):
    x, y = 78, 72
    draw.rounded_rectangle((x, y, x + 92, y + 92), radius=28, fill=LIME, outline=INK, width=5)
    draw.text((x + 18, y + 16), 'BR', font=MARK, fill=INK)
    draw.text((x + 118, y + 12), 'BODYWISE', font=BODY_BOLD, fill=INK)
    draw.text((x + 118, y + 50), 'CALISTHENICS', font=KICKER, fill=MUTED)


def build_ios(raw_file, idx):
    title, subtitle = CAPTIONS[idx]
    raw = Image.open(RAW / raw_file).convert('RGB')
    canvas = Image.new('RGB', (IOS_W, IOS_H), BG)
    draw = ImageDraw.Draw(canvas)

    # premium abstract shapes
    draw.ellipse((835, 118, 1285, 568), fill=LIME)
    draw.ellipse((-150, 2140, 380, 2670), fill=(239, 210, 190))
    draw.rounded_rectangle((70, 212, 1172, 610), radius=58, fill=(255, 252, 243), outline=(221, 213, 198), width=3)
    draw_brand(draw)

    draw.text((88, 222), 'APP STORE PREVIEW', font=KICKER, fill=(138, 116, 92))
    y = 268
    title_lines = wrap(draw, title.upper(), DISPLAY, 970)
    for line in title_lines[:3]:
        draw.text((88, y), line, font=DISPLAY, fill=INK)
        y += 110
    y += 8
    for line in wrap(draw, subtitle, BODY, 900)[:3]:
        draw.text((90, y), line, font=BODY, fill=MUTED)
        y += 44

    # phone frame
    phone_w = 970
    phone_h = int(phone_w * raw.height / raw.width)
    if phone_h > 1990:
        phone_h = 1990
        phone_w = int(phone_h * raw.width / raw.height)
    phone = raw.resize((phone_w, phone_h), Image.Resampling.LANCZOS)
    phone = rounded(phone, 86)
    x = (IOS_W - phone_w) // 2
    py = 650
    shadow = Image.new('RGBA', (phone_w + 90, phone_h + 90), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle((45, 45, 45 + phone_w, 45 + phone_h), radius=90, fill=(0, 0, 0, 92))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    canvas_rgba = canvas.convert('RGBA')
    canvas_rgba.alpha_composite(shadow, (x - 45, py - 28))
    # black device rim
    rim = Image.new('RGBA', (phone_w + 40, phone_h + 40), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rim)
    rdraw.rounded_rectangle((0, 0, phone_w + 40, phone_h + 40), radius=104, fill=INK)
    canvas_rgba.alpha_composite(rim, (x - 20, py - 20))
    canvas_rgba.alpha_composite(phone, (x, py))

    out = canvas_rgba.convert('RGB')
    file = IOS / f'{idx+1:02d}-bodywise-remedy.png'
    out.save(file, quality=95)
    return file


def build_ipad(source_file):
    source = Image.open(source_file).convert('RGB')
    background = ImageOps.fit(source, (IPAD_W, IPAD_H), method=Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(34))
    veil = Image.new('RGB', (IPAD_W, IPAD_H), (248, 245, 236))
    background = Image.blend(background, veil, 0.78).convert('RGBA')
    scale = min(1330 / source.width, 2550 / source.height)
    shot = source.resize((int(source.width * scale), int(source.height * scale)), Image.Resampling.LANCZOS).convert('RGBA')
    x = (IPAD_W - shot.width) // 2
    y = (IPAD_H - shot.height) // 2
    shadow = Image.new('RGBA', shot.size, (0, 0, 0, 70)).filter(ImageFilter.GaussianBlur(26))
    background.alpha_composite(shadow, (x + 18, y + 24))
    background.alpha_composite(shot, (x, y))
    out = IPAD / source_file.name
    background.convert('RGB').save(out, quality=95)
    return out


def main():
    ios_files = []
    for idx, raw_file in enumerate(RAW_FILES):
        ios_files.append(build_ios(raw_file, idx))
    for f in ios_files:
        build_ipad(f)
    for folder, size in [(IOS, (IOS_W, IOS_H)), (IPAD, (IPAD_W, IPAD_H))]:
        for p in sorted(folder.glob('*.png')):
            im = Image.open(p)
            if im.size != size:
                raise SystemExit(f'{p} is {im.size}, expected {size}')
            print(f'{p} {im.size[0]}x{im.size[1]}')

if __name__ == '__main__':
    main()
