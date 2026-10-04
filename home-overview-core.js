/* Read-only home totals: confirmed section cashflow, exact saved-rate valuation. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory({});else root.HomeOverviewCore=factory(root);})(typeof globalThis==='undefined'?this:globalThis,function factory(deps){'use strict';
const BLOCKED=new Set(['pending','draft','rejected','queued','cancelled','deleted']);
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){const x=a%b;a=b;b=x;}return a||1n;};
const rational=(n,d=1n)=>{if(d<=0n)throw Error('invalidRate');const g=gcd(n,d);return{n:n/g,d:d/g};};
const plus=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const round=q=>{const negative=q.n<0n,n=negative?-q.n:q.n;const result=(2n*n+q.d)/(2n*q.d);return negative?-result:result;};
function context(){const C=deps.Core,B=deps.Bank,I=deps.InstallmentCore;if(!C||!B)throw Error('overviewUnavailable');return{C,B,I};}
function fixed(amount,currency){const{C}=context(),d=C.digits(currency),n=BigInt(amount),s=(n<0n?-n:n).toString().padStart(d+1,'0');return(n<0n?'-':'')+(d?s.slice(0,-d)+'.'+s.slice(-d):s);}
function money(amount,currency,language='en'){const{C}=context(),d=C.digits(currency),n=BigInt(amount),abs=n<0n?-n:n,scale=10n**BigInt(d),lang=language==='ar'?'ar-u-nu-arab':['tr','en','fr'].includes(language)?language:'en';const whole=new Intl.NumberFormat(lang,{maximumFractionDigits:0}).format(abs/scale);let tail='';if(d){const separator=new Intl.NumberFormat(lang).formatToParts(1.1).find(p=>p.type==='decimal')?.value||'.';tail=separator+new Intl.NumberFormat(lang,{useGrouping:false,minimumIntegerDigits:d,maximumFractionDigits:0}).format(abs%scale);}const unit=deps.Bank.metals[currency]?.unit;return(n<0n?'−':'')+whole+tail+' '+(unit?unit+' · ':'')+currency;}
function confirmed(r){return!!r&&!r.deleted&&!r.pending&&!r._pending&&r.confirmed!==false&&!BLOCKED.has(r.status);}
function principal(r){return['transfer_in','transfer_out','transfer_marker','transferIn','transferOut'].includes(r._kind||r.entryKind||'');}
function rowKey(r){const fee=r.entryKind==='fee'||r._kind==='fee'||r.synthetic&&r.transferId;const id=String(r.id||'');return fee&&r.transferId?'fee:'+r.transferId:id?'transaction:'+id:'';}
function booksFor(books,preferred){const all=Object.values(books||{}).filter(Boolean);return all.sort((a,b)=>{const rank=x=>preferred==='tcmb'?(x.upstream==='tcmb'?0:x.provider==='tcmb'?1:2):(x.provider==='ecb'&&x.upstream!=='tcmb'?0:x.provider==='ecb'?1:2);return rank(a)-rank(b)||String(b.date||'').localeCompare(String(a.date||''));});}
function summarize(input={},options={}){
 const{C,B,I}=context(),section=options.section,today=options.today||C.day();if(options.authorized!==true||!['personal','work'].includes(section))return{restricted:true,rowCount:0,cards:null,available:[],basis:[],separateAssets:[]};
 if(!C.validDate(today)||today.length!==10)throw Error('invalidDate');
 const accounts=(input.accounts||[]).filter(a=>a&&(!a.section||a.section===section)&&(!options.accountId||options.accountId==='all'||a.id===options.accountId)&&C.currencies.includes(a.currency));
 const currencies=[...new Set(accounts.filter(a=>!B.metals[a.currency]).map(a=>a.currency))];
 const target=currencies.includes(options.target)?options.target:currencies[0]||null;
 if(!target)return{restricted:false,empty:true,section,today,target:null,rowCount:0,cards:null,available:[],basis:[],separateAssets:accounts.filter(a=>B.metals[a.currency]).map(a=>a.currency)};
 const accountIds=new Set(accounts.filter(a=>a.currency===target&&(!options.accountId||options.accountId==='all'||a.id===options.accountId)).map(a=>a.id));
 const end=options.to&&options.to<today?options.to:today,from=options.from||'';
 if(from&&!C.validDate(from)||!C.validDate(end)||from&&from>end)throw Error('invalidDate');
 const scoped=r=>r.currency===target&&accountIds.has(r.accountId);
 const planScoped=p=>p.currency===target&&(accountIds.has(p.accountId)||(p.accountId==null&&(!options.accountId||options.accountId==='all')));
 const paymentRows=[],paymentSeen=new Set();
 for(const r of input.rows||[]){if(r?.section!==section||r.currency!==target||!r.installmentPlanId||!confirmed(r)||principal(r)||!['income','expense'].includes(r.type)||!C.validDate(r.date)||r.date.slice(0,10)>end||!Number.isSafeInteger(r.minor)||r.minor<=0)continue;const key=rowKey(r);if(!key||paymentSeen.has(key))continue;paymentSeen.add(key);paymentRows.push(r);}
 const groups=new Map(),seen=new Set(),rows=[],issues=new Set(),basis=new Map(),quotations=new Map(),available=new Set(currencies),separateAssets=new Set();
 const group=c=>{let g=groups.get(c);if(!g){g={income:0n,expense:0n,debt:0n};groups.set(c,g);}return g;};
 for(const r of input.rows||[]){if(r?.section!==section||!scoped(r)||!confirmed(r)||principal(r)||!['income','expense'].includes(r?.type))continue;if(!C.validDate(r.date)){issues.add('invalidDate');continue;}if(r.date.slice(0,10)>end)continue;const key=rowKey(r);if(!key||seen.has(key))continue;seen.add(key);if(typeof r.currency!=='string'||!C.currencies.includes(r.currency)||!Number.isSafeInteger(r.minor)||r.minor<0){issues.add('invalidAmount');continue;}if(!r.minor)continue;if(from&&r.date.slice(0,10)<from)continue;const g=group(r.currency);g[r.type]+=BigInt(r.minor);rows.push(r);available.add(r.currency);if(B.metals[r.currency])separateAssets.add(r.currency);}
 const privateAllowed=options.privateAllowed===true;let debtInvalid=false;
 if(privateAllowed){if(!I&&((input.plans||[]).length))debtInvalid=true;for(const p of input.plans||[]){if(p?.section!==section||!planScoped(p)||p.status!=='active'||p.direction!=='payable')continue;try{I.validatePlan(p);if(!C.currencies.includes(p.currency)||B.metals[p.currency])throw Error('invalidCurrency');const payments=paymentRows.filter(r=>r.installmentPlanId===p.id&&r.currency===p.currency&&r.type==='expense'&&p.schedule.some(d=>d.id===r.installmentDueId));const s=I.summary(p,payments,end);group(p.currency).debt+=BigInt(s.remaining);available.add(p.currency);}catch{debtInvalid=true;}}}
 for(const a of accounts){if(!C.currencies.includes(a.currency))continue;available.add(a.currency);if(B.metals[a.currency])separateAssets.add(a.currency);}
 const candidateBooks=booksFor(input.rateBooks,options.rateProvider);
 function quote(from){if(from===target)return{n:1n,d:1n};if(quotations.has(from))return quotations.get(from);let found=null;if(!B.metals[from])for(const book of candidateBooks){if(!book.rates||!C.validDate(book.date)||book.date.length!==10||book.date>today)continue;try{const reference=B.referenceQuote(book,from,target,'tcmb-mid'),q=B.rat(reference.n,reference.d);found=q;const key=[book.provider,book.upstream||'',book.source||'',book.date].join('|');basis.set(key,{provider:book.provider,source:book.source||book.provider.toUpperCase(),upstream:book.upstream||'',date:book.date,origin:book.origin||'',fetchedAt:book.fetchedAt||'',stale:(Date.parse(today+'T12:00:00Z')-Date.parse(book.date+'T12:00:00Z'))>7*86400000});break;}catch{/* Another validated saved source may support this pair. */}}quotations.set(from,found);return found;}
 function valuation(key){const native=[],missing=[];let sum=rational(0n);for(const[c,g]of groups){const amount=key==='net'?g.income-g.expense:g[key];if(!amount)continue;native.push({currency:c,minor:amount,metal:!!B.metals[c]});const q=quote(c);if(!q){missing.push(c);continue;}sum=plus(sum,rational(amount*q.n*10n**BigInt(C.digits(target)),q.d*10n**BigInt(C.digits(c))));}const invalid=issues.size>0||key==='debt'&&debtInvalid,restricted=key==='debt'&&!privateAllowed;return{minor:missing.length||invalid||restricted?null:round(sum),native,missing,invalid,restricted,status:restricted?'restricted':invalid?'invalid':missing.length?'missing':'complete'};}
 const cards={income:valuation('income'),expense:valuation('expense'),debt:valuation('debt'),net:valuation('net')};
 // Net uses the displayed income and expense values, so visible subtraction agrees at rounding boundaries.
 cards.net.minor=cards.income.minor===null||cards.expense.minor===null?null:cards.income.minor-cards.expense.minor;cards.net.missing=[...new Set([...cards.income.missing,...cards.expense.missing])];cards.net.invalid=cards.income.invalid||cards.expense.invalid;cards.net.status=cards.net.invalid?'invalid':cards.net.missing.length?'missing':'complete';
 return{restricted:false,section,today,from,to:end,target,rowCount:rows.length,cards,available:[...available].filter(c=>!B.metals[c]),basis:[...basis.values()],separateAssets:[...separateAssets],issues:[...issues],privateAllowed};
}
return{create:next=>factory(next),summarize,fixed,money,confirmed};
});
