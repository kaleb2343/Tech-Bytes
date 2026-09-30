// Tech Bytes - main script (step 3: category filters with pixel icons)

const newsContainer = document.getElementById('news-container');
const filterBar = document.getElementById('filter-bar');

const NEWS_URL = '/.netlify/functions/fetch-news';
const REFRESH_MS = 30 * 60 * 1000; // matches the 30 minute cache in the Netlify function

// Stories containing these words are dropped (spam, promos, off-topic)
const BLOCKED_WORDS = [
    'betting',
    'casino',
    'gambling',
    'sportsbook',
    'promo code',
    'webinar',
    'sponsored',
    'box office',
];

/* ---------- categories ----------
   Every story is checked against these word lists (headline + summary).
   The first category that matches wins, in this order: SECURITY, AI, GAMING, GADGETS.
   A story that matches NOTHING is dropped, so the site stays 100% tech.
   To let more stories in, just add words to a list. Plurals (hack -> hacks) work automatically. */
const CATEGORY_ORDER = ['SECURITY', 'AI', 'GAMING', 'GADGETS'];

// The order the filter buttons appear in
const FILTER_ORDER = ['ALL', 'AI', 'GAMING', 'GADGETS', 'SECURITY'];

const CATEGORY_KEYWORDS = {
    SECURITY: [
        'hack', 'hacker', 'hacking', 'hacked', 'ransomware', 'malware', 'botnet', 'spyware',
        'phishing', 'breach', 'breached', 'vulnerability', 'vulnerabilities', 'exploit',
        'exploited', 'cyberattack', 'cybersecurity', 'zero-day', 'security flaw', 'flaw',
        'data leak', 'misconfigured', 'expose', 'exposed', 'exposing',
    ],
    AI: [
        'ai', 'artificial intelligence', 'openai', 'anthropic', 'chatgpt', 'gemini', 'claude',
        'deepseek', 'llm', 'chatbot', 'copilot', 'generative', 'machine learning', 'neural',
    ],
    GAMING: [
        'game', 'gaming', 'gamer', 'video game', 'playstation', 'ps5', 'ps4', 'xbox',
        'nintendo', 'steam deck', 'esports', 'fortnite', 'twitch', 'dlss', 'emulator',
        'console', 'rog ally', 'handheld', 'minecraft',
    ],
    GADGETS: [
        'iphone', 'ipad', 'macbook', 'airpods', 'apple watch', 'ios', 'macos', 'android',
        'pixel', 'galaxy', 'samsung', 'laptop', 'smartphone', 'phone', 'headphone', 'earbud',
        'wearable', 'smartwatch', 'smart glasses', 'keyboard', 'monitor', 'gpu', 'cpu',
        'processor', 'motherboard', 'ssd', 'tablet', 'e-reader', 'headset', 'router',
        'foldable', 'accessory', 'accessories', 'magsafe', 'charger', 'gadget', 'nvidia',
        'amd', 'intel', 'qualcomm', 'speaker', 'camera', 'drone',
    ],
};

// Some sources always belong to one category
const SECURITY_SOURCES = ['bleepingcomputer', 'thehackernews'];
const SOURCE_DEFAULT = { pcgamer: 'GAMING', tomshardware: 'GADGETS' };

