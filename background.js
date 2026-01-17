// background.js

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

function checkAndRoast(tabId, tab) {
    if (!tab.url) return;

    chrome.storage.sync.get(['blacklist', 'sessionActive', 'sessionEnd'], async (result) => {
        if (!result.sessionActive || Date.now() > result.sessionEnd) return;

        const blacklist = result.blacklist || DEFAULT_BLACKLIST;
        const url = new URL(tab.url);
        const hostname = url.hostname;

        // Check if site is blacklisted
        const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));

        if (isBlacklisted) {
            // Generate and send roast
            const roast = await generateRoast(tab.title);
            chrome.tabs.sendMessage(tabId, { action: "ROAST", text: roast }).catch(() => { });
        }
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        checkAndRoast(tabId, tab);
    }

    // Persistent Noise: Prevent muting
    if (changeInfo.mutedInfo && changeInfo.mutedInfo.muted) {
        chrome.storage.sync.get(['blacklist', 'sessionActive', 'sessionEnd'], (result) => {
            if (!result.sessionActive || Date.now() > result.sessionEnd) return;

            const blacklist = result.blacklist || DEFAULT_BLACKLIST;
            if (!tab.url) return;
            const url = new URL(tab.url);
            const hostname = url.hostname;
            const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));

            if (isBlacklisted) {
                chrome.tabs.update(tabId, { muted: false });
                chrome.tabs.sendMessage(tabId, { action: "ROAST", text: "Nice try. You can't mute your responsibilities." }).catch(() => { });
            }
        });
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) return;
        checkAndRoast(activeInfo.tabId, tab);
    });
});