// ─── Maritime Disruption Data (open-source / OSINT) ──────────────────────────
// Sources: ACLED Maritime, IMB Piracy Report, MARAD Advisories, UNOSAT,
//          Lloyd's List, gCaptain, Splash247, NATO Shipping Centre

const MARITIME_DISRUPTIONS = [
    {
        id: 'red-sea-houthi',
        name: 'Red Sea — Houthi Attacks',
        area: 'Red Sea / Gulf of Aden',
        lat: 15.0, lng: 43.0,
        level: 'critical',
        type: 'Armed Attack',
        started: '2023-11-19',
        status: 'Active',
        affectedRoutes: ['Suez Canal', 'Red Sea', 'Bab-el-Mandeb'],
        description: 'Houthi forces have launched 200+ drone and missile attacks on commercial vessels transiting the Red Sea since Nov 2023. Over 50 shipping companies reroute around the Cape of Good Hope, adding 10–14 days and ~$1M extra fuel per voyage. US-UK Operation Prosperity Guardian provides naval escort but cannot guarantee vessel safety.',
        vesselsAttacked: '100+',
        vesselsSunk: 2,
        parties: ['Houthi (Ansar Allah)', 'US-UK Naval Forces', 'Operation Prosperity Guardian', 'Commercial Shipping'],
        tags: ['houthi', 'missiles', 'drones', 'suez', 'rerouting', 'active-combat']
    },
    {
        id: 'bab-el-mandeb',
        name: 'Bab-el-Mandeb Strait',
        area: 'Bab-el-Mandeb / Djibouti',
        lat: 12.5, lng: 43.5,
        level: 'critical',
        type: 'Choke Point — Under Threat',
        started: '2023-11-19',
        status: 'Active',
        affectedRoutes: ['Bab-el-Mandeb', 'Red Sea southern approach'],
        description: 'Southern Red Sea chokepoint through which ~10% of global trade, ~10% of oil and ~8% of LNG normally transit. Houthi anti-ship missiles and drones targeting vessels at this bottleneck have forced major diversions. Daily transits dropped ~60% from pre-crisis levels.',
        vesselsAttacked: '40+',
        vesselsSunk: 1,
        parties: ['Houthi (Ansar Allah)', 'US-UK Naval Coalition', 'Commercial Shipping'],
        tags: ['chokepoint', 'houthi', 'oil', 'lng', 'diversion', 'cape-route']
    },
    {
        id: 'strait-hormuz-iran',
        name: 'Strait of Hormuz — Iranian Seizures',
        area: 'Strait of Hormuz / Persian Gulf',
        lat: 26.6, lng: 56.3,
        level: 'high',
        type: 'Vessel Seizure / Blockade Threat',
        started: '2023-04-27',
        status: 'Active',
        affectedRoutes: ['Strait of Hormuz', 'Persian Gulf'],
        description: 'Iran\'s IRGC has seized or harassed multiple commercial vessels in the Strait of Hormuz and surrounding waters as leverage in sanctions and nuclear deal negotiations. ~20% of global oil trade and ~30% of LNG transit this 33 km-wide chokepoint daily.',
        vesselsAttacked: '15+',
        vesselsSunk: 0,
        parties: ['Iran (IRGC Navy)', 'US 5th Fleet', 'Commercial Shipping'],
        tags: ['iran', 'irgc', 'seizure', 'oil', 'lng', 'chokepoint']
    },
    {
        id: 'black-sea-ukraine',
        name: 'Black Sea — War Zone',
        area: 'Black Sea / Kerch Strait',
        lat: 43.5, lng: 33.5,
        level: 'high',
        type: 'War Zone / Mine Risk',
        started: '2022-02-24',
        status: 'Active',
        affectedRoutes: ['Black Sea', 'Bosphorus', 'Kerch Strait'],
        description: 'Active war zone with drifting mines, Russian and Ukrainian naval operations. Ukraine\'s maritime drone campaign has sunk multiple Russian warships. Russia blocked Ukraine\'s grain exports mid-2023; Ukraine ran an alternative corridor. Mine threat remains throughout Black Sea basin.',
        vesselsAttacked: '25+',
        vesselsSunk: 4,
        parties: ['Russia (Black Sea Fleet)', 'Ukraine (Maritime Drones)', 'Neutral Commercial Traffic'],
        tags: ['war-zone', 'mines', 'grain-corridor', 'russia', 'ukraine', 'naval']
    },
    {
        id: 'taiwan-strait',
        name: 'Taiwan Strait — Military Tensions',
        area: 'Taiwan Strait / South China Sea',
        lat: 24.5, lng: 119.5,
        level: 'high',
        type: 'Military Tension / Blockade Risk',
        started: '2022-08-04',
        status: 'Elevated',
        affectedRoutes: ['Taiwan Strait', 'East China Sea'],
        description: 'China\'s PLA conducts frequent military exercises and air/naval incursions near Taiwan. The strait carries ~50% of global container traffic and nearly all advanced semiconductor supply. Any blockade scenario would represent a catastrophic global economic shock estimated at $2.6 trillion annually.',
        vesselsAttacked: 0,
        vesselsSunk: 0,
        parties: ['China (PLA Navy / PLAN)', 'Taiwan Navy', 'US 7th Fleet'],
        tags: ['taiwan', 'china', 'blockade-risk', 'semiconductors', 'container-shipping']
    },
    {
        id: 'south-china-sea',
        name: 'South China Sea — Territorial Harassment',
        area: 'South China Sea / Spratly Islands',
        lat: 12.0, lng: 114.0,
        level: 'medium',
        type: 'Territorial Dispute / Vessel Harassment',
        started: '2012-01-01',
        status: 'Active',
        affectedRoutes: ['South China Sea', 'Malacca Strait'],
        description: 'China\'s coast guard and maritime militia vessels regularly harass Philippine and Vietnamese fishing boats and supply ships with water cannons and ramming. Philippines resupply missions to Second Thomas Shoal face routine interception. ~$5 trillion in annual trade transits this region.',
        vesselsAttacked: '30+',
        vesselsSunk: 0,
        parties: ['China (Coast Guard / Maritime Militia)', 'Philippines Navy', 'Vietnam Coast Guard'],
        tags: ['china', 'philippines', 'harassment', 'second-thomas-shoal', 'territorial']
    },
    {
        id: 'gulf-guinea-piracy',
        name: 'Gulf of Guinea — Piracy',
        area: 'Gulf of Guinea / West Africa',
        lat: 3.0, lng: 3.5,
        level: 'medium',
        type: 'Piracy / Armed Robbery',
        started: '2019-01-01',
        status: 'Active',
        affectedRoutes: ['Gulf of Guinea', 'West African Trade Routes'],
        description: 'The Gulf of Guinea accounts for the majority of global maritime kidnappings. Pirates operating from Nigeria and surrounding waters target oil tankers and bulk carriers. IMB reports a declining trend since 2022 but risk remains elevated in offshore areas of Nigeria, Benin, Togo, Ghana, and Cameroon.',
        vesselsAttacked: '20+',
        vesselsSunk: 0,
        parties: ['Nigerian / regional pirates', 'Commercial Shipping', 'West African Navies'],
        tags: ['piracy', 'kidnapping', 'nigeria', 'west-africa', 'oil-tankers']
    },
    {
        id: 'somalia-indian-ocean',
        name: 'Horn of Africa — Piracy Resurgence',
        area: 'Indian Ocean / Gulf of Aden',
        lat: 11.0, lng: 51.0,
        level: 'medium',
        type: 'Piracy',
        started: '2023-11-01',
        status: 'Active',
        affectedRoutes: ['Gulf of Aden', 'Indian Ocean', 'East Africa'],
        description: 'Somali piracy has resurged since late 2023, exploiting reduced naval focus as attention shifted to the Red Sea Houthi crisis. Multiple vessels hijacked including MV Abdullah (March 2024). EU NAVFOR Operation Atalanta and Combined Maritime Forces (CMF) provide counter-piracy patrols.',
        vesselsAttacked: '12+',
        vesselsSunk: 0,
        parties: ['Somali Pirates', 'EU NAVFOR (Operation Atalanta)', 'Combined Maritime Forces'],
        tags: ['piracy', 'somalia', 'hijacking', 'indian-ocean', 'resurgence']
    }
];

