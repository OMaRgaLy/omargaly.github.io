const INITIALISMS = new Set(['id', 'url', 'uri', 'http', 'https', 'api', 'json', 'html', 'xml', 'sql', 'ip', 'uuid', 'ui', 'uid', 'ascii', 'tcp', 'udp', 'ttl', 'cpu', 'ram']);

export function toGoName(key) {
  const parts = String(key).split(/[^A-Za-z0-9]+/).filter(Boolean);
  let name = parts
    .map((p) => (INITIALISMS.has(p.toLowerCase()) ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1)))
    .join('');
  if (!name) name = 'Field';
  if (/^[0-9]/.test(name)) name = `X${name}`;
  return name;
}

const singular = (name) => (name.length > 3 && name.endsWith('s') && !name.endsWith('ss') ? name.slice(0, -1) : name);

// type tree: 'string' | 'bool' | 'int' | 'int64' | 'float64' | 'null' | 'any'
//          | { kind: 'array', elem } | { kind: 'object', fields: Map<string, { type, count }>, total }
function infer(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return { kind: 'array', elem: value.map(infer).reduce(merge, undefined) ?? 'any' };
  switch (typeof value) {
    case 'string': return 'string';
    case 'boolean': return 'bool';
    case 'number':
      if (!Number.isInteger(value)) return 'float64';
      return Math.abs(value) > 2147483647 ? 'int64' : 'int';
    default: {
      const fields = new Map();
      for (const [k, v] of Object.entries(value)) fields.set(k, { type: infer(v), count: v === null ? 0 : 1 });
      return { kind: 'object', fields, total: 1 };
    }
  }
}

const isNum = (t) => t === 'int' || t === 'int64' || t === 'float64';

function merge(a, b) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (a === b) return a;
  if (a === 'null') return b;
  if (b === 'null') return a;
  if (isNum(a) && isNum(b)) return a === 'float64' || b === 'float64' ? 'float64' : 'int64';
  if (typeof a === 'object' && typeof b === 'object' && a.kind === b.kind) {
    if (a.kind === 'array') return { kind: 'array', elem: merge(a.elem, b.elem) };
    const fields = new Map();
    for (const [k, f] of a.fields) fields.set(k, { type: f.type, count: f.count });
    for (const [k, f] of b.fields) {
      const cur = fields.get(k);
      fields.set(k, cur ? { type: merge(cur.type, f.type), count: cur.count + f.count } : { type: f.type, count: f.count });
    }
    return { kind: 'object', fields, total: a.total + b.total };
  }
  return 'any';
}

export function jsonToGo(jsonText, { rootName = 'Root' } = {}) {
  let value;
  try {
    value = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }
  const structs = []; // { name, fields: [{ goName, goType, tag }] }
  const used = new Set();
  const unique = (base) => {
    let name = base;
    for (let i = 2; used.has(name); i++) name = `${base}${i}`;
    used.add(name);
    return name;
  };

  function goType(type, hint) {
    if (type === 'null' || type === 'any') return 'interface{}';
    if (typeof type === 'string') return type;
    if (type.kind === 'array') return `[]${goType(type.elem, type.elem && type.elem.kind === 'object' ? singular(hint) : hint)}`;
    const name = unique(hint);
    const entry = { name, fields: [] };
    structs.push(entry);
    const seen = new Set();
    for (const [key, f] of type.fields) {
      let goName = toGoName(key);
      for (let i = 2; seen.has(goName); i++) goName = `${toGoName(key)}${i}`;
      seen.add(goName);
      const optional = f.count < type.total || undefined;
      entry.fields.push({
        goName,
        goType: goType(f.type, toGoName(key)),
        tag: `json:"${key}${optional ? ',omitempty' : ''}"`,
      });
    }
    return name;
  }

  const rootType = infer(value);
  const rootHint = rootType && rootType.kind === 'array' ? `${rootName}Item` : rootName;
  const top = goType(rootType, rootHint);
  const lines = [];
  if (!structs.length || structs[0].name !== top) {
    lines.push(`type ${rootName} ${top}`, '');
  }
  for (const s of structs) {
    const nameW = Math.max(...s.fields.map((f) => f.goName.length), 0);
    const typeW = Math.max(...s.fields.map((f) => f.goType.length), 0);
    lines.push(`type ${s.name} struct {`);
    for (const f of s.fields) lines.push(`\t${f.goName.padEnd(nameW)} ${f.goType.padEnd(typeW)} \`${f.tag}\``);
    lines.push('}', '');
  }
  return lines.join('\n').replace(/\n\n$/, '\n');
}

// --- Go -> JSON ---------------------------------------------------------

function parseStructs(src) {
  const structs = new Map();
  for (const m of src.matchAll(/type\s+(\w+)\s+struct\s*\{/g)) {
    const start = m.index + m[0].length;
    let depth = 1;
    let end = start;
    while (end < src.length && depth > 0) {
      if (src[end] === '{') depth += 1;
      else if (src[end] === '}') depth -= 1;
      end += 1;
    }
    const fields = [];
    for (const raw of src.slice(start, end - 1).split('\n')) {
      const line = raw.replace(/\/\/.*$/, '').trim();
      const f = line.match(/^(\w+)\s+(\S+)(?:\s+`([^`]*)`)?/);
      if (!f) continue;
      const tag = f[3]?.match(/json:"([^"]*)"/)?.[1];
      if (tag === '-') continue;
      const name = tag ? tag.split(',')[0] || f[1] : f[1];
      fields.push({ name, type: f[2] });
    }
    structs.set(m[1], fields);
  }
  return structs;
}

function sample(type, structs, depth, stack = new Set()) {
  if (depth > 5) return null;
  if (type.startsWith('*')) return sample(type.slice(1), structs, depth, stack);
  if (type.startsWith('[]')) return [sample(type.slice(2), structs, depth + 1, stack)];
  const map = type.match(/^map\[string\](.+)$/);
  if (map) return { key: sample(map[1], structs, depth + 1, stack) };
  if (type === 'string') return 'string';
  if (type === 'bool') return false;
  if (/^u?int(8|16|32|64)?$/.test(type) || /^float(32|64)$/.test(type)) return 0;
  if (type === 'time.Time') return '2006-01-02T15:04:05Z';
  if (structs.has(type)) {
    if (stack.has(type)) return null; // a type that contains itself is cut here instead of expanded again
    stack.add(type);
    const value = Object.fromEntries(structs.get(type).map((f) => [f.name, sample(f.type, structs, depth + 1, stack)]));
    stack.delete(type);
    return value;
  }
  return null;
}

export function goToJson(goSource) {
  const structs = parseStructs(goSource);
  if (!structs.size) throw new Error('No struct found');
  const [rootName] = structs.keys();
  return JSON.stringify(sample(rootName, structs, 0), null, 2);
}
