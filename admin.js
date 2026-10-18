// Admin panel v2. Loaded by app.js in edit mode; uses app.js globals (data, set, get, touch, mutate, render, norm, toast, esc, fxk, fxs, shrink, applyDesign, SW).
(()=>{
let sel=0,tab='block',rt,el='';const open=new Set(['Spacing','Colours','Typography','Element','Integrations','Content','Layout']);
const GF={Sans:'Inter,Poppins,Montserrat,DM Sans,Manrope,Space Grotesk,Outfit,Plus Jakarta Sans,Sora,Nunito,Rubik,Work Sans,Lexend,Urbanist,Figtree,Roboto,Open Sans,Lato',Serif:'Playfair Display,Instrument Serif,DM Serif Display,Lora,Merriweather,Cormorant Garamond,Fraunces,Libre Baskerville,Newsreader',Display:'Bebas Neue,Anton,Oswald,Archivo Black,Syne,Unbounded,Righteous,Bungee',Mono:'JetBrains Mono,Fira Code,IBM Plex Mono,Space Mono,DM Mono',Handwriting:'Caveat,Pacifico,Dancing Script,Permanent Marker,Kalam'};
for(const k in GF)GF[k]=GF[k].split(',');
const BI=['system','serif','mono','rounded'],E=esc;
const p=document.createElement('aside');p.id='adm';p.hidden=true;document.body.append(p);
const fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.hidden=true;document.body.append(fi);let fpath='';
const TABS=[['block','▦','Block'],['elem','✎','Element'],['design','◐','Design'],['site','⚙','Site'],['code','</>','Code'],['json','{ }','JSON']];
const lab=k=>String(k).replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
const val=k=>{const[t,...r]=k.split(':'),y=r.join(':');return t==='p'?get(data,y):t==='s'?data.blocks[sel]?.style?.[y]:data.fx[fxk(el)]?.[y]};
// Controls. data-k = "p:path" (content/settings), "s:key" (block style), "e:key" (element style).
const R=(l,c)=>`<div class="fr"><span>${l}</span>${c}</div>`,W=(l,c)=>`<div class="fr w"><span>${l}</span>${c}</div>`,G=(t,c)=>`<details data-g="${t}"${open.has(t)?' open':''}><summary>${t}</summary>${c}</details>`,
op=(o,v)=>`<option${v===o?' selected':''}>${E(o)}</option>`,
txt=(k,ph='')=>`<input type="text" data-k="${k}" value="${E(val(k)??'')}" placeholder="${ph}">`,
area=(k,r=4)=>`<textarea data-k="${k}" rows="${r}" spellcheck="false">${E(val(k)??'')}</textarea>`,
rng=(k,min,max,st,u='')=>{const v=parseFloat(val(k)),x=isNaN(v)?min:v;return`<div class="rg"><input type="range" data-k="${k}" data-u="${u}" data-t="n" min="${min}" max="${max}" step="${st}" value="${x}"><output>${isNaN(v)?'auto':x+u}</output></div>`},
col=k=>{const v=val(k)||'';return`<div class="cl"><input type="color" data-k="${k}" value="${/^#[0-9a-f]{6}$/i.test(v)?v:'#888888'}"><input type="text" data-k="${k}" value="${E(v)}" placeholder="default"></div>`},
seg=(k,o,c)=>`<div class="seg">${o.map(x=>`<button data-k="${k}" data-v="${x}"${c?' data-clr="1"':''} class="${String(val(k))===x?'on':''}">${x}</button>`).join('')}</div>`,
tog=k=>`<label class="tg"><input type="checkbox" data-k="${k}" data-t="b"${val(k)?' checked':''}><i></i></label>`,
font=k=>{const v=val(k)||'',all=[...BI,...Object.values(GF).flat()];return`<select data-k="${k}"><option value="">Default</option><optgroup label="Built in">${BI.map(o=>op(o,v)).join('')}</optgroup>${Object.entries(GF).map(([g,a])=>`<optgroup label="${g}">${a.map(o=>op(o,v)).join('')}</optgroup>`).join('')}${v&&!all.includes(v)?`<option selected>${E(v)}</option>`:''}</select><div class="fp" style="font-family:${v&&!BI.includes(v)?`'${E(v)}',`:''}sans-serif">The quick brown fox</div>`};
// Every content field of a block, generated from its data.
const fld=(path,v,k)=>Array.isArray(v)?`<fieldset><legend>${lab(k)} (${v.length})</legend>${v.map((x,j)=>fld(path+'.'+j,x,'Item '+(j+1))).join('')}</fieldset>`
 :v&&typeof v==='object'?`<fieldset><legend>${lab(k)}</legend>${Object.entries(v).map(([a,b])=>fld(path+'.'+a,b,a)).join('')}</fieldset>`
 :typeof v==='boolean'?R(lab(k),tog('p:'+path))
 :/image$/i.test(k)?R(lab(k),`<div class="cl">${txt('p:'+path,'URL or upload')}<button data-adm="img" data-path="${path}">Upload</button></div>`)
 :typeof v==='string'&&(v.length>40||v.includes('\n'))?W(lab(k),area('p:'+path)):R(lab(k),txt('p:'+path));
const T={
 block:b=>`<select class="bsel" data-sel>${data.blocks.map((x,i)=>`<option value="${i}"${i===sel?' selected':''}>${i+1}. ${E(x.type)}: ${E(x.nav||x.title||x.id)}</option>`).join('')}</select>`
  +G('Spacing',R('Top',rng('s:pt',0,300,4))+R('Bottom',rng('s:pb',0,300,4)))
  +G('Colours',R('Background',col('s:bg'))+R('Text',col('s:color')))
  +G('Typography',R('Font',font('s:font'))+R('Align',seg('s:align',['left','center','right'],1)))
  +G('Animation',R('Effect',seg('s:an',['fade','up','zoom','left','none'],1))+R('Duration (s)',rng('s:ad',.2,3,.1))+R('Delay (s)',rng('s:adl',0,2,.1)))
  +G('Advanced',R('CSS class',txt('s:cls'))+W('Custom CSS, & = this block',area('s:css',5)))
  +G('Content',Object.entries(b).filter(([k])=>!['style','id','type','hidden'].includes(k)).map(([k,v])=>fld(`blocks.${sel}.${k}`,v,k)).join(''))
  +'<p><button data-adm="goto">Scroll to block</button> <button data-adm="clrs">Reset block style</button></p>',
 elem:()=>!el?'<p class="hint">Click any text on the page, then style just that element here.</p>':`<p class="hint">Editing <b>${E(el)}</b></p>`
  +G('Typography',R('Font',font('e:font'))+R('Size',rng('e:size',.6,9,.05,'rem'))+R('Weight',seg('e:weight',['300','400','500','600','700','800','900'],1))+R('Align',seg('e:align',['left','center','right'],1))+R('Case',seg('e:tt',['none','uppercase','lowercase','capitalize'],1))+R('Letter space',rng('e:ls',-.1,.4,.01,'em')))
  +G('Colours',R('Text',col('e:color')))+G('Spacing',R('Margin top',rng('e:mt',-40,200,2))+R('Margin bottom',rng('e:mb',-40,200,2)))+G('Element',R('Opacity',rng('e:op',0,1,.05)))
  +'<p><button data-adm="fxclear">Reset this element</button></p>',
 design:()=>G('Colours',R('Accent',`<div class="sws">${SW.map(c=>`<button data-k="p:accent" data-v="${c}" style="background:${c}"></button>`).join('')}</div>`)+R('Custom',col('p:accent'))+R('Theme',seg('p:theme',['auto','light','dark'])))
  +G('Typography',R('Body font',font('p:design.font'))+R('Heading font',font('p:custom.hfont'))+R('Heading size',rng('p:design.hsize',50,160,5,'%'))+R('Body size',rng('p:design.bsize',80,130,5,'%'))+R('Headlines',seg('p:design.head',['tight','normal'])))
  +G('Layout',R('Page width',seg('p:design.width',['narrow','normal','wide']))+R('Section gap',rng('p:design.sg',30,200,5,'%'))+R('Corners',rng('p:design.radius',0,48,1,'px'))+R('Cards',seg('p:design.card',['glass','solid','outline']))+R('Navigation',seg('p:design.nav',['pill','bar'])))
  +G('Effects',R('Glow',rng('p:design.glow',0,100,5,'%'))+R('Animations',tog('p:design.anim'))+R('Spotlight',tog('p:design.spot'))+R('Anim. time ×',rng('p:design.spd',.3,3,.1))+R('Ticker loop (s)',rng('p:design.mqs',10,120,5))),
 site:()=>G('Site',R('Brand',txt('p:site.brand'))+R('Footer',txt('p:site.footer'))+R('Button label',txt('p:site.cta.label'))+R('Button link',txt('p:site.cta.url')))
  +G('Integrations',R('Discord webhook',txt('p:integ.webhook','https://discord.com/api/webhooks/…'))+R('Form endpoint',txt('p:integ.formUrl','Formspree, Web3Forms…'))+R('Plausible domain',txt('p:integ.plausible','example.com'))+'<p class="hint">These values are public in content.json. Use a throwaway webhook.</p>'),
 code:()=>G('Custom CSS',area('p:custom.css',12))+G('Head HTML or scripts',area('p:custom.head',8)+'<p class="hint">Runs for visitors only, never in edit mode.</p>'),
 json:()=>`<textarea class="big" id="adj" spellcheck="false">${E(JSON.stringify(data,null,2))}</textarea><p><button data-adm="apply">Apply JSON</button> <button data-adm="copy">Copy</button></p>`};
function draw(){const y=p.querySelector('.pb')?.scrollTop||0;if(!data.blocks[sel])sel=0;
 p.innerHTML=`<div class="hd2"><b>Admin</b><button data-adm="close" aria-label="Close">✕</button></div><div class="tabs">${TABS.map(([k,i,l])=>`<button data-tab="${k}"${k===tab?' class="on"':''}>${i} ${l}</button>`).join('')}</div><div class="pb">${T[tab](data.blocks[sel])}</div>`;p.querySelector('.pb').scrollTop=y}
const put=(k,v)=>{const[t,...r]=k.split(':'),y=r.join(':');
 if(t==='p')set(y,v);else if(t==='s'){const b=data.blocks[sel];(b.style||(b.style={}))[y]=v}
 else{const f=fxk(el);(data.fx[f]||(data.fx[f]={}))[y]=v;const n=document.querySelector(`[data-p="${el}"]`);if(n)n.style.cssText=fxs(el);applyDesign();touch();return}
 touch();clearTimeout(rt);rt=setTimeout(render,250)};
const openP=i=>{if(i<0&&!p.hidden)return close();if(i>=0){sel=i;tab='block'}p.hidden=false;document.body.classList.add('adm');draw()},close=()=>{p.hidden=true;document.body.classList.remove('adm')};
p.addEventListener('input',e=>{const t=e.target,k=t.dataset.k;if(!k)return;const u=t.dataset.u||'',n=+t.value,v=t.dataset.t==='b'?t.checked:t.dataset.t==='n'?(k[0]==='e'&&u?n+u:n):t.value;
 const o=t.parentNode.querySelector('output');if(o)o.textContent=t.value+u;
 if(t.type==='color'||t.type==='text')t.parentNode.querySelectorAll('input').forEach(i=>{if(i!==t&&(i.type==='text'||/^#[0-9a-f]{6}$/i.test(t.value)))i.value=t.value});put(k,v)});
p.addEventListener('change',e=>{if(e.target.dataset.sel!==undefined){sel=+e.target.value;draw();document.querySelectorAll('.blk')[sel]?.scrollIntoView({behavior:'smooth'})}});
p.addEventListener('toggle',e=>{const d=e.target;if(d.dataset?.g)d.open?open.add(d.dataset.g):open.delete(d.dataset.g)},true);
p.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const a=t.dataset.adm,v=t.dataset.v;
 if(t.dataset.tab){tab=t.dataset.tab;draw()}else if(v!==undefined){put(t.dataset.k,t.classList.contains('on')&&t.dataset.clr?'':v);draw()}
 else if(a==='close')close();else if(a==='goto')document.querySelectorAll('.blk')[sel]?.scrollIntoView({behavior:'smooth'});
 else if(a==='clrs'){mutate(()=>{delete data.blocks[sel].style});draw()}
 else if(a==='fxclear'){delete data.fx[fxk(el)];const n=document.querySelector(`[data-p="${el}"]`);if(n)n.style.cssText='';touch();draw()}
 else if(a==='img'){fpath=t.dataset.path;fi.click()}
 else if(a==='copy'){navigator.clipboard?.writeText(p.querySelector('#adj').value);toast('Copied')}
 else if(a==='apply'){try{const j=JSON.parse(p.querySelector('#adj').value);mutate(()=>{data=norm(j)});toast('Applied')}catch(x){toast('Invalid JSON: '+x.message)}}});
fi.onchange=()=>{const f=fi.files[0];fi.value='';if(f)shrink(f).then(v=>{mutate(()=>set(fpath,v));draw()}).catch(()=>toast('Could not read that image'))};
document.addEventListener('focusin',e=>{const n=e.target.closest?.('[data-p]');if(!n||p.hidden)return;el=n.dataset.p;const i=[...document.querySelectorAll('.blk')].indexOf(n.closest('.blk'));if(i>=0)sel=i;if(tab==='elem'||tab==='block')draw()});
addEventListener('hashchange',()=>{if(!edit)close()});
window.ADM={open:openP,close,sync:()=>{if(!p.hidden&&!p.contains(document.activeElement))draw()}};
})();
