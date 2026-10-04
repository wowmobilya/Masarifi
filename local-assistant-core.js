/* Guided local entry parsing. Pure functions: no storage, microphone, network, or ledger writes. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MasarifiLocalAssistantCore=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const latin=s=>String(s??'').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));
 const escape=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const words=(s,pattern)=>new RegExp('(?:^|[^\\p{L}\\p{N}])(?:'+pattern+')(?=$|[^\\p{L}\\p{N}])','u').test(s);
 const boxWords='cashbox|account|kasa|hesap|caisse|compte|صندوق|حساب|خزنه';
 const moneyPattern=/[+-]?[ \u00a0\u202f]*(?:\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,٫]\d+)?|\d+(?:[.,٫٬]\d+)*|[.,٫]\d+)/gu;
 const unique=list=>[...new Set(list)];
 function activeAccounts(options){return (options.accounts||[]).filter(a=>!a.deleted&&!a.archived&&(!a.section||a.section===options.section));}
 function isEntry(n){
  if(/^(?:كم|قديش|كيف|هل|ماذا|ما |how\b|what\b|where\b|which\b|combien\b|quel\b|ne kadar\b|kac\b)/u.test(n)||/[?؟]/u.test(n))return false;
  return /^(?:سجل|اضف|دفعت|صرفت|قبضت|مصروف|دخل|ايراد|add\b|record\b|log\b|spent\b|paid\b|received\b|expense\b|income\b|harcama\b|gider\b|gelir\b|ekle\b|kaydet\b|harcadim\b|odedim\b|enregistr|ajout|depense\b|revenu\b|j'ai paye|j'ai depense)/u.test(n)&&!words(n,'summary|month|months|bilan|ay|mois|شهري|الشهر') || /^(?:سجل|اضف|add\b|record\b|log\b|enregistr|ajout|ekle\b|kaydet\b)/u.test(n)&&!/^(?:add|record|log|ajouter|ajoute|enregistrer|اضف|سجل)\s+(?:note|ملاحظه|not\b)/u.test(n);
 }
 function currencyList(n,options){
  const found=(options.Core.currencies||[]).filter(c=>words(n,escape(c.toLowerCase())));
  for(const [code,pattern]of [['TRY','try|tl|lira|lire|ليره'],['USD','usd|dollars?|dolar|دولار'],['EUR','eur|euros?|يورو'],['GBP','gbp|pounds?|استرليني']])if(words(n,pattern))found.push(code);
  for(const [symbol,code]of [['₺','TRY'],['$','USD'],['€','EUR'],['£','GBP']])if(n.includes(symbol))found.push(code);
  return unique(found);
 }
 function prepare(text,options){
  const raw=String(text||'').trim().slice(0,4000),n=options.normalize(raw),accounts=activeAccounts(options);
  if(!isEntry(n))return {kind:'delegate'};
  const errors=[],fields={type:'',amount:'',currency:'',accountId:'',description:latin(raw),date:options.today,section:options.section};
  const income=words(n,'دخل|ايراد|راتب|قبضت|income|salary|received|gelir|maas|revenu|salaire|recu');
  const expense=words(n,'مصروف|مصروفات|دفعت|صرفت|expense|spent|paid|harcama|gider|harcadim|odedim|depense|paye');
  if(income&&expense)errors.push('type');else if(income||expense)fields.type=income?'income':'expense';
  const explicitCurrencies=currencyList(n,options);if(explicitCurrencies.length===1)fields.currency=explicitCurrencies[0];else if(explicitCurrencies.length>1)errors.push('currency');
  const prefix='(?:^|[^\\p{L}\\p{N}])(?:'+boxWords+')\\s*#?\\s*';
  const named=accounts.flatMap(a=>a.name?[...n.matchAll(new RegExp(prefix+escape(options.normalize(a.name))+'(?=$|[^\\p{L}\\p{N}])','gu'))].map(()=>a):[]);
  const references=[...n.matchAll(new RegExp('(?:^|[^\\p{L}\\p{N}])(?:'+boxWords+')(?=\\s|$)','gu'))].length;
  const slotMatches=[...n.matchAll(new RegExp('(?:'+boxWords+')\\s*#?\\s*(\\d+)','gu'))].map(m=>accounts.filter(a=>String(a.slot)===String(Number(m[1]))));
  const matched=unique([...named,...slotMatches.flat()].map(a=>a.id));
  if(matched.length>1||slotMatches.some(list=>list.length!==1)||references>named.length+slotMatches.length)errors.push('accountId');
  else if(matched.length===1)fields.accountId=matched[0];
  // Any unrecognized explicit cashbox reference needs a choice, never a default box.
  if(new RegExp('(?:'+boxWords+')(?:\\s|$)','u').test(n)&&!fields.accountId&&!errors.includes('accountId'))errors.push('accountId');
  const account=accounts.find(a=>a.id===fields.accountId);
  if(account){if(fields.currency&&fields.currency!==account.currency)errors.push('currency');else if(!explicitCurrencies.length)fields.currency=account.currency;}
  const personal=words(n,'personal|personnel|kisisel|شخصي'),work=words(n,'work|business|professionnel|عمل|شغل');
  if(personal&&work||personal&&options.section!=='personal'||work&&options.section!=='work')errors.push('section');
  let numeric=latin(raw).replace(/[−–]/g,'-').replace(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}:\d{2}\b/gu,' ')
   .replace(new RegExp('(?:'+boxWords+')\\s*#?\\s*\\d+','giu'),' ').replace(/\b(?:XAU(?:24|22|21|18)|XAG(?:999|925))\b/giu,' ');
  for(const a of accounts)if(a.name)numeric=numeric.replace(new RegExp(escape(latin(a.name)),'giu'),' ');
  const amounts=[...numeric.matchAll(moneyPattern)].map(m=>m[0].trim());
  if(/[%٪]/.test(numeric))errors.push('amount');
  if(amounts.length===1)fields.amount=amounts[0];else errors.push('amount');
  // Reuse established date grammar without allowing it to select amount/type/currency/box.
  // A placeholder keeps locale-specific spaces and separators out of the old amount parser.
  let datesText=latin(raw);if(amounts.length===1)datesText=datesText.replace(amounts[0],'1');
  const parsed=options.parse('add '+(fields.type||'expense')+' '+datesText,{accounts,categories:[],context:null});
  if(parsed.kind==='clarify'&&['date','singleDate'].includes(parsed.reason))errors.push('date');
  if(parsed.kind==='add'&&parsed.date)fields.date=parsed.date;
  let minor;
  if(fields.amount&&fields.currency){try{minor=options.Core.minor(fields.amount,fields.currency,options.language);if(minor<=0)throw Error('amount');fields.amount=options.Core.fixedMinor(minor,options.Core.digits(fields.currency));}catch{errors.push('amount');}}
  else if(fields.amount&&(/^-/.test(fields.amount)||Number(fields.amount)===0))errors.push('amount');
  // Unknown or conflicting fields stay visibly empty so editing can resolve them.
  for(const field of unique(errors))if(field in fields&&field!=='section')fields[field]='';
  return {kind:'draft',fields,minor,errors:unique(errors),missing:['type','amount','currency','accountId'].filter(k=>!fields[k])};
 }
 function validate(fields,options){
  if(fields.section!==options.section)throw Error('section');
  if(!['expense','income'].includes(fields.type))throw Error('type');
  if(!options.Core.currencies.includes(fields.currency))throw Error('currency');
  const account=activeAccounts(options).find(a=>a.id===fields.accountId);if(!account)throw Error('accountId');if(account.currency!==fields.currency)throw Error('currency');
  let minor;try{minor=options.Core.minor(fields.amount,fields.currency,options.language);if(minor<=0)throw Error();}catch{throw Error('amount');}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fields.date||'')||!options.Core.validDate(fields.date))throw Error('date');
  const description=latin(String(fields.description||'').trim());if(!description)throw Error('description');
  return {kind:'add',type:fields.type,amount:options.Core.fixedMinor(minor,options.Core.digits(fields.currency)),currency:fields.currency,accountId:fields.accountId,section:options.section,description,date:fields.date};
 }
 function reviewGate(){let sequence=0,pending=null;return {begin(context){pending={sequence:++sequence,context};return pending;},cancel(){pending=null;sequence++;},take(ticket,context){const ok=!!ticket&&ticket===pending&&ticket.context===context;pending=null;return ok;}};}
 function query(text,options){
  const n=options.normalize(String(text||'').trim()).replace(/[?؟.!]+$/,'');
  for(const [page,pattern]of [['records','open records|show records|افتح السجلات|اعرض السجلات|kayitlari ac|ouvrir les operations|ouvrir les ecritures'],['accounts','open accounts|افتح الحسابات|hesaplari ac|ouvrir les comptes'],['reports','open reports|افتح التقارير|raporlari ac|ouvrir les rapports']])if(new RegExp('^(?:'+pattern+')$','u').test(n))return {kind:'navigate',page};
  if(/(?:top|highest|most).*categor|categor.*(?:most|highest)|(?:اكثر|اعلي).*تصنيف|(?:اكثر|اعلي).*فيه|en (?:cok|yuksek).*kategori|kategori.*en cok|categor.*plus|plus.*categor/u.test(n)){
   const currencies=currencyList(n,options);if(currencies.length>1)return {kind:'clarify',reason:'currency'};
   const parsed=options.parse('summary '+text,{accounts:options.accounts||[],categories:[],context:null});
   if(parsed.kind==='clarify')return parsed;
   if(parsed.section&&parsed.section!==options.section)return {kind:'clarify',reason:'section'};
   return {kind:'categories',currency:currencies[0]||'',accountId:parsed.accountId||'',range:parsed.range||null};
  }
  return null;
 }
 function categoryTotals(rows,filter,C){
  const totals=new Map();
  for(const row of rows||[]){const day=String(row.date||'').slice(0,10);if(row.type!=='expense'||row.section!==filter.section||filter.from&&day<filter.from||filter.to&&day>filter.to||filter.currency&&row.currency!==filter.currency||filter.accountId&&filter.accountId!=='all'&&row.accountId!==filter.accountId)continue;
   if(!C.currencies.includes(row.currency)||!Number.isSafeInteger(row.minor)||row.minor<0)continue;
   let categories=totals.get(row.currency);if(!categories){categories=new Map();totals.set(row.currency,categories);}const id=row.category||'',item=categories.get(id)||{category:id,minor:0,count:0};item.minor=C.safeAdd(item.minor,row.minor);item.count++;categories.set(id,item);
  }
  return [...totals].sort(([a],[b])=>a.localeCompare(b)).map(([currency,byCategory])=>({currency,categories:[...byCategory.values()].sort((a,b)=>b.minor-a.minor||a.category.localeCompare(b.category)).slice(0,3)}));
 }
 return {prepare,validate,reviewGate,latin,activeAccounts,query,categoryTotals};
});
