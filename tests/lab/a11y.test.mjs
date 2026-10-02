import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FRAGMENTS = readdirSync(join(ROOT, 'src/lab')).filter((f) => f.endsWith('.html'));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('every error paragraph in a lab fragment is an alert', () => {
  for (const f of FRAGMENTS) {
    for (const tag of read(`src/lab/${f}`).match(/<p class="err"[^>]*>/g) ?? []) {
      assert.match(tag, /role="alert"/, `${f}: ${tag}`);
    }
  }
});

test('detect results are announced politely', () => {
  assert.match(read('src/lab/crypto.html'), /<ul[^>]*id="detect-out"[^>]*aria-live="polite"/);
});

test('tabs and panels reference each other', () => {
  for (const f of FRAGMENTS) {
    const html = read(`src/lab/${f}`);
    for (const m of html.matchAll(/<button[^>]*data-tab="([\w-]+)"[^>]*>/g)) {
      assert.ok(m[0].includes(`id="tab-${m[1]}"`) && m[0].includes(`aria-controls="panel-${m[1]}"`), `${f}: tab ${m[1]}`);
    }
    for (const m of html.matchAll(/<section[^>]*data-panel="([\w-]+)"[^>]*>/g)) {
      assert.ok(m[0].includes(`id="panel-${m[1]}"`) && m[0].includes(`aria-labelledby="tab-${m[1]}"`), `${f}: panel ${m[1]}`);
    }
  }
});

test('tab keyboard handling covers Home and End and runtime errors are alerts', () => {
  const common = read('assets/js/lab/common.js');
  assert.match(common, /'Home'/);
  assert.match(common, /'End'/);
  assert.match(read('assets/js/lab/ctf.js'), /setAttribute\('role', 'alert'\)/);
});

test('solving a CTF challenge moves focus to its heading', () => {
  const ctf = read('assets/js/lab/ctf.js');
  assert.match(ctf, /tabIndex = -1/);
  assert.match(ctf, /\.focus\(\)/);
});
