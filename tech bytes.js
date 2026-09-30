// Tech Bytes - main script

const newsContainer = document.getElementById('news-container');
const filterBar = document.getElementById('filter-bar');
const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const searchStatus = document.getElementById('search-status');
const themeToggle = document.getElementById('theme-toggle');

const NEWS_URL = '/.netlify/functions/fetch-news';
const REFRESH_MS = 10 * 60 * 1000; // check for new stories every 10 minutes (the function caches for 5)
const SAVED_KEY = 'techbytes.saved.v1';
const THEME_KEY = 'techbytes.theme';
const MAX_SAVED = 100;
const PAGE_SIZE = 30; // cards shown at first, and added by each LOAD MORE

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
const FILTER_ORDER = ['ALL', 'AI', 'GAMING', 'GADGETS', 'SECURITY', 'SAVED'];

const CATEGORY_KEYWORDS = {
    SECURITY: [
        'hack', 'hacker', 'hacking', 'hacked', 'ransomware', 'malware', 'botnet', 'spyware',
        'phishing', 'breach', 'breached', 'vulnerability', 'vulnerabilities', 'exploit',
        'exploited', 'cyberattack', 'cybersecurity', 'zero-day', 'security flaw', 'flaw',
        'data leak', 'misconfigured', 'security bypass', 'expose data', 'exposes data',
        'exposed data', 'exposing data', 'exposed keys', 'exposed credentials', 'exposed database',
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

// Little pixel icons (# = black pixel, up to 12 pixels wide)
const HEART_FILLED = [
    '.##....##.',
    '####..####',
    '##########',
    '##########',
    '.########.',
    '..######..',
    '...####...',
    '....##....',
];

const HEART_OUTLINE = [
    '.##....##.',
    '#..#..#..#',
    '#...##...#',
    '#........#',
    '.#......#.',
    '..#....#..',
    '...#..#...',
    '....##....',
];

const MOON_ICON = [
    '............',
    '....#.......',
    '..###.......',
    '..###.......',
    '.####.......',
    '.####.......',
    '.####.......',
    '.#####......',
    '.#########..',
    '..########..',
    '...#####....',
    '............',
];

const SUN_ICON = [
    '.....##.....',
    '............',
    '..#......#..',
    '.....##.....',
    '....####....',
    '#..######..#',
    '#..######..#',
    '....####....',
    '.....##.....',
    '..#......#..',
    '............',
    '.....##.....',
];

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
    SAVED: HEART_FILLED,
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

/* ---------- state ---------- */

let currentNews = [];
let savedStories = loadSaved();
let activeCategory = 'ALL';
let searchQuery = '';
let restList = []; // the cards under the top story
let shownCount = 0; // how many of them are on screen
let hasRendered = false;
let isLoading = false;

/* ---------- saved stories (kept in this browser only) ---------- */

function loadSaved() {
    try {
        const parsed = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((s) => s && typeof s.title === 'string' && typeof s.url === 'string')
            .filter((s) => /^https?:\/\//i.test(s.url))
            .map((s) => ({
                url: s.url,
                title: s.title,
                summary: typeof s.summary === 'string' ? s.summary : '',
                source: typeof s.source === 'string' ? s.source : '',
                category: CATEGORY_ORDER.includes(s.category) ? s.category : 'TECH',
                published: typeof s.published === 'string' ? s.published : '',
            }));
    } catch (e) {
        return []; // storage blocked or corrupted: start empty
    }
}

function persistSaved() {
    try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(savedStories));
    } catch (e) {
        /* storage full or blocked: saving just won't last */
    }
}

function isSaved(url) {
    return savedStories.some((s) => s.url === url);
}

// Save or un-save a story. Returns true if it is saved afterwards.
function toggleSaved(url) {
    if (isSaved(url)) {
        savedStories = savedStories.filter((s) => s.url !== url);
        persistSaved();
        return false;
    }
    const story = currentNews.find((s) => s.url === url);
    if (!story) return false;
    savedStories = [
        {
            url: story.url,
            title: story.title,
            summary: story.summary,
            source: story.source,
            category: story.category,
            published: story.published,
        },
        ...savedStories,
    ].slice(0, MAX_SAVED);
    persistSaved();
    return true;
}

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

/* ---------- near-duplicate stories ----------
   Sites often publish the same story many times (four Hisense TV reviews that differ
   only by screen size, six stories about the same headphones...).
   We compare the important words in the headlines and keep only the newest of each group. */
const FILLER_WORDS = new Set(
    ('the a an and or of to in on for with is are was were be by at as it its this that from new ' +
        'after over into your you how why what who will can has have just now more than but not out ' +
        'all get gets says say first one two best review reviews about their they them our his her ' +
        'here there when where which while also like so if').split(' ')
);

// The meaningful words of a headline (no filler, no numbers, "headphones" = "headphone")
function headlineWords(title) {
    const words = (title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
    const set = new Set();
    words.forEach((word) => {
        if (word.length < 3 || /^[0-9]+$/.test(word) || FILLER_WORDS.has(word)) return;
        set.add(word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word);
    });
    return set;
}

function sameStory(a, b) {
    let shared = 0;
    a.forEach((word) => {
        if (b.has(word)) shared++;
    });
    const smaller = Math.min(a.size, b.size);
    const total = a.size + b.size - shared;
    return (shared >= 3 && shared / smaller >= 0.3) || (shared >= 2 && shared / total >= 0.6);
}

// Newest first, then drop any story that repeats one we already kept
function removeDuplicates(items) {
    const newestFirst = [...items].sort(
        (x, y) => (new Date(y.published).getTime() || 0) - (new Date(x.published).getTime() || 0)
    );
    const kept = [];
    newestFirst.forEach((item) => {
        const words = headlineWords(item.title);
        if (!kept.some((other) => sameStory(other.words, words))) {
            kept.push({ item, words });
        }
    });
    return kept.map((entry) => entry.item);
}

// Raw API articles -> clean objects the cards can use (off-topic stories are dropped here)
function prepareArticles(articles) {
    const clean = articles
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
                published: a.publishedAt || '',
            };
        })
        .filter((item) => item.category);

    return removeDuplicates(clean);
}

