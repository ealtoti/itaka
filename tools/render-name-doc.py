"""Gera brand/o-nome-ikata.pdf a partir de brand/o-nome-ikata.md, com a identidade da marca.

Uso: python3 tools/render-name-doc.py
Requer: pip install markdown, e o pacote "playwright" no Node.
"""
import subprocess
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
SRC = ROOT / "brand" / "o-nome-ikata.md"
OUT = ROOT / "brand" / "o-nome-ikata.pdf"
TMP = TOOLS / ".o-nome-ikata.html"

md = SRC.read_text(encoding="utf-8")
title_line, _, rest = md.partition("\n")
lead, _, body = rest.strip().partition("\n")
body_html = markdown.markdown(body, extensions=["tables"])
lead_html = markdown.markdown(lead.strip())

html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @font-face {{ font-family: "Space Grotesk"; font-weight: 700; src: url(sg700.ttf); }}
  @font-face {{ font-family: Inter; font-weight: 400; src: url(inter400.ttf); }}
  @font-face {{ font-family: Inter; font-weight: 600; src: url(inter500.ttf); }}
  @page {{ size: A4; margin: 22mm 20mm 20mm; }}
  @page :first {{ margin: 0; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; font-family: Inter, sans-serif; font-size: 10.5pt; line-height: 1.6; color: #2B2420; }}
  .cover {{ height: 297mm; background: #16120F; color: #F4EEE6; padding: 28mm 22mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; position: relative; overflow: hidden; }}
  .cover::after {{ content: ""; position: absolute; left: 50%; bottom: -120mm; width: 260mm; height: 190mm; transform: translateX(-50%); background: radial-gradient(closest-side, rgba(255,90,31,.22), rgba(255,90,31,0)); }}
  .cover img {{ width: 62mm; }}
  .cover h1 {{ font-family: "Space Grotesk"; font-size: 40pt; line-height: 1.02; letter-spacing: -0.02em; margin: 0 0 8mm; max-width: 150mm; }}
  .cover .lead p {{ font-size: 13pt; color: #A89F97; margin: 0; max-width: 130mm; }}
  .cover .foot {{ font-size: 9pt; color: #8A817A; letter-spacing: .08em; text-transform: uppercase; position: relative; z-index: 1; }}
  h2 {{ font-family: "Space Grotesk"; font-size: 17pt; color: #16120F; margin: 9mm 0 3mm; letter-spacing: -0.01em; page-break-after: avoid; }}
  h2::before {{ content: ""; display: block; width: 10mm; height: 1.2mm; background: #FF5A1F; border-radius: 1mm; margin-bottom: 3mm; }}
  h2:first-child {{ margin-top: 0; }}
  p {{ margin: 0 0 3.2mm; }}
  strong {{ font-weight: 600; color: #16120F; }}
  em {{ color: #B83A0C; font-style: italic; }}
  table {{ width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; font-size: 10pt; page-break-inside: avoid; }}
  th, td {{ text-align: left; padding: 2.4mm 3mm; border-bottom: 0.3mm solid #E3DACE; vertical-align: top; }}
  th {{ font-family: "Space Grotesk"; font-size: 9pt; letter-spacing: .06em; text-transform: uppercase; color: #5E5650; }}
  blockquote {{ margin: 2mm 0 5mm; padding: 4mm 5mm; background: #F4EEE6; border-left: 1.2mm solid #FF5A1F; border-radius: 0 3mm 3mm 0; page-break-inside: avoid; }}
  blockquote p {{ margin: 0; font-size: 11pt; color: #16120F; }}
  blockquote em {{ color: #B83A0C; }}
</style></head><body>
<section class="cover">
  <img src="../public/assets/img/logo-light.svg" alt="ikatá">
  <div style="position:relative;z-index:1">
    <h1>{title_line.lstrip('# ').strip()}</h1>
    <div class="lead">{lead_html}</div>
  </div>
  <div class="foot">Ikatá · ikata.pro</div>
</section>
<main>{body_html}</main>
</body></html>"""

TMP.write_text(html, encoding="utf-8")
js = f"""
let chromium;
try {{ ({{ chromium }} = require('playwright')); }} catch (e) {{ ({{ chromium }} = require('/opt/node22/lib/node_modules/playwright')); }}
(async () => {{
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://{TMP}', {{ waitUntil: 'load' }});
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({{ path: '{OUT}', format: 'A4', printBackground: true, preferCSSPageSize: true }});
  await b.close();
}})();
"""
try:
    subprocess.run(["node", "-e", js], check=True, cwd=ROOT)
finally:
    TMP.unlink(missing_ok=True)
print("ok", OUT)
