// ─── News module ─────────────────────────────────────────────────────────────
let cachedNews = [];
let activeSource = 'all';

const WAR_KEYWORDS = [
    'war','conflict','attack','bomb','missile','military','troops','offensive',
    'ceasefire','invasion','battle','fighting','airstrike','killed','wounded',
    'explosion','rebel','forces','ukraine','russia','gaza','israel','hamas',
    'sudan','myanmar','yemen','houthi','nato','iran','hezbollah','isis','isil',
    'terrorism','coup','refugee','displacement','siege','artillery','drone',
    'frontline','insurgency','militia','nuclear','sanctions','casualt','dead'
];

async function fetchRSS(key) {
    const feed = CONFIG.RSS_FEEDS[key];
    const url  = CONFIG.CORS_PROXY + encodeURIComponent(feed.url);
    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.contents) return [];
        return parseRSS(data.contents, key, feed);
    } catch (e) {
        console.warn('[news] fetch failed for', key, e.message);
        return [];
    }
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
    const btn = document.getElementById('refresh-btn');
    if (btn) btn.classList.add('spinning');
    setNewsLoading(true);

    const results = await Promise.allSettled(
        Object.keys(CONFIG.RSS_FEEDS).map(k => fetchRSS(k))
    );

    const items = [];
    results.forEach(r => { if (r.status === 'fulfilled') items.push(...r.value); });
    items.sort((a, b) => b.ts - a.ts);

    cachedNews = items.length > 0 ? items : getFallbackNews();
    renderNews();
    refreshTicker();

    document.getElementById('update-time').textContent =
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (btn) btn.classList.remove('spinning');
    setNewsLoading(false);
}

function setNewsLoading(loading) {
    if (loading) {
        document.getElementById('news-list').innerHTML =
            `<div class="spinner-wrap"><i class="fas fa-sync-alt fa-spin"></i>
             <p>Fetching intelligence feeds…</p></div>`;
    }
}

function renderNews() {
    const list   = document.getElementById('news-list');
    const items  = activeSource === 'all' ? cachedNews : cachedNews.filter(n => n.source === activeSource);

    if (!items.length) {
        list.innerHTML = `<div class="no-data"><i class="fas fa-satellite-dish"></i><p>No reports available.</p></div>`;
        return;
    }

    list.innerHTML = items.map(n => `
        <div class="news-card" onclick="window.open('${safeAttr(n.link)}','_blank','noopener,noreferrer')">
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
        { id:'f1', title:'Ukraine: Heavy fighting reported across Donetsk frontline',      link:'https://www.bbc.com/news/world/europe',          desc:'Ukrainian and Russian forces exchange fire along multiple sectors.',           source:'bbc',       sourceName:'BBC News',   sourceColor:'#cc1111', ts: now - 3600000 },
        { id:'f2', title:'Gaza humanitarian situation worsens as conflict continues',       link:'https://www.aljazeera.com/news',                  desc:'Aid agencies warn of critical shortages of food, medicine and fuel.',        source:'aljazeera', sourceName:'Al Jazeera', sourceColor:'#009688', ts: now - 7200000 },
        { id:'f3', title:'Sudan: SAF and RSF clash in Khartoum outskirts',                 link:'https://www.reuters.com/world/',                  desc:'Ongoing battle for Sudan\'s capital; mass civilian displacement continues.', source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 10800000 },
        { id:'f4', title:'DRC: M23 advance continues in North Kivu province',              link:'https://www.aljazeera.com/news/africa',            desc:'Armed groups continue to control key towns near Goma.',                      source:'aljazeera', sourceName:'Al Jazeera', sourceColor:'#009688', ts: now - 14400000 },
        { id:'f5', title:'Myanmar: Resistance forces claim advances in Shan State',        link:'https://www.reuters.com/world/asia-pacific/',     desc:'Anti-junta forces report territorial gains in multiple regions.',            source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 18000000 },
        { id:'f6', title:'Houthis claim new Red Sea shipping attack',                      link:'https://www.bbc.com/news/world/middle_east',      desc:'Houthi forces target commercial vessel; US-UK forces respond.',              source:'bbc',       sourceName:'BBC News',   sourceColor:'#cc1111', ts: now - 21600000 },
        { id:'f7', title:'Pakistan: TTP attacks spike in Khyber Pakhtunkhwa',              link:'https://www.reuters.com/world/asia-pacific/',     desc:'Security forces engaged in multiple counter-terrorism operations.',          source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 25200000 },
        { id:'f8', title:'China conducts new PLA exercises near Taiwan Strait',            link:'https://www.bbc.com/news/world/asia',             desc:'Military drills escalate regional tensions; US carrier group responds.',     source:'bbc',       sourceName:'BBC News',   sourceColor:'#cc1111', ts: now - 28800000 },
        { id:'f9', title:'Sahel: Jihadist attacks kill dozens in Burkina Faso',            link:'https://www.aljazeera.com/news/africa',            desc:'JNIM-affiliated groups carry out simultaneous attacks on multiple towns.',   source:'aljazeera', sourceName:'Al Jazeera', sourceColor:'#009688', ts: now - 32400000 },
        { id:'f10',title:'Haiti: Armed gangs seize new territory in Port-au-Prince',       link:'https://www.reuters.com/world/americas/',          desc:'MSS Kenya-led force struggling to contain gang expansion.',                  source:'reuters',   sourceName:'Reuters',    sourceColor:'#ff7700', ts: now - 36000000 },
        { id:'f11',title:'[Offline mode] Live news loads automatically when connected',    link:'#',                                               desc:'Real-time feeds from BBC, Reuters, Al Jazeera activate with internet access.',source:'bbc',       sourceName:'System',     sourceColor:'#444',    ts: now - 39600000 }
    ];
}