// Draws a pixel icon from a list of rows (colored by the surrounding text color)
function makeIcon(rows, className) {
    const ns = 'http://www.w3.org/2000/svg';
    const width = Math.max(...rows.map((row) => row.length));
    const xOffset = Math.floor((12 - width) / 2);
    const yOffset = Math.floor((12 - rows.length) / 2);
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.setAttribute('class', className);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('aria-hidden', 'true');
    rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            if (row[x] !== '#') continue;
            const rect = document.createElementNS(ns, 'rect');
            rect.setAttribute('x', x + xOffset);
            rect.setAttribute('y', y + yOffset);
            rect.setAttribute('width', 1);
            rect.setAttribute('height', 1);
            rect.setAttribute('fill', 'currentColor');
            svg.appendChild(rect);
        }
    });
    return svg;
}

/* ---------- search ---------- */

function matchesSearch(item) {
    const haystack = `${item.title} ${item.summary} ${item.source} ${item.category}`.toLowerCase();
    return searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => haystack.includes(term));
}

function getVisibleStories() {
    let list;
    if (activeCategory === 'SAVED') list = savedStories;
    else if (activeCategory === 'ALL') list = currentNews;
    else list = currentNews.filter((item) => item.category === activeCategory);
    return searchQuery ? list.filter(matchesSearch) : list;
}

/* ---------- rendering ---------- */

function makeSaveButton(url) {
    const saved = isSaved(url);
    const button = el('button', saved ? 'save-button is-saved' : 'save-button');
    button.type = 'button';
    button.dataset.url = url;
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', saved ? 'Remove from saved' : 'Save story');
    button.title = saved ? 'Remove from saved' : 'Save story';
    button.appendChild(makeIcon(saved ? HEART_FILLED : HEART_OUTLINE, 'save-icon'));
    return button;
}

