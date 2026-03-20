// ─── Enhanced Export Module ──────────────────────────────────────────────────

/**
 * Export conflicts as GeoJSON FeatureCollection
 * Compatible with GIS tools like QGIS, ArcGIS, Mapbox
 */
function exportConflictsGeoJSON() {
    const filtered = filterConflicts(filters.region, filters.intensity, filters.search);
    const sorted = sortByIntensity(filtered);

    const featureCollection = {
        type: "FeatureCollection",
        metadata: {
            generated: new Date().toISOString(),
            source: "WarWatch OSINT",
            count: sorted.length,
            filters: {
                region: filters.region,
                intensity: filters.intensity,
                search: filters.search
            }
        },
        features: sorted.map(c => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [c.coords[1], c.coords[0]] // GeoJSON uses [lng, lat]
            },
            properties: {
                id: c.id,
                name: c.name,
                region: c.region,
                country: c.country,
                intensity: c.intensity,
                type: c.type,
                status: c.status,
                casualties: c.casualties,
                displaced: c.displaced,
                started: c.started,
                parties: c.parties,
                description: c.description,
                sources: c.sources,
                tags: c.tags
            }
        }))
    };

    downloadJSON(featureCollection, `warwatch-conflicts-${getDateStamp()}.geojson`);
}

/**
 * Export conflicts as raw JSON
 * For programmatic use and data analysis
 */
function exportConflictsJSON() {
    const filtered = filterConflicts(filters.region, filters.intensity, filters.search);
    const sorted = sortByIntensity(filtered);

    const jsonData = {
        metadata: {
            generated: new Date().toISOString(),
            source: "WarWatch OSINT",
            version: "1.0",
            count: sorted.length,
            filters: {
                region: filters.region,
                intensity: filters.intensity,
                search: filters.search
            }
        },
        conflicts: sorted
    };

    downloadJSON(jsonData, `warwatch-conflicts-${getDateStamp()}.json`);
}

/**
 * Export maritime disruptions as CSV
 */
