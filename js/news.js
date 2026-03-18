// ─── News module ─────────────────────────────────────────────────────────────
let cachedNews = [];
let activeSource = 'all';

const NEWS_CACHE_KEY = 'warwatch_news_cache';
const NEWS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const WAR_KEYWORDS = [
    'war','conflict','attack','bomb','missile','military','troops','offensive',
    'ceasefire','invasion','battle','fighting','airstrike','killed','wounded',
    'explosion','rebel','forces','ukraine','russia','gaza','israel','hamas',
    'sudan','myanmar','yemen','houthi','nato','iran','hezbollah','isis','isil',
    'terrorism','coup','refugee','displacement','siege','artillery','drone',
    'frontline','insurgency','militia','nuclear','sanctions','casualty','casualties','dead',
    'west bank','jenin','tulkarm','settler','ramallah','idf','red sea','shipping',
    'north korea','dprk','pyongyang','icbm','hypersonic','pla','taiwan','pkk',
    'hts','syria','reconstruction','famine','humanitarian','proxy','irgc'
];

async function fetchRSS(key) {
    const feed = CONFIG.RSS_FEEDS[key];
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
            const items = parseRSS(xml, key, feed);
            if (items.length > 0) return items;
        } catch (e) {
            console.warn('[news] fetch failed for', key, 'via', proxy.url, e.message);
        }
    }
    return [];
}

function parseRSS(xml, key, feed) {
    const doc   = new DOMParser().parseFromString(xml, 'application/xml');
    const items = [...doc.querySelectorAll('item')].slice(0, 20);
    const out   = [];
    items.forEach((item, i) => {
        const title = item.querySelector('title')?.textContent?.trim() || '';
        const link  = item.querySelector('link')?.textContent?.trim() || '#';
        const pub   = item.querySelector('pubDate')?.textContent?.trim() || '';
        const rawDesc = item.querySelector('description')?.textContent || '';
        // Use a temporary element to safely extract plain text from any embedded HTML
        const tmpEl = document.createElement('div');
        tmpEl.innerHTML = rawDesc;
        const desc = (tmpEl.textContent || tmpEl.innerText || '').trim().substring(0, 200);
        const combined = (title + ' ' + desc).toLowerCase();
        if (title && WAR_KEYWORDS.some(kw => combined.includes(kw))) {
            out.push({
                id: `${key}-${i}`,
                title, link, desc,
                source: key,
                sourceName: feed.name,
                sourceColor: feed.color,
                ts: pub ? new Date(pub).getTime() : Date.now()
            });
        }
    });
    return out;
}

async function fetchAllNews() {
    // Immediately hydrate the UI from cache while fresh data is fetched in background
    const preCached = loadNewsCache();
    if (preCached && preCached.length) {
        cachedNews = preCached;
        renderNews();
        refreshTicker();
    } else {
        setNewsLoading(true);
    }

    const btn = document.getElementById('refresh-btn');
    if (btn) btn.classList.add('spinning');

    const results = await Promise.allSettled(
        Object.keys(CONFIG.RSS_FEEDS).map(k => fetchRSS(k))
    );

    const items = [];
    results.forEach(r => { if (r.status === 'fulfilled') items.push(...r.value); });
    items.sort((a, b) => b.ts - a.ts);

    if (items.length > 0) {
        cachedNews = items;
        saveNewsCache(items);
    } else if (!cachedNews.length) {
        cachedNews = getFallbackNews();
    }

    renderNews();
    refreshTicker();

    document.getElementById('update-time').textContent =
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (btn) btn.classList.remove('spinning');
    setNewsLoading(false);
}

function setNewsLoading(loading) {
    const list = document.getElementById('news-list');
    if (loading) {
        list.innerHTML =
            `<div class="spinner-wrap"><i class="fas fa-sync-alt fa-spin"></i>
             <p>Fetching intelligence feeds…</p></div>`;
    }
    // loading=false is handled by the subsequent renderNews() call
}

function renderNews() {
    const list   = document.getElementById('news-list');
    const items  = activeSource === 'all' ? cachedNews : cachedNews.filter(n => n.source === activeSource);

    if (!items.length) {
        list.innerHTML = `<div class="no-data"><i class="fas fa-satellite-dish"></i><p>No reports available.</p></div>`;
        return;
    }

    list.innerHTML = items.map(n => `
        <div class="news-card" role="listitem" data-href="${safeAttr(n.link)}">
            <span class="ns-tag" style="color:${n.sourceColor}">${esc(n.sourceName)}</span>
            <div class="news-title">${esc(n.title)}</div>
            ${n.desc ? `<div class="news-desc">${esc(n.desc.substring(0,130))}…</div>` : ''}
            <div class="news-meta">
                <span>${relTime(n.ts)}</span>
                <a href="${safeAttr(n.link)}" target="_blank" rel="noopener noreferrer"
                   onclick="event.stopPropagation()">Read →</a>
            </div>
        </div>
    `).join('');
}

function refreshTicker() {
    const el = document.getElementById('ticker-inner');
    if (!el) return;
    const txt = cachedNews.slice(0, 8).map(n => `⚡ ${n.title}`).join('   ·   ');
    el.textContent = txt || 'Live conflict intelligence feed — WarWatch OSINT monitoring active';
}

