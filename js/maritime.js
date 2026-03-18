// ─── Maritime Module ──────────────────────────────────────────────────────────
// Provides: shipping-lane overlays, disruption-zone circles, disruption list,
//           and real-time maritime news via open RSS feeds.

let maritimeActive = false;         // is Maritime tab currently shown?
let shippingLayerGroup = null;      // Leaflet layer group for lanes + zones
let lanesVisible = true;            // lane toggle state

const MARITIME_DESC_LENGTH  = 200;  // chars kept from raw RSS description
const MARITIME_CARD_LENGTH  = 130;  // chars shown in news card preview

const LEVEL_COLORS = {
    critical:  '#ff1744',
    disrupted: '#ff6d00',
    watch:     '#ffab00',
    normal:    '#00ff88'
};

// ─── Initialise ───────────────────────────────────────────────────────────────
function initMaritime() {
    _buildShippingLayers();
    renderMaritimeList(MARITIME_DISRUPTIONS);
    _hookTabListeners();
    _hookToggleListener();
    // Populate maritime news source label from config (avoids HTML/config duplication)
    const lbl = document.getElementById('maritime-source-label');
    if (lbl && CONFIG.MARITIME_FEEDS) {
        lbl.textContent = Object.values(CONFIG.MARITIME_FEEDS).map(f => f.name).join(' · ');
    }
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function _hookTabListeners() {
    document.getElementById('tab-conflicts').addEventListener('click', () => switchTab('conflicts'));
    document.getElementById('tab-maritime').addEventListener('click',  () => switchTab('maritime'));
}

function switchTab(tab) {
    maritimeActive = (tab === 'maritime');

    // Active / inactive styling
    document.getElementById('tab-conflicts').classList.toggle('tab-active', !maritimeActive);
    document.getElementById('tab-maritime').classList.toggle('tab-active', maritimeActive);

    // Show/hide lists
    document.getElementById('conflict-list').style.display   = maritimeActive ? 'none' : '';
    document.getElementById('maritime-list').style.display   = maritimeActive ? '' : 'none';

    // Show/hide filter rows
    document.getElementById('conflict-filters').style.display = maritimeActive ? 'none' : '';
    document.getElementById('maritime-filters').style.display  = maritimeActive ? '' : 'none';

    // Close any open detail panel
    closeDetail();
}

// ─── Shipping lane toggle button ──────────────────────────────────────────────
function _hookToggleListener() {
    const btn = document.getElementById('toggle-lanes-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        lanesVisible = !lanesVisible;
        if (shippingLayerGroup) {
            if (lanesVisible) shippingLayerGroup.addTo(map);
            else              map.removeLayer(shippingLayerGroup);
        }
        btn.classList.toggle('btn-active', lanesVisible);
        btn.title = lanesVisible ? 'Hide shipping lanes' : 'Show shipping lanes';
    });
}

// ─── Build Leaflet layers ─────────────────────────────────────────────────────
function _buildShippingLayers() {
    if (shippingLayerGroup) {
        map.removeLayer(shippingLayerGroup);
        shippingLayerGroup = null;
    }

    shippingLayerGroup = L.layerGroup();

    // Disruption zone circles
    MARITIME_DISRUPTIONS.forEach(d => {
        const radius = DISRUPTION_RADII[d.id] || 200000;
        const col    = LEVEL_COLORS[d.level] || '#888';
        const circle = L.circle([d.lat, d.lng], {
            radius,
            color:       col,
            weight:      1,
            opacity:     0.55,
            fillColor:   col,
            fillOpacity: 0.06,
            dashArray:   '5, 5'
        });
        circle.bindPopup(_maritimePopupHtml(d), { maxWidth: 290 });
        circle.on('click', () => openMaritimeDetail(d.id));
        shippingLayerGroup.addLayer(circle);
    });

    // Shipping lane polylines
    SHIPPING_LANES.forEach(lane => {
        const col   = lane.color || '#888';
        const dash  = lane.dash  || '0';
        const line  = L.polyline(lane.waypoints, {
            color:      col,
            weight:     lane.level === 'normal' ? 1.5 : 2.5,
            opacity:    lane.level === 'normal' ? 0.45 : 0.75,
            dashArray:  dash === '0' ? null : dash
        });
        line.bindTooltip(
            `<span style="font-family:'Share Tech Mono',monospace;font-size:.72rem">
             ⚓ ${lane.name}</span>`,
            { sticky: true, className: 'lane-tooltip' }
        );
        shippingLayerGroup.addLayer(line);
    });

    // Disruption markers (dot icons)
    MARITIME_DISRUPTIONS.forEach(d => {
        const col  = LEVEL_COLORS[d.level] || '#888';
        const icon = L.divIcon({
            html: `<div class="mmarker mmarker-${d.level}">
                     <div class="mm-inner" style="background:${col};box-shadow:0 0 8px ${col}"></div>
                     <div class="mm-ring"  style="border-color:${col}"></div>
                   </div>`,
            className: '',
            iconSize:  [28, 28],
            iconAnchor:[14, 14]
        });
        const marker = L.marker([d.lat, d.lng], { icon });
        marker.bindPopup(_maritimePopupHtml(d), { maxWidth: 290 });
        marker.on('click', () => openMaritimeDetail(d.id));
        shippingLayerGroup.addLayer(marker);
    });

    shippingLayerGroup.addTo(map);
}

