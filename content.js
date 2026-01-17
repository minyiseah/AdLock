// content.js

const SNARKY_MESSAGES = [
  "Your boss is disappointed in you.",
  "Is this really worth your time?",
  "Go touch grass.",
  "Productivity is dropping to 0%.",
  "Why are you still here?",
  "Deadline approaching...",
  "You promised yourself you'd work today."
];

let scrollHandler = null;
let chaosTimeouts = [];
let chaosInterval = null;

// Helper to get a random integer
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to create a fake ad
function createFakeAd() {
  const ad = document.createElement('div');
  ad.className = 'annoyance-fake-ad';

  const adText = document.createElement('span');
  adText.innerText = "CLICK HERE TO WIN A FREE IPAD!!!";
  ad.appendChild(adText);

  // Random positioning logic (sidebar or top)
  const positions = ['fixed', 'absolute'];
  ad.style.position = positions[getRandomInt(0, 1)];
  ad.style.top = getRandomInt(10, 80) + '%';

  // Randomize side
  if (Math.random() > 0.5) {
    ad.style.right = '10px';
  } else {
    ad.style.left = '10px';
  }

  document.body.appendChild(ad);

  // Ads are now persistent until session ends
}

// Function to create the annoying popup
function createAnnoyingPopup() {
  const overlay = document.createElement('div');
  overlay.className = 'annoyance-popup-container';

  const popup = document.createElement('div');
  popup.className = 'annoyance-popup-window';

  const titleBar = document.createElement('div');
  titleBar.className = 'annoyance-popup-title';
  titleBar.innerText = "WARNING: LAZINESS DETECTED";

  const message = document.createElement('div');
  message.className = 'annoyance-popup-message';
  message.innerText = SNARKY_MESSAGES[getRandomInt(0, SNARKY_MESSAGES.length - 1)];

  const closeBtn = document.createElement('button');
  closeBtn.className = 'annoyance-close-btn';
  closeBtn.innerText = "Close";

  // The evasive button logic
  closeBtn.addEventListener('mouseover', () => {
    // 50% chance the button moves when hovered
    if (Math.random() > 0.5) {
      const xOffset = getRandomInt(-50, 50);
      const yOffset = getRandomInt(-50, 50);
      closeBtn.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    }
  });

  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });

  popup.appendChild(titleBar);
  popup.appendChild(message);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// Function to slow down scrolling
function slowScroll(intensity) {
  // Higher intensity = more scroll jank
  if (scrollHandler) window.removeEventListener('wheel', scrollHandler);
  scrollHandler = (e) => {
    if (Math.random() < (intensity * 0.1)) {
      e.preventDefault();
      // Occasionally scroll the wrong way or stop it
      if (Math.random() > 0.5) {
        window.scrollBy(0, -10);
      }
    }
  };
  window.addEventListener('wheel', scrollHandler, { passive: false });
}

// Function to load content slower (simulated)
function slowLoad() {
  document.body.style.transition = 'opacity 2s ease-in';
  document.body.style.opacity = '0.1';
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 2000);

  // Randomly hide images and show them slowly
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (Math.random() > 0.5) {
      img.style.transition = 'opacity 5s';
      img.style.opacity = '0';
      setTimeout(() => { img.style.opacity = '1'; }, Math.random() * 5000);
    }
  });
}

function cleanup() {
  // Clear all scheduled annoyances
  chaosTimeouts.forEach(clearTimeout);
  chaosTimeouts = [];

  if (chaosInterval) {
    clearInterval(chaosInterval);
    chaosInterval = null;
  }

  // Remove scroll interference
  if (scrollHandler) {
    window.removeEventListener('wheel', scrollHandler);
    scrollHandler = null;
  }

  // Remove injected DOM elements
  document.querySelectorAll('.annoyance-fake-ad').forEach(el => el.remove());
  document.querySelectorAll('.annoyance-popup-container').forEach(el => el.remove());

  // Reset body styles
  document.body.style.opacity = '';
  document.body.style.transition = '';
}

// Main Loop
function startChaos(intensity, sessionEnd) {
  // Initial delay before things start getting annoying
  console.log("Annoyance Extension Loaded: Productivity enforcement active.");

  // Apply persistent annoyances
  if (intensity >= 3) slowScroll(intensity);
  if (intensity >= 4) slowLoad();

  // Immediate ad to discourage refreshing
  createFakeAd();

  // Check for session end locally
  chaosInterval = setInterval(() => {
    if (Date.now() > sessionEnd) {
      cleanup();
    }
  }, 1000);

  // Loop for Popups (Every 30-60 seconds)
  const popupLoop = () => {
    if (document.hidden) { chaosTimeouts.push(setTimeout(popupLoop, 1000)); return; } // Check if tab is active
    const delay = getRandomInt(30000 / intensity, 60000 / intensity); // Scale with intensity
    chaosTimeouts.push(setTimeout(() => {
      if (!document.hidden) createAnnoyingPopup();
      popupLoop(); // Schedule next one
    }, delay));
  };

  // Loop for Ads (More frequent, every 10-20 seconds)
  const adLoop = () => {
    if (document.hidden) { chaosTimeouts.push(setTimeout(adLoop, 1000)); return; }
    const delay = getRandomInt(10000 / intensity, 20000 / intensity);
    chaosTimeouts.push(setTimeout(() => {
      if (!document.hidden) createFakeAd();
      adLoop();
    }, delay));
  };

  popupLoop();
  adLoop();
}

// Check blacklist before starting
const DEFAULT_BLACKLIST = [
  "reddit.com",
  "twitter.com",
  "x.com",
  "youtube.com"
];

function checkState() {
  chrome.storage.sync.get(['blacklist', 'sessionActive', 'sessionEnd', 'intensity'], (result) => {
    // Always cleanup first to ensure clean state or stop if needed
    cleanup();

    if (!result.sessionActive || Date.now() > result.sessionEnd) return;

    const blacklist = result.blacklist || DEFAULT_BLACKLIST;
    const hostname = window.location.hostname;
    const intensity = result.intensity || 3;

    // Improved blacklist detection (subdomains)
    const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));

    if (isBlacklisted) {
      startChaos(intensity, result.sessionEnd);
    }
  });
}

checkState();

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') checkState();
});

// Listen for roast messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ROAST") {
    showRoastToast(request.text);
  }
});

function showRoastToast(text) {
  const toast = document.createElement('div');
  toast.className = 'annoyance-roast-toast';
  toast.innerText = "🔥 AI ROAST: " + text;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}
