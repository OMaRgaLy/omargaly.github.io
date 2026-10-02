import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../build.mjs';

const pages = await build({ now: new Date('2026-10-03T12:00:00Z') });
const en = pages.get('index.html');
const ru = pages.get('ru/index.html');
const kz = pages.get('kz/index.html');

test('emits a page per language plus 404 and sitemap', () => {
  for (const p of ['index.html', 'ru/index.html', 'kz/index.html', '404.html', 'sitemap.xml']) {
    assert.ok(pages.has(p), `missing ${p}`);
  }
});

test('sets the html lang attribute per language', () => {
  assert.match(en, /<html lang="en"/);
  assert.match(ru, /<html lang="ru"/);
  assert.match(kz, /<html lang="kk"/);
});

test('leaves no unresolved placeholders', () => {
  for (const [path, html] of pages) assert.ok(!/\{\{/.test(html), `placeholder left in ${path}`);
});

test('computes experience duration at build time', () => {
  assert.ok(en.includes('1 yr 7 mos'));
  assert.ok(ru.includes('1 г. 7 мес.'));
  assert.ok(kz.includes('1 жыл 7 ай'));
});

test('has canonical and hreflang links', () => {
  assert.ok(en.includes('rel="canonical" href="https://omargaly.github.io/"'));
  assert.ok(ru.includes('rel="canonical" href="https://omargaly.github.io/ru/"'));
  assert.ok(kz.includes('rel="canonical" href="https://omargaly.github.io/kz/"'));
  assert.ok(en.includes('hreflang="kk"'));
  assert.ok(en.includes('hreflang="x-default"'));
});

test('marks Kazakh as beta only in the switcher', () => {
  assert.ok(en.includes('class="beta"'));
});

test('marks the current language in the switcher', () => {
  assert.match(ru, /data-lang-link="ru" aria-current="true"/);
  assert.doesNotMatch(ru, /data-lang-link="en" aria-current/);
});

test('embeds valid terminal data', () => {
  const m = en.match(/<script type="application\/json" id="terminal-data">([\s\S]*?)<\/script>/);
  assert.ok(m, 'terminal-data script missing');
  const data = JSON.parse(m[1]);
  assert.ok(Array.isArray(data.i18n.help));
  assert.ok(data.stack.main.includes('Go'));
  assert.ok(data.links.some((l) => l.label === 'GitHub'));
});

test('renders the empty projects state', () => {
  assert.ok(en.includes('Cooking something good'));
});

test('does not name internal systems of the employer', () => {
  for (const html of [en, ru, kz]) assert.doesNotMatch(html, /iiko|\bPOS\b|ONAY|Gourmet|Halyk/i);
});

test('sitemap lists the three language URLs', () => {
  const xml = pages.get('sitemap.xml');
  for (const u of ['https://omargaly.github.io/', 'https://omargaly.github.io/ru/', 'https://omargaly.github.io/kz/']) {
    assert.ok(xml.includes(`<loc>${u}</loc>`), u);
  }
});
