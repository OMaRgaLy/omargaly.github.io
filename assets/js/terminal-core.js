const THEMES = ['dark', 'light', 'toggle'];
const LANGS = ['en', 'ru', 'kz'];
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export function runCommand(input, data) {
  const t = data.i18n;
  const [first = '', ...args] = input.trim().split(/\s+/);
  const cmd = first.toLowerCase();
  if (!cmd) return { lines: [] };

  switch (cmd) {
    case 'help':
      return { lines: [...t.help] };
    case 'whoami':
      return { lines: [...t.whoami] };
    case 'now':
      return { lines: [...t.now] };
    case 'lab':
      return { lines: [...t.lab], action: { type: 'goto', value: '/lab/' } };
    case 'stack':
      return { lines: [`${t.stack_main}: ${data.stack.main.join(', ')}`, `${t.stack_hobby}: ${data.stack.hobby.join(', ')}`] };
    case 'contact':
      return { lines: data.links.map((l) => `${l.label.padEnd(9)} ${l.href}`) };
    case 'clear':
      return { lines: [], action: { type: 'clear' } };
    case 'exit':
    case 'quit':
      return { lines: [], action: { type: 'close' } };
    case 'theme': {
      const v = (args[0] ?? '').toLowerCase();
      if (!THEMES.includes(v)) return { lines: [t.usage_theme] };
      return { lines: [fill(t.theme_set, { value: v })], action: { type: 'theme', value: v } };
    }
    case 'lang': {
      const v = (args[0] ?? '').toLowerCase();
      if (!LANGS.includes(v)) return { lines: [t.usage_lang] };
      return { lines: [fill(t.lang_switching, { value: v })], action: { type: 'lang', value: v } };
    }
    case 'secret':
      if (!data.hidden?.secret) return { lines: [fill(t.not_found, { cmd: first })] };
      return { lines: ['access granted', data.hidden.secret] };
    default:
      return { lines: [fill(t.not_found, { cmd: first })] };
  }
}

export function createKonami(onMatch) {
  let i = 0;
  return (key) => {
    const k = key.length === 1 ? key.toLowerCase() : key;
    if (k === KONAMI[i]) {
      i += 1;
      if (i === KONAMI.length) {
        i = 0;
        onMatch();
      }
    } else {
      i = k === KONAMI[0] ? 1 : 0;
    }
  };
}
