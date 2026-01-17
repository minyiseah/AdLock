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
const blacklistMessage = document.getElementById('blacklistMessage');

const focusToggle = document.getElementById('focusToggle');
const toggleThumb = document.getElementById('toggleThumb');
const toggleLabel = document.getElementById('toggleLabel');
const durationInput = document.getElementById('duration');
const timerDisplay = document.getElementById('timerDisplay');
const captchaOverlay = document.getElementById('captchaOverlay');
const captchaTitle = document.getElementById('captchaTitle');
const captchaProgress = document.getElementById('captchaProgress');
const captchaBody = document.getElementById('captchaBody');
const captchaError = document.getElementById('captchaError');
const captchaCancel = document.getElementById('captchaCancel');
const captchaVerify = document.getElementById('captchaVerify');

let timerInterval;
let currentViewDate = new Date();
const CAPTCHA_TOTAL = 5;
let captchaState = { active: false, step: 0, order: [], validate: null };

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

  if (blacklistMessage) blacklistMessage.textContent = '';

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
  chrome.storage.sync.get(['blacklist', 'sessionActive', 'sessionEnd'], (result) => {
    const isSessionActive = result.sessionActive && result.sessionEnd > Date.now();
    
    if (isSessionActive) {
      if (blacklistMessage) {
        blacklistMessage.textContent = "Cannot remove sites while a focus session is active.";
        setTimeout(() => { if (blacklistMessage) blacklistMessage.textContent = ''; }, 3000);
      }
    } else {
      const blacklist = result.blacklist || DEFAULT_BLACKLIST;
      blacklist.splice(index, 1);
      chrome.storage.sync.set({ blacklist }, () => {
        renderList(blacklist);
      });
    }
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

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createCheckboxCaptcha() {
  return {
    title: "Are you human?",
    render: (container) => {
      const instructions = document.createElement('div');
      instructions.className = 'captcha-instructions';
      instructions.textContent = "Check the box to confirm you are human.";

      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';

      const text = document.createElement('span');
      text.textContent = "I am human";

      label.appendChild(checkbox);
      label.appendChild(text);

      container.appendChild(instructions);
      container.appendChild(label);
      return { checkbox };
    },
    validate: (ctx) => ctx.checkbox.checked
  };
}

function createImageSelectCaptcha() {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const shapes = ['square', 'circle'];
  const targetColor = colors[Math.floor(Math.random() * colors.length)];
  const targetShape = shapes[Math.floor(Math.random() * shapes.length)];

  return {
    title: "Select the images",
    render: (container) => {
      const instructions = document.createElement('div');
      instructions.className = 'captcha-instructions';
      instructions.textContent = `Select all ${targetColor} ${targetShape}s.`;

      const grid = document.createElement('div');
      grid.className = 'captcha-grid';

      const tiles = [];
      for (let i = 0; i < 9; i++) {
        const tile = document.createElement('div');
        tile.className = 'captcha-tile';

        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        tile.dataset.color = color;
        tile.dataset.shape = shape;

        tile.style.background = color;
        if (shape === 'circle') tile.classList.add('captcha-shape-circle');

        tile.addEventListener('click', () => {
          tile.classList.toggle('selected');
        });

        tiles.push(tile);
        grid.appendChild(tile);
      }

      // Ensure at least two correct tiles
      for (let i = 0; i < 2; i++) {
        const tile = tiles[i];
        tile.dataset.color = targetColor;
        tile.dataset.shape = targetShape;
        tile.style.background = targetColor;
        tile.classList.toggle('captcha-shape-circle', targetShape === 'circle');
      }

      container.appendChild(instructions);
      container.appendChild(grid);
      return { tiles, targetColor, targetShape };
    },
    validate: (ctx) => {
      let hasTarget = false;
      for (const tile of ctx.tiles) {
        const isTarget = tile.dataset.color === ctx.targetColor && tile.dataset.shape === ctx.targetShape;
        const isSelected = tile.classList.contains('selected');
        if (isTarget) hasTarget = true;
        if (isTarget !== isSelected) return false;
      }
      return hasTarget;
    }
  };
}

function createPerspectiveCaptcha() {
  const angles = [0, 90, 180, 270];
  const targetAngle = angles[Math.floor(Math.random() * angles.length)];
  const options = shuffle(angles).slice(0, 3);
  if (!options.includes(targetAngle)) options[0] = targetAngle;
  const finalOptions = shuffle(options);

  return {
    title: "Match the perspective",
    render: (container) => {
      const instructions = document.createElement('div');
      instructions.className = 'captcha-instructions';
      instructions.textContent = "Pick the option that matches the rotated image.";

      const targetWrap = document.createElement('div');
      targetWrap.style.marginBottom = '10px';
      const targetShape = document.createElement('div');
      targetShape.className = 'captcha-triangle';
      targetShape.style.transform = `rotate(${targetAngle}deg)`;
      targetWrap.appendChild(targetShape);

      const optionsWrap = document.createElement('div');
      optionsWrap.className = 'captcha-options';

      let selected = null;
      const optionButtons = finalOptions.map((angle) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'captcha-option';
        btn.dataset.angle = angle.toString();

        const shape = document.createElement('div');
        shape.className = 'captcha-triangle small';
        shape.style.transform = `rotate(${angle}deg)`;
        btn.appendChild(shape);

        btn.addEventListener('click', () => {
          optionButtons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selected = angle;
        });

        return btn;
      });

      optionButtons.forEach(btn => optionsWrap.appendChild(btn));

      container.appendChild(instructions);
      container.appendChild(targetWrap);
      container.appendChild(optionsWrap);

      return { getSelected: () => selected, targetAngle };
    },
    validate: (ctx) => ctx.getSelected() === ctx.targetAngle
  };
}

function createTextCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return {
    title: "Type the characters",
    render: (container) => {
      const instructions = document.createElement('div');
      instructions.className = 'captcha-instructions';
      instructions.textContent = "Type the characters you see.";

      const image = document.createElement('div');
      image.className = 'captcha-text-image';
      code.split('').forEach((ch) => {
        const span = document.createElement('span');
        span.textContent = ch;
        span.style.transform = `rotate(${Math.floor(Math.random() * 21) - 10}deg)`;
        image.appendChild(span);
      });

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Enter code';
      input.autocomplete = 'off';

      container.appendChild(instructions);
      container.appendChild(image);
      container.appendChild(input);
      return { input, code };
    },
    validate: (ctx) => ctx.input.value.trim().toUpperCase() === ctx.code
  };
}

