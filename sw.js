/* MVP01 clinical release candidate: offline shell. Patient data is never stored in the service worker cache.
 * This worker caches only the exact immutable list of release assets below.
 * Release only after validation of isolated origin and clinical operations.
 */
'use strict';
const CACHE_PREFIX='msw-mvp01-clinical-rc-';
const CACHE=CACHE_PREFIX+'20261128-ux28-bed-arrows-v2';
const ASSETS=[
  './', './index.html',
  './pwa-updater.js?v=mvp01-sec13-20261027-journal-print-jp01',
  './styles.css?v=jp01-rx046-kana01-20261029',
  './app.js?v=unlock-diagnose-20261127-v1',
  './rx035-addon.js?v=jp01-rx046-20261028',
  './rx036-master-editor.js?v=ux06-drug-return-20261105-v1',
  './rx037-structured-editor.js?v=jp01-rx046-20261028',
  './rx038-multiple-originals.js?v=jp01-rx046-20261028',
  './rx039-layout.js?v=jp01-rx046-20261028',
  './rx042-five-line-list.js?v=jp01-rx046-20261028',
  './rx043-compact-editor.js?v=jp01-rx046-20261028',
  './rx048-master-clean-layout.js?v=rx048-compact-20261118-v1',
  './rx049-category-filter.js?v=rx049-category-search-20261118-v1',
  './rx045-patient-brand-search.js?v=jp01-rx046-20261028',
  './rx046-strength-sort.js?v=jp01-rx046-20261028',
  './rx047-drug-master-backup.js?v=rx047-litev01-20261031',
  './ux05-drug-review-progress.js?v=ux05-review-20261104-v1',
  './kana02-core.js?v=kana03-20261031-coverage1',
  './kana02-addon.js?v=kana02-20261031-anon-diagnostic1',
  './kana05-new-patient-ime.js?v=kana05-new-ime-dev-20261102',
  './ptb01-patient-text-backup.js?v=ptb01-dev1-20261102',
  './ptb02-backup-inspector.js?v=ptb02-verify-v1-20261102',
  './ux01-scroll-return.js?v=ux01-scroll-ux28-20261128-v1',
  './ux02-journal-discharge.js?v=ux02-journal-discharge-20261104-v1',
  './ux03-journal-patient-view.js?v=ux03-journal-patient-view-20261104-v1',
  './ux07-morning-print-fourup.js?v=ux07-fourup-20261105-v1',
  './ux08-bed-search-return.js?v=ux08-transfer-return-20261106-v3',
  './ux10-fixed-tray-drag.js?v=ux11-longpress-20261111-v1',
  './ux18-ux10-move-bridge.js?v=ux18-20261119-v1',
  './ux12-tray-visibility.js?v=ux13-20261112-v1',
  './ux18-patient-search-destination.js?v=ux18-compact-20261119-v2',
  './ux14-journal-scan-hide.js?v=ux14-20261113-v1',
  './ux15-discharge-doctor.js?v=ux15-20261118-v1',
  './ux16-journal-entry-scroll.js?v=ux16-20261118-v1',
  './ux19-dose-schedule.js?v=ux19-doses-20261120-v1',
  './ux17-patient-med-layout.js?v=ux17-20261118-v1',
  './ux17-medication-compact-list.js?v=ux19-quantity-20261120-v1',
  './ux17-existing-medication-edit.js?v=ux19-edit-20261120-v1',
  './ux17-generic-choices.js?v=ux17-20261118-v1',
  './ux17-selection-wizard.js?v=ux19-register-20261120-v1',
  './ux17-prescription-print.js?v=ux19-print-20261120-v1',
  './ux20-inline-print-return.js?v=ux20-morning-print-cssfix-20261120-v3',
  './ux20-native-share-prescription.js?v=ux20-native-share-20261120-v1',
  './ux20-direct-airprint-primary.js?v=ux20-direct-primary-20261120-v1',
  './ux21-screen-viewport.css?v=ux21-20261121-v1',
  './ux21-orientation-guard.js?v=ux21-20261121-v1',
  './ux17-hide-reference-panel.css?v=ux17-20261118-v1',
  './ux10-fixed-tray-drag.css?v=ux11-longpress-20261111-v1',
  './ux27-integration.css?v=ux27-failopen-20261127-v2',
  './ux27-host.js?v=ux27-failopen-20261127-v2',
  './ux27-integration.js?v=ux27-native-voice-one-tap-20261128-v1',
  './ux28-bed-arrows.css?v=ux28-arrows-20261128-v2',
  './ux28-bed-arrows.js?v=ux28-arrows-20261128-v2',
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
