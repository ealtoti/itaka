"""Junta os quadros de brand/frames em GIFs animados (loop infinito).

Uso: python3 tools/build-gifs.py   (requer: pip install pillow)
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "brand" / "frames"
OUT = ROOT / "brand" / "gif"
FRAME_MS = 50

JOBS = {
    "logo-escuro": "ikata-logo-animado-fundo-carvao.gif",
    "logo-claro": "ikata-logo-animado-fundo-areia.gif",
    "simbolo": "ikata-simbolo-animado.gif",
}


def build(folder, name):
    frames = [Image.open(p).convert("RGB") for p in sorted((FRAMES / folder).glob("*.png"))]
    # paleta única para todos os quadros, montada a partir de uma amostra deles,
    # para as cores não "piscarem" entre um quadro e outro
    w, h = frames[0].size
    sample = Image.new("RGB", (w, h * 4))
    for i, f in enumerate(frames[:: max(1, len(frames) // 4)][:4]):
        sample.paste(f, (0, h * i))
    palette = sample.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    quant = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
    OUT.mkdir(parents=True, exist_ok=True)
    quant[0].save(OUT / name, save_all=True, append_images=quant[1:], duration=FRAME_MS, loop=0, optimize=True, disposal=1)
    print(name, (OUT / name).stat().st_size // 1024, "KB")


for folder, name in JOBS.items():
    build(folder, name)
