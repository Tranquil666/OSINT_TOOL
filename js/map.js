// ─── Map module ──────────────────────────────────────────────────────────────
let map, clusterGroup, markerIndex = {};

const INTENSITY_COLORS = {
    critical: '#ff1744',
    high:     '#ff6d00',
    medium:   '#ffab00',
    low:      '#ffd600',
    tension:  '#2979ff'
};

const INTENSITY_SIZES = { critical: 22, high: 18, medium: 15, low: 12, tension: 11 };

function initMap() {
    map = L.map('map', {
        center: CONFIG.MAP_CENTER,
        zoom:   CONFIG.MAP_ZOOM,
        zoomControl: false,
        attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.control.attribution({
        position: 'bottomright',
        prefix: '<span style="color:#444">© OSM contributors © CartoDB | Data: ACLED · Wikipedia · UCDP</span>'
    }).addTo(map);

    _initClusterGroup();

    // Delegated event listener for popup "View Full Intel" buttons
    document.getElementById('map').addEventListener('click', function(e) {
        const btn = e.target.closest('[data-conflict-id]');
        if (btn) openDetail(btn.dataset.conflictId);
    });

    return map;
}

function _initClusterGroup() {
    clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 55,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction(cluster) {
            const n = cluster.getChildCount();
            return L.divIcon({
                html: `<div class="cluster-icon">${n}</div>`,
                className: '',
                iconSize: [40, 40]
            });
        }
    });
}

function createMarkerIcon(conflict) {
    const color = INTENSITY_COLORS[conflict.intensity] || '#888';
    const s = INTENSITY_SIZES[conflict.intensity] || 14;
    return L.divIcon({
        html: `<div class="cmarker cmarker-${conflict.intensity}">
                 <div class="cm-inner" style="width:${s}px;height:${s}px;background:${color};box-shadow:0 0 8px ${color}"></div>
                 <div class="cm-ring" style="border-color:${color};width:${s+14}px;height:${s+14}px"></div>
               </div>`,
        className: '',
        iconSize: [s + 16, s + 16],
        iconAnchor: [(s + 16) / 2, (s + 16) / 2]
    });
}

function renderMarkers(conflicts) {
    if (map.hasLayer(clusterGroup)) map.removeLayer(clusterGroup);
    clusterGroup.clearLayers();
    markerIndex = {};

    conflicts.forEach(c => {
        const color = INTENSITY_COLORS[c.intensity] || '#888';
        const marker = L.marker([c.lat, c.lng], { icon: createMarkerIcon(c) });

        marker.bindPopup(`
            <div class="mpopup">
                <div class="mpopup-name">${c.name}</div>
                <div class="mpopup-badge" style="background:${color}20;border:1px solid ${color};color:${color}">
                    ⬤ ${c.intensity.toUpperCase()} · ${c.type}
                </div>
                <div class="mpopup-row"><span>📍</span>${c.country}</div>
                <div class="mpopup-row"><span>💀</span>${c.casualties} casualties</div>
                <div class="mpopup-row"><span>📅</span>Since ${formatDate(c.started)}</div>
                <button class="mpopup-btn" data-conflict-id="${c.id}">VIEW FULL INTEL →</button>
            </div>
        `, { maxWidth: 270 });

        marker.on('click', () => highlightCard(c.id));
        markerIndex[c.id] = marker;
        clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
}

function flyToConflict(id) {
    const c = CONFLICTS_DATA.find(x => x.id === id);
    if (!c) return;
    map.flyTo([c.lat, c.lng], 5, { duration: 1.5 });
    setTimeout(() => {
        const m = markerIndex[id];
        if (m) clusterGroup.zoomToShowLayer(m, () => m.openPopup());
    }, 1700);
}

function highlightCard(id) {
    document.querySelectorAll('.conflict-card').forEach(el => el.classList.remove('is-active'));
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) { card.classList.add('is-active'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

function fitMapToMarkers(conflicts) {
    if (!conflicts || !conflicts.length) return;
    const bounds = L.latLngBounds(conflicts.map(c => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
}
