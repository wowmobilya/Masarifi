/* Authorized image reads for an export; financial documents never receive a public image URL. */
(function(root){'use strict';
const O=root.Online,App=root.App;if(!O||!App)return;
const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const imagePath=new RegExp('^'+uuid+'/'+uuid+'/(?:'+uuid+'|receipt-[0-9]{10,11}-[A-Z0-9]{3}20[0-9]{11})/'+uuid+'\\.(?:jpg|jpeg|webp)$','i');
O.familyImageForExport=async function(path,boxId,proof){
 if(typeof path!=='string'||!imagePath.test(path)||path.split('/')[1]!==boxId)throw Error('invalid_attachment');
 const same=()=>!!proof?.uid&&proof.uid===this.user?.id&&proof.auth===this.authEpoch&&proof.mode===this.modeEpoch&&proof.lock===(root.V5?.lockGeneration||0)&&!App.locked&&!this.networkPaused;
 const access=()=>{if(!same())throw Error('identity_changed');const snapshot=this.snapshots.get(boxId);if(!snapshot||snapshot.accessRevoked||!this.familyCan('view_history',null,snapshot))throw Error('attachment_permission_denied');if(snapshot.unavailable)throw Error('attachment_unavailable');return snapshot;};
 access();if(root.navigator?.onLine===false)throw Error('online_required');
 const session=await this.requestSession();if(!same()||session.uid!==proof.uid)throw Error('identity_changed');await this.checkSession(session);access();
 const cfg=root.MASARIFI_SUPABASE_AUTO;if(!cfg?.url||!cfg.key)throw Error('attachment_unavailable');
 const blob=await this.withNetworkDeadline(async signal=>{
  const response=await fetch(cfg.url+'/storage/v1/object/authenticated/masarifi-family-images/'+path,{signal,headers:{apikey:cfg.key,Authorization:'Bearer '+session.token},credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error(response.status===401||response.status===403?'attachment_permission_denied':'attachment_unavailable');
  const advertised=Number(response.headers?.get('content-length'));if(advertised>2*1024*1024)throw Error('invalid_attachment');
  const file=await response.blob();if(!file.size||file.size>2*1024*1024||!['image/jpeg','image/webp'].includes(file.type))throw Error('invalid_attachment');return file;
 });
 await this.checkSession(session);access();return blob;
};
})(typeof window==='undefined'?globalThis:window);
