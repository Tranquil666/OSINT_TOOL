// ─── Iran Real-time Data Module ──────────────────────────────────────────────
//
// This module provides real-time updates for Iran conflict information including:
// - Missile and drone alerts via RSS feeds
// - Nuclear status updates from IAEA
// - Conflict events from ACLED API
// - Regional tensions and proxy activity
//
// Uses free/open-source data sources with CORS proxy support
// ─────────────────────────────────────────────────────────────────────────────

let IRAN_REALTIME_DATA = {
    lastUpdated: null,
    missileAlerts: [],
    nuclearStatus: null,
    conflictEvents: [],
    proxyActivity: []
};

const IRAN_CACHE_KEY = 'warwatch_iran_cache';
const IRAN_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// ─── Fetch missile/rocket alert feeds ───────────────────────────────────────
async function fetchMissileAlerts() {
    const alerts = [];

    // Times of Israel Alerts RSS (English)
    const toiAlerts = await fetchAlertRSS('https://www.timesofisrael.com/alerts/feed/');
    alerts.push(...toiAlerts);

    // Jerusalem Post Alerts
    const jpostAlerts = await fetchAlertRSS('https://www.jpost.com/Rss/RssFeedsAlerts.aspx');
    alerts.push(...jpostAlerts);

    return alerts.slice(0, 50); // Keep last 50 alerts
}

async function fetchAlertRSS(feedUrl) {
    for (const proxy of CONFIG.CORS_PROXIES) {
        const url = proxy.url + encodeURIComponent(feedUrl);
        try {
            const res = await fetch(url, { timeout: 10000 });
            if (!res.ok) continue;

            let xml;
            if (proxy.json) {
                const data = await res.json();
                if (!data.contents) continue;
                xml = data.contents;
            } else {
                xml = await res.text();
            }

            return parseAlertRSS(xml);
        } catch (e) {
            console.warn('[iran] Alert RSS fetch failed via', proxy.url, e.message);
        }
    }
    return [];
}

function parseAlertRSS(xml) {
    try {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const items = [...doc.querySelectorAll('item')].slice(0, 20);

        return items.map(item => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            const desc = item.querySelector('description')?.textContent?.trim() || '';
            const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || '';

            // Check if it's Iran-related
            const combined = (title + ' ' + desc).toLowerCase();
            const isIranRelated = combined.includes('iran') ||
                                  combined.includes('hezbollah') ||
                                  combined.includes('iraq') ||
                                  combined.includes('yemen') ||
                                  combined.includes('houthi');

            return {
                title,
                description: desc,
                pubDate: pubDate ? new Date(pubDate) : new Date(),
                link,
                isIranRelated,
                type: detectAlertType(title, desc)
            };
        }).filter(alert => alert.isIranRelated);
    } catch (e) {
        console.error('[iran] Failed to parse alert RSS:', e);
        return [];
    }
}

function detectAlertType(title, desc) {
    const text = (title + ' ' + desc).toLowerCase();
    if (text.includes('missile') || text.includes('rocket')) return 'missile';
    if (text.includes('drone') || text.includes('uav')) return 'drone';
    if (text.includes('artillery') || text.includes('mortar')) return 'artillery';
    if (text.includes('airstrike') || text.includes('air strike')) return 'airstrike';
    return 'other';
}

// ─── Fetch IAEA nuclear status updates ──────────────────────────────────────
async function fetchNuclearStatus() {
    // IAEA Press Releases RSS
    const iaeaUrl = 'https://www.iaea.org/newscenter/pressreleases/rss';

    for (const proxy of CONFIG.CORS_PROXIES) {
        const url = proxy.url + encodeURIComponent(iaeaUrl);
        try {
            const res = await fetch(url, { timeout: 10000 });
            if (!res.ok) continue;

            let xml;
            if (proxy.json) {
                const data = await res.json();
                if (!data.contents) continue;
                xml = data.contents;
            } else {
                xml = await res.text();
            }

            const status = parseNuclearRSS(xml);
            if (status) return status;
        } catch (e) {
            console.warn('[iran] IAEA RSS fetch failed via', proxy.url, e.message);
        }
    }

    return null;
}

