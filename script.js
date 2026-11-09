// Files shown in the explorer / tab strip. Keys match data-file attributes and URL hashes.
const FILES = {
  index:     { name: 'index.html', icon: 'i-html',   lang: 'HTML' },
  assets:    { name: 'assets',     icon: 'i-folder', lang: 'Folder' },
  env:       { name: '.env',       icon: 'i-env',    lang: 'Properties' },
};

const tabsEl = document.getElementById('tabs');
const breadcrumbsEl = document.getElementById('breadcrumbs');
const emptyEl = document.getElementById('empty');
const statusLang = document.getElementById('status-lang');
const mobileFile = document.getElementById('mobile-file');

let openTabs = ['index'];
let active = null;

const icon = (id) => `<svg class="file-icon"><use href="#${id}"/></svg>`;

function render() {
  tabsEl.innerHTML = openTabs.map((id) => `
    <div class="tab${id === active ? ' active' : ''}" role="tab" tabindex="0" data-file="${id}" aria-selected="${id === active}">
      ${icon(FILES[id].icon)}<span>${FILES[id].name}</span>
      <button class="tab-close" data-close="${id}" aria-label="Close ${FILES[id].name}"><svg><use href="#i-close"/></svg></button>
    </div>`).join('');

  document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('active', p.dataset.file === active));
  document.querySelectorAll('.tree-item, .mobile-nav a').forEach((a) => a.classList.toggle('active', a.dataset.file === active));
  emptyEl.classList.toggle('active', !active);

  const file = FILES[active];
  breadcrumbsEl.innerHTML = file ? `<span>keith-paddit</span><span>›</span>${icon(file.icon)}<span>${file.name}</span>` : '';
  statusLang.textContent = file ? file.lang : '';
  mobileFile.textContent = file ? file.name : '';
  document.title = `${file ? file.name + ' — ' : ''}Keith Paddit`;
}

function openFile(id, { updateHash = true } = {}) {
  if (!FILES[id]) return;
  if (!openTabs.includes(id)) openTabs.push(id);
  active = id;
  render();
  if (updateHash) history.replaceState(null, '', `#${id}`);
}

function closeFile(id) {
  const i = openTabs.indexOf(id);
  openTabs.splice(i, 1);
  if (active === id) active = openTabs[Math.min(i, openTabs.length - 1)] || null;
  render();
  history.replaceState(null, '', active ? `#${active}` : location.pathname);
}

