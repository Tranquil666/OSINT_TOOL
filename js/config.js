const CONFIG = {
    MAP_CENTER: [20, 15],
    MAP_ZOOM: 3,
    NEWS_REFRESH_MS: 5 * 60 * 1000,
    CORS_PROXY: 'https://api.allorigins.win/get?url=',
    RSS_FEEDS: {
        bbc:       { name: 'BBC News',  url: 'https://feeds.bbci.co.uk/news/world/rss.xml',         color: '#cc1111' },
        reuters:   { name: 'Reuters',   url: 'https://feeds.reuters.com/Reuters/worldNews',          color: '#ff7700' },
        aljazeera: { name: 'Al Jazeera',url: 'https://www.aljazeera.com/xml/rss/all.xml',            color: '#009688' }
    }
};
