const newsContainer = document.getElementById('news-container');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const closeMobileMenuButton = document.getElementById('close-mobile-menu');
const mobileMenu = document.getElementById('mobile-menu');
const backButtonContainer = document.getElementById('back-button-container');
const backToAllNewsButton = document.getElementById('back-to-all-news-button');

// Placeholder news data
const placeholderNews = [
    {
        id: '1',
        title: 'Quantum Computing Breakthrough Unlocked',
        summary: 'Scientists at CERN announce a major leap in quantum entanglement, promising revolutionary changes.',
        detail: 'In a groundbreaking experiment conducted deep underground, researchers have successfully maintained quantum entanglement across unprecedented distances, opening doors for ultra-secure communication and powerful new computing paradigms. The implications for cryptography and AI are immense, potentially rendering current security protocols obsolete and accelerating machine learning algorithms to unimaginable speeds. Experts are calling this a "paradigm shift" in the field.',
        url: 'https://example.com/quantum-computing'
    },
    {
        id: '2',
        title: 'AI Ethics Debate Heats Up in Senate Hearing',
        summary: 'Lawmakers question leading AI developers on the moral implications of advanced artificial intelligence.',
        detail: 'A heated debate unfolded on Capitol Hill today as senators grilled top executives from major AI development firms. Discussions centered on the potential for job displacement, bias in algorithms, and the long-term societal impact of increasingly autonomous AI systems. Advocates stressed the need for robust regulatory frameworks, while developers urged for flexibility to foster innovation. No concrete legislation was proposed, but the discussion highlighted growing concerns.',
        url: 'https://example.com/ai-ethics'
    },
    {
        id: '3',
        title: 'New Wearable Tech Monitors Health in Real-Time',
        summary: 'A startup unveils a discreet device capable of continuously tracking vital signs with clinical accuracy.',
        detail: 'Health tech is taking a giant leap forward with the introduction of "Bio-Band," a revolutionary new wearable that offers continuous, clinical-grade monitoring of heart rate, blood pressure, oxygen saturation, and even glucose levels. Designed to be unobtrusive, the device seamlessly integrates into daily life, providing early warnings for potential health issues and empowering individuals with unprecedented insight into their well-being. Pilot programs are set to begin next quarter.',
        url: 'https://example.com/wearable-tech'
    },
    {
        id: '4',
        title: 'Next-Gen Batteries Promise Longer EV Range',
        summary: 'Breakthrough in solid-state battery technology could double electric vehicle driving distances.',
        detail: 'Engineers have announced a significant advancement in solid-state battery technology, promising to dramatically increase the range and reduce charging times for electric vehicles. The new prototypes demonstrate higher energy density and improved safety compared to current lithium-ion batteries. This innovation could eliminate range anxiety, making EVs a more viable option for long-distance travel and accelerating the global transition to sustainable transportation.',
        url: 'https://example.com/ev-batteries'
    },
    {
        id: '5',
        title: 'Cybersecurity Firm Detects Global Ransomware Attack',
        summary: 'A new strain of ransomware is rapidly spreading worldwide, targeting critical infrastructure.',
        detail: 'A sophisticated new ransomware variant, dubbed "ShadowLock," has been detected spreading across global networks, primarily targeting healthcare facilities and utility providers. Cybersecurity experts are working tirelessly to develop a decryption key, urging organizations to immediately implement robust backup strategies and offline data storage. The attack underscores the escalating threat of cyber warfare and the urgent need for enhanced digital defenses.',
        url: 'https://example.com/cybersecurity'
    },
    {
        id: '6',
        title: 'Space Tourism Takes Off with First Commercial Flight',
        summary: 'A private company successfully launches its first group of tourists into sub-orbital space.',
        detail: 'The era of space tourism has officially begun as "AstraVoyage" successfully completed its inaugural commercial sub-orbital flight, carrying four private citizens to the edge of space. Passengers experienced breathtaking views of Earth and several minutes of weightlessness before returning safely. While tickets remain prohibitively expensive, the success marks a pivotal moment for commercial space travel, promising a future where space is accessible to more than just astronauts.',
        url: 'https://example.com/space-tourism'
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
            showDetailedNews(newsId, newsData); // Pass newsData to find selected item
        });
    });

    // Hide the back button
    backButtonContainer.classList.add('hidden');
}

// Global variable to store fetched news data
let currentFetchedNews = placeholderNews; // Initialize with placeholder data

// Function to show detailed news view
// Now takes newsData as argument to find the selected item
function showDetailedNews(newsId, currentNewsData) {
    const allNewsCards = document.querySelectorAll('.pixel-card');
    let selectedNewsItem = null;

    // Find the selected item from the current news data
    selectedNewsItem = currentNewsData.find(item => item.id === newsId);

    if (!selectedNewsItem) {
        console.error("News item not found for ID:", newsId);
        return;
    }

    // Hide all cards except the selected one
    allNewsCards.forEach(card => {
        if (card.id !== newsId) {
            card.classList.add('hidden');
        } else {
            card.classList.add('detailed-view'); // Add styling for bigger view
            
        }
    });

    newsContainer.classList.add('detailed-view-active'); // Add a class to parent for overall layout change if needed
    newsContainer.style.display = 'block'; // Change from grid to block for single detailed view

    // Show the back button
    backButtonContainer.classList.remove('hidden');
}

// Function to go back to all news cards
async function showAllNews() {
    displayNews(currentFetchedNews); // Re-display all cards from cached data
}

// Event listener for the "Back to All News" button
backToAllNewsButton.addEventListener('click', showAllNews);

// Initial display of news when the page loads
document.addEventListener('DOMContentLoaded', () => {
    displayNews(placeholderNews); // Display placeholder news initially
});

// Mobile menu event listeners
mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.remove('hidden');
});

closeMobileMenuMenuButton.addEventListener('click', () => { // Typo here: closeMobileMenuMenuButton
    mobileMenu.classList.add('hidden');
});