import { readStored, writeStored } from '../../storage.js';

const TTL = 30 * 60 * 1000;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function cachedJson(url, { fetchFn = (...a) => fetch(...a), now = Date.now(), ttl = TTL } = {}) {
  const key = `pulse:${url}`;
  let cached = null;
  const raw = readStored(key);
  if (raw) {
    try {
      cached = JSON.parse(raw);
    } catch {
      cached = null;
    }
  }
  if (cached && now - cached.t < ttl) return { data: cached.d, source: 'cache', stale: false };
  try {
    const res = await fetchFn(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(res.status === 403 || res.status === 429 ? 'GitHub rate limit reached, try again later' : `GitHub API error ${res.status}`);
    const data = await res.json();
    writeStored(key, JSON.stringify({ t: now, d: data }));
    return { data, source: 'network', stale: false };
  } catch (err) {
    if (cached) return { data: cached.d, source: 'cache', stale: true, error: err.message };
    throw err;
  }
}

export async function cachedAll(urls, opts) {
  const settled = await Promise.allSettled(urls.map((u) => cachedJson(u, opts)));
  return settled.map((r) => (r.status === 'fulfilled' ? { ok: true, value: r.value } : { ok: false, error: r.reason?.message ?? String(r.reason) }));
}

export function summarizeRepos(repos) {
  const own = repos.filter((r) => !r.fork && !r.archived);
  const byLang = new Map();
  for (const r of own) if (r.language) byLang.set(r.language, (byLang.get(r.language) ?? 0) + 1);
  const withLang = [...byLang.values()].reduce((s, n) => s + n, 0);
  const languages = [...byLang.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count, share: count / withLang }));
  const top = [...own]
    .sort((a, b) => String(b.pushed_at).localeCompare(String(a.pushed_at)))
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      description: r.description ?? '',
      language: r.language ?? null,
      stars: r.stargazers_count ?? 0,
      url: r.html_url,
      pushedAt: r.pushed_at,
    }));
  return { count: own.length, stars: own.reduce((s, r) => s + (r.stargazers_count ?? 0), 0), languages, top };
}

export function activityByDay(events) {
  const byDate = {};
  let total = 0;
  for (const ev of events) {
    const t = Date.parse(ev.created_at);
    if (Number.isNaN(t)) continue;
    const day = new Date(t).toISOString().slice(0, 10);
    const n = ev.type === 'PushEvent' ? ev.payload?.size || 1 : 1;
    byDate[day] = (byDate[day] ?? 0) + n;
    total += n;
  }
  return { byDate, total };
}

const DAY = 86400000;
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

export function heatmapSvg(byDate, { weeks = 13, now = Date.now() } = {}) {
  const today = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  const weekStart = today - new Date(today).getUTCDay() * DAY;
  const start = weekStart - (weeks - 1) * 7 * DAY;
  const max = Math.max(1, ...Object.values(byDate));
  const size = 12;
  const gap = 3;
  const width = weeks * (size + gap) - gap;
  const height = 7 * (size + gap) - gap;
  const cells = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const day = start + (w * 7 + d) * DAY;
      if (day > today) continue;
      const key = isoDay(day);
      const n = byDate[key] ?? 0;
      const level = n === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((n / max) * 4)));
      cells.push(
        `<rect class="h${level}" x="${w * (size + gap)}" y="${d * (size + gap)}" width="${size}" height="${size}" rx="3"><title>${key}: ${n}</title></rect>`,
      );
    }
  }
  return `<svg class="hm chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Activity over the last ${weeks} weeks">${cells.join('')}</svg>`;
}

export function languageBarsSvg(languages) {
  const row = 28;
  const labelW = 110;
  const barW = 220;
  const rows = languages
    .map((l, i) => {
      const y = i * row;
      const pct = Math.round(l.share * 100);
      return (
        `<text x="0" y="${y + 14}">${esc(l.name)}</text>` +
        `<rect class="track" x="${labelW}" y="${y + 5}" width="${barW}" height="10" rx="5"/>` +
        `<rect class="fill" x="${labelW}" y="${y + 5}" width="${Math.max(2, Math.round(barW * l.share))}" height="10" rx="5"/>` +
        `<text x="${labelW + barW + 8}" y="${y + 14}">${pct}%</text>`
      );
    })
    .join('');
  const height = Math.max(row, languages.length * row);
  return `<svg class="chart" viewBox="0 0 ${labelW + barW + 50} ${height}" role="img" aria-label="Languages by repository count">${rows}</svg>`;
}
