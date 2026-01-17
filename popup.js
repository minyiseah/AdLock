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
const historyBtn = document.getElementById('historyBtn');
const historyMenu = document.getElementById('historyMenu');
const historyBackBtn = document.getElementById('historyBackBtn');
const calendarGrid = document.getElementById('calendarGrid');
const statDay = document.getElementById('statDay');
const statWeek = document.getElementById('statWeek');
const statMonth = document.getElementById('statMonth');
const statStreak = document.getElementById('statStreak');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const currentMonthLabel = document.getElementById('currentMonthLabel');
const sessionDetails = document.getElementById('sessionDetails');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const sessionListEl = document.getElementById('sessionList');

const focusToggle = document.getElementById('focusToggle');
const toggleThumb = document.getElementById('toggleThumb');
const toggleLabel = document.getElementById('toggleLabel');
const durationInput = document.getElementById('duration');
const timerDisplay = document.getElementById('timerDisplay');

let timerInterval;
let currentViewDate = new Date();

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

function getISOWeek(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function calculateStreak(history) {
  const today = new Date();
  let streak = 0;
  let d = new Date(today);

  // Check if we have an entry for today
  const todayKey = d.toLocaleDateString('en-CA');
  if (!history[todayKey]) {
    // If not, check yesterday to see if streak is still alive
    d.setDate(d.getDate() - 1);
  }

  while (getHistoryTotal(history[d.toLocaleDateString('en-CA')]) > 0) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

function getHistoryTotal(item) {
  if (typeof item === 'number') return item;
  if (item && typeof item === 'object') return item.total || 0;
  return 0;
}

function renderDashboard(history) {
  const today = new Date();
  const todayKey = today.toLocaleDateString('en-CA');
  const currentYear = today.getFullYear();
  const currentWeek = getISOWeek(today);

  const viewMonth = currentViewDate.getMonth();
  const viewYear = currentViewDate.getFullYear();

  let dayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;

  // Calculate Stats
  Object.keys(history).forEach(dateStr => {
    const ms = getHistoryTotal(history[dateStr]);
    const date = new Date(dateStr);

    if (dateStr === todayKey) dayTotal += ms;
    if (date.getFullYear() === viewYear && date.getMonth() === viewMonth) monthTotal += ms;
    if (date.getFullYear() === currentYear && getISOWeek(date) === currentWeek) weekTotal += ms;
  });

  statDay.textContent = Math.floor(dayTotal / 60000) + 'm';
  statWeek.textContent = Math.floor(weekTotal / 60000) + 'm';
  statMonth.textContent = Math.floor(monthTotal / 60000) + 'm';

  // Calculate Streak
  statStreak.textContent = calculateStreak(history);

  renderCalendar(history);
}

function renderCalendar(history) {
  calendarGrid.innerHTML = '';

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  currentMonthLabel.textContent = currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Days of week header
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  days.forEach(d => {
    const el = document.createElement('div');
    el.textContent = d;
    el.style.textAlign = 'center';
    el.style.fontSize = '10px';
    el.style.color = '#888';
    calendarGrid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Empty slots
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarGrid.appendChild(document.createElement('div'));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const key = d.toLocaleDateString('en-CA');
    const entry = history[key];
    const ms = getHistoryTotal(entry);
    const mins = Math.floor(ms / 60000);

    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.title = `${key}: ${mins} mins`;
    div.textContent = i;

    if (mins > 60) div.classList.add('level-4');
    else if (mins > 30) div.classList.add('level-3');
    else if (mins > 15) div.classList.add('level-2');
    else if (mins > 0) div.classList.add('level-1');

    div.onclick = () => showSessionDetails(key, entry);

    calendarGrid.appendChild(div);
  }
}

function showSessionDetails(dateKey, entry) {
  sessionDetails.style.display = 'block';
  selectedDateLabel.textContent = `Sessions for ${dateKey}`;
  sessionListEl.innerHTML = '';

  if (!entry || !entry.sessions || entry.sessions.length === 0) {
    const li = document.createElement('li');
    li.textContent = "No sessions recorded.";
    li.style.color = '#888';
    sessionListEl.appendChild(li);
    return;
  }

  entry.sessions.forEach(session => {
    const li = document.createElement('li');
    const start = new Date(session.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const duration = Math.floor(session.duration / 60000);
    li.textContent = `${start} - ${duration} min`;
    sessionListEl.appendChild(li);
  });
}

function loadSites() {
  chrome.storage.sync.get(['blacklist'], (result) => {
    const blacklist = result.blacklist || DEFAULT_BLACKLIST;
    renderList(blacklist);
  });

  chrome.storage.local.get(['dailyHistory'], (result) => {
    const history = result.dailyHistory || {};
    renderDashboard(history);
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

function updateTimerUI(isActive, endTime, startTime) {
  if (isActive && endTime > Date.now()) {
    focusToggle.classList.add('active');
    timerDisplay.style.display = 'block';
    durationInput.disabled = true;
    toggleLabel.textContent = "Stop Focus";

    const totalDuration = endTime - startTime;

    const updatePosition = () => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        stopSession();
        return;
      }

      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

      // Calculate toggle position
      const containerWidth = focusToggle.clientWidth;
      const thumbWidth = toggleThumb.clientWidth;
      const padding = 5;
      const maxLeft = containerWidth - thumbWidth - padding;
      const minLeft = padding;

      const percentage = remaining / totalDuration;
      const currentLeft = minLeft + (maxLeft - minLeft) * percentage;

      toggleThumb.style.left = `${currentLeft}px`;
    };

    clearInterval(timerInterval);
    updatePosition(); // Immediate update
    timerInterval = setInterval(updatePosition, 1000);
  } else {
    focusToggle.classList.remove('active');
    toggleThumb.style.left = '5px'; // Reset to start
    toggleLabel.textContent = "Start Focus";
    timerDisplay.style.display = 'none';
    durationInput.disabled = false;
    clearInterval(timerInterval);
  }
}

function startSession() {
  const mins = parseInt(durationInput.value) || 30;
  const intensity = 5; // Fixed high intensity
  const startTime = Date.now();
  const endTime = startTime + (mins * 60000);

  chrome.storage.sync.set({
    sessionActive: true,
    sessionStart: startTime,
    sessionEnd: endTime,
    intensity: intensity
  }, () => {
    updateTimerUI(true, endTime, startTime);

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
  chrome.storage.sync.get(['sessionStart'], (syncResult) => {
    chrome.storage.local.get(['dailyHistory'], (localResult) => {
      const start = syncResult.sessionStart || Date.now();
      const elapsed = Date.now() - start;
      const today = new Date().toLocaleDateString('en-CA');

      const history = localResult.dailyHistory || {};

      // Update history with session details
      let entry = history[today];
      if (typeof entry === 'number' || !entry) {
        entry = { total: (entry || 0), sessions: [] };
      }

      entry.total += elapsed;
      entry.sessions.push({ start: start, end: Date.now(), duration: elapsed });
      history[today] = entry;

      chrome.storage.sync.set({ sessionActive: false });
      chrome.storage.local.set({ dailyHistory: history }, () => {
        renderDashboard(history);
        updateTimerUI(false, 0, 0);
      });
    });
  });
}

function checkSessionStatus() {
  chrome.storage.sync.get(['sessionActive', 'sessionEnd', 'sessionStart'], (syncResult) => {
    if (syncResult.sessionActive && syncResult.sessionEnd < Date.now()) {
      // Session finished while closed
      const start = syncResult.sessionStart || (syncResult.sessionEnd - 30 * 60000);
      const duration = syncResult.sessionEnd - start;
      const dateKey = new Date(syncResult.sessionEnd).toLocaleDateString('en-CA');

      chrome.storage.local.get(['dailyHistory'], (localResult) => {
        const history = localResult.dailyHistory || {};

        let entry = history[dateKey];
        if (typeof entry === 'number' || !entry) {
          entry = { total: (entry || 0), sessions: [] };
        }

        entry.total += duration;
        entry.sessions.push({ start: start, end: syncResult.sessionEnd, duration: duration });
        history[dateKey] = entry;

        chrome.storage.sync.set({ sessionActive: false });
        chrome.storage.local.set({ dailyHistory: history }, () => {
          renderDashboard(history);
          updateTimerUI(false, 0, 0);
        });
      });
    } else {
      updateTimerUI(syncResult.sessionActive, syncResult.sessionEnd, syncResult.sessionStart);
    }
  });
}

addBtn.addEventListener('click', addSite);

focusToggle.addEventListener('click', () => {
  chrome.storage.sync.get(['sessionActive'], (result) => {
    if (result.sessionActive) {
      stopSession();
    } else {
      startSession();
    }
  });
});

blacklistBtn.addEventListener('click', () => { mainMenu.style.display = 'none'; blacklistMenu.style.display = 'block'; });
backBtn.addEventListener('click', () => { blacklistMenu.style.display = 'none'; mainMenu.style.display = 'block'; });
historyBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  historyMenu.style.display = 'block';
  chrome.storage.local.get(['dailyHistory'], (result) => {
    const history = result.dailyHistory || {};
    renderDashboard(history);
  });
});
historyBackBtn.addEventListener('click', () => { historyMenu.style.display = 'none'; mainMenu.style.display = 'block'; });

prevMonthBtn.addEventListener('click', () => {
  currentViewDate.setMonth(currentViewDate.getMonth() - 1);
  chrome.storage.local.get(['dailyHistory'], (result) => {
    renderDashboard(result.dailyHistory || {});
  });
});

nextMonthBtn.addEventListener('click', () => {
  currentViewDate.setMonth(currentViewDate.getMonth() + 1);
  chrome.storage.local.get(['dailyHistory'], (result) => {
    renderDashboard(result.dailyHistory || {});
  });
});

document.addEventListener('DOMContentLoaded', () => {
  loadSites();
  checkSessionStatus();
});