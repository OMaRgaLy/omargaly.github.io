export function parseTimestamp(input) {
  const s = input.trim();
  if (!s) throw new Error('Enter a timestamp or a date');
  let ms;
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    ms = Math.abs(n) >= 1e11 ? n : n * 1000;
  } else {
    ms = Date.parse(s);
  }
  const date = new Date(ms);
  if (!Number.isFinite(ms) || Number.isNaN(date.getTime())) throw new Error('Could not parse that as a timestamp or a date');
  return { seconds: Math.floor(ms / 1000), milliseconds: Math.round(ms), iso: date.toISOString() };
}

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

export function relativeTime(ms, now = Date.now()) {
  const diff = Math.round((ms - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(diff) >= size || unit === 'second') return rtf.format(Math.round(diff / size), unit);
  }
}