function renderEmpty(title, message) {
    const card = el('div', 'pixel-card col-span-full empty-card');
    card.appendChild(el('h3', 'pixel-font text-xl mb-4', title));
    if (message) card.appendChild(el('p', 'text-base', message));
    newsContainer.appendChild(card);
}

function buildCard(item, index, featured) {
    const card = el('div', featured ? 'pixel-card news-card featured-card col-span-full' : 'pixel-card news-card');
    if (item.id) card.id = item.id;
    card.style.setProperty('--i', Math.min(index, 8)); // longest fade-in delay is about 0.3 seconds

    const meta = el('div', 'card-meta');
    const tags = el('div', 'card-tags');
    if (featured) tags.appendChild(el('span', 'featured-badge', 'Top story'));
    tags.appendChild(el('span', 'category-tag', item.category));
    meta.appendChild(tags);
    const right = el('div', 'card-meta-right');
    right.appendChild(el('span', 'time-ago', timeAgo(item.published)));
    right.appendChild(makeSaveButton(item.url));
    meta.appendChild(right);
    card.appendChild(meta);

    const titleClass = featured
        ? 'pixel-font mb-4 text-left featured-title'
        : 'text-xl md:text-2xl pixel-font mb-4 text-left';
    card.appendChild(el('h3', titleClass, item.title));

    if (item.summary) {
        card.appendChild(el('p', 'text-base text-left mb-4', item.summary));
    }

    const footer = el('div', 'card-footer mt-auto');
    footer.appendChild(el('span', 'card-source', item.source ? `VIA ${item.source}` : ''));
    const button = el('button', 'text-sm pixel-button read-more-button', 'Read More');
    button.dataset.newsUrl = item.url;
    footer.appendChild(button);
    card.appendChild(footer);
    return card;
}

function renderNews(newsData, animate, withFeatured) {
    newsContainer.innerHTML = '';
    newsContainer.classList.toggle('no-anim', !animate);
    restList = [];
    shownCount = 0;

    if (newsData.length === 0) {
        if (searchQuery) {
            renderEmpty('No results', `Nothing matches "${searchQuery}". Try another word.`);
        } else if (activeCategory === 'SAVED') {
            renderEmpty('Nothing saved yet', 'Tap the heart on any story to keep it here.');
        } else {
            renderEmpty('No news available at the moment.');
        }
        return;
    }

    restList = newsData;
    if (withFeatured) {
        // the newest story that has a summary becomes the big top story
        const top = newsData.find((item) => item.summary) || newsData[0];
        restList = newsData.filter((item) => item !== top);
        newsContainer.appendChild(buildCard(top, 0, true));
    }
    appendCards(PAGE_SIZE);
}

// Adds the next batch of cards, then the LOAD MORE button if stories are left
function appendCards(count) {
    const batch = restList.slice(shownCount, shownCount + count);
    batch.forEach((item, index) => {
        newsContainer.appendChild(buildCard(item, index + 1, false));
    });
    shownCount += batch.length;
    updateLoadMore();
}

function updateLoadMore() {
    const old = newsContainer.querySelector('.load-more');
    if (old) old.remove();

    const left = restList.length - shownCount;
    if (left <= 0) return;

    const wrap = el('div', 'load-more');
    const button = el('button', 'pixel-button load-more-button');
    button.type = 'button';
    button.appendChild(document.createTextNode('Load more'));
    button.appendChild(el('span', 'load-more-count', `${left} left`));
    wrap.appendChild(button);
    newsContainer.appendChild(wrap);
}

// The row of category buttons (ALL, AI, GAMING...) with an icon and a count on each
function renderFilterBar() {
    filterBar.innerHTML = '';
    filterBar.appendChild(el('p', 'filter-label', 'Select channel'));
    const row = el('div', 'filter-buttons');

    FILTER_ORDER.forEach((category) => {
        let count;
        if (category === 'ALL') count = currentNews.length;
        else if (category === 'SAVED') count = savedStories.length;
        else count = currentNews.filter((item) => item.category === category).length;

        // no empty category buttons (ALL and SAVED always show)
        if (count === 0 && category !== 'ALL' && category !== 'SAVED') return;

        const isActive = category === activeCategory;
        const button = el('button', isActive ? 'filter-button is-active' : 'filter-button');
        button.type = 'button';
        button.dataset.category = category;
        button.setAttribute('aria-pressed', String(isActive));
        button.appendChild(makeIcon(CATEGORY_ICONS[category] || CATEGORY_ICONS.ALL, 'filter-icon'));
        button.appendChild(el('span', 'filter-name', category));
        button.appendChild(el('span', 'filter-count', String(count)));
        row.appendChild(button);
    });

    filterBar.appendChild(row);
    filterBar.hidden = false;
}

