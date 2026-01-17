// content.js

let SNARKY_MESSAGES = [
  "Your boss is disappointed in you.",
  "Is this really worth your time?",
  "Go touch grass.",
  "Productivity is dropping to 0%.",
  "Why are you still here?",
  "Deadline approaching...",
  "You promised yourself you'd work today."
];

let AD_HEADLINES = [
  "CLICK HERE TO WIN A FREE IPAD!!!",
  "HOT SINGLES IN YOUR AREA!",
  "DOWNLOAD MORE RAM NOW!",
  "EARN $5000 FROM HOME!",
  "ONE WEIRD TRICK TO LOSE BELLY FAT"
];

const SAFE_SITES = [
  "https://www.linkedin.com",
  "https://indeed.com",
  "https://leetcode.com/"
];

const MAX_ADS = 5;
let scrollHandler = null;
let redirectHandler = null;
let lastRedirectTime = Date.now();
let chaosTimeouts = [];
let chaosInterval = null;

// Helper to get a random integer
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function redirectToSafeSite() {
  const win = window.open(SAFE_SITES[Math.floor(Math.random() * SAFE_SITES.length)], '_blank');
  if (win) win.focus();
}

// Helper to create a close button
function createCloseButton(parentElement) {
  const btn = document.createElement('div');
  btn.className = 'annoyance-ad-close';
  btn.innerText = 'X';
  btn.onclick = (e) => {
    e.stopPropagation();
    parentElement.remove();
  };
  return btn;
}

// Helper to check overlap
function getExistingRects() {
  const ads = document.querySelectorAll('.annoyance-fake-ad, .annoyance-bottom-ad, .annoyance-floating-ad');
  return Array.from(ads).map(ad => ad.getBoundingClientRect());
}

function isOverlapping(rect, existingRects) {
  for (let other of existingRects) {
    if (!(rect.right < other.left ||
      rect.left > other.right ||
      rect.bottom < other.top ||
      rect.top > other.bottom)) {
      return true;
    }
  }
  return false;
}

// Function to create a fake ad
function createFakeAd() {
  if (document.querySelectorAll('.annoyance-fake-ad').length >= MAX_ADS) return;

  const ad = document.createElement('div');
  ad.className = 'annoyance-fake-ad';

  const adText = document.createElement('span');
  adText.innerText = AD_HEADLINES[getRandomInt(0, AD_HEADLINES.length - 1)];
  ad.appendChild(adText);

  ad.onclick = redirectToSafeSite;
  ad.appendChild(createCloseButton(ad));

  // Positioning logic with overlap check
  ad.style.position = 'fixed';
  ad.style.visibility = 'hidden'; // Hide while measuring
  document.body.appendChild(ad);

  const width = ad.offsetWidth;
  const height = ad.offsetHeight;
  const maxWidth = window.innerWidth - width;
  const maxHeight = window.innerHeight - height;

  let attempts = 0;
  let placed = false;
  const existing = getExistingRects();

  while (attempts < 10) {
    const left = getRandomInt(0, maxWidth);
    const top = getRandomInt(0, maxHeight);

    const newRect = {
      left: left,
      top: top,
      right: left + width,
      bottom: top + height
    };

    if (!isOverlapping(newRect, existing)) {
      ad.style.left = left + 'px';
      ad.style.top = top + 'px';
      ad.style.visibility = 'visible';
      placed = true;
      break;
    }
    attempts++;
  }

  if (!placed) {
    ad.remove();
  }
}

// Function to create a large bottom banner ad
function createBottomAd() {
  if (document.querySelector('.annoyance-bottom-ad')) return; // Only one at a time

  const ad = document.createElement('div');
  ad.className = 'annoyance-bottom-ad';
  ad.innerText = AD_HEADLINES[getRandomInt(0, AD_HEADLINES.length - 1)];

  ad.onclick = redirectToSafeSite;
  ad.appendChild(createCloseButton(ad));
  document.body.appendChild(ad);
}

// Function to create a floating ad
function createFloatingAd() {
  if (document.querySelectorAll('.annoyance-floating-ad').length >= 2) return;

  const ad = document.createElement('div');
  ad.className = 'annoyance-floating-ad';

  const text = document.createElement('div');
  text.innerText = AD_HEADLINES[getRandomInt(0, AD_HEADLINES.length - 1)];
  ad.appendChild(text);

  ad.onclick = redirectToSafeSite;
  ad.appendChild(createCloseButton(ad));

  // Set initial position
  ad.style.left = '50%';
  ad.style.top = '50%';
  document.body.appendChild(ad);
  animateFloatingAd(ad);
}

// Function to create the annoying popup
function createAnnoyingPopup() {
  if (document.querySelector('.annoyance-popup-container')) return;

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

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.remove();
  });

  popup.appendChild(titleBar);
  popup.appendChild(message);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);
  popup.onclick = redirectToSafeSite;
  document.body.appendChild(overlay);
}