function parseNuclearRSS(xml) {
    try {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const items = [...doc.querySelectorAll('item')].slice(0, 10);

        // Find most recent Iran-related nuclear news
        for (const item of items) {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            const desc = item.querySelector('description')?.textContent?.trim() || '';
            const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || '';

            const combined = (title + ' ' + desc).toLowerCase();
            if (combined.includes('iran')) {
                return {
                    title,
                    description: desc,
                    pubDate: pubDate ? new Date(pubDate) : new Date(),
                    link,
                    enrichmentLevel: extractEnrichmentLevel(title, desc),
                    lastUpdated: new Date()
                };
            }
        }
    } catch (e) {
        console.error('[iran] Failed to parse IAEA RSS:', e);
    }
    return null;
}

function extractEnrichmentLevel(title, desc) {
    const text = title + ' ' + desc;
    // Look for percentage patterns like "60%", "90%", etc.
    const match = text.match(/(\d{1,2}(?:\.\d+)?)\s*%/);
    if (match) {
        return match[1] + '%';
    }
    return null;
}

// ─── Fetch ACLED conflict events for Iran region ────────────────────────────
// Note: ACLED API requires registration for API key, but data is free
// For now, we'll use RSS feeds. To add ACLED API:
// 1. Register at https://developer.acleddata.com/
// 2. Add API key to CONFIG
// 3. Use endpoint: https://api.acleddata.com/acled/read?country=Iran&limit=50
async function fetchConflictEvents() {
    const events = [];

    // Middle East-focused news feeds
    const feeds = [
        'https://www.aljazeera.com/xml/rss/all.xml',
        'https://feeds.reuters.com/reuters/middleeastNews',
        'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml'
    ];

    for (const feedUrl of feeds) {
        const feedEvents = await fetchEventRSS(feedUrl);
        events.push(...feedEvents);
    }

    return events.slice(0, 30);
}

async function fetchEventRSS(feedUrl) {
    for (const proxy of CONFIG.CORS_PROXIES) {
        const url = proxy.url + encodeURIComponent(feedUrl);
        try {
            const res = await fetch(url, { timeout: 10000 });
            if (!res.ok) continue;

            let xml;
            if (proxy.json) {
                const data = await res.json();
                if (!data.contents) continue;
                xml = data.contents;
            } else {
                xml = await res.text();
            }

            return parseEventRSS(xml);
        } catch (e) {
            console.warn('[iran] Event RSS fetch failed via', proxy.url, e.message);
        }
    }
    return [];
}

function parseEventRSS(xml) {
    try {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const items = [...doc.querySelectorAll('item')].slice(0, 20);

        const iranKeywords = [
            'iran', 'iranian', 'irgc', 'tehran', 'isfahan', 'natanz',
            'hezbollah', 'houthi', 'yemen', 'pmf', 'syria', 'iraq militia'
        ];

        return items.map(item => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            const desc = item.querySelector('description')?.textContent?.trim() || '';
            const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || '';

            const combined = (title + ' ' + desc).toLowerCase();
            const isIranRelated = iranKeywords.some(kw => combined.includes(kw));

            if (!isIranRelated) return null;

            return {
                title,
                description: desc,
                pubDate: pubDate ? new Date(pubDate) : new Date(),
                link,
                eventType: detectEventType(title, desc)
            };
        }).filter(Boolean);
    } catch (e) {
        console.error('[iran] Failed to parse event RSS:', e);
        return [];
    }
}

function detectEventType(title, desc) {
    const text = (title + ' ' + desc).toLowerCase();
    if (text.includes('nuclear') || text.includes('enrichment')) return 'nuclear';
    if (text.includes('missile') || text.includes('drone')) return 'military';
    if (text.includes('sanction')) return 'diplomatic';
    if (text.includes('attack') || text.includes('strike')) return 'combat';
    if (text.includes('proxy') || text.includes('hezbollah') || text.includes('houthi')) return 'proxy';
    return 'other';
}

