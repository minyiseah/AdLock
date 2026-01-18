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

const DEFAULT_ADS = [
    "CLICK HERE TO WIN A FREE IPAD!!!",
    "HOT SINGLES IN YOUR AREA!",
    "DOWNLOAD MORE RAM NOW!",
    "EARN $5000 FROM HOME!",
    "ONE WEIRD TRICK TO LOSE BELLY FAT"
];

const DEFAULT_MESSAGES = [
    "Your boss is disappointed in you.",
    "Is this really worth your time?",
    "Go touch grass.",
    "Productivity is dropping to 0%.",
    "Why are you still here?"
];

const MAX_AD_ENTRIES = 5;
const MAX_MESSAGE_ENTRIES = 5;
const TYPE_SEQUENCE = ["roast", "ads", "messages"];
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_WINDOW = 10000;
const MAX_STUDY_PREVIEW_LENGTH = 6000;

const contentCache = new Map();
let lastApiCallTime = 0;
let lastApiContextKey = null;
let offscreenCreating = null;

// background.js
async function generateContextualContent(pageTitle, pageUrl, requestedType) {
    const OPENAI_API_KEY = CONFIG.OPENAI_API_KEY;
    if (!pageTitle) pageTitle = "a mystery website";
    if (!OPENAI_API_KEY) {
        console.error("Missing OPENAI_API_KEY in config.js");
        return null;
    }
    async function generateContextualContent(pageTitle, pageUrl) {
        const OPENAI_API_KEY = CONFIG.OPENAI_API_KEY;
        if (!pageTitle) pageTitle = "a mystery website";
        if (!OPENAI_API_KEY) {
            console.error("Missing OPENAI_API_KEY in config.js");
            return null;
        }

        const contentType = requestedType || "roast";
        const typeDescriptions = {
            roast: "a vicious one-sentence accountability roast",
            ads: "one short, funny fake ad headline",
            messages: "one short, sarcastic popup warning"
        };
        const now = Date.now();
        const prompt = `You are a sarcastic productivity enforcer. The user is procrastinating on "${pageTitle}" (${pageUrl}).
        const contentType = requestedType || "roast";
        const typeDescriptions = {
            roast: "a vicious one-sentence accountability roast",
            ads: "one short, funny fake ad headline",
            messages: "one short, sarcastic popup warning"
        };
        const now = Date.now();
        const prompt = `You are a sarcastic productivity enforcer.The user is procrastinating on "${pageTitle}"(${ pageUrl }).
Generate ${ typeDescriptions[contentType] } tailored to this exact page context and domain.Make the language more gen z or modern, less boomer.
Respond with valid JSON only: { "type": "${contentType}", "text": "..." } (no markdown).`;
        const now = Date.now();
        const prompt = `You are a sarcastic productivity enforcer.The user is procrastinating on "${pageTitle}"(${ pageUrl }).
Generate a JSON object containing:
        1. "roast": A vicious one - sentence accountability roast.
2. "ad": One short, funny fake ad headline.
3. "message": One short, sarcastic popup warning.
Make the language more gen z or modern, less boomer.
Respond with valid JSON only.`;

    try {
        console.log(`[OpenAI] Dispatching ${ contentType } request for: `, pageTitle, "at", new Date(now).toISOString());
        try {
            console.log(`[OpenAI] Dispatching ${ contentType } request for: `, pageTitle, "at", new Date(now).toISOString());
            console.log(`[OpenAI] Dispatching context request for: `, pageTitle, "at", new Date(now).toISOString());

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ OPENAI_API_KEY } `
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    temperature: 0.7,
                    max_tokens: 200,
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "adon_snippet",
                            schema: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    type: {
                                        type: "string",
                                        enum: TYPE_SEQUENCE
            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ OPENAI_API_KEY } `
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        temperature: 0.7,
                        max_tokens: 200,
                        response_format: {
                            type: "json_schema",
                            json_schema: {
                                name: "adon_snippet",
                                name: "adon_context_bundle",
                                schema: {
                                    type: "object",
                                    additionalProperties: false,
                                    properties: {
                                        type: {
                                            type: "string",
                                            enum: TYPE_SEQUENCE
                                        },
                                        text: { type: "string" }
                                    roast: { type: "string" },
                                        ad: { type: "string" },
                                        message: { type: "string" }
                                    },
                                    text: { type: "string" }
                                },
                                required: ["type", "text"]
                                    required: ["type", "text"]
                                required: ["roast", "ad", "message"]
                                }
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
        );

        if (!response.ok) {
            const body = await response.text();
            console.error("OpenAI HTTP error:", response.status, response.statusText, body);
            const data = await response.json();
            console.log("[OpenAI] Received response:", {
                status: response.status,
                model: data.model,
                usage: data.usage
            });

            if (data.choices && data.choices[0].message && data.choices[0].message.content) {
                let text = data.choices[0].message.content.trim();
                text = text.replace(/```json / g, '').replace(/```/g, '').trim();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
        }
        try {
            const parsed = JSON.parse(text);
            return parsed;
        } catch (parseError) {
            console.error("Failed to parse OpenAI response:", parseError, "raw:", text);
            return null;
        }
    } else {
        console.error("OpenAI API failure - No choices returned. Response:", JSON.stringify(data, null, 2));
        await listAvailableModels();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
        }
    } catch (error) {
        console.error("API Error:", error);
        try {
            const parsed = JSON.parse(text);
            return parsed;
        } catch (parseError) {
            console.error("Failed to parse OpenAI response:", parseError, "raw:", text);
            return null;
        }
    }

    return null;
} catch (error) {
    console.error("API Error:", error);
}
return null;

const data = await response.json();
console.log("[OpenAI] Received response:", {
    status: response.status,
    model: data.model,
    usage: data.usage
});
const DEFAULT_BLACKLIST = [
    "reddit.com",
    "twitter.com",
    "x.com",
    "youtube.com"
];

if (data.choices && data.choices[0].message && data.choices[0].message.content) {
    let text = data.choices[0].message.content.trim();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }
    try {
        const parsed = JSON.parse(text);
        return parsed;
    } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError, "raw:", text);
        return null;
    }
} else {
    console.error("OpenAI API failure - No choices returned. Response:", JSON.stringify(data, null, 2));
    await listAvailableModels();
    function getContextKey(rawUrl) {
        try {
            const url = new URL(rawUrl);
            const segments = url.pathname.split('/').filter(Boolean);
            const focus = segments.length >= 2 ? segments.slice(0, 2).join('/') : (segments[0] || 'root');
            return `${url.hostname}/${focus}`;
        } catch {
            return null;
        }
    } catch (error) {
        console.error("API Error:", error);
    }

    return null;
}
function getCacheEntry(contextKey) {
    if (!contentCache.has(contextKey)) {
        contentCache.set(contextKey, {
            roast: null,
            ads: [...DEFAULT_ADS],
            messages: [...DEFAULT_MESSAGES],
            nextTypeIndex: 0
            isDefault: true
        });
    }
    return contentCache.get(contextKey);
}

const DEFAULT_BLACKLIST = [
    "reddit.com",
    "twitter.com",
    "x.com",
    "youtube.com"
];

function getContextKey(rawUrl) {
    try {
        const url = new URL(rawUrl);
        const segments = url.pathname.split('/').filter(Boolean);
        const focus = segments.length >= 2 ? segments.slice(0, 2).join('/') : (segments[0] || 'root');
        return `${url.hostname}/${focus}`;
    } catch {
        return null;
        function chooseNextType(cacheEntry) {
            const type = TYPE_SEQUENCE[cacheEntry.nextTypeIndex] || "roast";
            cacheEntry.nextTypeIndex = (cacheEntry.nextTypeIndex + 1) % TYPE_SEQUENCE.length;
            return type;
        }
    }
    function applySnippetToCache(cacheEntry, snippet) {
        if (!snippet) return;

        function getCacheEntry(contextKey) {
            if (!contentCache.has(contextKey)) {
                contentCache.set(contextKey, {
                    roast: null,
                    ads: [...DEFAULT_ADS],
                    messages: [...DEFAULT_MESSAGES],
                    nextTypeIndex: 0
                });
                // Clear defaults on first custom load to ensure visibility
                if (cacheEntry.isDefault) {
                    cacheEntry.ads = [];
                    cacheEntry.messages = [];
                    cacheEntry.isDefault = false;
                }
                return contentCache.get(contextKey);
            }

            function chooseNextType(cacheEntry) {
                const type = TYPE_SEQUENCE[cacheEntry.nextTypeIndex] || "roast";
                cacheEntry.nextTypeIndex = (cacheEntry.nextTypeIndex + 1) % TYPE_SEQUENCE.length;
                return type;
            }

            function applySnippetToCache(cacheEntry, snippet) {
                if (!snippet || !snippet.text) return;
                if (snippet.type === "roast") {
                    cacheEntry.roast = snippet.text;
                } else if (snippet.type === "ads") {
                    cacheEntry.ads.unshift(snippet.text);
                    if (snippet.roast) cacheEntry.roast = snippet.roast;
                    if (snippet.ad) {
                        cacheEntry.ads.unshift(snippet.ad);
                        cacheEntry.ads = cacheEntry.ads.slice(0, MAX_AD_ENTRIES);
                    } else if (snippet.type === "messages") {
                        cacheEntry.messages.unshift(snippet.text);
                    }
                    if (snippet.message) {
                        cacheEntry.messages.unshift(snippet.message);
                        cacheEntry.messages = cacheEntry.messages.slice(0, MAX_MESSAGE_ENTRIES);
                    }
                }

                function getFallbackRoast(title) {
                    const random = MOCK_ROASTS[Math.floor(Math.random() * MOCK_ROASTS.length)];
                    return random.replace("[Title]", title || "this site");
                }
                function getFallbackRoast(title) {
                    const random = MOCK_ROASTS[Math.floor(Math.random() * MOCK_ROASTS.length)];
                    return random.replace("[Title]", title || "this site");
                }

                function buildPayload(cacheEntry, title) {
                    if (!cacheEntry) return null;
                    const roastText = cacheEntry.roast || getFallbackRoast(title);
                    if (!cacheEntry.roast) {
                        cacheEntry.roast = roastText;
                    }
                    return {
                        roast: roastText,
                        ads: cacheEntry.ads.slice(0, MAX_AD_ENTRIES),
                        messages: cacheEntry.messages.slice(0, MAX_MESSAGE_ENTRIES)
                    };
                }
                function buildPayload(cacheEntry, title) {
                    if (!cacheEntry) return null;
                    const roastText = cacheEntry.roast || getFallbackRoast(title);
                    if (!cacheEntry.roast) {
                        cacheEntry.roast = roastText;
                    }
                    return {
                        roast: roastText,
                        ads: cacheEntry.ads.slice(0, MAX_AD_ENTRIES),
                        messages: cacheEntry.messages.slice(0, MAX_MESSAGE_ENTRIES)
                    };
                }

                function canCallOpenAI(contextKey) {
                    if (!lastApiContextKey || contextKey !== lastApiContextKey) {
                        return true;
                    }
                    return (Date.now() - lastApiCallTime) > RATE_LIMIT_WINDOW;
                }
                function canCallOpenAI(contextKey) {
                    if (!lastApiContextKey || contextKey !== lastApiContextKey) {
                        return true;
                    }
                    return (Date.now() - lastApiCallTime) > RATE_LIMIT_WINDOW;
                }

                function sanitizeStudyTextInput(text) {
                    if (!text) return "";
                    return text.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_STUDY_PREVIEW_LENGTH);
                }
                function sanitizeStudyTextInput(text) {
                    if (!text) return "";
                    return text.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_STUDY_PREVIEW_LENGTH);
                }

                async function generateStudyQuizQuestions(fileMeta, textPreview, imageDataUrl) {
                    const OPENAI_API_KEY = CONFIG.OPENAI_API_KEY;
                    if (!OPENAI_API_KEY) {
                        throw new Error("Missing OPENAI_API_KEY in config.js");
                    }
                    if (!fileMeta) {
                        throw new Error("Missing study file metadata.");
                    }
                    async function generateStudyQuizQuestions(fileMeta, textPreview, imageDataUrl) {
                        const OPENAI_API_KEY = CONFIG.OPENAI_API_KEY;
                        if (!OPENAI_API_KEY) {
                            throw new Error("Missing OPENAI_API_KEY in config.js");
                        }
                        if (!fileMeta) {
                            throw new Error("Missing study file metadata.");
                        }

                        const cleanedText = sanitizeStudyTextInput(textPreview);
                        if (!cleanedText && !imageDataUrl) {
                            throw new Error("Could not read that file. Try a text-based PDF or a clear image screenshot.");
                        }
                        const cleanedText = sanitizeStudyTextInput(textPreview);
                        if (!cleanedText && !imageDataUrl) {
                            throw new Error("Could not read that file. Try a text-based PDF or a clear image screenshot.");
                        }
                        const cleanedText = sanitizeStudyTextInput(textPreview);
                        if (!cleanedText && !imageDataUrl) {
                            throw new Error("Could not read that file. Try a text-based PDF or a clear image screenshot.");
                        }

    const userContent = [
        {
            type: "text",
            text: `Use the study material below to craft exactly three multiple-choice quiz questions (A-D options) with their correct answers and concise explanations. Each question must reference specific facts from the material instead of trivia.`
        },
        {
            type: "text",
            text: `File details:\n- Name: ${fileMeta.name || 'unknown'}\n- Type: ${fileMeta.type || 'unknown'}\n- Size bytes: ${fileMeta.size || 0}`
        }
    ];

    if (cleanedText) {
        userContent.push({
            type: "text",
            text: `Study excerpt:\n${cleanedText}`
        });
    }

    if (imageDataUrl && imageDataUrl.startsWith("data:")) {
        userContent.push({
            type: "image_url",
            image_url: { url: imageDataUrl }
        });
    }

    try {
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
                    temperature: 0.4,
                    max_tokens: 400,
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "study_quiz",
                            schema: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    questions: {
                                        type: "array",
                                        minItems: 3,
                                        maxItems: 3,
                                        items: {
                                            type: "object",
                                            additionalProperties: false,
                                            properties: {
                                                question: { type: "string" },
                                                options: {
                                                    type: "array",
                                                    minItems: 4,
                                                    maxItems: 4,
                                                    items: { type: "string" }
                                                },
                                                correctIndex: {
                                                    type: "integer",
                                                    minimum: 0,
                                                    maximum: 3
                                                },
                                                explanation: { type: "string" }
                                            },
                                            required: ["question", "options", "correctIndex"]
                                        }
                                    }
                                },
                                required: ["questions"]
                            }
                        }
                    },
                    messages: [
                        {
                            role: "system",
                            content: "You are a strict tutor who only outputs raw minified JSON."
                        },
                        {
                            role: "user",
                            content: userContent
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`OpenAI HTTP error ${response.status}: ${body}`);
        }

        const data = await response.json();
        if (data.choices && data.choices[0].message && data.choices[0].message.content) {
            let text = data.choices[0].message.content.trim();
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
            const parsed = JSON.parse(text);
            if (!parsed.questions || !Array.isArray(parsed.questions)) {
                throw new Error("Invalid quiz payload from OpenAI.");
            }
            return parsed.questions.slice(0, 3).map(q => ({
                question: q.question,
                options: q.options,
                correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
                explanation: q.explanation || ""
            }));
        }
        throw new Error("OpenAI response missing quiz content.");
    } catch (error) {
        console.error("Study quiz generation failed:", error);
        throw error;
    }
}

            function checkAndRoast(tabId, tab) {
                if (!tab.url) return;
                function checkAndRoast(tabId, tab) {
                    if (!tab.url) return;

                    chrome.storage.sync.get(['blacklist', 'sessionActive', 'sessionEnd'], async (result) => {
                        if (!result.sessionActive || Date.now() > result.sessionEnd) return;
                        chrome.storage.sync.get(['blacklist', 'sessionActive', 'sessionEnd'], async (result) => {
                            if (!result.sessionActive || Date.now() > result.sessionEnd) return;

                            const blacklist = result.blacklist || DEFAULT_BLACKLIST;
                            const url = new URL(tab.url);
                            const hostname = url.hostname;
                            const contextKey = getContextKey(tab.url);
                            const blacklist = result.blacklist || DEFAULT_BLACKLIST;
                            const url = new URL(tab.url);
                            const hostname = url.hostname;
                            const contextKey = getContextKey(tab.url);
                            const blacklist = result.blacklist || DEFAULT_BLACKLIST;
                            const url = new URL(tab.url);
                            const hostname = url.hostname;
                            const contextKey = getContextKey(tab.url);

                            const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));
                            const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));
                            const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));

                            if (isBlacklisted && contextKey) {
                                const cacheEntry = getCacheEntry(contextKey);
                                if (isBlacklisted && contextKey) {
                                    const cacheEntry = getCacheEntry(contextKey);
                                    if (isBlacklisted && contextKey) {
                                        const cacheEntry = getCacheEntry(contextKey);

                                        if (canCallOpenAI(contextKey)) {
                                            const typeToRefresh = chooseNextType(cacheEntry);
                                            const generated = await generateContextualContent(tab.title, tab.url, typeToRefresh);
                                            lastApiCallTime = Date.now();
                                            lastApiContextKey = contextKey;
                                            if (generated) {
                                                applySnippetToCache(cacheEntry, generated);
                                            }
                                        } else {
                                            console.warn("Rate limit hit for context:", contextKey, "- relying on cache.");
                                        }
                                        if (canCallOpenAI(contextKey)) {
                                            const typeToRefresh = chooseNextType(cacheEntry);
                                            const generated = await generateContextualContent(tab.title, tab.url, typeToRefresh);
                                            lastApiCallTime = Date.now();
                                            lastApiContextKey = contextKey;
                                            if (generated) {
                                                applySnippetToCache(cacheEntry, generated);
                                                if (canCallOpenAI(contextKey)) {
                                                    const generated = await generateContextualContent(tab.title, tab.url);
                                                    lastApiCallTime = Date.now();
                                                    lastApiContextKey = contextKey;
                                                    if (generated) {
                                                        applySnippetToCache(cacheEntry, generated);
                                                    }
                                                }

                                                const payload = buildPayload(cacheEntry, tab.title);
                                                if (payload) {
                                                    chrome.tabs.sendMessage(tabId, { action: "UPDATE_CONTENT", data: payload }).catch(() => { });
                                                } else {
                                                    const roast = getFallbackRoast(tab.title);
                                                    chrome.tabs.sendMessage(tabId, { action: "ROAST", text: roast }).catch(() => { });
                                                }
                                            }
                                        } else {
                                            console.warn("Rate limit hit for context:", contextKey, "- relying on cache.");
                                        }
                                    });
                    }

            const payload = buildPayload(cacheEntry, tab.title);
                    if (payload) {
                        chrome.tabs.sendMessage(tabId, { action: "UPDATE_CONTENT", data: payload }).catch(() => { });
                    } else {
                        const roast = getFallbackRoast(tab.title);
                        chrome.tabs.sendMessage(tabId, { action: "ROAST", text: roast }).catch(() => { });
                        if (payload) {
                            chrome.tabs.sendMessage(tabId, { action: "UPDATE_CONTENT", data: payload }).catch(() => { });
                        } else {
                            const roast = getFallbackRoast(tab.title);
                            chrome.tabs.sendMessage(tabId, { action: "ROAST", text: roast }).catch(() => { });
                            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                                if (changeInfo.status === 'complete') {
                                    checkAndRoast(tabId, tab);
                                }
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
                            const blacklist = result.blacklist || DEFAULT_BLACKLIST;
                            if (!tab.url) return;
                            const url = new URL(tab.url);
                            const hostname = url.hostname;
                            const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));

                            chrome.tabs.onActivated.addListener((activeInfo) => {
                                chrome.tabs.get(activeInfo.tabId, (tab) => {
                                    if (chrome.runtime.lastError) return;
                                    checkAndRoast(activeInfo.tabId, tab);
                                    if (isBlacklisted) {
                                        chrome.tabs.update(tabId, { muted: false });
                                        chrome.tabs.sendMessage(tabId, { action: "ROAST", text: "Nice try. You can't mute your responsibilities." }).catch(() => { });
                                    });
                            }
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
    chrome.tabs.onActivated.addListener((activeInfo) => {
                            chrome.tabs.get(activeInfo.tabId, (tab) => {
                                if (chrome.runtime.lastError) return;
                                checkAndRoast(activeInfo.tabId, tab);
                            });
                        });
                        await offscreenCreating;
                        offscreenCreating = null;
                    }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                        if (!message || !message.action) return;

                        if (message.action === "PLAY_SOUND") {
                            ensureOffscreen().then(() => {
                                chrome.runtime.sendMessage({ action: "OFFSCREEN_PLAY", file: message.file });
                            }).catch(() => { });
                            return;
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

    if (message.action === "GENERATE_STUDY_QUIZ") {
        (async () => {
            try {
                const payload = message.payload || {};
                const questions = await generateStudyQuizQuestions(payload.file, payload.textPreview, payload.imageDataUrl);
                sendResponse({
                    ok: true,
                    quizId: crypto.randomUUID ? crypto.randomUUID() : `quiz-${Date.now()}`,
                    questions
                });
			} catch (error) {
                sendResponse({ ok: false, error: error.message || "Quiz generation failed." });
            }
        })();
        return true;
    }
});