// Function to animate floating ad randomly
function animateFloatingAd(ad) {
  if (!document.body.contains(ad)) return;

  const maxX = window.innerWidth - ad.offsetWidth;
  const maxY = window.innerHeight - ad.offsetHeight;

  const newX = getRandomInt(0, maxX);
  const newY = getRandomInt(0, maxY);
  const duration = getRandomInt(2, 5);

  ad.style.transition = `top ${duration}s ease-in-out, left ${duration}s ease-in-out`;
  ad.style.top = `${newY}px`;
  ad.style.left = `${newX}px`;

  setTimeout(() => animateFloatingAd(ad), duration * 1000);
}

// Function to slow down scrolling
function slowScroll(intensity) {
  // Higher intensity = more scroll jank
  if (scrollHandler) window.removeEventListener('wheel', scrollHandler);
  scrollHandler = (e) => {
    e.preventDefault(); // Take full control

    const rand = Math.random();

    // 1. Randomly scroll upwards/reverse (Chaos)
    if (rand < (intensity * 0.02)) {
      window.scrollBy(0, -e.deltaY * 1); // Reverse direction less hard
      return;
    }

    // 2. Buffering/Lag (Stutter)
    if (rand < (intensity * 0.05)) {
      setTimeout(() => {
        window.scrollBy(0, e.deltaY * 0.8);
      }, getRandomInt(100, 300)); // Reduced lag
      return;
    }

    // 3. Very Slow (Sludge mode)
    window.scrollBy(0, e.deltaY * 0.5);
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

// Function to generate annoying beep/glitch (Sonic Pest)
function playAnnoyingSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = Math.random() > 0.5 ? 'sawtooth' : 'square';
    const freq = getRandomInt(800, 1500); // High pitch
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Glitch effect
    oscillator.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) { /* AudioContext might be blocked */ }
}

// Function to randomly redirect on interaction
function setupRandomRedirects(intensity) {
  if (redirectHandler) {
    document.removeEventListener('click', redirectHandler, true);
    document.removeEventListener('keydown', redirectHandler, true);
  }

  redirectHandler = (e) => {
    // Limit to once every 10 seconds
    if (Date.now() - lastRedirectTime > 10000) {
      lastRedirectTime = Date.now();
      e.preventDefault();
      e.stopPropagation();
      const win = window.open(SAFE_SITES[Math.floor(Math.random() * SAFE_SITES.length)], '_blank');
      if (win) win.focus();
    }
  };

  document.addEventListener('click', redirectHandler, true);
  document.addEventListener('keydown', redirectHandler, true);
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

  // Remove redirect listeners
  if (redirectHandler) {
    document.removeEventListener('click', redirectHandler, true);
    document.removeEventListener('keydown', redirectHandler, true);
    redirectHandler = null;
  }

  // Remove injected DOM elements
  document.querySelectorAll('.annoyance-fake-ad').forEach(el => el.remove());
  document.querySelectorAll('.annoyance-popup-container').forEach(el => el.remove());
  document.querySelectorAll('.annoyance-bottom-ad').forEach(el => el.remove());
  document.querySelectorAll('.annoyance-floating-ad').forEach(el => el.remove());

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
  if (intensity >= 3) setupRandomRedirects(intensity);

  // Sonic Pest (Audio Annoyance)
  if (intensity >= 4) {
    const audioLoop = () => {
      if (document.hidden) { chaosTimeouts.push(setTimeout(audioLoop, 1000)); return; }
      const delay = getRandomInt(5000, 15000); // Random intervals
      chaosTimeouts.push(setTimeout(() => {
        if (!document.hidden) playAnnoyingSound();
        audioLoop();
      }, delay));
    };
    audioLoop();
  }

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
    const delay = getRandomInt(20000 / intensity, 100000 / intensity); // Scale with intensity (Less frequent)
    chaosTimeouts.push(setTimeout(() => {
      if (!document.hidden) createAnnoyingPopup();
      popupLoop(); // Schedule next one
    }, delay));
  };

  // Loop for Ads (More frequent, every 10-20 seconds)
  const adLoop = () => {
    if (document.hidden) { chaosTimeouts.push(setTimeout(adLoop, 1000)); return; }
    const delay = getRandomInt(20000 / intensity, 50000 / intensity);
    chaosTimeouts.push(setTimeout(() => {
      if (!document.hidden) {
        const rand = Math.random();
        if (rand < 0.5) {
          createFakeAd();
        } else if (rand < 0.9) {
          createBottomAd();
        } else {
          createFloatingAd();
        }
      }
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

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkState();
  }
});

// Listen for roast messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ROAST") {
    showRoastToast(request.text);
  } else if (request.action === "UPDATE_CONTENT") {
    if (request.data.roast) showRoastToast(request.data.roast);
    if (request.data.ads && request.data.ads.length > 0) AD_HEADLINES = request.data.ads;
    if (request.data.messages && request.data.messages.length > 0) SNARKY_MESSAGES = request.data.messages;
  }
});

function showRoastToast(text) {
  const toast = document.createElement('div');
  toast.className = 'annoyance-roast-toast';
  toast.innerText = text;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}
