'use strict';
let records = {};
const $ = id => document.getElementById(id);
async function send(message) {
  try {
    const result = await chrome.runtime.sendMessage(message);
    if (!result || result.error || result.ok === false) throw new Error();
    return result;
  } catch { $('status').textContent = 'De gegevens konden niet worden verwerkt. Sluit dit venster en probeer opnieuw.'; return null; }
}
function render() {
  const q = $('search').value.toLocaleLowerCase('nl');
  const entries = Object.values(records).filter(r => `${r.title} ${r.url}`.toLocaleLowerCase('nl').includes(q));
  const sort = $('sort').value;
  entries.sort((a,b) => sort === 'rating' ? b.rating-a.rating || b.lastSeen-a.lastSeen : sort === 'views' ? b.views-a.views || b.lastSeen-a.lastSeen : b.lastSeen-a.lastSeen);
  $('count').textContent = Object.keys(records).length;
  $('list').replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('p'); empty.className = 'empty';
    empty.textContent = q ? 'Geen vacatures gevonden.' : 'Je begint met een schone lei. Open een vacature op een vacaturesite: je vindt die daarna hier terug.';
    $('list').append(empty);
  }
  for (const r of entries) {
    const card = document.createElement('article'); card.className = 'card';
    const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = r.title;
    const meta = document.createElement('p'); meta.className = 'meta'; meta.textContent = `${new URL(r.url).hostname} · ${r.views}× bekeken · ${new Date(r.lastSeen).toLocaleDateString('nl-BE')}`;
    const actions = document.createElement('div'); actions.className = 'actions';
    const rating = document.createElement('select'); rating.setAttribute('aria-label',`Beoordeling voor ${r.title}`);
    for (let i=0;i<=5;i++) { const option=document.createElement('option'); option.value=i; option.textContent=i ? `${'★'.repeat(i)} · ${i}/5` : 'Nog geen beoordeling'; rating.append(option); }
    rating.value = r.rating;
    rating.addEventListener('change',async () => { await send({type:'rate',url:r.url,rating:Number(rating.value)}); });
    const remove = document.createElement('button'); remove.textContent='Verwijder'; remove.setAttribute('aria-label',`Verwijder ${r.title}`);
    remove.addEventListener('click',async () => { await send({type:'delete',url:r.url}); });
    actions.append(rating,remove); card.append(a,meta,actions); $('list').append(card);
  }
}
async function load() {
  const data = await send({type:'read'});
  if (!data) return;
  records = data.records; $('enabled').checked = data.enabled; render();
}
$('search').addEventListener('input',render); $('sort').addEventListener('change',render);
$('enabled').addEventListener('change',async () => { const result=await send({type:'enabled',enabled:$('enabled').checked}); if (!result) await load(); });
$('clear').addEventListener('click',async () => { if (confirm('Alle vacaturegeschiedenis en beoordelingen definitief wissen?')) await send({type:'clear'}); });
$('export').addEventListener('click',() => {
  const items=Object.values(records).map(({sessionId,...record})=>record);
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),vacatures:items},null,2)],{type:'application/json'}));
  const a=document.createElement('a'); a.href=url; a.download='vacaturekompas-export.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('status').textContent='Export aangemaakt. Bewaar dit bestand privé: het bevat je vacaturegeschiedenis.';
});
chrome.storage.onChanged.addListener((changes,area) => { if(area==='local') void load(); });
void load();
