import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, escapeHtml as e } from './template.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFile(join(ROOT, p), 'utf8');
const jsonForScript = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

function card(t) {
  const tags = `<ul class="tags">${t.tags.map((x) => `<li class="tag">${e(x)}</li>`).join('')}</ul>`;
  const live = t.status === 'live';
  const inner = `<h2>${e(t.title)}${live ? '' : ' <span class="badge">Soon</span>'}</h2><p>${e(t.description)}</p>${tags}`;
  return live
    ? `<a class="tool-card" href="/lab/${e(t.id)}/">${inner}</a>`
    : `<div class="tool-card tool-card--soon">${inner}</div>`;
}

export async function buildLab({ site, headScript, ctf, now = new Date() }) {
  const lab = JSON.parse(await read('src/data/lab.json'));
  const tpl = await read('src/templates/lab.html');

  const page = ({ path, title, description, heading, intro, body, script, back }) =>
    render(tpl, {}, {
      title: e(title),
      description: e(description),
      canonical: `${site.origin}${path}`,
      origin: site.origin,
      headScript,
      heading: e(heading),
      intro: intro ? `<p class="lab-intro">${e(intro)}</p>` : '',
      back: back ? '<p class="lab-back"><a href="/lab/">← Lab</a></p>' : '',
      body,
      script,
      year: String(now.getUTCFullYear()),
    });

  const pages = new Map();
  const urls = ['/lab/'];

  pages.set(
    'lab/index.html',
    page({
      path: '/lab/',
      title: 'Lab — Omargaly Bitebayev',
      description: 'Small developer and CTF tools that run entirely in your browser.',
      heading: 'Lab',
      intro: 'Small developer and CTF tools. Everything runs in your browser; nothing you type leaves your device.',
      body: `<div class="tool-grid">\n${lab.tools.map(card).join('\n')}\n</div>`,
      script: '/assets/js/lab/index.js',
      back: false,
    }),
  );

  for (const t of lab.tools.filter((x) => x.status === 'live')) {
    const fragment = await read(`src/lab/${t.id}.html`);
    const body = render(fragment, {}, { ctfData: jsonForScript(ctf.challenges) });
    pages.set(
      `lab/${t.id}/index.html`,
      page({
        path: `/lab/${t.id}/`,
        title: `${t.title} — Lab`,
        description: t.description,
        heading: t.title,
        intro: t.description,
        body,
        script: `/assets/js/lab/${t.id}.js`,
        back: true,
      }),
    );
    urls.push(`/lab/${t.id}/`);
  }

  return { pages, urls };
}
