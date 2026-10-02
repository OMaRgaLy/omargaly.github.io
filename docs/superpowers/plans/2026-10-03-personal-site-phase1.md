# Personal Site — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old two-page site with a modern, fast, three-language (EN/RU/KZ) personal site with a terminal easter egg, built from shared data by a dependency-free Node script.

**Architecture:** Static HTML/CSS/ES-modules, no framework, no runtime CDN. `build.mjs` renders `/`, `/ru/`, `/kz/` (plus `404.html` and `sitemap.xml`) from one HTML template, `i18n/*.json` and `src/data/site.json`; generated files are committed because GitHub Pages serves the branch as-is. Pure logic (duration, template engine, terminal commands, storage) lives in DOM-free modules covered by `node:test`.

**Tech Stack:** HTML, CSS (custom properties), vanilla JS ES modules, Node 22 (`node:test`), `sharp` and `@fontsource-variable/*` as one-off dev tools for images and fonts.

**Spec:** `docs/superpowers/specs/2026-10-03-personal-site-redesign-design.md` (this plan covers its **Phase 1**; `/lab` is a separate Phase 2 plan).

## Global Constraints

- Static hosting only (GitHub Pages, served from `main` root). No backend. No runtime CDN: fonts and everything else are self-hosted.
- Languages: EN default, plus RU and KZ. URLs `/`, `/ru/`, `/kz/`. `<html lang>` values: `en`, `ru`, `kk`. KZ shows a visible **beta** badge.
- Texts only in `i18n/{en,ru,kz}.json`; content lists (links, stack, experience, education, projects) only in `src/data/site.json`.
- Positioning copy: title **"Software Engineer · Backend & AI"**, tagline "Go backend engineer, growing into AI engineering." No "senior" progress line.
- Experience: Kwaaka — Golang Backend Developer, **Mar 2025 — Present**, start date `2025-03-17`, duration computed automatically. Company described only in business terms; no task list, no systems named, no internal AI project.
- Avatar: the existing photo, kept (source moves to `scripts/source/avatar.jpg`).
- Dark theme default; light theme toggle; respect `prefers-color-scheme` on first visit; colours as CSS tokens.
- Responsive from 360px wide; keyboard accessible with visible focus; `prefers-reduced-motion` disables animations; the page content is readable without JS.
- `localStorage` access is always wrapped in try/catch (use `assets/js/storage.js`).
- Targets: home page under about 150 KB excluding fonts; Lighthouse 95+ on mobile.
- Terminal: opens with `` ` `` key, Konami code, or a button; closes with Esc; renders output with `textContent` only (never `innerHTML`).
- Every commit message ends with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (passed as a second `-m`).
- Nothing is pushed to the remote without the owner's explicit OK.

## Review Focus

1. `localStorage` missing or throwing (private window, blocked site data): site renders, theme/lang toggles still work in memory — pinned in Task 6 (`storage.js` tests).
2. Terminal input that is empty, padded with spaces, upper-case, or contains HTML (`<img onerror=…>`): no output/no crash, command match is case-insensitive, text is never interpreted as markup — pinned in Task 7.
3. Duration edge cases: start date in the future, exactly on the monthly anniversary, start on the 31st versus a shorter month — pinned in Task 2.
4. A missing or extra translation key in one language: the build fails loudly instead of shipping a page with a hole — pinned in Tasks 3 and 4.
5. Long Cyrillic/Kazakh words and Kazakh-specific letters (ә ғ қ ң ө ұ ү һ і) at 360px width: no horizontal scroll and no fallback-font glyphs — pinned by CSS `overflow-wrap` in Task 5 and the manual checklist in Task 9; a tampered `localStorage.lang` value (e.g. `evil`) must not redirect — manual checklist in Task 9.

---

## File Structure

```
package.json, package-lock.json, .gitignore, _config.yml
build.mjs                          renders pages (exports build())
src/lib/template.mjs               render(), escapeHtml(), lookup()
src/lib/icons.mjs                  inline SVG icon strings
src/data/site.json                 links, stack, experience, education, projects
src/templates/head-script.html     inline pre-paint theme/lang script
src/templates/home.html            home page template
src/templates/404.html             404 template
i18n/en.json, ru.json, kz.json     all copy
assets/css/tokens.css              fonts + design tokens
assets/css/base.css                reset + typography
assets/css/components.css          header, hero, bento, chips, footer, terminal
assets/js/duration.js              monthsBetween(), formatDuration(), initDuration()
assets/js/storage.js               readStored(), writeStored()
assets/js/theme.js                 getTheme(), setTheme(), toggleTheme(), initTheme()
assets/js/lang.js                  langPath(), setLangPref(), initLang()
assets/js/reveal.js                initReveal()
assets/js/terminal-core.js         runCommand(), createKonami()   (pure)
assets/js/terminal.js              initTerminal()                 (DOM)
assets/js/main.js                  entry point
assets/fonts/*.woff2, assets/img/* generated assets
scripts/copy-fonts.mjs, scripts/optimize-images.mjs, scripts/source/avatar.jpg
tests/*.test.mjs
robots.txt
```

---

### Task 1: Tooling and repository hygiene

**Files:**
- Create: `package.json`, `.gitignore`, `_config.yml`

**Interfaces:**
- Produces: npm scripts `build`, `test`, `serve`, `images`, `fonts`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "omargaly.github.io",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.mjs",
    "test": "node --test tests/",
    "serve": "npx --yes http-server . -p 8080 -c-1",
    "images": "node scripts/optimize-images.mjs",
    "fonts": "node scripts/copy-fonts.mjs"
  },
  "devDependencies": {
    "@fontsource-variable/inter": "^5.1.0",
    "@fontsource-variable/jetbrains-mono": "^5.1.0",
    "sharp": "^0.33.5"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.idea/
```

- [ ] **Step 3: Create `_config.yml`** (GitHub Pages runs Jekyll; keep build sources and docs out of the published site)

```yaml
exclude:
  - build.mjs
  - package.json
  - package-lock.json
  - node_modules
  - docs
  - scripts
  - src
  - i18n
  - tests
```

- [ ] **Step 4: Stop tracking `.idea/` and install dev tools**

Run:
```bash
git rm -r --cached .idea
npm install
```
Expected: `.idea/` files listed as removed from the index (files stay on disk); `npm install` creates `package-lock.json` and `node_modules/`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore _config.yml
git commit -m "chore: add tooling, ignore .idea, exclude sources from Pages" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Duration module

**Files:**
- Create: `assets/js/duration.js`
- Test: `tests/duration.test.mjs`

**Interfaces:**
- Produces:
  - `monthsBetween(startIso: string, now?: Date): number` — whole months elapsed (UTC), never negative.
  - `formatDuration(months: number, lang?: 'en'|'ru'|'kz'): string`
  - `initDuration(root?: Document): void` — updates every `[data-duration]` element using its `data-start` and `data-lang`.

- [ ] **Step 1: Write the failing test**

```js
// tests/duration.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { monthsBetween, formatDuration } from '../assets/js/duration.js';

const day = (s) => new Date(`${s}T12:00:00Z`);

test('month is not counted before its day-of-month', () => {
  assert.equal(monthsBetween('2025-03-17', day('2026-10-03')), 18);
});

test('month is counted on the anniversary day', () => {
  assert.equal(monthsBetween('2025-03-17', day('2026-10-17')), 19);
});

test('a start date in the future yields 0', () => {
  assert.equal(monthsBetween('2027-01-01', day('2026-10-03')), 0);
});

test('start on the 31st only counts whole months', () => {
  assert.equal(monthsBetween('2025-01-31', day('2025-02-28')), 0);
  assert.equal(monthsBetween('2025-01-31', day('2025-03-31')), 2);
});

test('formats English durations', () => {
  assert.equal(formatDuration(18, 'en'), '1 yr 6 mos');
  assert.equal(formatDuration(12, 'en'), '1 yr');
  assert.equal(formatDuration(25, 'en'), '2 yrs 1 mo');
  assert.equal(formatDuration(7, 'en'), '7 mos');
  assert.equal(formatDuration(0, 'en'), '< 1 mo');
});

test('formats Russian and Kazakh durations', () => {
  assert.equal(formatDuration(18, 'ru'), '1 г. 6 мес.');
  assert.equal(formatDuration(18, 'kz'), '1 жыл 6 ай');
});

test('unknown language falls back to English', () => {
  assert.equal(formatDuration(18, 'xx'), '1 yr 6 mos');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/duration.test.mjs`
Expected: FAIL — cannot find module `assets/js/duration.js`.

- [ ] **Step 3: Implement `assets/js/duration.js`**

```js
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test tests/duration.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add assets/js/duration.js tests/duration.test.mjs
git commit -m "feat: add duration module" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Template engine

**Files:**
- Create: `src/lib/template.mjs`
- Test: `tests/template.test.mjs`

**Interfaces:**
- Produces:
  - `escapeHtml(s: string): string`
  - `lookup(obj: object, path: string): unknown` — dotted path, `undefined` if absent.
  - `render(tpl: string, strings: object, raw?: Record<string,string>): string` — `{{a.b}}` inserts the **escaped** string at `strings.a.b`; `{{{name}}}` inserts `raw.name` verbatim. Throws `Missing string: <path>` / `Missing raw fragment: <name>`.

- [ ] **Step 1: Write the failing test**

```js
// tests/template.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, escapeHtml, lookup } from '../src/lib/template.mjs';

test('escapeHtml escapes markup characters', () => {
  assert.equal(escapeHtml(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('lookup follows dotted paths', () => {
  assert.equal(lookup({ a: { b: 'c' } }, 'a.b'), 'c');
  assert.equal(lookup({ a: {} }, 'a.b.c'), undefined);
});

test('render inserts escaped strings', () => {
  assert.equal(render('<p>{{a.b}}</p>', { a: { b: '<b>' } }), '<p>&lt;b&gt;</p>');
});

test('render inserts raw fragments verbatim', () => {
  assert.equal(render('<p>{{{x}}}</p>', {}, { x: '<b>ok</b>' }), '<p><b>ok</b></p>');
});

test('render throws on a missing string', () => {
  assert.throws(() => render('{{a.b}}', { a: {} }), /Missing string: a\.b/);
});

test('render throws on a non-string value', () => {
  assert.throws(() => render('{{a}}', { a: ['x'] }), /Missing string: a/);
});

test('render throws on a missing raw fragment', () => {
  assert.throws(() => render('{{{x}}}', {}, {}), /Missing raw fragment: x/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/template.test.mjs`
Expected: FAIL — cannot find module `src/lib/template.mjs`.

- [ ] **Step 3: Implement `src/lib/template.mjs`**

```js
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test tests/template.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/template.mjs tests/template.test.mjs
git commit -m "feat: add template engine" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Content — i18n files, site data, parity test

**Files:**
- Create: `i18n/en.json`, `i18n/ru.json`, `i18n/kz.json`, `src/data/site.json`
- Test: `tests/i18n.test.mjs`

**Interfaces:**
- Produces: string keys consumed by the templates in Task 5 (`meta.*`, `skip`, `nav.*`, `theme.toggle`, `terminal.*`, `hero.*`, `about.*`, `experience.*`, `education.*`, `stack.*`, `projects.*`, `lab.*`, `footer.built`, `lang.*`, `notfound.*`); `src/data/site.json` shape `{origin, links[], stack{main[],hobby[]}, experience[], education[], projects[]}`.
- `terminal` object holds the arrays/strings read by `terminal-core.js` (Task 7): `help[]`, `whoami[]`, `now[]`, `lab[]`, `not_found`, `usage_theme`, `usage_lang`, `theme_set`, `lang_switching`, `stack_main`, `stack_hobby`.

- [ ] **Step 1: Write the failing parity test**

```js
// tests/i18n.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (l) => JSON.parse(readFileSync(new URL(`../i18n/${l}.json`, import.meta.url), 'utf8'));

// flatten to { 'a.b': 'string' | '[n]' } where arrays are leaves described by length
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) out[p] = `[${v.length}]`;
    else if (v && typeof v === 'object') flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}

const en = flatten(load('en'));

for (const lang of ['ru', 'kz']) {
  test(`${lang} has exactly the same keys and array lengths as en`, () => {
    const other = flatten(load(lang));
    assert.deepEqual(Object.keys(other).sort(), Object.keys(en).sort());
    for (const k of Object.keys(en)) {
      if (en[k].startsWith?.('[')) assert.equal(other[k], en[k], `array length differs at ${k}`);
    }
  });
}

for (const lang of ['en', 'ru', 'kz']) {
  test(`${lang} has no empty strings`, () => {
    for (const [k, v] of Object.entries(flatten(load(lang)))) {
      assert.ok(String(v).trim().length > 0, `${lang}: empty value at ${k}`);
    }
  });
}

test('site.json lists a start date for every current experience', () => {
  const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'));
  for (const x of site.experience) assert.match(x.start, /^\d{4}-\d{2}-\d{2}$/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/i18n.test.mjs`
Expected: FAIL — `ENOENT` for `i18n/en.json`.

- [ ] **Step 3: Create `src/data/site.json`**

```json
{
  "origin": "https://omargaly.github.io",
  "links": [
    { "id": "github", "label": "GitHub", "href": "https://github.com/OMaRgaLy" },
    { "id": "linkedin", "label": "LinkedIn", "href": "https://www.linkedin.com/in/bitebayev" },
    { "id": "telegram", "label": "Telegram", "href": "https://t.me/hackeevo" },
    { "id": "x", "label": "X", "href": "https://x.com/OMaRgaLy212" }
  ],
  "stack": {
    "main": ["Go", "TypeScript", "React", "Next.js", "Python", "MongoDB", "PostgreSQL", "Docker", "Coolify", "Grafana", "Loki", "Sentry", "Postman"],
    "hobby": ["PHP", "MySQL", "Elixir", "Redis", "Kafka", "gRPC", "REST"]
  },
  "experience": [
    { "id": "kwaaka", "start": "2025-03-17", "current": true }
  ],
  "education": [
    { "id": "kolesa", "url": "https://upgrade.kolesa.group/" },
    { "id": "sapsan", "url": "https://www.instagram.com/sapsan_code.kz/" }
  ],
  "projects": []
}
```

- [ ] **Step 4: Create `i18n/en.json`**

```json
{
  "meta": {
    "title": "Omargaly Bitebayev — Software Engineer · Backend & AI",
    "description": "Personal site of Omargaly Bitebayev: Go backend engineer growing into AI engineering."
  },
  "skip": "Skip to content",
  "nav": { "about": "About", "experience": "Experience", "stack": "Stack", "projects": "Projects", "lab": "Lab" },
  "theme": { "toggle": "Toggle theme" },
  "hero": {
    "hello": "Hi, I'm",
    "name": "Omargaly Bitebayev",
    "title": "Software Engineer · Backend & AI",
    "tagline": "Go backend engineer, growing into AI engineering.",
    "photo_alt": "Portrait of Omargaly Bitebayev",
    "cta_contact": "Say hi on Telegram",
    "cta_github": "GitHub"
  },
  "about": {
    "heading": "About",
    "p1": "I'm a backend engineer who likes to take a task and see it through to production. My day-to-day is Go, services and data, and I enjoy making complicated systems feel simple.",
    "p2": "I'm moving towards AI engineering — building agents and automation that do real work — and aiming to grow into a senior engineer along the way. I learn in public, share ideas and love a good code review.",
    "p3": "Always up for a chat about code, systems and AI."
  },
  "experience": {
    "heading": "Experience",
    "kwaaka": {
      "company": "Kwaaka",
      "role": "Golang Backend Developer",
      "period": "Mar 2025 — Present",
      "desc": "Kwaaka automates restaurant operations: it brings orders from many food-delivery platforms into the restaurant's own systems, so teams stop juggling tablets and work in one flow. I build backend services in Go and AI-driven automation for real business workflows."
    }
  },
  "education": {
    "heading": "Education",
    "kolesa": {
      "title": "Kolesa Upgrade",
      "period": "Sep — Nov 2022",
      "desc": "Backend development essentials: from PHP 8+ and Go basics to full-fledged web services — Slim, MySQL, Docker, HTTP and API design."
    },
    "sapsan": {
      "title": "Sapsan Code",
      "period": "Sep 2023 — May 2024",
      "desc": "Java backend from scratch: Spring Boot, REST APIs, authentication and Docker."
    }
  },
  "stack": { "heading": "Stack", "main": "Daily", "hobby": "Side projects & hobbies" },
  "projects": {
    "heading": "Projects",
    "empty": "Cooking something good. Check back soon.",
    "github": "Browse GitHub"
  },
  "lab": {
    "heading": "Lab",
    "text": "A playground of small dev and CTF tools is coming soon.",
    "badge": "Soon"
  },
  "footer": { "built": "Built by hand. No frameworks." },
  "lang": { "label": "Language", "beta": "beta", "beta_title": "Draft translation, proofreading in progress" },
  "notfound": { "title": "404 — Page not found", "text": "This page does not exist.", "home": "Back to home" },
  "terminal": {
    "label": "Terminal",
    "open": "Open terminal",
    "close": "Close",
    "prompt": "guest@omargaly:~$",
    "hint": "Type \"help\" to start. Esc to close.",
    "help": [
      "Available commands:",
      "  whoami   who am I",
      "  stack    what I work with",
      "  now      what I'm up to",
      "  contact  where to find me",
      "  lab      the playground",
      "  theme    dark | light | toggle",
      "  lang     en | ru | kz",
      "  clear    clear the screen",
      "  exit     close the terminal"
    ],
    "whoami": ["Omargaly Bitebayev", "Software Engineer · Backend & AI", "Go backend engineer, growing into AI engineering."],
    "now": ["Building backend services in Go at Kwaaka.", "Learning to build AI agents that do real work.", "Tinkering with side projects and CTF puzzles."],
    "lab": ["The lab is coming soon: dev and CTF tools in your browser."],
    "not_found": "command not found: {cmd}. Try \"help\".",
    "usage_theme": "usage: theme dark | light | toggle",
    "usage_lang": "usage: lang en | ru | kz",
    "theme_set": "theme: {value}",
    "lang_switching": "switching language: {value}...",
    "stack_main": "daily",
    "stack_hobby": "on the side"
  }
}
```

- [ ] **Step 5: Create `i18n/ru.json`**

```json
{
  "meta": {
    "title": "Omargaly Bitebayev — Software Engineer · Backend & AI",
    "description": "Личный сайт Omargaly Bitebayev: Go backend-инженер, растущий в сторону AI-инженерии."
  },
  "skip": "Перейти к содержимому",
  "nav": { "about": "Обо мне", "experience": "Опыт", "stack": "Стек", "projects": "Проекты", "lab": "Лаб" },
  "theme": { "toggle": "Сменить тему" },
  "hero": {
    "hello": "Привет, я",
    "name": "Omargaly Bitebayev",
    "title": "Software Engineer · Backend & AI",
    "tagline": "Go backend-инженер, расту в сторону AI-инженерии.",
    "photo_alt": "Портрет Omargaly Bitebayev",
    "cta_contact": "Написать в Telegram",
    "cta_github": "GitHub"
  },
  "about": {
    "heading": "Обо мне",
    "p1": "Я backend-инженер, который любит взять задачу и довести её до продакшена. В работе — Go, сервисы и данные; мне нравится делать сложные системы простыми.",
    "p2": "Двигаюсь в сторону AI-инженерии: строю агентов и автоматизацию, которые делают реальную работу, и по пути расту до senior-инженера. Учусь открыто, делюсь идеями и люблю хорошее code review.",
    "p3": "Всегда рад поговорить про код, системы и AI."
  },
  "experience": {
    "heading": "Опыт",
    "kwaaka": {
      "company": "Kwaaka",
      "role": "Golang Backend Developer",
      "period": "Март 2025 — настоящее время",
      "desc": "Kwaaka автоматизирует работу ресторанов: собирает заказы из множества платформ доставки в собственные системы ресторана, чтобы команда не жонглировала планшетами, а работала в одном потоке. Я разрабатываю backend-сервисы на Go и AI-автоматизацию для реальных бизнес-процессов."
    }
  },
  "education": {
    "heading": "Образование",
    "kolesa": {
      "title": "Kolesa Upgrade",
      "period": "Сентябрь — ноябрь 2022",
      "desc": "Основы backend-разработки: от PHP 8+ и основ Go до полноценных веб-сервисов — Slim, MySQL, Docker, HTTP и проектирование API."
    },
    "sapsan": {
      "title": "Sapsan Code",
      "period": "Сентябрь 2023 — май 2024",
      "desc": "Java backend с нуля: Spring Boot, REST API, аутентификация и Docker."
    }
  },
  "stack": { "heading": "Стек", "main": "Каждый день", "hobby": "Пет-проекты и хобби" },
  "projects": {
    "heading": "Проекты",
    "empty": "Готовлю кое-что хорошее. Загляни позже.",
    "github": "Смотреть GitHub"
  },
  "lab": {
    "heading": "Лаб",
    "text": "Песочница из небольших dev- и CTF-инструментов скоро откроется.",
    "badge": "Скоро"
  },
  "footer": { "built": "Сделано вручную. Без фреймворков." },
  "lang": { "label": "Язык", "beta": "beta", "beta_title": "Черновик перевода, идёт вычитка" },
  "notfound": { "title": "404 — Страница не найдена", "text": "Такой страницы нет.", "home": "На главную" },
  "terminal": {
    "label": "Терминал",
    "open": "Открыть терминал",
    "close": "Закрыть",
    "prompt": "guest@omargaly:~$",
    "hint": "Введи \"help\". Esc — закрыть.",
    "help": [
      "Доступные команды:",
      "  whoami   кто я",
      "  stack    с чем работаю",
      "  now      чем занят сейчас",
      "  contact  где меня найти",
      "  lab      песочница",
      "  theme    dark | light | toggle",
      "  lang     en | ru | kz",
      "  clear    очистить экран",
      "  exit     закрыть терминал"
    ],
    "whoami": ["Omargaly Bitebayev", "Software Engineer · Backend & AI", "Go backend-инженер, расту в сторону AI-инженерии."],
    "now": ["Пишу backend-сервисы на Go в Kwaaka.", "Учусь строить AI-агентов, которые делают реальную работу.", "Кручу пет-проекты и CTF-задачки."],
    "lab": ["Лаб скоро откроется: dev- и CTF-инструменты прямо в браузере."],
    "not_found": "команда не найдена: {cmd}. Попробуй \"help\".",
    "usage_theme": "использование: theme dark | light | toggle",
    "usage_lang": "использование: lang en | ru | kz",
    "theme_set": "тема: {value}",
    "lang_switching": "переключаю язык: {value}...",
    "stack_main": "каждый день",
    "stack_hobby": "для души"
  }
}
```

- [ ] **Step 6: Create `i18n/kz.json`** (draft translation, shown with a beta badge until proofread)

```json
{
  "meta": {
    "title": "Omargaly Bitebayev — Software Engineer · Backend & AI",
    "description": "Omargaly Bitebayev-тің жеке сайты: AI инженериясына қарай өсіп келе жатқан Go backend-инженері."
  },
  "skip": "Мазмұнға өту",
  "nav": { "about": "Мен туралы", "experience": "Тәжірибе", "stack": "Стек", "projects": "Жобалар", "lab": "Лаб" },
  "theme": { "toggle": "Тақырыпты ауыстыру" },
  "hero": {
    "hello": "Сәлем, мен",
    "name": "Omargaly Bitebayev",
    "title": "Software Engineer · Backend & AI",
    "tagline": "Go backend-инженері, AI инженериясына қарай өсіп келе жатырмын.",
    "photo_alt": "Omargaly Bitebayev портреті",
    "cta_contact": "Telegram-да жазу",
    "cta_github": "GitHub"
  },
  "about": {
    "heading": "Мен туралы",
    "p1": "Мен тапсырманы алып, оны production-ға дейін жеткізуді ұнататын backend-инженермін. Күнделікті жұмысымда Go, сервистер мен деректер бар, күрделі жүйені қарапайым етіп жасағанды жақсы көремін.",
    "p2": "Мен AI инженериясына қарай қозғалып келемін: нақты жұмыс істейтін агенттер мен автоматтандыру жасаймын және осы жолда senior инженер болуды мақсат етемін. Ашық үйренемін, идеямен бөлісемін және жақсы code review-ді жақсы көремін.",
    "p3": "Код, жүйелер және AI туралы әңгімеге әрдайым ашықпын."
  },
  "experience": {
    "heading": "Тәжірибе",
    "kwaaka": {
      "company": "Kwaaka",
      "role": "Golang Backend Developer",
      "period": "Наурыз 2025 — қазір",
      "desc": "Kwaaka мейрамхана жұмысын автоматтандырады: көптеген жеткізу платформаларынан түскен тапсырыстарды мейрамхананың өз жүйелеріне біріктіреді, сондықтан команда планшеттерді ауыстырып отырмай, бір ағынмен жұмыс істейді. Мен Go-да backend-сервистер мен нақты бизнес-процестерге арналған AI-автоматтандыру жасаймын."
    }
  },
  "education": {
    "heading": "Білім",
    "kolesa": {
      "title": "Kolesa Upgrade",
      "period": "Қыркүйек — қараша 2022",
      "desc": "Backend әзірлеудің негіздері: PHP 8+ және Go бастапқы білімінен толыққанды веб-сервистерге дейін — Slim, MySQL, Docker, HTTP және API жобалау."
    },
    "sapsan": {
      "title": "Sapsan Code",
      "period": "Қыркүйек 2023 — мамыр 2024",
      "desc": "Java backend нөлден: Spring Boot, REST API, аутентификация және Docker."
    }
  },
  "stack": { "heading": "Стек", "main": "Күнделікті", "hobby": "Жеке жобалар мен хобби" },
  "projects": {
    "heading": "Жобалар",
    "empty": "Жақсы нәрсе дайындап жатырмын. Жақында қараңыз.",
    "github": "GitHub-та көру"
  },
  "lab": {
    "heading": "Лаб",
    "text": "Шағын dev және CTF құралдарының ойын алаңы жақында ашылады.",
    "badge": "Жақында"
  },
  "footer": { "built": "Қолмен жасалған. Фреймворксыз." },
  "lang": { "label": "Тіл", "beta": "beta", "beta_title": "Аударма жобасы, тексеру жүріп жатыр" },
  "notfound": { "title": "404 — Бет табылмады", "text": "Мұндай бет жоқ.", "home": "Басты бетке" },
  "terminal": {
    "label": "Терминал",
    "open": "Терминалды ашу",
    "close": "Жабу",
    "prompt": "guest@omargaly:~$",
    "hint": "\"help\" деп жазыңыз. Esc — жабу.",
    "help": [
      "Қолжетімді командалар:",
      "  whoami   мен кіммін",
      "  stack    немен жұмыс істеймін",
      "  now      қазір немен айналысамын",
      "  contact  мені қайдан табуға болады",
      "  lab      ойын алаңы",
      "  theme    dark | light | toggle",
      "  lang     en | ru | kz",
      "  clear    экранды тазалау",
      "  exit     терминалды жабу"
    ],
    "whoami": ["Omargaly Bitebayev", "Software Engineer · Backend & AI", "Go backend-инженері, AI инженериясына қарай өсіп келе жатырмын."],
    "now": ["Kwaaka-да Go-да backend-сервистер жазамын.", "Нақты жұмыс істейтін AI-агенттер жасауды үйреніп жатырмын.", "Жеке жобалармен және CTF тапсырмаларымен айналысамын."],
    "lab": ["Лаб жақында ашылады: браузердегі dev және CTF құралдары."],
    "not_found": "команда табылмады: {cmd}. \"help\" деп көріңіз.",
    "usage_theme": "қолданылуы: theme dark | light | toggle",
    "usage_lang": "қолданылуы: lang en | ru | kz",
    "theme_set": "тақырып: {value}",
    "lang_switching": "тілді ауыстыру: {value}...",
    "stack_main": "күнделікті",
    "stack_hobby": "жеке қызығушылық"
  }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `node --test tests/i18n.test.mjs`
Expected: PASS, 6 tests (2 parity, 3 non-empty, 1 site.json).

- [ ] **Step 8: Commit**

```bash
git add i18n src/data tests/i18n.test.mjs
git commit -m "feat: add EN/RU/KZ copy and site data" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Build script, templates, icons

**Files:**
- Create: `build.mjs`, `src/lib/icons.mjs`, `src/templates/head-script.html`, `src/templates/home.html`, `src/templates/404.html`, `robots.txt`
- Test: `tests/build.test.mjs`

**Interfaces:**
- Consumes: `render`, `escapeHtml` (Task 3); `monthsBetween`, `formatDuration` (Task 2); `i18n/*.json`, `src/data/site.json` (Task 4).
- Produces:
  - `build({ now?: Date }): Promise<Map<string,string>>` — keys are repo-relative paths (`index.html`, `ru/index.html`, `kz/index.html`, `404.html`, `sitemap.xml`), values file contents.
  - `LANGS = ['en','ru','kz']`.
  - DOM contract used by JS in Tasks 6–8: `data-theme-toggle` button, `data-lang-link="<lang>"` anchors, `.reveal` elements, `[data-duration]` spans, `data-terminal-open` button, `#terminal`, `#terminal-out`, `#terminal-form`, `#terminal-input`, `[data-terminal-close]`, `<script type="application/json" id="terminal-data">` containing `{ i18n, stack, links }`.

- [ ] **Step 1: Write the failing test**

```js
// tests/build.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../build.mjs';

const pages = await build({ now: new Date('2026-10-03T12:00:00Z') });
const en = pages.get('index.html');
const ru = pages.get('ru/index.html');
const kz = pages.get('kz/index.html');

test('emits a page per language plus 404 and sitemap', () => {
  for (const p of ['index.html', 'ru/index.html', 'kz/index.html', '404.html', 'sitemap.xml']) {
    assert.ok(pages.has(p), `missing ${p}`);
  }
});

test('sets the html lang attribute per language', () => {
  assert.match(en, /<html lang="en"/);
  assert.match(ru, /<html lang="ru"/);
  assert.match(kz, /<html lang="kk"/);
});

test('leaves no unresolved placeholders', () => {
  for (const [path, html] of pages) assert.ok(!/\{\{/.test(html), `placeholder left in ${path}`);
});

test('computes experience duration at build time', () => {
  assert.ok(en.includes('1 yr 6 mos'));
  assert.ok(ru.includes('1 г. 6 мес.'));
  assert.ok(kz.includes('1 жыл 6 ай'));
});

test('has canonical and hreflang links', () => {
  assert.ok(en.includes('rel="canonical" href="https://omargaly.github.io/"'));
  assert.ok(ru.includes('rel="canonical" href="https://omargaly.github.io/ru/"'));
  assert.ok(kz.includes('rel="canonical" href="https://omargaly.github.io/kz/"'));
  assert.ok(en.includes('hreflang="kk"'));
  assert.ok(en.includes('hreflang="x-default"'));
});

test('marks Kazakh as beta only in the switcher', () => {
  assert.ok(en.includes('class="beta"'));
});

test('marks the current language in the switcher', () => {
  assert.match(ru, /data-lang-link="ru" aria-current="true"/);
  assert.doesNotMatch(ru, /data-lang-link="en" aria-current/);
});

test('embeds valid terminal data', () => {
  const m = en.match(/<script type="application\/json" id="terminal-data">([\s\S]*?)<\/script>/);
  assert.ok(m, 'terminal-data script missing');
  const data = JSON.parse(m[1]);
  assert.ok(Array.isArray(data.i18n.help));
  assert.ok(data.stack.main.includes('Go'));
  assert.ok(data.links.some((l) => l.label === 'GitHub'));
});

test('renders the empty projects state', () => {
  assert.ok(en.includes('Cooking something good'));
});

test('does not name internal systems of the employer', () => {
  for (const html of [en, ru, kz]) assert.doesNotMatch(html, /iiko|\bPOS\b|ONAY|Gourmet|Halyk/i);
});

test('sitemap lists the three language URLs', () => {
  const xml = pages.get('sitemap.xml');
  for (const u of ['https://omargaly.github.io/', 'https://omargaly.github.io/ru/', 'https://omargaly.github.io/kz/']) {
    assert.ok(xml.includes(`<loc>${u}</loc>`), u);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/build.test.mjs`
Expected: FAIL — cannot find module `build.mjs`.

- [ ] **Step 3: Create `src/lib/icons.mjs`**

```js
const svg = (d) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="${d}"/></svg>`;

export const ICONS = {
  github: svg('M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'),
  linkedin: svg('M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'),
  telegram: svg('M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'),
  x: svg('M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'),
};
```

- [ ] **Step 4: Create `src/templates/head-script.html`** (runs before first paint; invalid stored language values never redirect)

```html
<script>
(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.dataset.theme=t;var l=localStorage.getItem('lang');if((l==='ru'||l==='kz')&&location.pathname==='/'){location.replace('/'+l+'/')}}catch(e){}})();
</script>
```

- [ ] **Step 5: Create `src/templates/home.html`**

```html
<!doctype html>
<html lang="{{{htmlLang}}}" data-lang="{{{lang}}}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{meta.title}}</title>
<meta name="description" content="{{meta.description}}">
<meta name="theme-color" content="#0a0c10">
<link rel="canonical" href="{{{canonical}}}">
{{{alternates}}}
<meta property="og:type" content="website">
<meta property="og:title" content="{{meta.title}}">
<meta property="og:description" content="{{meta.description}}">
<meta property="og:url" content="{{{canonical}}}">
<meta property="og:image" content="{{{origin}}}/assets/img/og.png">
<meta property="og:locale" content="{{{ogLocale}}}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
{{{headScript}}}
<link rel="preload" href="/assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/components.css">
<script type="module" src="/assets/js/main.js"></script>
</head>
<body>
<a class="skip-link" href="#main">{{skip}}</a>

<header class="site-header">
  <div class="container site-header__inner">
    <a class="logo" href="{{{homePath}}}" aria-label="{{hero.name}}">o<span>b</span>_</a>
    <nav class="nav" aria-label="Primary">
      <a href="#about">{{nav.about}}</a>
      <a href="#experience">{{nav.experience}}</a>
      <a href="#stack">{{nav.stack}}</a>
      <a href="#projects">{{nav.projects}}</a>
      <a href="#lab">{{nav.lab}}</a>
    </nav>
    <div class="lang" role="group" aria-label="{{lang.label}}">{{{langSwitch}}}</div>
    <button class="icon-btn" type="button" data-theme-toggle aria-label="{{theme.toggle}}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-4.4 2.26 5.4 5.4 0 0 1-5.4-5.4c0-1.8.88-3.4 2.24-4.4A9.1 9.1 0 0 0 12 3z"/></svg></button>
    <button class="icon-btn" type="button" data-terminal-open aria-label="{{terminal.open}}"><span aria-hidden="true">&gt;_</span></button>
  </div>
</header>

<main id="main">
  <section class="hero">
    <div class="container hero__inner">
      <div class="hero__photo">
        <picture>
          <source type="image/avif" srcset="/assets/img/avatar-168.avif 168w, /assets/img/avatar-336.avif 336w" sizes="168px">
          <source type="image/webp" srcset="/assets/img/avatar-168.webp 168w, /assets/img/avatar-336.webp 336w" sizes="168px">
          <img src="/assets/img/avatar-336.jpg" srcset="/assets/img/avatar-168.jpg 168w, /assets/img/avatar-336.jpg 336w" sizes="168px" width="168" height="168" alt="{{hero.photo_alt}}" fetchpriority="high">
        </picture>
      </div>
      <div class="hero__text">
        <p class="hero__hello">{{hero.hello}}</p>
        <h1 class="hero__name">{{hero.name}}</h1>
        <p class="hero__title">{{hero.title}}</p>
        <p class="hero__tagline">{{hero.tagline}}</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="https://t.me/hackeevo" target="_blank" rel="noopener noreferrer">{{hero.cta_contact}}</a>
          <a class="btn" href="https://github.com/OMaRgaLy" target="_blank" rel="noopener noreferrer">{{hero.cta_github}}</a>
        </div>
        <div class="socials">{{{socials}}}</div>
      </div>
    </div>
  </section>

  <div class="container bento">
    <section class="card card--about reveal" id="about">
      <h2 class="card__title">{{about.heading}}</h2>
      <p>{{about.p1}}</p>
      <p>{{about.p2}}</p>
      <p class="muted">{{about.p3}}</p>
    </section>

    <section class="card card--exp reveal" id="experience">
      <h2 class="card__title">{{experience.heading}}</h2>
      {{{experience}}}
    </section>

    <section class="card card--edu reveal" id="education">
      <h2 class="card__title">{{education.heading}}</h2>
      {{{education}}}
    </section>

    <section class="card card--stack reveal" id="stack">
      <h2 class="card__title">{{stack.heading}}</h2>
      <h3 class="card__sub">{{stack.main}}</h3>
      <ul class="chips">{{{stackMain}}}</ul>
      <h3 class="card__sub">{{stack.hobby}}</h3>
      <ul class="chips">{{{stackHobby}}}</ul>
    </section>

    <section class="card card--projects reveal" id="projects">
      <h2 class="card__title">{{projects.heading}}</h2>
      {{{projects}}}
    </section>

    <section class="card card--lab reveal" id="lab">
      <h2 class="card__title">{{lab.heading}} <span class="badge">{{lab.badge}}</span></h2>
      <p>{{lab.text}}</p>
    </section>
  </div>
</main>

<footer class="site-footer">
  <div class="container site-footer__inner">
    <p class="muted">© {{{year}}} {{hero.name}} · {{footer.built}}</p>
    <div class="socials socials--footer">{{{socials}}}</div>
  </div>
</footer>

<div class="terminal" id="terminal" role="dialog" aria-modal="true" aria-label="{{terminal.label}}" hidden>
  <div class="terminal__window">
    <div class="terminal__bar">
      <span class="terminal__title">{{terminal.label}}</span>
      <button type="button" class="terminal__close" data-terminal-close aria-label="{{terminal.close}}">×</button>
    </div>
    <div class="terminal__out" id="terminal-out" role="log" aria-live="polite"></div>
    <form class="terminal__form" id="terminal-form" autocomplete="off">
      <label class="terminal__prompt" for="terminal-input">{{terminal.prompt}}</label>
      <input class="terminal__input" id="terminal-input" type="text" spellcheck="false" autocapitalize="off" autocomplete="off">
    </form>
  </div>
</div>
<script type="application/json" id="terminal-data">{{{terminalData}}}</script>
</body>
</html>
```

- [ ] **Step 6: Create `src/templates/404.html`**

```html
<!doctype html>
<html lang="en" data-lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{notfound.title}}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
{{{headScript}}}
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/components.css">
</head>
<body>
<main class="container notfound">
  <p class="hero__hello">404</p>
  <h1 class="hero__name">{{notfound.title}}</h1>
  <p class="hero__tagline">{{notfound.text}}</p>
  <p><a class="btn btn--primary" href="/">{{notfound.home}}</a></p>
</main>
</body>
</html>
```

- [ ] **Step 7: Create `robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://omargaly.github.io/sitemap.xml
```

- [ ] **Step 8: Create `build.mjs`**

```js
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
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `node --test tests/build.test.mjs`
Expected: PASS, 11 tests.

- [ ] **Step 10: Commit**

```bash
git add build.mjs src/lib/icons.mjs src/templates robots.txt tests/build.test.mjs
git commit -m "feat: add build script and page templates" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Browser JS — storage, theme, language, reveal, entry point

**Files:**
- Create: `assets/js/storage.js`, `assets/js/theme.js`, `assets/js/lang.js`, `assets/js/reveal.js`, `assets/js/main.js`
- Test: `tests/storage.test.mjs`

**Interfaces:**
- Consumes: `initDuration` (Task 2); `initTerminal` (Task 7, imported in `main.js` — Task 7 must land before `main.js` is run in a browser; in this task `main.js` imports it and Step 6 creates a temporary stub only if Task 7 is not yet done).
- Produces:
  - `readStored(key: string): string | null`, `writeStored(key: string, value: string): boolean`
  - `getTheme(): 'dark'|'light'`, `setTheme(t: 'dark'|'light'): void`, `toggleTheme(): void`, `initTheme(): void`
  - `langPath(l: 'en'|'ru'|'kz'): string`, `setLangPref(l): void`, `initLang(): void`
  - `initReveal(): void`

- [ ] **Step 1: Write the failing storage test**

```js
// tests/storage.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readStored, writeStored } from '../assets/js/storage.js';

function withStorage(value, fn) {
  Object.defineProperty(globalThis, 'localStorage', { value, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    delete globalThis.localStorage;
  }
}

test('returns null / false when localStorage is unavailable', () => {
  withStorage(undefined, () => {
    assert.equal(readStored('theme'), null);
    assert.equal(writeStored('theme', 'dark'), false);
  });
});

test('returns null / false when localStorage throws', () => {
  const throwing = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  withStorage(throwing, () => {
    assert.equal(readStored('theme'), null);
    assert.equal(writeStored('theme', 'dark'), false);
  });
});

test('reads and writes through a working localStorage', () => {
  const mem = new Map();
  const ok = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
  withStorage(ok, () => {
    assert.equal(writeStored('lang', 'ru'), true);
    assert.equal(readStored('lang'), 'ru');
    assert.equal(readStored('missing'), null);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/storage.test.mjs`
Expected: FAIL — cannot find module `assets/js/storage.js`.

- [ ] **Step 3: Implement `assets/js/storage.js`**

```js
export function readStored(key) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(key, value) {
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test tests/storage.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 5: Create `assets/js/theme.js`**

```js
import { writeStored } from './storage.js';

const META_COLOR = { dark: '#0a0c10', light: '#f7f8fa' };

export function getTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  writeStored('theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[t]);
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(t === 'light')));
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  setTheme(getTheme());
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
}
```

- [ ] **Step 6: Create `assets/js/lang.js`**

```js
import { writeStored } from './storage.js';

const PATHS = { en: '/', ru: '/ru/', kz: '/kz/' };

export const langPath = (l) => PATHS[l] ?? PATHS.en;

export function setLangPref(l) {
  if (l in PATHS) writeStored('lang', l);
}

export function initLang() {
  document.querySelectorAll('[data-lang-link]').forEach((a) => {
    a.addEventListener('click', () => setLangPref(a.dataset.langLink));
  });
}
```

- [ ] **Step 7: Create `assets/js/reveal.js`**

```js
export function initReveal() {
  const items = document.querySelectorAll('.reveal');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((el) => io.observe(el));
}
```

- [ ] **Step 8: Create `assets/js/main.js`**

```js
import { initTheme } from './theme.js';
import { initLang } from './lang.js';
import { initReveal } from './reveal.js';
import { initDuration } from './duration.js';
import { initTerminal } from './terminal.js';

initTheme();
initLang();
initReveal();
initDuration();
initTerminal();
```

- [ ] **Step 9: Run the full suite**

Run: `npm test`
Expected: PASS (all earlier tests plus storage). `main.js` is not imported by any test.

- [ ] **Step 10: Commit**

```bash
git add assets/js tests/storage.test.mjs
git commit -m "feat: add storage, theme, language and reveal scripts" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Terminal — pure core, DOM wiring

**Files:**
- Create: `assets/js/terminal-core.js`, `assets/js/terminal.js`
- Test: `tests/terminal-core.test.mjs`

**Interfaces:**
- Consumes: `setTheme`, `toggleTheme` (Task 6), `langPath`, `setLangPref` (Task 6); terminal data JSON (Task 5).
- Produces:
  - `runCommand(input: string, data: {i18n, stack:{main[],hobby[]}, links:[{label,href}]}): { lines: string[], action?: { type: 'clear'|'close'|'theme'|'lang', value?: string } }`
  - `createKonami(onMatch: () => void): (key: string) => void`
  - `initTerminal(): void`

- [ ] **Step 1: Write the failing test**

```js
// tests/terminal-core.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runCommand, createKonami } from '../assets/js/terminal-core.js';

const en = JSON.parse(readFileSync(new URL('../i18n/en.json', import.meta.url), 'utf8'));
const data = {
  i18n: en.terminal,
  stack: { main: ['Go', 'PostgreSQL'], hobby: ['Elixir'] },
  links: [{ label: 'GitHub', href: 'https://github.com/OMaRgaLy' }],
};

test('empty and whitespace-only input produce no output', () => {
  assert.deepEqual(runCommand('', data), { lines: [] });
  assert.deepEqual(runCommand('   ', data), { lines: [] });
});

test('commands are case-insensitive and trimmed', () => {
  assert.deepEqual(runCommand('  WHOAMI  ', data).lines, en.terminal.whoami);
});

test('help lists the commands', () => {
  assert.deepEqual(runCommand('help', data).lines, en.terminal.help);
});

test('stack prints both groups', () => {
  assert.deepEqual(runCommand('stack', data).lines, ['daily: Go, PostgreSQL', 'on the side: Elixir']);
});

test('contact prints label and url', () => {
  assert.deepEqual(runCommand('contact', data).lines, ['GitHub    https://github.com/OMaRgaLy']);
});

test('unknown command echoes the input as plain text', () => {
  const r = runCommand('<img src=x onerror=alert(1)>', data);
  assert.equal(r.lines.length, 1);
  assert.ok(r.lines[0].includes('<img src=x onerror=alert(1)>'));
  assert.equal(r.action, undefined);
});

test('theme validates its argument', () => {
  assert.deepEqual(runCommand('theme', data).lines, [en.terminal.usage_theme]);
  assert.deepEqual(runCommand('theme blue', data).lines, [en.terminal.usage_theme]);
  assert.deepEqual(runCommand('theme LIGHT', data).action, { type: 'theme', value: 'light' });
  assert.deepEqual(runCommand('theme toggle', data).action, { type: 'theme', value: 'toggle' });
});

test('lang validates its argument', () => {
  assert.deepEqual(runCommand('lang', data).lines, [en.terminal.usage_lang]);
  assert.deepEqual(runCommand('lang de', data).lines, [en.terminal.usage_lang]);
  assert.deepEqual(runCommand('lang ru', data).action, { type: 'lang', value: 'ru' });
});

test('clear, exit and quit return actions', () => {
  assert.deepEqual(runCommand('clear', data).action, { type: 'clear' });
  assert.deepEqual(runCommand('exit', data).action, { type: 'close' });
  assert.deepEqual(runCommand('quit', data).action, { type: 'close' });
});

test('runCommand does not hand out the shared i18n arrays', () => {
  const r = runCommand('help', data);
  r.lines.push('mutated');
  assert.equal(en.terminal.help.includes('mutated'), false);
});

test('konami fires once after the full sequence and resets', () => {
  let hits = 0;
  const feed = createKonami(() => hits++);
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  seq.forEach(feed);
  assert.equal(hits, 1);
  seq.forEach(feed);
  assert.equal(hits, 2);
});

test('konami ignores a broken sequence and accepts upper-case letters', () => {
  let hits = 0;
  const feed = createKonami(() => hits++);
  ['ArrowUp', 'ArrowUp', 'x', 'ArrowDown'].forEach(feed);
  assert.equal(hits, 0);
  ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A'].forEach(feed);
  assert.equal(hits, 1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/terminal-core.test.mjs`
Expected: FAIL — cannot find module `assets/js/terminal-core.js`.

- [ ] **Step 3: Implement `assets/js/terminal-core.js`**

```js
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
      return { lines: [...t.lab] };
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test tests/terminal-core.test.mjs`
Expected: PASS, 12 tests.

- [ ] **Step 5: Implement `assets/js/terminal.js`** (DOM glue; all output goes through `textContent`)

```js
import { runCommand, createKonami } from './terminal-core.js';
import { setTheme, toggleTheme } from './theme.js';
import { langPath, setLangPref } from './lang.js';

export function initTerminal() {
  const root = document.getElementById('terminal');
  const dataEl = document.getElementById('terminal-data');
  if (!root || !dataEl) return;

  const data = JSON.parse(dataEl.textContent);
  const out = root.querySelector('#terminal-out');
  const form = root.querySelector('#terminal-form');
  const input = root.querySelector('#terminal-input');
  const closeBtn = root.querySelector('[data-terminal-close]');
  const history = [];
  let cursor = 0;
  let lastFocus = null;

  const print = (lines, className) => {
    for (const line of lines) {
      const p = document.createElement('p');
      p.textContent = line;
      if (className) p.className = className;
      out.appendChild(p);
    }
    out.scrollTop = out.scrollHeight;
  };

  const isOpen = () => !root.hidden;

  const open = () => {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('no-scroll');
    if (!out.children.length) print([data.i18n.hint], 'terminal__hint');
    input.focus();
  };

  const close = () => {
    if (!isOpen()) return;
    root.hidden = true;
    document.body.classList.remove('no-scroll');
    lastFocus?.focus?.();
  };

  const handleAction = (action) => {
    switch (action.type) {
      case 'clear':
        out.replaceChildren();
        break;
      case 'close':
        close();
        break;
      case 'theme':
        if (action.value === 'toggle') toggleTheme();
        else setTheme(action.value);
        break;
      case 'lang':
        setLangPref(action.value);
        setTimeout(() => {
          location.href = langPath(action.value);
        }, 400);
        break;
    }
  };

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const value = input.value;
    input.value = '';
    print([`${data.i18n.prompt} ${value}`], 'terminal__echo');
    if (value.trim()) {
      history.push(value);
      cursor = history.length;
    }
    const result = runCommand(value, data);
    print(result.lines);
    if (result.action) handleAction(result.action);
  });

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowUp' && history.length) {
      ev.preventDefault();
      cursor = Math.max(0, cursor - 1);
      input.value = history[cursor];
    } else if (ev.key === 'ArrowDown' && history.length) {
      ev.preventDefault();
      cursor = Math.min(history.length, cursor + 1);
      input.value = history[cursor] ?? '';
    }
  });

  root.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Tab') return;
    ev.preventDefault();
    const order = [closeBtn, input];
    const i = order.indexOf(document.activeElement);
    order[(i + (ev.shiftKey ? -1 : 1) + order.length) % order.length].focus();
  });

  root.addEventListener('click', (ev) => {
    if (ev.target === root) close();
  });
  closeBtn.addEventListener('click', close);
  document.querySelectorAll('[data-terminal-open]').forEach((b) => b.addEventListener('click', open));

  const konami = createKonami(open);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      close();
      return;
    }
    const target = ev.target;
    const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (typing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === '`') {
      ev.preventDefault();
      isOpen() ? close() : open();
      return;
    }
    if (!isOpen()) konami(ev.key);
  });
}
```

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 7: Commit**

```bash
git add assets/js/terminal-core.js assets/js/terminal.js tests/terminal-core.test.mjs
git commit -m "feat: add terminal easter egg" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Fonts, images, favicon, social preview

**Files:**
- Create: `scripts/copy-fonts.mjs`, `scripts/optimize-images.mjs`, `assets/img/favicon.svg`
- Move: `assets/img/avatar_new.jpg` → `scripts/source/avatar.jpg`
- Generate: `assets/fonts/*.woff2`, `assets/img/avatar-{168,336}.{avif,webp,jpg}`, `assets/img/og.png`

**Interfaces:**
- Produces: the exact asset paths referenced by the templates (Task 5) and `tokens.css` (Task 9): `/assets/fonts/inter-{latin,cyrillic,cyrillic-ext}-wght-normal.woff2`, `/assets/fonts/jetbrains-mono-{latin,cyrillic}-wght-normal.woff2`, `/assets/img/avatar-{168,336}.{avif,webp,jpg}`, `/assets/img/og.png`, `/assets/img/favicon.svg`.

- [ ] **Step 1: Create `scripts/copy-fonts.mjs`**

```js
import { copyFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

const FILES = [
  ['@fontsource-variable/inter', 'inter-latin-wght-normal.woff2'],
  ['@fontsource-variable/inter', 'inter-cyrillic-wght-normal.woff2'],
  ['@fontsource-variable/inter', 'inter-cyrillic-ext-wght-normal.woff2'],
  ['@fontsource-variable/jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2'],
  ['@fontsource-variable/jetbrains-mono', 'jetbrains-mono-cyrillic-wght-normal.woff2'],
];

await mkdir('assets/fonts', { recursive: true });
for (const [pkg, file] of FILES) {
  const from = join('node_modules', pkg, 'files', file);
  try {
    await access(from);
  } catch {
    throw new Error(`Missing ${from}. List node_modules/${pkg}/files and fix the name in FILES.`);
  }
  await copyFile(from, join('assets/fonts', file));
  console.log('copied', file);
}
```

- [ ] **Step 2: Run it**

Run: `npm run fonts`
Expected: five `copied …` lines. If it throws `Missing …`, list `node_modules/@fontsource-variable/<pkg>/files/`, correct the file name in `FILES`, and re-run.

- [ ] **Step 3: Move the avatar source and create `scripts/optimize-images.mjs`**

Run: `mkdir -p scripts/source && git mv assets/img/avatar_new.jpg scripts/source/avatar.jpg`

```js
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'scripts/source/avatar.jpg';
const OUT = 'assets/img';
await mkdir(OUT, { recursive: true });

for (const w of [168, 336]) {
  const base = sharp(SRC).resize(w, w, { fit: 'cover', position: 'attention' });
  await base.clone().avif({ quality: 50 }).toFile(`${OUT}/avatar-${w}.avif`);
  await base.clone().webp({ quality: 78 }).toFile(`${OUT}/avatar-${w}.webp`);
  await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/avatar-${w}.jpg`);
}

const mask = Buffer.from('<svg width="280" height="280"><circle cx="140" cy="140" r="140" fill="#fff"/></svg>');
const avatar = await sharp(SRC)
  .resize(280, 280, { fit: 'cover' })
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0c10"/><stop offset="1" stop-color="#121826"/>
    </linearGradient>
    <radialGradient id="a" cx="0.2" cy="0.1" r="0.7"><stop offset="0" stop-color="#2dd4f0" stop-opacity="0.25"/><stop offset="1" stop-color="#2dd4f0" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#a)"/>
  <g font-family="Segoe UI, Helvetica, Arial, sans-serif" fill="#e6e9ee">
    <text x="440" y="270" font-size="64" font-weight="700">Omargaly Bitebayev</text>
    <text x="440" y="340" font-size="34" fill="#2dd4f0">Software Engineer · Backend &amp; AI</text>
    <text x="440" y="400" font-size="26" fill="#8b95a5">Go backend engineer, growing into AI engineering.</text>
    <text x="440" y="520" font-size="24" fill="#8b95a5" font-family="Consolas, monospace">omargaly.github.io</text>
  </g>
</svg>`;

await sharp(Buffer.from(og))
  .composite([{ input: avatar, left: 100, top: 175 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(`${OUT}/og.png`);
console.log('images written');
```

- [ ] **Step 4: Create `assets/img/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0a0c10"/><text x="32" y="43" font-family="monospace" font-size="30" font-weight="700" text-anchor="middle" fill="#2dd4f0">ob</text></svg>
```

- [ ] **Step 5: Run the image script and check sizes**

Run: `npm run images && ls -l assets/img assets/fonts`
Expected: `images written`; each `avatar-*.avif` under about 15 KB, `avatar-336.jpg` under about 40 KB, `og.png` produced, five woff2 files in `assets/fonts`.

- [ ] **Step 6: Look at the social preview**

Open `assets/img/og.png` with the Read tool.
Expected: dark card, circular photo on the left, name, role and tagline readable on the right, nothing clipped. If the text overlaps the photo, adjust the `x` of the texts or the avatar `left` and re-run Step 5.

- [ ] **Step 7: Commit**

```bash
git add scripts assets/fonts assets/img package.json
git commit -m "feat: add self-hosted fonts, optimized avatar, favicon and og image" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Design system CSS

**Files:**
- Create: `assets/css/tokens.css`, `assets/css/base.css`, `assets/css/components.css`

**Interfaces:**
- Consumes: DOM classes from the templates (Task 5) and fonts from Task 8.
- Produces: the visual layer; CSS custom properties `--bg --surface --surface-2 --border --text --muted --accent --accent-2 --on-accent --radius --radius-sm --gutter --maxw --font-sans --font-mono`.

- [ ] **Step 1: Create `assets/css/tokens.css`**

```css
@font-face{font-family:"Inter Variable";font-style:normal;font-display:swap;font-weight:100 900;src:url(/assets/fonts/inter-cyrillic-ext-wght-normal.woff2) format("woff2");unicode-range:U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}
@font-face{font-family:"Inter Variable";font-style:normal;font-display:swap;font-weight:100 900;src:url(/assets/fonts/inter-cyrillic-wght-normal.woff2) format("woff2");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
@font-face{font-family:"Inter Variable";font-style:normal;font-display:swap;font-weight:100 900;src:url(/assets/fonts/inter-latin-wght-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"JetBrains Mono Variable";font-style:normal;font-display:swap;font-weight:100 800;src:url(/assets/fonts/jetbrains-mono-cyrillic-wght-normal.woff2) format("woff2");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
@font-face{font-family:"JetBrains Mono Variable";font-style:normal;font-display:swap;font-weight:100 800;src:url(/assets/fonts/jetbrains-mono-latin-wght-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}

:root {
  --font-sans: "Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --radius: 18px;
  --radius-sm: 10px;
  --gutter: clamp(16px, 4vw, 32px);
  --maxw: 1080px;

  color-scheme: dark;
  --bg: #0a0c10;
  --surface: #11151b;
  --surface-2: #171c24;
  --border: #232a35;
  --text: #e6e9ee;
  --muted: #8b95a5;
  --accent: #2dd4f0;
  --accent-2: #a78bfa;
  --on-accent: #04121a;
}

:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f7f8fa;
  --surface: #ffffff;
  --surface-2: #f0f2f5;
  --border: #e1e5ea;
  --text: #11151b;
  --muted: #566070;
  --accent: #0e7490;
  --accent-2: #6d28d9;
  --on-accent: #ffffff;
}
```

- [ ] **Step 2: Create `assets/css/base.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; scroll-padding-top: 76px; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.65;
  overflow-wrap: anywhere;
  -webkit-font-smoothing: antialiased;
}
img, svg { max-width: 100%; display: block; }
h1, h2, h3, p, ul { margin: 0; }
p + p { margin-top: .9em; }
ul { padding: 0; list-style: none; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; text-underline-offset: 3px; }
button, input { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }
[hidden] { display: none !important; }
.container { width: 100%; max-width: calc(var(--maxw) + var(--gutter) * 2); margin-inline: auto; padding-inline: var(--gutter); }
.muted { color: var(--muted); }
.no-scroll { overflow: hidden; }
.skip-link { position: absolute; left: 12px; top: -60px; z-index: 100; padding: 10px 14px; background: var(--accent); color: var(--on-accent); border-radius: 8px; font-weight: 600; }
.skip-link:focus { top: 12px; text-decoration: none; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Create `assets/css/components.css`**

```css
/* header */
.site-header { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(12px); background: color-mix(in srgb, var(--bg) 82%, transparent); border-bottom: 1px solid var(--border); }
.site-header__inner { display: flex; align-items: center; gap: 12px; min-height: 60px; }
.logo { margin-right: auto; font-family: var(--font-mono); font-weight: 700; letter-spacing: -.02em; color: var(--text); }
.logo span { color: var(--accent); }
.logo:hover { text-decoration: none; }
.nav { display: flex; gap: 2px; }
.nav a { padding: 8px 12px; border-radius: 999px; color: var(--muted); font-size: .9rem; }
.nav a:hover { color: var(--text); background: var(--surface-2); text-decoration: none; }
@media (max-width: 760px) { .nav { display: none; } }

