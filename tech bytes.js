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
        summary: "A new quantum processor promises exponential leaps in computational power.",
        detail: "Scientists have announced a significant breakthrough in quantum computing, developing a new processor that can perform calculations exponentially faster than traditional supercomputers. This advancement brings us closer to solving complex problems in fields like materials science, cryptography, and drug discovery. The new quantum chip, developed by 'Quantum Innovations Inc.', utilizes entangled qubits to achieve unparalleled processing speeds, opening doors to previously unimaginable computational feats. Experts predict this could lead to a new era of technological innovation.",
        url: "#"
    },
    {
        id: 'news-3',
        title: "Sustainable Energy Grid Achieves Milestone",
        summary: "A major city now runs entirely on renewable energy, setting a global precedent.",
        detail: "The city of Greenhaven has officially announced that its entire energy grid is now powered exclusively by renewable sources, marking a historic milestone in the global transition to sustainable energy. Through a combination of massive solar farms, wind turbines, and advanced geothermal plants, Greenhaven has eliminated its reliance on fossil fuels. This achievement demonstrates the feasibility of large-scale renewable energy integration and provides a powerful blueprint for other urban centers worldwide. The project also involved significant investments in smart grid technology and energy storage solutions.",
        url: "#"
    },
    {
        id: 'news-4',
        title: "Advances in Virtual Reality for Education",
        summary: "VR technology is transforming classrooms, offering immersive learning experiences.",
        detail: "Virtual Reality (VR) technology is rapidly becoming a game-changer in education, offering students immersive and interactive learning experiences previously unimaginable. New VR platforms are allowing students to explore ancient civilizations, conduct virtual science experiments, and dissect virtual organisms in lifelike 3D environments. This hands-on approach is proving to be highly engaging and effective, boosting retention rates and fostering a deeper understanding of complex subjects. Educators are excited about the potential of VR to democratize access to high-quality, experiential learning.",
        url: "#"
    },
    {
        id: 'news-5',
        title: "Cybersecurity Threats Evolve, New Defenses Emerge",
        summary: "Researchers are developing adaptive AI-powered defenses against sophisticated cyber attacks.",
        detail: "As cyber threats grow increasingly sophisticated, cybersecurity experts are racing to develop advanced defenses. A new report highlights the emergence of adaptive, AI-powered cybersecurity systems capable of detecting and neutralizing novel threats in real-time. These systems learn from attack patterns and continuously evolve their defenses, offering a robust shield against ransomware, phishing, and zero-day exploits. The focus is shifting from reactive measures to proactive, intelligent defense mechanisms that can anticipate and mitigate risks before they cause significant damage.",
        url: "#"
    },
    {
        id: 'news-6',
        title: "Space Tourism Takes Off",
        summary: "Private companies are making space travel a reality for civilians.",
        detail: "The dream of space tourism is rapidly becoming a reality as private aerospace companies successfully launch civilians into suborbital and even orbital flights. With advanced spacecraft designs and rigorous safety protocols, companies like 'AstraVoyage' and 'Cosmic Adventures' are opening up the final frontier to a new class of explorers. While still exclusive, the industry is projected to grow significantly, potentially leading to more affordable and frequent space travel opportunities in the coming decades. This marks a new era of human exploration beyond Earth.",
        url: "#"
    }
];

// Function to display news cards
function displayNews(newsData) {
    newsContainer.innerHTML = ''; // Clear previous content
    newsContainer.classList.remove('detailed-view-active'); // Remove detailed view styling
    newsContainer.style.display = 'grid'; // Ensure grid display for multiple cards
    backButtonContainer.classList.add('hidden'); // Hide the back button by default

    newsData.forEach(newsItem => {
        const newsCard = document.createElement('div');
        newsCard.id = newsItem.id;
        newsCard.classList.add('pixel-card', 'p-4', 'md:p-6', 'cursor-pointer', 'hover:bg-[#B7C7A8]', 'transition', 'duration-300');
        newsCard.innerHTML = `
            <h3 class="text-xl md:text-2xl pixel-font mb-4">${newsItem.title}</h3>
            <p class="text-sm md:text-base">${newsItem.summary}</p>
        `;
        newsCard.addEventListener('click', () => showNewsDetail(newsItem.id));
        newsContainer.appendChild(newsCard);
    });
}

// Function to show detailed news view
function showNewsDetail(newsId) {
    const allNewsCards = newsContainer.querySelectorAll('.pixel-card');
    let selectedNewsItem = null;

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
document.addEventListener('DOMContentLoaded', () => {
    showAllNews(); // Call showAllNews to display initial placeholder data

    // Mobile menu event listeners
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.remove('hidden');
    });
    closeMobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });

    // New Go Back link functionality
    const goBackLink = document.getElementById('go-back-link');
    if (goBackLink) {
        goBackLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevents the browser from trying to navigate to '#'
            history.back(); // Navigates to the previous page in the browser's history
            mobileMenu.classList.add('hidden'); // Close the mobile menu after clicking Go Back
        });
    }
});