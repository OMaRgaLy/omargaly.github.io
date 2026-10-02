import { $, initLabPage, showError } from './common.js';
import { cachedAll, summarizeRepos, activityByDay, heatmapSvg, languageBarsSvg } from './lib/pulse.js';

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
  const [profile, repos, events] = await cachedAll([
    API,
    `${API}/repos?per_page=100&sort=pushed`,
    `${API}/events/public?per_page=100`,
  ]);
  const results = [profile, repos, events];

  if (results.every((r) => !r.ok)) {
    $('#p-status').textContent = '';
    showError($('#p-err'), new Error(`Could not load GitHub data (${profile.error}). Try again in a few minutes or open GitHub directly.`));
    return;
  }

  const notes = [];
  const summary = repos.ok ? summarizeRepos(repos.value.data) : null;
  const p = profile.ok ? profile.value.data : null;

  const parts = [p?.name ?? user];
  if (summary) parts.push(`${summary.count} public repositories`);
  if (p) parts.push(`${p.followers ?? 0} followers, on GitHub since ${String(p.created_at ?? '').slice(0, 4) || 'n/a'}`);
  $('#p-profile').textContent = `${parts[0]}: ${parts.slice(1).join(', ') || 'details unavailable'}.`;

  if (events.ok) {
    const activity = activityByDay(events.value.data);
    $('#p-heatmap').innerHTML = heatmapSvg(activity.byDate); // generated SVG: numbers and ISO dates only
    $('#p-activity-note').textContent = `${activity.total} public events in the available window.`;
  } else {
    $('#p-heatmap').replaceChildren();
    $('#p-activity-note').textContent = 'Activity is unavailable right now.';
    notes.push(events.error);
  }

  if (summary) {
    $('#p-langs').innerHTML = summary.languages.length ? languageBarsSvg(summary.languages) : ''; // names are escaped by the generator
    renderRepos(summary.top);
  } else {
    $('#p-langs').replaceChildren();
    $('#p-repos').replaceChildren();
    notes.push(repos.error);
  }

  const stale = results.find((r) => r.ok && r.value.stale);
  if (stale) notes.push(`showing cached data (${stale.value.error})`);
  $('#p-status').textContent = notes.length ? `Some data is missing: ${[...new Set(notes)].join('; ')}.` : '';
  $('#p-body').hidden = false;
}

load();
