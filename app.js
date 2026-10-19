// Portfolio renderer + block editor. All content lives in content.json (a list of "blocks").
const KEY='portfolio-draft-v2',FONTS={system:'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',serif:'Georgia,"Iowan Old Style",serif',mono:'ui-monospace,"SF Mono",Menlo,Consolas,monospace',rounded:'ui-rounded,"SF Pro Rounded",Nunito,"Segoe UI",system-ui,sans-serif'},SW=['#c4a6ff','#7c8cff','#2563eb','#10b981','#f59e0b','#ef4444','#ec4899'];
let data,pubN,pubStr,pub,edit=false,hist=[],pos=0,timer,imgPath,dr=false,menu=false,sp=-1,dopen={};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^(https?:|mailto:|#|\/)/i.test(u||'')?u:'#';
const safeImg=u=>/^(https?:\/\/|data:image\/|\.{0,2}\/?[\w.\-\/]+$)/i.test(u||'')?u:'';
const arr=a=>Array.isArray(a)?a:[],uid=()=>'b'+Math.random().toString(36).slice(2,7);
const get=(o,p)=>p?p.split('.').reduce((a,k)=>a?.[k],o):o;
const set=(p,v)=>{const k=p.split('.'),l=k.pop();get(data,k.join('.'))[l]=v};

// Item templates and block types (defaults used by "Add section" and "+ Add").
const ITEM={cards:()=>({eyebrow:'Role',title:'Title',text:'Short description.',badge:'',stat:'',statLabel:'',link:'',image:''}),list:()=>({title:'Name',sub:'Role',text:'What you did.',badge:'Retired'}),stats:()=>({value:'100+',label:'Label'}),gallery:()=>({image:'',caption:''}),contact:()=>({label:'Discord',value:'@handle',url:'#'}),marquee:()=>'New name',option:()=>'Option',buttons:()=>({label:'Button',url:'#',style:'solid'})};
const STYLE={align:'left',size:'m',pad:'m',width:'normal',bgs:'none',bgc:'',div:'off',anim:'default',delay:0,tc:'',sf:'',hide:'never'};
const DD={font:'system',hfont:'system',efont:'serif',fontC:'',hfontC:'',efontC:'',size:16,hscale:100,hweight:700,head:'tight',radius:18,card:'glass',nav:'pill',width:'normal',space:100,gap:14,glow:60,bg:'',fg:'',bgImg:'',dim:0,anim:true,reveal:'rise',dur:900,stagger:80,hover:'lift',spot:true,cursor:true,smooth:true,progress:true,sticky:true,themeBtn:true,css:''};
const GF=['Inter','Poppins','Space Grotesk','Outfit','Sora','Manrope','Playfair Display','Instrument Serif','DM Serif Display','JetBrains Mono'];
const T={
 hero:{n:'Hero',x:'Headline, buttons, profile chip',d:()=>({eyebrow:'Your role · your focus',title:'Building *something* great.',text:'One or two sentences about what you do.',btn1:{label:'View work',url:'#'},btn2:{label:'Contact',url:'#'},chipOn:'on',chip:{name:'Your name',handle:'@handle',status:'Offline',image:''}})},
 text:{n:'Text',x:'Eyebrow, big title, paragraphs',d:()=>({eyebrow:'About',title:'A *short* title.',text:'Write about yourself here.',layout:'split'})},
 marquee:{n:'Ticker',x:'Scrolling list of names',d:()=>({label:'Communities I have helped run',items:['Name one','Name two','Name three','Name four']})},
 stats:{n:'Stats',x:'Big numbers with labels',d:()=>({items:[ITEM.stats(),ITEM.stats(),ITEM.stats()]})},
 cards:{n:'Cards',x:'Grid, carousel or numbered cards',d:()=>({eyebrow:'Experience',title:'Communities.',text:'',layout:'grid',cols:'3',items:[ITEM.cards(),ITEM.cards(),ITEM.cards()]})},
 list:{n:'List',x:'Rows with badges (e.g. previous roles)',d:()=>({eyebrow:'Previous',title:'Retired experience',text:'',items:[ITEM.list(),ITEM.list()]})},
 feature:{n:'Feature',x:'One large highlighted card',d:()=>({label:'Biggest project',title:'Project name',sub:'Your role',text:'What it is and what you did.',stat:'160K+',statLabel:'members',link:''})},
 gallery:{n:'Gallery',x:'Image tiles with title and text',d:()=>({eyebrow:'Design',title:'Custom *work*.',text:'Describe the work shown.',note:'Original work. All rights reserved.',cols:'4',items:[ITEM.gallery(),ITEM.gallery(),ITEM.gallery(),ITEM.gallery()]})},
 contact:{n:'Contact',x:'Link rows and a request form',d:()=>({eyebrow:'Contact',title:'Want to work *together*?',text:'Send me a project request or message me.',email:'',options:['Server setup','Moderation','Something else'],form:'on',rows:[ITEM.contact()],fl:{name:'Name or Discord username',need:'What do you need?',hint:'pick any that apply',msg:'Tell me what you need',send:'Send request'}})},
 notice:{n:'Notice',x:'Small footnote text',d:()=>({text:'Small print goes here.'})},
 embed:{n:'Embed',x:'YouTube, Spotify, maps, any URL or HTML',d:()=>({eyebrow:'',title:'',text:'',mode:'url',src:'',code:'',ratio:'16:9',note:''})},
 image:{n:'Image',x:'Full-width picture with caption',d:()=>({image:'',caption:''})},
 buttons:{n:'Buttons',x:'Row of buttons or links',d:()=>({items:[ITEM.buttons(),{label:'Another',url:'#',style:'ghost'}]})},
 spacer:{n:'Spacer',x:'Empty vertical space',d:()=>({height:'80'})}};
const OPT={hero:{chipOn:['on','off']},text:{layout:['split','stack'],ratio:['1:1','1:2','2:1','1:3'],tcols:['1','2','3']},marquee:{speed:['normal','slow','fast','off'],dir:['left','right']},stats:{cols:['auto','2','3','4']},cards:{layout:['grid','carousel','numbered'],cols:['1','2','3','4']},gallery:{cols:['2','3','4'],ratio:['1:1','1:2','2:1','1:3']},contact:{form:['on','off'],ratio:['1:1','1:2','2:1','1:3']},embed:{mode:['url','code'],ratio:['16:9','4:3','1:1','21:9','tall']},image:{ratio:['16:9','4:3','1:1','21:9','auto'],fit:['cover','contain']}};
const base=type=>({...Object.fromEntries(Object.entries(OPT[type]||{}).map(([k,v])=>[k,v[0]])),...T[type].d(),...STYLE}),blk=type=>({id:uid(),type,hidden:false,nav:'',...base(type)});

// Old (v1) content.json files are converted into blocks automatically.
function migrate(d){const H=d.hero||{},hid=arr(d.hidden),L=d.labels||{},E=d.eyebrows||{},C=d.contact||{},k=arr(C.links)[0]||{},mk=(id,type,o)=>({id,type,hidden:hid.includes(id),nav:'',...T[type].d(),...o}),
 cd=(id,l)=>mk(id,'cards',{eyebrow:E[id]||'',title:L[id]||l,cols:'2',nav:L[id]||l,items:arr(d[id]).map(x=>({...ITEM.cards(),eyebrow:x.role||'',title:x.title||'',text:x.desc||'',badge:x.badge||'',link:x.link||''}))});
 return{...d,blocks:[mk('hero','hero',{eyebrow:H.title||'',title:H.name||'Welcome',text:H.intro||'',btn1:{label:H.cta||'',url:'#current'},btn2:{label:'',url:''},chipOn:'off'}),mk('ticker','marquee',{items:[...new Set([...arr(d.current),...arr(d.former)].map(x=>x.title))].join(', ')}),mk('about','text',{eyebrow:E.about||'About',title:L.about||'About me',text:d.about||'',nav:'About'}),cd('current','Current positions'),cd('former','Former positions'),mk('contact','contact',{email:C.email||'',rows:arr(C.links).map(x=>({label:x.label,value:x.label,url:x.url}))})],site:{brand:H.brand||H.name||'',cta:{label:k.label||'',url:k.url||'#'}}}}
const split=v=>typeof v==='string'?v.split(',').map(x=>x.trim()).filter(Boolean):arr(v);
const fixB=b=>{if(b.type==='marquee')b.items=split(b.items);if(b.type==='contact'){b.options=split(b.options);b.fl={...T.contact.d().fl,...b.fl}}return b};
function norm(d){d=d&&typeof d==='object'?d:{};if(!Array.isArray(d.blocks))d=migrate(d);
 return{accent:d.accent||'#c4a6ff',theme:d.theme||'auto',design:{...DD,...d.design},site:{brand:'',footer:'',title:'',desc:'',favicon:'',...d.site,cta:{label:'',url:'#',...d.site?.cta},ui:{all:'view all',less:'show less',open:'Open',phName:'How should I address you?',phMsg:'What the project is, and your timeline.',...d.site?.ui}},blocks:d.blocks.filter(b=>T[b?.type]).map(b=>({...base(b.type),id:b.id||uid(),hidden:!!b.hidden,nav:b.nav||'',...b})).map(fixB)}}

// Field helpers: editable in place in edit mode. *word* becomes an italic accent word.
const rich=v=>v.replace(/\[(.+?)\]\((.+?)\)/g,(m,t,u)=>`<a href="${safeUrl(u)}"${/^https?:/i.test(u)?' target="_blank" rel="noopener"':''}>${t}</a>`).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/==(.+?)==/g,'<mark>$1</mark>');
const f=(p,tag='span',cls='')=>{let v=esc(get(data,p));if(!edit)v=rich(v);return`<${tag} class="${cls}"${edit?` contenteditable="true" data-p="${p}"`:''}>${v}</${tag}>`};
const im=(p,cls,alt='')=>{const s=safeImg(get(data,p));return s?`<img class="${cls}" src="${esc(s)}" alt="${esc(alt)}"${edit?` data-img="${p}"`:''}>`:edit?`<button class="addimg" data-img="${p}">+ Image</button>`:''};
const btn=(a,p,i,t)=>`<button data-a="${a}" data-p="${p}" data-i="${i}" aria-label="${a}" title="${a}">${t}</button>`;
const ctl=(p,j)=>{const n=get(data,p).length;return edit?`<div class="ctl">${btn('dup',p,j,'⧉')}${j>0?btn('up',p,j,'↑'):''}${j<n-1?btn('down',p,j,'↓'):''}${btn('del',p,j,'✕')}</div>`:''};
const add=p=>edit?`<button class="add" data-a="add" data-p="${p}">+ Add</button>`:'';
const P=(i,k)=>`blocks.${i}.${k}`,F=(i,k,tag,cls)=>edit||get(data,P(i,k))?f(P(i,k),tag,cls):'';
const HD=(b,i)=>`<div class="hd rv">${F(i,'eyebrow','p','eye')}${F(i,'title','h2')}${F(i,'text','p','sub2')}</div>`;
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
const cardH=(b,i,x,j)=>{const p=P(i,'items.'+j);return`<article class="card rv">${im(p+'.image','cimg',x.title)}${b.layout==='numbered'?`<small>${String(j+1).padStart(2,'0')}</small>`:edit||x.eyebrow?f(p+'.eyebrow','small'):''}${f(p+'.title','h3')}${edit||x.text?f(p+'.text','p','mut'):''}${edit||x.badge?f(p+'.badge','span','badge'):''}${edit||x.stat?`<div class="foot">${f(p+'.stat','b')}${f(p+'.statLabel','span','mut')}</div>`:''}${edit?`<p class="mut">Link: ${f(p+'.link')}</p>`:x.link?`<a class="go" href="${esc(safeUrl(x.link))}" target="_blank" rel="noopener">${esc(data.site.ui.open)} ↗</a>`:''}${ctl(P(i,'items'),j)}</article>`};

