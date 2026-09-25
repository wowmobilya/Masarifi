'use strict';
const CACHE='masarifi-v5-b5fb26ccd7ed',FILES=["./", "./index.html", "./manifest.webmanifest", "./assets/jszip.min.js", "./assets/engine.js", "./assets/bank.js", "./assets/v5-core.js", "./assets/base-app.js", "./assets/locales.js", "./assets/v5-labels.js", "./assets/v5-app.js", "./assets/v5-services.js", "./assets/assistant-v5.js", "./assets/base.css", "./assets/v5.css", "./assets/icon-48.png", "./assets/icon-180.png", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon-maskable.png", "./assets/brand.webp"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('masarifi-v5-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const relative='./'+url.pathname.slice(new URL(self.registration.scope).pathname.length);if(!FILES.includes(relative)&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;if(event.request.mode==='navigate')return(await cache.match('./index.html'))||fetch(event.request);return fetch(event.request)})());
});