// ─── Utilities ───────────────────────────────────────────────────────────────
function esc(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function safeAttr(url) {
    if (!url || url === '#') return '#';
    try {
        const u = new URL(url);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return '#';
        return esc(url);
    } catch {
        return '#';
    }
}

function relTime(ts) {
    if (!ts) return '';
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    const h = Math.floor(d / 3600000);
    const dy = Math.floor(d / 86400000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${dy}d ago`;
}

function getFallbackNews() {
    const now = Date.now();
    return [
        { id:'f1', title:'Ukraine: Heavy fighting reported across Donetsk frontline',              link:'https://www.bbc.com/news/world/europe',          desc:'Ukrainian and Russian forces exchange fire along multiple sectors.',                         source:'bbc',       sourceName:'BBC News',   sourceColor:'#cc1111', ts: now - 3600000 },
        { id:'f2', title:'Gaza ceasefire fragile as IDF resumes limited operations in March 2025', link:'https://www.aljazeera.com/news',                  desc:'Phase 1 hostage deal partially implemented; humanitarian access remains restricted.',         source:'aljazeera', sourceName:'Al Jazeera', sourceColor:'#009688', ts: now - 7200000 },
        { id:'f3', title:'Sudan: SAF and RSF clash in Khartoum outskirts',                         link:'https://www.reuters.com/world/',                  desc:'Ongoing battle for Sudan\'s capital; mass civilian displacement continues.',                 source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 10800000 },
        { id:'f4', title:'West Bank: IDF Operation Iron Wall continues in Jenin refugee camp',     link:'https://www.aljazeera.com/news/middle-east',      desc:'Armoured units and bulldozers deployed; thousands displaced from camps.',                    source:'aljazeera', sourceName:'Al Jazeera', sourceColor:'#009688', ts: now - 14400000 },
        { id:'f5', title:'Houthis resume Red Sea shipping attacks after ceasefire pause',          link:'https://www.bbc.com/news/world/middle_east',      desc:'Commercial vessels targeted; US-UK forces launch counter-strikes on Houthi positions.',     source:'bbc',       sourceName:'BBC News',   sourceColor:'#cc1111', ts: now - 18000000 },
        { id:'f6', title:'Syria: ISIS attacks spike in Deir ez-Zor amid transition power vacuum',  link:'https://www.reuters.com/world/middle-east/',      desc:'New Syrian government forces clash with ISIS remnants in central desert region.',           source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 21600000 },
        { id:'f7', title:'North Korea confirms troop deployments to Russia — Pentagon',            link:'https://www.bbc.com/news/world/asia',             desc:'An estimated 10,000+ DPRK soldiers reported in Kursk and other frontline areas.',          source:'bbc',       sourceName:'BBC News',   sourceColor:'#cc1111', ts: now - 25200000 },
        { id:'f8', title:'Iran nuclear enrichment at 60%; IAEA access curtailed',                  link:'https://www.reuters.com/world/middle-east/',      desc:'Watchdog warns Iran months away from weapons-grade material; US-Iran talks stalled.',       source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 28800000 },
        { id:'f9', title:'DRC: M23 advance continues in North Kivu province',                      link:'https://www.aljazeera.com/news/africa',            desc:'Armed groups continue to control key towns near Goma.',                                     source:'aljazeera', sourceName:'Al Jazeera', sourceColor:'#009688', ts: now - 32400000 },
        { id:'f10',title:'Myanmar: Resistance forces claim advances in Shan State',                link:'https://www.reuters.com/world/asia-pacific/',     desc:'Anti-junta forces report territorial gains in multiple regions.',                           source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 36000000 },
        { id:'f11',title:'Lebanon reconstruction begins; Hezbollah regrouping under new leadership',link:'https://www.aljazeera.com/news/middle-east',     desc:'Ceasefire holding but UNIFIL reports Israeli violations; LAF deploying to south.',         source:'aljazeera', sourceName:'Al Jazeera', sourceColor:'#009688', ts: now - 39600000 },
        { id:'f12',title:'Sahel: Jihadist attacks kill dozens in Burkina Faso',                    link:'https://www.aljazeera.com/news/africa',            desc:'JNIM-affiliated groups carry out simultaneous attacks on multiple towns.',                  source:'aljazeera', sourceName:'Al Jazeera', sourceColor:'#009688', ts: now - 43200000 },
        { id:'f13',title:'PKK ceasefire: disarmament process under way after Öcalan call',         link:'https://www.reuters.com/world/middle-east/',      desc:'PKK declared cessation of armed struggle; Turkey monitoring compliance.',                   source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 46800000 },
        { id:'f14',title:'[Offline mode] Live news loads automatically when connected',            link:'#',                                               desc:'Real-time feeds from BBC, Reuters, Al Jazeera activate with internet access.',              source:'bbc',       sourceName:'System',     sourceColor:'#444',    ts: now - 50400000 }
    ];
}

// ─── LocalStorage cache helpers ───────────────────────────────────────────────
function saveNewsCache(items) {
    try {
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ ts: Date.now(), items }));
    } catch (_) { /* storage quota exceeded or unavailable */ }
}

function loadNewsCache() {
    try {
        const raw = localStorage.getItem(NEWS_CACHE_KEY);
        if (!raw) return null;
        const { ts, items } = JSON.parse(raw);
        if (Date.now() - ts > NEWS_CACHE_TTL) return null;
        return Array.isArray(items) ? items : null;
    } catch (_) { return null; }
}

// ─── Event delegation for news card clicks ────────────────────────────────────
let _newsListenersSetUp = false;
function setupNewsListeners() {
    if (_newsListenersSetUp) return;
    _newsListenersSetUp = true;
    document.getElementById('news-list').addEventListener('click', e => {
        const card = e.target.closest('.news-card');
        if (!card) return;
        // Let the "Read →" anchor handle its own navigation
        if (e.target.closest('a')) return;
        const href = card.dataset.href;
        if (href && href !== '#') {
            window.open(href, '_blank', 'noopener,noreferrer');
        }
    });
}
