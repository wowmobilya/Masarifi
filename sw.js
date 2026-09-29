'use strict';
const CACHE='masarifi-v9-4659519ca503',FILES=["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./release.json"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(/^masarifi-v[56789]-/.test(key)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const relative='./'+url.pathname.slice(new URL(self.registration.scope).pathname.length);if(relative==='./admin.html'||relative.startsWith('./admin/'))return;if(relative==='./release.json'||/^\.\/(google-drive|docs)\//.test(relative)||/\.(md|pdf|zip|gs)$/i.test(relative))return;if(!FILES.includes(relative)&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;if(event.request.mode==='navigate')return(await cache.match('./index.html'))||fetch(event.request);return fetch(event.request)})());
});

// Push identity is a separate cache, retained across app upgrades and cleared at logout.
const PUSH_PREFS='masarifi-push-preferences';
const PUSH_IMAGE_ORIGIN='https://oxsrajzowlxydzgipquy.supabase.co';
function pushImage(value){try{const u=new URL(value);return u.origin===PUSH_IMAGE_ORIGIN&&!u.search&&!u.hash&&/^\/storage\/v1\/object\/public\/masarifi-announcements\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(u.pathname)?u.href:undefined;}catch{return undefined;}}
const pushIdentityURL=()=>new URL('__push_identity',self.registration.scope).href;
self.addEventListener('message',event=>{if(event.data?.type==='PUSH_ACCOUNT')event.waitUntil((async()=>{const c=await caches.open(PUSH_PREFS);if(event.data.userId)await c.put(pushIdentityURL(),new Response(String(event.data.userId)));else{await c.delete(pushIdentityURL());for(const n of await self.registration.getNotifications())n.close();}})());});
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let p;try{p=event.data?.json()}catch{return;}if(!p||typeof p.id!=='string'||typeof p.title!=='string'||typeof p.body!=='string')return;
 const c=await caches.open(PUSH_PREFS),identity=await c.match(pushIdentityURL());if(!identity||await identity.text()!==p.user_id)return;
 if(!Number.isFinite(Date.parse(p.expires_at))||Date.parse(p.expires_at)<=Date.now())return;
 await self.registration.showNotification(p.title.slice(0,180),{body:p.body.slice(0,2000),image:pushImage(p.image),tag:'masarifi-'+p.id,renotify:false,icon:new URL('icon-192.png',self.registration.scope).href,badge:new URL('icon-192.png',self.registration.scope).href,data:{id:p.id,url:self.registration.scope},dir:'auto'});
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const target=self.registration.scope;const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients){const u=new URL(client.url),scope=new URL(target);if(u.origin===scope.origin&&u.pathname.startsWith(scope.pathname)&&!u.pathname.endsWith('admin.html')){client.postMessage({type:'OPEN_NOTIFICATIONS'});return client.focus();}}return self.clients.openWindow(new URL('?notifications=1',target).href);})());});
