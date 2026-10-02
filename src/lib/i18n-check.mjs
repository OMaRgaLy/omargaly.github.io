function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) out[p] = `[${v.length}]`;
    else if (v && typeof v === 'object') flatten(v, p, out);
    else out[p] = 'string';
  }
  return out;
}

export function assertSameKeys(reference, other, lang) {
  const a = flatten(reference);
  const b = flatten(other);
  const missing = Object.keys(a).filter((k) => !(k in b));
  const extra = Object.keys(b).filter((k) => !(k in a));
  const shape = Object.keys(a).filter((k) => k in b && a[k] !== b[k]);
  const problems = [
    ...missing.map((k) => `${lang}: missing key ${k}`),
    ...extra.map((k) => `${lang}: extra key ${k}`),
    ...shape.map((k) => `${lang}: ${k} has a different shape (${b[k]} vs ${a[k]})`),
  ];
  if (problems.length) throw new Error(`i18n mismatch:\n${problems.join('\n')}`);
}