const embedUrl=u=>{u=(u||'').trim();let m;if(!/^https:\/\//i.test(u))return'';
  if(m=u.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/))return'https://www.youtube.com/embed/'+m[1];
  if(m=u.match(/vimeo\.com\/(\d+)/))return'https://player.vimeo.com/video/'+m[1];
  if(m=u.match(/open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/(\w+)/))return`https://open.spotify.com/embed/${m[1]}/${m[2]}`;
  return u};
// One renderer per block type.
const R={
 hero:(b,i)=>{const c=P(i,'chip'),bt=(k,cl)=>{const x=b[k];return edit?`<span class="btn ${cl}">${f(P(i,k)+'.label')}</span><span class="mut"> → ${f(P(i,k)+'.url')}</span>`:x.label?`<a class="btn ${cl}" href="${esc(safeUrl(x.url))}">${esc(x.label)}</a>`:''};
  return`<div class="hero-in">${b.chipOn!=='off'?`<div class="chip">${im(c+'.image','av',b.chip.name)}<span>${f(c+'.name')}</span><small>${f(c+'.status')}</small><small>${f(c+'.handle')}</small></div>`:''}${F(i,'eyebrow','p','eye')}${f(P(i,'title'),'h1')}${F(i,'text','p','lead')}<div class="btns">${bt('btn1','')}${bt('btn2','ghost')}</div></div>`},
 text:(b,i)=>`<div class="${b.layout==='split'?'split':''}" data-r="${b.ratio}" data-tc="${b.tcols}"><div class="hd rv">${F(i,'eyebrow','p','eye')}${F(i,'title','h2')}</div>${F(i,'text','p','body rv')}</div>`,
 marquee:(b,i)=>{const n=b.items.filter(Boolean);return`${F(i,'label','p','eye mid')}${edit?`<div class="tkedit">${b.items.map((x,j)=>`<span class="tki">${f(P(i,'items.'+j))}${ctl(P(i,'items'),j)}</span>`).join('')}${add(P(i,'items'))}</div>`:`<div class="mq"><div class="mt" style="${b.speed==='off'?'animation:none':`animation-duration:${{slow:70,normal:40,fast:18}[b.speed]||40}s;animation-direction:${b.dir==='right'?'reverse':'normal'}`}">${[...n,...n].map(t=>`<span>${esc(t)}</span>`).join('')}</div></div>`}`},
 stats:(b,i)=>`<div class="stats" style="${/^\d$/.test(b.cols)?`grid-template-columns:repeat(${b.cols},1fr)`:''}">${b.items.map((x,j)=>`<div class="stat rv">${f(P(i,`items.${j}.value`),'b')}${f(P(i,`items.${j}.label`),'span','mut')}${ctl(P(i,'items'),j)}</div>`).join('')}</div>${add(P(i,'items'))}`,
 cards:(b,i)=>{const car=b.layout==='carousel'&&!edit;return`<div class="chead">${HD(b,i)}${car?`<div class="acts"><button class="pill" data-c="all">${esc(data.site.ui.all)} ${b.items.length}</button><button data-c="prev" aria-label="Previous">←</button><button data-c="next" aria-label="Next">→</button></div>`:''}</div><div class="grid ${car?'car':''}" style="--cols:${b.cols}">${b.items.map((x,j)=>cardH(b,i,x,j)).join('')}</div>${add(P(i,'items'))}`},
 list:(b,i)=>`${HD(b,i)}<div class="rows">${b.items.map((x,j)=>{const p=P(i,'items.'+j);return`<div class="rowi rv"><div>${f(p+'.title','h3')}${f(p+'.sub','p','role')}</div>${f(p+'.text','p','mut')}${edit||x.badge?f(p+'.badge','span','badge'):''}${ctl(P(i,'items'),j)}</div>`}).join('')}</div>${add(P(i,'items'))}`,
 feature:(b,i)=>`<article class="card big rv"><p class="eye dot">${f(P(i,'label'))}</p>${f(P(i,'title'),'h2')}${f(P(i,'sub'),'p','role')}${f(P(i,'text'),'p','mut')}${edit||b.stat?`<div class="foot">${f(P(i,'stat'),'b')}${f(P(i,'statLabel'),'span','mut')}</div>`:''}${edit?`<p class="mut">Link: ${f(P(i,'link'))}</p>`:b.link?`<a class="go" href="${esc(safeUrl(b.link))}" target="_blank" rel="noopener">${esc(data.site.ui.open)} ↗</a>`:''}</article>`,
 gallery:(b,i)=>`<div class="split" data-r="${b.ratio}">${HD(b,i)}<div class="panel"><div class="gal" style="--cols:${b.cols}">${b.items.map((x,j)=>`<figure class="tile rv">${im(P(i,`items.${j}.image`),'',x.caption)}${edit||x.caption?f(P(i,`items.${j}.caption`),'figcaption','mut'):''}${ctl(P(i,'items'),j)}</figure>`).join('')}</div>${add(P(i,'items'))}</div></div>${F(i,'note','p','note')}`,
 contact:(b,i)=>{const rows=b.rows.map((x,j)=>{const p=P(i,'rows.'+j);return edit?`<div class="crow">${f(p+'.label','span','mut')}${f(p+'.value')}<span class="mut">→ ${f(p+'.url')}</span>${ctl(P(i,'rows'),j)}</div>`:`<a class="crow" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener"><span class="mut">${esc(x.label)}</span><b>${esc(x.value)} ↗</b></a>`}).join(''),fl=k=>f(P(i,'fl.'+k));
  const form=b.form!=='off'?`<div class="form"><div class="fld"><span>${fl('name')}</span><input name="n" placeholder="${esc(data.site.ui.phName)}"></div><div class="fld"><span>${fl('need')} <small class="mut">${fl('hint')}</small></span><div class="chips">${b.options.filter(Boolean).map(o=>`<button type="button" data-chip>${esc(o)}</button>`).join('')}</div></div><div class="fld"><span>${fl('msg')}</span><textarea name="m" rows="4" placeholder="${esc(data.site.ui.phMsg)}"></textarea></div>${edit?`<div class="btn">${fl('send')}</div>`:`<button type="button" class="btn" data-send="${i}">${esc(b.fl.send)}</button>`}</div>`:'';
  return`<div class="split" data-r="${b.ratio}"><div>${HD(b,i)}<div class="crows">${rows}</div>${add(P(i,'rows'))}${edit?`<p class="mut">Requests go to: ${f(P(i,'email'))}</p><p class="mut">Form options:</p><div class="tkedit">${b.options.map((x,j)=>`<span class="tki">${f(P(i,'options.'+j))}${ctl(P(i,'options'),j)}</span>`).join('')}${add(P(i,'options'))}</div>`:''}</div>${form}</div>`},
 image:(b,i)=>`<figure class="shot rv" style="--ar:${b.ratio==='auto'?'auto':b.ratio.replace(':','/')};--fit:${b.fit}">${im(P(i,'image'),'bigimg',b.caption)}${F(i,'caption','figcaption','mut')}</figure>`,
 buttons:(b,i)=>`<div class="btns">${b.items.map((x,j)=>{const p=P(i,'items.'+j),c=x.style==='solid'?'':x.style;return edit?`<span class="bedit"><span class="btn ${c}">${f(p+'.label')}</span><span class="mut">→ ${f(p+'.url')}</span><select data-sp="${p}.style">${['solid','ghost','pill'].map(o=>`<option${o===x.style?' selected':''}>${o}</option>`).join('')}</select>${ctl(P(i,'items'),j)}</span>`:`<a class="btn ${c}" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.label)}</a>`}).join('')}${add(P(i,'items'))}</div>`,
 spacer:(b,i)=>`<div class="spc" style="height:${Math.max(0,+b.height||0)}px">${edit?`<span class="mut">Spacer, height in px: ${f(P(i,'height'))}</span>`:''}</div>`,
 notice:(b,i)=>`<p class="note">${f(P(i,'text'))}</p>`,
 embed:(b,i)=>{const ar={'16:9':'16/9','4:3':'4/3','1:1':'1/1','21:9':'21/9',tall:'3/4'}[b.ratio]||'16/9',u=embedUrl(b.src),code=b.mode==='code';
  const fr=code?(b.code?`<iframe class="emb" style="aspect-ratio:${ar}" sandbox="allow-scripts allow-popups" srcdoc="${esc(b.code)}" loading="lazy" title="Embedded content"></iframe>`:''):(u?`<iframe class="emb" style="aspect-ratio:${ar}" src="${esc(u)}" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" title="Embedded content"></iframe>`:'');
  return`${HD(b,i)}${fr||(edit?'<p class="mut">Nothing to show yet. Add a URL or code below.</p>':'')}${edit?`<p class="mut">${code?'HTML code':'Embed URL (https, YouTube, Vimeo, Spotify, Google Maps...)'}:</p>${f(P(i,code?'code':'src'),'code','src')}`:''}${F(i,'note','p','note')}`}};
