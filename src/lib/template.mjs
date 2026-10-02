const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c]);
}

export function lookup(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function render(tpl, strings, raw = {}) {
  return tpl.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{\s*([\w.]+)\s*\}\}/g, (_, rawKey, key) => {
    if (rawKey !== undefined) {
      if (!(rawKey in raw)) throw new Error(`Missing raw fragment: ${rawKey}`);
      return raw[rawKey];
    }
    const v = lookup(strings, key);
    if (typeof v !== 'string') throw new Error(`Missing string: ${key}`);
    return escapeHtml(v);
  });
}
