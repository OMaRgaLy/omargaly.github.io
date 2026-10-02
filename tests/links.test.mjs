import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'ru/index.html', 'kz/index.html', '404.html'];

function localRefs(html) {
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) refs.add(part.trim().split(/\s+/)[0]);
  }
  return refs;
}

for (const page of PAGES) {
  test(`every local asset referenced by ${page} exists`, () => {
    const html = readFileSync(join(ROOT, page), 'utf8');
    for (const ref of localRefs(html)) {
      assert.ok(existsSync(join(ROOT, ref)), `${page} references missing file ${ref}`);
    }
  });
}

test('stylesheets reference only existing fonts', () => {
  const css = readFileSync(join(ROOT, 'assets/css/tokens.css'), 'utf8');
  for (const m of css.matchAll(/url\((\/assets\/[^)]+)\)/g)) {
    assert.ok(existsSync(join(ROOT, m[1])), `tokens.css references missing ${m[1]}`);
  }
});

test('legacy files are gone', () => {
  for (const f of ['assets/scripts/fslightbox.js', 'assets/styles/styles.css', 'assets/img/project.png', 'assets/img/icons/github-logo.png']) {
    assert.equal(existsSync(join(ROOT, f)), false, `${f} should be removed`);
  }
});