const bs=(i,k,l,vs)=>`<label>${l}<select data-bo="${k}" data-i="${i}">${vs.map(x=>`<option${String(data.blocks[i][k])===x?' selected':''}>${x}</option>`).join('')}</select></label>`;
const strip=(b,i)=>`<div class="strip"><b>${T[b.type].n}</b>${Object.entries(OPT[b.type]||{}).map(([k,v])=>`<select data-bo="${k}" data-i="${i}" aria-label="${k}" title="${k}">${v.map(x=>`<option${String(b[k])===x?' selected':''}>${x}</option>`).join('')}</select>`).join('')}${b.type==='hero'?'':`<input data-nl="${i}" value="${esc(b.nav)}" placeholder="Nav label" aria-label="Nav label">`}${[['style','Style'],['up','↑'],['down','↓'],['dup','⧉'],['hide',b.hidden?'Show':'Hide'],['del','✕']].map(([k,t])=>`<button data-bk="${k}" data-i="${i}">${t}</button>`).join('')}</div>${sp===i?`<div class="spanel">${bs(i,'align','Align',['left','center'])}${bs(i,'size','Title size',['s','m','l','xl'])}${bs(i,'pad','Spacing',['none','s','m','l'])}${bs(i,'width','Width',['normal','narrow','full'])}${bs(i,'bgs','Background',['none','panel','accent','custom'])}<label>Colour<input type="color" data-bo="bgc" data-i="${i}" value="${b.bgc||'#222222'}"></label>${bs(i,'div','Top divider',['off','on'])}${bs(i,'anim','Animation',['default','rise','fade','left','zoom','blur','none'])}<label>Delay (ms)<input type="number" data-bo="delay" data-i="${i}" value="${+b.delay||0}" min="0" step="100"></label><label>Text colour<input type="color" data-bo="tc" data-i="${i}" value="${b.tc||'#cccccc'}"></label><label>Font<input type="text" list="fl" data-bo="sf" data-i="${i}" value="${esc(b.sf||'')}" placeholder="default"></label>${bs(i,'hide','Hide on',['never','mobile','desktop'])}<label>Anchor id<input type="text" data-bid="${i}" value="${esc(b.id)}"></label></div>`:''}`;

