// netlify/functions/fetch-news.js
const { API_KEY } = process.env; // Your NewsAPI key, stored safely in Netlify

// Only these sites are allowed in. Tech, AI, gaming, gadgets, security.
// (If NewsAPI doesn't cover one of them, it just returns nothing for it. Nothing breaks.)
const DOMAINS = [
    // tech and gadgets
    'theverge.com',
    'techcrunch.com',
    'arstechnica.com',
    'wired.com',
    'engadget.com',
    'gizmodo.com',
    'cnet.com',
    'tomshardware.com',
    'techradar.com',
    'zdnet.com',
    'pcmag.com',
    'digitaltrends.com',
    'macrumors.com',
    '9to5mac.com',
    '9to5google.com',
    'androidcentral.com',
    'windowscentral.com',
    'theregister.com',
    // AI
    'venturebeat.com',
    // security
    'bleepingcomputer.com',
    'thehackernews.com',
    'securityweek.com',
    'krebsonsecurity.com',
    // gaming
    'ign.com',
    'gamespot.com',
    'polygon.com',
    'pcgamer.com',
    'eurogamer.net',
    'rockpapershotgun.com',
    'videogameschronicle.com',
].join(',');

const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
};

exports.handler = async function () {
    const params = new URLSearchParams({
        domains: DOMAINS,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '100', // the most NewsAPI allows in one request
        apiKey: API_KEY,
    });
    const NEWS_URL = `https://newsapi.org/v2/everything?${params.toString()}`;

    try {
        const response = await fetch(NEWS_URL);
        const data = await response.json();

        // If NewsAPI gives an error, pass it back (not cached)
        if (!response.ok) {
            return {
                statusCode: response.status,
                headers: jsonHeaders,
                body: JSON.stringify({
                    error: data.message || `HTTP error! status: ${response.status}`,
                }),
            };
        }

        // Clean the list: drop broken, empty and duplicate stories
        const seen = new Set();
        const cleaned = (data.articles || [])
            .filter((a) => a.title && a.description && a.url)
            .filter((a) => !a.title.includes('[Removed]'))
            .filter((a) => {
                const key = a.title.trim().toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .slice(0, 60);

        return {
            statusCode: 200,
            headers: {
                ...jsonHeaders,
                // Netlify keeps this answer for 30 minutes, so lots of visitors
                // only cost you ONE NewsAPI request every 30 minutes.
                'Netlify-CDN-Cache-Control':
                    'public, s-maxage=1800, stale-while-revalidate=3600',
                'Cache-Control': 'public, max-age=0, must-revalidate',
            },
            body: JSON.stringify({ ...data, articles: cleaned }),
        };
    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            headers: jsonHeaders,
            body: JSON.stringify({ error: 'Failed to fetch news from API.' }),
        };
    }
};