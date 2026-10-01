importScripts('./badge-worker.js');
'use strict';
const CACHE_PREFIX='masarifi-runtime:'+self.registration.scope+':',CACHE=CACHE_PREFIX+'7.14.0-91158f3a3521',FILES=["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./release.json", "./turkish-merchants.json", "./app-experience.js", "./app-experience.css", "./badge-worker.js", "./notification-badge.png"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(CACHE_PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const relative='./'+url.pathname.slice(new URL(self.registration.scope).pathname.length);if(relative==='./admin.html'||relative.startsWith('./admin/'))return;if(relative==='./release.json'||/^\.\/(google-drive|docs)\//.test(relative)||/\.(md|pdf|zip|gs)$/i.test(relative))return;if(!FILES.includes(relative)&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;if(event.request.mode==='navigate')return(await cache.match('./index.html'))||fetch(event.request);return fetch(event.request)})());
});

// Push identity is a separate cache, retained across app upgrades and cleared at logout.
let identityEpoch=0;
const PUSH_PREFS='masarifi-push-preferences';
const PUSH_IMAGE_ORIGIN='https://oxsrajzowlxydzgipquy.supabase.co';
function pushImage(value,expires){try{const u=new URL(value),id='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';if(u.origin!==PUSH_IMAGE_ORIGIN||u.username||u.password||u.hash)return;if(!u.search&&new RegExp('^/storage/v1/object/public/masarifi-announcements/'+id+'[.](jpg|png|webp)$','i').test(u.pathname))return u.href;if(!Number.isFinite(Date.parse(expires))||Date.parse(expires)<=Date.now())return;const token=u.searchParams.get('token');if(u.searchParams.size===1&&token&&token.length<2048&&/^[A-Za-z0-9_.-]+$/.test(token)&&new RegExp('^/storage/v1/object/sign/masarifi-service/'+id+'/'+id+'/'+id+'[.](jpg|png|webp)$','i').test(u.pathname))return u.href;}catch{}}
const alertSettingsURL=()=>new URL('__alert_settings',self.registration.scope).href;
async function alertSettings(){try{const c=await caches.open(PUSH_PREFS),r=await c.match(alertSettingsURL());return r?await r.json():{};}catch{return {};}}
const pushIdentityURL=()=>new URL('__push_identity',self.registration.scope).href;
self.addEventListener('message',event=>{
 if(event.data?.type==='ALERT_SETTINGS')event.waitUntil((async()=>{const p=event.data,c=await caches.open(PUSH_PREFS);await c.put(alertSettingsURL(),new Response(JSON.stringify({shared:p.shared!==false,reminders:p.reminders===true,token:typeof p.token==='string'?p.token.slice(0,200):null})));})());
 if(event.data?.type==='PUSH_ACCOUNT'){const epoch=++identityEpoch;event.waitUntil((async()=>{const c=await caches.open(PUSH_PREFS);if(epoch!==identityEpoch)return;await self.MasarifiBadge.account(event.data.userId||null);if(epoch!==identityEpoch)return;if(event.data.userId)await c.put(pushIdentityURL(),new Response(String(event.data.userId)));else await c.delete(pushIdentityURL());if(epoch!==identityEpoch)return;for(const notice of await self.registration.getNotifications())if(!event.data.userId||notice.data?.userId&&notice.data.userId!==event.data.userId)notice.close();})());}
});
async function sameRecipient(id,epoch){const c=await caches.open(PUSH_PREFS),r=await c.match(pushIdentityURL());return !!r&&await r.text()===id&&epoch===identityEpoch;}
self.addEventListener('push',event=>event.waitUntil((async()=>{
 const epoch=identityEpoch;let p;try{p=event.data?.json()}catch{return;}if(!p||!/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(p.id||'')||!['campaign','system'].includes(p.source||'campaign')||typeof p.title!=='string'||typeof p.body!=='string')return;
 if(!await sameRecipient(p.user_id,epoch))return;
 if(p.kind==='shared_activity'&&(await alertSettings()).shared===false)return;
 if(!Number.isFinite(Date.parse(p.expires_at))||Date.parse(p.expires_at)<=Date.now())return;
 let fresh=true;try{fresh=await self.MasarifiBadge.push(p.user_id,p.id,p.source||'campaign',()=>sameRecipient(p.user_id,epoch),p);}catch{}if(!fresh||!await sameRecipient(p.user_id,epoch))return;
 await showPush(p.title.slice(0,180),{body:p.body.slice(0,2000),image:pushImage(p.image,p.image_expires_at),tag:'masarifi-'+p.id,renotify:false,icon:new URL('icon-192.png',self.registration.scope).href,badge:new URL('notification-badge.png',self.registration.scope).href,data:{id:p.id,userId:p.user_id,source:p.source||'campaign'},dir:'auto',timestamp:Date.now(),silent:await hasForegroundWindow()});
 if(epoch!==identityEpoch){for(const n of await self.registration.getNotifications())if(n.data?.userId===p.user_id)n.close();}else await notifyWindows();
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 const epoch=identityEpoch,target=self.registration.scope,data=event.notification.data||{};
 if(data.kind==='local_reminder'){const prefs=await alertSettings();if(!prefs.reminders||!prefs.token||prefs.token!==data.token||typeof data.id!=='string'||!data.id||data.id.length>200||/[\u0000-\u001f]/.test(data.id)||typeof data.date!=='string'||data.date.length>30||!Number.isFinite(Date.parse(data.date)))return;const message={type:'OPEN_REMINDER',id:data.id,date:data.date,token:data.token};const scope=new URL(target),clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients){const u=new URL(client.url),relative=u.pathname.slice(scope.pathname.length);if(u.origin===scope.origin&&u.pathname.startsWith(scope.pathname)&&relative!=='admin.html'&&!relative.startsWith('admin/')){client.postMessage(message);return client.focus();}}const url=new URL(target);url.searchParams.set('reminder',data.id);url.searchParams.set('reminderDate',data.date);url.searchParams.set('reminderToken',data.token);return self.clients.openWindow(url.href);}
 const c=await caches.open(PUSH_PREFS),identity=await c.match(pushIdentityURL());
 // Legacy notices can open the generic center, never a private destination.
 if(data.userId&&(!identity||await identity.text()!==data.userId))return;
 const id=data.userId&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id||'')?data.id:null;
 const source=data.source==='system'?'system':'campaign';const message={type:'OPEN_NOTIFICATIONS',id,source};
 const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 if(epoch!==identityEpoch||data.userId&&!await sameRecipient(data.userId,epoch))return;
 for(const client of clients){const u=new URL(client.url),scope=new URL(target);if(u.origin===scope.origin&&u.pathname.startsWith(scope.pathname)&&!u.pathname.endsWith('admin.html')&&!u.pathname.slice(scope.pathname.length).startsWith('admin/')){client.postMessage(message);return client.focus();}}
 const url=new URL('?notifications=1',target);if(id){url.searchParams.set('notice',id);url.searchParams.set('source',source);}return self.clients.openWindow(url.href);
})());});

async function notifyWindows(){const scope=new URL(self.registration.scope);for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:false})){const url=new URL(client.url);if(url.origin===scope.origin&&url.pathname.startsWith(scope.pathname))client.postMessage({type:'MASARIFI_PUSH_RECEIVED'});}}

async function hasForegroundWindow(){const scope=new URL(self.registration.scope);return(await self.clients.matchAll({type:'window',includeUncontrolled:false})).some(c=>{const u=new URL(c.url);return u.origin===scope.origin&&u.pathname.startsWith(scope.pathname)&&c.visibilityState==='visible';});}
async function showPush(title,options){const epoch=identityEpoch;if(!await sameRecipient(options.data?.userId,epoch))return;try{await self.registration.showNotification(title,options);}catch(error){if(!options.image)throw error;if(!await sameRecipient(options.data?.userId,epoch))return;delete options.image;await self.registration.showNotification(title,options);}}