// Explorer, mobile nav, and in-page "open this file" links
document.addEventListener('click', (e) => {
  const close = e.target.closest('[data-close]');
  if (close) { closeFile(close.dataset.close); return; }

  const scroll = e.target.closest('[data-scroll]');
  if (scroll) {
    e.preventDefault();
    document.getElementById(scroll.dataset.scroll).scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const opener = e.target.closest('[data-open], .tree-item, .mobile-nav a, .tab');
  if (opener) {
    e.preventDefault();
    openFile(opener.dataset.open || opener.dataset.file);
    return;
  }

  // Placeholder links go nowhere yet
  if (e.target.closest('a[href="#"]')) e.preventDefault();
});

tabsEl.addEventListener('keydown', (e) => {
  const tab = e.target.closest('.tab');
  if (tab && e.target === tab && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    openFile(tab.dataset.file);
  }
});

document.getElementById('toggle-sidebar').addEventListener('click', (e) => {
  const collapsed = document.getElementById('sidebar').classList.toggle('collapsed');
  e.currentTarget.classList.toggle('active', !collapsed);
});

// ───────── Thesis charts (values from the final thesis notebooks) ─────────
const peso = (n) => `₱${Math.round(n / 1000)}K`;

const CHARTS = {
  roles: {
    title: 'Average posted salary range by role family',
    sub: 'Monthly, 2025 postings · min to max',
    max: 100000, ticks: [0, 50000, 100000], range: true,
    rows: [
      { label: 'Data Scientist', lo: 61647, hi: 96390, y24: [51267, 73433] },
      { label: 'Database Engineer', lo: 56912, hi: 84294, y24: [47913, 66652] },
      { label: 'Business Analyst', lo: 48518, hi: 63954, y24: [42113, 55567] },
      { label: 'Data Analyst', lo: 41963, hi: 55205, y24: [37175, 48596] },
      { label: 'Data Mgmt Specialist', lo: 37999, hi: 53028, y24: [36950, 48000] },
      { label: 'Financial Analyst', lo: 37914, hi: 49252, y24: [35290, 44651] },
    ],
    tip: (r) => `<b>${r.label}</b><br>2025: ${peso(r.lo)} – ${peso(r.hi)}<br>2024: ${peso(r.y24[0])} – ${peso(r.y24[1])}`,
    value: (r) => `${peso(r.lo)}–${peso(r.hi)}`,
  },
  skills: {
    title: 'Most requested technical skills',
    sub: 'Mentions across 1,057 postings',
    max: 450, ticks: [0, 200, 400],
    rows: [
      { label: 'Microsoft Excel', v: 414 },
      { label: 'SQL', v: 403 },
      { label: 'Data Analysis', v: 311 },
      { label: 'Python', v: 182 },
      { label: 'Data Visualization', v: 161 },
      { label: 'Power BI', v: 145 },
      { label: 'Tableau', v: 118 },
      { label: 'ETL', v: 91 },
    ],
    tip: (r) => `<b>${r.label}</b><br>${r.v} mentions · ${(r.v / 1057 * 100).toFixed(0)}% of postings`,
    value: (r) => r.v,
  },
  models: {
    title: 'Model error on the held-out test set',
    sub: 'Mean absolute error, max salary · lower is better',
    max: 40000, ticks: [0, 20000, 40000], fmt: peso,
    rows: [
      { label: 'XGBoost', v: 17060, best: true, r2: 0.44, minMae: 14200 },
      { label: 'LightGBM', v: 19388, r2: 0.35, minMae: 16274 },
      { label: 'Random Forest', v: 22003, r2: 0.30, minMae: 16686 },
      { label: 'Linear Regression', v: 35490, r2: -1.80, minMae: 26171 },
    ],
    tip: (r) => `<b>${r.label}</b><br>MAE max salary: ${peso(r.v)}<br>MAE min salary: ${peso(r.minMae)}<br>R² max salary: ${r.r2.toFixed(2)}`,
    value: (r) => peso(r.v),
  },
  value: {
    title: 'Highest estimated skill value',
    sub: 'XGBoost importance scaled to pesos per month',
    max: 18000, ticks: [0, 9000, 18000], fmt: peso,
    note: 'Relative importance in the model, not a guaranteed raise.',
    rows: [
      { label: 'Data Enrichment', v: 16249 },
      { label: 'AI', v: 15057 },
      { label: 'Data Loading', v: 10547 },
      { label: 'API Development', v: 9039 },
      { label: 'AWS DMS', v: 8537 },
      { label: 'Azure Data Factory', v: 8105 },
      { label: 'Application Dev', v: 7906 },
      { label: 'Azure Databricks', v: 7076 },
    ],
    tip: (r) => `<b>${r.label}</b><br>≈ ₱${r.v.toLocaleString()} / month`,
    value: (r) => peso(r.v),
  },
};

function renderChart(el) {
  const c = CHARTS[el.dataset.chart];
  const pct = (n) => `${(n / c.max) * 100}%`;
  const fmt = c.fmt || ((n) => (c.range ? peso(n) : n));

  const rows = c.rows.map((r, i) => {
    const bar = c.range
      ? `<span class="bar range" style="margin-left:${pct(r.lo)};width:${pct(r.hi - r.lo)}"></span>`
      : `<span class="bar${c.rows.some((x) => x.best) && !r.best ? ' muted' : ''}" style="width:${pct(r.v)}"></span>`;
    return `<div class="bar-row" tabindex="0" data-i="${i}" aria-label="${r.label}: ${c.value(r)}">
      <span class="bar-label" title="${r.label}">${r.label}</span>
      <span class="bar-track">${bar}<span class="bar-value">${c.value(r)}</span></span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <figcaption><div class="chart-title">${c.title}</div><div class="chart-sub">${c.sub}</div></figcaption>
    <div class="bars">${rows}</div>
    <div class="bar-axis" aria-hidden="true"><span></span><div>${c.ticks.map((t) => `<span>${fmt(t)}</span>`).join('')}</div></div>
    ${c.note ? `<p class="chart-note">${c.note}</p>` : ''}`;
}

document.querySelectorAll('[data-chart]').forEach(renderChart);

const tip = document.getElementById('chart-tip');
function showTip(row, x, y) {
  const c = CHARTS[row.closest('[data-chart]').dataset.chart];
  tip.innerHTML = c.tip(c.rows[row.dataset.i]);
  tip.classList.add('show');
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = `${Math.min(x + 14, innerWidth - w - 8)}px`;
  tip.style.top = `${y - h - 10 < 8 ? y + 16 : y - h - 10}px`;
}
document.addEventListener('pointermove', (e) => {
  const row = e.target.closest?.('.bar-row');
  row ? showTip(row, e.clientX, e.clientY) : tip.classList.remove('show');
});
document.addEventListener('focusin', (e) => {
  const row = e.target.closest('.bar-row');
  if (!row) { tip.classList.remove('show'); return; }
  const r = row.getBoundingClientRect();
  showTip(row, r.left + 120, r.top);
});
document.addEventListener('scroll', () => tip.classList.remove('show'), true);

// ───────── Hover-to-play project videos (tap to toggle on touch screens) ─────────
document.querySelectorAll('.hover-video').forEach((video) => {
  const fig = video.closest('.media');
  if (matchMedia('(hover: none)').matches) fig.querySelector('.play-hint').textContent = '▶ Tap to play';
  const play = () => { video.play().catch(() => {}); fig.classList.add('playing'); };
  const stop = () => { video.pause(); video.currentTime = 0; fig.classList.remove('playing'); };
  video.addEventListener('mouseenter', play);
  video.addEventListener('mouseleave', stop);
  video.addEventListener('click', () => (video.paused ? play() : stop()));
});

// ───────── Mobile extras (their controls are hidden by CSS on desktop) ─────────
// Long bullet lists fold like a code region; only the mobile stylesheet hides the folded lines
const FOLD_KEEP = 2;
document.querySelectorAll('.points').forEach((list) => {
  const hidden = list.children.length - FOLD_KEEP;
  if (hidden < 2) return;
  list.classList.add('foldable');
  const btn = document.createElement('button');
  btn.className = 'fold-toggle';
  btn.setAttribute('aria-expanded', 'false');
  const label = () => (list.classList.contains('open') ? '▴ show less' : `{ ⋯ } ${hidden} more`);
  btn.textContent = label();
  btn.addEventListener('click', () => {
    list.classList.toggle('open');
    btn.setAttribute('aria-expanded', list.classList.contains('open'));
    btn.textContent = label();
  });
  list.after(btn);
});

// Thesis charts get tabs on mobile, one chart shown at a time
const CHART_TABS = { roles: 'Salaries', skills: 'Skills', models: 'Models', value: 'Value' };
document.querySelectorAll('.charts').forEach((group) => {
  const charts = [...group.children];
  const tabs = document.createElement('div');
  tabs.className = 'm-chart-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.innerHTML = charts.map((c) => `<button role="tab">${CHART_TABS[c.dataset.chart]}</button>`).join('');
  const select = (i) => {
    charts.forEach((c, j) => c.classList.toggle('on', j === i));
    [...tabs.children].forEach((b, j) => b.setAttribute('aria-selected', j === i));
  };
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) select([...tabs.children].indexOf(b));
  });
  select(0);
  group.before(tabs);
});

window.addEventListener('hashchange', () => openFile(location.hash.slice(1), { updateHash: false }));

openFile(FILES[location.hash.slice(1)] ? location.hash.slice(1) : 'index', { updateHash: false });
