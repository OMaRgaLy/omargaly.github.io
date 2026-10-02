import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LAB_JS = join(ROOT, 'assets/js/lab');

function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? jsFiles(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : [],
  );
}

test('innerHTML is only used to insert generated SVG in pulse.js', () => {
  for (const file of jsFiles(LAB_JS)) {
    const src = readFileSync(file, 'utf8');
    const uses = src.match(/\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML|document\.write/g) ?? [];
    if (file.endsWith(join('lab', 'pulse.js'))) {
      assert.equal(uses.length, 2, 'pulse.js should assign innerHTML exactly twice (heatmap and language bars)');
    } else {
      assert.deepEqual(uses, [], `${file} must not write HTML`);
    }
  }
});

test('lib modules never touch the DOM', () => {
  for (const file of jsFiles(join(LAB_JS, 'lib'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /\b(document|window|location)\./, file);
  }
});
