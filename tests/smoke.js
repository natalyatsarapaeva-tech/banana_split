// Дымовой тест: каждый уровень запускается и пару секунд играется без ошибок.
// Запуск: node tests/smoke.js  (нужен Playwright; браузер в облачном окружении уже установлен)
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}

(async () => {
  const srv = await serve();
  const url = `http://localhost:${srv.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => errors.push('request failed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(url);
  await page.waitForFunction(() => window.__G && window.__G.state !== 'boot', null, { timeout: 15000 });

  const ids = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => window.__dbg.levelIds());
  let failed = 0;
  for (const id of ids) {
    const before = errors.length;
    await page.evaluate(id => {
      const { Input } = window.__dbg;
      window.__G.startLevel(id);
      Input.keys.ArrowRight = true;
    }, id);
    // Пропустить заставку уровня и подсказки, затем побегать вправо с прыжками
    for (let i = 0; i < 8; i++) {
      await page.evaluate(i => {
        const { Input } = window.__dbg;
        Input.keys.Space = i % 2 === 0; Input.latch.Enter = true;
      }, i);
      await page.waitForTimeout(250);
    }
    const st = await page.evaluate(() => {
      const G = window.__G; window.__dbg.Input.keys = Object.create(null);
      return { state: G.state, x: Math.round(G.player.x), name: G.def.name, err: document.getElementById('err').style.display };
    });
    const errs = errors.slice(before);
    const ok = errs.length === 0 && st.err !== 'block';
    if (!ok) failed++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${id} «${st.name}» state=${st.state} x=${st.x}` + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
    await page.evaluate(() => { window.__G.toMap ? window.__G.toMap() : 0; });
  }
  await browser.close(); srv.close();
  if (failed) { console.log(`\n${failed} уровн(ей) с ошибками`); process.exit(1); }
  console.log('\nВсе уровни запускаются без ошибок');
})().catch(e => { console.error(e); process.exit(1); });