const loaded=new Set();
const fam=(v,c)=>{const n=v==='custom'?(c||'').trim():FONTS[v]?'':v;if(!n)return FONTS[v]||FONTS.system;if(!loaded.has(n)){loaded.add(n);const l=document.createElement('link'),q=encodeURIComponent(n).replace(/%20/g,'+');l.rel='stylesheet';l.href=`https://fonts.googleapis.com/css2?family=${q}:wght@400;500;600;700&display=swap`;l.onerror=()=>{l.href=`https://fonts.googleapis.com/css2?family=${q}&display=swap`};document.head.appendChild(l)}return`"${n}",system-ui,sans-serif`};
const applyDesign=()=>{const d=data.design,r=document.documentElement.style,D=document.documentElement.dataset,so=(k,v)=>v===''||v==null?r.removeProperty(k):r.setProperty(k,v);
  so('--accent',data.accent);so('--radius',d.radius+'px');so('--glow',d.glow/100);so('--fs',d.size);so('--hs',d.hscale/100);so('--hw',d.hweight);so('--sp',d.space/100);so('--gp',d.gap);so('--dur',d.dur+'ms');so('--st',d.stagger+'ms');
  so('--bf',fam(d.font,d.fontC));so('--hf',fam(d.hfont,d.hfontC));so('--ef',fam(d.efont,d.efontC));so('--bg',d.bg);so('--fg',d.fg);so('--mut',d.fg?'color-mix(in srgb,var(--fg) 62%,transparent)':'');
  so('--bgimg',safeImg(d.bgImg)?`url("${d.bgImg.replace(/"/g,'%22')}") center/cover fixed`:'');so('--dim',d.dim/100);
  Object.assign(D,{card:d.card,nav:d.nav,head:d.head,width:d.width,hover:d.hover,anim:d.anim?'on':'off',spot:d.spot?'on':'off',cursor:d.cursor?'on':'off',smooth:d.smooth?'on':'off',prog:d.progress?'on':'off',sticky:d.sticky?'on':'off',theme:localStorage.theme||data.theme||'auto'});
  let u=$('#uc');if(!u){u=document.createElement('style');u.id='uc';document.head.appendChild(u)}u.textContent=d.css||'';
  const s=data.site;document.title=s.title||s.brand||'Portfolio';let m=$('meta[name=description]');if(!m){m=document.createElement('meta');m.name='description';document.head.appendChild(m)}m.content=s.desc||'';
  if(s.favicon){let ic=$('link[rel=icon]');if(!ic){ic=document.createElement('link');ic.rel='icon';document.head.appendChild(ic)}ic.href='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${esc(s.favicon)}</text></svg>`)}};
function render(){
  const s=data.site,cta=s.cta,dz=data.design;
  document.body.classList.toggle('editing',edit);applyDesign();
  $('#nav').innerHTML=`${edit?f('site.brand','b','logo'):`<b class="logo">${esc(s.brand)}</b>`}<div class="nl">${data.blocks.map((b,i)=>[b,i]).filter(([b])=>b.nav&&b.type!=='hero'&&(edit||!b.hidden)).map(([b,i])=>edit?`<span class="navl">${f(P(i,'nav'))}</span>`:`<a href="#${b.id}">${esc(b.nav)}</a>`).join('')}</div>${edit?`<span class="pill">${f('site.cta.label')}</span>`:cta.label?`<a class="pill" href="${esc(safeUrl(cta.url))}">${esc(cta.label)} ↗</a>`:''}${dz.themeBtn?'<button id="tt" aria-label="Toggle light or dark theme">◐</button>':''}`;
  $('#app').innerHTML=data.blocks.map((b,i)=>b.hidden&&!edit?'':`<section id="${esc(b.id)}" class="blk t-${b.type}${b.hidden?' off':''}" data-al="${b.align}" data-sz="${b.size}" data-pd="${b.pad}" data-w="${b.width}" data-bg="${b.bgs}" data-dv="${b.div}" data-hide="${b.hide||'never'}" data-fx="${b.anim==='default'?dz.reveal:b.anim}" style="--delay:${+b.delay||0}ms;--bgc:${esc(b.bgc||'transparent')}${b.tc?`;--tc:${esc(b.tc)}`:''}${b.sf?`;--sf:${esc(fam(b.sf,''))}`:''}">${edit?strip(b,i):''}${R[b.type](b,i)}</section>`).join('')+(edit||s.footer?`<footer>${f('site.footer','p','note')}</footer>`:'');
  $$('.rv:not(.in)').forEach(el=>io.observe(el));bar();
}
function bar(){
  const b=$('#bar'),d=data.design;b.hidden=!edit;if(!edit)return;
  const tb=(t,l,c='')=>`<button class="${c}" data-t="${t}">${l}</button>`,o=(v,c)=>`<option${String(v)===String(c)?' selected':''}>${v}</option>`,
   sel=(k,l,vs)=>`<label>${l}<select data-dz="${k}">${vs.map(v=>o(v,d[k])).join('')}</select></label>`,
   rng=(k,l,mn,mx,stp=1)=>`<label>${l}<span class="mut">${d[k]}</span><input type="range" data-dzr="${k}" min="${mn}" max="${mx}" step="${stp}" value="${d[k]}"></label>`,
   chk=(k,l)=>`<label>${l}<input type="checkbox" data-dz="${k}"${d[k]?' checked':''}></label>`,
   txt=(p,l)=>`<label>${l}<input type="text" data-sp="${p}" value="${esc(get(data,p))}"></label>`,
   col=(k,l)=>`<label>${l}<span><input type="color" data-dz="${k}" value="${d[k]||'#808080'}"><button data-rs="${k}">Reset</button></span></label>`,
   fonts=['system','serif','mono','rounded',...GF,'custom'],fs=(k,l)=>sel(k,l,fonts)+(d[k]==='custom'?`<label>${l} (Google Font name)<input type="text" data-dz="${k}C" value="${esc(d[k+'C'])}"></label>`:''),
   g=(id,t,h)=>`<details data-g="${id}"${dopen[id]?' open':''}><summary>${t}</summary>${h}</details>`;
  b.innerHTML=`<div class="row"><b>Editor</b><span id="st" role="status"></span><span class="sp"></span>${tb('menu','+ Add section','pri')}${tb('undo','↶ Undo')}${tb('redo','↷ Redo')}${tb('design','Design')}${tb('export','Export')}${tb('import','Import')}${tb('publish','Publish','pri')}${tb('exit','Exit')}</div>
  <div id="mn" class="${menu?'open':''}">${Object.entries(T).map(([k,v])=>`<button data-add="${k}"><b>${v.n}</b><span>${v.x}</span></button>`).join('')}</div>
  <aside id="dr" class="${dr?'open':''}"><header><b>Design</b>${tb('design','✕')}</header>
  ${g('c','Colours',`<div class="sw">${SW.map(c=>`<button data-sw="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<input type="color" id="acc" value="${esc(data.accent)}"></div><label>Default theme<select id="thm">${['auto','light','dark'].map(v=>o(v,data.theme)).join('')}</select></label>${col('bg','Background')}${col('fg','Text')}<label>Page image URL<input type="text" data-dz="bgImg" value="${esc(d.bgImg)}"></label>${rng('dim','Image dimming',0,90)}${rng('glow','Background glow',0,100)}`)}
  ${g('t','Typography',`${fs('font','Body font')}${fs('hfont','Heading font')}${fs('efont','Accent italic font')}${rng('size','Base size (px)',12,22)}${rng('hscale','Heading size %',50,150,5)}${rng('hweight','Heading weight',300,900,100)}${sel('head','Heading tracking',['tight','normal'])}`)}
  ${g('l','Layout',`${sel('width','Page width',['narrow','normal','wide'])}${sel('card','Card style',['glass','solid','outline'])}${rng('radius','Corner radius',0,40)}${rng('space','Section spacing %',30,220,10)}${rng('gap','Card gap (px)',0,48)}`)}
  ${g('a','Animation',`${chk('anim','Scroll reveal')}${sel('reveal','Reveal style',['rise','fade','left','zoom','blur','none'])}${rng('dur','Duration (ms)',100,2000,100)}${rng('stagger','Stagger (ms)',0,400,20)}${sel('hover','Card hover',['lift','glow','none'])}${chk('spot','Card spotlight')}${chk('cursor','Cursor glow')}${chk('smooth','Smooth scrolling')}${chk('progress','Progress bar')}`)}
  ${g('n','Navigation',`${sel('nav','Style',['pill','bar'])}${chk('sticky','Sticky')}${chk('themeBtn','Theme button')}${txt('site.cta.label','Button label')}${txt('site.cta.url','Button link')}`)}
  ${g('s','Site and SEO',`${txt('site.title','Page title')}${txt('site.desc','Description')}${txt('site.favicon','Favicon emoji')}`)}
  ${g('x','Small texts',`${txt('site.ui.all','"view all"')}${txt('site.ui.less','"show less"')}${txt('site.ui.open','Card link text')}${txt('site.ui.phName','Form name hint')}${txt('site.ui.phMsg','Form message hint')}`)}
  ${g('u','Custom CSS',`<textarea data-dz="css" rows="8" placeholder="/* your CSS */">${esc(d.css)}</textarea>`)}
  ${g('m','More',`<div class="srow">${tb('repo','Set repository')}${tb('reset','Discard draft')}</div><p class="hint">Click any text to edit it. *word* makes an italic accent word. Every section has its own toolbar and a Style panel. Ctrl+S saves, Ctrl+Z / Ctrl+Y undo and redo outside text fields, Esc closes panels.</p>`)}</aside>`;
  status();
}
const status=m=>{const s=$('#st');if(s){const same=JSON.stringify(data)===pubStr;s.className=same?'ok':'dirty';s.textContent=m==='Editing...'?'Editing...':same?'Published':'Unpublished changes'}if(m&&m!=='Editing...')toast(m)};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t.k);t.k=setTimeout(()=>t.classList.remove('show'),3500)}

// History: debounced snapshots (100 steps), autosaved to localStorage.
function commit(){clearTimeout(timer);const s=JSON.stringify(data);if(s===hist[pos])return;hist=hist.slice(0,pos+1);hist.push(s);if(hist.length>100)hist.shift();pos=hist.length-1;localStorage.setItem(KEY,s);status()}
const touch=()=>{status('Editing...');clearTimeout(timer);timer=setTimeout(commit,500)};
const mutate=fn=>{commit();fn();render();commit()};
function jump(d){commit();const n=pos+d;if(n<0||n>=hist.length)return;pos=n;data=JSON.parse(hist[pos]);localStorage.setItem(KEY,hist[pos]);render()}

function repo(){let s=localStorage.repo;if(!s){const h=location.hostname,g=location.pathname.split('/')[1];if(h.endsWith('.github.io'))s=h.split('.')[0]+'/'+(g&&!g.includes('.')?g:h)}return(s||'').split('/')}
async function publish(){
  let[o,r]=repo();if(!o||!r){setRepo();[o,r]=repo();if(!o||!r)return}
  let t=sessionStorage.token;if(!t){t=prompt('Paste a fine-grained token (this repo only, Contents: read and write). It is kept in this tab only and never saved to the repo.');if(!t)return;sessionStorage.token=t}
  commit();const u=`https://api.github.com/repos/${o}/${r}/contents/content.json`,h={Authorization:'Bearer '+t,Accept:'application/vnd.github+json'};
  try{
    status('Publishing...');
    const g=await fetch(u,{headers:h});if(!g.ok&&g.status!==404)throw new Error((await g.json()).message);
    const sha=g.ok?(await g.json()).sha:undefined,txt=JSON.stringify(data,null,2);
    const p=await fetch(u,{method:'PUT',headers:h,body:JSON.stringify({message:'Update content via editor',content:btoa(unescape(encodeURIComponent(txt))),sha})});
    if(!p.ok)throw new Error((await p.json()).message);
    pubStr=JSON.stringify(data);status('Published. GitHub Pages takes about a minute to redeploy.');
  }catch(e){if(/bad credentials/i.test(e.message))delete sessionStorage.token;status('Publish failed: '+e.message)}
}
function setRepo(){const s=prompt('Repository as owner/name',repo().join('/'));if(s&&/^[\w.-]+\/[\w.-]+$/.test(s))localStorage.repo=s}
const shrink=file=>new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const i=new Image();i.onerror=no;i.onload=()=>{const k=Math.min(1,1200/i.width),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',.85))};i.src=r.result};r.readAsDataURL(file)});

document.addEventListener('click',e=>{
  const x=e.target;
  if(x.id==='tt'){const cur=document.documentElement.dataset.theme,dark=cur==='auto'?matchMedia('(prefers-color-scheme:dark)').matches:cur==='dark';localStorage.theme=dark?'light':'dark';render();return}
  const fb=x.closest('[data-f]');if(fb){fmt(fb.dataset.f);return}
  const c=x.closest('[data-c]');if(c){const g=c.closest('section').querySelector('.grid');if(c.dataset.c==='all'){g.classList.toggle('all');c.textContent=g.classList.contains('all')?data.site.ui.less:`${data.site.ui.all} ${g.children.length}`}else g.scrollBy({left:(c.dataset.c==='next'?1:-1)*g.clientWidth*.8,behavior:'smooth'});return}
  const ch=x.closest('[data-chip]');if(ch){ch.classList.toggle('on');return}
  const sd=x.closest('[data-send]');if(sd){const b=data.blocks[+sd.dataset.send],f0=sd.closest('.form'),n=f0.querySelector('[name=n]').value,m=f0.querySelector('[name=m]').value,o=[...f0.querySelectorAll('[data-chip].on')].map(y=>y.textContent).join(', ');
    if(!b.email){toast('No email address is set for this form yet');return}
    location.href=`mailto:${b.email}?subject=${encodeURIComponent('Project request from '+n)}&body=${encodeURIComponent(`Name: ${n}\nNeeds: ${o}\n\n${m}`)}`;return}
  const el=x.closest('[data-a],[data-t],[data-img],[data-sw],[data-bk],[data-rs],[data-add]');if(!el||!edit)return;
  const{a,t,p,img,sw,bk,rs,add:ty}=el.dataset,i=+el.dataset.i,q=data.blocks;
  if(img){const u=prompt('Image URL. Leave empty to upload a file. Type - to remove the image.');if(u===null)return;if(u==='-')mutate(()=>set(img,''));else if(u)mutate(()=>set(img,u));else{imgPath=img;$('#imgf').click()}}
  else if(ty){menu=false;mutate(()=>{q.push(blk(ty))});setTimeout(()=>$$('.blk').pop()?.scrollIntoView({behavior:'smooth'}),60)}
  else if(bk){if(bk==='del'){if(confirm('Delete this section?'))mutate(()=>q.splice(i,1))}else if(bk==='dup')mutate(()=>{const n=structuredClone(q[i]);n.id=uid();q.splice(i+1,0,n)});else if(bk==='hide')mutate(()=>{q[i].hidden=!q[i].hidden});else if(bk==='style'){sp=sp===i?-1:i;render()}else mutate(()=>{const j=bk==='up'?i-1:i+1;if(q[j])[q[i],q[j]]=[q[j],q[i]]})}
  else if(a==='add')mutate(()=>{const b=get(data,p.split('.').slice(0,2).join('.'));get(data,p).push(ITEM[p.split('.')[2]==='options'?'option':b.type]())});
  else if(a==='del')mutate(()=>get(data,p).splice(i,1));
  else if(a==='dup')mutate(()=>{const l=get(data,p);l.splice(i+1,0,structuredClone(l[i]))});
  else if(a==='up'||a==='down')mutate(()=>{const l=get(data,p),j=a==='up'?i-1:i+1;[l[i],l[j]]=[l[j],l[i]]});
  else if(rs)mutate(()=>{data.design[rs]=''});else if(sw)mutate(()=>{data.accent=sw});
  else if(t==='menu'){menu=!menu;bar()}else if(t==='design'){dr=!dr;bar()}
  else if(t==='undo')jump(-1);else if(t==='redo')jump(1);
  else if(t==='export'){const z=document.createElement('a');z.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));z.download='content.json';z.click()}
  else if(t==='import')$('#imp').click();else if(t==='publish')publish();else if(t==='repo')setRepo();else if(t==='exit')location.hash='';
  else if(t==='reset'&&confirm('Discard local edits and go back to the published version?')){localStorage.removeItem(KEY);load()}
});
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.dzr){data.design[t.dataset.dzr]=+t.value;applyDesign();touch();return}
  if(t.id==='rad'){data.design.radius=+t.value;applyDesign();touch();return}
  const el=t.closest('[data-p]');if(el){set(el.dataset.p,el.innerText);touch()}});
