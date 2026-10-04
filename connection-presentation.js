/* Read-only presentation and entry routing. Licensing, payment and sync services stay authoritative. */
(function(root){'use strict';
const A=root.App,O=root.Online,V6=root.V6,P=root.MasarifiSubscription,doc=root.document;
if(!A||!O||!V6||!P||root.MasarifiConnection)return;
const langs=['ar','en','tr','fr'],words={
 title:['الاتصال والمشاركة','Connection and sharing','Bağlantı ve paylaşım','Connexion et partage'],
 activate:['تفعيل أونلاين','Activate online','Çevrimiçi modu etkinleştir','Activer le mode en ligne'],
 manage:['إعدادات الاتصال والمزامنة','Connection and sync settings','Bağlantı ve eşitleme ayarları','Réglages de connexion et synchronisation'],
 intro:['ابدأ من الباقات وخطوات التفعيل. استخدامك المحلي يبقى مجانيًا.','Start with plans and activation steps. Your local use stays free.','Paketler ve etkinleştirme adımlarıyla başlayın. Yerel kullanımınız ücretsiz kalır.','Commencez par les offres et les étapes d’activation. L’utilisation locale reste gratuite.'],
 activeIntro:['راجع اتصال هذا الجهاز وحالة المزامنة، وافتح إعداداته عند الحاجة.','Review this device’s connection and sync status, then open its settings when needed.','Bu cihazın bağlantı ve eşitleme durumunu inceleyin; gerektiğinde ayarlarını açın.','Consultez la connexion et la synchronisation de cet appareil, puis ouvrez ses réglages si nécessaire.'],
 pendingIntro:['طلبك الحالي بانتظار المراجعة. افتحه لمتابعة الرد وإثبات الدفع.','Your current request is awaiting review. Open it to follow replies and payment evidence.','Mevcut talebiniz incelenmeyi bekliyor. Yanıtları ve ödeme belgesini takip etmek için açın.','Votre demande attend une vérification. Ouvrez-la pour suivre les réponses et le justificatif de paiement.'],
 expiredIntro:['انتهت مدة الاشتراك. راجع الباقات لتقديم طلب تجديد صريح.','Your subscription has expired. Review plans to send an explicit renewal request.','Aboneliğiniz sona erdi. Yenileme talebi göndermek için paketleri inceleyin.','Votre abonnement a expiré. Consultez les offres pour envoyer une demande de renouvellement.'],
 follow:['متابعة طلب التفعيل','Follow activation request','Etkinleştirme talebini takip et','Suivre la demande d’activation'],
 renew:['تجديد الاشتراك','Renew subscription','Aboneliği yenile','Renouveler l’abonnement'],
 network:['إنترنت الجهاز','Browser network','Cihazın interneti','Réseau de l’appareil'],
 online:['المتصفح يبلغ عن اتصال بالشبكة','Browser reports online','Tarayıcı çevrimiçi bildiriyor','Le navigateur indique être en ligne'],
 offline:['المتصفح يبلغ عن عدم الاتصال','Browser reports offline','Tarayıcı çevrimdışı bildiriyor','Le navigateur indique être hors ligne'],
 identity:['الهوية وتسجيل الدخول','Identity and sign-in','Kimlik ve oturum açma','Identité et connexion'],
 networkHint:['توفر الإنترنت لا يعني تفعيل الاشتراك.','Internet availability does not confirm an active subscription.','İnternetin olması aboneliğin etkin olduğunu doğrulamaz.','La présence d’Internet ne confirme pas l’activation d’un abonnement.'],
 license:['الاشتراك','Subscription','Abonelik','Abonnement'],
 local:['استخدام محلي مجاني','Free local use','Ücretsiz yerel kullanım','Utilisation locale gratuite'],
 active:['اشتراك فعال','Active subscription','Etkin abonelik','Abonnement actif'],
 pending:['طلب بانتظار المراجعة','Request awaiting review','İnceleme bekleyen talep','Demande en attente de vérification'],
 expired:['اشتراك منتهٍ','Expired subscription','Süresi dolmuş abonelik','Abonnement expiré'],
 unverified:['حالة الاشتراك غير مؤكدة','Subscription status unverified','Abonelik durumu doğrulanmadı','État de l’abonnement non vérifié'],
 cached:['آخر حالة مؤكدة؛ اتصل لتحديثها.','Last verified status; connect to refresh.','Son doğrulanan durum; yenilemek için bağlanın.','Dernier état vérifié ; connectez-vous pour actualiser.'],
 localHint:['بياناتك المحلية متاحة على هذا الجهاز.','Your local data is available on this device.','Yerel verileriniz bu cihazda kullanılabilir.','Vos données locales restent disponibles sur cet appareil.'],
 sync:['مزامنة الأجهزة','Device sync','Cihaz eşitlemesi','Synchronisation des appareils'],
 unlicensed:['تحتاج إلى اشتراك فعال','Requires an active subscription','Etkin abonelik gerekli','Abonnement actif requis'],
 paused:['متوقفة في الوضع المحلي','Paused in local mode','Yerel modda duraklatıldı','Suspendue en mode local'],
 waiting:['تنتظر عودة الاتصال','Waiting for connection','Bağlantı bekleniyor','En attente de connexion'],
 syncing:['جارٍ مزامنة التغييرات','Syncing changes','Değişiklikler eşitleniyor','Synchronisation en cours'],
 ready:['المزامنة جاهزة','Sync ready','Eşitleme hazır','Synchronisation prête'],
 disabled:['المزامنة غير مفعّلة في الاشتراك','Sync is not enabled for this subscription','Bu abonelikte eşitleme etkin değil','Synchronisation désactivée pour cet abonnement'],
 attention:['تحتاج إلى مراجعة','Needs attention','İncelenmesi gerekiyor','Vérification nécessaire'],
 syncUnknown:['حالة المزامنة غير مؤكدة','Sync status unverified','Eşitleme durumu doğrulanmadı','État de synchronisation non vérifié'],
 syncHint:['الحالة تعتمد على الترخيص وإعدادات الجهاز والاتصال.','Status depends on the license, device settings and connection.','Durum; lisansa, cihaz ayarlarına ve bağlantıya bağlıdır.','L’état dépend de la licence, des réglages et de la connexion.'],
 plans:['الباقات وحالة الطلب','Plans and request status','Paketler ve talep durumu','Offres et suivi de la demande'],
 shared:['فتح الصناديق المشتركة','Open shared accounts','Paylaşılan kasaları aç','Ouvrir les comptes partagés'],
 lastSync:['آخر مزامنة','Last sync','Son eşitleme','Dernière synchronisation'],
 pendingChanges:['تغييرات تنتظر الإرسال','Changes waiting to send','Gönderilmeyi bekleyen değişiklikler','Modifications en attente d’envoi'],
 noAutomatic:['اختيار الباقة لا يرسل طلبًا ولا يؤكد الدفع.','Selecting a plan does not send a request or confirm payment.','Paket seçimi talep göndermez veya ödemeyi onaylamaz.','Choisir une offre n’envoie aucune demande et ne confirme aucun paiement.']
};
const t=k=>words[k]?.[langs.indexOf(A.prefs.language)]||words[k]?.[1]||k,esc=v=>root.Core.escape(String(v??'')),guest=()=>!!O.Workspace?.guest();
const paths={cloud:'M6 18a4 4 0 0 1-.6-7.95A6.5 6.5 0 0 1 18 8.5a4.75 4.75 0 0 1 0 9.5M9 15l3-3 3 3M12 12v9',online:'M2 8.5a16 16 0 0 1 20 0M5.5 12a10.5 10.5 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01',offline:'M2 2l20 20M5 7a16 16 0 0 1 17 1.5M2 8.5l1-.7M7 11a10.5 10.5 0 0 1 11.5 1M5.5 12l.5-.4M9 15.5a5 5 0 0 1 6 0M12 19h.01',local:'M5 3h14v18H5zM9 17h6',active:'M8 12l3 3 5-6M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6z',pending:'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18M12 7v5l3 2',expired:'M6 4l12 16M18 4L6 20M5 3h14M5 21h14',sync:'M20 7h-6M20 7V1M4 17h6M4 17v6M20 7a8 8 0 0 0-14-3M4 17a8 8 0 0 0 14 3',link:'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2'};
const C=root.MasarifiConnection={
 icon(kind){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" data-connection-icon="${esc(kind)}"><path d="${paths[kind]||paths.sync}"/></svg>`;},
 state(){const status=P.licenseState(),network=navigator.onLine===false?'offline':'online',live=O.syncStatus?.()||{};let sync='unlicensed';if(status.kind==='unverified')sync='syncUnknown';else if(status.active){sync=O.networkPaused?'paused':network==='offline'?'waiting':!O.sessionReady?'waiting':status.sub?.sync_enabled===false?'disabled':status.sub?.sync_enabled!==true?'syncUnknown':O.ownerAllowed===false||Number(O.conflictCount)>0||live.rejected>0||['error','retrying'].includes(live.state)?'attention':live.state==='syncing'?'syncing':live.state==='ready'&&O.ownerAllowed===true?'ready':'waiting';}return{...status,entitlement:status.kind,network,sync,pendingChanges:Math.max(0,Number(live.pending)||0),lastSync:live.lastSync||O.lastSync||null};},
 statusHTML(s=this.state()){const items=[['network',s.network,s.network,'networkHint'],['license',s.entitlement,s.active?'active':s.entitlement==='pending'?'pending':s.entitlement==='expired'?'expired':'local',s.cached?'cached':'localHint'],['sync',s.sync,'sync','syncHint']];return`<div class="v87-connection-status" aria-label="${esc(t('title'))}">${items.map(([name,value,icon,hint])=>`<section class="v87-connection-stat" data-connection-state="${name}"><span class="v87-connection-stat-icon">${this.icon(icon)}</span><div><small>${esc(t(name))}</small><strong>${esc(t(value))}</strong><p>${esc(t(hint))}</p></div></section>`).join('')}</div>`;},
 overview(){const s=this.state(),action=s.active?'manage':s.entitlement==='pending'?'follow':s.entitlement==='expired'?'renew':'activate',intro=s.active?'activeIntro':s.entitlement==='pending'?'pendingIntro':s.entitlement==='expired'?'expiredIntro':'intro';return`<section class="v87-connection-hero panel"><span class="v87-connection-art" aria-hidden="true">${this.icon('cloud')}<span>${this.icon('link')}${this.icon('sync')}</span></span><div class="v87-connection-copy"><span class="v85-overline">MASARIFI ONLINE</span><h2>${esc(t(action))}</h2><p>${esc(t(intro))}</p><button type="button" class="primary v87-online-cta" data-v87-connection="${s.active?'settings':'open'}">${this.icon(s.active?'sync':'cloud')}<span>${esc(t(action))}</span></button></div></section>${this.statusHTML(s)}${!s.active?`<p class="v87-connection-note">${esc(t('noAutomatic'))}</p>`:''}`;},
 page(){const s=this.state();return`<div class="v17-connection-page v87-connection-page"><div data-v87-connection-overview>${this.overview()}</div><details class="v87-connection-details panel" id="v87ConnectionSettings"><summary>${this.icon(s.active?'sync':'local')}${esc(t(s.active?'manage':'identity'))}</summary><div class="v87-connection-detail-body"><section class="v18-sync-card" data-v18-sync-details></section>${O.identityCard?.()||''}<div class="settings-menu">${s.active?`<button type="button" data-v87-connection="shared">${this.icon('link')}${esc(t('shared'))}</button>`:''}<button type="button" data-v87-connection="plans">${esc(t('plans'))}</button></div></div></details></div>`;},
 async open(){if(A.locked||guest())return;if(this.state().active)return V6.navigate('settings','connection');return P.open();},
 paint(){if(A.locked||guest())return;root.V18Connection?.paint();const host=doc.querySelector('[data-v87-connection-overview]');if(host){const html=this.overview();if(host.innerHTML!==html)host.innerHTML=html;}},
 async action(kind){if(A.locked||guest())return;if(kind==='plans')return P.open();if(kind==='shared'){if(this.state().active)return O.show();return P.open();}if(kind==='settings'&&this.state().active){const details=doc.getElementById('v87ConnectionSettings');if(details){details.open=true;details.querySelector('summary')?.focus();details.scrollIntoView?.({block:'nearest'});return;}}return this.open();}
};
const render=A.render;A.render=function(){const result=render.apply(this,arguments);C.paint();return result;};
const settings=A.settingsPage;A.settingsPage=function(){return V6.settingsSection==='connection'&&!guest()?C.page():settings.apply(this,arguments);};
// Capture these entry points before their older bubbling handlers. Other sharing/service actions remain unchanged.
doc.addEventListener('click',event=>{const b=event.target.closest?.('[data-v87-connection],[data-act="v17Connection"],[data-act="v17OnlineSpace"],[data-act="v17Mode"],[data-identity="online"]');if(!b||A.locked||guest())return;const local=!!b.closest('.v17-connection-page,.v17-connection-sheet'),kind=b.dataset.v87Connection,legacy=b.dataset.act,mode=b.dataset.v17Mode;const handled=!!kind||legacy==='v17Connection'||local&&(legacy==='v17OnlineSpace'||!C.state().active&&(legacy==='v17Mode'&&mode==='online'||b.dataset.identity==='online'));if(!handled)return;event.preventDefault();event.stopImmediatePropagation();Promise.resolve(C.action(kind||'open')).catch(error=>A.error?.(error));},true);
root.addEventListener('masarifi:sync-state',()=>C.paint());root.addEventListener('online',()=>C.paint());root.addEventListener('offline',()=>C.paint());
})(window);