// ─── Major shipping lane waypoints ───────────────────────────────────────────
// level: 'critical' | 'disrupted' | 'watch' | 'normal'
const SHIPPING_LANES = [
    {
        id: 'suez-route',
        name: 'Asia–Europe via Suez (DISRUPTED)',
        level: 'critical',
        color: '#ff1744',
        dash: '8, 6',
        waypoints: [
            [51.5, -0.1],   // London
            [36.1, -5.4],   // Gibraltar
            [37.0, 15.3],   // Central Med
            [31.2, 32.3],   // Suez Canal N
            [29.9, 32.6],   // Suez Canal S
            [27.5, 34.0],   // Red Sea N
            [20.0, 38.5],   // Red Sea mid
            [15.0, 41.5],   // Red Sea S
            [12.5, 43.5],   // Bab-el-Mandeb
            [11.5, 44.0],   // Gulf of Aden
            [12.0, 50.0],   // Arabian Sea entry
            [22.0, 60.0],   // Arabian Sea
            [1.3,  103.8],  // Singapore
            [22.3, 114.2],  // Hong Kong
            [35.7, 139.7]   // Tokyo
        ]
    },
    {
        id: 'cape-route',
        name: 'Asia–Europe via Cape of Good Hope (Active Diversion)',
        level: 'normal',
        color: '#00ff88',
        dash: '0',
        waypoints: [
            [51.5, -0.1],   // London
            [43.7, -1.6],   // Bay of Biscay
            [36.1, -5.4],   // Gibraltar
            [14.7, -17.5],  // Dakar
            [2.0,  -8.0],   // Gulf of Guinea
            [-15.0, 12.0],  // Angola
            [-34.4, 18.5],  // Cape of Good Hope
            [-19.0, 35.0],  // Mozambique Channel
            [-4.0,  40.0],  // East Africa
            [11.5, 44.0],   // Gulf of Aden
            [22.0, 60.0],   // Arabian Sea
            [1.3,  103.8],  // Singapore
            [22.3, 114.2],  // Hong Kong
            [35.7, 139.7]   // Tokyo
        ]
    },
    {
        id: 'hormuz-lane',
        name: 'Strait of Hormuz / Persian Gulf',
        level: 'disrupted',
        color: '#ff6d00',
        dash: '8, 6',
        waypoints: [
            [22.0, 60.0],   // Arabian Sea
            [24.0, 57.0],   // Approach
            [26.6, 56.3],   // Hormuz Strait
            [27.0, 55.0],   // Persian Gulf entry
            [26.5, 50.5],   // Bahrain / Qatar
            [29.0, 48.0]    // Kuwait / Iraq
        ]
    },
    {
        id: 'taiwan-strait-lane',
        name: 'Taiwan Strait',
        level: 'disrupted',
        color: '#ff6d00',
        dash: '8, 6',
        waypoints: [
            [1.3,  103.8],  // Singapore
            [10.0, 109.0],  // South China Sea
            [21.0, 114.5],  // Hong Kong approach
            [22.3, 114.2],  // Hong Kong
            [23.0, 117.0],  // Southern entry
            [24.5, 119.5],  // Taiwan Strait mid
            [25.0, 122.0],  // Northern exit
            [35.7, 139.7]   // Tokyo
        ]
    },
    {
        id: 'malacca-lane',
        name: 'Strait of Malacca',
        level: 'watch',
        color: '#ffab00',
        dash: '4, 4',
        waypoints: [
            [1.3,  103.8],  // Singapore
            [2.5,  102.5],  // Central
            [5.4,  100.3],  // Penang
            [6.5,  99.5]    // Northern entry
        ]
    },
    {
        id: 'black-sea-lane',
        name: 'Black Sea',
        level: 'critical',
        color: '#ff1744',
        dash: '8, 6',
        waypoints: [
            [41.0, 29.0],   // Bosphorus
            [41.5, 30.5],   // Western Black Sea
            [43.5, 33.5],   // Central Black Sea
            [46.0, 31.0],   // Odessa
            [46.5, 32.0],   // Ukraine coast
            [45.0, 37.0],   // Kerch Strait approach
            [45.3, 36.5]    // Kerch Strait
        ]
    }
];

// ─── Disruption zone radius (km) for map circles ─────────────────────────────
const DISRUPTION_RADII = {
    'red-sea-houthi':      350000,
    'bab-el-mandeb':       120000,
    'strait-hormuz-iran':  100000,
    'black-sea-ukraine':   280000,
    'taiwan-strait':       180000,
    'south-china-sea':     350000,
    'gulf-guinea-piracy':  300000,
    'somalia-indian-ocean':400000
};
