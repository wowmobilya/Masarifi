/* Section names and local PIN gates. Stored ledgers remain authoritative and unencrypted. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root.App&&root.V6&&root.V7)api.install(root,{
  DB:typeof DB==='undefined'?root.DB:DB,Reports:typeof Reports==='undefined'?root.Reports:Reports,
  BankReports:typeof BankReports==='undefined'?root.BankReports:BankReports,
  E:typeof E==='undefined'?root.E:E,ico:typeof ico==='undefined'?root.ico:ico,TEXT:typeof TEXT==='undefined'?root.TEXT:TEXT,
  Photos:typeof Photos==='undefined'?root.Photos:Photos
 });
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const ids=['personal','work'];
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
 const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const normalizePIN=value=>String(value??'').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0));
 const validPIN=value=>/^[0-9]{6,12}$/.test(normalizePIN(value));
 function cleanName(value){
  if(typeof value!=='string'||/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/u.test(value))throw Error('v85SectionNameInvalid');
  const name=value.trim().normalize('NFC');
  if(Array.from(name).length>40)throw Error('v85SectionNameInvalid');
  return name;
 }
 function names(raw={}){
  if(!object(raw)||Object.keys(raw).some(k=>!ids.includes(k)))throw Error('invalidBackup');
  return Object.fromEntries(ids.map(id=>[id,own(raw,id)?cleanName(raw[id]):'']));
 }
 function credential(raw){
  if(!object(raw)||raw.kind!=='pin'||raw.algorithm!=='PBKDF2-SHA-256'||raw.iterations!==180000||raw.version!==1||typeof raw.hash!=='string'||!/^[0-9a-f]{64}$/.test(raw.hash)||!Array.isArray(raw.salt)||raw.salt.length!==16||raw.salt.some(n=>!Number.isInteger(n)||n<0||n>255)||Object.keys(raw).some(k=>!['kind','algorithm','iterations','version','hash','salt'].includes(k)))throw Error('invalidBackup');
  return {kind:'pin',algorithm:'PBKDF2-SHA-256',iterations:180000,version:1,hash:raw.hash,salt:[...raw.salt]};
 }
 function locks(raw={}){
  if(!object(raw)||Object.keys(raw).some(k=>!ids.includes(k)))throw Error('invalidBackup');
  const result={};for(const id of ids)if(own(raw,id)&&raw[id]!=null)result[id]=credential(raw[id]);return result;
 }
 const signature=value=>value?JSON.stringify([value.hash,value.salt,value.kind,value.version,value.algorithm,value.iterations]):'';
 async function derivePIN(value,hashPassword){
  const pin=normalizePIN(value);if(!validPIN(pin))throw Error('v6PINInvalid');
  const result=await hashPassword(pin);
  return credential({...result,kind:'pin',algorithm:'PBKDF2-SHA-256',iterations:180000,version:1});
 }
 async function checkPIN(value,lock,hashPassword){
  const pin=normalizePIN(value);if(!validPIN(pin))throw Error('v6PINInvalid');
  const saved=credential(lock),result=await hashPassword(pin,saved.salt);
  // Neither the numeric PIN nor a reversible representation is persisted.
  let different=result.hash.length^saved.hash.length;for(let i=0;i<saved.hash.length;i++)different|=(result.hash.charCodeAt(i)||0)^saved.hash.charCodeAt(i);
  if(different)throw Error('passwordWrong');return true;
 }
 function install(root,globals={}){
  if(root.SectionPreferences)return root.SectionPreferences;
  const A=root.App,V6=root.V6,V7=root.V7,DB=globals.DB||root.DB,C=root.Core,B=root.Bank;
  const ico=globals.ico||root.ico;
  const doc=root.document,escape=globals.E||root.E||((s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  const baseTranslate=root.tr;
  const text=globals.TEXT||root.TEXT;
  const defaults=Object.fromEntries(['ar','tr','en','fr'].map(language=>[language,Object.fromEntries(ids.map(id=>[id,baseTranslate(id,language)]))]));
  const defaultLabel=(id,language=A.prefs.language)=>defaults[language]?.[id]||defaults.en[id]||id;
  function paintLabels(){if(text)for(const language of ['ar','tr','en','fr'])for(const id of ids)text[language][id]=A.prefs.sectionNames?.[id]||defaults[language][id];}
  V6.addLabels(`
v85Sections|الأقسام ورموز الدخول|Bölümler ve PIN kodları|Sections and PINs|Sections et codes PIN
v85SectionsHint|أسماء تختارها ورمز مستقل لكل قسم|Özel adlar ve her bölüm için ayrı PIN|Custom names and a separate PIN per section|Des noms personnalisés et un code distinct par section
v85SectionName|اسم القسم|Bölüm adı|Section name|Nom de la section
v85SectionNameHint|حتى 40 حرفًا. اتركه فارغًا لاستعمال الاسم الافتراضي بلغتك.|En fazla 40 karakter. Dilinizdeki varsayılan ad için boş bırakın.|Up to 40 characters. Leave blank for the default name in your language.|40 caractères maximum. Laissez vide pour le nom par défaut dans votre langue.
v85SectionNameInvalid|استخدم اسمًا لا يتجاوز 40 حرفًا دون محارف تحكم.|Kontrol karakteri içermeyen, en fazla 40 karakterlik bir ad kullanın.|Use a name of up to 40 characters without control characters.|Utilisez un nom de 40 caractères au maximum, sans caractères de contrôle.
v85SectionPIN|رمز دخول القسم|Bölüm PIN kodu|Section PIN|Code PIN de la section
v85SectionPINHint|يُطلب عند فتح القسم والتبديل إليه. الرجوع من الصفحة أو مغادرة المساحة المالية ينهي فتح القسم.|Bölümü açarken veya değiştirirken sorulur. Sayfadan geri dönmek ya da finans alanından çıkmak bölüm erişimini kapatır.|Required when opening or switching to the section. Page Back or leaving the financial workspace ends section access.|Demandé à l’ouverture ou au changement de section. Le retour de page ou la sortie de l’espace financier ferme cet accès.
v85SectionPINBounds|قفل محلي للواجهة على هذا الجهاز؛ ليس تشفيرًا للبيانات. النسخ الاحتياطية وبيانات المتصفح تبقى قابلة للقراءة. رمز التطبيق العام مستقل.|Bu cihazda yerel arayüz kilididir; verileri şifrelemez. Yedekler ve tarayıcı verileri okunabilir kalır. Genel uygulama PIN'i ayrıdır.|A local interface lock on this device; it does not encrypt data. Backups and browser data remain readable. The whole-app PIN is separate.|Verrou local de l’interface sur cet appareil ; il ne chiffre pas les données. Sauvegardes et données du navigateur restent lisibles. Le code de l’application est distinct.
v85SectionPINOn|رمز الدخول مفعّل|PIN etkin|PIN enabled|Code PIN activé
v85SectionPINOff|دون رمز دخول|PIN yok|No PIN|Sans code PIN
v85SectionUnlock|فتح القسم|Bölümü aç|Unlock section|Ouvrir la section
v85SectionLocked|افتح القسم برمز دخوله قبل عرض بياناته المالية.|Finansal verileri görmek için bölümü PIN koduyla açın.|Unlock this section with its PIN before viewing its financial data.|Ouvrez cette section avec son code PIN avant d’afficher ses données financières.
v85SectionScope|اختر القسم المطلوب وافتحه أولًا.|Önce istediğiniz bölümü seçip açın.|Select and unlock the required section first.|Sélectionnez et ouvrez d’abord la section souhaitée.
v85SectionExit|إقفال القسم|Bölümü kilitle|Lock section|Verrouiller la section
v85SectionScopeHint|حركات القسم الحالي فقط، مع الرصيد الافتتاحي المشترك للصندوق. هذا رصيد القسم وليس إجمالي الصندوق.|Ortak kasa açılış bakiyesiyle yalnız seçili bölümün hareketleri. Bu bölüm bakiyesidir, kasa toplamı değildir.|Current-section movements with the account’s shared opening balance. This is a section balance, not the whole account total.|Mouvements de la section avec le solde initial partagé du compte. Il s’agit du solde de la section, pas du total du compte.
v85SectionPINRemove|إزالة رمز القسم|Bölüm PIN'ini kaldır|Remove section PIN|Retirer le code de la section
v85SectionPINSaved|تم حفظ رمز القسم على هذا الجهاز.|Bölüm PIN'i bu cihaza kaydedildi.|Section PIN saved on this device.|Code de la section enregistré sur cet appareil.
v85SectionBackup|تفويض النسخة الكاملة|Tam yedeğe izin ver|Authorize complete backup|Autoriser la sauvegarde complète
v85SectionBackupHint|النسخة الكاملة تشمل القسمين. أدخل رمز كل قسم مقفل قبل بدء التصدير اليدوي.|Tam yedek her iki bölümü içerir. Elle dışa aktarmadan önce kilitli bölümlerin PIN kodlarını girin.|A complete backup includes both sections. Enter each locked section’s PIN before manual export.|La sauvegarde complète contient les deux sections. Saisissez le code de chaque section verrouillée avant l’export manuel.
v85SectionAutomaticBackup|النسخ والمزامنة التلقائيان اللذان فعّلتهما مسبقًا يستمران بإعداداتهما الحالية ويشملان بيانات البرنامج كاملة؛ رمز القسم لا يشفّرهما ولا يغيّر جدولهما.|Önceden etkinleştirdiğiniz otomatik yedek ve eşitleme mevcut ayarlarıyla tüm program verilerini kapsayarak sürer. Bölüm PIN'i bunları şifrelemez veya zamanlamayı değiştirmez.|Previously enabled automatic backup and sync continue with their existing settings and include the full program data. Section PINs do not encrypt them or change their schedule.|Les sauvegardes et synchronisations automatiques déjà activées continuent avec leurs réglages et toutes les données du programme. Les codes de section ne les chiffrent pas et ne changent pas leur calendrier.
`);
  let generation=0,switchIntent=0,grant=null,prompt=null,askOperation=null,loadedSignature='',preferencesQueue=Promise.resolve(),backupFlight=null,manualBackupTicket=null;
  const backupTickets=new WeakSet(),privateDialogs=new Map(),photoProofs=new WeakMap(),submitScopes=new WeakMap(),writeMarker=Symbol('sectionWriteScope'),preferencesMarker=Symbol('preferencePatch');
  let preferenceBaseline=structuredClone(A.prefs);
  let photoRequest=0;
  let openingScope=null,privateOpening=false,activeWriteScope=null,writeQueue=Promise.resolve();
  const identity=()=>[root.Online?.user?.id||'',root.Online?.authEpoch||0,root.Online?.modeEpoch||0,root.V5?.lockGeneration||0].join('|');
  const active=()=>ids.includes(A.prefs.section)?A.prefs.section:'personal';
  const lock=id=>A.prefs.sectionLocks?.[id]||null;
  const available=()=>!A.locked&&!root.Online?.Workspace?.guest?.()&&!root.Online?.Workspace?.context;
  const allowed=(id=active())=>available()&&id===active()&&(!lock(id)||!!grant&&grant.section===id&&grant.identity===identity()&&grant.signature===signature(lock(id)));
  const proof=()=>({epoch:generation,identity:identity(),section:active(),signature:signature(lock(active()))});
  const current=p=>!!p&&p.epoch===generation&&p.identity===identity()&&p.section===active()&&p.signature===signature(lock(active()))&&allowed(p.section);
  const globalShareKind=kind=>['note','reminder','rates'].includes(kind);
  const globalProof=()=>({global:true,identity:identity()});
  const accessCurrent=p=>p?.global?!A.locked&&p.identity===identity():current(p);
  const label=(id,language)=>A.prefs.sectionNames?.[id]||defaultLabel(id,language);
  root.tr=function(key,language){if(ids.includes(key))return label(key,language);if(['statementScope','accountScope','reportScopeBank'].includes(key))return label(active(),language)+' · '+baseTranslate('v85SectionScopeHint',language);return baseTranslate(key,language);};
  // These global functions are looked up at call time by initialization and imports.
  const basePrefs=root.safePrefs;
  root.safePrefs=function(raw,defaults){const out=basePrefs(raw,defaults);out.sectionNames=names(own(raw,'sectionNames')?raw.sectionNames:defaults?.sectionNames||{});out.sectionLocks=locks(own(raw,'sectionLocks')?raw.sectionLocks:defaults?.sectionLocks||{});return out;};
  const baseValidate=root.validateBundle;
  root.validateBundle=function(raw){if(own(raw?.prefs,'sectionNames'))names(raw.prefs.sectionNames);if(own(raw?.prefs,'sectionLocks'))locks(raw.prefs.sectionLocks);const out=baseValidate(raw);if(out.prefs){out.prefs={...out.prefs};if(own(raw?.prefs,'sectionNames'))out.prefs.sectionNames=names(raw.prefs.sectionNames);if(own(raw?.prefs,'sectionLocks'))out.prefs.sectionLocks=locks(raw.prefs.sectionLocks);}return out;};
  A.prefs.sectionNames=names(A.prefs.sectionNames||{});A.prefs.sectionLocks=locks(A.prefs.sectionLocks||{});
  function clear(reason='exit'){
   generation++;photoRequest++;grant=null;A.invalidateReport?.();A.sharedText=null;A.reportModel=null;A._smartContext=null;
   if(prompt?.dialog?.open)prompt.dialog.close();
   if(!globalShareKind(root.ItemShare?.data?.kind)||['app-lock','identity','page-exit'].includes(reason)){root.ItemShare?.clear?.();if(root.ItemShare){root.ItemShare.data=null;root.ItemShare.text='';}}
   V6.assistant?.cleanup?.();if(V6.assistant?.state)V6.assistant.state.contextReady=false;
   root.MasarifiAIAssistant?.cancel?.();root.speechSynthesis?.cancel?.();root.V18Performance?.invalidate?.();
   for(const [dialog]of privateDialogs){
    // Authorization loss invalidates every callback and removes image/text nodes.
    // Closing programmatically also runs the existing editor/media cleanup hooks.
    if(dialog.open)dialog.close();
    if(dialog.querySelectorAll)for(const node of dialog.querySelectorAll('img,video,audio,canvas')){node.removeAttribute?.('src');node.removeAttribute?.('srcset');if(node.tagName==='CANVAS')node.width=0;}
    if('innerHTML'in dialog)dialog.innerHTML='';if('html'in dialog)dialog.html='';
   }
   privateDialogs.clear();
   // An async Back/PIN prompt must never leave old figures visible underneath.
   if(!A.locked&&lock(active())&&financialPages.has(A.page)){const content=doc.getElementById('content');if(content)content.innerHTML=gatePage();}
   root.dispatchEvent(new root.CustomEvent('masarifi:section-locked',{detail:{reason,epoch:generation}}));
   root.dispatchEvent(new root.CustomEvent('section-preferences:changed',{detail:{reason,epoch:generation}}));
  }
  function requireActive(id=active()){if(!allowed(id))throw Error(id!==active()?'v85SectionScope':'v85SectionLocked');return id;}
  const assertProof=p=>{if(!current(p))throw Error('v85SectionLocked');};
  const sameProof=(a,b)=>a&&b&&a.epoch===b.epoch&&a.identity===b.identity&&a.section===b.section&&a.signature===b.signature;
  function validateWriteScope(ops){
   for(const op of ops){const p=op[writeMarker];if(!p)continue;assertProof(p);
    const record=op.store==='trash'?op.value?.record:op.value;
    if(record?.section&&record.section!==p.section)throw Error('v85SectionScope');
   }
  }
  function scopeOperations(p,ops){if(!p)return ops;assertProof(p);return ops.map(op=>({...op,[writeMarker]:p}));}
  function commitFor(data,ops){return DB.commit(scopeOperations(submitScopes.get(data),ops));}
  function needsPreferenceMerge(op,ops){return op.store==='meta'&&op.value?.id==='prefs'&&!ops.some(o=>o.store==='meta'&&o.value?.id==='beforeLastImport');}
  function preparePreferenceWrite(op,stored){
   const latest=stored?.value||{},intent=op[preferencesMarker];
   const scope=op[writeMarker];if(scope&&!intent?.security&&signature(latest.sectionLocks?.[scope.section])!==scope.signature)throw Error('v85SectionLocked');
   if(intent){
    if(intent.switchIntent&&intent.switchIntent!==switchIntent)throw Error('conflict');
    if(intent.security&&ids.some(id=>signature(latest.sectionLocks?.[id])!==intent.security[id]))throw Error('conflict');
    const merged={...latest,...intent.patch};merged.sectionNames=names(merged.sectionNames||{});merged.sectionLocks=locks(merged.sectionLocks||{});
    for(const key of Object.keys(op.value.value))delete op.value.value[key];Object.assign(op.value.value,merged);
   }else{
    // A retained appearance/profile writer cannot remove another tab's PIN.
    op.value.value.sectionNames=names(latest.sectionNames||{});op.value.value.sectionLocks=locks(latest.sectionLocks||{});
   }
  }
  function writeScoped(p,operation){
   if(sameProof(activeWriteScope,p)){assertProof(p);return operation();}
   const run=async()=>{assertProof(p);activeWriteScope=p;try{const result=await operation();assertProof(p);return result;}finally{if(activeWriteScope===p)activeWriteScope=null;}};
   const result=writeQueue.then(run,run);writeQueue=result.catch(()=>{});return result;
  }
  const baseCommit=DB.commit;
  if(baseCommit)DB.commit=function(ops){
   // The marker comes only from a specific submit or financial operation.
   // Concurrent imports, cloud mirrors and recovery receive no ambient scope.
   validateWriteScope(ops);return baseCommit.call(this,ops);
  };
  const baseDialog=A.dialog;
  A.dialog=function(title,body,submit,...rest){
   const p=privateOpening?null:openingScope;
   if(p)assertProof(p);
   const guarded=p&&submit?function(...args){assertProof(p);if(args[0]&&typeof args[0]==='object')submitScopes.set(args[0],p);return writeScoped(p,()=>submit.apply(this,args));}:submit;
   const dialog=baseDialog.call(this,title,body,guarded,...rest);
   if(dialog){privateDialogs.delete(dialog);if(p){privateDialogs.set(dialog,p);dialog.addEventListener('close',()=>{if(privateDialogs.get(dialog)===p)privateDialogs.delete(dialog);},{once:true});}}
   return dialog;
  };
  function financialCall(operation,p=proof()){assertProof(p);const prior=openingScope;openingScope=p;try{return operation();}finally{openingScope=prior;}}
  async function commitPatch(patch,p,authorized=false){
   const who=identity(),valid=()=>!A.locked&&(!p||p.epoch===generation)&&(!p?.switchIntent||p.switchIntent===switchIntent)&&who===identity()&&(!authorized||current(p));
   const operation=async()=>{
    if(!valid())return false;
    const latest=(await DB.get('meta','prefs'))?.value||A.prefs;if(!valid())return false;
    const value={...latest,...structuredClone(patch)};
    value.sectionNames=names(value.sectionNames||{});value.sectionLocks=locks(value.sectionLocks||{});
    if(baseCommit){const intent={patch:structuredClone(patch),switchIntent:p?.switchIntent,security:own(patch,'sectionLocks')?Object.fromEntries(ids.map(id=>[id,signature(A.prefs.sectionLocks?.[id])])):null};const ops=[{store:'meta',value:{id:'prefs',value},[preferencesMarker]:intent}];await DB.commit(authorized?scopeOperations(p,ops):ops);}
    else await DB.put('meta',{id:'prefs',value});
    if(!valid())return false;
    // Publish only the patch; an independent tab's section choice cannot grant access here.
    const changedLocks=JSON.stringify(A.prefs.sectionLocks)!==JSON.stringify(value.sectionLocks);
    A.prefs={...A.prefs,...structuredClone(patch),sectionNames:structuredClone(value.sectionNames),sectionLocks:structuredClone(value.sectionLocks)};loadedSignature=JSON.stringify(A.prefs.sectionLocks);preferenceBaseline=structuredClone(A.prefs);paintLabels();
    if(changedLocks)clear('credential-changed');
    A.channel?.postMessage('sections');root.dispatchEvent(new root.CustomEvent('section-preferences:changed',{detail:{reason:'saved',epoch:generation}}));return true;
   };
   const result=preferencesQueue.then(operation,operation);preferencesQueue=result.catch(()=>{});return result;
  }
  async function writePreferences(next,p){
   const patch={};for(const key of Object.keys(next))if(JSON.stringify(next[key])!==JSON.stringify(A.prefs[key]))patch[key]=next[key];
   return commitPatch(patch,p);
  }
  if(A.savePrefs)A.savePrefs=async function(next){const patch={};for(const key of Object.keys(next))if(!['sectionNames','sectionLocks'].includes(key)&&JSON.stringify(next[key])!==JSON.stringify(this.prefs[key]))patch[key]=structuredClone(next[key]);await commitPatch(patch,{epoch:generation});return this.prefs;};
  if(A.prefsSave)A.prefsSave=async function(){const patch={};for(const key of Object.keys(this.prefs))if(!['sectionNames','sectionLocks'].includes(key)&&JSON.stringify(this.prefs[key])!==JSON.stringify(preferenceBaseline[key]))patch[key]=structuredClone(this.prefs[key]);return commitPatch(patch,{epoch:generation});};
  async function prepareSectionSwitch(){
   const dialogs=[...doc.querySelectorAll('dialog[open]')];
   const epoch=generation,who=identity(),scope=[doc.getElementById('content'),...dialogs].filter(Boolean);
   const forms=[...new Set(scope.flatMap(el=>[...(el.tagName==='FORM'?[el]:[]),...Array.from(el.querySelectorAll?.('form')||[])]))],snapshots=forms.map(form=>[form,root.MasarifiInteraction?.fingerprint?.(form)]);
   if(root.MasarifiInteraction?.requestLeave){if(!await root.MasarifiInteraction.requestLeave(scope))return false;}
   else if(dialogs.some(d=>root.MasarifiInteraction?.canClose?.(d)===false)||root.MasarifiInteraction?.canLeave?.(doc.getElementById('content'))===false)return false;
   if(epoch!==generation||who!==identity()||!available())return false;
   return {dialogs,scope,snapshots,epoch,who};
  }
  function input(name,fresh=false){return V6.credentialInput(name,{pin:true,fresh});}
  async function authenticate(id,{purpose='section',aux=false}={}){
   if(!ids.includes(id)||!available())return false;
   const saved=lock(id);if(!saved)return true;
   if(prompt)return prompt.section===id&&prompt.purpose===purpose?prompt.promise:false;
   const epoch=generation,who=identity(),savedSignature=signature(saved);let resolve,verified=false;
   const promise=new Promise(r=>{resolve=r;});
   const still=()=>epoch===generation&&who===identity()&&available()&&signature(lock(id))===savedSignature;
   privateOpening=true;let dialog;try{dialog=A.dialog((purpose==='backup'?root.tr('v85SectionBackup')+' · ':'')+label(id),`<div class="stack v85-section-challenge"><span class="v85-section-lock-mark" aria-hidden="true">${ico('lock')}</span><p>${escape(root.tr(purpose==='backup'?'v85SectionBackupHint':'v85SectionLocked'))}</p>${root.field(root.tr('v85SectionPIN'),input('sectionPIN'))}<p class="hint">${escape(root.tr('v6PINHint'))}</p></div>`,async f=>{
    if(!still())return false;
    await checkPIN(f.get('sectionPIN'),saved,root.hashPassword);if(!still())return false;
    const persisted=(await DB.get('meta','prefs'))?.value;
    if(!still())return false;
    if(signature(persisted?.sectionLocks?.[id])!==savedSignature){clear('credential-changed');return false;}
    if(purpose==='section')grant={section:id,identity:who,signature:savedSignature};verified=true;return true;
   },aux);}finally{privateOpening=false;}
   dialog.classList.add('v85-section-dialog');
   prompt={section:id,purpose,promise,dialog};
   dialog.addEventListener('close',()=>{if(prompt?.dialog===dialog)prompt=null;resolve(verified&&still());},{once:true});
   return promise;
  }
  async function switchSection(id){
   const intent=++switchIntent;
   if(prompt?.purpose==='switch'&&prompt.dialog?.open)prompt.dialog.close();
   if(!ids.includes(id)||!available())return false;
   if(id===active()&&allowed(id))return true;
   const source=active(),page=A.page,prepared=await prepareSectionSwitch();if(!prepared||intent!==switchIntent)return false;
   const {dialogs,scope,snapshots,epoch:originalEpoch,who}=prepared,savedSignature=signature(lock(id));
   const discard=()=>root.MasarifiInteraction?.discardApproval?.(scope);
   // Keep the source draft and its authorization until the target succeeds.
   // An auxiliary PIN dialog leaves a financial form's original nodes intact.
   const main=doc.getElementById('dialog'),aux=!!main?.open;
   if(aux&&doc.getElementById('auxDialog')?.open){discard();return false;}
   if(!await authenticate(id,{purpose:'switch',aux})){discard();return false;}
   const unchanged=intent===switchIntent&&originalEpoch===generation&&who===identity()&&source===active()&&page===A.page&&available()&&signature(lock(id))===savedSignature&&snapshots.every(([form,fingerprint])=>form.isConnected!==false&&(!fingerprint||root.MasarifiInteraction.fingerprint(form)===fingerprint))&&scope.every(el=>!root.MasarifiInteraction?.busy?.(el));
   if(!unchanged){discard();return false;}
   for(const d of dialogs)if(d.open)d.close();clear('switch');const epoch=generation;
   const next={...A.prefs,section:id};
   if(!await writePreferences(next,{epoch,switchIntent:intent})||intent!==switchIntent||epoch!==generation||signature(lock(id))!==savedSignature)return false;
   if(lock(id))grant={section:id,identity:who,signature:savedSignature};
   A.filter={from:'',to:'',type:'all',status:'all',categories:[],q:'',accountId:'all',currency:id==='work'?A.prefs.currencyWork:A.prefs.currencyPersonal};
   A.pageNumber=1;V7.routeState={};V7.pendingRoute=null;
   if(A.page==='account'&&!V6.routeGuardDepth)A.page='accounts';
   if(root.Installments)root.Installments.selected='';
   A.render();return true;
  }
  const financialPages=new Set(['home','accounts','account','records','reports','transfers','installments','overview','intelligence','assistant','categories','budgets']);
  async function beforeRoute(detail={}){
   if(A.locked)return false;
   if(root.Online?.Workspace?.guest?.()||root.Online?.Workspace?.context){clear('workspace');return true;}
   const id=detail.state?.sectionId||detail.sectionId;
   const changing=id&&ids.includes(id)&&id!==active();
   if(changing&&!await switchSection(id))return false;
   if((detail.popstate||detail.back)&&!changing)clear('back');
   else if(financialPages.has(A.page)&&!financialPages.has(detail.page))clear('exit');
   if(financialPages.has(detail.page)&&!allowed())return authenticate(active());
   return true;
  }
  function backupCurrent(ticket){return !!ticket&&backupTickets.has(ticket)&&!A.locked&&available()&&ticket.epoch===generation&&ticket.identity===identity()&&ids.every(id=>ticket.locks[id]===signature(lock(id)));}
  async function authorizeBackup(){
   if(!available()||prompt)return null;
   const ticket={epoch:generation,identity:identity(),locks:Object.fromEntries(ids.map(id=>[id,signature(lock(id))]))};backupTickets.add(ticket);
   for(const id of ids){
    if(!backupCurrent(ticket))return null;
    if(lock(id)&&!(id===active()&&allowed(id))&&!await authenticate(id,{purpose:'backup'}))return null;
    if(!backupCurrent(ticket))return null;
   }
   const latest=(await DB.get('meta','prefs'))?.value;
   if(!backupCurrent(ticket)||ids.some(id=>signature(latest?.sectionLocks?.[id])!==ticket.locks[id]))return null;
   return ticket;
  }
  async function executeBackup(ticket,operation){
   if(!backupCurrent(ticket))return false;
   const previous=manualBackupTicket;manualBackupTicket=ticket;
   try{const result=await operation(ticket);return backupCurrent(ticket)?result===undefined?true:result:false;}finally{if(manualBackupTicket===ticket)manualBackupTicket=previous;}
  }
  async function runFullBackup(operation){
   if(backupFlight)return false;
   const run=(async()=>{const ticket=await authorizeBackup();return ticket?executeBackup(ticket,operation):false;})();
   backupFlight=run;try{return await run;}finally{if(backupFlight===run)backupFlight=null;}
  }
  const S=root.SectionPreferences=root.MasarifiSections={allowed,label,clear,proof,current,epoch:()=>generation,active,switchSection,authenticate,beforeRoute,requireActive,validateWriteScope,scopeOperations,commitFor,needsPreferenceMerge,preparePreferenceWrite,savePatch:(patch,p)=>commitPatch(patch,p,true),authorizeBackup,backupCurrent,runFullBackup};
  const previousBefore=V7.beforeRoute;
  V7.beforeRoute=async detail=>{if(previousBefore&&await previousBefore(detail)===false)return false;return beforeRoute(detail);};
  V6.sectionSwitch=()=>`<div class="segments v85-section-switch" aria-label="${escape(root.tr('section'))}">${ids.map(id=>root.btn('section',label(id),'',active()===id?'active':'',`data-section="${id}" aria-pressed="${active()===id}"`)).join('')}${lock(active())&&allowed()?`<button type="button" data-section-action="lock" aria-label="${escape(root.tr('v85SectionExit'))}" title="${escape(root.tr('v85SectionExit'))}">${ico('lock')}</button>`:''}</div>`;
  function gatePage(){return `<section class="panel v85-section-gate stack"><span class="v85-section-lock-mark" aria-hidden="true">${ico('lock')}</span><h2>${escape(label(active()))}</h2><p>${escape(root.tr('v85SectionLocked'))}</p><div class="row">${V6.sectionSwitch()}<button type="button" class="primary" data-section-action="unlock">${escape(root.tr('v85SectionUnlock'))}</button></div></section>`;}
  function guardPage(fn){return function(){return allowed()?fn.apply(this,arguments):gatePage();};}
  for(const name of ['home','records','reportsPage','transfersPage','assistantPage'])if(typeof A[name]==='function')A[name]=guardPage(A[name]);
  V6.assistantPage=A.assistantPage;
  for(const page of financialPages)if(typeof V7.pages[page]==='function')V7.pages[page]=guardPage(V7.pages[page]);
  // Read projections use the authorized section. Shared account opening balances remain shared.
  const financial=A.financialRows;A.financialRows=function(){return allowed()?financial.apply(this,arguments).filter(r=>r.section===active()):[];};
  A.accountStats=function(account,range={to:C.day()}){requireActive();return B.ledger(account,this.rows.filter(r=>r.section===active()),this.transfers.filter(t=>t.section===active()),range);};
  const movements=V6.movements;V6.movements=function(filter=A.filter,source=A){requireActive();if(source!==A)return movements.call(this,filter,source);return movements.call(this,{...filter,section:active()},source);};
  const analyze=root.SmartAssistant?.analyze;
  if(analyze)root.SmartAssistant.analyze=function(intent,state,deps){requireActive();if(intent.section&&intent.section!==active())throw Error('v85SectionScope');return analyze.call(this,{...intent,section:active()},{...state,section:active(),rows:(state.rows||[]).filter(r=>r.section===active()),transfers:(state.transfers||[]).filter(r=>r.section===active())},deps);};
  const overview=root.MasarifiOverview;
  if(overview){const read=overview.read,availableOverview=overview.available;overview.read=function(){requireActive();return read.apply(this,arguments);};overview.available=()=>allowed()&&availableOverview();}
  const installments=root.Installments;
  if(installments){
   const page=installments.page;installments.page=function(){requireActive();if(this.selected&&this.plans.find(p=>p.id===this.selected)?.section!==active())this.selected='';return page.apply(this,arguments);};
   for(const method of ['card','detail','form','paymentForm']){const base=installments[method];if(base)installments[method]=function(source){const plan=typeof source==='string'?this.plans.find(p=>p.id===source):source;requireActive(plan?.section||active());return financialCall(()=>base.apply(this,arguments));};}
   for(const method of ['pay','savePlan','setStatus']){const base=installments[method];if(base)installments[method]=function(source){const plan=method==='savePlan'?source:this.plans.find(p=>p.id===(method==='pay'?source?.planId:source));requireActive(plan?.section||active());const p=proof();return writeScoped(p,()=>base.apply(this,arguments));};}
  }
  const ai=root.MasarifiAIAssistant;
  if(ai)root.MasarifiAIAssistant=Object.freeze({...ai,open(){requireActive();return ai.open.apply(ai,arguments);}});
  for(const [method,store]of [['rowDetails','rows'],['transferDetails','transfers']]){
   const base=A[method];if(base)A[method]=function(id){const row=this[store].find(r=>r.id===id);requireActive(row?.section||active());return financialCall(()=>base.apply(this,arguments));};
  }
  const transactionForm=A.transactionForm;
  A.transactionForm=function(kind,existing=null,draft={}){const row=typeof existing==='string'?this.rows.find(r=>r.id===existing):existing;requireActive(row?.section||draft?.section||active());return financialCall(()=>transactionForm.apply(this,arguments));};
  for(const method of ['transferForm','statement','prepareReport','drawChart','balanceAt','accountForm']){
   const base=A[method];if(base)A[method]=function(){requireActive();return financialCall(()=>base.apply(this,arguments));};
  }
  const confirmDelete=A.confirmDelete;
  if(confirmDelete)A.confirmDelete=function(store,rows){
   if(!['transactions','transfers','installments'].includes(store))return confirmDelete.apply(this,arguments);
   requireActive();if(rows.some(r=>r.section!==active()))throw Error('v85SectionScope');
   return financialCall(()=>confirmDelete.call(this,store,rows));
  };
  const cancelTransfer=A.cancelTransfer;
  if(cancelTransfer)A.cancelTransfer=function(id){const t=this.transfers.find(t=>t.id===id);requireActive(t?.section||active());return financialCall(()=>cancelTransfer.apply(this,arguments));};
  const visibleTrash=()=>{requireActive();return(A.trash||[]).filter(t=>!t.record?.section||t.record.section===active());};
  if(A.budgetDialog)A.budgetDialog=function(){
   requireActive();const p=proof(),currency=this.filter.currency==='all'?(active()==='work'?this.prefs.currencyWork:this.prefs.currencyPersonal):this.filter.currency,key=active()+':'+currency,old=this.prefs.budget?.[key];
   return financialCall(()=>this.dialog(root.tr('budget')+' · '+label(active())+' — '+currency,`${root.field(root.tr('amount'),`<input name="amount" inputmode="decimal" value="${old?C.fixedMinor(old,C.digits(currency)):''}">`)}<p class="hint">${escape(root.tr('budgetHint'))}</p>`,async f=>{assertProof(p);const value=f.get('amount').trim(),amount=value?C.minor(value,currency,this.prefs.language):0;if(!await commitPatch({budget:{...this.prefs.budget,[key]:amount}},p,true))return false;assertProof(p);this.render();}));
  };
  if(A.trashDialog)A.trashDialog=function(){
   const records=visibleTrash();return financialCall(()=>this.dialog(root.tr('trash')+' · '+label(active()),`<p class="hint">${escape(root.tr('trashHint'))}</p><div class="spacer"></div>${records.length?root.btn('emptyTrash',root.tr('emptyTrash'),'delete','danger'):''}<div class="spacer"></div><div class="stack">${records.slice().reverse().map(t=>`<div class="note-card"><span class="small">${escape(t.deletedAt)}</span><p>${escape(t.record.description||t.record.text||'')}</p>${root.btn('restoreTrash',root.tr('restore'),'check','',`data-id="${escape(t.id)}"`)}</div>`).join('')||this.empty()}</div>`));
  };
  async function trashAction(act,id){
   if(!allowed()&&!await authenticate(active()))return false;requireActive();const p=proof();
   if(act==='trash')return A.trashDialog();
   if(act==='clearSection')return A.confirmDelete('transactions',A.rows.filter(r=>r.section===active()));
   if(act==='emptyTrash'){
    const records=visibleTrash();return financialCall(()=>A.dialog(root.tr('emptyTrash'),`<p>${escape(root.tr('permanentWarning'))}</p><p class="hint">${escape(label(active()))}</p><div class="spacer"></div><label class="check"><input type="checkbox" name="agree" required>${escape(root.tr('agreeDelete'))}</label>`,async f=>{assertProof(p);if(!f.get('agree'))throw Error('required');await DB.commit(scopeOperations(p,records.map(r=>({store:'trash',id:r.id,delete:true}))));assertProof(p);await A.after();assertProof(p);}));
   }
   const t=(A.trash||[]).find(t=>t.id===id);if(!t)return false;
   if(t.record?.section&&t.record.section!==p.section)throw Error('v85SectionScope');
   if(!['transactions','notes','reminders'].includes(t.store))throw Error('invalidBackup');
   return writeScoped(p,async()=>{if(await DB.get(t.store,t.record.id))throw Error('conflict');assertProof(p);await DB.commit(scopeOperations(p,[{store:t.store,value:{...t.record,rev:(t.record.rev||0)+1},expected:0},{store:'trash',id:t.id,delete:true}]));assertProof(p);await A.after();assertProof(p);return A.trashDialog();});
  }
  const Reports=globals.Reports||root.Reports,Share=root.ItemShare;
  if(A.shareText)A.shareText=async function(){
   requireActive();const p=proof(),text=Reports.text(Reports.snapshot());
   if(root.navigator?.share){try{await root.navigator.share({text,title:root.tr('reportTitle')});return;}catch(error){if(error.name==='AbortError')return;}}
   assertProof(p);financialCall(()=>this.dialog(root.tr('shareText'),`<textarea rows="12" readonly>${escape(text)}</textarea><div class="dialog-actions">${root.btn('downloadText',root.tr('download'),'download')}${root.btn('copyReportText',root.tr('copy'),'copy')}${root.btn('whatsappText','WhatsApp','share')}${root.btn('emailText',root.tr('email'),'share')}</div>`),p);this.sharedText=text;
  };
  if(A.shareReport)A.shareReport=async function(){
   requireActive();const p=proof(),file=this.reportFile;if(!file)return;
   try{if(root.navigator?.canShare?.({files:[file]})&&root.navigator.share){await root.navigator.share({files:[file],title:file.name});return;}}
   catch(error){if(error.name==='AbortError')return;}
   assertProof(p);this.downloadBlob(file,file.name);this.toast(root.tr('shareFallback'));
  };
  const stampModel=(model,global=false)=>{if(model)model.sectionAccess=global?globalProof():proof();return model;};
  if(Reports){
   const snapshot=Reports.snapshot;Reports.snapshot=function(){if(A.reportKind!=='notes')requireActive();const model=snapshot.apply(this,arguments);return stampModel(model,model?.kind==='notes');};
   for(const method of ['text','xlsx','blocks']){const base=Reports[method];if(base)Reports[method]=function(model){if(!accessCurrent(model?.sectionAccess))throw Error('v85SectionLocked');return base.apply(this,arguments);};}
   const pages=Reports.pages;if(pages)Reports.pages=async function*(model){if(!accessCurrent(model?.sectionAccess))throw Error('v85SectionLocked');for await(const page of pages.apply(this,arguments)){if(!accessCurrent(model.sectionAccess))throw Error('v85SectionLocked');yield page;}};
  }
  if(Share){
   let opening=null;
   const open=Share.open;Share.open=function(kind,id,options){const global=globalShareKind(kind);if(!global)requireActive();const row=kind==='transaction'?A.rows.find(r=>r.id===id):kind==='transfer'?A.transfers.find(r=>r.id===id):null;if(row)requireActive(row.section);opening=global?globalProof():proof();try{const result=global?open.apply(this,arguments):financialCall(()=>open.apply(this,arguments),opening);if(this.data)this.data.sectionAccess=opening;const dialog=doc.getElementById('shareDialog');if(dialog?.open&&!global)privateDialogs.set(dialog,opening);return result;}finally{opening=null;}};
   const model=Share.model;Share.model=function(){const global=globalShareKind(this.data?.kind);if(!global)requireActive();if(this.data&&!this.data.sectionAccess&&accessCurrent(opening))this.data.sectionAccess=opening;if(!this.data||!accessCurrent(this.data.sectionAccess))throw Error('v85SectionLocked');return stampModel(model.apply(this,arguments),global);};
   for(const method of ['asPDF','asText','sendFile','copyText']){const base=Share[method];if(base)Share[method]=function(){if(!globalShareKind(this.data?.kind))requireActive();if(!accessCurrent(this.data?.sectionAccess))throw Error('v85SectionLocked');return base.apply(this,arguments);};}
  }
  const BankReports=globals.BankReports||root.BankReports;
  if(BankReports){
   for(const method of ['transfer','transfers','account','bank']){const base=BankReports[method];BankReports[method]=function(source){requireActive();if(method==='transfer')requireActive(source?.section);if(method==='transfers'&&source.some(t=>t.section!==active()))throw Error('v85SectionScope');if(method==='account'&&arguments[1]?.rows?.some(r=>r.section&&r.section!==active()))throw Error('v85SectionScope');return stampModel(base.apply(this,arguments));};}
  }
  // User-requested complete exports need all configured section PINs. Internal
  // import recovery and previously configured automatic backup paths are unchanged.
  const downloadBlob=A.downloadBlob;
  if(downloadBlob)A.downloadBlob=function(){if(manualBackupTicket&&!backupCurrent(manualBackupTicket))return false;return downloadBlob.apply(this,arguments);};
  const Photos=globals.Photos||root.Photos,localBackup=A.backup;
  if(Photos){
   const financialPhoto=photo=>['transactions','transfers','installments'].includes(photo?.ownerType);
   const preview=Photos.preview;if(preview)Photos.preview=function(photo){
    if(!available()||!financialPhoto(photo)&&!photoProofs.has(photo))return preview.apply(this,arguments);
    const p=photoProofs.get(photo)||proof();assertProof(p);return financialCall(()=>preview.apply(this,arguments),p);
   };
   const show=Photos.show;if(show)Photos.show=async function(id){
    if(!available())return show.apply(this,arguments);
    const request=++photoRequest,p=proof(),photo=await DB.get('attachments',id);if(request!==photoRequest)return;
    if(!photo)throw Error('photoMissing');
    if(financialPhoto(photo)){assertProof(p);const source=photo.ownerType==='transactions'?A.rows:photo.ownerType==='transfers'?A.transfers:installments?.plans;const owner=source?.find(r=>r.id===photo.ownerId);if(owner)requireActive(owner.section);photoProofs.set(photo,p);}
    this.validate(photo);return this.preview(photo);
   };
   const gallery=Photos.gallery;if(gallery)Photos.gallery=async function(el){
    const p=openingScope||privateDialogs.get(el?.closest?.('dialog'));
    if(!p)return gallery.apply(this,arguments);assertProof(p);if(el)el.sectionAccess=p;
    const result=await gallery.apply(this,arguments);if(!current(p)&&el)el.innerHTML='';return result;
   };
  }
  const media=root.MasarifiMedia;
  if(media?.downloadURL){const downloadURL=media.downloadURL;media.downloadURL=function(url,name,scope,guard=()=>true){const p=scope?.sectionAccess||privateDialogs.get(scope?.closest?.('dialog'));if(!p)return downloadURL.apply(this,arguments);assertProof(p);return downloadURL.call(this,url,name,scope,()=>current(p)&&guard());};}
  if(localBackup)A.backup=function(){return runFullBackup(async ticket=>{
   if(!Photos)return localBackup.apply(this,arguments);
   const data=await Photos.completeBundle();if(!backupCurrent(ticket))return false;
   this.downloadBlob(new root.Blob([JSON.stringify(data)],{type:'application/json'}),'MASARIFI_V5_BACKUP_'+C.day()+'.json');this.toast(root.tr('photoBackup'));return true;
  });};
  const online=root.Online;
  if(online?.exportOnline){const exportOnline=online.exportOnline;online.exportOnline=function(){return runFullBackup(()=>exportOnline.apply(this,arguments));};}
  const Drive=V6.Drive;
  if(Drive?.client){
   const client=Drive.client;let pendingTicket=null,syncTicket=null;
   const backup=Drive.backup;Drive.backup=async function(){const ticket=await authorizeBackup();if(!ticket)return false;pendingTicket=ticket;try{return await backup.apply(this,arguments);}finally{if(!client.state?.hold&&pendingTicket===ticket)pendingTicket=null;}};
   const sync=client.sync;client.sync=async function(options={}){
    if(!options.force)return sync.apply(this,arguments);
    const existing=pendingTicket;pendingTicket=null;const ticket=existing||await authorizeBackup();
    if(!backupCurrent(ticket))return false;
    return executeBackup(ticket,async()=>{syncTicket=ticket;try{return await sync.apply(this,arguments);}finally{if(syncTicket===ticket)syncTicket=null;}});
   };
   const unlocked=client.d.unlocked;client.d.unlocked=()=>unlocked()&&(!syncTicket||backupCurrent(syncTicket));
   const call=client.call;client.call=async function(action){if(action==='sync'&&syncTicket&&!backupCurrent(syncTicket))return false;return call.apply(this,arguments);};
   root.addEventListener('masarifi:section-locked',()=>{if(syncTicket)client.invalidate();});
  }
  // Tag new assistant replies before their existing persistence/render step.
  const put=DB.put;DB.put=async function(store,value){
   if(store==='meta'&&value?.id==='chat'&&askOperation){
    if(!current(askOperation.proof))throw Error('v85SectionLocked');
    for(const m of value.value||[])if(!askOperation.old.has(m))m.section=askOperation.proof.section;
    if(baseCommit)return DB.commit(scopeOperations(askOperation.proof,[{store,value}]));
   }
   return put.apply(this,arguments);
  };
  const ask=A.ask;
  async function guardedAsk(text,forced){
   requireActive();if(askOperation)return;
   const parsed=forced||V7.assistant?.parse?.(String(text||''),{context:A._smartContext,accounts:A.accounts,categories:A.categories})||V6.assistant?.parse?.(String(text||''),{context:A._smartContext,accounts:A.accounts,categories:A.categories});
   for(const q of [parsed,parsed?.first,parsed?.second])if(q?.section&&q.section!==active())throw Error('v85SectionScope');
   if(V6.assistant?.state)V6.assistant.state.contextReady=true;
   askOperation={proof:proof(),old:new Set(A.chat||[])};
   try{return await writeScoped(askOperation.proof,()=>ask.call(A,text,parsed));}finally{askOperation=null;}
  }
  A.ask=guardedAsk;if(V6.assistant)V6.assistant.ask=guardedAsk;if(V7.assistant)V7.assistant.ask=guardedAsk;
  const assistantPage=A.assistantPage;
  A.assistantPage=function(){const all=this.chat;this.chat=(all||[]).filter(m=>m.section===active()||!m.section&&!ids.some(id=>lock(id)));try{return assistantPage.apply(this,arguments);}finally{this.chat=all;}};
  V6.assistantPage=A.assistantPage;
  const settings=A.settingsPage;
  const settingsLink=()=>`<button type="button" class="settings-link" data-act="v6Settings" data-section="sections"><span class="settings-icon">${ico('lock')}</span><span><strong>${escape(root.tr('v85Sections'))}</strong><small>${escape(root.tr('v85SectionsHint'))}</small></span>${ico('arrow')}</button>`;
  if(!V6.settingsItems.some(x=>x[0]==='sections'))V6.settingsItems.push(['sections','v85Sections','v85SectionsHint','lock']);
  function settingsSections(){return `<div class="v85-section-settings stack"><form id="v85SectionNames" class="settings-form panel stack"><div><h2>${escape(root.tr('v85Sections'))}</h2><p class="hint">${escape(root.tr('v85SectionNameHint'))}</p></div><div class="fields">${ids.map(id=>root.field(defaultLabel(id),`<input name="${id}" autocomplete="off" maxlength="80" value="${escape(A.prefs.sectionNames?.[id]||'')}" placeholder="${escape(defaultLabel(id))}" aria-label="${escape(root.tr('v85SectionName')+' · '+defaultLabel(id))}">`)).join('')}</div><p class="form-error" role="alert"></p><div class="settings-save"><button type="submit" class="primary">${ico('check')}${escape(root.tr('save'))}</button></div></form><section class="panel stack"><h2>${escape(root.tr('v85SectionPIN'))}</h2><p class="hint">${escape(root.tr('v85SectionPINHint'))}</p><div class="v85-section-pin-list">${ids.map(id=>`<div class="v85-section-pin-row"><span><strong>${escape(label(id))}</strong><small>${escape(root.tr(lock(id)?'v85SectionPINOn':'v85SectionPINOff'))}</small></span><div class="row"><button type="button" data-section-action="pin" data-section="${id}">${escape(root.tr(lock(id)?'v6PINChange':'v6PINSetup'))}</button>${lock(id)?`<button type="button" data-section-action="remove-pin" data-section="${id}">${escape(root.tr('v85SectionPINRemove'))}</button>`:''}</div></div>`).join('')}</div><p class="notice v85-section-security-note">${escape(root.tr('v85SectionPINBounds'))}</p><p class="hint">${escape(root.tr('v85SectionAutomaticBackup'))}</p></section></div>`;}
  A.settingsPage=function(){
   if(V6.settingsSection==='sections'&&available())return settingsSections();
   const html=settings.apply(this,arguments);if(V6.settingsSection||root.Online?.Workspace?.guest?.())return html;
   const template=doc.createElement('template');template.innerHTML=html;
   const host=template.content.querySelector('.v17-settings-group .settings-menu')||template.content.querySelector('.settings-menu');
   if(host&&!host.querySelector('[data-section="sections"]'))host.insertAdjacentHTML('beforeend',settingsLink());
   return template.innerHTML;
  };
  async function pinSettings(id,remove=false){
   if(!ids.includes(id)||!available())return;
   const saved=lock(id),epoch=generation,who=identity(),savedSignature=signature(saved);
   const still=()=>!A.locked&&available()&&epoch===generation&&who===identity()&&signature(lock(id))===savedSignature;
   return A.dialog(root.tr(remove?'v85SectionPINRemove':'v85SectionPIN')+' · '+label(id),`<div class="stack">${saved?root.field(root.tr('v6CurrentPIN'),input('current')):''}${remove?'':root.field(root.tr('v6NewPIN'),input('new',true))+root.field(root.tr('v6ConfirmPIN'),input('confirm',true))+`<p class="hint">${escape(root.tr('v6PINHint'))}</p>`}<p class="hint">${escape(root.tr('v85SectionPINBounds'))}</p></div>`,async f=>{
    if(!still())return false;
    if(saved)await checkPIN(f.get('current'),saved,root.hashPassword);
    if(!still())return false;
    const nextLocks={...A.prefs.sectionLocks};
    if(remove)delete nextLocks[id];else{if(normalizePIN(f.get('new'))!==normalizePIN(f.get('confirm')))throw Error('v6PINMismatch');nextLocks[id]=await derivePIN(f.get('new'),root.hashPassword);}
    if(!still())return false;
    const persisted=(await DB.get('meta','prefs'))?.value;
    if(!still()||signature(persisted?.sectionLocks?.[id])!==savedSignature)throw Error('conflict');
    if(!await writePreferences({...A.prefs,sectionLocks:nextLocks},{epoch}))return false;
    clear('pin-change');A.render();A.toast(root.tr('v85SectionPINSaved'));return true;
   });
  }
  function paint(){
   const content=doc.getElementById('content');content?.classList.toggle('v85-settings',A.page==='settings');
   if(A.page==='settings')content?.classList.toggle('v85-profile-empty',!A.prefs.avatar);
  }
  function paintSaveInset(viewport=root.MasarifiExperience?.viewport){
   if(!viewport||!doc.documentElement?.style)return;
   const inset=viewport.keyboard?Math.max(0,(root.innerHeight||viewport.height)-viewport.top-viewport.height):0;
   doc.documentElement.style.setProperty('--app-keyboard-inset',Math.round(inset)+'px');
  }
  doc.addEventListener?.('masarifi:viewport',event=>paintSaveInset(event.detail));paintSaveInset();
  const render=A.render;A.render=function(){
   if(grant&&(grant.identity!==identity()||grant.signature!==signature(lock(grant.section))))clear('identity');
   const result=render.apply(this,arguments);paint();return result;
  };
  const load=A.load;A.load=async function(){const result=await load.apply(this,arguments);const record=(await DB.get('meta','prefs'))?.value;if(record){const nextLocks=locks(record.sectionLocks||{}),next=JSON.stringify(nextLocks);if(loadedSignature&&next!==loadedSignature)clear('credential-changed');A.prefs.sectionNames=names(record.sectionNames||{});A.prefs.sectionLocks=nextLocks;loadedSignature=next;preferenceBaseline=structuredClone(A.prefs);paintLabels();}return result;};
  const protectedActions=new Set(['detail','transferDetails','addExpense','addIncome','addTransfer','addTransferFrom','preparePDF','prepareExcel','shareReport','downloadReport','printReport','shareText','downloadText','copyReportText','whatsappText','emailText','downloadItemFile','shareItem','v6AssistantRead','v6VoiceStart','v6Quick','cancelTransfer','deleteRow','copyRow','viewPhoto','statementFilter','statementReset','statementMore','transferReport','openAccountReport']);
  root.addEventListener('click',event=>{
   const button=event.target.closest?.('[data-act],[data-section-action],[data-ai-action],[data-v22],[data-media]');if(!button)return;
   const action=button.dataset.sectionAction,act=button.dataset.act;
   if(['beforeImport','legacyExport'].includes(act)){
    event.preventDefault();event.stopImmediatePropagation();if(A.locked)return;
    runFullBackup(async ticket=>{const data=act==='beforeImport'?(await DB.get('meta','beforeLastImport'))?.value:root.readLegacy?.();if(!backupCurrent(ticket))return false;if(!data){A.toast(root.tr('noData'));return false;}A.downloadBlob(new root.Blob([JSON.stringify(data)],{type:'application/json'}),act==='beforeImport'?'WOW_BEFORE_LAST_IMPORT.json':'WOW_LEGACY_RECOVERY_'+C.day()+'.json');return true;}).catch(error=>A.error(error));return;
   }
   if(['trash','clearSection','restoreTrash','emptyTrash','budget'].includes(act)){
    event.preventDefault();event.stopImmediatePropagation();(act==='budget'?(async()=>{if(allowed()||await authenticate(active()))return A.budgetDialog();})():trashAction(act,button.dataset.id)).catch(error=>A.error(error));return;
   }
   if(act==='section'||act==='v17SelectSection'||action){
    event.preventDefault();event.stopImmediatePropagation();if(A.locked)return;
    const operation=['section','v17SelectSection'].includes(act)?switchSection(act==='v17SelectSection'?button.dataset.v17Section:button.dataset.section):action==='unlock'?authenticate(active()).then(ok=>{if(ok)A.render();}):action==='lock'?(clear('manual'),A.render(),null):action==='pin'?pinSettings(button.dataset.section):action==='remove-pin'?pinSettings(button.dataset.section,true):null;
    Promise.resolve(operation).catch(error=>A.error(error));return;
   }
   const financialMedia=button.dataset.media&&available()&&(financialPages.has(A.page)||privateDialogs.has(button.closest?.('dialog')));
   const globalShare=act==='shareItem'?globalShareKind(button.dataset.kind):act==='downloadItemFile'&&globalShareKind(Share?.data?.kind);
   if((protectedActions.has(act)&&!globalShare||button.dataset.aiAction||button.dataset.v22||financialMedia)&&!allowed()){event.preventDefault();event.stopImmediatePropagation();A.toast(root.tr('v85SectionLocked'));return;}
   if(act==='v6AssistantRead'){
    const reply=[...(A.chat||[])].reverse().find(m=>m.role==='assistant'&&(m.section===active()||!m.section&&!ids.some(id=>lock(id))));
    event.preventDefault();event.stopImmediatePropagation();if(reply&&root.SpeechSynthesisUtterance){root.speechSynthesis?.cancel();const speech=new root.SpeechSynthesisUtterance(reply.text);speech.lang=({ar:'ar',tr:'tr-TR',en:'en-US',fr:'fr-FR'})[A.prefs.language]||'en-US';root.speechSynthesis?.speak(speech);}
   }
  },true);
  root.addEventListener('submit',event=>{
   const form=event.target;if(form.id==='v85SectionNames'){
    event.preventDefault();event.stopImmediatePropagation();if(A.locked)return;
    const button=form.querySelector('[type="submit"]'),epoch=generation,who=identity();if(button.disabled)return;
    const data=new root.FormData(form),submittedFingerprint=root.MasarifiInteraction?.fingerprint?.(form),controls=Array.from(form.elements||[]).map(el=>[el,el.disabled]);
    const still=()=>!A.locked&&epoch===generation&&who===identity()&&form.isConnected&&A.page==='settings'&&V6.settingsSection==='sections'&&doc.getElementById('v85SectionNames')===form;
    button.disabled=true;form.dataset.busy='1';form.setAttribute('aria-busy','true');for(const [el]of controls)el.disabled=true;form.querySelector('.form-error').textContent='';
    (async()=>{try{const sectionNames=names(Object.fromEntries(ids.map(id=>[id,data.get(id)||''])));if(await writePreferences({...A.prefs,sectionNames},{epoch})&&still()){
     if(!submittedFingerprint||root.MasarifiInteraction.fingerprint(form)===submittedFingerprint){root.MasarifiInteraction?.markSaved?.(form);A.invalidateReport();A.render();}A.toast(root.tr('saved'));
    }}catch(error){if(still())A.error(error,form.querySelector('.form-error'));}finally{for(const [el,disabled]of controls)el.disabled=disabled;delete form.dataset.busy;form.removeAttribute('aria-busy');button.disabled=false;}})();return;
   }
   const section=form.elements?.namedItem?.('section');
   if(available()&&section&&ids.includes(section.value)&&!allowed(section.value)){event.preventDefault();event.stopImmediatePropagation();A.error(Error(section.value!==active()?'v85SectionScope':'v85SectionLocked'),form.querySelector('.form-error'));}
  },true);
  root.addEventListener('v6:locked',()=>clear('app-lock'));
  root.addEventListener('pagehide',()=>clear('page-exit'));
  root.addEventListener('masarifi:identity-changed',()=>clear('identity'));
  return S;
 }
 return {ids,normalizePIN,validPIN,cleanName,names,credential,locks,signature,derivePIN,checkPIN,install};
});