.lang { display: flex; gap: 2px; padding: 3px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); }
.lang__item { padding: 4px 10px; border-radius: 999px; font-size: .8rem; font-weight: 600; color: var(--muted); }
.lang__item:hover { color: var(--text); text-decoration: none; }
.lang__item[aria-current] { background: var(--text); color: var(--bg); }
.beta { margin-left: 3px; font-size: .55rem; text-transform: uppercase; letter-spacing: .04em; color: var(--accent-2); vertical-align: super; }
.lang__item[aria-current] .beta { color: var(--bg); }

.icon-btn { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); font-family: var(--font-mono); font-size: .8rem; color: var(--text); transition: border-color .15s; }
.icon-btn:hover { border-color: var(--accent); }

/* hero */
.hero { position: relative; isolation: isolate; padding: clamp(40px, 8vw, 96px) 0 clamp(28px, 5vw, 56px); }
.hero::before { content: ""; position: absolute; inset: -30% -10% auto; height: 540px; z-index: -1; pointer-events: none;
  background: radial-gradient(600px 300px at 20% 25%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
              radial-gradient(500px 280px at 80% 10%, color-mix(in srgb, var(--accent-2) 20%, transparent), transparent 70%); }
.hero__inner { display: grid; grid-template-columns: auto 1fr; gap: clamp(20px, 4vw, 44px); align-items: center; }
@media (max-width: 640px) { .hero__inner { grid-template-columns: 1fr; } }
.hero__photo { width: 178px; height: 178px; padding: 5px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-2)); }
.hero__photo img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.hero__hello { font-family: var(--font-mono); font-size: .9rem; color: var(--muted); }
.hero__name { margin-top: 4px; font-size: clamp(2rem, 6vw, 3.6rem); line-height: 1.08; font-weight: 800; letter-spacing: -.03em; }
.hero__title { margin-top: 10px; font-size: clamp(1.05rem, 2.4vw, 1.35rem); font-weight: 600; background: linear-gradient(90deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero__tagline { margin-top: 8px; color: var(--muted); max-width: 52ch; }
.hero__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--text); font-weight: 600; font-size: .95rem; transition: transform .15s, border-color .15s; }
.btn:hover { transform: translateY(-1px); border-color: var(--accent); text-decoration: none; }
.btn--primary { background: var(--accent); border-color: transparent; color: var(--on-accent); }