// ─── Main update function ────────────────────────────────────────────────────
async function updateIranRealTimeData() {
    console.log('[iran] Fetching real-time data...');

    try {
        // Try to fetch all data in parallel
        const [alerts, nuclearStatus, events] = await Promise.all([
            fetchMissileAlerts().catch(e => { console.warn('[iran] Missile alerts failed:', e); return []; }),
            fetchNuclearStatus().catch(e => { console.warn('[iran] Nuclear status failed:', e); return null; }),
            fetchConflictEvents().catch(e => { console.warn('[iran] Conflict events failed:', e); return []; })
        ]);

        IRAN_REALTIME_DATA = {
            lastUpdated: new Date(),
            missileAlerts: alerts,
            nuclearStatus: nuclearStatus,
            conflictEvents: events,
            proxyActivity: events.filter(e => e.eventType === 'proxy')
        };

        // Cache the data
        try {
            localStorage.setItem(IRAN_CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: IRAN_REALTIME_DATA
            }));
        } catch (e) {
            console.warn('[iran] Failed to cache data:', e);
        }

        console.log('[iran] Real-time data updated:', {
            alerts: alerts.length,
            nuclearStatus: !!nuclearStatus,
            events: events.length
        });

        return IRAN_REALTIME_DATA;
    } catch (e) {
        console.error('[iran] Failed to update real-time data:', e);
        return IRAN_REALTIME_DATA;
    }
}

// ─── Load cached data on startup ─────────────────────────────────────────────
function loadCachedIranData() {
    try {
        const cached = localStorage.getItem(IRAN_CACHE_KEY);
        if (!cached) return false;

        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < IRAN_CACHE_TTL) {
            IRAN_REALTIME_DATA = data;
            console.log('[iran] Loaded cached real-time data');
            return true;
        }
    } catch (e) {
        console.warn('[iran] Failed to load cached data:', e);
    }
    return false;
}

// ─── Generate enriched Iran conflict description ────────────────────────────
function getEnrichedIranDescription() {
    let desc = 'Israel and Iran exchanged direct missile and drone strikes for the first time in April and October 2024. ';

    // Add missile alert count
    if (IRAN_REALTIME_DATA.missileAlerts.length > 0) {
        const recentAlerts = IRAN_REALTIME_DATA.missileAlerts.filter(a => {
            const age = Date.now() - a.pubDate.getTime();
            return age < 30 * 24 * 60 * 60 * 1000; // Last 30 days
        });
        if (recentAlerts.length > 0) {
            desc += `${recentAlerts.length} missile/rocket alerts in the last 30 days. `;
        }
    }

    // Add nuclear status
    if (IRAN_REALTIME_DATA.nuclearStatus && IRAN_REALTIME_DATA.nuclearStatus.enrichmentLevel) {
        desc += `Iran uranium enrichment at ${IRAN_REALTIME_DATA.nuclearStatus.enrichmentLevel}. `;
    } else {
        desc += 'Iran accelerating uranium enrichment to 60%+; ';
    }

    desc += 'IAEA access limited. ';

    // Add proxy activity
    if (IRAN_REALTIME_DATA.proxyActivity.length > 0) {
        desc += `Iran's proxy network (Hezbollah, Houthis, PMF) remains active with ${IRAN_REALTIME_DATA.proxyActivity.length} recent incidents. `;
    } else {
        desc += 'Iran\'s proxy network (Hezbollah, Houthis, PMF) has been significantly degraded. ';
    }

    desc += 'US-Iran nuclear deal negotiations stalled. Risk of Israeli preventive strike on Iranian nuclear facilities remains elevated in 2025.';

    return desc;
}

// ─── Get Iran real-time data summary ─────────────────────────────────────────
function getIranDataSummary() {
    return {
        lastUpdated: IRAN_REALTIME_DATA.lastUpdated,
        alertCount: IRAN_REALTIME_DATA.missileAlerts.length,
        recentAlerts: IRAN_REALTIME_DATA.missileAlerts.slice(0, 5),
        nuclearStatus: IRAN_REALTIME_DATA.nuclearStatus,
        eventCount: IRAN_REALTIME_DATA.conflictEvents.length,
        recentEvents: IRAN_REALTIME_DATA.conflictEvents.slice(0, 5),
        proxyActivityCount: IRAN_REALTIME_DATA.proxyActivity.length
    };
}

// ─── Initialize Iran real-time module ────────────────────────────────────────
async function initIranRealTime() {
    console.log('[iran] Initializing real-time module...');

    // Try to load cached data first
    const hasCached = loadCachedIranData();

    // Fetch fresh data
    await updateIranRealTimeData();

    // Set up periodic updates (every 15 minutes)
    setInterval(updateIranRealTimeData, 15 * 60 * 1000);
}
