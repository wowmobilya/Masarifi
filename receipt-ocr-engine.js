/* Optional browser-local receipt OCR. No image or recognized text is uploaded. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ReceiptOCREngine=api;})(globalThis,function(){'use strict';
const languages={ar:'ara',tr:'tur',en:'eng',fr:'fra'};
const sources={script:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js',integrity:'sha384-r1ru3tcf6FhnCFR4B7pIFG+BhFF9LlFtz/P1y4pblWn3AGs9y3lBx5SKLNf4+rED',worker:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',core:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0'};
function dimensions(width,height){if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width*height>32000000)throw Error('receipt_image_large');const scale=Math.min(1,2200/Math.max(width,height),Math.sqrt(4000000/(width*height)));return{width:Math.round(width*scale),height:Math.round(height*scale)};}
function sameContext(a,b){return !!a&&!!b&&['section','db','box','uid','auth','mode','lock','workspace'].every(k=>a[k]===b[k]);}
const validateId=id=>{if(typeof id!=='string'||!/^scan-[a-f0-9]{64}$/.test(id))throw Error('receipt_invalid');return id;};
async function fingerprint(text,crypto){const normalized=String(text).normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim();if(!normalized||normalized.length>16384)throw Error('receipt_invalid');const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized));return 'scan-'+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');}
function options(language){const code=languages[language]||'eng';return{workerPath:sources.worker,corePath:sources.core,langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/'+code+'@1.0.0/4.0.0_best_int',cachePath:'masarifi-receipt-ocr-v1',cacheMethod:'write',gzip:true};}
let loaded=null;
function load(root){if(root.Tesseract?.createWorker)return Promise.resolve(root.Tesseract);if(loaded)return loaded;loaded=new Promise((resolve,reject)=>{const script=root.document.createElement('script');script.src=sources.script;script.integrity=sources.integrity;script.crossOrigin='anonymous';script.referrerPolicy='no-referrer';script.onload=()=>root.Tesseract?.createWorker?resolve(root.Tesseract):reject(Error('receipt_ocr_unavailable'));script.onerror=()=>{script.remove();loaded=null;reject(Error('receipt_ocr_unavailable'));};root.document.head.append(script);});return loaded;}
function createReader(deps={}){let generation=0,active=null;
 const terminate=job=>{if(job.worker&&!job.terminated){job.terminated=true;Promise.resolve(job.worker.terminate()).catch(()=>{});}};
 function cancel(){generation++;if(active){terminate(active);active.reject?.(Error('receipt_cancelled'));active=null;}}
 async function read(image,language,{isCurrent=()=>true,onProgress=()=>{}}={}){cancel();const id=generation,job={worker:null,terminated:false,reject:null};active=job;const valid=()=>generation===id&&active===job&&isCurrent();let timer;const cancelled=new Promise((_,reject)=>{job.reject=reject;timer=setTimeout(()=>{if(active===job){generation++;terminate(job);active=null;reject(Error('receipt_ocr_timeout'));}},120000);});
 const operation=(async()=>{const api=await deps.load();if(!valid())throw Error('receipt_cancelled');job.worker=await api.createWorker(languages[language]||'eng',1,{...(deps.options||options)(language),logger:m=>{if(valid())onProgress(Math.max(0,Math.min(100,Math.round((m.progress||0)*100))));}});if(!valid()){terminate(job);throw Error('receipt_cancelled');}const result=await job.worker.recognize(image,{rotateAuto:true},{text:true});if(!valid())throw Error('receipt_cancelled');return{text:String(result.data?.text||'').slice(0,16384),confidence:Number(result.data?.confidence)||0};})();
 try{return await Promise.race([operation,cancelled]);}finally{clearTimeout(timer);terminate(job);if(active===job)active=null;}
 }
 return {read,cancel};
}
return{languages,sources,dimensions,sameContext,validateId,fingerprint,options,load,createReader};
});
