const DEFAULT_BLACKLIST = [
  "reddit.com",
  "twitter.com",
  "x.com",
  "youtube.com"
];

const siteList = document.getElementById('siteList');
const newSiteInput = document.getElementById('newSite');
const addBtn = document.getElementById('addBtn');
const backBtn = document.getElementById('backBtn');
const blacklistBtn = document.getElementById('blacklistBtn');
const mainMenu = document.getElementById('mainMenu');
const blacklistMenu = document.getElementById('blacklistMenu');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const durationInput = document.getElementById('duration');
const intensityInput = document.getElementById('intensity');
const timerDisplay = document.getElementById('timerDisplay');
const totalTimeDisplay = document.getElementById('totalTime');
const scoreValue = document.getElementById('scoreValue');

let timerInterval;

function renderList(blacklist) {
  siteList.innerHTML = '';
  blacklist.forEach((site, index) => {
    const li = document.createElement('li');
    li.textContent = site;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = "X";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = () => removeSite(index);

    li.appendChild(removeBtn);
    siteList.appendChild(li);
  });
}

function loadSites() {
  chrome.storage.sync.get(['blacklist', 'totalFocusTime'], (result) => {
    const blacklist = result.blacklist || DEFAULT_BLACKLIST;
    renderList(blacklist);
    totalTimeDisplay.textContent = Math.floor((result.totalFocusTime || 0) / 60000);
  });

  // Load Score
  chrome.storage.local.get(['productivityScore'], (result) => {
    if (result.productivityScore !== undefined) {
      scoreValue.textContent = result.productivityScore;
    }
  });
}

function addSite() {
  const site = newSiteInput.value.trim();
  if (!site) return;

  chrome.storage.sync.get(['blacklist'], (result) => {
    const blacklist = result.blacklist || DEFAULT_BLACKLIST;
    blacklist.push(site);
    chrome.storage.sync.set({ blacklist }, () => {
      newSiteInput.value = '';
      renderList(blacklist);
    });
  });
}

function removeSite(index) {
  chrome.storage.sync.get(['blacklist'], (result) => {
    const blacklist = result.blacklist || DEFAULT_BLACKLIST;
    blacklist.splice(index, 1);
    chrome.storage.sync.set({ blacklist }, () => renderList(blacklist));
  });
}

function updateTimerUI(isActive, endTime) {
  if (isActive && endTime > Date.now()) {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    timerDisplay.style.display = 'block';
    durationInput.disabled = true;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        stopSession();
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  } else {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    timerDisplay.style.display = 'none';
    durationInput.disabled = false;
    clearInterval(timerInterval);
  }
}

function startSession() {
  const mins = parseInt(durationInput.value) || 30;
  const intensity = parseInt(intensityInput.value) || 3;
  const startTime = Date.now();
  const endTime = startTime + (mins * 60000);

  chrome.storage.sync.set({
    sessionActive: true,
    sessionStart: startTime,
    sessionEnd: endTime,
    intensity: intensity
  }, () => {
    updateTimerUI(true, endTime);

    // Reload current tab if it's blacklisted to ensure disturbances appear immediately
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        chrome.storage.sync.get(['blacklist'], (result) => {
          const blacklist = result.blacklist || DEFAULT_BLACKLIST;
          try {
            const url = new URL(tabs[0].url);
            const hostname = url.hostname;
            const isBlacklisted = blacklist.some(site => hostname === site || hostname.endsWith('.' + site));
            if (isBlacklisted) {
              chrome.tabs.reload(tabs[0].id);
            }
          } catch (e) { /* Ignore invalid URLs */ }
        });
      }
    });
  });
}

function stopSession() {
  chrome.storage.sync.get(['sessionStart', 'totalFocusTime'], (result) => {
    const start = result.sessionStart || Date.now();
    const currentTotal = result.totalFocusTime || 0;
    const elapsed = Date.now() - start;

    // Only add time if it was actually running
    const newTotal = currentTotal + elapsed;

    chrome.storage.sync.set({
      sessionActive: false,
      totalFocusTime: newTotal
    }, () => {
      totalTimeDisplay.textContent = Math.floor(newTotal / 60000);
      updateTimerUI(false, 0);
    });
  });
}

function checkSessionStatus() {
  chrome.storage.sync.get(['sessionActive', 'sessionEnd', 'sessionStart', 'totalFocusTime'], (result) => {
    if (result.sessionActive && result.sessionEnd < Date.now()) {
      // Session finished while closed
      const start = result.sessionStart || (result.sessionEnd - 30 * 60000);
      const duration = result.sessionEnd - start;
      const newTotal = (result.totalFocusTime || 0) + duration;

      chrome.storage.sync.set({
        sessionActive: false,
        totalFocusTime: newTotal
      }, () => {
        totalTimeDisplay.textContent = Math.floor(newTotal / 60000);
        updateTimerUI(false, 0);
      });
    } else {
      updateTimerUI(result.sessionActive, result.sessionEnd);
    }
  });
}

addBtn.addEventListener('click', addSite);
startBtn.addEventListener('click', startSession);
stopBtn.addEventListener('click', stopSession);

blacklistBtn.addEventListener('click', () => { mainMenu.style.display = 'none'; blacklistMenu.style.display = 'block'; });
backBtn.addEventListener('click', () => { blacklistMenu.style.display = 'none'; mainMenu.style.display = 'block'; });

document.addEventListener('DOMContentLoaded', () => {
  loadSites();
  checkSessionStatus();
});

// Listen for score updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.productivityScore) {
    scoreValue.textContent = changes.productivityScore.newValue;
  }
});