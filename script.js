// Files shown in the explorer / tab strip. Keys match data-file attributes and URL hashes.
const FILES = {
  index:     { name: 'index.html', icon: 'i-html',   lang: 'HTML' },
  assets:    { name: 'assets',     icon: 'i-folder', lang: 'Folder' },
  env:       { name: '.env',       icon: 'i-env',    lang: 'Properties' },
  thesis:    { name: 'thesis.ipynb', icon: 'i-ipynb', lang: 'Jupyter Notebook' },
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
    return `<div class="bar-row" tabindex="0" data-i="${i}" style="--i:${i}" aria-label="${r.label}: ${c.value(r)}">
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

// ───────── thesis.ipynb: each cell "runs" when it scrolls into view ─────────
// Values from the final thesis notebooks; the cleaning funnel was re-derived from Final Data Cleaned.xlsx
const nb = document.querySelector('.nb');
if (nb) {
  nb.classList.add('nb-js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 01 · Apify returns 238 columns per posting; these are the positions of the 9 the pipeline keeps
  const KEPT = [11, 12, 13, 17, 18, 123, 131, 211, 236];
  document.getElementById('nb-fields').innerHTML = Array.from({ length: 238 }, (_, i) => {
    const k = KEPT.indexOf(i);
    return k < 0 ? `<i style="--i:${i}"></i>` : `<i class="on" style="--i:${i};--k:${k}"></i>`;
  }).join('');

  // Column charts
  const COLS = {
    months: { rows: [['Nov', 108], ['Dec', 174], ['Jan', 271], ['Feb', 313], ['Mar', 191]] },
    salary: {
      dense: true, unit: 'postings',
      rows: [['0', 2], ['10K', 58], ['20K', 180], ['30K', 187], ['40K', 113], ['50K', 93], ['60K', 108],
        ['70K', 119], ['80K', 58], ['90K', 71], ['100K', 32], ['110K', 28], ['120K', 8]],
    },
  };
  nb.querySelectorAll('[data-cols]').forEach((el) => {
    const c = COLS[el.dataset.cols];
    const max = Math.max(...c.rows.map((r) => r[1]));
    el.classList.toggle('dense', !!c.dense);
    el.innerHTML = c.rows.map(([label, v], i) =>
      `<span class="nb-col${v === max ? ' peak' : ''}" style="--h:${(v / max) * 100}%;--i:${i}" title="₱${label}: ${v} ${c.unit || 'postings'}"><b></b><em>${v}</em></span>`).join('');
    el.insertAdjacentHTML('afterend', `<div class="nb-cols-x">${c.rows.map(([l], i) =>
      `<span>${c.dense && i % 2 ? '' : l}</span>`).join('')}</div>`);
  });

  // 03 · cleaning funnel
  const FUNNEL = [
    ['Postings with extracted skills', 1318],
    ['Job title appears only once', 1292],
    ['Hourly or daily pay', 1263],
    ['No stated salary', 1111],
    ['Above the 95th percentile (₱100K min / ₱150K max)', 1057],
  ];
  document.getElementById('nb-funnel').innerHTML = FUNNEL.map(([label, n], i) => `
    <div class="nb-fun${i === FUNNEL.length - 1 ? ' last' : ''}">
      <p class="nb-fun-label"><span>${label}</span><span>${i ? `−${FUNNEL[i - 1][1] - n}` : ''}</span></p>
      <span class="nb-fun-track"><b style="--w:${(n / FUNNEL[0][1]) * 100}%;--i:${i}"></b></span>
      <span class="nb-fun-n" data-count="${n}">${n.toLocaleString()}</span>
    </div>`).join('');

  // 04 · role families: ~10 postings per dot, shuffled in a grid, then sorted into stacks
  // Titles per family as printed by the clustering step in Final Notebook v3.1
  const FAMILIES = [
    ['Data Analyst', 380, 'var(--tok-tag)', ['Data Analyst', 'BI Analyst', 'BI Developer', 'Reporting Analyst', 'Marketing Analyst', 'Analytics Manager',
      'Data Associate', 'Data Coordinator', 'Data Conversion Operator', 'Junior Data Analyst', 'Senior Data Analyst']],
    ['Business Analyst', 303, 'var(--tok-type)', ['Business Analyst', 'Business Systems Analyst', 'Business Process Analyst',
      'Business Development Analyst', 'Senior Business Analyst']],
    ['Data Scientist', 128, 'var(--tok-key)', ['Data Scientist', 'Data Engineer', 'Machine Learning Engineer', 'ETL Developer', 'Cloud Engineer',
      'Data Consultant', 'Analytics Consultant', 'Data Science Manager', 'Senior Data Scientist']],
    ['Data Mgmt Specialist', 111, 'var(--tok-fn)', ['Data Specialist', 'Master Data Steward', 'Data Governance Analyst', 'Data Protection Officer',
      'Data Protection Specialist', 'Data Administrator', 'Data Manager', 'Data Processor', 'HR Analytics Manager', 'Business Development Manager',
      'Senior Data Specialist']],
    ['Financial Analyst', 78, 'var(--tok-str)', ['Financial Analyst', 'Junior Financial Analyst']],
    ['Database Engineer', 57, 'var(--tok-var)', ['Database Administrator', 'Database Developer', 'Data Warehouse Engineer', 'Database Engineer',
      'Senior Database Administrator']],
  ];
  const dots = FAMILIES.flatMap(([, n, color], g) => Array.from({ length: Math.round(n / 10) }, (_, j) => ({ g, j, color })));
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const slots = dots.map((_, i) => i).sort(() => rand() - .5);
  const dotsEl = document.getElementById('nb-dots');
  dotsEl.innerHTML = dots.map(() => '<circle r="5"></circle>').join('');
  const circles = [...dotsEl.children];
  const mixDots = () => circles.forEach((c, i) => {
    const s = slots[i];
    c.style.transform = `translate(${30 + (s % 18) * 32}px, ${30 + Math.floor(s / 18) * 32}px)`;
    c.style.fill = '#555';
  });
  const sortDots = () => circles.forEach((c, i) => {
    const { g, j, color } = dots[i];
    c.style.setProperty('--dc', `${200 + rand() * 300}ms`);
    c.style.setProperty('--dl', `${700 + rand() * 400}ms`);
    c.style.transform = `translate(${50 + g * 100 + ((j % 4) - 1.5) * 14}px, ${204 - Math.floor(j / 4) * 14}px)`;
    c.style.fill = color;
  });
  mixDots();
  document.getElementById('nb-legend').innerHTML = FAMILIES.map(([name, n, color, titles]) =>
    `<li style="--c:${color}" title="${titles.join(', ')}"><i></i><b>${name}</b><em>${n}</em>
      <small>${titles.length} title${titles.length > 1 ? 's' : ''} · ${titles.slice(0, 3).join(', ')}${titles.length > 3 ? ', …' : ''}</small></li>`).join('');

  // Line charts, with values read off the plots saved in Final Notebook v3.1
  const FEATURE_R2 = [.315, .355, .375, .371, .383, .404, .384, .390, .414, .416, .417, .417, .420, .417, .424, .414, .418, .416,
    .418, .411, .405, .409, .417, .417, .418, .416, .420, .411, .421, .414, .408, .426, .413, .419, .412, .406, .413, .419, .412,
    .406, .413, .414, .422, .411, .418, .418, .417, .413, .419, .405, .415, .420, .417, .421, .413, .417, .416, .416, .415, .422,
    .412, .416, .411, .412, .414, .420, .414, .415, .411, .413, .421];
  const LINES = {
    silhouette: {
      x: [2, 14], xTicks: [2, 4, 6, 8, 10, 12, 14], y: [.045, .087], yTicks: [.05, .06, .07, .08], fmt: (v) => v.toFixed(2),
      pts: [[2, .0834], [3, .0707], [4, .0756], [5, .0802], [6, .0808], [7, .0766], [8, .0592], [9, .0522], [10, .0479],
        [11, .0508], [12, .0510], [13, .0512], [14, .0512]],
      mark: [6, 'k = 6 · 0.081'], r: 4,
    },
    features: {
      x: [0, 720], xTicks: [0, 150, 300, 450, 600], y: [.30, .44], yTicks: [.32, .36, .40, .44], fmt: (v) => v.toFixed(2),
      pts: FEATURE_R2.map((v, i) => [(i + 1) * 10, v]),
      mark: [150, '150 kept · 0.424'], r: 2.4,
    },
  };
  nb.querySelectorAll('[data-line]').forEach((svg) => {
    const c = LINES[svg.dataset.line];
    const L = 50, R = 466, T = 16, B = 214;
    const sx = (v) => L + ((v - c.x[0]) / (c.x[1] - c.x[0])) * (R - L);
    const sy = (v) => B - ((v - c.y[0]) / (c.y[1] - c.y[0])) * (B - T);
    const [mx, mLabel] = c.mark, mp = c.pts.find((p) => p[0] === mx);
    svg.innerHTML = `
      ${c.yTicks.map((t) => `<line class="grid" x1="${L}" x2="${R}" y1="${sy(t)}" y2="${sy(t)}"/><text class="tick" x="${L - 8}" y="${sy(t) + 4}" text-anchor="end">${c.fmt(t)}</text>`).join('')}
      ${c.xTicks.map((t) => `<text class="tick" x="${sx(t)}" y="${B + 22}" text-anchor="middle">${t}</text>`).join('')}
      <line class="axis" x1="${L}" x2="${R}" y1="${B}" y2="${B}"/>
      <line class="mark-line" x1="${sx(mx)}" x2="${sx(mx)}" y1="${T}" y2="${B}"/>
      <polyline class="nb-path" pathLength="1" points="${c.pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')}"/>
      ${c.pts.map(([x, y], i) => `<circle class="pt" style="--i:${i}" r="${c.r}" cx="${sx(x)}" cy="${sy(y)}"/>`).join('')}
      <circle class="pt-mark" r="${c.r + 3}" cx="${sx(mp[0])}" cy="${sy(mp[1])}"/>
      <text class="mark-label" x="${sx(mx) + 8}" y="${B - 10}">${mLabel}</text>`;
  });

  // Execution: [ ] → [*] while running → [n], numbered in run order like Jupyter
  const kernel = nb.closest('.pane').querySelector('.nb-kernel');
  const cells = [...nb.querySelectorAll('.nb-title, .nb-cell')];
  let execCount = 0, busy = 0;

  const countUp = (el) => {
    const end = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now();
    const tick = (t) => {
      const k = Math.min((t - t0) / 900, 1);
      el.textContent = Math.round(end * (1 - (1 - k) ** 3)).toLocaleString() + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const run = (cell) => {
    if (cell.classList.contains('ran')) return;
    const gutter = cell.querySelector('.nb-gutter');
    cell.classList.add('ran', 'running');
    if (gutter) gutter.textContent = '[*]:';
    kernel.classList.add('busy'); busy++;
    if (!reduced) cell.querySelectorAll('[data-count]').forEach(countUp);
    if (cell.contains(dotsEl)) sortDots();
    setTimeout(() => {
      cell.classList.remove('running');
      if (gutter) gutter.textContent = `[${++execCount}]:`;
      if (--busy === 0) kernel.classList.remove('busy');
    }, 700);
  };

  // Runs once the cell's top is in the upper three-quarters of the view, or straight away if it's already above it
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting || e.boundingClientRect.bottom < 0) { run(e.target); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -25% 0px' });
  const observeAll = () => (reduced ? cells.forEach(run) : cells.forEach((c) => io.observe(c)));
  observeAll();

  document.getElementById('nb-run-all').addEventListener('click', () => {
    nb.classList.add('nb-reset');
    cells.forEach((c) => {
      c.classList.remove('ran', 'running');
      const gutter = c.querySelector('.nb-gutter');
      if (gutter) gutter.textContent = '[ ]:';
    });
    mixDots();
    void nb.offsetHeight; // apply the reset with transitions off, then let them play again
    nb.classList.remove('nb-reset');
    io.disconnect();
    observeAll();
  });
}

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