document.addEventListener('paste',e=>{if(e.target.closest('[data-p]')){e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))}});
document.addEventListener('change',async e=>{const t=e.target;
  if(t.id==='acc'){data.accent=t.value;applyDesign();touch()}
  else if(t.id==='thm'){data.theme=t.value;localStorage.removeItem('theme');applyDesign();touch()}
  else if(t.dataset.dz)mutate(()=>{data.design[t.dataset.dz]=t.type==='checkbox'?t.checked:t.value});
  else if(t.dataset.bo)mutate(()=>{data.blocks[+t.dataset.i][t.dataset.bo]=t.value});
  else if(t.dataset.nl)mutate(()=>{data.blocks[+t.dataset.nl].nav=t.value});
  else if(t.dataset.sp)mutate(()=>set(t.dataset.sp,t.value));else if(t.dataset.bid)mutate(()=>{const v=t.value.toLowerCase().replace(/[^a-z0-9-]/g,'');if(v)data.blocks[+t.dataset.bid].id=v});
  else if(t.id==='imgf'&&t.files[0]){try{const v=await shrink(t.files[0]);mutate(()=>set(imgPath,v))}catch{toast('Could not read that image')}t.value=''}
  else if(t.id==='imp'&&t.files[0]){try{const j=JSON.parse(await t.files[0].text());if(!j||typeof j!=='object')throw 0;mutate(()=>{data=norm(j)})}catch{alert('Not a valid content.json file')}t.value=''}
});
addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault();location.hash=edit?'':'#edit';return}
  if(!edit)return;const k=e.key.toLowerCase(),txt=e.target.closest?.('[contenteditable],input,select,textarea');
  if(e.key==='Escape'&&(dr||menu)){dr=menu=false;bar()}
  else if(e.ctrlKey&&k==='s'){e.preventDefault();commit();toast('Draft saved in this browser')}
  else if(e.ctrlKey&&!txt&&k==='z'){e.preventDefault();jump(e.shiftKey?1:-1)}
  else if(e.ctrlKey&&!txt&&k==='y'){e.preventDefault();jump(1)}});
