/* Explicit category choices for interactive financial writes. Historical imports and sync remain unmarked. */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root.App)api.install(root,{TEXT:typeof TEXT==='undefined'?root.TEXT:TEXT});
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const marker=Symbol('masarifi-explicit-category');
 const words={
  ar:{v86CategoryAlreadySaved:'حُفظت الحركة الأصلية وتم تأكيدها. تغييراتك الجديدة باقية هنا؛ راجع الحركة المحفوظة قبل الحفظ مجددًا.',v86CategoryAlreadyPending:'حُفظت الحركة الأصلية بانتظار المزامنة. تغييراتك الجديدة باقية هنا؛ راجع الحركة المعلّقة قبل الحفظ مجددًا.',v86ChooseCategory:'اختر التصنيف…',v86CategoryRequired:'لم تُحفظ الحركة بعد. اختر تصنيفًا لتبقى حساباتك وتحليلاتك دقيقة.',v86CategoryChanged:'تغيّر التصنيف أثناء الحفظ. راجعه ثم احفظ الحركة مرة أخرى.',v86UseSuggestion:'استخدام التصنيف المقترح',v86CategorySaved:'حُفظت الحركة بتصنيفها بنجاح.'},
  tr:{v86CategoryAlreadySaved:'Özgün işlem kaydedildi ve onaylandı. Yeni değişiklikleriniz burada korunuyor; yeniden kaydetmeden önce kayıtlı işlemi kontrol edin.',v86CategoryAlreadyPending:'Özgün işlem eşitleme için bekliyor. Yeni değişiklikleriniz burada korunuyor; yeniden kaydetmeden önce bekleyen işlemi kontrol edin.',v86ChooseCategory:'Kategori seçin…',v86CategoryRequired:'İşlem henüz kaydedilmedi. Hesap ve analizlerinizin doğru kalması için bir kategori seçin.',v86CategoryChanged:'Kaydetme sırasında kategori değişti. Kontrol edip yeniden kaydedin.',v86UseSuggestion:'Önerilen kategoriyi kullan',v86CategorySaved:'İşlem kategorisiyle birlikte kaydedildi.'},
  en:{v86CategoryAlreadySaved:'The original entry has been saved and confirmed. Your new changes remain here; review the saved entry before saving again.',v86CategoryAlreadyPending:'The original entry is saved and awaiting synchronization. Your new changes remain here; review the pending entry before saving again.',v86ChooseCategory:'Choose a category…',v86CategoryRequired:'The entry has not been saved. Choose a category to keep your accounts and analysis accurate.',v86CategoryChanged:'The category changed while saving. Review it and save the entry again.',v86UseSuggestion:'Use suggested category',v86CategorySaved:'Entry saved with its category.'},
  fr:{v86CategoryAlreadySaved:'L’opération d’origine a été enregistrée et confirmée. Vos nouvelles modifications restent ici ; vérifiez l’opération enregistrée avant de réenregistrer.',v86CategoryAlreadyPending:'L’opération d’origine est enregistrée et attend la synchronisation. Vos nouvelles modifications restent ici ; vérifiez l’opération en attente avant de réenregistrer.',v86ChooseCategory:'Choisissez une catégorie…',v86CategoryRequired:'L’opération n’a pas été enregistrée. Choisissez une catégorie pour garder vos comptes et analyses précis.',v86CategoryChanged:'La catégorie a changé pendant l’enregistrement. Vérifiez-la puis réessayez.',v86UseSuggestion:'Utiliser la catégorie proposée',v86CategorySaved:'Opération enregistrée avec sa catégorie.'}
 };
 const eligible=(category,type,existingId='')=>!!category&&!category.deleted&&category.type===type&&(!category.archived||category.id===existingId);
 function install(root,refs={}){
  if(root.MasarifiCategoryGuard)return root.MasarifiCategoryGuard;
  const A=root.App,TEXT=refs.TEXT||root.TEXT||{},states=new WeakMap();
  for(const [lang,labels]of Object.entries(words))Object.assign(TEXT[lang]||(TEXT[lang]={}),labels);
  const field=(form,name)=>form?.elements?.namedItem?.(name)||form?.elements?.[name]||form?.querySelector?.('[name="'+name+'"]');
  const currentType=state=>typeof state.type==='function'?state.type():state.type||field(state.form,'type')?.value;
  const catalog=state=>typeof state.catalog==='function'?state.catalog():state.catalog||A.categories||[];
  const translate=key=>TEXT[A.prefs?.language]?.[key]||words.en[key]||key;
  const fingerprint=form=>root.MasarifiInteraction?.fingerprint?.(form)||JSON.stringify([...new Set(Array.from(form?.elements?.[Symbol.iterator]?form.elements:Object.values(form?.elements||{})).filter(n=>n&&typeof n==='object'))].filter(n=>!['submit','button','reset'].includes(n.type)).map(n=>[n.name||n.id||'',String(n.value??''),n.checked??null]));
  const errorField=form=>form?.querySelector?.('.dialog-form-scroll > .form-error')||form?.querySelector?.('.form-error');
  function clearError(form){const select=field(form,'category');select?.removeAttribute?.('aria-invalid');const error=errorField(form);if(error?.dataset?.categoryError){error.textContent='';delete error.dataset.categoryError;delete error.dataset.feedbackState;error.classList?.remove('error-pulse');}}
  function fail(form,key='v86CategoryRequired'){
   const select=field(form,'category'),error=errorField(form),pending=['v86CategoryAlreadyPending','v86CategoryAlreadySaved'].includes(key);
   if(!pending){select?.setAttribute?.('aria-invalid','true');select?.classList?.remove('v86-category-attention');void select?.offsetWidth;select?.classList?.add('v86-category-attention');}
   if(error){error.textContent=translate(key);error.setAttribute?.('role',pending?'status':'alert');if(error.dataset){error.dataset.categoryError='1';error.dataset.feedbackState=pending?'pending':'error';}error.classList?.remove('error-pulse');void error.offsetWidth;error.classList?.add('error-pulse');}
   if(!pending)select?.focus?.({preventScroll:true});if(!pending)select?.scrollIntoView?.({block:'nearest',behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth'});throw Error(key);
  }
  function bind(form,options={}){
   if(!form)return null;const prior=states.get(form);if(prior)return prior;
   const state={...options,form,choice:null,version:0},select=field(form,'category');states.set(form,state);
   const type=currentType(state),initial=select?.value;
   if(initial&&eligible(catalog(state).find(c=>c.id===initial),type,options.existingId)&&
      (initial===options.existingId||options.explicit===true))state.choice={id:initial,type};
   select?.addEventListener?.('change',()=>{state.version++;const id=select.value,t=currentType(state);state.choice=eligible(catalog(state).find(c=>c.id===id),t,state.existingId)?{id,type:t}:null;clearError(form);});
   if(form.dataset)form.dataset.categoryRequired='1';return state;
  }
  function choose(form,id){const state=states.get(form);if(!state)return false;const type=currentType(state),cat=catalog(state).find(c=>c.id===id);if(!eligible(cat,type,state.existingId))return false;const select=field(form,'category');if(!select)return false;select.value=id;if(select.value!==id){state.version++;state.choice=null;return false;}state.version++;state.choice={id,type};if(form.dataset)form.dataset.categoryTouched='1';clearError(form);return true;}
  function reset(form){const state=states.get(form);if(!state)return;state.version++;state.choice=null;const select=field(form,'category');if(select)select.value='';if(form.dataset)form.dataset.categoryTouched='';clearError(form);}
  function refresh(form,selected){const state=states.get(form),select=field(form,'category');if(!state||!select)return false;const type=currentType(state),esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
   const retained=state.choice?.type===type&&state.choice.id===select.value?select.value:'',chosen=selected===undefined?retained:selected,list=catalog(state).filter(c=>eligible(c,type,state.existingId)).map((c,index)=>({c,index})).sort((a,b)=>(Number(a.c.order)||0)-(Number(b.c.order)||0)||a.index-b.index).map(x=>x.c),valid=list.some(c=>c.id===chosen);
   select.innerHTML='<option value=""'+(!valid?' selected':'')+'>'+esc(translate('v86ChooseCategory'))+'</option>'+list.map(c=>'<option value="'+esc(c.id)+'"'+(valid&&c.id===chosen?' selected':'')+'>'+esc(c.labels?.[A.prefs?.language]||c.labels?.en||c.labels?.ar||c.name||A.category?.(c.id)||c.id)+'</option>').join('');
   if(selected!==undefined&&valid)return choose(form,selected);if(!valid)reset(form);return true;
  }
  function captureNotice(state){if(!state?.pending)return 'v86CategoryRequired';const latest=(root.Online?.pending||[]).find(item=>item.id===state.pending.id&&item.userId===root.Online.user?.id);if(latest?.status==='rejected'){state.pending=null;return 'v86CategoryRequired';}if(latest?.status==='approved')state.pending.status='approved';return state.pending.status==='approved'?'v86CategoryAlreadySaved':'v86CategoryAlreadyPending';}
  function assertForm(form,data){
   const state=states.get(form);if(!state)return null;if(state.pending){const notice=captureNotice(state);if(state.pending)return fail(form,notice);}
   const id=String(data?.get?.('category')??field(form,'category')?.value??''),type=currentType(state);
   if(!id||!state.choice||state.choice.id!==id||state.choice.type!==type||field(form,'category')?.value!==id||!eligible(catalog(state).find(c=>c.id===id),type,state.existingId))return fail(form);
   if(data?.get?.('type')&&data.get('type')!==type)return fail(form,'v86CategoryChanged');
   const proof={category:id,type,form,state,version:state.version,existingId:state.existingId||'',catalog:()=>catalog(state),storedCategory:state.storedCategory!==false,fingerprint:fingerprint(form)};validateProof(proof);return proof;
  }
  function capture({category,type,catalog:source,existingId='',current,storedCategory=true}){
   const proof={category,type,existingId,catalog:()=>typeof source==='function'?source():source||A.categories||[],current,storedCategory};validateProof(proof);return proof;
  }
  function validateProof(proof){
   if(!proof)return;if(A.locked||proof.current&&proof.current()===false)throw Error('v86CategoryChanged');
   if(proof.form){const s=proof.state;if(!proof.form.isConnected||proof.form.closest?.('dialog')?.open===false||s.current&&s.current()===false||s.version!==proof.version||field(proof.form,'category')?.value!==proof.category||currentType(s)!==proof.type||s.choice?.id!==proof.category||s.choice?.type!==proof.type||fingerprint(proof.form)!==proof.fingerprint)throw Error('v86CategoryChanged');}
   if(!eligible(proof.catalog().find(c=>c.id===proof.category),proof.type,proof.existingId))throw Error('v86CategoryChanged');
  }
  function scopeOperations(proof,ops){if(!proof)return ops;validateProof(proof);return ops.map(op=>({...op,[marker]:proof}));}
  function validateOperations(ops){for(const op of ops||[]){const proof=op[marker];if(!proof)continue;validateProof(proof);if(op.delete)continue;const record=op.value;if(op.store==='transactions'&&(record?.category!==proof.category||record?.type!==proof.type)||op.store==='installments'&&(record?.category!==proof.category||(record?.direction==='payable'?'expense':'income')!==proof.type))throw Error('v86CategoryChanged');}}
  const hasMarkedOperation=op=>!!op?.[marker];
  const storedCategoryId=op=>op?.[marker]?.storedCategory&&!op.delete&&['transactions','installments'].includes(op.store)?op[marker].category:'';
  function validateStoredCategory(op,stored){const proof=op?.[marker];if(!storedCategoryId(op))return;validateProof(proof);if(!stored||stored.id!==proof.category||!eligible(stored,proof.type,proof.existingId))throw Error('v86CategoryChanged');}
  const S=root.SectionPreferences;let validateSectionScope=()=>{};if(S?.validateWriteScope){const previous=S.validateWriteScope;validateSectionScope=ops=>previous.call(S,ops);S.validateWriteScope=function(ops){validateOperations(ops);return previous.apply(this,arguments);};}
  function validateCommittedScope(ops){validateSectionScope(ops);if(A.locked)throw Error('v86CategoryChanged');for(const op of ops||[]){const proof=op?.[marker];if(!proof)continue;if(proof.current&&proof.current()===false||proof.form&&(!proof.form.isConnected||proof.form.closest?.('dialog')?.open===false||(proof.state.committedCurrent||proof.state.current)&&(proof.state.committedCurrent||proof.state.current)()===false))throw Error('v86CategoryChanged');}}
  function hasChangedDraft(ops){return (ops||[]).some(op=>{const proof=op?.[marker];return proof?.form&&fingerprint(proof.form)!==proof.fingerprint;});}
  function markCommitted(ops,item){validateCommittedScope(ops);for(const op of ops||[]){const proof=op?.[marker];if(proof?.form)proof.state.pending={id:item.id,recordId:item.recordId,status:item.status};}}
  const previousError=A.error;if(previousError)A.error=function(error,target){if(this.locked)return;if(words.en[error?.message]){const pending=['v86CategoryAlreadyPending','v86CategoryAlreadySaved'].includes(error.message);if(target){target.textContent=translate(error.message);if(target.dataset)target.dataset.feedbackState=pending?'pending':'error';target.setAttribute?.('role',pending?'status':'alert');target.classList?.remove('error-pulse');void target.offsetWidth;target.classList?.add('error-pulse');}else this.toast(translate(error.message),!pending);return;}return previousError.apply(this,arguments);};
  const O=root.Online;if(O?.errorText){const previous=O.errorText;O.errorText=function(error){return words.en[error?.message]?translate(error.message):previous.apply(this,arguments);};}
  root.document?.addEventListener?.('invalid',event=>{const form=event.target?.form||event.target?.closest?.('form');if(event.target?.name!=='category'||!states.has(form))return;event.preventDefault();if(A.locked||!form.isConnected)return;try{fail(form,captureNotice(states.get(form)));}catch{}},true);
  function suggestion(form,id){const host=form?.querySelector?.('#categorySuggestion');if(!host)return;host.querySelector?.('[data-v86-category-suggestion]')?.remove();if(!id)return;const state=states.get(form);if(!state||!eligible(catalog(state).find(c=>c.id===id),currentType(state)))return;const button=root.document?.createElement?.('button');if(!button)return;button.type='button';button.className='v86-category-suggestion';button.dataset.v86CategorySuggestion=id;button.textContent=translate('v86UseSuggestion')+': '+(A.category?.(id)||id);button.addEventListener?.('click',()=>choose(form,id));host.appendChild?.(button);}
  function saved(row){const pending=(root.Online?.pending||[]).find(p=>p.userId===root.Online.user?.id&&p.recordId===row.id&&p.status==='pending');A.toast(pending?root.Online.t('pending'):translate('v86CategorySaved'));}
  const api=root.MasarifiCategoryGuard={bind,choose,reset,refresh,assertForm,capture,scopeOperations,validateOperations,validateCommittedScope,hasChangedDraft,markCommitted,hasMarkedOperation,storedCategoryId,validateStoredCategory,eligible,suggestion,saved,translate};return api;
 }
 return {install,eligible,words};
});
