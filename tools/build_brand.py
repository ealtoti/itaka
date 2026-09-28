"""Gera os arquivos de marca (logo, símbolo, favicon) a partir da Space Grotesk Bold.

Uso: python3 tools/build_brand.py caminho/para/SpaceGrotesk-Bold.ttf
Requer: pip install fonttools
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"

BRASA, AMBAR, CARVAO, AREIA = "#FF5A1F", "#FFB020", "#16120F", "#F4EEE6"

# Chama desenhada numa caixa de 20 x 28, com a ponta inclinada para a direita,
# como um acento agudo.
FLAME = (
    "M13.6 0.6C12.4 5.4 18.6 9.2 18.6 16.2C18.6 22.6 14.6 27.2 9.6 27.2"
    "C4.6 27.2 1.4 23.6 1.4 19.2C1.4 14.8 4.2 11.8 6.6 9.6"
    "C6.6 12.6 8 14.6 10.1 15.2C9 10.2 10.6 4.6 13.6 0.6Z"
)


def glyph_paths(font_path):
    font = TTFont(font_path)
    gs = font.getGlyphSet()
    hmtx = font["hmtx"]
    x = 0
    parts = []
    positions = {}
    for i, ch in enumerate("ikata"):
        pen = SVGPathPen(gs)
        # y invertido: baseline em y=0, altura positiva para cima
        tpen = TransformPen(pen, (1, 0, 0, -1, x, 0))
        gs[ch].draw(tpen)
        parts.append(pen.getCommands())
        positions[i] = x
        x += hmtx[ch][0]
    return " ".join(parts), x, positions[4]


def flame_group(cx, base_y, height, grad_id):
    s = height / 28.0
    # centraliza a chama sobre o "a" e inclina levemente
    tx = cx - 10 * s
    ty = base_y - height
    return (
        f'<g transform="translate({tx:.1f} {ty:.1f}) scale({s:.3f}) rotate(16 10 14)">'
        f'<path d="{FLAME}" fill="url(#{grad_id})"/></g>'
    )


def gradient(grad_id):
    return (
        f'<linearGradient id="{grad_id}" x1="0.2" y1="1" x2="0.75" y2="0">'
        f'<stop offset="0" stop-color="{BRASA}"/><stop offset="1" stop-color="{AMBAR}"/>'
        "</linearGradient>"
    )


def logo_svg(glyphs, width, a_x, text_color, grad_id="ikf"):
    # "a" ocupa x 38..556 na fonte; centro óptico ~ 300
    flame = flame_group(a_x + 326, -540, 290, grad_id)
    top = -880
    height = 880 + 40
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {top} {width} {height}" '
        f'role="img" aria-label="ikatá"><title>ikatá</title>'
        f"<defs>{gradient(grad_id)}</defs>"
        f'<path d="{glyphs}" fill="{text_color}"/>{flame}</svg>\n'
    )


def symbol_svg(bg=True, grad_id="iks"):
    rect = f'<rect width="64" height="64" rx="16" fill="{CARVAO}"/>' if bg else ""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="ikatá">'
        f"<title>ikatá</title><defs>{gradient(grad_id)}</defs>{rect}"
        f'<g transform="translate(15 9) scale(1.62) rotate(16 10 14)">'
        f'<path d="{FLAME}" fill="url(#{grad_id})"/></g></svg>\n'
    )


def main():
    font_path = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "tools" / "sg700.ttf")
    glyphs, width, a_x = glyph_paths(font_path)
    IMG.mkdir(parents=True, exist_ok=True)
    (IMG / "logo-light.svg").write_text(logo_svg(glyphs, width, a_x, AREIA))
    (IMG / "logo-dark.svg").write_text(logo_svg(glyphs, width, a_x, CARVAO))
    (IMG / "favicon.svg").write_text(symbol_svg())
    (IMG / "flame.svg").write_text(symbol_svg(bg=False))
    # trecho para colar inline no HTML
    (ROOT / "tools" / "logo-inline.txt").write_text(
        f'viewBox="0 -880 {width} 920"\n{glyphs}\nFLAME_TRANSFORM={flame_group(a_x + 326, -540, 290, "x")}\n'
    )
    print("ok", width)


if __name__ == "__main__":
    main()
