// Downloads the Google Fonts used by the site (latin + latin-ext only) into assets/fonts
// and writes assets/fonts/fonts.css, so the site no longer contacts Google servers (DSGVO).
import { writeFileSync, mkdirSync } from 'node:fs';
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Manrope:wght@400;500;600&display=swap';
const out = new URL('../assets/fonts/', import.meta.url);
mkdirSync(out, { recursive: true });
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': ua } })).text();
const blocks = css.split('/* ').slice(1).map(b => ({ subset: b.slice(0, b.indexOf(' */')), body: b.slice(b.indexOf('@font-face')) }))
  .filter(b => b.subset === 'latin' || b.subset === 'latin-ext');
let result = '/* Self-hosted fonts (SIL Open Font License): Playfair Display, Manrope */\n';
const seen = new Map();
for (const b of blocks) {
  const fam = /font-family: '([^']+)'/.exec(b.body)[1], style = /font-style: (\w+)/.exec(b.body)[1], weight = /font-weight: (\d+)/.exec(b.body)[1];
  const url = /url\((https:[^)]+\.woff2)\)/.exec(b.body)[1];
  let name = seen.get(url);
  if (!name) {
    name = `${fam.toLowerCase().replace(/\s+/g, '-')}-${b.subset}-${style}-${seen.size}.woff2`;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    writeFileSync(new URL(name, out), buf); seen.set(url, name);
  }
  result += `/* ${b.subset} */\n` + b.body.replace(/url\([^)]+\)/, `url(${name})`).trim() + '\n';
}
writeFileSync(new URL('fonts.css', out), result);
console.log('files:', seen.size, 'faces:', blocks.length);