.socials { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.social-link { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); font-size: .85rem; transition: color .15s, border-color .15s; }
.social-link:hover { color: var(--text); border-color: var(--accent); text-decoration: none; }

/* bento */
.bento { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px; padding-bottom: clamp(32px, 6vw, 64px); }
.card { grid-column: span 6; padding: clamp(20px, 3vw, 28px); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
@media (min-width: 860px) {
  .card--exp { grid-column: span 4; }
  .card--edu { grid-column: span 2; }
  .card--stack, .card--projects { grid-column: span 3; }
}
.card__title { margin-bottom: 16px; font-family: var(--font-mono); font-size: .78rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.card__sub { margin: 14px 0 8px; font-size: .85rem; font-weight: 600; color: var(--muted); }
.card__sub:first-of-type { margin-top: 0; }
.badge { margin-left: 8px; padding: 2px 8px; border: 1px solid var(--accent-2); border-radius: 999px; font-size: .65rem; letter-spacing: .06em; color: var(--accent-2); }

.entry + .entry { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
.entry__title { font-size: 1.1rem; font-weight: 700; letter-spacing: -.01em; }
.entry__title a { color: var(--text); }
.entry__at { color: var(--accent); font-weight: 600; }
.entry__meta { margin: 2px 0 8px; font-family: var(--font-mono); font-size: .82rem; color: var(--muted); }

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 5px 11px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface-2); font-family: var(--font-mono); font-size: .82rem; }
.project-list li + li { margin-top: 10px; }

/* footer */
.site-footer { border-top: 1px solid var(--border); padding: 28px 0 40px; }
.site-footer__inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
.site-footer .socials { margin-top: 0; }
.socials--footer .social-link { padding: 8px; }
.socials--footer .social-link span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* 404 */
.notfound { padding-block: clamp(80px, 18vw, 180px); }
.notfound .btn { margin-top: 24px; }

/* reveal (JS only) */
.js .reveal { opacity: 0; transform: translateY(14px); transition: opacity .6s ease, transform .6s ease; }
.js .reveal.is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .js .reveal { opacity: 1; transform: none; } }

