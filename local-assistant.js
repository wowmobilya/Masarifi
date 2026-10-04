/* Focused local assistant UI. Reuses guarded ledger forms and user-triggered browser dictation. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.install(root,{DB:typeof DB==='undefined'?root.DB:DB});})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const languages=['ar','tr','en','fr'];
 const words={
 title:['مساعدك المالي','Finans asistanınız','Your finance assistant','Votre assistant financier'],
 badge:['محلي • جاهز','Yerel • hazır','Local • ready','Local • prêt'],
 intro:['اكتب أو قل ما تريد تسجيله أو معرفته. أفهم أوامر محددة وأحسب من سجلات هذا القسم.','Kaydetmek veya öğrenmek istediğinizi yazın ya da söyleyin. Belirli komutları anlar, bu bölümün kayıtlarından hesaplarım.','Type or say what you want to record or check. I understand specific commands and calculate from this section’s records.','Écrivez ou dites ce que vous voulez enregistrer ou consulter. Je comprends des commandes précises et calcule à partir des écritures de cette section.'],
 steps:['1 اكتب أو أمْلِ الطلب · 2 راجع التفاصيل · 3 اختر التصنيف واحفظ','1 Yazın veya söyleyin · 2 Ayrıntıları kontrol edin · 3 Kategori seçip kaydedin','1 Type or dictate · 2 Review the details · 3 Choose a category and save','1 Écrivez ou dictez · 2 Vérifiez les détails · 3 Choisissez une catégorie et enregistrez'],
 scope:['القسم الحالي','Geçerli bölüm','Current section','Section actuelle'],
 examples:['جرّب مثالًا ثم عدّله','Bir örnek seçip düzenleyin','Try an example, then edit it','Choisissez un exemple, puis modifiez-le'],
 expense:['سجّل مصروفًا','Gider kaydet','Record expense','Noter une dépense'],income:['سجّل دخلًا','Gelir kaydet','Record income','Noter un revenu'],month:['مصروفات الشهر','Aylık giderler','Monthly spending','Dépenses du mois'],categories:['أكثر التصنيفات إنفاقًا','En çok harcanan kategori','Top spending categories','Catégories les plus dépensées'],accounts:['افتح الصناديق','Kasaları aç','Open cashboxes','Ouvrir les caisses'],
 exampleExpense:['سجل مصروف 150 {currency} صندوق {box} طعام اليوم','Gider 150 {currency} kasa {box} yemek bugün','Record expense 150 {currency} cashbox {box} food today','Enregistrer une dépense 150 {currency} caisse {box} repas aujourd’hui'],
 exampleIncome:['سجل دخل 500 {currency} صندوق {box} راتب اليوم','Gelir 500 {currency} kasa {box} maaş bugün','Record income 500 {currency} cashbox {box} salary today','Enregistrer revenu 500 {currency} caisse {box} salaire aujourd’hui'],
 exampleMonth:['مصروفاتي هذا الشهر','Bu ay harcamalar','Expenses this month','Dépenses ce mois'],
 exampleCategories:['أكثر تصنيف صرفت عليه هذا الشهر','Bu ay en çok harcadığım kategori','Top spending categories this month','Catégories les plus dépensées ce mois'],
 exampleAccounts:['افتح الحسابات','Hesapları aç','Open accounts','Ouvrir les comptes'],
 input:['طلبك','İsteğiniz','Your request','Votre demande'],
 placeholder:['مثال: سجل مصروف 150 TRY للطعام اليوم','Örnek: Gider 150 TRY yemek bugün','Example: Record expense 150 TRY for food today','Exemple : Enregistrer une dépense 150 TRY repas aujourd’hui'],
 send:['فهم الطلب','İsteği işle','Process request','Comprendre la demande'],
 local:['أوامر بقواعد محلية، دون نموذج ذكاء اصطناعي خارجي. لا يُحفظ شيء بمجرد الكلام أو إرسال الطلب.','Yerel kurallara dayalı komutlar; harici yapay zekâ modeli yoktur. Konuşmak veya isteği göndermek kayıt oluşturmaz.','Rule-based local commands, with no external AI model. Speaking or sending a request never saves an entry.','Commandes à règles locales, sans modèle d’IA externe. Parler ou envoyer une demande n’enregistre aucune opération.'],
 voice:['الصوت اختياري. قد تُعالج خدمة الصوت في المتصفح التسجيل عبر الإنترنت، ويختلف الدعم حسب الجهاز. يمكنك الكتابة دائمًا.','Ses isteğe bağlıdır. Tarayıcının konuşma sağlayıcısı sesi internet üzerinden işleyebilir; destek cihaza göre değişir. Her zaman yazabilirsiniz.','Voice is optional. Your browser’s speech provider may process audio online; support varies by device. You can always type.','La voix est facultative. Le fournisseur vocal du navigateur peut traiter l’audio en ligne ; la prise en charge dépend de l’appareil. Vous pouvez toujours écrire.'],
 draftTitle:['تفاصيل الطلب • لم يُحفظ بعد','İstek ayrıntıları • henüz kaydedilmedi','Request details • not saved yet','Détails de la demande • non enregistrés'],
 missing:['أكمل أو صحّح الحقول الفارغة أدناه.','Aşağıdaki boş alanları doldurun veya düzeltin.','Complete or correct the empty fields below.','Complétez ou corrigez les champs vides ci-dessous.'],
 reviewHint:['راجع الصندوق والمبلغ والتاريخ. بعدها تفتح استمارة العملية لاختيار التصنيف والحفظ بنفسك.','Kasayı, tutarı ve tarihi kontrol edin. Ardından işlem formunda kategori seçip kendiniz kaydedin.','Check the cashbox, amount and date. Next, the entry form lets you choose the category and save.','Vérifiez la caisse, le montant et la date. Le formulaire suivant vous permet de choisir la catégorie et d’enregistrer.'],
 review:['مراجعة العملية واختيار التصنيف','İşlemi kontrol et ve kategori seç','Review entry and choose category','Vérifier et choisir la catégorie'],
 discard:['إلغاء المسودة','Taslağı iptal et','Discard draft','Annuler le brouillon'],
 choose:['اختر…','Seçin…','Choose…','Choisissez…'],
 type:['نوع العملية','İşlem türü','Entry type','Type d’opération'],amount:['المبلغ','Tutar','Amount','Montant'],currency:['العملة','Para birimi','Currency','Devise'],accountId:['الصندوق','Kasa','Cashbox','Caisse'],date:['التاريخ','Tarih','Date','Date'],description:['الوصف','Açıklama','Description','Description'],
 expenseType:['مصروف','Gider','Expense','Dépense'],incomeType:['دخل','Gelir','Income','Revenu'],
 dateHint:['التاريخ هو اليوم إذا لم تحدد تاريخًا آخر.','Başka tarih belirtmediyseniz bugün kullanılır.','The date is today unless you specified another day.','La date est aujourd’hui sauf si vous avez précisé un autre jour.'],
 result:['رد المساعد','Asistan yanıtı','Assistant reply','Réponse de l’assistant'],
 savedSource:['حساب محلي من سجلات هذا القسم المحفوظة.','Bu bölümün kayıtlı verilerinden yerel hesaplama.','Calculated locally from this section’s saved records.','Calcul local à partir des écritures enregistrées dans cette section.'],
 noRows:['لا توجد مصروفات مطابقة لهذه الفترة.','Bu dönemle eşleşen gider yok.','No matching expenses for this period.','Aucune dépense correspondante pour cette période.'],
 topHint:['أعلى 3 تصنيفات لكل عملة. يشمل رسوم التحويل، ولا يجمع العملات.','Her para birimi için ilk 3 kategori. Transfer ücretleri dahildir; para birimleri birleştirilmez.','Top 3 categories per currency. Includes transfer fees; currencies stay separate.','Les 3 premières catégories par devise. Frais de transfert inclus ; devises séparées.'],
 uncategorized:['بلا تصنيف','Kategorisiz','Uncategorized','Sans catégorie'],
 history:['المحادثة السابقة','Önceki konuşma','Previous conversation','Conversation précédente'],
 cloudTitle:['الذكاء الاصطناعي السحابي','Bulut yapay zekâ','Cloud AI','IA cloud'],
 cloudStatus:['غير مفعّل','Yapılandırılmadı','Not configured','Non configuré'],
 cloudHint:['خدمة الذكاء الاصطناعي السحابية الاختيارية غير مفعّلة في هذا الإصدار. استخدم الأوامر المحلية أعلاه للتسجيل والاستعلام.','İsteğe bağlı bulut yapay zekâ hizmeti bu sürümde yapılandırılmadı. Kayıt ve sorgu için yukarıdaki yerel komutları kullanın.','The optional cloud AI service is not configured in this release. Use the local commands above to record and query.','Le service IA cloud facultatif n’est pas configuré dans cette version. Utilisez les commandes locales ci-dessus pour saisir et consulter.'],
 sectionError:['يشير الطلب إلى قسم آخر. افتح القسم المطلوب أولًا، أو عدّل طلبك للقسم الحالي. لم يُحفظ شيء.','İstek başka bir bölümü belirtiyor. Önce o bölümü açın veya isteği geçerli bölüm için düzenleyin. Hiçbir şey kaydedilmedi.','This request refers to another section. Open that section first, or edit the request for the current one. Nothing was saved.','Cette demande concerne une autre section. Ouvrez-la d’abord ou modifiez la demande pour la section actuelle. Rien n’a été enregistré.'],
 fieldError:['تحقق من هذا الحقل: ','Şu alanı kontrol edin: ','Check this field: ','Vérifiez ce champ : '],
 languageChanged:['تغيّرت لغة الإدخال. راجع النص ثم اضغط فهم الطلب مجددًا.','Giriş dili değişti. Metni kontrol edip isteği yeniden işleyin.','Input language changed. Check the text, then process the request again.','La langue de saisie a changé. Vérifiez le texte, puis renvoyez la demande.'],
 noAccounts:['أضف صندوقًا في هذا القسم أولًا.','Önce bu bölüme bir kasa ekleyin.','Add a cashbox in this section first.','Ajoutez d’abord une caisse dans cette section.'],
 guide:['للتسجيل، اذكر دخلًا أو مصروفًا ومبلغًا وعملة وصندوقًا. للاستعلام، جرّب مصروفات الشهر أو أكثر التصنيفات إنفاقًا.','Kayıt için gelir veya gider, tutar, para birimi ve kasa belirtin. Sorgu için aylık giderleri veya en çok harcanan kategorileri deneyin.','To record, give income or expense, an amount, currency and cashbox. To query, try monthly spending or top spending categories.','Pour saisir, indiquez revenu ou dépense, montant, devise et caisse. Pour consulter, essayez les dépenses du mois ou les catégories les plus dépensées.']
 };
 function install(root,refs={}){
  if(root.MasarifiLocalAssistant)return root.MasarifiLocalAssistant;
  const A=root.App,C=root.Core,L=root.MasarifiLocalAssistantCore,V=root.V6,session=V?.assistant,doc=root.document,S=root.SectionPreferences,db=refs.DB||root.DB;
  if(!A||!C||!L||!session||!doc)return null;
  const t=k=>words[k]?.[Math.max(0,languages.indexOf(A.prefs.language))]||root.tr(k),E=value=>L.latin(String(value??'')).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const language=()=>session.state.language==='auto'?A.prefs.language:session.state.language;
  const options=()=>({Core:C,parse:root.MasarifiAssistantV7.parse,normalize:root.SmartAssistant.normalize,accounts:A.accounts,categories:A.categories,section:A.prefs.section,language:language(),today:C.day()});
  const identity=()=>JSON.stringify([A.prefs.section,language(),root.SectionWorkspaces?.scope?.(),S?.epoch?.(),root.Online?.user?.id,root.Online?.authEpoch,root.Online?.modeEpoch,V.lockGeneration,root.V5?.lockGeneration]);
  const allowed=()=>!A.locked&&A.page==='assistant'&&!root.Online?.Workspace?.context&&!root.Online?.Workspace?.guest?.()&&S?.allowed?.(A.prefs.section)!==false;
  const gate=L.reviewGate();let pending=null,response='',origin=null,screenIdentity=null;
  const context=()=>({identity:identity(),proof:S?.proof?.(),db:db?.db});
  const current=proof=>!!proof&&allowed()&&proof.identity===identity()&&proof.db===db?.db&&(!proof.proof||!S?.current||S.current(proof.proof));
  function reset(clearText=false){gate.cancel();pending=null;response='';origin=null;if(clearText){session.cleanup();session.state.draft='';session.state.interim='';}}
  function scopeLabel(){return root.SectionWorkspaces?.label?.()||S?.label?.(A.prefs.section)||root.tr(A.prefs.section);}
  function example(key){const account=L.activeAccounts(options())[0],currency=account?.currency||'TRY',box=account?.slot||1;return t('example'+key[0].toUpperCase()+key.slice(1)).replace('{currency}',currency).replace('{box}',String(box));}
  function control(name,value,choices){const label=t(name);return `<label>${E(label)}${choices?`<select name="${name}" data-local-field="${name}" required><option value="">${E(t('choose'))}</option>${choices.map(([id,title])=>`<option value="${E(id)}" ${value===id?'selected':''}>${E(title)}</option>`).join('')}</select>`:`<input name="${name}" data-local-field="${name}" ${name==='date'?'type="date"':name==='amount'?'inputmode="decimal" autocomplete="off"':''} value="${E(value)}" required ${name==='description'?'maxlength="4000"':''}>`}</label>`;}
  function draftHTML(){if(!pending)return '';const f=pending.fields,accounts=L.activeAccounts(options()).filter(a=>!f.currency||a.currency===f.currency),currencies=unique(A.accounts.filter(a=>!a.deleted&&!a.archived).map(a=>a.currency));
   return `<section class="local-assistant-draft" aria-labelledby="localDraftTitle"><h3 id="localDraftTitle">${E(t('draftTitle'))}</h3><p class="hint">${E(pending.missing.length?t('missing'):t('reviewHint'))}</p><form id="localAssistantDraft"><div class="local-assistant-fields">${control('type',f.type,[['expense',t('expenseType')],['income',t('incomeType')]])}${control('amount',f.amount)}${control('currency',f.currency,currencies.map(c=>[c,c]))}${control('accountId',f.accountId,accounts.map(a=>[a.id,A.accountName(a)+' · '+a.currency]))}${control('date',f.date)}${control('description',f.description)}</div><p class="hint">${E(t('scope'))}: ${E(scopeLabel())} · ${E(t('dateHint'))}</p><p class="hint">${E(t('reviewHint'))}</p><p data-local-error class="form-error" role="alert"></p><div class="row"><button type="submit" class="primary">${E(t('review'))}</button><button type="button" data-local-action="discard">${E(t('discard'))}</button></div></form></section>`;
  }
  function page(){
   if(screenIdentity&&screenIdentity!==identity())reset(true);screenIdentity=identity();
   if(!allowed())return '';
   if(!(root.SpeechRecognition||root.webkitSpeechRecognition))session.state.status='v6AssistantUnavailable';
   const history=(A.chat||[]).filter(m=>m.section===A.prefs.section||!m.section&&!Object.values(A.prefs.sectionLocks||{}).some(Boolean)).slice(-12);
   const button=(act,key,extra='')=>`<button type="button" data-act="${act}" ${extra}>${E(root.tr(key))}</button>`;
   return `<section class="panel stack v6-assistant local-assistant"><header class="local-assistant-header"><div><span class="local-assistant-badge">${E(t('badge'))}</span><h2>${E(t('title'))}</h2></div><span class="local-assistant-scope">${E(t('scope'))}: <bdi>${E(scopeLabel())}</bdi></span></header><p class="local-assistant-intro">${E(t('intro'))}</p><p class="hint local-assistant-steps">${E(t('steps'))}</p><div class="local-assistant-examples" aria-label="${E(t('examples'))}">${['expense','income','month','categories','accounts'].map(key=>`<button type="button" data-local-example="${key}">${E(t(key))}</button>`).join('')}</div><p class="hint">${E(t('examples'))}</p><form id="v6AssistantForm" class="v6-assistant-compose"><label for="v6AssistantText">${E(t('input'))}</label><textarea id="v6AssistantText" name="message" required rows="3" maxlength="4000" dir="auto" placeholder="${E(t('placeholder'))}" aria-describedby="v6AssistantReview localVoiceDisclosure">${E(session.state.draft)}</textarea><div id="v6AssistantInterim" class="v6-assistant-interim" dir="auto" aria-live="polite" ${session.state.interim?'':'hidden'}>${E(session.state.interim)}</div><div class="v6-assistant-controls">${button('v6VoiceStart','v6AssistantStart',session.state.active||!(root.SpeechRecognition||root.webkitSpeechRecognition)?'disabled':'')}${button('v6VoiceStop','v6AssistantStop',session.state.active?'':'hidden')}${button('v6VoiceCancel','v6AssistantCancel',session.state.active?'':'hidden')}<button type="submit" class="primary" ${session.state.active||session.state.busy?'disabled':''}>${E(t('send'))}</button></div><p id="v6AssistantStatus" class="hint" role="status">${E(root.tr(session.state.status))}</p><p id="v6AssistantReview" class="hint">${E(t('local'))}</p><details class="local-assistant-voice-options"><summary>${E(root.tr('v6AssistantOptions'))}</summary><label for="v6AssistantLanguage">${E(root.tr('v6AssistantLanguage'))}</label><select id="v6AssistantLanguage"><option value="auto" ${session.state.language==='auto'?'selected':''}>${E(root.tr('v6AssistantAuto'))}</option>${languages.map((lang,i)=>`<option value="${lang}" ${session.state.language===lang?'selected':''}>${['العربية','Türkçe','English','Français'][i]}</option>`).join('')}</select></details><p class="hint local-voice-disclosure" id="localVoiceDisclosure">${E(t('voice'))}</p></form>${response?`<section class="local-assistant-result" role="status" aria-live="polite"><h3>${E(t('result'))}</h3><p dir="auto">${E(response)}</p></section>`:''}${draftHTML()}${history.length?`<details class="local-assistant-history" open><summary>${E(t('history'))}</summary><div id="chatMessages" class="chat" aria-live="polite">${history.map(m=>`<div class="message ${m.role==='user'?'user':''}" dir="auto">${E(m.text)}</div>`).join('')}</div><div class="row">${button('v6AssistantRead','v6AssistantRead')}${button('v6AssistantStopRead','v6AssistantStopRead')}${button('clearChat','clearChat')}</div></details>`:''}<details class="local-assistant-cloud"><summary>${E(t('cloudTitle'))}<span>${E(t('cloudStatus'))}</span></summary><p class="hint">${E(t('cloudHint'))}</p></details></section>`;
  }
  function review(fields){
   if(!pending)return false;
   if(!current(origin)){reset(true);return false;}
   const draft=L.validate({...fields,section:pending.fields.section},options());
   if(!gate.take(pending.ticket,identity()))return false;
   const proof=origin;pending=null;response='';session.voice.cleanup();
   if(!current(proof))return false;
   A.transactionForm(draft.type,null,draft);
   const form=doc.querySelector('#dialog[open] form');if(form&&current(proof)){
    const date=form.elements?.namedItem?.('date');if(date)date.value=draft.date+'T'+C.local().slice(11,16);
    root.MasarifiCategoryGuard?.reset(form);
    const notice=doc.createElement('p');notice.className='notice';notice.textContent=t('reviewHint');form.prepend(notice);
   }
   session.state.draft='';return true;
  }
  const previousAsk=A.ask;
  A.ask=async function(text,forced){
   if(!allowed()||session.state.busy||session.state.active)return;
   text=String(text||'').trim().slice(0,4000);if(!text)return;
   session.voice.cleanup();root.speechSynthesis?.cancel();
   reset();origin=context();session.state.draft=text;
   const result=L.prepare(text,options());
   if(result.kind==='draft'){
    if(result.errors.includes('section'))response=t('sectionError');
    else if(!L.activeAccounts(options()).length)response=t('noAccounts');
    else pending={...result,ticket:gate.begin(identity())};
    A._smartContext=null;A.render();doc.querySelector('#localAssistantDraft [required]')?.focus?.();return;
   }
   const q=L.query(text,options());
   if(q?.kind==='navigate'){await root.V7.navigate(q.page);return;}
   if(q?.kind==='clarify'){response=q.reason==='section'?t('sectionError'):t('fieldError')+t(q.reason==='account'?'accountId':q.reason);A.render();return;}
   if(q?.kind==='categories'){
    const range=q.range||{from:C.day().slice(0,7)+'-01',to:C.day()},rows=L.categoryTotals(A.financialRows(),{section:A.prefs.section,currency:q.currency,accountId:q.accountId,...range},C);
    response=[t('savedSource'),t('scope')+': '+scopeLabel(),(range.from||root.tr('allTime'))+' → '+(range.to||C.day()),t('topHint'),...rows.flatMap(group=>[group.currency,...group.categories.map(row=>(row.category?A.category(row.category):t('uncategorized'))+': '+(A.prefs.hideNumbers?'••••':A.money(row.minor,group.currency)))]),...(!rows.length?[t('noRows')]:[])].join('\n');session.state.draft='';A._smartContext=null;A.render();return;
   }
   const parsed=forced||root.MasarifiAssistantV7.parse(text,{context:A._smartContext,accounts:A.accounts,categories:A.categories});
   // Unknown commands get a small useful guide; settings/notes keep their existing guarded routes.
   if(['help','capabilities'].includes(parsed.kind)){response=t('guide');A.render();return;}
   const proof=origin;await previousAsk.call(this,text,forced);
   if(!current(proof)){reset(true);return;}
  };
  A.assistantPage=page;V.assistantPage=page;session.ask=A.ask;if(root.V7.assistant)root.V7.assistant.ask=A.ask;
  const render=A.render;A.render=function(){if(screenIdentity&&screenIdentity!==identity()||origin&&!current(origin)){reset(true);screenIdentity=identity();}return render.apply(this,arguments);};
  doc.addEventListener('click',event=>{
   const b=event.target.closest?.('[data-local-example],[data-local-action]');if(!b||!allowed())return;event.preventDefault();event.stopImmediatePropagation();if(session.state.busy||session.state.active)return;
   if(b.dataset.localAction==='discard'){reset();A.render();return;}
   if(b.dataset.localExample){reset();session.voice.cleanup();session.state.draft=example(b.dataset.localExample);A.render();const input=doc.querySelector('#v6AssistantText');input?.focus?.();}
  });
  doc.addEventListener('input',event=>{const input=event.target;if(input?.dataset?.localField&&pending){pending.fields[input.dataset.localField]=input.value;}if(input?.id==='v6AssistantText'&&pending){gate.cancel();pending=null;doc.querySelector('.local-assistant-draft')?.remove?.();}});
  doc.addEventListener('change',event=>{const input=event.target;if(input?.id==='v6AssistantLanguage'){reset();response=t('languageChanged');origin=context();screenIdentity=identity();A.render();return;}if(!input?.dataset?.localField||!pending)return;const name=input.dataset.localField;pending.fields[name]=input.value;
   const form=input.closest('form');
   if(name==='currency'){const a=A.accounts.find(a=>a.id===pending.fields.accountId);if(a?.currency!==input.value)pending.fields.accountId='';const select=form?.elements.namedItem('accountId');if(select){select.innerHTML='<option value="">'+E(t('choose'))+'</option>'+L.activeAccounts(options()).filter(a=>!input.value||a.currency===input.value).map(a=>'<option value="'+E(a.id)+'">'+E(A.accountName(a)+' · '+a.currency)+'</option>').join('');select.value=pending.fields.accountId;}}
   else if(name==='accountId'){const a=A.accounts.find(a=>a.id===input.value);if(a){pending.fields.currency=a.currency;const select=form?.elements.namedItem('currency');if(select)select.value=a.currency;}}
   const error=form?.querySelector?.('[data-local-error]');if(error)error.textContent='';
  });
  doc.addEventListener('submit',event=>{if(event.target.id!=='localAssistantDraft')return;event.preventDefault();event.stopImmediatePropagation();const form=event.target;if(!allowed()||!pending)return;const fields={...pending.fields};for(const key of ['type','amount','currency','accountId','date','description'])fields[key]=form.elements.namedItem(key)?.value||'';
   try{if(review(fields)){root.MasarifiInteraction?.markSaved?.(form);form.closest('.local-assistant-draft')?.remove?.();}}catch(error){const message=form.querySelector('[data-local-error]');if(message)message.textContent=t('fieldError')+t(error.message);form.elements.namedItem(error.message)?.focus?.();}
  },true);
  root.addEventListener('v6:locked',()=>reset(true));root.addEventListener('pagehide',()=>reset(true));root.addEventListener('masarifi:section-locked',()=>reset(true));
  doc.addEventListener('masarifi:navigation',()=>{if(A.page!=='assistant')reset(true);});
  const api={review,reset,example};root.MasarifiLocalAssistant=api;return api;
 }
 function unique(values){return [...new Set(values)];}
 return {install,words};
});