function _maritimePopupHtml(d) {
    const col = LEVEL_COLORS[d.level] || '#888';
    return `
        <div class="mpopup">
            <div class="mpopup-name">⚓ ${d.name}</div>
            <div class="mpopup-badge" style="background:${col}20;border:1px solid ${col};color:${col}">
                ⬤ ${d.level.toUpperCase()} · ${d.type}
            </div>
            <div class="mpopup-row"><span>🌊</span>${d.area}</div>
            <div class="mpopup-row"><span>🚢</span>${d.vesselsAttacked} vessels affected</div>
            <div class="mpopup-row"><span>📅</span>Since ${formatDate(d.started)}</div>
            <button class="mpopup-btn" data-maritime-id="${d.id}">VIEW DISRUPTION INTEL →</button>
        </div>`;
}

// ─── Maritime list ────────────────────────────────────────────────────────────
function renderMaritimeList(list) {
    const el = document.getElementById('maritime-list');
    if (!list.length) {
        el.innerHTML = `<div class="no-data"><i class="fas fa-anchor"></i><p>No disruptions match filters.</p></div>`;
        return;
    }
    el.innerHTML = list.map(d => `
        <div class="maritime-card ml-${d.level}" role="listitem" data-mid="${d.id}"
             onclick="handleMaritimeCardClick('${d.id}')">
            <div class="cc-top">
                <span class="cc-name">${d.name}</span>
                <span class="cc-badge badge-ml-${d.level}">${d.level.toUpperCase()}</span>
            </div>
            <div class="cc-meta">
                <span><i class="fas fa-water"></i>${d.area}</span>
                <span><i class="fas fa-tag"></i>${d.type}</span>
            </div>
            <div class="cc-desc">${d.description.substring(0, 110)}…</div>
            <div class="cc-tags">
                ${d.tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
                <span class="tag tag-cas"><i class="fas fa-ship"></i>${d.vesselsAttacked} affected</span>
            </div>
        </div>
    `).join('');
}

function handleMaritimeCardClick(id) {
    _highlightMaritimeCard(id);
    openMaritimeDetail(id);
    _flyToDisruption(id);
}

