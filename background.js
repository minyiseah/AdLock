// background.js
try {
    importScripts('config.js');
} catch (e) {
    console.error("Could not load config.js", e);
}
// Roasting Logic
const MOCK_ROASTS = [
    "Oh look, reading [Title] instead of working. Classic.",
    "Wow, [Title]? Your ambition is truly whelming.",
    "I'm sure [Title] will help you pay the bills.",
    "Imagine being this distracted by [Title].",
    "Your future self is crying looking at you browse [Title]."
];

async function listAvailableModels() {
    const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
    console.log("Attempting to list available models...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("--- AVAILABLE GEMINI MODELS ---");
        if (data.models) {
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Failed to list models:", error);
    }
}

let apiCallCount = 0;
let lastResetTime = Date.now();
let offscreenCreating = null;

// background.js
async function generateContextualContent(pageTitle) {
    const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
    // 1. Fallback if no title exists
    if (!pageTitle) pageTitle = "a mystery website";

    // Rate Limit Check (5 calls per minute)
    const now = Date.now();
    if (now - lastResetTime > 60000) {
        apiCallCount = 0;
        lastResetTime = now;
    }
    if (apiCallCount >= 5) {
        return null;
    }
    apiCallCount++;

    // 2. Construct the prompt
    const prompt = `You are a sarcastic productivity bot. A user is procrastinating by visiting "${pageTitle}". 
    Return a valid JSON object (no markdown formatting) with the following keys:
    - "roast": A brutal, short (1 sentence) roast about why they should be working instead of visiting this site.
    - "ads": An array of 5 short, funny, fake ad headlines related to this site's content.
    - "messages": An array of 5 short, snarky popup warnings about wasting time on this specific site.`;

    try {
        // 3. Call the API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            }
        );

        // 4. Parse the result
        const data = await response.json();

        // Safety check: sometimes the API blocks content if it's too "mean" (Safety Settings).
        if (data.candidates && data.candidates[0].content) {
            let text = data.candidates[0].content.parts[0].text;
            // Clean up markdown code blocks if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Extract JSON object if surrounded by other text
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
            return JSON.parse(text);
        } else {
            console.error("Gemini API Failure - No candidates returned. Response:", JSON.stringify(data, null, 2));
            await listAvailableModels();
        }
    } catch (error) {
        console.error("API Error:", error);
    }

    // Return null to trigger fallback in caller
    return null;
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
            const content = await generateContextualContent(tab.title);
            if (content) {
                chrome.tabs.sendMessage(tabId, { action: "UPDATE_CONTENT", data: content }).catch(() => { });
            } else {
                // Fallback roast if API fails
                console.error("❌ AI Roast Failed for:", tab.title, "- Switching to fallback.");
                const roast = MOCK_ROASTS[Math.floor(Math.random() * MOCK_ROASTS.length)].replace("[Title]", tab.title);
                chrome.tabs.sendMessage(tabId, { action: "ROAST", text: roast }).catch(() => { });
            }
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

async function ensureOffscreen() {
    if (await chrome.offscreen.hasDocument()) return;
    if (offscreenCreating) {
        await offscreenCreating;
        return;
    }
    offscreenCreating = chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Play notification sounds for annoyance mode."
    });
    await offscreenCreating;
    offscreenCreating = null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action === "PLAY_SOUND") {
        ensureOffscreen().then(() => {
            chrome.runtime.sendMessage({ action: "OFFSCREEN_PLAY", file: message.file });
        }).catch(() => { });
    }
});
