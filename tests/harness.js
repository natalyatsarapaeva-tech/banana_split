// Покадровое управление игрой для проверок механик (используется tests/w2.js).
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

async function open(opts = {}) {
  const srv = await new Promise(res => {
    const s = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rsp);
    }).listen(0, () => res(s));
  });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  await page.goto(`http://localhost:${srv.address().port}/`);
  await page.waitForFunction(() => window.__G && window.__G.state === 'title');
  // stop the real-time loop: the test steps the game itself
  await page.evaluate(() => {
    const { Save } = window.__dbg; window.__G.manual = true;
    Object.assign(Save.data, { done: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, unlocked: 6, wallJump: true, introSeen: true, worldIntro: { 2: true } });
    window.__step = (n, keys) => {
      const { Input } = window.__dbg, G = window.__G;
      for (let i = 0; i < n; i++) {
        Input.keys = Object.create(null);
        for (const k of (typeof keys === 'function' ? keys(i) : keys) || []) Input.keys[k] = true;
        Input.update(); G.step(1 / 60);
        if (G.state === 'modal') { document.querySelector('#o-ok') && document.querySelector('#o-ok').click(); }
      }
      Input.keys = Object.create(null);
    };
  });
  const api = {
    page, errors,
    eval: (fn, arg) => page.evaluate(fn, arg),
    start: id => page.evaluate(id => { window.__G.startLevel(id); window.__G.setState('play'); }, id),
    step: (seconds, keys) => page.evaluate(([n, k]) => window.__step(n, k), [Math.round(seconds * 60), keys || []]),
    state: () => page.evaluate(() => { const G = window.__G, p = G.player; return { st: G.state, char: p.char, x: Math.round(p.cx), y: Math.round(p.bottom), vx: Math.round(p.vx), vy: Math.round(p.vy), wet: p.wet, swim: p.swimming, under: p.underwater, ground: p.onGround, air: +p.air.toFixed(2), hp: p.hp, helmet: p.helmet, parts: G.boatParts, kids: G.stats.sheep, gold: G.gold.join('') }; }),
    put: (x, y) => page.evaluate(([x, y]) => { const p = window.__G.player; p.x = x - p.w / 2; p.y = y - p.h; p.vx = p.vy = 0; window.__G.cam.reset(window.__G, p); }, [x, y]),
    shot: async name => { await page.evaluate(() => window.__G.render()); await page.screenshot({ path: path.join(opts.shots || '.', name + '.png') }); },
    close: async () => { await browser.close(); srv.close(); }
  };
  return api;
}
module.exports = { open };
