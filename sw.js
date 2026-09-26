'use strict';
const CACHE='masarifi-v7-f0e9909b1371',FILES=["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./release.json"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(/^masarifi-v[567]-/.test(key)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const relative='./'+url.pathname.slice(new URL(self.registration.scope).pathname.length);if(relative==='./release.json'||/^\.\/(google-drive|docs)\//.test(relative)||/\.(md|pdf|zip|gs)$/i.test(relative))return;if(!FILES.includes(relative)&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;if(event.request.mode==='navigate')return(await cache.match('./index.html'))||fetch(event.request);return fetch(event.request)})());
});
