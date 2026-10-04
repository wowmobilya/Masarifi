/* Stable section identities. Each section uses a separate local ledger database;
 * the original database is retained in place as Previous data. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SectionWorkspaces=api.install(root);})(typeof window==='undefined'?globalThis:window,function(){'use strict';
const KEY='masarifi.sections.v1',ACTIVE='masarifi.section.active.v1',OLD='WOW_EXPENSES_OFFLINE_V2';
const defaults=()=>[{id:'personal',name:'',kind:'personal'},{id:'work',name:'',kind:'work'}];
const validId=id=>typeof id==='string'&&(/^(personal|work|legacy)$/.test(id)||/^s-[a-f0-9-]{36}$/.test(id));
function validate(catalog){if(!Array.isArray(catalog)||catalog.length<2||catalog.length>12)throw Error('section_limit');const seen=new Set();for(const s of catalog){if(!s||!validId(s.id)||s.id==='legacy'||seen.has(s.id)||typeof s.name!=='string'||s.name.length>80||/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(s.name)||!['personal','work','custom'].includes(s.kind))throw Error('invalidBackup');seen.add(s.id);}if(!seen.has('personal')||!seen.has('work'))throw Error('invalidBackup');return catalog;}
function databaseName(id){if(!validId(id))throw Error('invalidBackup');return id==='legacy'?OLD:OLD+'_SECTION_'+id;}
function add(catalog,name,id){validate(catalog);if(catalog.length>=12)throw Error('section_limit');name=String(name||'').trim().normalize('NFC');if(!name||Array.from(name).length>40)throw Error('v85SectionNameInvalid');const next=[...catalog,{id,name,kind:'custom'}];return validate(next);}
function install(root){let catalog=defaults(),failure=null;try{const saved=root.localStorage.getItem(KEY);if(saved)catalog=validate(JSON.parse(saved));}catch(e){failure=e;}let selected='personal';try{selected=root.sessionStorage.getItem(ACTIVE)||'personal';}catch{}if(failure||selected!=='legacy'&&!catalog.some(s=>s.id===selected))selected='legacy';
const api={KEY,ACTIVE,oldDatabase:OLD,validId,validate,databaseName,defaults,add,scope:()=>selected,database:()=>databaseName(selected),legacy:()=>selected==='legacy',catalog:()=>catalog.map(s=>({...s})),error:failure,
 save(next){validate(next);root.localStorage.setItem(KEY,JSON.stringify(next));catalog=next;},
 async create(name){const run=()=>{const latest=root.localStorage.getItem(KEY);const next=add(latest?JSON.parse(latest):catalog,name,'s-'+root.crypto.randomUUID());api.save(next);return next[next.length-1];};return root.navigator.locks?root.navigator.locks.request(KEY,run):run();},
 select(id){if(id!=='legacy'&&!catalog.some(s=>s.id===id))throw Error('invalidBackup');root.sessionStorage.setItem(ACTIVE,id);root.location.reload();},
 importCatalog(incoming){const merged=new Map(catalog.map(s=>[s.id,s]));for(const s of validate(incoming))if(!merged.has(s.id))merged.set(s.id,s);api.save([...merged.values()]);},
 internal:()=>selected==='work'?'work':'personal'};return api;}
return{defaults,validate,databaseName,add,install};});
