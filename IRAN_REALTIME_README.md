# Iran Real-Time Conflict Data Feature

## Overview

This feature provides real-time updates for Iran conflict information, including:
- **Missile and rocket alerts** - Real-time alerts from Times of Israel and Jerusalem Post
- **Nuclear status updates** - IAEA press releases on Iran's nuclear program
- **Conflict events** - Regional news from BBC, Reuters, and Al Jazeera
- **Proxy activity tracking** - Updates on Hezbollah, Houthis, and PMF activities

## How It Works

### Data Sources (All Free/Open-Source)

1. **Missile Alerts**
   - Times of Israel Alerts RSS: `https://www.timesofisrael.com/alerts/feed/`
   - Jerusalem Post Alerts RSS: `https://www.jpost.com/Rss/RssFeedsAlerts.aspx`
   - Updates: Real-time

2. **Nuclear Information**
   - IAEA Press Releases RSS: `https://www.iaea.org/newscenter/pressreleases/rss`
   - Updates: As published

3. **Regional News**
   - BBC Middle East: `https://feeds.bbci.co.uk/news/world/middle_east/rss.xml`
   - Reuters Middle East: `https://feeds.reuters.com/reuters/middleeastNews`
   - Al Jazeera: `https://www.aljazeera.com/xml/rss/all.xml`
   - Updates: Continuous

### Architecture

```
iran_realtime.js
├── fetchMissileAlerts()      → Fetch & parse missile/rocket alerts
├── fetchNuclearStatus()      → Fetch & parse IAEA nuclear updates
├── fetchConflictEvents()     → Fetch & parse regional conflict news
├── updateIranRealTimeData()  → Update all data sources
└── getEnrichedIranDescription() → Generate dynamic description

conflicts.js
└── updateIranConflictWithRealTimeData() → Update Iran conflict entry

app.js
├── Initialize iran_realtime on page load
├── Update Iran data every 15 minutes
└── Refresh on manual data reload
```

### Caching Strategy

- **Cache Duration**: 15 minutes
- **Storage**: localStorage (`warwatch_iran_cache`)
- **Fallback**: Uses cached data if fetch fails
- **Updates**: Automatic every 15 minutes + manual refresh

### Features

#### 1. Dynamic Conflict Description
The Iran Regional Tensions conflict description is now dynamically generated with:
- Recent missile alert counts (last 30 days)
- Current uranium enrichment level from IAEA
- Proxy activity status based on recent incidents
- Real-time timestamp

#### 2. Missile Alert Display
When viewing Iran conflict details:
- Shows last 5 missile/rocket alerts
- Alert type (missile, drone, artillery, airstrike)
- Timestamp for each alert
- Visual indicators with color coding

#### 3. Nuclear Status Display
- Latest IAEA press release title
- Extracted enrichment percentage (e.g., "60%")
- Publication date
- Link to source

#### 4. Real-Time Indicator
- Status shows "Active (Real-time)" instead of just "Active"
- Green timestamp showing last data update
- Updated sources list in detail panel

## Configuration

### Adding New Feeds

Edit `js/config.js` to add more RSS feeds:

```javascript
IRAN_FEEDS: {
    new_source: {
        name: 'Source Name',
        url: 'https://example.com/rss',
        color: '#hexcolor'
    }
}
```

### Adjusting Update Frequency

In `js/app.js`, change the interval:

```javascript
// Current: 15 minutes
setInterval(async () => {
    await updateIranRealTimeData();
    // ...
}, 15 * 60 * 1000);

// Example: 10 minutes
}, 10 * 60 * 1000);
```

### Modifying Cache Duration

In `js/iran_realtime.js`:

```javascript
const IRAN_CACHE_TTL = 15 * 60 * 1000; // Change this value
```

## API Integration Options

### ACLED API (Optional)

To integrate the ACLED API for more detailed conflict data:

1. Register at https://developer.acleddata.com/
2. Get your free API key
3. Add to `js/config.js`:
   ```javascript
   ACLED_API_KEY: 'your-key-here'
   ```
4. Uncomment and implement the ACLED fetch function in `iran_realtime.js`

Example ACLED endpoint:
```
https://api.acleddata.com/acled/read?country=Iran&limit=50&key=YOUR_KEY
```

## Manual Testing

### 1. View Iran Conflict
- Navigate to the app
- Find "Iran Regional Tensions" in conflict list
- Click to open details
- Verify "Active (Real-time)" status

### 2. Check Missile Alerts
- Open Iran conflict detail panel
- Scroll down to "🚨 RECENT MISSILE ALERTS" section
- Verify alerts are displayed (if any available)

### 3. Check Nuclear Status
- Look for "☢️ NUCLEAR STATUS" section
- Verify IAEA data is displayed
- Check enrichment percentage

### 4. Verify Auto-Update
- Open browser console (F12)
- Look for logs: `[iran] Fetching real-time data...`
- Wait 15 minutes to see automatic update

### 5. Test Cache
- Refresh page
- Check console: `[iran] Loaded cached real-time data`
- Verify data loads without network requests

## Troubleshooting

### No Data Displayed

1. **Check Console Errors**
   - Open browser DevTools (F12)
   - Look for errors in Console tab
   - Common: CORS proxy failures

2. **Test CORS Proxies**
   - The app tries 3 different CORS proxies
   - If all fail, RSS feeds won't load
   - Check if proxies are operational

3. **Verify RSS Feeds**
   - Test feed URLs directly in browser
   - Feeds may be temporarily unavailable
   - Check if feed format has changed

### Slow Loading

1. **Increase Timeout**
   - Edit `iran_realtime.js`
   - Change `timeout: 10000` to higher value

2. **Reduce Feed Count**
   - Comment out some feeds in `fetchConflictEvents()`
   - Keep only most reliable sources

### Cache Issues

1. **Clear Cache**
   - Open browser console
   - Run: `localStorage.removeItem('warwatch_iran_cache')`
   - Refresh page

2. **Disable Cache**
   - Comment out cache loading in `initIranRealTime()`

## Future Enhancements

1. **Browser Notifications**
   - Alert user when new missile alerts detected
   - Requires notification permission

2. **WebSocket Integration**
   - Real-time push updates instead of polling
   - Requires backend server

3. **Historical Data**
   - Store alerts in database
   - Generate trend charts

4. **Geolocation**
   - Parse alert locations
   - Display on map with markers

5. **Severity Classification**
   - ML model to classify alert severity
   - Color-code based on threat level

## API Rate Limits

All RSS feeds used are free and have no strict rate limits, but best practices:
- Don't refresh more frequently than every 5 minutes
- Use caching aggressively
- Respect robots.txt of source sites

## Privacy & Security

- No user data is sent to external servers
- All data fetching uses CORS proxies
- No API keys stored in browser
- Cache is local-only (localStorage)

## License

This feature uses publicly available RSS feeds:
- IAEA: Public domain (UN agency)
- News sources: Fair use for information aggregation
- Alert feeds: Public safety information

Always check individual source licenses for commercial use.

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify internet connection
3. Test if RSS feeds are accessible
4. Report issues with console logs included

## Credits

- **Data Sources**: IAEA, Times of Israel, Jerusalem Post, BBC, Reuters, Al Jazeera
- **CORS Proxies**: allorigins.win, corsproxy.io, codetabs.com
- **Implementation**: WarWatch OSINT Tool
