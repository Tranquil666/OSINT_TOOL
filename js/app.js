// ─── App bootstrap & glue ────────────────────────────────────────────────────
let filters = { region: 'all', intensity: 'all', search: '' };

function debounce(fn, delay) {
    let timer;
    return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
}

document.addEventListener('DOMContentLoaded', async () => {
    initMap();

    await Promise.all([loadConflictsData(), loadMaritimeData()]);

    const sorted = sortByIntensity(CONFLICTS_DATA);
    renderConflictList(sorted);
    renderMarkers(sorted);
    fitMapToMarkers(sorted);
    updateStats();

    setupListeners();
    tickClock();
    setInterval(tickClock, 1000);

    // Initialise maritime overlays and tab
    initMaritime();
    setupMaritimeMapListeners();

    await Promise.all([
        fetchAllNews(),
        fetchMaritimeNews()
    ]);
    setInterval(fetchAllNews,      CONFIG.NEWS_REFRESH_MS);
    setInterval(fetchMaritimeNews, CONFIG.NEWS_REFRESH_MS);

    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        ls.style.opacity = '0';
        setTimeout(() => ls.remove(), 600);
    }, 2200);
});

// ─── Refresh conflict & maritime data from JSON files ────────────────────────
async function refreshConflictData() {
    const btn = document.getElementById('data-refresh-btn');
    if (btn) { btn.disabled = true; btn.querySelector('i').classList.add('fa-spin'); }

    await Promise.all([loadConflictsData(), loadMaritimeData()]);

    filters = { region: 'all', intensity: 'all', search: '' };
    const regionEl    = document.getElementById('region-filter');
    const intensityEl = document.getElementById('intensity-filter');
    const searchEl    = document.getElementById('search-input');
    if (regionEl)    regionEl.value    = 'all';
    if (intensityEl) intensityEl.value = 'all';
    if (searchEl)    searchEl.value    = '';

    const sorted = sortByIntensity(CONFLICTS_DATA);
    renderConflictList(sorted);
    renderMarkers(sorted);
    updateStats();

    initMaritime();

    if (btn) { btn.disabled = false; btn.querySelector('i').classList.remove('fa-spin'); }
}

// ─── Right panel news tab switching ──────────────────────────────────────────
function switchNewsTab(tab) {
    const isConflict = (tab === 'conflict');
    document.getElementById('news-tab-conflict').classList.toggle('tab-active', isConflict);
    document.getElementById('news-tab-maritime').classList.toggle('tab-active', !isConflict);
    document.getElementById('conflict-news-filters').style.display  = isConflict ? '' : 'none';
    document.getElementById('maritime-news-filters').style.display  = isConflict ? 'none' : '';
    document.getElementById('conflict-news-wrap').style.display     = isConflict ? 'flex' : 'none';
    document.getElementById('maritime-news-wrap').style.display     = isConflict ? 'none' : 'flex';
}

// ─── Conflict list rendering ─────────────────────────────────────────────────
function renderConflictList(list) {
    const el = document.getElementById('conflict-list');
    const countEl = document.getElementById('conflict-count');
    if (countEl) countEl.textContent = list.length;
    if (!list.length) {
        el.innerHTML = `<div class="no-data"><i class="fas fa-search"></i><p>No conflicts match your filters.</p></div>`;
        return;
    }
    el.innerHTML = list.map(c => `
        <div class="conflict-card int-${c.intensity}" role="listitem" data-id="${c.id}" onclick="handleCardClick('${c.id}')">
            <div class="cc-top">
                <span class="cc-name">${c.name}</span>
                <span class="cc-badge badge-${c.intensity}">${c.intensity.toUpperCase()}</span>
            </div>
            <div class="cc-meta">
                <span><i class="fas fa-map-marker-alt"></i>${c.country}</span>
                <span><i class="fas fa-tag"></i>${c.type}</span>
            </div>
            <div class="cc-desc">${c.description.substring(0, 110)}…</div>
            <div class="cc-tags">
                ${c.tags.slice(0,3).map(t => `<span class="tag">${t}</span>`).join('')}
                <span class="tag tag-cas"><i class="fas fa-skull-crossbones"></i>${c.casualties}</span>
            </div>
        </div>
    `).join('');
}

// ─── Detail panel ────────────────────────────────────────────────────────────
function formatDate(s) {
    if (!s || s === 'Unknown') return 'Unknown';
    try { return new Date(s).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }); }
    catch { return s; }
}

