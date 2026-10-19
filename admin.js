// Admin panel v3. Loaded by app.js in edit mode; uses app.js globals
// (data, set, get, touch, mutate, render, norm, toast, esc, fam, fxk, fxs, shrink,
//  applyDesign, SW, T, OPT, ITEM, blk, uid, commit, shiftFx, dropFx).
// Control prefixes: "p:path" (content/settings), "b:key" (current block field),
// "s:key" (current block style extras), "e:key" (selected element style).
(()=>{ 
let sel=0,tab='block',rt,el='';const open=new Set(['Layout','Colours','Typography','Animation','Content','Element','Integrations','SEO']);
const p=document.createElement('aside');p.id='adm';p.hidden=true;document.body.append(p);
const fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.hidden=true;document.body.append(fi);let fpath='';
const TABS=[['block','▦','Block'],['elem','✎','Element'],['design','◐','Design'],['site','⚙','Site'],['code','</>','Code'],['json','{ }','JSON']];
const lab=k=>String(k).replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
const val=k=>{const[t,...r]=k.split(':'),y=r.join(':');return t==='p'?get(data,y):t==='b'||t==='s'?(t==='b'?data.blocks[sel]:data.blocks[sel]?.style)?.[y]:data.fx[fxk(el)]?.[y]};
// Google Fonts, grouped for the pickers.
const GF={Sans:'Inter,Poppins,Montserrat,DM Sans,Manrope,Space Grotesk,Outfit,Plus Jakarta Sans,Sora,Nunito,Rubik,Work Sans,Lexend,Urbanist,Figtree,Onest,Inter Tight,Schibsted Grotesk,Roboto,Open Sans,Lato',Serif:'Playfair Display,Instrument Serif,DM Serif Display,Lora,Merriweather,Cormorant Garamond,Fraunces,Libre Baskerville,Newsreader',Display:'Bebas Neue,Anton,Oswald,Archivo Black,Syne,Unbounded,Righteous,Bungee',Mono:'JetBrains Mono,Fira Code,IBM Plex Mono,Space Mono,DM Mono',Handwriting:'Caveat,Pacifico,Dancing Script,Permanent Marker,Kalam'};
for(const k in GF)GF[k]=GF[k].split(',');
const BI=['system','serif','mono','rounded'],E=esc;
const R=(l,c)=>`<div class="fr"><span>${l}</span>${c}</div>`,W=(l,c)=>`<div class="fr w"><span>${l}</span>${c}</div>`,G=(t,c)=>`<details data-g="${t}"${open.has(t)?' open':''}><summary>${t}</summary>${c}</details>`,
 op=(o,v)=>`<option${String(v)===String(o)?' selected':''}>${E(o)}</option>`,
 txt=(k,ph='')=>`<input type="text" data-k="${k}" value="${E(val(k)??'')}" placeholder="${ph}">`,
 area=(k,r=4)=>`<textarea data-k="${k}" rows="${r}" spellcheck="false">${E(val(k)??'')}</textarea>`,
 rng=(k,min,max,st,u='')=>{const v=parseFloat(val(k)),x=isNaN(v)?min:v;return`<div class="rg"><input type="range" data-k="${k}" data-u="${u}" data-t="n" min="${min}" max="${max}" step="${st}" value="${x}"><output>${isNaN(v)?'auto':x+u}</output></div>`},
 col=k=>{const v=val(k)||'';return`<div class="cl"><input type="color" data-k="${k}" value="${/^#[0-9a-f]{6}$/i.test(v)?v:'#888888'}"><input type="text" data-k="${k}" value="${E(v)}" placeholder="default"></div>`},
 seg=(k,o,c)=>`<div class="seg">${o.map(x=>`<button data-k="${k}" data-v="${x}"${c?' data-clr="1"':''} class="${String(val(k))===x?'on':''}">${x}</button>`).join('')}</div>`,
 tog=k=>`<label class="tg"><input type="checkbox" data-k="${k}" data-t="b"${val(k)?' checked':''}><i></i></label>`,
 slc=(k,o)=>`<select data-k="${k}">${o.map(x=>op(x,val(k))).join('')}</select>`,
 font=k=>{const v=val(k)||'',all=[...BI,...Object.values(GF).flat()];return`<select data-k="${k}"><option value="">Default</option><optgroup label="Built in">${BI.map(o=>op(o,v)).join('')}</optgroup>${Object.entries(GF).map(([g,a])=>`<optgroup label="${g}">${a.map(o=>op(o,v)).join('')}</optgroup>`).join('')}${v&&!all.includes(v)?`<option selected>${E(v)}</option>`:''}</select>${v&&!BI.includes(v)?`<div class="fp" style="font-family:'${E(v)}',sans-serif">The quick brown fox</div>`:''}`};
// Auto form for every content field of a block, including add / reorder / delete for lists.
const SKIP=new Set(['style','id','type','hidden','nav','align','size','pad','width','bgs','bgc','div','anim','delay','tc','sf','hide','cls','css']);
const icts=(path,j,n)=>`<span class="icts"><button data-ai="aup" data-p="${path}" data-j="${j}" title="Move up" ${j?'':'disabled'}>↑</button><button data-ai="adown" data-p="${path}" data-j="${j}" title="Move down" ${j<n-1?'':'disabled'}>↓</button><button data-ai="adup" data-p="${path}" data-j="${j}" title="Duplicate">⧉</button><button data-ai="adel" data-p="${path}" data-j="${j}" title="Delete" class="dgr">✕</button></span>`;
const fld=(path,v,k,arr)=>Array.isArray(v)?`<fieldset><legend>${lab(k)} (${v.length})</legend>${v.map((x,j)=>fld(path+'.'+j,x,'Item '+(j+1),path)+icts(path,j,v.length)).join('')}<button class="add" data-ai="aadd" data-p="${path}">+ Add</button></fieldset>`
 :v&&typeof v==='object'?`<fieldset><legend>${lab(k)}</legend>${Object.entries(v).map(([a,b])=>fld(path+'.'+a,b,a)).join('')}</fieldset>`
 :typeof v==='boolean'?R(lab(k),tog('p:'+path))
 :/image$/i.test(k)?R(lab(k),`<div class="cl">${txt('p:'+path,'URL or upload')}<button data-adm="img" data-path="${path}">Upload</button></div>`)
 :typeof v==='string'&&(v.length>40||v.includes('\n'))?W(lab(k),area('p:'+path))
 :R(lab(k),txt('p:'+path));
// Design presets: one click, fully undoable.
const PRESETS={Aurora:['#7c8cff',{glow:80,card:'glass',radius:24,head:'tight'}],Emerald:['#10b981',{glow:70,card:'glass',radius:20}],Sunset:['#f59e0b',{glow:90,card:'glass',radius:28}],Candy:['#ec4899',{glow:85,card:'glass',radius:32}],Ocean:['#22d3ee',{glow:100,card:'glass',radius:16,spot:true}],'Slate':['#94a3b8',{glow:30,card:'outline',radius:8,font:'system',hfont:'system'}],'Editorial':['#c4a6ff',{hfont:'Playfair Display',efont:'Playfair Display',head:'normal',card:'outline',radius:4}]};
const T2={
 block:b=>{if(!b)return'';
  const opts=Object.entries(OPT[b.type]||{}).map(([k,v])=>R(lab(k),slc('b:'+k,v))).join('');
  const skip=new Set([...SKIP,...Object.keys(OPT[b.type]||{})]);
  return`<div class="bselrow"><select class="bsel" data-sel>${data.blocks.map((x,i)=>`<option value="${i}"${i===sel?' selected':''}>${i+1}. ${E(T[x.type]?.n||x.type)} — ${E(x.nav||x.id)}</option>`).join('')}</select></div>`
  +`<div class="qk"><button data-bk="up" data-i="${sel}" title="Move section up">↑</button><button data-bk="down" data-i="${sel}" title="Move section down">↓</button><button data-bk="dup" data-i="${sel}" title="Duplicate section">⧉</button><button data-bk="hide" data-i="${sel}">${b.hidden?'Show':'Hide'}</button><button data-bk="del" data-i="${sel}" class="dgr" title="Delete section">✕</button><span class="sp"></span><button data-adm="goto">Scroll to</button><button data-adm="clrs" class="dgr">Reset style</button></div>`
  +G('Layout',R('Align',seg('b:align',['left','center','right'],1))+R('Title size',seg('b:size',['s','m','l','xl'],1))+R('Width',seg('b:width',['narrow','normal','full'],1))+R('Spacing',seg('b:pad',['none','s','m','l'],1))+R('Top divider',seg('b:div',['off','on'],1)))
  +G('Colours',R('Background',seg('b:bgs',['none','panel','accent','custom'],1))+R('Background colour',col('b:bgc'))+R('Text colour',col('b:tc')))
  +G('Typography',R('Font',font('b:sf')))
  +(opts?G('Type options',opts):'')
  +G('Animation',R('Effect',seg('b:anim',['default','rise','fade','left','zoom','blur','none'],1))+R('Delay (ms)',rng('b:delay',0,2000,100)))
  +G('Visibility',R('Hide on',seg('b:hide',['never','mobile','desktop'],1))+R('Hidden',tog('b:hidden')))
  +G('Identity',R('Nav label',txt('b:nav'))+R('Anchor id',txt('b:id','used by links, e.g. #about')))
  +G('Advanced',R('CSS class',txt('s:cls'))+W('Custom CSS, & = this section',area('s:css',5)))+G('Extras',R('Animation duration (s)',rng('s:ad',0,5,.1))+R('Extra delay (ms)',rng('s:adl',0,2000,50))+R('Padding top (px)',rng('s:pt',-40,120,2))+R('Padding bottom (px)',rng('s:pb',-40,120,2)))
  +G('Content',Object.entries(b).filter(([k])=>!skip.has(k)).map(([k,v])=>fld(`blocks.${sel}.${k}`,v,k)).join(''))},
 elem:()=>!el?'<p class="hint">Click any text on the page, then style just that element here. Changes apply instantly and survive publishing.</p>':`<p class="hint">Editing <b>${E(el.replace(/^blocks\.(\d+)\./,(_,n)=>((data.blocks[+n]?.id)||n)+'.'))}</b></p>`
  +G('Typography',R('Font',font('e:font'))+R('Size (rem)',rng('e:size',.6,9,.05))+R('Weight',seg('e:weight',['300','400','500','600','700','800','900'],1))+R('Align',seg('e:align',['','left','center','right'],1))+R('Case',seg('e:tt',['','none','uppercase','lowercase','capitalize'],1))+R('Letter space (em)',rng('e:ls',-.1,.4,.01))+R('Line height',rng('e:lh',1,2.4,.05)))
  +G('Colours',R('Text',col('e:color'))+R('Background',col('e:bg'))+R('Glow / shadow',col('e:sh')))
  +G('Spacing',R('Margin top (px)',rng('e:mt',-40,200,2))+R('Margin bottom (px)',rng('e:mb',-40,200,2))+R('Padding (em)',rng('e:pad',0,3,.1))+R('Corners (px)',rng('e:rad',0,40,1))+R('Max width (em)',rng('e:mw',0,40,1)))
  +G('Element',R('Opacity',rng('e:op',0,1,.05)))
  +'<p class="hint"><button data-adm="fxclear" class="dgr">Reset this element</button></p>',
 design:()=>G('Presets',`<div class="pre">${Object.entries(PRESETS).map(([n,[a]])=>`<button data-pre="${n}"><i style="background:${a}"></i>${n}</button>`).join('')}</div><p class="hint">One click restyles the whole site. Undo with Ctrl+Z if you do not like it.</p>`)
  +G('Colours',R('Accent',`<div class="sws">${SW.map(c=>`<button data-k="p:accent" data-v="${c}" style="background:${c}"></button>`).join('')}</div>`+col('p:accent'))+R('Theme',seg('p:theme',['auto','light','dark'],1))+R('Background',col('p:design.bg'))+R('Text',col('p:design.fg'))+R('Page image',`<div class="cl">${txt('p:design.bgImg','URL or upload')}<button data-adm="img" data-path="design.bgImg">Upload</button></div>`)+R('Image dimming',rng('p:design.dim',0,90,1,'%'))+R('Background glow',rng('p:design.glow',0,100,5,'%')))
  +G('Typography',R('Body font',font('p:design.font'))+R('Heading font',font('p:design.hfont'))+R('Accent italic font',font('p:design.efont'))+R('Heading size',rng('p:design.hscale',50,160,5,'%'))+R('Base size (px)',rng('p:design.size',12,22,1))+R('Heading weight',rng('p:design.hweight',300,900,100))+R('Heading tracking',seg('p:design.head',['tight','normal'],1)))
  +G('Layout',R('Page width',seg('p:design.width',['narrow','normal','wide'],1))+R('Card style',seg('p:design.card',['glass','solid','outline'],1))+R('Navigation',seg('p:design.nav',['pill','bar'],1))+R('Corner radius',rng('p:design.radius',0,48,1,'px'))+R('Section spacing',rng('p:design.space',30,220,5,'%'))+R('Card gap',rng('p:design.gap',0,48,1,'px')))
  +G('Motion',R('Scroll reveal',tog('p:design.anim'))+R('Reveal style',seg('p:design.reveal',['rise','fade','left','zoom','blur','none'],1))+R('Duration (ms)',rng('p:design.dur',100,2000,100))+R('Stagger (ms)',rng('p:design.stagger',0,400,20))+R('Card hover',seg('p:design.hover',['lift','glow','none'],1))+R('Card spotlight',tog('p:design.spot'))+R('Cursor glow',tog('p:design.cursor'))+R('Smooth scrolling',tog('p:design.smooth'))+R('Progress bar',tog('p:design.progress')))
  +G('Ticker',R('Loop time (s)',rng('p:design.mqs',10,120,5))),
 site:()=>G('Site',R('Brand',txt('p:site.brand'))+R('Footer',txt('p:site.footer'))+R('Button label',txt('p:site.cta.label'))+R('Button link',txt('p:site.cta.url')))
  +G('Navigation',R('Sticky nav',tog('p:design.sticky'))+R('Theme button',tog('p:design.themeBtn')))
  +G('Small texts',R('"View all"',txt('p:site.ui.all'))+R('"Show less"',txt('p:site.ui.less'))+R('Card link text',txt('p:site.ui.open'))+R('Form name hint',txt('p:site.ui.phName'))+R('Form message hint',W('',area('p:site.ui.phMsg',2))))
  +G('SEO',R('Page title',txt('p:seo.title'))+W('Description',area('p:seo.desc',3))+R('Share image',`<div class="cl">${txt('p:seo.image','URL or upload')}<button data-adm="img" data-path="seo.image">Upload</button></div>`)+R('Favicon',`<div class="cl">${txt('p:seo.favicon','Emoji or image URL')}<button data-adm="img" data-path="seo.favicon">Upload</button></div>`)+R('Theme colour',col('p:seo.color'))+'<p class="hint">Publish also writes these into index.html so Discord and Google can read them. Share image: 1200×630 works best.</p>')
  +G('Integrations',R('Discord webhook',txt('p:integ.webhook','https://discord.com/api/webhooks/…'))+R('Form endpoint',txt('p:integ.formUrl','Formspree, Web3Forms…'))+R('Plausible domain',txt('p:integ.plausible','example.com'))+'<p class="hint">These values are public in content.json. Use a throwaway webhook.</p>'),
 code:()=>G('Custom CSS',W('',area('p:custom.css',12))+'<p class="hint">Applies to the whole site, visitors and editor alike.</p>')
  +G('Head HTML or scripts',W('',area('p:custom.head',8))+'<p class="hint">Analytics pixels, widgets, meta tags. Runs for visitors only, never in edit mode or the preview.</p>'),
 json:()=>`<textarea class="big" id="adj" spellcheck="false">${E(JSON.stringify(data,null,2))}</textarea><p class="jrow"><button data-adm="apply" class="pri">Apply JSON</button> <button data-adm="copy">Copy</button> <button data-adm="dl">Download</button><span class="hint">The whole content.json. Apply is undoable with Ctrl+Z.</span></p>`};
function draw(){const y=p.querySelector('.pb')?.scrollTop||0,s=p.querySelector('.srch')?.value||'';if(!data.blocks[sel])sel=0;
 const ctx=tab==='block'?`${sel+1} · ${E(T[data.blocks[sel]?.type]?.n||'')}`:tab==='elem'?(el?E(el):'no element selected'):'';
 p.innerHTML=`<div class="hd2"><div class="ht"><b>Admin panel</b><span class="ctx">${ctx}</span></div><span><button data-adm="pv" title="Preview in phone, tablet or desktop">Preview</button><button data-adm="close" aria-label="Close">✕</button></span></div>
 <input class="srch" type="search" placeholder="Search settings…" value="${E(s)}">
 <div class="tabs">${TABS.map(([k,i,l])=>`<button data-tab="${k}"${k===tab?' class="on"':''}>${i} ${l}</button>`).join('')}</div>
 <div class="pb">${T2[tab](data.blocks[sel])||''}</div>`;
 p.querySelector('.pb').scrollTop=y;if(s)flt(s.toLowerCase())}
const put=(k,v)=>{const[t,...r]=k.split(':'),y=r.join(':');
 if(t==='p')set(y,v);
 else if(t==='b'){const b=data.blocks[sel];b[y]=v;const cl={anim:'an',align:'align',bgc:'bg',tc:'color',sf:'font',delay:'adl'}[y];if(cl&&b.style&&cl in b.style)delete b.style[cl]}
 else if(t==='s'){const b=data.blocks[sel];(b.style||(b.style={}))[y]=v}
 else{const f=fxk(el);(data.fx[f]||(data.fx[f]={}))[y]=v;const n=document.querySelector(`[data-p="${el}"]`);if(n)n.style.cssText=fxs(el);applyDesign();touch();return}
 touch();clearTimeout(rt);rt=setTimeout(render,250)};
const pv=document.createElement('div');pv.id='pv';pv.hidden=true;pv.innerHTML='<div class="pvt">'+[['📱 Phone',390],['▭ Tablet',820],['🖥 Desktop',1280]].map(([l,w])=>`<button data-w="${w}">${l}</button>`).join('')+'<button data-w="r">↻ Refresh</button><button data-w="x">✕ Close</button></div><div class="pvf"><iframe title="Preview"></iframe></div>';document.body.append(pv);
const pf=pv.querySelector('iframe');window.__pvFrame=pf.contentWindow;const preview=async()=>{commit();
 // refresh cached code files so the preview iframe always runs the current app.js/styles
 try{await Promise.all(['app.js','admin.js','styles.css'].map(u=>fetch(u,{cache:'reload'})))}catch{}
 pf.src=location.pathname+'?pv='+Date.now()+'#preview';pv.hidden=false};
pv.addEventListener('click',e=>{const w=e.target.closest('[data-w]')?.dataset.w;if(!w)return;if(w==='x')pv.hidden=true;else if(w==='r')preview();else pf.style.width=w+'px'});
const openP=i=>{if(i<0&&!p.hidden)return close();if(i>=0){sel=i;tab='block'}p.hidden=false;document.body.classList.add('adm');draw()},close=()=>{pv.hidden=true;p.hidden=true;document.body.classList.remove('adm')};
const flt=q=>{let vis=0;p.querySelectorAll('.pb .fr').forEach(n=>{const m=!q||n.textContent.toLowerCase().includes(q);n.style.display=m?'':'none';if(m)vis++});p.querySelectorAll('.pb details,.pb fieldset').forEach(g=>{const m=[...g.querySelectorAll(':scope .fr')].some(n=>n.style.display!=='none');if(g.tagName==='DETAILS'){g.style.display=m||!q?'':'none';if(q&&m)g.open=true}else g.style.display=m?'':'none'});return vis};
p.addEventListener('input',e=>{const t=e.target,k=t.dataset.k;if(!k&&t.classList.contains('srch')){flt(t.value.trim().toLowerCase());return}if(!k)return;const u=t.dataset.u||'',n=+t.value,v=t.dataset.t==='b'?t.checked:t.dataset.t==='n'?(t.type==='range'?n:n||''):t.value;
 const o=t.parentNode.querySelector('output');if(o)o.textContent=(t.value||'auto')+u;
 if(t.type==='color'||t.type==='text')t.parentNode.querySelectorAll('input').forEach(i=>{if(i!==t&&(i.type==='text'||/^#[0-9a-f]{6}$/i.test(t.value)))i.value=t.value});
 if(k==='b:id'){const v2=String(t.value).toLowerCase().replace(/[^a-z0-9-]/g,''),b=data.blocks[sel];if(v2&&v2!==b.id){const of={};for(const fk in data.fx)of[fk.startsWith(b.id+'.')?v2+fk.slice(b.id.length):fk]=data.fx[fk];data.fx=of}put(k,v2);return}
 put(k,v)});
p.addEventListener('change',e=>{if(e.target.dataset.sel!==undefined){sel=+e.target.value;draw();document.querySelectorAll('.blk')[sel]?.scrollIntoView({behavior:'smooth'})}});
p.addEventListener('toggle',e=>{const d=e.target;if(d.dataset?.g)d.open?open.add(d.dataset.g):open.delete(d.dataset.g)},true);
p.addEventListener('click',e=>{e.stopPropagation();const t=e.target.closest('button');if(!t)return;const a=t.dataset.adm,v=t.dataset.v,ai=t.dataset.ai;
 if(t.dataset.tab){tab=t.dataset.tab;draw();return}
 if(ai){const path=t.dataset.p,j=+t.dataset.j,bi=+path.split('.')[1],lst=path.split('.')[2];
  if(ai==='aadd')mutate(()=>{const b=get(data,path.split('.').slice(0,2).join('.'));get(data,path).push(ITEM[{options:'option',buttons:'buttons'}[lst]||b.type]())});
  else if(ai==='adel')mutate(()=>{get(data,path).splice(j,1);shiftFx(bi,lst,x=>x===j?null:x>j?x-1:x)});
  else if(ai==='adup')mutate(()=>{const l=get(data,path),bid=data.blocks[bi].id,base=bid+'.'+lst+'.'+j,snap={};for(const fk in data.fx)if(fk===base||fk.startsWith(base+'.'))snap[fk]=structuredClone(data.fx[fk]);l.splice(j+1,0,structuredClone(l[j]));shiftFx(bi,lst,x=>x>j?x+1:x);for(const fk in snap)data.fx[bid+'.'+lst+'.'+(j+1)+fk.slice(base.length)]=snap[fk]});
  else{const j2=ai==='aup'?j-1:j+1;mutate(()=>{const l=get(data,path);[l[j],l[j2]]=[l[j2],l[j]];shiftFx(bi,lst,x=>x===Math.min(j,j2)?Math.max(j,j2):x===Math.max(j,j2)?Math.min(j,j2):x)})}
  draw();return}
 if(t.dataset.bk){const bk=t.dataset.bk,i=+t.dataset.i,q=data.blocks;
  if(bk==='del'){if(confirm('Delete this section?')){mutate(()=>{dropFx(q[i].id);q.splice(i,1)});if(sel>=q.length)sel=q.length-1}}
  else if(bk==='dup')mutate(()=>{const n=structuredClone(q[i]),bid=q[i].id;n.id=uid();for(const fk in data.fx)if(fk.startsWith(bid+'.'))data.fx[n.id+'.'+fk.slice(bid.length+1)]=structuredClone(data.fx[fk]);q.splice(i+1,0,n)});
  else if(bk==='hide')mutate(()=>{q[i].hidden=!q[i].hidden});
  else mutate(()=>{const j=bk==='up'?i-1:i+1;if(q[j])[q[i],q[j]]=[q[j],q[i]]});
  draw();return}
 if(v!==undefined){put(t.dataset.k,t.classList.contains('on')&&t.dataset.clr?'':v);draw();return}
 if(t.dataset.pre){const[a,d]=PRESETS[t.dataset.pre];mutate(()=>{data.accent=a;data.design={...data.design,...d}});draw();return}
 else if(a==='close')close();else if(a==='pv')preview();else if(a==='goto')document.querySelectorAll('.blk')[sel]?.scrollIntoView({behavior:'smooth'});
 else if(a==='clrs'){mutate(()=>{const b=data.blocks[sel];delete b.style;Object.assign(b,STYLE)});draw()}
 else if(a==='fxclear'){delete data.fx[fxk(el)];const n=document.querySelector(`[data-p="${el}"]`);if(n)n.style.cssText='';touch();draw()}
 else if(a==='img'){fpath=t.dataset.path;fi.click()}
 else if(a==='copy'){navigator.clipboard?.writeText(p.querySelector('#adj').value);toast('Copied')}
 else if(a==='dl'){const z=document.createElement('a');z.href=URL.createObjectURL(new Blob([p.querySelector('#adj').value],{type:'application/json'}));z.download='content.json';z.click()}
 else if(a==='apply'){try{const j=JSON.parse(p.querySelector('#adj').value);mutate(()=>{data=norm(j)});toast('Applied')}catch(x){toast('Invalid JSON: '+x.message)}}});
fi.onchange=()=>{const f=fi.files[0];fi.value='';if(f)shrink(f).then(v=>{mutate(()=>set(fpath,v));draw()}).catch(()=>toast('Could not read that image'))};
document.addEventListener('focusin',e=>{const n=e.target.closest?.('[contenteditable][data-p]');if(!n||p.hidden||p.contains(e.target))return;el=n.dataset.p;const i=[...document.querySelectorAll('.blk')].indexOf(n.closest('.blk'));if(i>=0)sel=i;if(tab==='elem'||tab==='block')draw()});
addEventListener('hashchange',()=>{if(!edit)close()});
window.ADM={open:openP,close,isOpen:()=>!p.hidden,sync:()=>{if(!p.hidden&&!p.contains(document.activeElement))draw()}};
})();