addEventListener('hashchange',load);
document.addEventListener('toggle',e=>{const d=e.target;if(d.dataset?.g)dopen[d.dataset.g]=d.open},true);
document.body.insertAdjacentHTML('beforeend','<div id="toast"></div><div id="prog"></div><div id="ft"><button data-f="**"><b>B</b></button><button data-f="*"><i>I</i></button><button data-f="==">Mark</button><button data-f="link">Link</button><button data-f="clear">Clear</button></div><datalist id="fl">'+[...Object.keys(FONTS),...GF].map(x=>`<option value="${x}">`).join('')+'</datalist>');
document.addEventListener('mousedown',e=>{if(e.target.closest('#ft'))e.preventDefault()});
document.addEventListener('selectionchange',()=>{const f=$('#ft'),g=getSelection(),an=g.anchorNode,n=(an?.nodeType===1?an:an?.parentElement)?.closest?.('[data-p]');if(!edit||!n||g.isCollapsed||!g.toString()){f.classList.remove('on');return}const r=g.getRangeAt(0).getBoundingClientRect();f.style.left=Math.max(8,r.left+r.width/2-110)+'px';f.style.top=Math.max(60,r.top-44)+'px';f.classList.add('on')});
function fmt(k){const g=getSelection();let t=g.toString();if(!t)return;if(k==='link'){const u=prompt('Link URL');if(!u)return;t=`[${t}](${u})`}else if(k==='clear')t=t.replace(/\*\*|\*|==/g,'').replace(/\[(.+?)\]\(.+?\)/g,'$1');else t=k+t+k;document.execCommand('insertText',false,t)}
document.documentElement.classList.add('js');
addEventListener('scroll',()=>{$('#prog').style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`},{passive:true});
document.addEventListener('pointermove',e=>{const r=document.documentElement.style;r.setProperty('--gx',e.clientX+'px');r.setProperty('--gy',e.clientY+'px');const c=e.target.closest?.('.card');if(c){const b=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-b.left+'px');c.style.setProperty('--my',e.clientY-b.top+'px')}},{passive:true});

function load(){
  edit=location.hash==='#edit';data=structuredClone(pubN);
  if(edit){try{const d=localStorage.getItem(KEY);if(d)data=norm(JSON.parse(d))}catch{}}
  hist=[JSON.stringify(data)];pos=0;dr=menu=false;sp=-1;render();
}
(async()=>{
  try{pub=await(await fetch('content.json',{cache:'no-store'})).json()}catch{pub={blocks:[{type:'text',eyebrow:'Error',title:'Content could not be loaded',text:'content.json is missing or invalid. Open the site from GitHub Pages instead of a local file.',layout:'stack'}]}}
  pubN=norm(pub);pubStr=JSON.stringify(pubN);load();
})();
