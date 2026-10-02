import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from '../../build.mjs';
import { escapeHtml } from '../../src/lib/template.mjs';

const lab = JSON.parse(readFileSync(new URL('../../src/data/lab.json', import.meta.url), 'utf8'));
const pages = await build({ now: new Date('2026-10-03T12:00:00Z') });

test('lab.json lists the five tools with required fields', () => {
  assert.deepEqual(lab.tools.map((t) => t.id), ['toolbox', 'json-to-go', 'crypto', 'pulse', 'ctf']);
  for (const t of lab.tools) {
    assert.ok(t.title && t.description && Array.isArray(t.tags), t.id);
    assert.ok(['live', 'soon'].includes(t.status), t.id);
  }
});

test('the lab index lists every tool and links only live ones', () => {
  const html = pages.get('lab/index.html');
  assert.ok(html, 'lab/index.html missing');
  for (const t of lab.tools) {
    assert.ok(html.includes(escapeHtml(t.title)), `${t.id} missing on the index`);
    assert.equal(html.includes(`href="/lab/${t.id}/"`), t.status === 'live', `link state for ${t.id}`);
  }
});

test('a page is generated for each live tool and for no other', () => {
  for (const t of lab.tools) assert.equal(pages.has(`lab/${t.id}/index.html`), t.status === 'live', t.id);
});

test('lab pages have canonical urls, titles and no leftover placeholders', () => {
  for (const [path, html] of pages) {
    if (!path.startsWith('lab/')) continue;
    assert.ok(!/\{\{/.test(html), `placeholder in ${path}`);
    assert.match(html, /<link rel="canonical" href="https:\/\/omargaly\.github\.io\/lab\//, path);
    assert.match(html, /<title>[^<]+<\/title>/, path);
  }
});

test('sitemap includes the lab index', () => {
  assert.ok(pages.get('sitemap.xml').includes('<loc>https://omargaly.github.io/lab/</loc>'));
});

test('home page links to the lab', () => {
  for (const p of ['index.html', 'ru/index.html', 'kz/index.html']) {
    assert.ok(pages.get(p).includes('href="/lab/"'), p);
  }
});

test('lab pages tell visitors without JavaScript what is going on and have a well-named logo', () => {
  for (const [path, html] of pages) {
    if (!path.startsWith('lab/')) continue;
    assert.match(html, /<noscript>[^<]*JavaScript[^<]*<\/noscript>/, `noscript missing in ${path}`);
    const m = html.match(/class="logo"[^>]*aria-label="([^"]*)"/);
    assert.ok(m && m[1].includes('ob_'), `logo label in ${path}`);
  }
});
