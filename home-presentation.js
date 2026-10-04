/* Local home presentation only: no financial writes, network actions, or account changes. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MasarifiHomePresentation=api.install(root);})(typeof window==='undefined'?globalThis:window,function(){'use strict';
const defaults={overview:false,accounts:true,periods:true,activity:false,assistant:true,rates:false,analytics:true,notes:true,install:true,intelligence:true};
const canCollapse=key=>Object.prototype.hasOwnProperty.call(defaults,key);
const storageKey=scope=>'masarifi.home.presentation.v1:'+String(scope||'personal');
function preferences(storage,scope){
 let raw;try{raw=JSON.parse(storage?.getItem(storageKey(scope))||'null');}catch{}
 const state={hidden:typeof raw?.hidden==='boolean'?raw.hidden:null,collapsed:{...defaults}};
 for(const key of Object.keys(defaults))if(typeof raw?.collapsed?.[key]==='boolean')state.collapsed[key]=raw.collapsed[key];
 const persist=()=>{try{storage?.setItem(storageKey(scope),JSON.stringify(state));return !!storage;}catch{return false;}};
 return{read:()=>({hidden:state.hidden,collapsed:{...state.collapsed}}),hide(value){state.hidden=!!value;return persist();},collapse(key,value){if(!canCollapse(key))return false;state.collapsed[key]=!!value;return persist();}};
}
const suppressCharts=(page,hidden)=>page==='home'&&hidden===true;
function fxPair(preferred,available){const codes=[...new Set(available||[])];let to=codes.includes(preferred)?preferred:codes.includes('TRY')?'TRY':codes.includes('USD')?'USD':codes[0]||'TRY';const from=codes.includes('USD')&&to!=='USD'?'USD':codes.includes('EUR')&&to!=='EUR'?'EUR':codes.find(c=>c!==to)||to;return{from,to};}
function rateState(book,today){if(!book)return'missing';const time=Date.parse(String(book.date)+'T12:00:00Z'),now=Date.parse(String(today)+'T12:00:00Z');if(!Number.isFinite(time)||!Number.isFinite(now)||time>now)return'invalid';return now-time>3*86400000?'stale':'saved';}
function greetingPart(date=new Date()){const hour=date.getHours();return hour<5||hour>=22?'night':hour<11?'morning':hour<14?'noon':hour<18?'afternoon':'evening';}
const greetings={
 ar:{morning:['صباح الخير','بداية هادئة ليومك'],noon:['طاب نهارك','لحظة لترتيب يومك'],afternoon:['مساء الخير','تابع على راحتك'],evening:['مساء الخير','خذ وقتك بهدوء'],night:['ليلة هادئة','على مهل وبراحة']},
 en:{morning:['Good morning','Start at your pace'],noon:['Hello there','Take a midday pause'],afternoon:['Good afternoon','Carry on your way'],evening:['Good evening','Take a quiet moment'],night:['Good evening','Keep a gentle pace']},
 tr:{morning:['Günaydın','Güne sakin başlayın'],noon:['İyi günler','Kısa bir mola'],afternoon:['İyi günler','Kendi hızınızda devam edin'],evening:['İyi akşamlar','Kendinize zaman ayırın'],night:['İyi geceler','Acele etmeden ilerleyin']},
 fr:{morning:['Bonjour','Commencez à votre rythme'],noon:['Bonne journée','Un moment de pause'],afternoon:['Bon après-midi','Avancez à votre rythme'],evening:['Bonsoir','Prenez un moment calme'],night:['Bonsoir','Un instant pour vous']}
};
function greeting(date,language,username=''){const phase=greetingPart(date),copy=(greetings[language]||greetings.en)[phase],name=String(username||'').trim();return{phase,title:copy[0]+(name?(language==='ar'?'، ':', ')+name:''),note:copy[1]};}
function nextGreetingDelay(date=new Date()){const next=[5,11,14,18,22].find(hour=>hour>date.getHours()),boundary=new Date(date.getTime());if(next===undefined)boundary.setDate(boundary.getDate()+1);boundary.setHours(next??0,0,0,50);return Math.max(1000,boundary.getTime()-date.getTime());}
function install(root){
 const A=root.App,V=root.V6,V5=root.V5,doc=root.document,C=root.Core;
 if(!A||!V||!doc)return api;
 V.addLabels(`
v871HideAmounts|إخفاء المبالغ|Tutarları gizle|Hide amounts|Masquer les montants
v871ShowAmounts|إظهار المبالغ|Tutarları göster|Show amounts|Afficher les montants
v871AmountsHidden|المبالغ والرسوم مخفية|Tutarlar ve grafikler gizli|Amounts and charts are hidden|Montants et graphiques masqués
v871SavedRate|سعر مرجعي محفوظ|Kayıtlı referans kuru|Saved reference rate|Taux de référence enregistré
v871RatePair|سعر الصرف المرجعي|Referans döviz kuru|Reference exchange rate|Taux de change indicatif
v871OpenConverter|فتح المحوّل|Dönüştürücüyü aç|Open converter|Ouvrir le convertisseur
`);
 const t=k=>root.tr(k),esc=C.escape,stores=new Map();
 const cores=Number(root.navigator?.hardwareConcurrency),memory=Number(root.navigator?.deviceMemory);
 doc.documentElement.dataset.homeMotion=root.navigator?.connection?.saveData||(cores>0&&cores<=4)||(memory>0&&memory<=4)?'off':'on';
 const scope=()=>root.SectionWorkspaces?.scope?.()||A.prefs.section||'personal';
 function prefs(){const key=scope();if(!stores.has(key)){let storage;try{storage=root.localStorage;}catch{}stores.set(key,preferences(storage,key));}return stores.get(key);}
 function applyPrivacy(){if(A.page==='home'){const hidden=prefs().read().hidden;if(hidden!==null)A.prefs.hideNumbers=hidden;}doc.body.dataset.home=String(A.page==='home'&&!A.locked);doc.body.dataset.homePrivacy=String(suppressCharts(A.page,A.prefs.hideNumbers)&&!A.locked);}
 function titleFor(node,key){return node.querySelector('h2')?.textContent||t(root.V7?.widgetLabels?.[key]?.[0]||({overview:'v85OverviewTitle',intelligence:'intelligenceTitle',rates:'v5Rates'}[key])||key);}
 function fold(node,key){
  if(!node||!canCollapse(key)||node.matches('.home-heading,.category-quick')||node.querySelector('.category-quick'))return;
  let details=node.tagName==='DETAILS'?node:node.children.length===1&&node.firstElementChild?.tagName==='DETAILS'?node.firstElementChild:null;
  if(details?.dataset.homeFold)return details;
  if(!details){
   const title=titleFor(node,key),heading=node.querySelector('h2');details=doc.createElement('details');
   const mutableInstall=node.id==='homeInstall';
   for(const attribute of Array.from(node.attributes))if(!mutableInstall||attribute.name!=='id')details.setAttribute(attribute.name,attribute.value);
   const summary=doc.createElement('summary'),label=doc.createElement('span'),chevron=doc.createElement('span'),body=doc.createElement('div');
   label.textContent=title;chevron.className='home-fold-chevron';chevron.textContent='⌄';chevron.setAttribute('aria-hidden','true');summary.append(label,chevron);body.className='home-fold-body';
   if(mutableInstall){node.removeAttribute('data-home-widget');node.replaceWith(details);body.append(node);}else{while(node.firstChild)body.append(node.firstChild);node.replaceWith(details);}
   details.append(summary,body);heading?.classList.add('home-fold-repeated-title');
  }
  details.classList.add('home-fold');details.dataset.homeFold=key;details.open=!prefs().read().collapsed[key];
  const summary=details.querySelector(':scope > summary');if(summary){if(!summary.querySelector('.home-fold-chevron')){const chevron=doc.createElement('span');chevron.className='home-fold-chevron';chevron.textContent='⌄';chevron.setAttribute('aria-hidden','true');summary.append(chevron);}summary.setAttribute('aria-expanded',String(details.open));}
  return details;
 }
 function hideRenderedAmounts(home){
  if(!A.prefs.hideNumbers)return;
  for(const node of home.querySelectorAll('.blurred,.home-overview-value,.v7-card-balance,.v7-account-row-balance,.cashbox-amount,.spend-values,.v17-recent-amounts,.balance-card>strong,.period-card bdi,.metric bdi,[data-home-money]')){
   node.textContent='••••';node.classList.remove('blurred');node.removeAttribute('title');node.setAttribute('aria-label',t('v871AmountsHidden'));
  }
  for(const canvas of home.querySelectorAll('canvas')){canvas.getContext?.('2d')?.clearRect(0,0,canvas.width,canvas.height);canvas.hidden=true;canvas.setAttribute('aria-hidden','true');}
  for(const node of home.querySelectorAll('#chartLegend,.chart-tooltip,[role=tooltip],.category-spend-track,[role=progressbar]'))node.remove();
 }
 function eye(greeting){
  if(!greeting||greeting.querySelector('[data-home-privacy]'))return;
  const button=doc.createElement('button');button.type='button';button.dataset.homePrivacy='';button.className='home-privacy-button';
  button.setAttribute('aria-pressed',String(!!A.prefs.hideNumbers));button.setAttribute('aria-label',t(A.prefs.hideNumbers?'v871ShowAmounts':'v871HideAmounts'));button.title=t(A.prefs.hideNumbers?'v871ShowAmounts':'v871HideAmounts');button.innerHTML=typeof root.ico==='function'?root.ico('eye'):'◉';
  (greeting.querySelector('.v20-home-share')||greeting).prepend(button);
 }
 let greetingTimer=null;
 function paintGreeting(node){if(!node)return;const value=greeting(new Date(),A.prefs.language,A.prefs.username),heading=node.querySelector('h1'),note=node.querySelector('p'),eyebrow=node.querySelector('.eyebrow');if(heading)heading.textContent=value.title;if(note){note.textContent=value.note;note.classList.add('home-greeting-note');}if(eyebrow){eyebrow.textContent='';const icon=doc.createElement('span'),date=doc.createElement('time');icon.className='home-greeting-clock';icon.setAttribute('aria-hidden','true');icon.textContent=value.phase==='night'||value.phase==='evening'?'☾':'☀';date.textContent=A.date?.(C.day())||C.day();date.setAttribute('datetime',C.day());eyebrow.append(icon,date);}node.dataset.greetingPhase=value.phase;}
 function refreshGreeting(){if(greetingTimer!==null){root.clearTimeout?.(greetingTimer);greetingTimer=null;}if(A.locked||A.page!=='home'||doc.hidden)return;paintGreeting(doc.querySelector('.home-heading'));if(typeof root.setTimeout==='function')greetingTimer=root.setTimeout(refreshGreeting,nextGreetingDelay(new Date()));}
 doc.addEventListener('visibilitychange',refreshGreeting);root.addEventListener?.('pageshow',refreshGreeting);root.addEventListener?.('focus',refreshGreeting);
 function decorate(){
  applyPrivacy();if(A.locked||A.page!=='home'){refreshGreeting();return;}
  const content=doc.getElementById('content'),home=content?.querySelector('.home-stack');if(!home)return;
  const greeting=home.querySelector('.home-heading'),quick=home.querySelector('.category-quick');if(greeting&&quick)greeting.after(quick);eye(greeting);refreshGreeting();
  for(const extra of content.querySelectorAll(':scope > .intelligence-entry'))home.append(extra);
  const overview=home.querySelector('.home-overview');if(overview)fold(overview,'overview');
  for(const node of Array.from(home.querySelectorAll('[data-home-widget]')))fold(node,node.dataset.homeWidget);
  for(const node of home.querySelectorAll(':scope > .intelligence-entry'))fold(node,'intelligence');
  hideRenderedAmounts(home);
 }
 doc.addEventListener('toggle',event=>{const details=event.target;if(A.locked||A.page!=='home'||!details.matches?.('details[data-home-fold]'))return;const key=details.dataset.homeFold;if(!canCollapse(key))return;const closed=!details.open;if(prefs().read().collapsed[key]!==closed){details.dataset.userToggled='true';prefs().collapse(key,closed);}details.querySelector(':scope > summary')?.setAttribute('aria-expanded',String(details.open));},true);
 doc.addEventListener('click',event=>{const button=event.target.closest?.('button[data-home-privacy],[data-act="privacy"]');if(!button||A.page!=='home'||A.locked)return;event.preventDefault();event.stopImmediatePropagation();if(A.busy||doc.querySelector('dialog[open]'))return;const hidden=!A.prefs.hideNumbers;prefs().hide(hidden);A.prefs.hideNumbers=hidden;A.render();doc.querySelector('button[data-home-privacy]')?.focus({preventScroll:true});},true);
 const draw=A.drawChart;A.drawChart=function(){if(suppressCharts(this.page,this.prefs.hideNumbers)){const home=doc.querySelector('.home-stack');if(home)hideRenderedAmounts(home);return;}return draw?.apply(this,arguments);};
 if(V5?.drawAnalytics){const analytics=V5.drawAnalytics;V5.drawAnalytics=function(){if(suppressCharts(A.page,A.prefs.hideNumbers)){const body=doc.getElementById('v5AnalyticsBody');if(body){body.textContent='';const note=doc.createElement('p');note.className='home-privacy-note';note.textContent=t('v871AmountsHidden');body.append(note);}return;}return analytics.apply(this,arguments);};}
 function availableFX(){return C.currencies.filter(c=>!root.Bank.metals[c]);}
 function pair(){return fxPair(A.prefs.section==='work'?A.prefs.currencyWork:A.prefs.currencyPersonal,availableFX());}
 if(V5?.rateStrip)V5.rateStrip=function(){
  const book=A.rateBooks?.ecb,{from,to}=pair(),state=rateState(book,C.day());let quote='—',error='';
  try{if(!book||state==='invalid')throw Error('rateMissing');const amount=C.minor('1',from,'en'),rate=root.Bank.referenceQuote(book,from,to,'ecb'),converted=root.Bank.convert(amount,from,to,rate);quote=A.prefs.hideNumbers?'••••':A.money(converted,to);}catch(e){error=t(e.message==='overflow'?'overflow':'rateMissing');}
  const status=error||t(state==='stale'?'v87FXStale':state==='missing'?'v5NoRates':'v871SavedRate');
  return `<section class="rates-strip home-fx"><div class="home-fx-heading"><span class="rate-icon" aria-hidden="true">${root.ico?.('rates')||''}</span><h2>${esc(t('v871RatePair'))}</h2></div><div class="home-fx-quote" dir="ltr"><span><bdi>1 ${esc(from)}</bdi></span><span aria-hidden="true">→</span><strong data-home-money><bdi>${esc(quote)}</bdi></strong></div><p class="home-fx-source">${esc(book?(book.source||'ECB')+' · '+A.date(book.date):t('v5NoRates'))}</p><p class="home-fx-status${state==='stale'||error?' is-warning':''}" role="status">${esc(status)}</p><button type="button" class="home-fx-open" data-act="openRates">${esc(t('v871OpenConverter'))}${root.ico?.('arrow')||''}</button></section>`;
 };
 const render=A.render;A.render=function(){applyPrivacy();const result=render.apply(this,arguments);decorate();return result;};
 const installed={...api,decorate,fxPair:pair};if(A.ready)A.render();return installed;
}
const api={canCollapse,storageKey,preferences,suppressCharts,fxPair,rateState,greetingPart,greeting,nextGreetingDelay,install};return api;
});
