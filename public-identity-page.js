/* Read-only, routed public QR page. Public identifiers are never authentication credentials. */
(function(root){
'use strict';
const A=root.App,V=root.V6,R=root.V7,N=root.V17User,doc=root.document;
if(!A||!V||!R||!N||!doc)return;
const route='public-identity',langs=['ar','en','tr','fr'];
const words={
 title:['رموز المشاركة والتعريف','Share & identify','Paylaşım ve kimlik','Partager et identifier'],
 intro:['رمزان منفصلان، لكل منهما استخدام واضح.','Two separate codes, each with a clear purpose.','İki ayrı kod, iki farklı amaç.','Deux codes distincts, chacun avec son usage.'],
 app:['مشاركة التطبيق وتثبيته','Share or install Masarifi','Masarifi’yi paylaş veya yükle','Partager ou installer Masarifi'],
 appHint:['امسح هذا الرمز لفتح رابط التطبيق العام ومشاركته أو تثبيته على جهاز آخر.','Scan this code to open the public app link, share it, or install it on another device.','Uygulamanın herkese açık bağlantısını açmak, paylaşmak veya başka bir cihaza yüklemek için tarayın.','Scannez ce code pour ouvrir le lien public, le partager ou installer l’application sur un autre appareil.'],
 identity:['رمز التعريف العام الخاص بك','Your public code','Herkese açık program kodunuz','Votre code public'],
 identityHint:['أرسل كود البرنامج هذا يدويًا إلى الإدارة أو المطور للتعريف بنسختك من مصاريفي.','Manually share this program code with the Admin or developer to identify your copy of Masarifi.','Masarifi kopyanızı tanıtmak için bu program kodunu yöneticiye veya geliştiriciye kendiniz gönderin.','Partagez vous-même ce code avec l’administration ou le développeur pour identifier votre copie de Masarifi.'],
 safety:['كود تعريف فقط. لا يمنح الدخول ولا يفعّل الاشتراك. لا يُرسل شيء تلقائيًا.','Identification only. It does not grant access or activate a subscription. Nothing is sent automatically.','Yalnızca tanıtım içindir. Erişim sağlamaz veya abonelik etkinleştirmez. Hiçbir şey otomatik gönderilmez.','Ce code sert uniquement à vous identifier. Il ne donne aucun accès et n’active aucun abonnement. Aucun envoi automatique.'],
 copyApp:['نسخ رابط التطبيق','Copy app link','Uygulama bağlantısını kopyala','Copier le lien'],
 shareApp:['مشاركة رابط التطبيق','Share app link','Uygulama bağlantısını paylaş','Partager le lien'],
 copyIdentity:['نسخ رمز التعريف','Copy public code','Program kodunu kopyala','Copier le code public'],
 shareIdentity:['مشاركة رمز التعريف','Share public code','Program kodunu paylaş','Partager le code public'],
 unavailable:['رمز التعريف العام غير متاح على هذا الجهاز بعد. راجع الهوية والاتصال ثم عد إلى هذه الصفحة.','Your public program code is not available on this device yet. Check Identity & connection, then return here.','Herkese açık program kodunuz bu cihazda henüz yok. Kimlik ve bağlantı ayarlarını kontrol edip buraya dönün.','Votre code public n’est pas encore disponible sur cet appareil. Consultez Identité et connexion, puis revenez ici.'],
 appUnavailable:['رابط التطبيق العام غير متاح هنا. افتح النسخة المنشورة من التطبيق وحاول مجددًا.','The public app link is unavailable here. Open the published app and try again.','Herkese açık bağlantı burada kullanılamıyor. Yayındaki uygulamayı açıp yeniden deneyin.','Le lien public n’est pas disponible ici. Ouvrez l’application publiée et réessayez.'],
 connection:['الهوية والاتصال','Identity & connection','Kimlik ve bağlantı','Identité et connexion'],
 copied:['تم النسخ','Copied','Kopyalandı','Copié'],
 select:['تم تحديد النص. يمكنك نسخه يدويًا.','Text selected. You can copy it manually.','Metin seçildi. Kendiniz kopyalayabilirsiniz.','Texte sélectionné. Vous pouvez le copier manuellement.'],
 qrUnavailable:['تعذر عرض QR. يمكنك نسخ النص أو مشاركته أدناه.','QR display is unavailable. You can still copy or share the text below.','QR gösterilemiyor. Aşağıdaki metni kopyalayabilir veya paylaşabilirsiniz.','Impossible d’afficher le QR. Vous pouvez copier ou partager le texte ci-dessous.']
};
const t=key=>words[key]?.[Math.max(0,langs.indexOf(A.prefs.language))]||words[key]?.[1]||key;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Online.init generates exactly this public program-code format. Its existing copy-code
// command copies the same string. Do not fall back to user IDs, recovery data or invites.
function publicCode(){const code=root.Online?.installation?.code;return typeof code==='string'&&/^MSR-[A-F0-9]{20}$/.test(code)?code:'';}
function model(){let app='';try{app=N.publicURL();}catch{}return{app:typeof app==='string'?app:'',identity:publicCode()};}
const stamp=()=>JSON.stringify([A.page,A.locked,root.V5?.lockGeneration,root.Online?.authEpoch,root.Online?.modeEpoch,root.Online?.user?.id,publicCode()]);
const active=proof=>!A.locked&&A.page===route&&proof===stamp();
const button=(action,kind,label)=>`<button type="button" data-public-qr-action="${action}" data-public-kind="${kind}">${esc(t(label))}</button>`;
let displayed=null,working=false;
function card(kind,payload){const app=kind==='app',label=app?'app':'identity',copy=app?'copyApp':'copyIdentity',share=app?'shareApp':'shareIdentity';
 return `<section class="public-identity-card" data-public-qr-card="${kind}" aria-labelledby="public-${kind}-title"><div class="public-identity-card-heading"><span class="public-identity-number" aria-hidden="true">${app?'1':'2'}</span><h2 id="public-${kind}-title">${esc(t(label))}</h2></div><p class="public-identity-description">${esc(t(app?'appHint':'identityHint'))}</p>${payload?`<div class="public-identity-qr" data-public-qr="${kind}" role="img" aria-label="${esc(t(label))} QR"></div><label class="public-identity-value-label"><span>${esc(t(label))}</span><input type="text" readonly dir="ltr" lang="en" spellcheck="false" autocomplete="off" data-public-qr-value="${kind}" value="${esc(payload)}"></label><div class="public-identity-actions">${button('copy',kind,copy)}${button('share',kind,share)}</div>`:`<div class="public-identity-unavailable" ${app?'':'data-public-identity-unavailable'} role="status"><p>${esc(t(app?'appUnavailable':'unavailable'))}</p>${app?'':button('connection','identity','connection')}</div>`}${app?'':`<p class="public-identity-safety">${esc(t('safety'))}</p>`}</section>`;
}
const P=root.MasarifiPublicIdentity={
 async open(select=false){if(A.locked)return false;
  // Touch browsers may leave focus on body; give the existing router a stable opener.
  if(A.page==='home'&&!doc.querySelector('dialog[open]'))doc.querySelector('[data-v17-share="qr"]')?.focus?.({preventScroll:true});
  const accepted=await R.navigate(route,{});if(accepted===false||A.locked||A.page!==route)return false;if(select)this.select('app');return true;},
 page(){displayed=model();return `<section class="public-identity-page" data-public-qr-page dir="${A.prefs.language==='ar'?'rtl':'ltr'}"><p class="public-identity-intro">${esc(t('intro'))}</p><div class="public-identity-grid">${card('app',displayed.app)}${card('identity',displayed.identity)}</div><p class="public-identity-status" data-public-qr-status role="status" aria-live="polite"></p></section>`;},
 mount(){if(A.locked||A.page!==route)return;for(const host of doc.querySelectorAll('[data-public-qr]')){const value=displayed?.[host.dataset.publicQr];if(!value||host.firstChild)continue;try{const qr=root.qrcode(0,'M');qr.addData(value);qr.make();host.append(root.MasarifiQR.image(qr));}catch{host.removeAttribute('role');const message=doc.createElement('p');message.dataset.publicQrError='';message.textContent=t('qrUnavailable');host.append(message);}}},
 decorate(){doc.body.dataset.publicIdentity=String(!A.locked&&A.page===route);const nav=doc.getElementById('mobileNav');if(nav)nav.hidden=!A.locked&&A.page===route;if(A.locked)return;if(A.page===route){const title=doc.querySelector('#header .brand strong');if(title){title.textContent=t('title');title.title=t('title');title.setAttribute('aria-label',t('title'));}const sub=doc.querySelector('#header .brand small');if(sub)sub.textContent=root.tr?.('app')||'Masarifi';doc.title=t('title')+' · '+(root.tr?.('app')||'Masarifi');}},
 select(kind){const input=doc.querySelector(`[data-public-qr-value="${kind}"]`);if(!input)return;input.focus({preventScroll:true});input.select();this.status('select');},
 status(key){const node=doc.querySelector('[data-public-qr-status]');if(node)node.textContent=t(key);},
 async action(action,kind){
  if(A.locked||A.page!==route||working||doc.querySelector('dialog[open]'))return;
  if(action==='connection')return R.navigate('settings',{settingsSection:'connection'});
  if(!['copy','share'].includes(action)||!['app','identity'].includes(kind))return;
  const value=displayed?.[kind],live=model();if(!value||live[kind]!==value){A.render();return;}
  const proof=stamp(),buttons=[...doc.querySelectorAll('[data-public-qr-action]')];working=true;for(const b of buttons)b.disabled=true;
  try{
   if(action==='share'){
    const payload=kind==='app'?(root.MasarifiLocale?.shareData(A.prefs.language)||{title:root.tr?.('app')||'Masarifi',url:value}):{title:t('identity'),text:value};
    if(kind==='app')payload.url=value;
    let native=root.isSecureContext===true&&typeof root.navigator.share==='function';try{if(native&&root.navigator.canShare)native=root.navigator.canShare(payload);}catch{native=false;}
    if(native){try{await root.navigator.share(payload);return;}catch(error){if(error?.name==='AbortError'||!active(proof))return;}}
    if(active(proof))this.select(kind);return;
   }
   try{if(root.navigator.clipboard?.writeText){await root.navigator.clipboard.writeText(value);if(active(proof))this.status('copied');return;}}catch{}
   if(active(proof))this.select(kind);
  }finally{working=false;for(const b of buttons)if(b.isConnected)b.disabled=false;}
 }
};
V.routes.add(route);R.pages[route]=()=>P.page();
const title=R.title;R.title=function(){return A.page===route?t('title'):title.apply(this,arguments);};
const mount=R.mount;R.mount=function(){const result=mount.apply(this,arguments);P.mount();return result;};
const render=A.render;A.render=function(){doc.body.dataset.publicIdentity=String(!A.locked&&A.page===route);const result=render.apply(this,arguments);P.decorate();return result;};
// The older capture listener resolves this property at click time. Redirect it rather
// than registering a later competing listener that stopImmediatePropagation would block.
N.publicShareDialog=function(select=false){return P.open(select).catch(error=>{if(!A.locked)A.error?.(error);return false;});};
const controls=N.publicShareControls;N.publicShareControls=function(){const template=doc.createElement('template');template.innerHTML=controls.apply(this,arguments);const qr=template.content.querySelector('[data-v17-share="qr"]');if(qr){qr.removeAttribute('aria-haspopup');qr.setAttribute('aria-label',t('title'));qr.title=t('title');}return template.innerHTML;};
doc.addEventListener('click',event=>{const b=event.target.closest?.('[data-public-qr-action]');if(!b||A.locked)return;event.preventDefault();event.stopImmediatePropagation();P.action(b.dataset.publicQrAction,b.dataset.publicKind).catch(error=>{if(!A.locked&&A.page===route)A.error?.(error);});},true);
doc.addEventListener('masarifi:navigation',()=>P.decorate());
root.addEventListener('v6:locked',()=>{displayed=null;P.decorate();});
// Online.ready is assigned inside App.init, after this module loads. Follow the
// existing initialization completion rather than observing an undefined early promise.
const init=A.init;if(typeof init==='function')A.init=async function(){const result=await init.apply(this,arguments);if(!A.locked&&A.page===route)A.render();return result;};
})(window);
