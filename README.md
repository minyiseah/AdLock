# AdLock 🚫
Ads on, distractions gone.

Goal: Solving productivity issues via punishment. Instead of of blocking ads, it punishes you for visiting distracting sites by flooding your screen with 90s-style popups, slippery buttons, glitches, and AI-generated roasts.

# Features
1. Context-aware ads, pop-ups, and roasts, based on the content of the distracting site.
2. Customizable focus sessions, select duration and manage blacklisted sites.
3. Accountability by enabling usesr to view history log of past focus sessions.
   
# Installation Guide
Since this is a hackathon project, you must run it in Developer Mode.

1. Clone the Repository
Bash
git clone https://github.com/yourusername/ad-on.git
cd ad-on
2. Configure the API Key
Create a file named config.js in the root folder. Paste your Gemini API key inside:

JavaScript
// config.js
const CONFIG = {
    GEMINI_API_KEY: "YOUR_GOOGLE_GEMINI_API_KEY_HERE"
};
(Note: Get a free key at Google AI Studio)

3. Load into Chrome
Open Chrome and go to chrome://extensions.

Enable Developer mode (toggle in the top right).

Click Load unpacked.

Select the folder where you cloned this repo.

# Tech Stack
Manifest V3: Modern Chrome Extension architecture.

Vanilla JavaScript: Lightweight, no frameworks.

Google Gemini API: For real-time context generation and roasting.

Web Audio API: For procedural sound generation (no audio files required).

Chrome Storage & Scripting API: For state management and DOM manipulation.

This project was built for Hack&Roll 2026!
