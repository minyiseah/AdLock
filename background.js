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
    const OPENAI_API_KEY = CONFIG.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is missing. Set it in config.js to list models.");
        return;
    }
    console.log("Attempting to list available OpenAI models...");
    try {
        const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            }
        });
        const data = await response.json();
        console.log("--- AVAILABLE OPENAI MODELS ---");
        if (data.data) {
            data.data.forEach(m => console.log(m.id));
        } else {
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Failed to list OpenAI models:", error);
    }
}

let apiCallCount = 0;
let lastResetTime = Date.now();
let lastApiResult = null;
let lastApiResultTime = 0;
let offscreenCreating = null;

// background.js
async function generateContextualContent(pageTitle) {
    const OPENAI_API_KEY = CONFIG.OPENAI_API_KEY;
    // 1. Fallback if no title exists
    if (!pageTitle) pageTitle = "a mystery website";
    if (!OPENAI_API_KEY) {
        console.error("Missing OPENAI_API_KEY in config.js");
        return null;
    }

    // Rate Limit Check (1 call per minute to keep usage low)
    const now = Date.now();
    if (now - lastResetTime > 60000) {
        apiCallCount = 0;
        lastResetTime = now;
    }
    if (apiCallCount >= 1) {
        if (lastApiResult && (now - lastApiResultTime) <= 60000) {
            console.warn("Rate limit hit; reusing last AI payload.");
            return lastApiResult;
        }
        console.warn("Rate limit hit and no cached payload available.");
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
        console.log("[OpenAI] Dispatching request for:", pageTitle, "at", new Date(now).toISOString());

        // 3. Call the API
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    temperature: 0.7,
                    max_tokens: 300,
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "adon_payload",
                            schema: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    roast: { type: "string" },
                                    ads: {
                                        type: "array",
                                        items: { type: "string" },
                                        minItems: 5,
                                        maxItems: 5
                                    },
                                    messages: {
                                        type: "array",
                                        items: { type: "string" },
                                        minItems: 5,
                                        maxItems: 5
                                    }
                                },
                                required: ["roast", "ads", "messages"]
                            }
                        }
                    },
                    messages: [
                        {
                            role: "system",
                            content: "You are a sarcastic productivity bot that only responds with raw minified JSON."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const body = await response.text();
            console.error("OpenAI HTTP error:", response.status, response.statusText, body);
            return null;
        }

        // 4. Parse the result
        const data = await response.json();
        console.log("[OpenAI] Received response:", {
            status: response.status,
            model: data.model,
            usage: data.usage
        });

        if (data.choices && data.choices[0].message && data.choices[0].message.content) {
            let text = data.choices[0].message.content.trim();
            // Clean up markdown code blocks if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Extract JSON object if surrounded by other text
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (parseError) {
                console.error("Failed to parse OpenAI response:", parseError, "raw:", text);
                return null;
            }
            lastApiResult = parsed;
            lastApiResultTime = Date.now();
            return parsed;
        } else {
            console.error("OpenAI API failure - No choices returned. Response:", JSON.stringify(data, null, 2));
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