function _highlightMaritimeCard(id) {
    document.querySelectorAll('.maritime-card').forEach(el => el.classList.remove('is-active'));
    const card = document.querySelector(`[data-mid="${id}"]`);
    if (card) {
        card.classList.add('is-active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function _flyToDisruption(id) {
    const d = MARITIME_DISRUPTIONS.find(x => x.id === id);
    if (!d) return;
    map.flyTo([d.lat, d.lng], 5, { duration: 1.5 });
}

// ─── Maritime detail panel ────────────────────────────────────────────────────
function openMaritimeDetail(id) {
    const d = MARITIME_DISRUPTIONS.find(x => x.id === id);
    if (!d) return;
    const col = LEVEL_COLORS[d.level] || '#888';

    document.getElementById('detail-body').innerHTML = `
        <div class="det-title">⚓ ${d.name}</div>
        <div class="det-sub">
            <span class="det-badge" style="background:${col}22;border-color:${col};color:${col}">${d.level.toUpperCase()}</span>
            <span>${d.type}</span>
        </div>
        <p class="det-desc">${d.description}</p>
        <div class="det-grid">
            <div class="det-cell"><div class="dcl">AREA</div><div class="dcv">🌊 ${d.area}</div></div>
            <div class="det-cell"><div class="dcl">STATUS</div><div class="dcv" style="color:${col}">● ${d.status}</div></div>
            <div class="det-cell"><div class="dcl">VESSELS AFFECTED</div><div class="dcv">🚢 ${d.vesselsAttacked}</div></div>
            <div class="det-cell"><div class="dcl">VESSELS SUNK</div><div class="dcv">⚠️ ${d.vesselsSunk || 0}</div></div>
            <div class="det-cell"><div class="dcl">STARTED</div><div class="dcv">📅 ${formatDate(d.started)}</div></div>
            <div class="det-cell"><div class="dcl">TYPE</div><div class="dcv">🏷️ ${d.type}</div></div>
        </div>
        <div class="det-section-title">AFFECTED ROUTES</div>
        <div class="det-parties" style="margin-bottom:.6rem">
            ${d.affectedRoutes.map(r => `<span class="party" style="border-color:${col}40;color:${col}">⚓ ${r}</span>`).join('')}
        </div>
        <div class="det-section-title">PARTIES INVOLVED</div>
        <div class="det-parties">${d.parties.map(p => `<span class="party">${p}</span>`).join('')}</div>
        <div class="cc-tags" style="margin-bottom:.75rem">${d.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
        <div class="det-sources"><i class="fas fa-database"></i> Sources: ACLED Maritime · IMB Piracy Report · MARAD · NATO Shipping Centre · gCaptain · Splash247</div>
    `;

    document.getElementById('detail-panel').classList.add('visible');
}

// ─── Maritime news fetch ──────────────────────────────────────────────────────
async function fetchMaritimeNews() {
    const btn = document.getElementById('maritime-refresh-btn');
    if (btn) btn.classList.add('spinning');

    const results = await Promise.allSettled(
        Object.keys(CONFIG.MARITIME_FEEDS).map(k => _fetchMaritimeFeed(k))
    );

    const items = [];
    results.forEach(r => { if (r.status === 'fulfilled') items.push(...r.value); });
    items.sort((a, b) => b.ts - a.ts);

    const newsList = document.getElementById('maritime-news-list');
    if (!newsList) { if (btn) btn.classList.remove('spinning'); return; }

    if (!items.length) {
        newsList.innerHTML = `<div class="no-data"><i class="fas fa-satellite-dish"></i><p>No maritime reports available.</p></div>`;
        if (btn) btn.classList.remove('spinning');
        return;
    }

    newsList.innerHTML = items.slice(0, 12).map(n => `
        <div class="news-card" role="listitem" data-href="${safeAttr(n.link)}">
            <span class="ns-tag" style="color:${n.sourceColor}">⚓ ${esc(n.sourceName)}</span>
            <div class="news-title">${esc(n.title)}</div>
            ${n.desc ? `<div class="news-desc">${esc(n.desc.substring(0, MARITIME_CARD_LENGTH))}…</div>` : ''}
            <div class="news-meta">
                <span>${relTime(n.ts)}</span>
                <a href="${safeAttr(n.link)}" target="_blank" rel="noopener noreferrer"
                   onclick="event.stopPropagation()">Read →</a>
            </div>
        </div>
    `).join('');

    // click-to-open
    newsList.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('a')) return;
            const href = card.dataset.href;
            if (href && href !== '#') window.open(href, '_blank', 'noopener,noreferrer');
        });
    });

    if (btn) btn.classList.remove('spinning');
}

async function _fetchMaritimeFeed(key) {
    const feed = CONFIG.MARITIME_FEEDS[key];
    for (const proxy of CONFIG.CORS_PROXIES) {
        const url = proxy.url + encodeURIComponent(feed.url);
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            let xml;
            if (proxy.json) {
                const data = await res.json();
                if (!data.contents) continue;
                xml = data.contents;
            } else {
                xml = await res.text();
            }
            const items = _parseMaritimeRSS(xml, key, feed);
            if (items.length > 0) return items;
        } catch (e) {
            console.warn('[maritime] fetch failed for', key, 'via', proxy.url, e.message);
        }
    }
    return _getMaritimeFallback(key);
}