function createSliderCaptcha() {
  const target = Math.floor(Math.random() * 61) + 20;

  return {
    title: "Align the slider",
    render: (container) => {
      const instructions = document.createElement('div');
      instructions.className = 'captcha-instructions';
      instructions.textContent = `Move the slider to ${target}.`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = '0';

      const valueLabel = document.createElement('div');
      valueLabel.className = 'captcha-slider-value';
      valueLabel.textContent = "Current: 0";

      slider.addEventListener('input', () => {
        valueLabel.textContent = `Current: ${slider.value}`;
      });

      container.appendChild(instructions);
      container.appendChild(slider);
      container.appendChild(valueLabel);
      return { slider, target };
    },
    validate: (ctx) => Math.abs(parseInt(ctx.slider.value, 10) - ctx.target) <= 2
  };
}

function showCaptchaStep() {
  const captcha = captchaState.order[captchaState.step];
  captchaTitle.textContent = captcha.title;
  captchaProgress.textContent = `Captcha ${captchaState.step + 1} of ${CAPTCHA_TOTAL}`;
  captchaBody.innerHTML = '';
  captchaError.textContent = '';

  const ctx = captcha.render(captchaBody);
  captchaState.validate = () => captcha.validate(ctx);
}

function endCaptchaChallenge(success) {
  captchaOverlay.style.display = 'none';
  captchaState.active = false;
  captchaState.step = 0;
  captchaState.order = [];
  captchaState.validate = null;

  if (success) stopSession();
}

function startCaptchaChallenge() {
  if (captchaState.active) return;
  captchaState.active = true;
  captchaState.step = 0;
  captchaState.order = shuffle([
    createCheckboxCaptcha(),
    createImageSelectCaptcha(),
    createPerspectiveCaptcha(),
    createTextCaptcha(),
    createSliderCaptcha()
  ]);

  captchaOverlay.style.display = 'flex';
  showCaptchaStep();
}

function addPenaltyTime() {
  chrome.storage.sync.get(['sessionActive', 'sessionEnd', 'sessionStart'], (result) => {
    if (!result.sessionActive || !result.sessionEnd) return;
    const newEnd = result.sessionEnd + (5 * 60000);
    chrome.storage.sync.set({ sessionEnd: newEnd }, () => {
      updateTimerUI(true, newEnd, result.sessionStart || (newEnd - 30 * 60000));
    });
  });
}

captchaCancel.addEventListener('click', () => endCaptchaChallenge(false));
captchaVerify.addEventListener('click', () => {
  if (!captchaState.validate) return;
  if (captchaState.validate()) {
    captchaState.step += 1;
    if (captchaState.step >= CAPTCHA_TOTAL) {
      endCaptchaChallenge(true);
      return;
    }
    showCaptchaStep();
  } else {
    captchaError.textContent = "Captcha failed, 5 minutes added! Try again.";
    addPenaltyTime();
  }
});

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
      startCaptchaChallenge();
    } else {
      startSession();
    }
  });
});

blacklistBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  blacklistMenu.style.display = 'block';
  loadSites(); // Reload sites to get correct button states
});
backBtn.addEventListener('click', () => {
  blacklistMenu.style.display = 'none';
  mainMenu.style.display = 'block';
  if (blacklistMessage) blacklistMessage.textContent = ''; // Clear message on back
});
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