/* terminal */
.terminal { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, .55); backdrop-filter: blur(4px); }
.terminal__window { display: flex; flex-direction: column; width: min(720px, 100%); max-height: min(560px, 85vh); background: #0b0e13; color: #d7dde6; border: 1px solid #232a35; border-radius: 14px; box-shadow: 0 30px 80px rgba(0, 0, 0, .5); font-family: var(--font-mono); font-size: .88rem; overflow: hidden; }
.terminal__bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 8px 8px 16px; border-bottom: 1px solid #232a35; color: #8b95a5; }
.terminal__close { width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; font-size: 1.3rem; line-height: 1; color: #8b95a5; }
.terminal__close:hover { background: #171c24; color: #fff; }
.terminal__out { flex: 1; min-height: 160px; padding: 14px 16px; overflow-y: auto; white-space: pre-wrap; overflow-wrap: anywhere; }
.terminal__out p + p { margin-top: 2px; }
.terminal__hint { color: #8b95a5; }
.terminal__echo { color: #2dd4f0; }
.terminal__form { display: flex; gap: 8px; padding: 10px 16px 14px; border-top: 1px solid #232a35; }
.terminal__prompt { color: #2dd4f0; white-space: nowrap; }
.terminal__input { flex: 1; min-width: 0; padding: 0; border: 0; outline: 0; background: transparent; color: #fff; caret-color: #2dd4f0; }
```

- [ ] **Step 4: Build the pages and start the local server**

Run: `npm run build && npm run serve`
Expected: `wrote index.html`, `wrote ru/index.html`, `wrote kz/index.html`, `wrote 404.html`, `wrote sitemap.xml`; server listens on `http://localhost:8080` (leave it running in the background for Task 10).

- [ ] **Step 5: Quick visual check**

Open `http://localhost:8080/` in Chrome (Claude in Chrome tools, if available) at about 1280px and 390px wide. Expected: hero with the photo ring and gradient title, bento cards, no horizontal scroll at 390px. Fix any visible CSS breakage in `components.css` before moving on; full checks happen in Task 10.

- [ ] **Step 6: Commit**

```bash
git add assets/css index.html ru kz 404.html sitemap.xml
git commit -m "feat: add design system and generated pages" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Cleanup, link test, verification

**Files:**
- Delete: `assets/scripts/fslightbox.js`, `assets/styles/styles.css`, `assets/img/project.png`, `assets/img/icons/*.png`
- Create: `tests/links.test.mjs`

**Interfaces:**
- Consumes: everything from Tasks 1–9.
- Produces: a clean repository where every local `src`/`href` in the generated pages resolves to a file, plus a recorded manual verification.

- [ ] **Step 1: Write the failing link test**

```js
// tests/links.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'ru/index.html', 'kz/index.html', '404.html'];

function localRefs(html) {
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) refs.add(part.trim().split(/\s+/)[0]);
  }
  return refs;
}

for (const page of PAGES) {
  test(`every local asset referenced by ${page} exists`, () => {
    const html = readFileSync(join(ROOT, page), 'utf8');
    for (const ref of localRefs(html)) {
      assert.ok(existsSync(join(ROOT, ref)), `${page} references missing file ${ref}`);
    }
  });
}

test('stylesheets reference only existing fonts', () => {
  const css = readFileSync(join(ROOT, 'assets/css/tokens.css'), 'utf8');
  for (const m of css.matchAll(/url\((\/assets\/[^)]+)\)/g)) {
    assert.ok(existsSync(join(ROOT, m[1])), `tokens.css references missing ${m[1]}`);
  }
});

test('legacy files are gone', () => {
  for (const f of ['assets/scripts/fslightbox.js', 'assets/styles/styles.css', 'assets/img/project.png', 'assets/img/icons/github-logo.png']) {
    assert.equal(existsSync(join(ROOT, f)), false, `${f} should be removed`);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/links.test.mjs`
Expected: FAIL on `legacy files are gone` (the asset-existence tests should already pass).

- [ ] **Step 3: Remove legacy files**

Run:
```bash
git rm assets/scripts/fslightbox.js assets/styles/styles.css assets/img/project.png assets/img/icons/email.png assets/img/icons/github-logo.png assets/img/icons/linkedin.png assets/img/icons/telegram.png
```

- [ ] **Step 4: Rebuild and run the full suite**

Run: `npm run build && npm test`
Expected: PASS for every suite (duration, template, i18n, build, storage, terminal-core, links).

- [ ] **Step 5: Weight check**

Run:
```bash
gzip -c index.html | wc -c
ls -l assets/css assets/js assets/img/avatar-168.avif assets/img/avatar-336.avif
```
Expected: gzipped `index.html` under about 6 KB; CSS in total under about 12 KB; JS in total under about 15 KB; avatar images small. If the home page (HTML + CSS + JS + hero image, excluding fonts) is not under about 150 KB, find the biggest file and fix that one.

- [ ] **Step 6: Manual verification in Chrome** (server from Task 9 still running; start it again with `npm run serve` otherwise)

Use the Claude in Chrome tools if available, otherwise the owner checks by hand. Confirm each item:
1. `http://localhost:8080/`, `/ru/`, `/kz/` all load; the header switcher highlights the current language; `ҚАЗ` has the beta badge; the Kwaaka card shows `1 yr 6 mos` (or the current equivalent) in EN, `г./мес.` in RU, `жыл/ай` in KZ.
2. At 360px, 768px and 1280px wide: no horizontal scrollbar; text in RU and KZ wraps; Kazakh letters (ә ғ қ ң ө ұ ү һ і) render in Inter, not a fallback font.
3. Theme button flips dark/light, survives a reload, and a first visit with the OS set to light starts light.
4. Language persistence: click `РУ`, go to `/` — redirected to `/ru/`; click `EN`, go to `/` — stays on `/`. In DevTools run `localStorage.setItem('lang','evil')` and reload `/` — no redirect.
5. Terminal: press `` ` `` — opens; `help`, `whoami`, `stack`, `contact`, `theme light`, `lang kz`, `clear`, `exit` work; `<img src=x onerror=alert(1)>` prints as plain text; Esc closes and focus returns; the header `>_` button opens it; Konami (↑↑↓↓←→←→BA) opens it.
6. With DevTools → Application → block site data (or a private window), the page still renders and the theme button still switches the theme for the current visit.
7. Keyboard only: Tab reaches skip link, nav, switcher, buttons with a visible focus ring; with `prefers-reduced-motion` emulated, cards appear without animation.
8. `http://localhost:8080/does-not-exist` shows the 404 page (the `http-server` dev server serves `404.html`).
9. Disable JavaScript: all copy is readable (no blank cards).

Record failures and fix them in the relevant file, then re-run `npm run build && npm test`.

- [ ] **Step 7: Lighthouse**

Run:
```bash
npx --yes lighthouse http://localhost:8080/ --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new" --quiet --output=json --output-path=./lighthouse-home.json
node -e "const r=require('./lighthouse-home.json');for(const [k,v] of Object.entries(r.categories))console.log(k,Math.round(v.score*100))"
```
Expected: all four scores 95 or higher (a local server has no HTTP caching, so a slightly lower performance score is acceptable if the cause is only that). Delete `lighthouse-home.json` afterwards (`rm lighthouse-home.json`); do not commit it.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: remove legacy files, add asset link tests" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Hand over for publishing**

Do not push. Tell the owner: Phase 1 is committed on `main` locally; pushing `main` publishes it to GitHub Pages; the owner should review the About text, the Kwaaka description and the KZ translation first (Spec §12).

---

## Self-Review

**Spec coverage:** positioning and copy — Tasks 4, 5; Kwaaka experience with auto duration — Tasks 2, 4, 5; languages with `/`, `/ru/`, `/kz/`, hreflang, beta badge — Tasks 4, 5; architecture and data-driven content — Tasks 4, 5; home sections and visual design, light/dark, reveal, responsive — Tasks 5, 6, 9; terminal — Task 7; images/perf and legacy cleanup, `.idea` untracking — Tasks 1, 8, 10; error handling (storage, no-JS) — Tasks 6, 9, 10; testing and Lighthouse — Tasks 2–7, 10. Terminal CTF flags and `/lab` are Phase 2 by the spec's phasing.

**Placeholder scan:** no TBD/TODO; every code step contains the code.

**Type consistency:** `monthsBetween`/`formatDuration`/`initDuration` (Task 2) are used unchanged by `build.mjs` (Task 5) and `main.js` (Task 6); `render`/`escapeHtml` (Task 3) match their use in Task 5; `runCommand` return shape `{lines, action}` matches `terminal.js` (Task 7); `readStored`/`writeStored` (Task 6) are used by `theme.js` and `lang.js`; DOM ids/data attributes in the template (Task 5) match the selectors in Tasks 6–7; asset file names in Task 8 match the template and `tokens.css`.
