// Tech Bytes - main script (step 2: cleanup and life)

const newsContainer = document.getElementById('news-container');

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

let currentNews = [];
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

// Raw API articles -> clean objects the cards can use
function prepareArticles(articles) {
    return articles
        .filter((a) => a && a.title && a.url && /^https?:\/\//i.test(a.url))
        .filter((a) => !isBlocked(a))
        .map((a, index) => {
            const source = (a.source && a.source.name) || '';
            const title = cleanTitle(a.title, source);
            return {
                id: `news-${index}`,
                title,
                summary: cleanSummary(a.description, title, source),
                url: a.url,
                source: source.toUpperCase(),
                time: timeAgo(a.publishedAt),
            };
        });
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
        meta.appendChild(el('span', 'source-tag', item.source || 'TECH'));
        meta.appendChild(el('span', 'time-ago', item.time));
        card.appendChild(meta);

        card.appendChild(el('h3', 'text-xl md:text-2xl pixel-font mb-4 text-left', item.title));

        if (item.summary) {
            card.appendChild(el('p', 'text-base text-left mb-4', item.summary));
        }

        const footer = el('div', 'mt-auto text-right');
        const button = el('button', 'text-sm pixel-button read-more-button', 'Read More');
        button.dataset.newsUrl = item.url;
        footer.appendChild(button);
        card.appendChild(footer);

        newsContainer.appendChild(card);
    });
}

function showLoading() {
    newsContainer.innerHTML = '';
    const card = el('div', 'pixel-card flex justify-center items-center h-48 col-span-full');
    card.appendChild(el('p', 'pixel-font text-lg blink', 'Loading news'));
    newsContainer.appendChild(card);
}

function showError(message) {
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

// The logo in index.html calls this (module scripts need it on window)
window.showAllNews = function () {
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
            renderNews(currentNews);
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