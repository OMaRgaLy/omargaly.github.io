import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/css/tokens.css', import.meta.url), 'utf8');

function ranges(family) {
  const out = [];
  for (const m of css.matchAll(/@font-face\{[^}]*\}/g)) {
    if (!m[0].includes(`font-family:"${family}"`)) continue;
    const ur = m[0].match(/unicode-range:([^;}]+)/)[1];
    for (const part of ur.split(',')) {
      const [a, b] = part.trim().replace('U+', '').split('-');
      out.push([parseInt(a, 16), parseInt(b ?? a, 16)]);
    }
  }
  return out;
}

const KAZAKH = 'әғқңөұүһі'; // Kazakh-specific Cyrillic letters

for (const family of ['Inter Variable', 'JetBrains Mono Variable']) {
  test(`${family} has glyph coverage for every Kazakh letter`, () => {
    const r = ranges(family);
    for (const ch of KAZAKH) {
      const cp = ch.codePointAt(0);
      assert.ok(r.some(([a, b]) => cp >= a && cp <= b), `${family}: U+${cp.toString(16)} (${ch}) not covered`);
    }
  });
}
