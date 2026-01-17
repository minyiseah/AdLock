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
  
    // Remove the ad after a while to keep the DOM somewhat clean, or let them pile up
    setTimeout(() => {
      ad.remove();
    }, 15000);
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
  
  // Main Loop
  function startChaos() {
    // Initial delay before things start getting annoying
    console.log("Annoyance Extension Loaded: Productivity enforcement active.");
  
    // Loop for Popups (Every 30-60 seconds)
    const popupLoop = () => {
      const delay = getRandomInt(30000, 60000);
      setTimeout(() => {
        createAnnoyingPopup();
        popupLoop(); // Schedule next one
      }, delay);
    };
  
    // Loop for Ads (More frequent, every 10-20 seconds)
    const adLoop = () => {
      const delay = getRandomInt(10000, 20000);
      setTimeout(() => {
        createFakeAd();
        adLoop();
      }, delay);
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
  
  chrome.storage.sync.get(['blacklist'], (result) => {
    const blacklist = result.blacklist || DEFAULT_BLACKLIST;
    const hostname = window.location.hostname;
    
    if (blacklist.some(site => hostname.includes(site))) {
      startChaos();
    }
  });
  