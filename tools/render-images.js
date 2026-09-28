// Gera as imagens PNG da marca (og-image, favicon-32, apple-touch-icon).
// Uso: node tools/render-images.js   (requer o pacote "playwright")
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..');
const img = (f) => path.join(root, 'assets', 'img', f);
const file = (p) => 'file://' + path.join(root, p);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(file('tools/og.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: img('og-image.png') });

  for (const [name, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}</style><img src="${file('assets/img/favicon.svg')}" width="${size}" height="${size}" style="display:block">`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: img(name), omitBackground: true });
  }
  await browser.close();
  console.log('imagens geradas');
})();
