/* Route-aware chrome; existing controllers retain ownership of saves and navigation. */
(function(root){
'use strict';
const A=root.App,V=root.V6,doc=root.document;
if(!A||!V)return;
V.addLabels(`v87Restore|استعادة الافتراضي|Varsayılanları geri yükle|Restore defaults|Rétablir les valeurs par défaut`);

let currentHeader=null,currentFooter=null,currentNav=null,measurementQueued=false;
const resizeObserver=root.ResizeObserver?new root.ResizeObserver(scheduleMeasurements):null;
function setHeight(name,height){
 const value=Number.isFinite(height)?Math.max(0,Math.ceil(height))+'px':'0px';
 if(doc.documentElement.style.getPropertyValue(name)!==value)doc.documentElement.style.setProperty(name,value);
}
function measureChrome(){
 measurementQueued=false;
 if(A.locked)return;
 const headerHeight=currentHeader?.getBoundingClientRect().height;
 if(headerHeight>0)setHeight('--chrome-header-height',headerHeight);
 setHeight('--context-footer-height',currentFooter?.getBoundingClientRect().height||0);
 setHeight('--chrome-nav-height',currentNav?.getBoundingClientRect().height||0);
}
function scheduleMeasurements(){
 if(measurementQueued)return;
 measurementQueued=true;
 (root.requestAnimationFrame||((callback)=>root.setTimeout(callback,0)))(measureChrome);
}
function observeChrome(header,footer,nav){
 for(const node of [currentHeader,currentFooter,currentNav])if(node&&node!==header&&node!==footer&&node!==nav)resizeObserver?.unobserve(node);
 for(const node of [header,footer,nav])if(node&&node!==currentHeader&&node!==currentFooter&&node!==currentNav)resizeObserver?.observe(node);
 currentHeader=header;currentFooter=footer;currentNav=nav;scheduleMeasurements();
}
function stampRoute(){doc.body.dataset.management=['categories','budgets'].includes(A.page)?'true':'false';}
function organizeSettings(content){
 const hub=content?.querySelector('.v17-settings');if(!hub)return;
 const tools=hub.querySelector('[data-act="budget"]')?.closest('.v17-settings-group')||hub.querySelector('.v17-settings-grid');
 if(tools)for(const entry of content.querySelectorAll(':scope > .intelligence-entry, :scope > .v86-category-settings-entry')){entry.classList.add('v87-settings-tool');tools.append(entry);}
 const logout=hub.querySelector('.logout-button'),copyright=hub.querySelector('.settings-copyright');
 if(logout)hub.append(logout);if(copyright)hub.append(copyright);
}
function decorate(){
 if(A.locked)return;
 stampRoute();const settings=A.page==='settings',management=doc.body.dataset.management==='true';doc.body.dataset.settings=settings?'true':'false';
 const content=doc.getElementById('content'),heading=content?.querySelector(':scope > .page-heading');
 const title=A.page==='home'?(A.prefs.language==='ar'?'مصاريفي':'Masarifi'):heading?.querySelector('h1')?.textContent||root.V7?.title?.()||root.tr(A.page);
 const brand=doc.querySelector('#header .brand strong');
 if(brand){brand.textContent=title;brand.title=title;brand.setAttribute('aria-label',title);}
 doc.title=A.page==='home'?title:title+' · '+root.tr('app');
 // Preserve semantic headings, and never hide a heading containing real controls.
 if(heading){
  const hasControls=heading.querySelector('button,a,input,select,textarea,[role=button]');
  if(hasControls)heading.classList.remove('route-heading-redundant');
  else heading.classList.add('route-heading-redundant');
 }
 const sub=doc.querySelector('#header .brand small');
 if(sub)sub.textContent=settings?root.tr('settings'):root.SectionPreferences?.label?.(A.prefs.section)||root.tr(A.prefs.section);
 const form=doc.getElementById('v6Prefs');
 if(settings&&V.settingsSection==='appearance'&&form&&!form.querySelector('[data-v87-reset]')){
  const b=doc.createElement('button');b.type='button';b.dataset.v87Reset='appearance';b.textContent=root.tr('v87Restore');
  form.querySelector('.settings-save')?.prepend(b);
 }
 if(settings&&!V.settingsSection)organizeSettings(content);
 const footer=settings?content?.querySelector('.settings-save'):management?content?.querySelector('.v86-category-editor-footer,.v86-budget-save-actions'):null;
 doc.body.dataset.settingsActions=settings&&footer?'true':'false';
 if(footer)footer.setAttribute('aria-label',root.tr('save'));
 observeChrome(doc.getElementById('header'),footer,doc.getElementById('mobileNav'));
 // Home ordering is owned by home-presentation; never move Quick Add behind overview.
 if(settings&&V.settingsSection==='home-layout')content?.querySelector('#v7HomePrefs > div > h2')?.classList.add('route-heading-redundant');
}
doc.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-v87-reset]');if(!b||A.locked)return;
 const form=b.closest('form');if(!form)return;
 for(const [name,value]of Object.entries({languageMode:'system',theme:'system',fontSize:'16'})){
  const input=form.elements[name];if(input){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
 }
 if(form.elements.compact)form.elements.compact.checked=false;
 root.MasarifiInteraction?.touch?.(form);
});
const render=A.render;
A.render=function(){stampRoute();const result=render.apply(this,arguments);decorate();return result;};
root.addEventListener('resize',scheduleMeasurements);
root.addEventListener('pageshow',decorate);
doc.addEventListener('masarifi:navigation',decorate);
doc.addEventListener('masarifi:viewport',scheduleMeasurements);
doc.fonts?.ready?.then(scheduleMeasurements);
root.MasarifiWorkspacePolish={decorate};
})(window);
