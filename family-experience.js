(function(root){'use strict';
const keys=['add_expense','add_income','edit_own','edit_others','delete_own','delete_others','view_history','view_balance','view_members','invite'];
function state(snapshot,{uid,drafts=[],connection={},permissions={}}={}){
 if(!uid||!snapshot?.box?.id)return null;
 const revoked=!!snapshot.accessRevoked,role=permissions.role||snapshot.limits?.role||'viewer';
 const rights=Object.fromEntries(keys.map(key=>[key,!revoked&&(role==='owner'||(!['add_expense','add_income','edit_own','edit_others','delete_own','delete_others'].includes(key)||role==='contributor')&&!!permissions['can_'+key])]));
 const rows=drafts.filter(row=>row.userId===uid&&row.boxId===snapshot.box.id);
 const status=revoked?'revoked':snapshot.unavailable?'unavailable':connection.state||'connecting';
 return{boxId:snapshot.box.id,role,rights,connection:status,pending:rows.filter(row=>row.status==='pending').length,rejected:rows.filter(row=>row.status==='rejected').length,lastSync:connection.lastSync||null,canRetry:['ready','error','retrying'].includes(status)};
}
if(typeof module==='object'&&module.exports)module.exports={state};
const O=root.Online,W=O?.Workspace,App=root.App;if(!O||!W||!App||!root.document)return;
const languages=['ar','tr','en','fr'],labels={
 syncAll:['مزامنة جميع صناديقي','Tüm kasalarımı eşitle','Sync all my cashboxes','Synchroniser toutes mes caisses'],syncTime:['آخر مزامنة للحساب','Son hesap eşitlemesi','Last account sync','Dernière synchronisation du compte'],
 title:['حالة الصندوق المشترك','Paylaşılan kasa durumu','Shared cashbox status','État de la caisse partagée'],
 rights:['صلاحياتك في هذا الصندوق','Bu kasadaki yetkileriniz','Your cashbox permissions','Vos droits dans cette caisse'],
 yes:['مسموح','İzin var','Allowed','Autorisé'],no:['غير مسموح','İzin yok','Not allowed','Non autorisé'],
 ready:['جاهز للمزامنة','Eşitlemeye hazır','Ready to sync','Prêt à synchroniser'],syncing:['جارٍ المزامنة','Eşitleniyor','Syncing','Synchronisation'],connecting:['جارٍ التحقق من الاتصال','Bağlantı doğrulanıyor','Checking connection','Vérification de la connexion'],
 offline:['غير متصل بالإنترنت','İnternet bağlantısı yok','Offline','Hors connexion'],local:['الاتصال متوقف باختيارك','Bağlantı tercihinizle durduruldu','Connection paused by you','Connexion suspendue par vous'],
 error:['تعذر إكمال المزامنة','Eşitleme tamamlanamadı','Sync could not finish','Échec de synchronisation'],retrying:['ستُعاد المزامنة تلقائيًا','Otomatik tekrar denenecek','Sync will retry automatically','Nouvelle tentative automatique'],
 unavailable:['الوصول غير متاح حاليًا','Erişim şu an kullanılamıyor','Access currently unavailable','Accès indisponible'],revoked:['أُلغيت صلاحية الوصول','Erişim kaldırıldı','Access revoked','Accès révoqué'],
 queued:['تنتظر المزامنة','Eşitleme bekliyor','Waiting to sync','En attente de synchronisation'],rejected:['تحتاج إلى مراجعة','İnceleme gerekiyor','Needs review','À vérifier'],
 queue:['مراجعة الحركات المعلقة','Bekleyen işlemleri incele','Review queued changes','Vérifier les opérations en attente'],
 note:['الحركات المعلقة محفوظة على هذا الجهاز. الرصيد والحدود المعروضة تخص الحركات التي اعتمدها الخادم.','Bekleyen işlemler bu cihazda kayıtlıdır. Gösterilen bakiye ve limitler sunucunun onayladığı işlemlere aittir.','Queued changes are saved on this device. Displayed balances and limits reflect server-confirmed entries.','Les opérations en attente sont enregistrées sur cet appareil. Soldes et plafonds affichés concernent les opérations confirmées par le serveur.'],
 scope:['تخص هذه الصلاحيات الصندوق الحالي. يراجع الخادم الصلاحية والحدود عند اعتماد كل حركة.','Bu yetkiler yalnızca bu kasaya aittir. Sunucu her işlemde yetki ve limitleri denetler.','These permissions apply to this cashbox. The server checks access and limits when confirming each entry.','Ces droits concernent cette caisse. Le serveur vérifie les droits et plafonds lors de chaque confirmation.'],
 edit_own:['تعديل حركاتك','Kendi işlemlerini düzenle','Edit your entries','Modifier vos opérations'],edit_others:['تعديل حركات الآخرين','Başkalarının işlemlerini düzenle','Edit others’ entries','Modifier les opérations des autres'],delete_own:['حذف حركاتك','Kendi işlemlerini sil','Delete your entries','Supprimer vos opérations'],delete_others:['حذف حركات الآخرين','Başkalarının işlemlerini sil','Delete others’ entries','Supprimer les opérations des autres'],
 view_history:['عرض الحركات','İşlemleri gör','View entries','Voir les opérations'],view_balance:['عرض الرصيد','Bakiyeyi gör','View balance','Voir le solde'],view_members:['عرض الأعضاء','Üyeleri gör','View members','Voir les membres'],invite:['دعوة مشاركين','Katılımcı davet et','Invite members','Inviter des membres'],add_expense:['إضافة مصروف','Gider ekle','Add expense','Ajouter une dépense'],add_income:['إضافة إيراد','Gelir ekle','Add income','Ajouter une recette']
};
const text=key=>labels[key]?.[Math.max(0,languages.indexOf(App.prefs.language))]||key;
const escape=value=>root.Core.escape(String(value??''));
const H=O.FamilyExperience={state};
H.current=id=>{if(App.locked||!O.user||W.identity!==O.user.id)return null;const snap=O.snapshots.get(id);if(!snap)return null;return{snap,model:state(snap,{uid:O.user.id,drafts:O.pending,connection:O.syncStatus(),permissions:O.familyPermissions(snap)})};};
H.signature=m=>JSON.stringify([O.user?.id,App.prefs.language,m.role,m.connection,m.pending,m.rejected,m.lastSync,m.canRetry]);
H.html=id=>{const item=H.current(id);if(!item)return '';const m=item.model,button=(action,label,disabled=false)=>`<button type="button" data-family-status-action="${action}" data-box="${escape(id)}"${disabled?' disabled':''}>${escape(label)}</button>`;
 let date='';if(m.lastSync&&Number.isFinite(new Date(m.lastSync).getTime()))date=new Date(m.lastSync).toLocaleString(languages.includes(App.prefs.language)?App.prefs.language:'en');
 return `<section class="panel family-status" data-family-status="${escape(id)}" data-family-status-revision="${escape(H.signature(m))}" aria-label="${escape(text('title'))}"><div class="family-status-main"><div><h3>${escape(text('title'))}</h3><small>${escape(O.t(m.role))}</small></div><span class="family-connection" data-state="${escape(m.connection)}" role="status">${escape(text(m.connection))}</span></div>${date?`<small class="muted">${escape(text('syncTime'))}: <bdi>${escape(date)}</bdi></small>`:''}${m.pending||m.rejected?`<div class="family-queue"><span><bdi>${m.pending}</bdi> ${escape(text('queued'))}</span><span><bdi>${m.rejected}</bdi> ${escape(text('rejected'))}</span></div><p class="hint">${escape(text('note'))}</p>`:''}<div class="family-status-tools">${button('rights',text('rights'))}${button('sync',text('syncAll'),!m.canRetry)}${m.pending||m.rejected?button('queue',text('queue')):''}</div></section>`;
};
H.paint=()=>{for(const card of document.querySelectorAll('[data-family-status]')){const id=card.dataset.familyStatus,item=H.current(id);if(!item){card.remove();continue;}if(card.dataset.familyStatusRevision===H.signature(item.model))continue;const active=document.activeElement,action=card.contains?.(active)?active?.dataset.familyStatusAction:null;card.outerHTML=H.html(id);if(action){const replacement=[...document.querySelectorAll('[data-family-status]')].find(node=>node.dataset.familyStatus===id),buttons=[...replacement?.querySelectorAll('[data-family-status-action]')||[]],next=buttons.find(button=>button.dataset.familyStatusAction===action&&!button.disabled)||buttons.find(button=>!button.disabled);next?.focus({preventScroll:true});}}};
const page=O.boxPage;O.boxPage=function(snapshot){return H.html(snapshot.box.id)+page.apply(this,arguments);};
root.addEventListener('masarifi:sync-state',H.paint);
root.addEventListener('v6:locked',H.paint);
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-family-status-action]');if(!button||button.disabled)return;
 event.preventDefault();const id=button.dataset.box,item=H.current(id);if(!item)return;
 try{switch(button.dataset.familyStatusAction){
 case 'rights': O.modal(text('rights'),`<div class="family-rights"><p class="hint">${escape(text('scope'))}</p><dl>${keys.map(key=>`<div><dt>${escape(text(key))}</dt><dd data-allowed="${item.model.rights[key]}">${escape(text(item.model.rights[key]?'yes':'no'))}</dd></div>`).join('')}</dl></div>`);break;
 case 'sync': if(item.model.canRetry)O.retrySync();break;
 case 'queue': {const section=[...document.querySelectorAll('[data-family-drafts]')].find(node=>node.dataset.familyDrafts===id);if(section){section.scrollIntoView({behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});section.focus({preventScroll:true});}break;}
 }}catch(error){App.error(error);}
});
})(typeof window==='undefined'?globalThis:window);
