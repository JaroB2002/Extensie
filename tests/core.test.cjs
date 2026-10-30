const {test}=require('node:test');
const assert=require('node:assert/strict');
const {key,visit,LIMIT}=require('../extension/core.js');
test('LinkedIn URL variants share a stable identity',()=>{
  assert.equal(key('https://www.linkedin.com/jobs/view/engineer-123456/?trackingId=secret'), 'https://linkedin.com/jobs/view/123456');
  assert.equal(key('https://www.linkedin.com/jobs/search/?currentJobId=123456'),'https://linkedin.com/jobs/view/123456');
});
test('Indeed tracking is removed, job ID retained',()=>{
  assert.equal(key('https://be.indeed.com/rc/clk?jk=abc123&from=search'),key('https://be.indeed.com/viewjob?vjk=abc123'));
});
test('generic detail URLs and ATS supported, unrelated/search URLs ignored',()=>{
  assert.equal(key('https://example.com/jobs/engineer?utm_source=mail#apply'),'https://example.com/jobs/engineer');
  assert.ok(key('https://jobs.lever.co/company/a-unique-job-id'));
  for(const u of ['javascript:alert(1)','https://example.com/about','https://example.com/jobs','https://example.com/jobs/search','https://linkedin.com/feed/']) assert.equal(key(u),null);
});
test('only one visit per document session, ratings retained across visits',()=>{
  const url='https://example.com/jobs/engineer';
  let records=visit({},url,' Engineer\n role ','tab:1',100);
  records=visit(records,url,'Engineer role','tab:1',101);
  assert.equal(records[url].views,1);
  records[url].rating=5;
  records=visit(records,url,'Engineer role','tab:2',200);
  assert.equal(records[url].views,2); assert.equal(records[url].rating,5); assert.equal(records[url].firstSeen,100);
});
test('bounded retention removes least recently seen record',()=>{
  const records={};
  for(let i=0;i<LIMIT;i++) records[`https://example.com/jobs/${i}`]={lastSeen:i};
  const next=visit(records,'https://example.com/jobs/new','new','s',LIMIT+1);
  assert.equal(Object.keys(next).length,LIMIT); assert.equal(next['https://example.com/jobs/0'],undefined);
});
