# /// script
# dependencies = ["Pillow", "CairoSVG"]
# ///
"""Render 1200 x 630 paper cards from the existing logo and original figures.

Run with `uv run scripts/render-social-cards.py` (requires the Cairo library).
"""
from io import BytesIO
from pathlib import Path
import os

# Let ctypes locate Homebrew Cairo when launched through a macOS executable
# that strips DYLD variables from its child process environment.
if Path('/opt/homebrew/lib/libcairo.dylib').exists():
    os.environ.setdefault('DYLD_FALLBACK_LIBRARY_PATH', '/opt/homebrew/lib')

import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'social'
OUT.mkdir(exist_ok=True)
SCALE = 2
FONT_OPTIONS = [
    (Path('/System/Library/Fonts/Supplemental/Arial.ttf'),
     Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf')),
    (Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),
     Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')),
]
REGULAR, BOLD = next(pair for pair in FONT_OPTIONS if all(p.exists() for p in pair))


def render(slug, title, subtitle, figure, arxiv):
    canvas = Image.new('RGB', (1200 * SCALE, 630 * SCALE), '#f7f7f9')
    draw = ImageDraw.Draw(canvas)

    def text(x, y, value, size, bold=False, color='#1a1a1a', anchor='la'):
        font = ImageFont.truetype(str(BOLD if bold else REGULAR), size * SCALE)
        assert draw.textlength(value, font=font) <= 1088 * SCALE
        draw.text((x * SCALE, y * SCALE), value, font=font, fill=color, anchor=anchor)

    logo = Image.open(ROOT / 'assets/hy-logo.png').convert('RGBA')
    logo = ImageOps.contain(logo, (190 * SCALE, 36 * SCALE), Image.Resampling.LANCZOS)
    canvas.paste(logo, (56 * SCALE, 42 * SCALE), logo)
    text(1144, 48, 'HUNYUAN RESEARCH', 17, color='#65666f', anchor='ra')
    text(56, 119, title, 61, bold=True)
    for i, line in enumerate(subtitle):
        text(56, 192 + i * 38, line, 31, color='#464750')

    draw.rounded_rectangle((56 * SCALE, 286 * SCALE, 1144 * SCALE, 554 * SCALE),
                           radius=14 * SCALE, fill='white', outline='#e5e6eb', width=SCALE)
    source = ROOT / figure
    if source.suffix == '.svg':
        artwork = Image.open(BytesIO(cairosvg.svg2png(url=str(source), output_width=2200)))
    else:
        artwork = Image.open(source)
    artwork = ImageOps.contain(artwork.convert('RGBA'), (1040 * SCALE, 240 * SCALE), Image.Resampling.LANCZOS)
    canvas.paste(artwork, ((1200 * SCALE - artwork.width) // 2,
                          286 * SCALE + (268 * SCALE - artwork.height) // 2), artwork)
    text(56, 580, 'Hunyuan Team, Tencent', 19, color='#65666f')
    text(1144, 583, 'arXiv: ' + arxiv, 17, color='#65666f', anchor='ra')
    canvas.resize((1200, 630), Image.Resampling.LANCZOS).save(OUT / (slug + '.png'), optimize=True)


render('environment-evolution', 'Environment Evolution', ['for Terminal Agents'],
       'assets/figures/Main_v2.svg', '2609.04128')
render('skillsynth', 'SkillSynth', ['Toward Scalable Terminal Task Synthesis', 'via Skill Graphs'],
       'skillsynth/assets/figures/main_v3.png', '2604.25727')
