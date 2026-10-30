// Runs production background, content and popup code. Chrome APIs are simulated:
// this environment's managed Chromium disallows unpacked extension installation.
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs/promises');
const vm=require('node:vm');
const http=require('node:http');
const assert=require('node:assert/strict');
(async()=>{
 const extension=path.resolve(__dirname,'../extension');
 const core=await fs.readFile(path.join(extension,'core.js'),'utf8');
 const content=await fs.readFile(path.join(extension,'content.js'),'utf8');
 const background=await fs.readFile(path.join(extension,'background.js'),'utf8');
 const files={};for(const name of ['popup.html','popup.js','popup.css'])files[name]=await fs.readFile(path.join(extension,name));
 const server=http.createServer((req,res)=>{
  const name=req.url.slice(1);
  if(files[name]) {res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(files[name]);return;}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.url.startsWith('/jobs/')?'<h1>Software Engineer</h1>':'<h1>Vacatures</h1><a href="/jobs/engineer?utm_source=test">Software Engineer</a><a href="/about">Over ons</a>');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context,handler; const stored={}; const tabs=new Map();let nextTab=1;
 const sandbox={VacatureCore:require('../extension/core.js'),importScripts(){},chrome:{runtime:{id:'test-extension',onMessage:{addListener(fn){handler=fn;}}},storage:{local:{async get(){return structuredClone(stored);},async set(update){const changes={};for(const [k,v] of Object.entries(update)){changes[k]={newValue:v};stored[k]=structuredClone(v);}await Promise.all(context.pages().map(page=>page.evaluate(changes=>globalThis.__storageChanged?.(changes),changes).catch(()=>{})));}}}}};
 vm.runInNewContext(background,sandbox);
 async function setup(){
  context=await browser.newContext();
  await context.exposeBinding('__message',({page},message)=>new Promise(resolve=>{
   if(!tabs.has(page))tabs.set(page,nextTab++);
   handler(message,{id:'test-extension',url:page.url(),tab:{id:tabs.get(page)}},resolve);
  }));
  await context.addInitScript(()=>{
   const listeners=[];
   globalThis.chrome={runtime:{sendMessage:message=>globalThis.__message(message)},storage:{onChanged:{addListener:fn=>listeners.push(fn)}}};
   globalThis.__storageChanged=changes=>listeners.forEach(fn=>fn(changes,'local'));
  });
  await context.addInitScript({content:core+'\n'+content});
 }
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  await setup();
  const base=`http://127.0.0.1:${server.address().port}`;
  const listing=await context.newPage();await listing.goto(base);
  await listing.locator('.vk-badge').waitFor();assert.equal(await listing.locator('.vk-badge').innerText(),'Nieuw');
  assert.equal(await listing.locator('a[href="/about"] .vk-badge').count(),0);
  const detail=await context.newPage();await detail.goto(base+'/jobs/engineer');
  await listing.getByText('Bekeken 1×',{exact:true}).waitFor();
  const popup=await context.newPage();await popup.goto(base+'/popup.html');
  await popup.locator('.card').waitFor();assert.equal(await popup.locator('#count').innerText(),'1');
  await popup.locator('.card select').selectOption('5');await listing.getByText('Bekeken 1× · 5/5 ★',{exact:true}).waitFor();
  await detail.reload();await listing.getByText('Bekeken 2× · 5/5 ★',{exact:true}).waitFor();
  await popup.locator('#enabled').uncheck();await listing.waitForFunction(()=>document.querySelectorAll('.vk-badge').length===0);
  await popup.locator('#enabled').check();await listing.locator('.vk-badge').waitFor();
  const second=await context.newPage();await second.goto(base+'/jobs/engineer');
  await popup.waitForFunction(()=>document.querySelector('.meta')?.textContent.includes('3× bekeken'));
  await listing.evaluate(()=>{const a=document.createElement('a');a.href='/jobs/designer';a.textContent='Designer';document.body.append(a);});
  await listing.locator('a[href="/jobs/designer"] .vk-badge').waitFor();
  await listing.locator('a[href="/jobs/designer"]').evaluate(a=>a.href='/jobs/engineer');
  await listing.waitForFunction(()=>document.querySelectorAll('.vk-seen').length===2);
  await popup.locator('#search').fill('onbestaande vacature');await popup.getByText('Geen vacatures gevonden.').waitFor();
  await popup.locator('#search').fill('');await popup.locator('.card').waitFor();
  const downloadPromise=popup.waitForEvent('download');await popup.locator('#export').click();
  const download=await downloadPromise;const exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(exported.vacatures[0].rating,5);assert.equal(exported.vacatures[0].sessionId,undefined);
  // New browser context with the same simulated persistent storage.
  await context.close();await setup();
  const restored=await context.newPage();await restored.goto(base+'/popup.html');
  await restored.locator('.card').waitFor();assert.equal(await restored.locator('.card select').inputValue(),'5');
  restored.on('dialog',dialog=>dialog.accept());await restored.locator('#clear').click();await restored.waitForFunction(()=>document.getElementById('count').textContent==='0');
  console.log('PASS: Chromium integration with simulated Chrome APIs: labels, visits, ratings, pause, tabs, dynamic links, search, export, retained data, deletion. Native extension loading is untested (administrator policy).');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
