const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c]);
}

export function lookup(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function render(tpl, strings, raw = {}) {
  return tpl
    .replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, k) => {
      if (!(k in raw)) throw new Error(`Missing raw fragment: ${k}`);
      return raw[k];
    })
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
      const v = lookup(strings, k);
      if (typeof v !== 'string') throw new Error(`Missing string: ${k}`);
      return escapeHtml(v);
    });
}
