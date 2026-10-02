// netlify/functions/fetch-news.js  (RSS version: no API key, no daily limit)
//
// Reads the public RSS/Atom feeds of the tech sites below, mixes them together,
// and sends the newest stories to the website in the same shape as before.
// If a feed is down or blocks us, it is skipped and the others still work.
//
// Quick health check: open  /.netlify/functions/fetch-news?debug=1  in your browser.
// It lists every feed, whether it worked, and how many stories it gave.

const FEEDS = [
    // tech and gadgets
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { name: 'Engadget', url: 'https://www.engadget.com/rss.xml' },
    { name: 'Gizmodo', url: 'https://gizmodo.com/feed' },
    { name: 'CNET', url: 'https://www.cnet.com/rss/news/' },
    { name: 'TechRadar', url: 'https://www.techradar.com/rss' },
    { name: "Tom's Hardware", url: 'https://www.tomshardware.com/feeds/all' },
    { name: '9to5Mac', url: 'https://9to5mac.com/feed/' },
    { name: '9to5Google', url: 'https://9to5google.com/feed/' },
    { name: 'MacRumors', url: 'https://feeds.macrumors.com/MacRumors-All' },
    { name: 'The Register', url: 'https://www.theregister.com/headlines.atom' },
    { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml' },
    { name: 'Digital Trends', url: 'https://www.digitaltrends.com/feed/' },
    // AI
    { name: 'The Decoder', url: 'https://the-decoder.com/feed/' },
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
    // security
    { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' },
    { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
    { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' },
    { name: 'SecurityWeek', url: 'https://feeds.feedburner.com/securityweek' },
    // gaming
    { name: 'IGN', url: 'https://feeds.ign.com/ign/all' },
    { name: 'GameSpot', url: 'https://www.gamespot.com/feeds/mashup/' },
    { name: 'Polygon', url: 'https://www.polygon.com/rss/index.xml' },
    { name: 'PC Gamer', url: 'https://www.pcgamer.com/rss/' },
    { name: 'Eurogamer', url: 'https://www.eurogamer.net/feed' },
    { name: 'Rock Paper Shotgun', url: 'https://www.rockpapershotgun.com/feed' },
    { name: 'VGC', url: 'https://www.videogameschronicle.com/feed/' },
];

const FEED_TIMEOUT_MS = Number(process.env.FEED_TIMEOUT_MS) || 3000; // give up on a slow feed after 3 seconds
const MAX_PER_FEED = 15; // newest stories taken from each feed
const MAX_TOTAL = 100; // stories sent to the website
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // ignore anything older than a week
const SUMMARY_LENGTH = 400;
const USER_AGENT = 'Mozilla/5.0 (compatible; TechBytesBot/1.0; +https://tech-byte-news.netlify.app)';

const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
};

/* ---------- reading feed text ---------- */

const NAMED_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201D', ldquo: '\u201C',
    ndash: '\u2013', mdash: '\u2014', hellip: '\u2026',
};

function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity) => {
        if (entity[0] === '#') {
            const isHex = entity[1].toLowerCase() === 'x';
            const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
            try {
                return String.fromCodePoint(code);
            } catch (e) {
                return whole;
            }
        }
        const known = NAMED_ENTITIES[entity.toLowerCase()];
        return known !== undefined ? known : whole;
    });
}

function unwrapCdata(text) {
    return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

// Feed text -> plain text (no HTML, no entities, single spaces)
function cleanText(raw) {
    if (!raw) return '';
    let text = decodeEntities(unwrapCdata(raw));
    text = text
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<\/?(?:p|br|div|li|ul|ol|h[1-6]|tr|td|table|blockquote|figure|figcaption)\b[^>]*>/gi, ' ')
        .replace(/<[^>]+>/g, ''); // inline tags (bold, links...) leave no gap
    return decodeEntities(text).replace(/\s+/g, ' ').trim();
}

