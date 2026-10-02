import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, escapeHtml as e } from './src/lib/template.mjs';
import { ICONS } from './src/lib/icons.mjs';
import { monthsBetween, formatDuration } from './assets/js/duration.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
export const LANGS = ['en', 'ru', 'kz'];
const HTML_LANG = { en: 'en', ru: 'ru', kz: 'kk' };
const OG_LOCALE = { en: 'en_US', ru: 'ru_RU', kz: 'kk_KZ' };
const URL_PATH = { en: '/', ru: '/ru/', kz: '/kz/' };
const OUT_FILE = { en: 'index.html', ru: 'ru/index.html', kz: 'kz/index.html' };
const SWITCH_LABEL = { en: 'EN', ru: 'РУ', kz: 'ҚАЗ' };

const read = (p) => readFile(join(ROOT, p), 'utf8');
const readJson = async (p) => JSON.parse(await read(p));

const socials = (site) =>
  site.links
    .map((l) => `<a class="social-link" href="${e(l.href)}" target="_blank" rel="noopener noreferrer" aria-label="${e(l.label)}">${ICONS[l.id]}<span>${e(l.label)}</span></a>`)
    .join('\n');

const chips = (list) => list.map((n) => `<li class="chip">${e(n)}</li>`).join('');

function experience(site, s, lang, now) {
  return site.experience
    .map((x) => {
      const t = s.experience[x.id];
      const duration = x.current
        ? ` <span aria-hidden="true">·</span> <span data-duration data-start="${e(x.start)}" data-lang="${lang}">${e(formatDuration(monthsBetween(x.start, now), lang))}</span>`
        : '';
      return `<article class="entry">
  <h3 class="entry__title">${e(t.role)} <span class="entry__at">@ ${e(t.company)}</span></h3>
  <p class="entry__meta">${e(t.period)}${duration}</p>
  <p>${e(t.desc)}</p>
</article>`;
    })
    .join('\n');
}

function education(site, s) {
  return site.education
    .map((x) => {
      const t = s.education[x.id];
      return `<article class="entry">
  <h3 class="entry__title"><a href="${e(x.url)}" target="_blank" rel="noopener noreferrer">${e(t.title)}</a></h3>
  <p class="entry__meta">${e(t.period)}</p>
  <p>${e(t.desc)}</p>
</article>`;
    })
    .join('\n');
}

function projects(site, s) {
  if (site.projects.length === 0) {
    return `<p class="muted">${e(s.projects.empty)}</p>
<p><a class="btn" href="${e(site.links.find((l) => l.id === 'github').href)}" target="_blank" rel="noopener noreferrer">${e(s.projects.github)}</a></p>`;
  }
  return `<ul class="project-list">${site.projects
    .map((p) => `<li><a href="${e(p.url)}" target="_blank" rel="noopener noreferrer">${e(p.title)}</a> — ${e(p.description)}</li>`)
    .join('')}</ul>`;
}

function langSwitch(lang, s) {
  return LANGS.map((l) => {
    const current = l === lang ? ' aria-current="true"' : '';
    const beta = l === 'kz' ? `<sup class="beta" title="${e(s.lang.beta_title)}">${e(s.lang.beta)}</sup>` : '';
    return `<a class="lang__item" href="${URL_PATH[l]}" hreflang="${HTML_LANG[l]}" lang="${HTML_LANG[l]}" data-lang-link="${l}"${current}>${SWITCH_LABEL[l]}${beta}</a>`;
  }).join('');
}

const alternates = (site) =>
  LANGS.map((l) => `<link rel="alternate" hreflang="${HTML_LANG[l]}" href="${site.origin}${URL_PATH[l]}">`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${site.origin}/">`)
    .join('\n');

const jsonForScript = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

const sitemap = (site) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${LANGS.map(
    (l) => `  <url><loc>${site.origin}${URL_PATH[l]}</loc></url>`,
  ).join('\n')}\n</urlset>\n`;

export async function build({ now = new Date() } = {}) {
  const [site, homeTpl, notFoundTpl, headScript] = await Promise.all([
    readJson('src/data/site.json'),
    read('src/templates/home.html'),
    read('src/templates/404.html'),
    read('src/templates/head-script.html'),
  ]);
  const pages = new Map();

  for (const lang of LANGS) {
    const s = await readJson(`i18n/${lang}.json`);
    const raw = {
      lang,
      htmlLang: HTML_LANG[lang],
      ogLocale: OG_LOCALE[lang],
      origin: site.origin,
      canonical: `${site.origin}${URL_PATH[lang]}`,
      homePath: URL_PATH[lang],
      year: String(now.getUTCFullYear()),
      headScript: headScript.trim(),
      alternates: alternates(site),
      socials: socials(site),
      stackMain: chips(site.stack.main),
      stackHobby: chips(site.stack.hobby),
      experience: experience(site, s, lang, now),
      education: education(site, s),
      projects: projects(site, s),
      langSwitch: langSwitch(lang, s),
      terminalData: jsonForScript({
        i18n: s.terminal,
        stack: site.stack,
        links: site.links.map(({ label, href }) => ({ label, href })),
      }),
    };
    pages.set(OUT_FILE[lang], render(homeTpl, s, raw));
  }

  const en = await readJson('i18n/en.json');
  pages.set('404.html', render(notFoundTpl, en, { headScript: headScript.trim() }));
  pages.set('sitemap.xml', sitemap(site));
  return pages;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pages = await build();
  for (const [path, content] of pages) {
    const file = join(ROOT, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
    console.log('wrote', path);
  }
}
