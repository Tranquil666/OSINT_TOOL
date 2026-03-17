// ─── App bootstrap & glue ────────────────────────────────────────────────────
let filters = { region: 'all', intensity: 'all', search: '' };

document.addEventListener('DOMContentLoaded', async () => {
    initMap();

    const sorted = sortByIntensity(CONFLICTS_DATA);
    renderConflictList(sorted);
    renderMarkers(sorted);
    updateStats();

    setupListeners();
    tickClock();
    setInterval(tickClock, 1000);

    await fetchAllNews();
    setInterval(fetchAllNews, CONFIG.NEWS_REFRESH_MS);

    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        ls.style.opacity = '0';
        setTimeout(() => ls.remove(), 600);
    }, 2200);
});

// ─── Conflict list rendering ─────────────────────────────────────────────────
function renderConflictList(list) {
    const el = document.getElementById('conflict-list');
    if (!list.length) {
        el.innerHTML = `<div class="no-data"><i class="fas fa-search"></i><p>No conflicts match your filters.</p></div>`;
        return;
    }
    el.innerHTML = list.map(c => `
        <div class="conflict-card int-${c.intensity}" data-id="${c.id}" onclick="handleCardClick('${c.id}')">
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

// ─── Event listeners ─────────────────────────────────────────────────────────
function setupListeners() {
    document.getElementById('close-detail').addEventListener('click', closeDetail);

    document.getElementById('region-filter').addEventListener('change', e => {
        filters.region = e.target.value; applyFilters();
    });
    document.getElementById('intensity-filter').addEventListener('change', e => {
        filters.intensity = e.target.value; applyFilters();
    });
    document.getElementById('search-input').addEventListener('input', e => {
        filters.search = e.target.value; applyFilters();
    });

    document.getElementById('source-filter').addEventListener('change', e => {
        activeSource = e.target.value; renderNews();
    });
    document.getElementById('refresh-btn').addEventListener('click', fetchAllNews);
}
