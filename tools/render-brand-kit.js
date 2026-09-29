// Gera o kit de logo em PNG e GIF animado a partir do logo vetorial.
// Uso: node tools/render-brand-kit.js && python3 tools/build-gifs.py
// Saída: brand/png/*.png e brand/frames/* (quadros que o build-gifs.py junta em GIF)
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..');
const out = (...p) => path.join(root, 'brand', ...p);

const BRASA = '#FF5A1F', AMBAR = '#FFB020', CARVAO = '#16120F', AREIA = '#F4EEE6';
const FLAME = 'M13.6 0.6C12.4 5.4 18.6 9.2 18.6 16.2C18.6 22.6 14.6 27.2 9.6 27.2C4.6 27.2 1.4 23.6 1.4 19.2C1.4 14.8 4.2 11.8 6.6 9.6C6.6 12.6 8 14.6 10.1 15.2C9 10.2 10.6 4.6 13.6 0.6Z';

// Contorno das letras "ikata", tirado do SVG do site
const logoSrc = fs.readFileSync(path.join(root, 'public/assets/img/logo-light.svg'), 'utf8');
const GLYPHS = logoSrc.match(/<path d="([^"]+)" fill="#F4EEE6"\/>/)[1];

const grad = (id) => `<linearGradient id="${id}" x1="0.2" y1="1" x2="0.75" y2="0"><stop offset="0" stop-color="${BRASA}"/><stop offset="1" stop-color="${AMBAR}"/></linearGradient>`;

// Deformação da chama no instante t (0..1), em loop perfeito
function flicker(t) {
  if (t === null) return { sx: 1, sy: 1, skew: 0 };
  const a = 2 * Math.PI * t;
  return {
    sy: 1 + 0.07 * Math.sin(a) + 0.03 * Math.sin(2 * a + 1.1),
    sx: 1 - 0.035 * Math.sin(a) + 0.015 * Math.sin(3 * a),
    skew: 4 * Math.sin(a + 0.8) + 1.5 * Math.sin(2 * a)
  };
}

// Brasas subindo a partir da chama (só na animação)
function embers(t, baseX, baseY, unit, n = 4) {
  if (t === null) return '';
  let s = '';
  for (let i = 0; i < n; i++) {
    const p = (t + i / n) % 1;
    const x = baseX + unit * (0.6 * Math.sin(2 * Math.PI * (p + i * 0.37)) + (i % 2 ? 0.5 : -0.4));
    const y = baseY - unit * 5.5 * p;
    const r = unit * (0.26 - 0.12 * p);
    const o = Math.sin(Math.PI * p) * 0.9;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${i % 2 ? AMBAR : BRASA}" opacity="${o.toFixed(3)}"/>`;
  }
  return s;
}

// Chama numa caixa 20x28, com a base em (10, 27.2)
function flameGroup(tx, ty, scale, t, gid) {
  const { sx, sy, skew } = flicker(t);
  return `<g transform="translate(${tx} ${ty}) scale(${scale})">` +
    `<g transform="translate(10 27.2) skewX(${skew.toFixed(3)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(-10 -27.2)">` +
    `<g transform="rotate(16 10 14)"><path d="${FLAME}" fill="url(#${gid})"/></g></g></g>`;
}

// Logo completo. Caixa do logo: x 0..2442, y -880..40 (baseline em 0)
function logoSVG({ text, bg, w, h, pad = 0.12, t = null, anim = false }) {
  const vbW = 2442, top = -880, vbH = 40 - top; // as brasas sobem pelo respiro acima do logo
  const flame = flameGroup(2086.4, -830, 10.357, t, 'g');
  const sparks = anim ? embers(t, 2195, -860, 40) : '';
  // centraliza o logo na área útil
  const inner = 1 - pad * 2;
  const scale = Math.min((w * inner) / vbW, (h * inner) / vbH);
  const ox = (w - vbW * scale) / 2, oy = (h - vbH * scale) / 2 - top * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs>${grad('g')}</defs>` +
    (bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : '') +
    `<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${scale.toFixed(5)})">` +
    `<path d="${GLYPHS}" fill="${text}"/>${sparks}${flame}</g></svg>`;
}

// Símbolo: chama num quadrado arredondado (ou só a chama)
function symbolSVG({ size, box = true, t = null, anim = false }) {
  const k = size / 64;
  const flame = flameGroup(15, 9, 1.62, t, 's');
  const sparks = anim ? embers(t, 34, 12, 2.2, 3) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<defs>${grad('s')}</defs><g transform="scale(${k})">` +
    (box ? `<rect width="64" height="64" rx="16" fill="${CARVAO}"/>` : '') +
    `${sparks}${flame}</g></svg>`;
}

async function shot(page, svg, file, transparent) {
  const [w, h] = [svg.match(/width="(\d+)"/)[1], svg.match(/height="(\d+)"/)[1]].map(Number);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
  await page.screenshot({ path: file, omitBackground: transparent });
}

(async () => {
  for (const d of ['png', 'frames/logo-escuro', 'frames/logo-claro', 'frames/simbolo']) fs.mkdirSync(out(d), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // PNGs estáticos
  await shot(page, logoSVG({ text: AREIA, w: 3000, h: 1130, pad: 0 }), out('png', 'ikata-logo-areia.png'), true);
  await shot(page, logoSVG({ text: CARVAO, w: 3000, h: 1130, pad: 0 }), out('png', 'ikata-logo-carvao.png'), true);
  await shot(page, logoSVG({ text: AREIA, bg: CARVAO, w: 2000, h: 1000, pad: 0.2 }), out('png', 'ikata-logo-fundo-carvao.png'), false);
  await shot(page, logoSVG({ text: CARVAO, bg: AREIA, w: 2000, h: 1000, pad: 0.2 }), out('png', 'ikata-logo-fundo-areia.png'), false);
  await shot(page, symbolSVG({ size: 1024 }), out('png', 'ikata-simbolo.png'), true);
  await shot(page, symbolSVG({ size: 1024, box: false }), out('png', 'ikata-chama.png'), true);

  // Quadros das animações
  const N = 36;
  for (let i = 0; i < N; i++) {
    const t = i / N, n = String(i).padStart(2, '0');
    await shot(page, logoSVG({ text: AREIA, bg: CARVAO, w: 960, h: 480, pad: 0.16, t, anim: true }), out('frames/logo-escuro', `${n}.png`), false);
    await shot(page, logoSVG({ text: CARVAO, bg: AREIA, w: 960, h: 480, pad: 0.16, t, anim: true }), out('frames/logo-claro', `${n}.png`), false);
    await shot(page, symbolSVG({ size: 512, t, anim: true }).replace('<g transform', `<rect width="512" height="512" fill="${CARVAO}"/><g transform`), out('frames/simbolo', `${n}.png`), false);
  }
  await browser.close();
  console.log('png e quadros prontos');
})();