function shorten(text, max) {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}\u2026`;
}

function tagText(block, name) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
    return match ? match[1] : '';
}

function isWebUrl(value) {
    return /^https?:\/\//i.test(value || '');
}

function itemLink(block) {
    // feeds run through FeedBurner keep the real link here
    const original = cleanText(tagText(block, 'feedburner:origLink'));
    if (isWebUrl(original)) return original;

    // RSS: <link>https://...</link>
    const rssLink = cleanText(tagText(block, 'link'));
    if (isWebUrl(rssLink)) return rssLink;

    // Atom: <link href="https://..." rel="alternate" />
    const tags = block.match(/<link\b[^>]*>/gi) || [];
    let fallback = '';
    for (const tag of tags) {
        const href = (tag.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1];
        if (!isWebUrl(decodeEntities(href || ''))) continue;
        const rel = (tag.match(/\brel\s*=\s*["']([^"']+)["']/i) || [])[1];
        if (!rel || rel.toLowerCase() === 'alternate') return decodeEntities(href);
        if (!fallback) fallback = decodeEntities(href);
    }
    if (fallback) return fallback;

    // last resort: a guid that is a web address
    const guid = cleanText(tagText(block, 'guid'));
    return isWebUrl(guid) ? guid : '';
}

function itemDate(block) {
    const raw =
        cleanText(tagText(block, 'pubDate')) ||
        cleanText(tagText(block, 'dc:date')) ||
        cleanText(tagText(block, 'published')) ||
        cleanText(tagText(block, 'updated'));
    const time = new Date(raw).getTime();
    if (Number.isNaN(time)) return null;
    if (time > Date.now() + 12 * 60 * 60 * 1000) return null; // far in the future = bad date, skip it
    return Math.min(time, Date.now()); // a few hours ahead (clock or timezone slip) counts as "now"
}

// One feed's text -> a list of stories
function parseFeed(xml, sourceName) {
    const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
    const stories = [];
    blocks.forEach((block) => {
        const title = cleanText(tagText(block, 'title'));
        const url = itemLink(block);
        const time = itemDate(block);
        if (!title || !url || time === null) return;
        const description = cleanText(
            tagText(block, 'description') ||
                tagText(block, 'summary') ||
                tagText(block, 'content:encoded') ||
                tagText(block, 'content')
        );
        stories.push({
            title,
            description: shorten(description, SUMMARY_LENGTH),
            url,
            time,
            source: { name: sourceName },
        });
    });
    return stories.sort((a, b) => b.time - a.time);
}

/* ---------- loading feeds ---------- */

async function loadFeed(feed) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
    try {
        const response = await fetch(feed.url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': USER_AGENT,
                Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5',
            },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const stories = parseFeed(await response.text(), feed.name);
        if (stories.length === 0) throw new Error('no stories found in feed');
        return { feed, ok: true, stories: stories.slice(0, MAX_PER_FEED), ms: Date.now() - started };
    } catch (error) {
        const reason = error && error.name === 'AbortError' ? 'timeout' : (error && error.message) || 'failed';
        return { feed, ok: false, error: reason, stories: [], ms: Date.now() - started };
    } finally {
        clearTimeout(timer);
    }
}

function sameLink(url) {
    return url.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
}

exports.handler = async function (event) {
    const results = await Promise.all(FEEDS.map(loadFeed));

    // health check page: /.netlify/functions/fetch-news?debug=1
    if (event && event.queryStringParameters && event.queryStringParameters.debug) {
        return {
            statusCode: 200,
            headers: jsonHeaders,
            body: JSON.stringify(
                {
                    working: results.filter((r) => r.ok).length,
                    total: results.length,
                    feeds: results.map((r) => ({
                        name: r.feed.name,
                        ok: r.ok,
                        stories: r.stories.length,
                        newest: r.stories[0] ? new Date(r.stories[0].time).toISOString() : null,
                        error: r.error || undefined,
                        ms: r.ms,
                    })),
                },
                null,
                2
            ),
        };
    }

    const cutoff = Date.now() - MAX_AGE_MS;
    const seen = new Set();
    const articles = results
        .flatMap((r) => r.stories)
        .filter((s) => s.time >= cutoff)
        .sort((a, b) => b.time - a.time)
        .filter((s) => {
            const key = sameLink(s.url);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, MAX_TOTAL)
        .map((s) => ({
            title: s.title,
            description: s.description,
            url: s.url,
            publishedAt: new Date(s.time).toISOString(),
            source: s.source,
        }));

    if (articles.length === 0) {
        console.error('No feed returned stories', results.map((r) => `${r.feed.name}: ${r.error}`));
        return {
            statusCode: 502,
            headers: jsonHeaders,
            body: JSON.stringify({ error: 'No news feeds are reachable right now.' }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            ...jsonHeaders,
            // Netlify keeps this answer for 5 minutes, so lots of visitors share one fetch
            'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
        body: JSON.stringify({ status: 'ok', totalResults: articles.length, articles }),
    };
};