chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.action !== "OFFSCREEN_PLAY") return;
  const audio = new Audio(chrome.runtime.getURL(message.file));
  audio.volume = 1.0;
  audio.play().catch(() => { /* Playback might be blocked */ });
});
