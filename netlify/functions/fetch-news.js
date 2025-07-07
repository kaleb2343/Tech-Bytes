// netlify/fetch-news.js
const { API_KEY } = process.env; // This securely gets your API key from Netlify

exports.handler = async function(event, context) {
    const NEWS_URL = `https://newsapi.org/v2/top-headlines?country=us&category=technology&pageSize=10&apiKey=${API_KEY}`;

    try {
        const response = await fetch(NEWS_URL);
        const data = await response.json();

        // If NewsAPI gives an error (like 426), we pass that error back
        if (!response.ok) {
            const errorMessage = data.message || `HTTP error! status: ${response.status}`;
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorMessage }),
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*", // Allows your website to get the data
                },
            };
        }

        // If everything is good, send the news data back to your website
        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Allows your website to get the data
            },
        };
    } catch (error) {
        // If something goes wrong in this function, send a general error
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch news from API." }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        };
    }
};