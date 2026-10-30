importScripts('core.js');
let queue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  queue = queue.catch(() => {}).then(async () => {
    const {records = {}, enabled = true} = await chrome.storage.local.get(['records','enabled']);
    if (message.type === 'read') return {records, enabled};
    if (message.type === 'visit' && enabled && sender.tab) {
      // Use the browser's URL, never an arbitrary URL supplied by a page.
      if (VacatureCore.key(sender.url) !== VacatureCore.key(message.url)) return {ok:false};
      const updated = VacatureCore.visit(records, sender.url, message.title, `${sender.tab.id}:${message.session}`);
      await chrome.storage.local.set({records:updated});
    } else if (message.type === 'rate') {
      const id = VacatureCore.key(message.url);
      if (!id || !records[id] || !Number.isInteger(message.rating) || message.rating < 0 || message.rating > 5) return {ok:false};
      records[id].rating = message.rating;
      await chrome.storage.local.set({records});
    } else if (message.type === 'delete') {
      delete records[message.url];
      await chrome.storage.local.set({records});
    } else if (message.type === 'clear') {
      await chrome.storage.local.set({records:{}});
    } else if (message.type === 'enabled' && typeof message.enabled === 'boolean') {
      await chrome.storage.local.set({enabled:message.enabled});
    }
    return {ok:true};
  });
  queue.then(respond, () => respond({error:'Opslaan mislukt. Probeer opnieuw.'}));
  return true;
});