function openDetail(id) {
    const c = CONFLICTS_DATA.find(x => x.id === id);
    if (!c) return;
    const col = { critical:'#ff1744', high:'#ff6d00', medium:'#ffab00', low:'#ffd600', tension:'#2979ff' }[c.intensity] || '#888';

    document.getElementById('detail-body').innerHTML = `
        <div class="det-title">${c.name}</div>
        <div class="det-sub">
            <span class="det-badge" style="background:${col}22;border-color:${col};color:${col}">${c.intensity.toUpperCase()}</span>
            <span>${c.type}</span>
        </div>
        <p class="det-desc">${c.description}</p>
        <div class="det-grid">
            <div class="det-cell"><div class="dcl">LOCATION</div><div class="dcv">📍 ${c.country}</div></div>
            <div class="det-cell"><div class="dcl">STATUS</div><div class="dcv" style="color:${c.status==='Active'?col:'var(--cyan)'}">● ${c.status}</div></div>
            <div class="det-cell"><div class="dcl">CASUALTIES</div><div class="dcv">💀 ${c.casualties}</div></div>
            <div class="det-cell"><div class="dcl">DISPLACED</div><div class="dcv">🏕️ ${c.displaced}</div></div>
            <div class="det-cell"><div class="dcl">STARTED</div><div class="dcv">📅 ${formatDate(c.started)}</div></div>
            <div class="det-cell"><div class="dcl">REGION</div><div class="dcv">🌍 ${c.region.replace('-',' ').toUpperCase()}</div></div>
        </div>
        <div class="det-section-title">PARTIES INVOLVED</div>
        <div class="det-parties">${c.parties.map(p=>`<span class="party">${p}</span>`).join('')}</div>
        <div class="cc-tags" style="margin-bottom:.75rem">${c.tags.map(t=>`<span class="tag">#${t}</span>`).join('')}</div>
        <div class="det-sources"><i class="fas fa-database"></i> Sources: ACLED · Wikipedia · UCDP · Open Sources</div>
    `;

    document.getElementById('detail-panel').classList.add('visible');
}

function closeDetail() {
    document.getElementById('detail-panel').classList.remove('visible');
    document.querySelectorAll('.conflict-card').forEach(el => el.classList.remove('is-active'));
}

function handleCardClick(id) {
    highlightCard(id);
    openDetail(id);
    flyToConflict(id);
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function updateStats() {
    const counts = getRegionCounts();
    // Event weights are rough monthly event estimates per intensity level (ACLED-based methodology)
    const WEIGHTS = { critical: 10, high: 6, medium: 3, low: 1, tension: 1 };
    document.getElementById('stat-active').textContent   = CONFLICTS_DATA.length;
    document.getElementById('stat-events').textContent   =
        CONFLICTS_DATA.reduce((s, c) => s + (WEIGHTS[c.intensity] || 1), 0) + 'K+';
    document.getElementById('stat-europe').textContent   = counts.europe;
    document.getElementById('stat-africa').textContent   = counts.africa;
    document.getElementById('stat-mideast').textContent  = counts['middle-east'];
    document.getElementById('stat-asia').textContent     = counts.asia;
    document.getElementById('stat-americas').textContent = counts.americas;
}

// ─── Filters ─────────────────────────────────────────────────────────────────
function applyFilters() {
    const filtered = filterConflicts(filters.region, filters.intensity, filters.search);
    const sorted   = sortByIntensity(filtered);
    renderConflictList(sorted);
    renderMarkers(sorted);
    document.getElementById('stat-active').textContent = sorted.length;
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function tickClock() {
    const el = document.getElementById('clock');
    if (el) el.textContent = new Date().toUTCString().replace(' GMT', ' UTC');
}

// ─── Export ───────────────────────────────────────────────────────────────────
function exportConflictsCSV() {
    const filtered = filterConflicts(filters.region, filters.intensity, filters.search);
    const sorted   = sortByIntensity(filtered);
    const headers  = ['Name','Region','Country','Intensity','Type','Status','Casualties','Displaced','Started','Parties'];
    const rows = sorted.map(c => [
        `"${c.name.replace(/"/g, '""')}"`,
        c.region, c.country, c.intensity, c.type, c.status,
        c.casualties, c.displaced, c.started,
        `"${c.parties.join('; ').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `warwatch-conflicts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── Event listeners ─────────────────────────────────────────────────────────
function setupListeners() {
    document.getElementById('close-detail').addEventListener('click', closeDetail);

    // Close detail panel with Escape key (only when panel is visible)
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.getElementById('detail-panel').classList.contains('visible')) {
            closeDetail();
        }
    });

    document.getElementById('region-filter').addEventListener('change', e => {
        filters.region = e.target.value; applyFilters();
    });
    document.getElementById('intensity-filter').addEventListener('change', e => {
        filters.intensity = e.target.value; applyFilters();
    });
    document.getElementById('search-input').addEventListener('input', debounce(e => {
        filters.search = e.target.value; applyFilters();
    }, 300));

    document.getElementById('source-filter').addEventListener('change', e => {
        activeSource = e.target.value; renderNews();
    });
    document.getElementById('refresh-btn').addEventListener('click', fetchAllNews);

    // News search functionality
    const newsSearchInput = document.getElementById('news-search-input');
    const newsSearchClear = document.getElementById('news-search-clear');
    if (newsSearchInput && newsSearchClear) {
        newsSearchInput.addEventListener('input', debounce(e => {
            const query = e.target.value.trim();
            searchNews(query);
            newsSearchClear.style.display = query ? 'block' : 'none';
        }, 300));

        newsSearchClear.addEventListener('click', () => {
            newsSearchInput.value = '';
            searchNews('');
            newsSearchClear.style.display = 'none';
            newsSearchInput.focus();
        });
    }

    const maritimeRefreshBtn = document.getElementById('maritime-refresh-btn');
    if (maritimeRefreshBtn) maritimeRefreshBtn.addEventListener('click', fetchMaritimeNews);

    document.getElementById('maritime-level-filter')?.addEventListener('change', applyMaritimeFilter);

    // Right panel tab switching (Intel Feed vs Maritime Feed)
    document.getElementById('news-tab-conflict')?.addEventListener('click', () => switchNewsTab('conflict'));
    document.getElementById('news-tab-maritime')?.addEventListener('click', () => switchNewsTab('maritime'));

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => showExportModal('conflicts'));

    const maritimeExportBtn = document.getElementById('maritime-export-btn');
    if (maritimeExportBtn) maritimeExportBtn.addEventListener('click', () => showExportModal('maritime'));

    const dataRefreshBtn = document.getElementById('data-refresh-btn');
    if (dataRefreshBtn) dataRefreshBtn.addEventListener('click', refreshConflictData);

    setupNewsListeners();
}