function exportMaritimeCSV() {
    const filtered = getFilteredMaritimeDisruptions();
    const headers = ['Name', 'Level', 'Status', 'Affected Routes', 'Vessels Attacked', 'Vessels Sunk', 'Threat Type', 'Parties', 'Description'];

    const rows = filtered.map(d => [
        `"${d.name.replace(/"/g, '""')}"`,
        d.level,
        d.status,
        `"${d.affectedRoutes.join('; ').replace(/"/g, '""')}"`,
        d.vesselsAttacked || 0,
        d.vesselsSunk || 0,
        `"${d.threatType.replace(/"/g, '""')}"`,
        `"${d.parties.join('; ').replace(/"/g, '""')}"`,
        `"${d.description.replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `warwatch-maritime-${getDateStamp()}.csv`);
}

/**
 * Export maritime disruptions as GeoJSON
 */
function exportMaritimeGeoJSON() {
    const filtered = getFilteredMaritimeDisruptions();

    const featureCollection = {
        type: "FeatureCollection",
        metadata: {
            generated: new Date().toISOString(),
            source: "WarWatch OSINT - Maritime Intelligence",
            count: filtered.length
        },
        features: filtered.map(d => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [d.coords[1], d.coords[0]]
            },
            properties: {
                id: d.id,
                name: d.name,
                level: d.level,
                status: d.status,
                affectedRoutes: d.affectedRoutes,
                vesselsAttacked: d.vesselsAttacked,
                vesselsSunk: d.vesselsSunk,
                threatType: d.threatType,
                parties: d.parties,
                description: d.description,
                sources: d.sources
            }
        }))
    };

    downloadJSON(featureCollection, `warwatch-maritime-${getDateStamp()}.geojson`);
}

/**
 * Export maritime disruptions as JSON
 */
function exportMaritimeJSON() {
    const filtered = getFilteredMaritimeDisruptions();

    const jsonData = {
        metadata: {
            generated: new Date().toISOString(),
            source: "WarWatch OSINT - Maritime Intelligence",
            version: "1.0",
            count: filtered.length
        },
        disruptions: filtered
    };

    downloadJSON(jsonData, `warwatch-maritime-${getDateStamp()}.json`);
}

/**
 * Export complete dataset (conflicts + maritime) as JSON
 */
function exportCompleteDataset() {
    const conflictFiltered = filterConflicts(filters.region, filters.intensity, filters.search);
    const maritimeFiltered = getFilteredMaritimeDisruptions();

    const dataset = {
        metadata: {
            generated: new Date().toISOString(),
            source: "WarWatch OSINT - Complete Dataset",
            version: "1.0",
            conflictCount: conflictFiltered.length,
            maritimeCount: maritimeFiltered.length,
            filters: {
                region: filters.region,
                intensity: filters.intensity,
                search: filters.search
            }
        },
        conflicts: conflictFiltered,
        maritime: maritimeFiltered,
        statistics: {
            regionCounts: getRegionCounts(),
            intensityCounts: getIntensityCounts(),
            totalCasualties: conflictFiltered.reduce((sum, c) => sum + (parseInt(c.casualties.replace(/[^0-9]/g, '')) || 0), 0),
            totalDisplaced: conflictFiltered.reduce((sum, c) => sum + (parseInt(c.displaced.replace(/[^0-9]/g, '')) || 0), 0)
        }
    };

    downloadJSON(dataset, `warwatch-complete-dataset-${getDateStamp()}.json`);
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function getIntensityCounts() {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, tension: 0 };
    CONFLICTS_DATA.forEach(c => {
        if (counts[c.intensity] !== undefined) counts[c.intensity]++;
    });
    return counts;
}

function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getDateStamp() {
    return new Date().toISOString().slice(0, 10);
}

function getFilteredMaritimeDisruptions() {
    // This will be implemented in maritime.js - for now return all
    if (typeof MARITIME_DISRUPTIONS !== 'undefined') {
        const level = document.getElementById('maritime-level-filter')?.value || 'all';
        if (level === 'all') return MARITIME_DISRUPTIONS;
        return MARITIME_DISRUPTIONS.filter(d => d.level === level);
    }
    return [];
}

/**
 * Show export options modal
 */
function showExportModal(type = 'conflicts') {
    const modal = document.createElement('div');
    modal.id = 'export-modal';
    modal.className = 'modal';

    const title = type === 'conflicts' ? 'Export Conflicts' : 'Export Maritime Disruptions';
    const exportFunctions = type === 'conflicts'
        ? [
            { label: 'CSV (Excel, spreadsheets)', func: 'exportConflictsCSV', icon: 'file-csv' },
            { label: 'JSON (Data analysis, APIs)', func: 'exportConflictsJSON', icon: 'file-code' },
            { label: 'GeoJSON (GIS tools, mapping)', func: 'exportConflictsGeoJSON', icon: 'map-marked-alt' }
        ]
        : [
            { label: 'CSV (Excel, spreadsheets)', func: 'exportMaritimeCSV', icon: 'file-csv' },
            { label: 'JSON (Data analysis, APIs)', func: 'exportMaritimeJSON', icon: 'file-code' },
            { label: 'GeoJSON (GIS tools, mapping)', func: 'exportMaritimeGeoJSON', icon: 'map-marked-alt' }
        ];

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-download"></i> ${title}</h3>
                <button class="modal-close" onclick="closeExportModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p class="modal-desc">Choose export format:</p>
                <div class="export-options">
                    ${exportFunctions.map(opt => `
                        <button class="export-option-btn" onclick="${opt.func}(); closeExportModal();">
                            <i class="fas fa-${opt.icon}"></i>
                            <span>${opt.label}</span>
                        </button>
                    `).join('')}
                </div>
                ${type === 'conflicts' ? `
                    <div class="export-divider"></div>
                    <button class="export-option-btn export-complete" onclick="exportCompleteDataset(); closeExportModal();">
                        <i class="fas fa-database"></i>
                        <span>Complete Dataset (Conflicts + Maritime)</span>
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('visible'), 10);
}

function closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    }
}

// Close modal on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeExportModal();
});
