const UNITS = {
  en: { y: (n) => (n === 1 ? 'yr' : 'yrs'), m: (n) => (n === 1 ? 'mo' : 'mos'), lt: '< 1 mo' },
  ru: { y: () => 'г.', m: () => 'мес.', lt: '< 1 мес.' },
  kz: { y: () => 'жыл', m: () => 'ай', lt: '< 1 ай' },
};

export function monthsBetween(startIso, now = new Date()) {
  const [y, m, d] = startIso.split('-').map(Number);
  let months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - m);
  if (now.getUTCDate() < (d || 1)) months -= 1;
  return Math.max(0, months);
}

export function formatDuration(months, lang = 'en') {
  const u = UNITS[lang] ?? UNITS.en;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${u.y(years)}`);
  if (rest) parts.push(`${rest} ${u.m(rest)}`);
  return parts.length ? parts.join(' ') : u.lt;
}

export function initDuration(root = document) {
  root.querySelectorAll('[data-duration]').forEach((el) => {
    el.textContent = formatDuration(monthsBetween(el.dataset.start), el.dataset.lang);
  });
}
