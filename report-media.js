/* Compact saved receipt images inside PDF tables. Loaded after report wrappers. */
(function(root){'use strict';
if(typeof Reports==='undefined'||typeof ItemShare==='undefined'||typeof Photos==='undefined')return;
const oldPages=Reports.pages,oldSnapshot=Reports.snapshot,oldShare=ItemShare.model;
const key=r=>r.path?'shared:'+r.boxId+':'+r.path:'local:'+r.id;
const refsFor=row=>{
 const refs=Photos.ids(row).map(id=>({id,reference:row.transactionNumber||row.reference||row.id,date:row.date}));
 const shared=row?.shared_images||row?.payload?.shared_images||[],boxId=row?._onlineBox||row?.boxId||row?.box_id;
 if(shared.length&&!boxId)throw Error('attachment_permission_denied');
 for(const photo of shared)refs.push({path:photo.path,boxId,reference:row.transactionNumber||row.reference||row.id,date:row.date,name:photo.name,description:row.description||row.text||''});
 return refs;
};
const addRefs=(model,refs)=>{model.photoRefs=model.photoRefs||[];for(const ref of refs)if(!model.photoRefs.some(r=>key(r)===key(ref)))model.photoRefs.push(ref);};
const withRow=(block,row,cell)=>{const refs=refsFor(row);return refs.length?{...block,reportMedia:{refs,cell}}:block;};
const account=BankReports.account;
BankReports.account=function(a,ledger,...args){const model=account.call(this,a,ledger,...args);let index=0;model.customBlocks=model.customBlocks.map(block=>{if(!block.cells||block.cells.length!==5)return block;const row=ledger.rows[index++];if(!row)return block;const enriched=withRow(block,row,2);if(enriched.reportMedia)addRefs(model,enriched.reportMedia.refs);return enriched;});model.compactReportMedia=true;return model;};
const bank=BankReports.bank;
BankReports.bank=function(...args){const model=bank.apply(this,args);for(const a of App.accounts)for(const row of App.accountStats(a,args[1]).rows)addRefs(model,refsFor(row));model.compactReportMedia=true;return model;};
Reports.snapshot=function(...args){const model=oldSnapshot.apply(this,args);if(model.kind==='transactions'){model.compactReportMedia=true;for(const row of model.rows)addRefs(model,refsFor(row));}return model;};
ItemShare.model=function(...args){const model=oldShare.apply(this,args),kind=this.data?.kind;if(kind==='transaction'){const row=this.data.source,refs=refsFor(row);addRefs(model,refs);model.compactReportMedia=true;if(refs.length)model.customBlocks=[...model.customBlocks,{cells:[tr('attachments',model.lang),refs.map((r,i)=>String(i+1)+'. '+(r.name||r.reference||'')).join('\n')],widths:[165,529],header:[tr('fieldLabel',model.lang),tr('valueLabel',model.lang)],reportMedia:{refs,cell:1}}];}if(kind==='account')for(const block of model.customBlocks||[])if(block.reportMedia)addRefs(model,block.reportMedia.refs);return model;};
const proof=()=>({uid:root.Online?.user?.id,auth:root.Online?.authEpoch,mode:root.Online?.modeEpoch,lock:typeof V5!=='undefined'?V5.lockGeneration:0});
const current=p=>!App.locked&&p.lock===(typeof V5!=='undefined'?V5.lockGeneration:0)&&p.uid===root.Online?.user?.id&&p.auth===root.Online?.authEpoch&&p.mode===root.Online?.modeEpoch;
const permission=ref=>{if(!ref.path)return;const online=root.Online,snapshot=online?.snapshots?.get(ref.boxId);if(!snapshot||snapshot.unavailable||snapshot.accessRevoked||!online.familyCan?.('view_history',null,snapshot))throw Error('attachment_permission_denied');};
async function resolve(ref,p){
 if(!current(p))throw Error('identity_changed');
 let image,url;
 try{
  if(ref.path){if(!root.Online?.familyImageForExport)throw Error('attachment_unavailable');const blob=await root.Online.familyImageForExport(ref.path,ref.boxId,p);if(!current(p))throw Error('identity_changed');url=URL.createObjectURL(blob);image=await Photos.decode(url);}
  else{const photo=await DB.get('attachments',ref.id);if(!photo)throw Error('photoMissing');Photos.validate(photo);image=await Photos.decode(photo.data);}
  if(!current(p))throw Error('identity_changed');
  if(!Number.isFinite(image.naturalWidth||image.width)||!Number.isFinite(image.naturalHeight||image.height)||(image.naturalWidth||image.width)<1||(image.naturalHeight||image.height)<1)throw Error('photoInvalid');
  permission(ref);return image;
 }finally{if(url)URL.revokeObjectURL(url);}
}
Reports.pages=async function*(model){
 if(!model.compactReportMedia||model.includePhotos===false){yield* oldPages.call(this,model);return;}
 const p=proof(),used=new Set(),ensure=()=>{if(!current(p))throw Error('identity_changed');for(const ref of model.photoRefs||[])permission(ref);};let blocks=this.blocks(model).map(b=>({...b}));
 if(model.kind==='transactions'){
  let index=0;blocks=blocks.map(b=>{if(!b.cells||b.cells.length!==6)return b;const row=model.rows[index++];return row&&!row.synthetic?withRow(b,row,3):b;});
 }
 // Bank summaries have no transaction table: retain their financial summary and add compact reference rows.
 if(model.sheets?.some(s=>s.name==='Cashboxes'))for(const ref of model.photoRefs||[])blocks.push({cells:[ref.reference||'',String(ref.date||'').replace('T',' '),ref.description||'',tr('attachments',model.lang)],widths:[150,115,319,110],header:['reference','date','description','attachments'].map(k=>tr(k,model.lang)),reportMedia:{refs:[ref],cell:3}});
 if(!blocks.some(b=>b.reportMedia)){yield* oldPages.call(this,model);return;}
 const w=794,h=1123,left=50,right=744,bottom=1060,rtl=model.lang==='ar',t=k=>tr(k,model.lang);let canvas,ctx,y,page=0,activeHeader='',rowIndex=0;
 const create=()=>{canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h*2;ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.fillStyle='#123b47';ctx.fillRect(0,0,w,65);ctx.font='bold 18px Arial';ctx.textAlign='left';ctx.direction='ltr';ctx.fillStyle='#fff';ctx.fillText('Masarifi',left,39);ctx.font='12px Tahoma,Arial';ctx.textAlign=rtl?'right':'left';ctx.direction=rtl?'rtl':'ltr';ctx.fillText(t('app'),rtl?right:130,38);page++;y=92;activeHeader='';};
 const footer=()=>{ctx.save();ctx.strokeStyle='#dce5eb';ctx.beginPath();ctx.moveTo(left,1080);ctx.lineTo(right,1080);ctx.stroke();ctx.font='10px Tahoma,Arial';ctx.fillStyle='#617687';ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=rtl?'right':'left';ctx.fillText('Masarifi • '+t(model.review?'review':'original'),rtl?right:left,1100);ctx.direction='ltr';ctx.textAlign=rtl?'left':'right';ctx.fillText(String(page),rtl?left:right,1100);if(model.review){ctx.translate(w/2,h/2);ctx.rotate(-Math.PI/5);ctx.globalAlpha=.07;ctx.font='bold 28px Tahoma,Arial';ctx.textAlign='center';ctx.fillStyle='#aa3147';ctx.fillText(t('watermark'),0,0);}ctx.restore();};
 const cells=(values,widths,height,header=false)=>{const ws=rtl?[...widths].reverse():widths,cs=rtl?[...values].reverse():values,start=y;let x=left;for(let i=0;i<cs.length;i++){ctx.fillStyle=header?'#e4f0ef':rowIndex%2?'#f6f8fa':'#fff';ctx.fillRect(x,y,ws[i],height);ctx.strokeStyle='#dce5eb';ctx.strokeRect(x,y,ws[i],height);ctx.fillStyle=header?'#153f47':'#1d3040';ctx.font=(header?'bold ':'')+'10.5px Tahoma,Arial';ctx.textAlign=rtl?'right':'left';ctx.direction=rtl?'rtl':'ltr';const lines=Array.isArray(cs[i])?cs[i]:this.wrap(ctx,cs[i],ws[i]-14);lines.forEach((s,j)=>ctx.fillText(s,rtl?x+ws[i]-7:x+7,y+17+j*15));x+=ws[i];}y+=height;return start;};
 const media=(block,images,start)=>{const cell=block.reportMedia.cell,width=block.widths[cell],x=rtl?left+block.widths.slice(cell+1).reduce((a,b)=>a+b,0):left+block.widths.slice(0,cell).reduce((a,b)=>a+b,0),columns=Math.max(1,Math.floor((width-14)/100));images.forEach((im,i)=>{const col=i%columns,iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,factor=Math.min(1,92/iw,68/ih),bw=iw*factor,bh=ih*factor,slot=rtl?columns-1-col:col;ctx.drawImage(im,x+7+slot*100+(92-bw)/2,start+6+Math.floor(i/columns)*80+(68-bh)/2,bw,bh);used.add(key(block.reportMedia.refs[i]));});};
 create();
 for(const block of blocks){
  if(!current(p))throw Error('identity_changed');
  if(block.text!==undefined){ctx.font=(block.title?'bold 23px':block.subtitle?'bold 15px':'11px')+' Tahoma,Arial';const lines=this.wrap(ctx,block.text,right-left),lineH=block.title?35:block.subtitle?26:18;if(block.subtitle)y+=12;for(const line of lines){if(y+lineH>bottom){ensure();footer();yield canvas;await new Promise(r=>setTimeout(r,0));create();}ctx.font=(block.title?'bold 23px':block.subtitle?'bold 15px':'11px')+' Tahoma,Arial';ctx.fillStyle=block.alert?'#b53e4c':block.muted?'#617687':'#173542';ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=rtl?'right':'left';ctx.fillText(line,rtl?right:left,y+lineH-8);y+=lineH;}y+=6;activeHeader='';continue;}
  let loaded=[];if(block.reportMedia)for(const ref of block.reportMedia.refs)loaded.push(await resolve(ref,p));
  ctx.font='10.5px Tahoma,Arial';const lines=block.cells.map((c,i)=>this.wrap(ctx,c,block.widths[i]-14)),maxLines=Math.max(...lines.map(a=>a.length)),headerKey=block.header.join('|');let offset=0;
  const columns=block.reportMedia?Math.max(1,Math.floor((block.widths[block.reportMedia.cell]-14)/100)):1,mediaHeight=Math.ceil(loaded.length/columns)*80;
  while(offset<maxLines){const needsHeader=activeHeader!==headerKey;if(y+(needsHeader?48:0)+32>bottom){ensure();footer();yield canvas;await new Promise(r=>setTimeout(r,0));create();}if(activeHeader!==headerKey){cells(block.header,block.widths,48,true);activeHeader=headerKey;}
   const capacity=Math.max(1,Math.floor((bottom-y-14)/15)),count=Math.min(capacity,maxLines-offset),textHeight=count*15+14,fitMedia=offset+count===maxLines&&y+textHeight+mediaHeight<=bottom;
   const start=cells(lines.map(a=>a.slice(offset,offset+count)),block.widths,textHeight+(fitMedia?mediaHeight:0));offset+=count;if(fitMedia&&loaded.length){media(block,loaded,start+textHeight);loaded=[];}if(offset<maxLines){ensure();footer();yield canvas;await new Promise(r=>setTimeout(r,0));create();}
  }
  // Continue an unusually long row with the same table header, one bounded thumbnail strip at a time.
  for(let index=0;index<loaded.length;index+=columns){if(y+80>bottom){ensure();footer();yield canvas;await new Promise(r=>setTimeout(r,0));create();cells(block.header,block.widths,48,true);activeHeader=headerKey;}const group=loaded.slice(index,index+columns),part={...block,reportMedia:{...block.reportMedia,refs:block.reportMedia.refs.slice(index,index+columns)}},start=cells(block.cells.map(()=>[]),block.widths,80);media(part,group,start);}
  rowIndex++;
 }
 ensure();footer();yield canvas;
 // Only suppress references that were actually drawn. Other transfer/note paths keep their established appendix.
 const remaining=(model.photoRefs||[]).filter(ref=>!used.has(key(ref)));if(remaining.length)yield* V6.photoAppendixPages({...model,photoRefs:remaining},page);
};
})(window);
