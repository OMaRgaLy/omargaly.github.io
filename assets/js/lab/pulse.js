import { $, initLabPage, showError } from './common.js';
import { cachedJson, summarizeRepos, activityByDay, heatmapSvg, languageBarsSvg } from './lib/pulse.js';

initLabPage();

const user = $('#pulse').dataset.user;
const API = `https://api.github.com/users/${encodeURIComponent(user)}`;

function renderRepos(top) {
  const list = $('#p-repos');
  list.replaceChildren();
  for (const r of top) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = r.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = r.name;
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = ` ${[r.language, r.stars ? `${r.stars} stars` : null].filter(Boolean).join(' · ')}`;
    li.append(a, meta);
    if (r.description) {
      const p = document.createElement('p');
      p.textContent = r.description;
      li.appendChild(p);
    }
    list.appendChild(li);
  }
}

async function load() {
  try {
    const [profile, repos, events] = await Promise.all([
      cachedJson(API),
      cachedJson(`${API}/repos?per_page=100&sort=pushed`),
      cachedJson(`${API}/events/public?per_page=100`),
    ]);
    const summary = summarizeRepos(repos.data);
    const activity = activityByDay(events.data);
    const p = profile.data;
    $('#p-profile').textContent = `${p.name ?? user}: ${summary.count} public repositories, ${p.followers ?? 0} followers, on GitHub since ${String(p.created_at ?? '').slice(0, 4) || 'n/a'}.`;
    $('#p-heatmap').innerHTML = heatmapSvg(activity.byDate); // generated SVG: numbers and ISO dates only
    $('#p-activity-note').textContent = `${activity.total} public events in the available window.`;
    $('#p-langs').innerHTML = summary.languages.length ? languageBarsSvg(summary.languages) : ''; // names are escaped by the generator
    renderRepos(summary.top);
    const stale = [profile, repos, events].find((r) => r.stale);
    $('#p-status').textContent = stale ? `Showing cached data (${stale.error}).` : '';
    $('#p-body').hidden = false;
  } catch (err) {
    $('#p-status').textContent = '';
    showError($('#p-err'), new Error(`Could not load GitHub data (${err.message}). Try again in a few minutes or open GitHub directly.`));
  }
}

load();
