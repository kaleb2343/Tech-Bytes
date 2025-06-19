const newsContainer = document.getElementById('news-container');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const closeMobileMenuButton = document.getElementById('close-mobile-menu');
const mobileMenu = document.getElementById('mobile-menu');
const backButtonContainer = document.getElementById('back-button-container');
const backToAllNewsButton = document.getElementById('back-to-all-news-button');

// Placeholder news data with expanded detail
const placeholderNews = [
    {
        id: 'news-1',
        title: "AI Breakthrough in Healthcare",
        summary: "Researchers have developed a new AI model that significantly improves early disease detection.",
        detail: "In a groundbreaking development, scientists at Nexus Labs have unveiled an advanced AI algorithm capable of identifying subtle biomarkers for several chronic diseases with unprecedented accuracy. This new model, named 'HealthPredict AI', leverages deep learning techniques to analyze vast datasets of patient records, medical images, and genetic information. Early trials show a 95% success rate in detecting conditions like early-stage cancer and neurodegenerative disorders years before conventional diagnostic methods. This could revolutionize preventative medicine and personalized treatment plans.",
        url: "#"
    },
    {
        id: 'news-2',
        title: "Quantum Computing Leaps Forward",
        summary: "A new quantum processor promises exponential speed increases for complex calculations.",
        detail: "Quantum Computing Corp. today announced the successful development of their 'Quasar' processor, featuring 128 stable qubits. This breakthrough significantly addresses the coherence issue that has plagued quantum computing, allowing for more reliable and longer computations. The Quasar processor is expected to unlock new possibilities in drug discovery, material science, and cryptography, solving problems that are currently intractable for even the most powerful supercomputers. Initial benchmarks demonstrate a computational speed-up of several orders of magnitude over classical algorithms for specific tasks.",
        url: "#"
    },
    {
        id: 'news-4',
        title: "Cybersecurity in the Age of AI",
        summary: "New AI-powered tools are emerging to combat sophisticated cyber threats, but also pose new risks.",
        detail: "The arms race in cybersecurity is intensifying with the advent of AI. While AI is being deployed to create highly intelligent defense systems capable of detecting zero-day exploits and polymorphic malware, malicious actors are also leveraging AI to craft more sophisticated phishing attacks and automated hacking tools. Experts warn that the future of cybersecurity will be a constant cat-and-mouse game between defensive and offensive AI systems, requiring continuous innovation and adaptive strategies from organizations to protect their digital assets.",
        url: "#"
    },
    {
        id: 'news-5',
        title: "The Rise of Augmented Reality Workspaces",
        summary: "AR technology is moving beyond entertainment to enhance productivity in professional settings.",
        detail: "Augmented Reality (AR) is poised to transform how we work, moving from novelties to essential productivity tools. Companies are developing AR headsets and applications that overlay virtual workspaces onto the real world, allowing users to interact with multiple virtual screens, 3D models, and collaborative environments without physical limitations. This promises to reduce desk clutter, improve remote collaboration, and provide immersive data visualization, particularly beneficial for architects, engineers, and designers. Early prototypes are already being tested in corporate environments, showing significant potential for efficiency gains.",
        url: "#"
    },
    {
        id: 'news-6',
        title: "Future of Personal Robotics",
        summary: "Robotics is advancing rapidly, with increasingly intelligent and versatile personal assistant robots on the horizon.",
        detail: "The next generation of personal robots is expected to integrate seamlessly into daily life, performing a wider array of tasks than ever before. Driven by improvements in AI, machine learning, and sensor technology, these robots will be capable of complex household chores, personalized elder care, and even emotional support. Companies like HomeBotics Inc. are developing models with advanced manipulation capabilities and natural language processing, making them more intuitive and adaptable to human needs. Ethical considerations around autonomy and privacy are also a growing area of discussion as these technologies mature.",
        url: "#"
    }
];

// Function to display news cards
function displayNews(newsData) {
    newsContainer.innerHTML = ''; // Clear previous news
    newsContainer.classList.remove('detailed-view-active'); // Reset grid for multiple cards
    newsContainer.style.display = 'grid'; // Ensure grid display for multiple cards

    if (newsData.length === 0) {
        newsContainer.innerHTML = `
            <div class="pixel-card col-span-full text-center">
                <p class="pixel-font">No news available at the moment.</p>
            </div>
        `;
        return;
    }

    newsData.forEach((item) => {
        const newsCard = document.createElement('div');
        newsCard.classList.add('pixel-card');
        newsCard.id = item.id; // Assign unique ID
        newsCard.innerHTML = `
            <h3 class="text-xl md:text-2xl pixel-font mb-4 text-left">${item.title}</h3>
            <p class="text-base text-left mb-4">${item.summary}</p>
            <div class="mt-auto text-right">
                <button class="text-sm pixel-button read-more-button" data-news-id="${item.id}">Read More</button>
            </div>
        `;
        newsContainer.appendChild(newsCard);
    });

    // Attach event listeners to all new "Read More" buttons
    document.querySelectorAll('.read-more-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const newsId = event.target.dataset.newsId;
            showDetailedNews(newsId);
        });
    });

    // Hide the back button
    backButtonContainer.classList.add('hidden');
}

// Function to show detailed news view
function showDetailedNews(newsId) {
    const allNewsCards = document.querySelectorAll('.pixel-card');
    let selectedNewsItem = null;

    // Hide all cards except the selected one
    allNewsCards.forEach(card => {
        if (card.id !== newsId) {
            card.classList.add('hidden');
        } else {
            selectedNewsItem = placeholderNews.find(item => item.id === newsId);
            card.classList.add('detailed-view'); // Add styling for bigger view
            card.innerHTML = `
                <h3 class="text-3xl md:text-4xl pixel-font mb-6 text-left">${selectedNewsItem.title}</h3>
                <p class="text-lg text-left mb-8">${selectedNewsItem.detail}</p>
                `;
        }
    });

    newsContainer.classList.add('detailed-view-active'); // Add a class to parent for overall layout change if needed
    newsContainer.style.display = 'block'; // Change from grid to block for single detailed view

    // Show the back button
    backButtonContainer.classList.remove('hidden');
}

// Function to go back to all news cards
function showAllNews() {
    displayNews(placeholderNews); // Re-display all cards
}

// Event listener for the "Back to All News" button
backToAllNewsButton.addEventListener('click', showAllNews);

// Fetch news when the page loads
document.addEventListener('DOMContentLoaded', showAllNews); // Call showAllNews to display initial placeholder data

// Mobile menu event listeners
mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.remove('hidden');
});

closeMobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
});