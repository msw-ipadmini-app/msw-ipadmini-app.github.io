/* MVP01 clinical release candidate: offline shell. Patient data is never stored in the service worker cache.
 * This worker caches only the exact immutable list of release assets below.
 * Release only after validation of isolated origin and clinical operations.
 */
'use strict';
const CACHE_PREFIX='msw-mvp01-clinical-rc-';
const CACHE=CACHE_PREFIX+'20261031-kana03-rc1-draft';
const ASSETS=[
  './', './index.html',
  './pwa-updater.js?v=mvp01-sec13-20261027-journal-print-jp01',
  './styles.css?v=jp01-rx046-kana01-20261029',
  './app.js?v=jp01-rx046-kana01-20261029',
  './rx035-addon.js?v=jp01-rx046-20261028',
  './rx036-master-editor.js?v=jp01-rx046-20261028',
  './rx037-structured-editor.js?v=jp01-rx046-20261028',
  './rx038-multiple-originals.js?v=jp01-rx046-20261028',
  './rx039-layout.js?v=jp01-rx046-20261028',
  './rx042-five-line-list.js?v=jp01-rx046-20261028',
  './rx043-compact-editor.js?v=jp01-rx046-20261028',
  './rx045-patient-brand-search.js?v=jp01-rx046-20261028',
  './rx046-strength-sort.js?v=jp01-rx046-20261028',
  './rx047-drug-master-backup.js?v=rx047-litev01-20261031',
  './kana02-core.js?v=kana02-20261031',
  './kana03-surnames.js?v=kana03-20261031-rc1',
  './kana03-given-01.js?v=kana03-20261031-rc1',
  './kana03-given-02.js?v=kana03-20261031-rc1',
  './kana03-given-03.js?v=kana03-20261031-rc1',
  './kana03-given-04.js?v=kana03-20261031-rc1',
  './kana03-given-05.js?v=kana03-20261031-rc1',
  './kana03-given-06.js?v=kana03-20261031-rc1',
  './kana03-given-07.js?v=kana03-20261031-rc1',
  './kana03-given-08.js?v=kana03-20261031-rc1',
  './kana03-core.js?v=kana03-20261031-rc1',
  './kana03-addon.js?v=kana03-20261031-rc1',
  './KANA03_THIRD_PARTY_NOTICES.txt',
  './manifest.webmanifest', './icon.svg', './icon-apple.svg',
  './icon-192.png', './icon-512.png'
];
const CACHEABLE=new Set(ASSETS.map(p=>new URL(p,self.registration.scope).href));
const INDEX=new URL('./index.html',self.registration.scope).href;
const ROOT=new URL('./',self.registration.scope).href;
self.addEventListener('message',e=>{
  if(e.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(ASSETS))
));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return;
  // No routes except app entry points; never handle or cache user files,
  // JSON endpoints, unexpected queries, or other same-origin resources.
  if(!CACHEABLE.has(url.href))return;
  if(e.request.mode==='navigate'&&url.href!==INDEX&&url.href!==ROOT)return;
  e.respondWith(fetch(e.request,{cache:'no-store',redirect:'error'}).then(r=>{
    if(!r.ok||r.type!=='basic'||r.redirected||new URL(r.url).origin!==self.location.origin){
      throw new Error('Unexpected application response');
    }
    const copy=r.clone();
    e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{}));
    return r;
  }).catch(async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(e.request);
    if(cached)return cached;
    if(e.request.mode==='navigate')return (await cache.match(INDEX))||Response.error();
    return Response.error();
  }));
});
