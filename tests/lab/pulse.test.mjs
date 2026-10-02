import test from 'node:test';
import assert from 'node:assert/strict';
import { cachedJson, cachedAll, summarizeRepos, activityByDay, heatmapSvg, languageBarsSvg } from '../../assets/js/lab/lib/pulse.js';

function withStorage(value, fn) {
  Object.defineProperty(globalThis, 'localStorage', { value, configurable: true, writable: true });
  return Promise.resolve(fn()).finally(() => {
    delete globalThis.localStorage;
  });
}
const memStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
};
const okResponse = (data) => ({ ok: true, status: 200, json: async () => data });

test('cachedJson fetches once, then serves a fresh cache without a request', async () => {
  await withStorage(memStorage(), async () => {
    let calls = 0;
    const fetchFn = async () => {
      calls++;
      return okResponse({ a: 1 });
    };
    const first = await cachedJson('https://x/y', { fetchFn, now: 1000, ttl: 5000 });
    assert.deepEqual([first.data, first.source, first.stale], [{ a: 1 }, 'network', false]);
    const second = await cachedJson('https://x/y', { fetchFn, now: 2000, ttl: 5000 });
    assert.deepEqual([second.data, second.source, second.stale], [{ a: 1 }, 'cache', false]);
    assert.equal(calls, 1);
  });
});

test('cachedJson falls back to a stale cache when the API fails or rate-limits', async () => {
  await withStorage(memStorage(), async () => {
    await cachedJson('https://x/y', { fetchFn: async () => okResponse({ a: 1 }), now: 1000, ttl: 10 });
    const limited = await cachedJson('https://x/y', { fetchFn: async () => ({ ok: false, status: 403 }), now: 99999, ttl: 10 });
    assert.equal(limited.stale, true);
    assert.deepEqual(limited.data, { a: 1 });
    assert.match(limited.error, /rate limit/i);
    const offline = await cachedJson('https://x/y', { fetchFn: async () => { throw new TypeError('Failed to fetch'); }, now: 99999, ttl: 10 });
    assert.equal(offline.stale, true);
  });
});

test('cachedJson throws when the API fails and there is no cache', async () => {
  await withStorage(memStorage(), async () => {
    await assert.rejects(() => cachedJson('https://x/z', { fetchFn: async () => ({ ok: false, status: 500 }) }), /GitHub API error 500/);
    await assert.rejects(() => cachedJson('https://x/z', { fetchFn: async () => ({ ok: false, status: 403 }) }), /rate limit/i);
  });
});

test('cachedJson works when localStorage is unavailable and ignores a corrupt cache entry', async () => {
  await withStorage(undefined, async () => {
    const r = await cachedJson('https://x/y', { fetchFn: async () => okResponse([1]) });
    assert.deepEqual(r.data, [1]);
  });
  const corrupt = memStorage();
  corrupt.setItem('pulse:https://x/y', '{not json');
  await withStorage(corrupt, async () => {
    const r = await cachedJson('https://x/y', { fetchFn: async () => okResponse([2]), now: 1 });
    assert.deepEqual(r.data, [2]);
  });
});

const REPOS = [
  { name: 'a', description: 'A', language: 'Go', stargazers_count: 3, fork: false, archived: false, html_url: 'u/a', pushed_at: '2026-10-02T10:00:00Z' },
  { name: 'b', description: null, language: 'Go', stargazers_count: 1, fork: false, archived: false, html_url: 'u/b', pushed_at: '2026-09-01T10:00:00Z' },
  { name: 'c', description: 'C', language: 'TypeScript', stargazers_count: 0, fork: false, archived: false, html_url: 'u/c', pushed_at: '2026-10-01T10:00:00Z' },
  { name: 'f', description: 'fork', language: 'PHP', stargazers_count: 9, fork: true, archived: false, html_url: 'u/f', pushed_at: '2026-10-03T10:00:00Z' },
  { name: 'z', description: 'old', language: 'Java', stargazers_count: 0, fork: false, archived: true, html_url: 'u/z', pushed_at: '2020-01-01T00:00:00Z' },
  { name: 'n', description: 'none', language: null, stargazers_count: 0, fork: false, archived: false, html_url: 'u/n', pushed_at: '2026-08-01T10:00:00Z' },
];