// Draw the filter buttons, the search bar and the cards
function showCurrent(animate = true) {
    if (
        activeCategory !== 'ALL' &&
        activeCategory !== 'SAVED' &&
        !currentNews.some((item) => item.category === activeCategory)
    ) {
        activeCategory = 'ALL';
    }
    renderFilterBar();
    searchBar.hidden = false;

    const list = getVisibleStories();
    searchStatus.textContent = searchQuery
        ? `${list.length} ${list.length === 1 ? 'MATCH' : 'MATCHES'}`
        : '';
    searchClear.hidden = !searchQuery;
    const withFeatured = activeCategory === 'ALL' && !searchQuery && list.length >= 4;
    renderNews(list, animate, withFeatured);
}

function showLoading() {
    filterBar.hidden = true;
    searchBar.hidden = true;
    newsContainer.innerHTML = '';
    const card = el('div', 'pixel-card flex justify-center items-center h-48 col-span-full');
    card.appendChild(el('p', 'pixel-font text-lg blink', 'Loading news'));
    newsContainer.appendChild(card);
}

function showError(message) {
    filterBar.hidden = true;
    searchBar.hidden = true;
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
    const saveButton = event.target.closest('.save-button');
    if (saveButton) {
        toggleSaved(saveButton.dataset.url);
        if (activeCategory === 'SAVED') {
            showCurrent(false); // the story leaves the saved list right away
        } else {
            const fresh = makeSaveButton(saveButton.dataset.url);
            saveButton.replaceWith(fresh);
            renderFilterBar(); // updates the SAVED count
        }
        return;
    }

    const readMore = event.target.closest('.read-more-button');
    if (readMore) {
        window.open(readMore.dataset.newsUrl, '_blank', 'noopener');
        return;
    }
    if (event.target.closest('.load-more-button')) {
        newsContainer.classList.remove('no-anim'); // new cards fade in
        appendCards(PAGE_SIZE);
        const next = newsContainer.querySelector('.load-more-button');
        if (next) next.focus({ preventScroll: true });
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

searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    showCurrent(false); // no flicker while typing
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearSearch();
});

searchClear.addEventListener('click', () => {
    clearSearch();
    searchInput.focus();
});

function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    if (hasRendered) showCurrent(false);
}

// The logo in index.html calls this (module scripts need it on window)
window.showAllNews = function () {
    activeCategory = 'ALL';
    searchInput.value = '';
    searchQuery = '';
    if (hasRendered) showCurrent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ---------- night mode ---------- */

function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function renderThemeToggle() {
    const isDark = currentTheme() === 'dark';
    themeToggle.innerHTML = '';
    themeToggle.appendChild(makeIcon(isDark ? SUN_ICON : MOON_ICON, 'theme-icon'));
    themeToggle.appendChild(el('span', 'theme-label', isDark ? 'Day' : 'Night'));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to day mode' : 'Switch to night mode');
}

themeToggle.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
        localStorage.setItem(THEME_KEY, next);
    } catch (e) {
        /* storage blocked: the choice just won't be remembered */
    }
    renderThemeToggle();
});

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
            const firstDraw = !hasRendered;
            const alreadyShown = shownCount;
            currentNews = articles;
            hasRendered = true;
            showCurrent(firstDraw);
            // if the reader had pressed LOAD MORE, keep those cards on screen
            if (!firstDraw && alreadyShown > PAGE_SIZE) appendCards(alreadyShown - PAGE_SIZE);
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
    renderThemeToggle();
    fetchNews();
    setInterval(fetchNews, REFRESH_MS);
});