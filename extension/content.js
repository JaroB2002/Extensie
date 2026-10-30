(() => {
  'use strict';
  let records = {}, enabled = true, timer, current = '', session = '';
  const marked = new Set();
  async function send(message) {
    try { return await chrome.runtime.sendMessage(message); } catch { return null; }
  }
  function clearMark(link) {
    link.classList.remove('vk-seen');
    link.querySelectorAll(':scope > .vk-badge').forEach(el => el.remove());
    marked.delete(link);
  }
  function annotate() {
    for (const link of marked) if (!link.isConnected || !enabled || !VacatureCore.key(link.href)) clearMark(link);
    if (!enabled) return;
    for (const link of document.querySelectorAll('a[href]')) {
      const id = VacatureCore.key(link.href);
      if (!id || !link.textContent.trim() || link.closest('[contenteditable="true"]')) { if (marked.has(link)) clearMark(link); continue; }
      const record = records[id];
      const label = record ? `Bekeken ${record.views}×${record.rating ? ` · ${record.rating}/5 ★` : ''}` : 'Nieuw';
      let badge = link.querySelector(':scope > .vk-badge');
      if (!badge) { badge = document.createElement('span'); badge.className = 'vk-badge'; link.append(badge); }
      if (badge.textContent !== label) badge.textContent = label;
      badge.setAttribute('aria-label', `VacatureKompas: ${label}`);
      link.classList.toggle('vk-seen', !!record);
      marked.add(link);
    }
  }
  async function navigate() {
    if (!enabled) return;
    const id = VacatureCore.key(location.href);
    if (id === current) return;
    current = id;
    if (!id || !enabled) return;
    session = crypto.randomUUID();
    await send({type:'visit',url:location.href,title:document.querySelector('h1')?.textContent || document.title,session});
    const data = await send({type:'read'});
    if (data?.records) records = data.records;
    annotate();
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(annotate, 250); }
  async function init() {
    const data = await send({type:'read'});
    if (!data || data.error) return;
    records = data.records; enabled = data.enabled;
    await navigate(); annotate();
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'attributes' ? m.attributeName === 'href' : [...m.addedNodes,...m.removedNodes].some(n => n.nodeType === 1 && !n.classList?.contains('vk-badge')))) schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.records) records = changes.records.newValue || {};
      if (changes.enabled) { enabled = changes.enabled.newValue; void navigate(); }
      schedule();
    });
    // SPA navigation does not trigger a document reload.
    setInterval(() => { if (document.visibilityState === 'visible') void navigate(); }, 1000);
  }
  void init();
})();
