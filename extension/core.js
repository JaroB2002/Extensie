(function (root) {
  'use strict';
  const LIMIT = 3000;
  function key(input) {
    let u;
    try { u = new URL(input); } catch { return null; }
    if (!['https:', 'http:'].includes(u.protocol)) return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (/(^|\.)linkedin\.com$/.test(host)) {
      const id = u.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)\/?$/)?.[1] || u.searchParams.get('currentJobId');
      return id && /^\d+$/.test(id) ? `https://linkedin.com/jobs/view/${id}` : null;
    }
    if (/(^|\.)indeed\.com$/.test(host) || /(^|\.)indeed\.[a-z.]+$/.test(host)) {
      const id = u.searchParams.get('jk') || u.searchParams.get('vjk');
      return id && /^[\w-]+$/.test(id) ? `https://${host}/viewjob?jk=${id}` : null;
    }
    const path = u.pathname.replace(/\/+$/, '');
    // Only detail paths: never job search/category pages or unrelated links.
    const generic = /\/(?:jobs?|vacatures?|positions?|stellenangebote)\/(?:view\/)?[^/]+(?:\/[^/]+)*$/i.test(path);
    const ats = /(^|\.)(?:greenhouse\.io|lever\.co|ashbyhq\.com)$/.test(host) && path.split('/').filter(Boolean).length >= 2;
    if (!generic && !ats) return null;
    if (/\/(?:search|zoeken|results|saved|collections|recommended|all|categories|category|locations?|alert|alerts)(?:\/|$)/i.test(path)) return null;
    u.hostname = host;
    u.pathname = path;
    u.hash = '';
    const keep = [...u.searchParams.entries()].filter(([k]) => /^(?:id|jobid|job_id|gh_jid|requisitionid)$/i.test(k)).sort();
    u.search = '';
    keep.forEach(([k,v]) => u.searchParams.append(k,v));
    return u.href;
  }
  function cleanTitle(value) { return String(value || 'Vacature').replace(/\s+/g, ' ').trim().slice(0, 180) || 'Vacature'; }
  function visit(records, url, title, sessionId, now = Date.now()) {
    const id = key(url);
    if (!id) return records;
    const old = records[id];
    const next = {...records, [id]: {url:id, title:cleanTitle(title), views:(old?.views || 0) + (old?.sessionId === sessionId ? 0 : 1), rating:old?.rating || 0, firstSeen:old?.firstSeen || now, lastSeen:now, sessionId}};
    const ordered = Object.entries(next).sort((a,b) => b[1].lastSeen-a[1].lastSeen).slice(0,LIMIT);
    return Object.fromEntries(ordered);
  }
  const api = {key, cleanTitle, visit, LIMIT};
  root.VacatureCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