// Little pixel icons for the filter buttons (# = black pixel, 12 pixels wide)
const CATEGORY_ICONS = {
    ALL: [
        '............', '.####..####.', '.####..####.', '.####..####.', '.####..####.', '............',
        '............', '.####..####.', '.####..####.', '.####..####.', '.####..####.', '............',
    ],
    AI: [
        '.....##.....', '.....##.....', '..########..', '.##########.', '###..##..###',
        '###..##..###', '.##########.', '.##.####.##.', '.##########.', '..########..',
    ],
    GAMING: [
        '..########..', '.##########.', '###.########', '##...###.#.#', '###.########',
        '.####..####.', '.###....###.',
    ],
    GADGETS: [
        '...######...', '...#....#...', '...#....#...', '...#....#...', '...#....#...', '...#....#...',
        '...#....#...', '...#....#...', '...#....#...', '...######...', '...##..##...', '...######...',
    ],
    SECURITY: [
        '.##########.', '.##########.', '.####..####.', '.###....###.', '.####..####.',
        '.####..####.', '..########..', '...######...', '....####....', '.....##.....',
    ],
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CATEGORY_PATTERNS = {};
CATEGORY_ORDER.forEach((category) => {
    const words = CATEGORY_KEYWORDS[category].map(escapeRegex).join('|');
    CATEGORY_PATTERNS[category] = new RegExp(`\\b(?:${words})(?:s|es)?\\b`, 'i');
});

function categorize(text, sourceName) {
    const source = (sourceName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SECURITY_SOURCES.includes(source)) return 'SECURITY';
    for (const category of CATEGORY_ORDER) {
        if (CATEGORY_PATTERNS[category].test(text)) return category;
    }
    return SOURCE_DEFAULT[source] || null;
}

let currentNews = [];
let activeCategory = 'ALL';
let hasRendered = false;
let isLoading = false;

/* ---------- small helpers ---------- */

// Build an element safely (text is never treated as HTML)
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function normalize(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Turn HTML entities / tags in API text into plain text
function toPlainText(str) {
    if (!str) return '';
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

// "Headline | TechCrunch" -> "Headline"  (only if the tail is the source name)
function cleanTitle(title, sourceName) {
    const text = toPlainText(title);
    const src = normalize(sourceName);
    const match = text.match(/^(.*\S)\s+[|\-–—]\s+([^|\-–—]+)$/);
    if (!match || !src) return text;
    const tail = normalize(match[2]);
    if (tail.length >= 3 && (tail.includes(src) || src.includes(tail))) {
        return match[1].trim();
    }
    return text;
}

// Remove "| TechCrunchtechcrunch.com" leftovers, and summaries that just repeat the title
function cleanSummary(description, title, sourceName) {
    let text = toPlainText(description);
    const src = normalize(sourceName);
    const match = text.match(/^(.*?)\s*\|\s*([^|]+)$/);
    if (match && src && normalize(match[2]).includes(src)) {
        text = match[1].trim();
    }
    if (normalize(text) === normalize(title) || text.length < 15) return '';
    return text;
}

function timeAgo(isoDate) {
    const then = new Date(isoDate).getTime();
    if (Number.isNaN(then)) return '';
    const minutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
    if (minutes < 60) return `${Math.max(1, minutes)}M AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}H AGO`;
    return `${Math.floor(hours / 24)}D AGO`;
}

function isBlocked(article) {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    return BLOCKED_WORDS.some((word) => text.includes(word));
}

// Raw API articles -> clean objects the cards can use (off-topic stories are dropped here)
function prepareArticles(articles) {
    return articles
        .filter((a) => a && a.title && a.url && /^https?:\/\//i.test(a.url))
        .filter((a) => !isBlocked(a) && !/\/forums?\//i.test(a.url))
        .map((a, index) => {
            const source = (a.source && a.source.name) || '';
            const title = cleanTitle(a.title, source);
            const summary = cleanSummary(a.description, title, source);
            return {
                id: `news-${index}`,
                title,
                summary,
                url: a.url,
                source: source.toUpperCase(),
                category: categorize(`${title} ${summary}`, source),
                time: timeAgo(a.publishedAt),
            };
        })
        .filter((item) => item.category);
}

/* ---------- rendering ---------- */

function renderNews(newsData) {
    newsContainer.innerHTML = '';

    if (newsData.length === 0) {
        const card = el('div', 'pixel-card col-span-full text-center');
        card.appendChild(el('p', 'pixel-font', 'No news available at the moment.'));
        newsContainer.appendChild(card);
        return;
    }

    newsData.forEach((item, index) => {
        const card = el('div', 'pixel-card news-card');
        card.id = item.id;
        card.style.setProperty('--i', index);

        const meta = el('div', 'card-meta');
        meta.appendChild(el('span', 'category-tag', item.category));
        meta.appendChild(el('span', 'time-ago', item.time));
        card.appendChild(meta);

        card.appendChild(el('h3', 'text-xl md:text-2xl pixel-font mb-4 text-left', item.title));

        if (item.summary) {
            card.appendChild(el('p', 'text-base text-left mb-4', item.summary));
        }

        const footer = el('div', 'card-footer mt-auto');
        footer.appendChild(el('span', 'card-source', item.source ? `VIA ${item.source}` : ''));
        const button = el('button', 'text-sm pixel-button read-more-button', 'Read More');
        button.dataset.newsUrl = item.url;
        footer.appendChild(button);
        card.appendChild(footer);

        newsContainer.appendChild(card);
    });
}

// Draws one pixel icon (colored by the button's text color)
function makeIcon(category) {
    const ns = 'http://www.w3.org/2000/svg';
    const rows = CATEGORY_ICONS[category];
    const offset = Math.floor((12 - rows.length) / 2);
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.setAttribute('class', 'filter-icon');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('aria-hidden', 'true');
    rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            if (row[x] !== '#') continue;
            const rect = document.createElementNS(ns, 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y + offset);
            rect.setAttribute('width', 1);
            rect.setAttribute('height', 1);
            rect.setAttribute('fill', 'currentColor');
            svg.appendChild(rect);
        }
    });
    return svg;
}

// The row of category buttons (ALL, AI, GAMING...) with an icon and a count on each
function renderFilterBar() {
    filterBar.innerHTML = '';
    filterBar.appendChild(el('p', 'filter-label', 'Select channel'));

    FILTER_ORDER.forEach((category) => {
        const count =
            category === 'ALL'
                ? currentNews.length
                : currentNews.filter((item) => item.category === category).length;
        if (category !== 'ALL' && count === 0) return; // no empty buttons

        const isActive = category === activeCategory;
        const button = el('button', isActive ? 'filter-button is-active' : 'filter-button');
        button.type = 'button';
        button.dataset.category = category;
        button.setAttribute('aria-pressed', String(isActive));
        button.appendChild(makeIcon(category));
        button.appendChild(el('span', 'filter-name', category));
        button.appendChild(el('span', 'filter-count', String(count)));
        filterBar.appendChild(button);
    });

    filterBar.hidden = false;
}

// Draw the filter buttons + the cards for the chosen category
function showCurrent() {
    if (activeCategory !== 'ALL' && !currentNews.some((item) => item.category === activeCategory)) {
        activeCategory = 'ALL';
    }
    renderFilterBar();
    const list =
        activeCategory === 'ALL'
            ? currentNews
            : currentNews.filter((item) => item.category === activeCategory);
    renderNews(list);
}

function showLoading() {
    filterBar.hidden = true;
    newsContainer.innerHTML = '';
    const card = el('div', 'pixel-card flex justify-center items-center h-48 col-span-full');
    card.appendChild(el('p', 'pixel-font text-lg blink', 'Loading news'));
    newsContainer.appendChild(card);
}

function showError(message) {
    filterBar.hidden = true;
    newsContainer.innerHTML = '';
    const card = el('div', 'pixel-card col-span-full error-card');
    card.appendChild(el('h3', 'pixel-font text-2xl mb-4 blink', 'Signal lost'));
    card.appendChild(el('p', 'text-base mb-6', "Couldn't load the news right now. Check your connection and try again."));
    if (message) card.appendChild(el('p', 'error-detail mb-6', message));
    const retry = el('button', 'text-sm pixel-button retry-button', 'Retry');
    card.appendChild(retry);
    newsContainer.appendChild(card);
}

/* ---------- events ---------- */

newsContainer.addEventListener('click', (event) => {
    const readMore = event.target.closest('.read-more-button');
    if (readMore) {
        window.open(readMore.dataset.newsUrl, '_blank', 'noopener');
        return;
    }
    if (event.target.closest('.retry-button')) {
        showLoading();
        fetchNews();
    }
});

filterBar.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-button');
    if (!button || button.dataset.category === activeCategory) return;
    activeCategory = button.dataset.category;
    showCurrent();
});

// The logo in index.html calls this (module scripts need it on window)
window.showAllNews = function () {
    activeCategory = 'ALL';
    if (hasRendered) showCurrent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ---------- fetching ---------- */

async function fetchNews() {
    if (isLoading) return;
    isLoading = true;

    try {
        const response = await fetch(NEWS_URL);

        if (!response.ok) {
            let message = response.statusText;
            try {
                const errorData = await response.json();
                message = errorData.error || message;
            } catch (e) {
                /* response had no JSON body */
            }
            throw new Error(message);
        }

        const data = await response.json();
        const articles = prepareArticles(data.articles || []);

        // Only redraw when the stories actually changed
        const changed =
            articles.map((a) => a.url).join('|') !== currentNews.map((a) => a.url).join('|');

        if (!hasRendered || changed) {
            currentNews = articles;
            showCurrent();
            hasRendered = true;
        }
    } catch (error) {
        console.error('Could not fetch news:', error);
        // Never wipe stories the visitor is already reading
        if (!hasRendered) showError(error.message);
    } finally {
        isLoading = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
    setInterval(fetchNews, REFRESH_MS);
});