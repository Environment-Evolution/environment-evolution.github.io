# /// script
# dependencies = ["Pillow", "CairoSVG"]
# ///
"""Render geometric paper covers inspired by Tencent Hy's research cards.

Run: uv run scripts/render-social-cards.py (requires Cairo).
The illustrations are conceptual artwork, not experimental data.
"""
from io import BytesIO
from math import exp, sin, cos
from pathlib import Path
import os

if Path('/opt/homebrew/lib/libcairo.dylib').exists():
    os.environ.setdefault('DYLD_FALLBACK_LIBRARY_PATH', '/opt/homebrew/lib')

import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'social'
OUT.mkdir(exist_ok=True)
SCALE = 2
BG = '#f5f5f7'
INK = '#202125'
FONT_OPTIONS = [
    (Path('/System/Library/Fonts/Supplemental/Arial.ttf'),
     Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf')),
    (Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),
     Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')),
]
REGULAR, BOLD = next(pair for pair in FONT_OPTIONS if all(p.exists() for p in pair))


def line(points, color=INK, width=1, dash=None):
    coords = ' '.join(f'{x:.2f},{y:.2f}' for x, y in points)
    dashed = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"{dashed}/>'


def node(x, y, fill, radius=7):
    return f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{radius}" fill="{fill}" stroke="{INK}" stroke-width="1.4"/>'


def evolution():
    parts = []
    # Three bounded environments form a single lineage. The increasingly
    # structured terrain echoes the page's existing animated background.
    centers = [(268, 295), (590, 259), (912, 221)]
    def project(u, v, g, floor=False):
        hill = lambda x, z, spread: exp(-((u-x)**2+(v-z)**2)/spread)
        height = 29*hill(-.15,.08,.2) + g*(31*hill(.25,-.12,.09)+18*hill(-.3,-.25,.08))
        height += g**1.3*sin(u*8)*cos(v*7)*5
        cx, cy = centers[g]
        return cx + u*224 + v*86, cy + v*114 - u*24 - (0 if floor else max(0,height))
    # Faint construction lines and dashed transitions stay behind the meshes.
    parts.append(line([(130,369),(1080,259)], '#c5c7cd', .85, '3 6'))
    for g in range(2):
        a=project(.56,0,g); b=project(-.56,0,g+1)
        parts.append(line([a,b], '#747780', 1.2, '4 6'))
        parts.append(line([(b[0]-7,b[1]-3),b,(b[0]-6,b[1]+5)], '#747780', 1.2))
    for g in range(3):
        corners=[(-.5,-.5),(.5,-.5),(.5,.5),(-.5,.5),(-.5,-.5)]
        parts.append(line([project(u,v,g,True) for u,v in corners], '#b8bbc3', .9, '3 4'))
        n=9+g*2
        for i in range(n+1):
            k=i/n-.5
            for cross in (False,True):
                pts=[project(j/48-.5,k,g) if cross else project(k,j/48-.5,g) for j in range(49)]
                parts.append(line(pts, '#8b8f99', .65))
        parts.append(line([project(u,v,g) for u,v in corners], '#35373d', 1.2))
        route=[project(j/72-.5,sin((j/72-.5)*(5+g*2)+g)*(.08+g*.025),g) for j in range(73)]
        parts.append(line(route, INK, 2))
        for j in (0,36,72):
            parts.append(node(*route[j], ['#e7e6d9','#d8f1f5','#f2f7bd'][g], 6.5 if j==36 else 4))
        x,y=project(-.5,.72,g,True)
        parts.append(f'<text x="{x:.1f}" y="{y:.1f}" font-family="Arial,sans-serif" font-size="14" letter-spacing="2" fill="#71757e">G{g}</text>')
    return ''.join(parts)


def skills():
    # Nodes represent scenarios; connected edges represent composable skills.
    pts=[(240,248),(337,146),(353,330),(458,234),(536,121),(548,349),
         (633,209),(703,318),(771,127),(836,238),(931,155),(968,329)]
    edges=[(0,1),(0,2),(0,3),(1,3),(1,4),(2,3),(2,5),(3,4),(3,5),
           (3,6),(4,6),(4,8),(5,6),(5,7),(6,7),(6,8),(6,9),(7,9),
           (7,11),(8,9),(8,10),(9,10),(9,11),(10,11)]
    parts=[f'<ellipse cx="603" cy="239" rx="398" ry="144" fill="none" stroke="#c3c6cd" stroke-width=".8" stroke-dasharray="3 6"/>']
    parts.append(line([(170,239),(1035,239)], '#c3c6cd', .8, '2 6'))
    for a,b in edges:
        parts.append(line([pts[a],pts[b]], '#a6a9b1', .9, '3 5' if (a+b)%4==0 else None))
    route=[0,3,6,9,10]
    parts.append(line([pts[i] for i in route], INK, 2.1))
    # A second compositional path makes the branching structure legible.
    parts.append(line([pts[i] for i in [1,4,8,9,11]], '#555962', 1.1))
    for i,(x,y) in enumerate(pts):
        color = '#f5f5f7'
        if i in (0,10): color='#f2f7bd'
        elif i in route: color='#d8f1f5'
        elif i in (4,7): color='#e7e6d9'
        parts.append(node(x,y,color,9 if i in route else 6))
    # Small unlabelled satellite nodes add the graph's open-ended coverage.
    for a,p in [(1,(277,102)),(2,(280,377)),(4,(506,71)),(8,(824,79)),(11,(1027,378))]:
        parts.append(line([pts[a],p], '#b6bac3', .85, '3 5'))
        parts.append(node(*p,BG,3))
    return ''.join(parts)


def render(slug, title, subtitle, art):
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="{BG}"/>{art}</svg>'
    canvas=Image.open(BytesIO(cairosvg.svg2png(bytestring=svg.encode(),scale=SCALE))).convert('RGB')
    draw=ImageDraw.Draw(canvas)
    def text(x,y,value,size,bold=False,color=INK):
        font=ImageFont.truetype(str(BOLD if bold else REGULAR),size*SCALE)
        assert draw.textlength(value,font=font)<=1072*SCALE
        draw.text((x*SCALE,y*SCALE),value,font=font,fill=color)
    logo=ImageOps.contain(Image.open(ROOT/'assets/hy-logo.png').convert('RGBA'),(153*SCALE,29*SCALE),Image.Resampling.LANCZOS)
    canvas.paste(logo,(64*SCALE,40*SCALE),logo)
    text(64,449,title,48,bold=True)
    text(66,514,subtitle,26,color='#555963')
    text(66,575,'Hunyuan Team, Tencent',17,color='#787c85')
    canvas.resize((1200,630),Image.Resampling.LANCZOS).save(OUT/(slug+'.png'),optimize=True)


render('environment-evolution','Environment Evolution','for Terminal Agents',evolution())
render('skillsynth','SkillSynth','Toward Scalable Terminal Task Synthesis via Skill Graphs',skills())