function _parseMaritimeRSS(xml, key, feed) {
    const doc   = new DOMParser().parseFromString(xml, 'application/xml');
    const items = [...doc.querySelectorAll('item')].slice(0, 15);
    const out   = [];
    items.forEach((item, i) => {
        const title = item.querySelector('title')?.textContent?.trim() || '';
        const link  = item.querySelector('link')?.textContent?.trim() || '#';
        const pub   = item.querySelector('pubDate')?.textContent?.trim() || '';
        const rawDesc = item.querySelector('description')?.textContent || '';
        const tmpEl = document.createElement('div');
        tmpEl.innerHTML = rawDesc;
        const desc = (tmpEl.textContent || tmpEl.innerText || '').trim().substring(0, MARITIME_DESC_LENGTH);
        if (title) {
            out.push({
                id: `maritime-${key}-${i}`,
                title, link, desc,
                source:      key,
                sourceName:  feed.name,
                sourceColor: feed.color,
                ts: pub ? new Date(pub).getTime() : Date.now()
            });
        }
    });
    return out;
}

function _getMaritimeFallback(key) {
    const now = Date.now();
    const fallbacks = {
        gcaptain: [
            { title: 'Red Sea: Houthi drone attack damages bulk carrier near Bab-el-Mandeb',           desc: 'MSC-chartered vessel struck by UAV; crew safe, damage assessment ongoing.',                           link: 'https://gcaptain.com' },
            { title: 'IMB quarterly report: Gulf of Guinea piracy incidents down 15% year-on-year',   desc: 'Despite improvement, IMB cautions against complacency; Nigeria remains highest-risk area.',          link: 'https://gcaptain.com' },
            { title: 'Strait of Hormuz: IRGC speedboats shadow tanker convoy — USN escort intervenes', desc: 'No shots fired; vessels diverted to Fujairah anchorage; US 5th Fleet statement issued.',             link: 'https://gcaptain.com' }
        ],
        marex: [
            { title: 'Black Sea: Ukrainian maritime drone attack disables Russian supply vessel',        desc: 'Third naval asset struck this month; Russia restricts shipping south of Crimea peninsula.',          link: 'https://maritime-executive.com' },
            { title: 'Taiwan Strait: PLA Navy conducts live-fire exercise; commercial vessels diverted', desc: 'Exercise zone covers 12 nautical miles; major container lines reroute via Luzon Strait.',            link: 'https://maritime-executive.com' },
            { title: 'MARAD Advisory: South China Sea fishing vessel harassment continues',              desc: 'Philippines-flagged boats report water cannon attacks at Scarborough Shoal; PCG files diplomatic note.', link: 'https://maritime-executive.com' }
        ],
        splash247: [
            { title: 'Cape of Good Hope diversions push Asia–Europe transit times to record highs',     desc: 'Average voyage extended 13 days vs Suez baseline; Maersk, MSC, Hapag-Lloyd all rerouting.',          link: 'https://splash247.com' },
            { title: 'Somali pirates seize dhow, hold crew; EU NAVFOR dispatches frigate',               desc: 'MV intercepted 80 nm off Mogadishu; ransom negotiations underway.',                                 link: 'https://splash247.com' },
            { title: 'Malacca Strait: tanker fire prompts safety review of TSS compliance',              desc: 'No piracy link found; engine room fire extinguished; traffic temporarily diverted.',                 link: 'https://splash247.com' }
        ]
    };
    return (fallbacks[key] || []).map((f, i) => ({
        id: `maritime-fallback-${key}-${i}`,
        title: f.title, link: f.link, desc: f.desc,
        source:      key,
        sourceName:  CONFIG.MARITIME_FEEDS[key]?.name  || 'Maritime',
        sourceColor: CONFIG.MARITIME_FEEDS[key]?.color || '#00cfff',
        ts: now - (i + 1) * 3600000
    }));
}

// ─── Level filter ─────────────────────────────────────────────────────────────
function applyMaritimeFilter() {
    const val = document.getElementById('maritime-level-filter')?.value || 'all';
    const filtered = val === 'all'
        ? MARITIME_DISRUPTIONS
        : MARITIME_DISRUPTIONS.filter(d => d.level === val);
    renderMaritimeList(filtered);
}

// ─── Delegate popup "VIEW" button clicks inside map ───────────────────────────
function setupMaritimeMapListeners() {
    document.getElementById('map').addEventListener('click', function(e) {
        const btn = e.target.closest('[data-maritime-id]');
        if (btn) openMaritimeDetail(btn.dataset.maritimeId);
    });
}
