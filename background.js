// background.js

// Initialize score
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ productivityScore: 1000 });
});

let pointInterval;

// Manage point accumulation based on session state
function handleSessionState() {
    chrome.storage.sync.get(['sessionActive', 'sessionEnd'], (result) => {
        if (result.sessionActive && Date.now() < result.sessionEnd) {
            if (!pointInterval) {
                pointInterval = setInterval(() => {
                    chrome.storage.local.get(['productivityScore'], (res) => {
                        const newScore = (res.productivityScore || 1000) + 10;
                        chrome.storage.local.set({ productivityScore: newScore });
                    });
                }, 60000); // Every minute
            }
        } else {
            if (pointInterval) {
                clearInterval(pointInterval);
                pointInterval = null;
            }
        }
    });
}

// Listen for session changes to start/stop point accumulation
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.sessionActive || changes.sessionEnd)) {
        handleSessionState();
    }
});

// Initial check on load
handleSessionState();

// Roasting Logic
const MOCK_ROASTS = [
    "Oh look, reading [Title] instead of working. Classic.",
    "Wow, [Title]? Your ambition is truly whelming.",
    "I'm sure [Title] will help you pay the bills.",
    "Imagine being this distracted by [Title].",
    "Your future self is crying looking at you browse [Title]."
];

async function generateRoast(pageTitle) {
    // TODO: Integrate with Gemini API here
    // const response = await fetch('https://api.google.com/gemini...', { ... });
    // const roast = await response.json();

    const template = MOCK_ROASTS[Math.floor(Math.random() * MOCK_ROASTS.length)];
    return template.replace("[Title]", pageTitle || "this garbage");
}

const DEFAULT_BLACKLIST = [
    "reddit.com",
    "twitter.com",
    "x.com",
    "youtube.com"
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        chrome.storage.sync.get(['blacklist', 'sessionActive', 'sessionEnd'], async (result) => {
            if (!result.sessionActive || Date.now() > result.sessionEnd) return;

            const blacklist = result.blacklist || DEFAULT_BLACKLIST;
            const url = new URL(tab.url);
            const hostname = url.hostname;

            // Check if site is blacklisted
            const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));

            if (isBlacklisted) {
                // Deduct points
                chrome.storage.local.get(['productivityScore'], (res) => {
                    const newScore = (res.productivityScore || 1000) - 100;
                    chrome.storage.local.set({ productivityScore: newScore });
                });

                // Generate and send roast
                const roast = await generateRoast(tab.title);
                chrome.tabs.sendMessage(tabId, { action: "ROAST", text: roast }).catch(() => { });
            }
        });
    }
});