const DEFAULT_BLACKLIST = [
    "reddit.com",
    "twitter.com",
    "x.com",
    "youtube.com"
  ];
  
  const siteList = document.getElementById('siteList');
  const newSiteInput = document.getElementById('newSite');
  const addBtn = document.getElementById('addBtn');
  
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
    chrome.storage.sync.get(['blacklist'], (result) => {
      const blacklist = result.blacklist || DEFAULT_BLACKLIST;
      renderList(blacklist);
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
  
  addBtn.addEventListener('click', addSite);
  document.addEventListener('DOMContentLoaded', loadSites);