test('summarizeRepos ignores forks and archived repos and ranks languages', () => {
  const s = summarizeRepos(REPOS);
  assert.equal(s.count, 4);
  assert.equal(s.stars, 4);
  assert.deepEqual(s.languages.map((l) => [l.name, l.count]), [['Go', 2], ['TypeScript', 1]]);
  assert.ok(Math.abs(s.languages[0].share - 2 / 3) < 1e-9);
  assert.deepEqual(s.top.map((r) => r.name), ['a', 'c', 'b', 'n']);
  assert.equal(s.top[1].description, 'C');
  assert.equal(s.top[2].description, '');
});

test('summarizeRepos copes with an empty list', () => {
  assert.deepEqual(summarizeRepos([]), { count: 0, stars: 0, languages: [], top: [] });
});

test('activityByDay counts push commits and other events per UTC day', () => {
  const events = [
    { type: 'PushEvent', created_at: '2026-10-02T23:59:00Z', payload: { size: 3 } },
    { type: 'PushEvent', created_at: '2026-10-02T01:00:00Z', payload: {} },
    { type: 'IssuesEvent', created_at: '2026-10-03T00:00:00Z', payload: {} },
    { type: 'WatchEvent', created_at: 'garbage', payload: {} },
  ];
  const a = activityByDay(events);
  assert.deepEqual(a.byDate, { '2026-10-02': 4, '2026-10-03': 1 });
  assert.equal(a.total, 5);
  assert.deepEqual(activityByDay([]), { byDate: {}, total: 0 });
});

test('heatmapSvg draws weeks x 7 cells up to today and shades by level', () => {
  const now = Date.UTC(2026, 9, 7); // a Wednesday
  const svg = heatmapSvg({}, { weeks: 13, now });
  assert.equal((svg.match(/<rect /g) || []).length, 12 * 7 + 4);
  assert.ok(svg.startsWith('<svg'));
  const busy = heatmapSvg({ '2026-10-07': 5, '2026-10-06': 1 }, { weeks: 13, now });
  assert.equal((busy.match(/class="h4"/g) || []).length, 1);
  assert.equal((busy.match(/class="h1"/g) || []).length, 1);
  assert.match(busy, /2026-10-07: 5/);
});

test('languageBarsSvg draws a track and a fill per language and escapes names', () => {
  const svg = languageBarsSvg([{ name: 'Go', share: 0.5 }, { name: '<b>', share: 0.25 }]);
  assert.equal((svg.match(/<rect /g) || []).length, 4);
  assert.ok(svg.includes('&lt;b&gt;'));
  assert.ok(!svg.includes('<b>'));
  assert.match(svg, /50%/);
});

test('HTTP 429 is reported as a rate limit', async () => {
  await withStorage(memStorage(), async () => {
    await assert.rejects(() => cachedJson('https://x/429', { fetchFn: async () => ({ ok: false, status: 429 }) }), /rate limit/i);
  });
});

test('cachedAll settles every request so one failure does not hide the others', async () => {
  await withStorage(memStorage(), async () => {
    const fetchFn = async (url) => (url.endsWith('/bad') ? { ok: false, status: 500 } : okResponse({ url }));
    const r = await cachedAll(['https://x/a', 'https://x/bad', 'https://x/c'], { fetchFn });
    assert.deepEqual(r.map((x) => x.ok), [true, false, true]);
    assert.deepEqual(r[0].value.data, { url: 'https://x/a' });
    assert.match(r[1].error, /GitHub API error 500/);
  });
});

test('activityByDay ignores non-numeric push sizes', () => {
  const a = activityByDay([{ type: 'PushEvent', created_at: '2026-10-02T00:00:00Z', payload: { size: '<svg onload=x>' } }]);
  assert.deepEqual(a.byDate, { '2026-10-02': 1 });
});
