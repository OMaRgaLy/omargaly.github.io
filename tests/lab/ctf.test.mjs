import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from '../../build.mjs';
import { verifyFlag, parseSolved, markSolved, progress } from '../../assets/js/lab/lib/ctf.js';
import { FLAGS, rot13 } from '../../scripts/ctf-flags.mjs';
import { CONSOLE_HINT } from '../../assets/js/ctf-console.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const ctf = JSON.parse(read('src/data/ctf.json'));
const sha = (s) => createHash('sha256').update(s).digest('hex');
const hashOf = (id) => ctf.challenges.find((c) => c.id === id).sha256;
const pages = await build({ now: new Date('2026-10-03T12:00:00Z') });

test('every flag has the flag{...} format and a challenge with its hash', () => {
  assert.deepEqual(ctf.challenges.map((c) => c.id), ['source', 'console', 'terminal', 'robots']);
  for (const [id, flag] of Object.entries(FLAGS)) {
    assert.match(flag, /^flag\{[a-z0-9-]+\}$/, id);
    assert.equal(hashOf(id), sha(flag), `hash for ${id}`);
  }
  for (const c of ctf.challenges) assert.ok(c.title && c.hint, c.id);
});

test('each puzzle artifact decodes to its flag', () => {
  assert.equal(ctf.artifacts.source, FLAGS.source);
  assert.equal(Buffer.from(CONSOLE_HINT, 'base64').toString('utf8'), FLAGS.console);
  assert.equal(rot13(ctf.artifacts.terminalCipher), FLAGS.terminal);
  const vault = read('vault-7f3a.txt').trim();
  assert.equal(Buffer.from(vault, 'hex').toString('utf8'), FLAGS.robots);
  assert.match(read('robots.txt'), /Disallow: \/vault-7f3a\.txt/);
});

test('the source flag is in an HTML comment on every home page; the others do not leak', () => {
  for (const p of ['index.html', 'ru/index.html', 'kz/index.html']) {
    assert.ok(pages.get(p).includes(`<!-- ${FLAGS.source}`), p);
  }
  for (const [path, content] of pages) {
    for (const id of ['console', 'terminal', 'robots']) {
      assert.ok(!content.includes(FLAGS[id]), `${id} flag leaked into ${path}`);
    }
  }
  for (const f of ['assets/js/main.js', 'assets/js/terminal-core.js', 'assets/js/terminal.js', 'assets/js/ctf-console.js', 'robots.txt']) {
    for (const id of ['console', 'terminal', 'robots']) assert.ok(!read(f).includes(FLAGS[id]), `${id} flag leaked into ${f}`);
  }
});

test('the terminal data carries the secret cipher', () => {
  const m = pages.get('index.html').match(/id="terminal-data">([\s\S]*?)<\/script>/);
  assert.equal(JSON.parse(m[1]).hidden.secret, ctf.artifacts.terminalCipher);
});

test('the ctf page embeds challenge hashes but never plaintext flags', () => {
  const html = pages.get('lab/ctf/index.html');
  assert.ok(html, 'lab/ctf/index.html missing');
  assert.ok(html.includes(hashOf('source')));
  for (const flag of Object.values(FLAGS)) assert.ok(!html.includes(flag));
});

test('verifyFlag accepts the exact flag (trimmed) and rejects everything else', async () => {
  assert.equal(await verifyFlag(`  ${FLAGS.source}\n`, hashOf('source')), true);
  assert.equal(await verifyFlag(FLAGS.source.toUpperCase(), hashOf('source')), false);
  assert.equal(await verifyFlag('', hashOf('source')), false);
  assert.equal(await verifyFlag(FLAGS.console, hashOf('source')), false);
});

test('parseSolved tolerates missing and corrupt storage', () => {
  assert.deepEqual(parseSolved(null), []);
  assert.deepEqual(parseSolved('{nope'), []);
  assert.deepEqual(parseSolved('{"a":1}'), []);
  assert.deepEqual(parseSolved('["a",1,"b"]'), ['a', 'b']);
});

test('markSolved adds once; progress ignores unknown ids', () => {
  assert.deepEqual(markSolved(['a'], 'a'), ['a']);
  assert.deepEqual(markSolved(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(progress(['source', 'ghost'], ctf.challenges), { solved: 1, total: 4 });
});
