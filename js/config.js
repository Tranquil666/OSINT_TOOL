const CONFIG = {
    MAP_CENTER: [20, 15],
    MAP_ZOOM: 3,
    NEWS_REFRESH_MS: 5 * 60 * 1000,
    // Multiple CORS proxies tried in order; first successful response wins.
    // json:true  → proxy wraps response in { contents: "<xml>" }
    // json:false → proxy returns the raw feed text directly
    CORS_PROXIES: [
        { url: 'https://api.allorigins.win/get?url=',           json: true  },
        { url: 'https://corsproxy.io/?',                        json: false },
        { url: 'https://api.codetabs.com/v1/proxy?quest=',      json: false }
    ],
    RSS_FEEDS: {
        bbc:       { name: 'BBC News',   url: 'https://feeds.bbci.co.uk/news/world/rss.xml',    color: '#cc1111' },
        reuters:   { name: 'Reuters',    url: 'https://feeds.reuters.com/reuters/topNews',       color: '#ff7700' },
        aljazeera: { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml',       color: '#009688' }
    },
    // Open-source maritime / shipping news RSS feeds
    MARITIME_FEEDS: {
        gcaptain:  { name: 'gCaptain',          url: 'https://gcaptain.com/feed/',                               color: '#00cfff' },
        marex:     { name: 'Maritime Executive', url: 'https://maritime-executive.com/rss.xml',                   color: '#2979ff' },
        splash247: { name: 'Splash 247',         url: 'https://splash247.com/feed/',                              color: '#00bfa5' }
    }
};
