// Browser storage can be unavailable (sandboxed preview iframes, some private modes); fall back to memory so the editor still works.
let LS,SS;const mkMem=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>m[k]=String(v),removeItem:k=>delete m[k],clear:()=>{for(const k in m)delete m[k]}}};
try{LS=window['lo'+'calStorage'];LS.setItem('__t','1');LS.removeItem('__t')}catch(e){LS=mkMem()}
try{SS=window['se'+'ssionStorage'];SS.setItem('__t','1');SS.removeItem('__t')}catch(e){SS=mkMem()}
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
// Element styles (fx), keyed by block id + field path, e.g. "hero.title".
const fxk=p=>{const m=/^blocks\.(\d+)\.(.+)$/.exec(p||'');if(!m)return p;const b=data.blocks?.[+m[1]];return b?b.id+'.'+m[2]:p};
const fxu=(v,d)=>typeof v==='string'&&/[a-z%]$/i.test(v)?v:v+d; // legacy values may already carry units
const FXMAP={size:f=>`font-size:${fxu(f.size,'rem')}`,weight:f=>`font-weight:${f.weight}`,color:f=>`color:${f.color}`,align:f=>`text-align:${f.align}`,tt:f=>`text-transform:${f.tt}`,ls:f=>`letter-spacing:${fxu(f.ls,'em')}`,lh:f=>`line-height:${f.lh}`,font:f=>`font-family:${fam(f.font,'')}`,bg:f=>`background:${f.bg}`,mt:f=>`margin-top:${fxu(f.mt,'px')}`,mb:f=>`margin-bottom:${fxu(f.mb,'px')}`,pad:f=>f.pad?`padding:${fxu(f.pad,'em')}`:'',rad:f=>f.rad?`border-radius:${fxu(f.rad,'px')}`:'',op:f=>f.op!=null&&f.op!==1?`opacity:${f.op}`:'',sh:f=>`text-shadow:0 2px 16px ${f.sh}`,mw:f=>''};
const fxs=p=>{const fx=data.fx?.[fxk(p)];if(!fx)return'';let s='';for(const k in fx){const v=fx[k];if(v===''||v==null)continue;const m=FXMAP[k];if(m){const c=k==='mw'?(fx.mw?`max-width:${fx.mw}em`:''):m(fx);if(c)s+=c+';'}}return s.replace(/"/g,"'")};
// Keep element styles attached to the right item when lists are reordered, duplicated or deleted.
const shiftFx=(bi,list,fn)=>{const b=data.blocks[bi];if(!b||!data.fx)return;const pre=b.id+'.'+list+'.';const out={};for(const k in data.fx){if(k.startsWith(pre)){const m=k.slice(pre.length),i=parseInt(m,10);if(!isNaN(i)){const r=fn(i);if(r==null)continue;out[pre+r+m.slice(String(i).length)]=data.fx[k];continue}}out[k]=data.fx[k]}data.fx=out};
const dropFx=id=>{if(!data.fx)return;for(const k in data.fx)if(k.startsWith(id+'.'))delete data.fx[k]};

// Item templates and block types (defaults used by "Add section" and "+ Add").
const ITEM={cards:()=>({eyebrow:'Role',title:'Title',text:'Short description.',badge:'',stat:'',statLabel:'',link:'',image:''}),list:()=>({title:'Name',sub:'Role',text:'What you did.',badge:'Retired'}),stats:()=>({value:'100+',label:'Label'}),gallery:()=>({image:'',caption:''}),contact:()=>({label:'Discord',value:'@handle',url:'#'}),marquee:()=>'New name',option:()=>'Option',buttons:()=>({label:'Button',url:'#',style:'solid'}),rates:()=>({title:'Service name',price:'Contact for quote',priceNote:'',text:'What this service includes.'}),faq:()=>({q:'A question people ask?',a:'The answer, in one or two sentences.'}),testimonials:()=>({quote:'They delivered great work, on time.',name:'Client name',role:'Project',stars:'5'}),badge:()=>({label:'Badge',icon:'✦'}),pbadge:()=>'New badge',showcase:()=>({title:'Project',image:'',text:'One line about it.',link:''}),pstat:()=>({value:'4',label:'Games',icon:'🎮'}),wfield:()=>({name:'Field',value:'Value',inline:true}),badges:()=>({label:'Badge',icon:'✦'})};
const STYLE={align:'left',size:'m',pad:'m',width:'normal',bgs:'none',bgc:'',div:'off',anim:'default',delay:0,tc:'',sf:'',hide:'never',bgi:'',bgiAnim:'none',bgiDim:40,bgiSpd:16,bgiPos:'center',bgiInt:3,bgiSize:'cover'};
const DD={font:'system',hfont:'system',efont:'serif',fontC:'',hfontC:'',efontC:'',size:16,hscale:100,hweight:700,head:'tight',radius:18,card:'glass',nav:'pill',width:'normal',space:100,gap:14,glow:60,bg:'',fg:'',bgImg:'',dim:0,bgAnim:'none',bgAnimSpd:30,bgAnimDir:'alternate',bgPos:'center',bgInt:3,bgSize:'cover',anim:true,reveal:'rise',dur:900,stagger:80,hover:'lift',spot:true,cursor:true,ambient:false,loader:true,loaderStyle:'orb',loaderSpd:1,smooth:true,progress:true,sticky:true,themeBtn:true,css:''};
const GF=['Inter','Poppins','Space Grotesk','Outfit','Sora','Manrope','Playfair Display','Instrument Serif','DM Serif Display','JetBrains Mono'];
const T={
 hero:{n:'Hero',x:'Headline, buttons, profile chip',d:()=>({eyebrow:'Your role · your focus',title:'Building *something* great.',text:'One or two sentences about what you do.',buttons:[ITEM.buttons(),{label:'Contact',url:'#',style:'ghost'}],chipOn:'on',chip:{name:'Your name',handle:'@handle',status:'Offline',image:''}})},
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
 spacer:{n:'Spacer',x:'Empty vertical space',d:()=>({height:'80'})},
 profile:{n:'Profile',x:'Banner, avatar, badges and stats card',d:()=>({banner:'',bannerAnim:'zoom',bannerSpd:'20',bannerDim:'20',bannerPos:'center',bannerInt:'3',bannerSize:'cover',bannerDir:'alternate',name:'Your name',handle:'@handle',bio:'One or two lines about you.',badges:['QA Tester','Project Manager'],loc:'France, UTC+2',tz:'Europe/Paris',status:'Open to work',avatar:'',stats:[ITEM.pstat(),{value:'0',label:'Visits',icon:'▶'}]})},
 discord:{n:'Discord',x:'Live presence via Lanyard',d:()=>({userId:'',label:'',note:'',showActivity:'on'})},
 roblox:{n:'Roblox',x:'Profile card with avatar and stats',d:()=>({name:'Roblox name',handle:'@roblox',userId:'',text:'What you do on Roblox.',avatar:'',stats:[{value:'4',label:'Games',icon:'🎮'}],link:''})},
 rates:{n:'Rates',x:'Services with prices',d:()=>({eyebrow:'Services',title:'Rates',text:'',items:[ITEM.rates(),{title:'Another service',price:'From 5%',priceNote:'Starting at',text:'What this includes.'}]})},
 faq:{n:'FAQ',x:'Expandable questions',d:()=>({eyebrow:'',title:'Frequently asked',text:'',items:[ITEM.faq(),ITEM.faq()]})},
 testimonials:{n:'Testimonials',x:'Quotes with names and stars',d:()=>({eyebrow:'Reviews',title:'Track record',text:'',items:[ITEM.testimonials() ]})},
 cta:{n:'CTA banner',x:'Big highlighted call to action',d:()=>({eyebrow:'',title:'Let\'s work *together*.',text:'One line about what happens next.',buttons:[{label:'Get in touch',url:'#contact',style:'solid'}]})},
 badges:{n:'Badges',x:'Row of skill or role pills',d:()=>({eyebrow:'',title:'',text:'',items:[ITEM.badge(),ITEM.badge(),ITEM.badge()]})},
 showcase:{n:'Showcase',x:'Floating tilted project cards',d:()=>({eyebrow:'Games',title:'Featured *work*.',text:'',items:[ITEM.showcase(),ITEM.showcase(),ITEM.showcase()]})}};
const OPT={hero:{chipOn:['on','off']},text:{layout:['split','stack'],ratio:['1:1','1:2','2:1','1:3'],tcols:['1','2','3']},marquee:{speed:['normal','slow','fast','off'],dir:['left','right']},stats:{cols:['auto','2','3','4']},cards:{layout:['grid','carousel','numbered'],cols:['1','2','3','4']},gallery:{cols:['2','3','4'],ratio:['1:1','1:2','2:1','1:3']},contact:{form:['on','off'],ratio:['1:1','1:2','2:1','1:3']},embed:{mode:['url','code'],ratio:['16:9','4:3','1:1','21:9','tall']},image:{ratio:['16:9','4:3','1:1','21:9','auto'],fit:['cover','contain']},profile:{bannerAnim:['none','zoom','pan','fade','drift'],bannerDim:['0','10','20','30','40','50','60','70','80'],bannerSpd:['8','12','16','20','26','32','40'],bannerPos:['center','top','bottom','left','right'],bannerInt:['1','2','3','4','5'],bannerSize:['cover','contain','auto'],bannerDir:['alternate','normal','reverse']},discord:{showActivity:['on','off']},rates:{div:['on','off']},faq:{open:['first','all','none']},testimonials:{cols:['1','2','3']},showcase:{tilt:['none','left','right','mix']}};
const base=type=>({...Object.fromEntries(Object.entries(OPT[type]||{}).map(([k,v])=>[k,v[0]])),...T[type].d(),...STYLE}),blk=type=>({id:uid(),type,hidden:false,nav:'',...base(type)});

// Old (v1) content.json files are converted into blocks automatically.
function migrate(d){const H=d.hero||{},hid=arr(d.hidden),L=d.labels||{},E=d.eyebrows||{},C=d.contact||{},k=arr(C.links)[0]||{},mk=(id,type,o)=>({id,type,hidden:hid.includes(id),nav:'',...T[type].d(),...o}),
 cd=(id,l)=>mk(id,'cards',{eyebrow:E[id]||'',title:L[id]||l,cols:'2',nav:L[id]||l,items:arr(d[id]).map(x=>({...ITEM.cards(),eyebrow:x.role||'',title:x.title||'',text:x.desc||'',badge:x.badge||'',link:x.link||''}))});
 return{...d,blocks:[mk('hero','hero',{eyebrow:H.title||'',title:H.name||'Welcome',text:H.intro||'',btn1:{label:H.cta||'',url:'#current'},btn2:{label:'',url:''},chipOn:'off'}),mk('ticker','marquee',{items:[...new Set([...arr(d.current),...arr(d.former)].map(x=>x.title))].join(', ')}),mk('about','text',{eyebrow:E.about||'About',title:L.about||'About me',text:d.about||'',nav:'About'}),cd('current','Current positions'),cd('former','Former positions'),mk('contact','contact',{email:C.email||'',rows:arr(C.links).map(x=>({label:x.label,value:x.label,url:x.url}))})],site:{brand:H.brand||H.name||'',cta:{label:k.label||'',url:k.url||'#'}}}}
const split=v=>typeof v==='string'?v.split(',').map(x=>x.trim()).filter(Boolean):arr(v);
const fixB=b=>{if(b.type==='marquee')b.items=split(b.items);if(b.type==='contact'){b.options=split(b.options);b.fl={...T.contact.d().fl,...b.fl}}return b};
function norm(d){d=d&&typeof d==='object'?d:{};if(!Array.isArray(d.blocks))d=migrate(d);
 // hero: convert legacy btn1/btn2 into the editable buttons list, BEFORE defaults are merged,
 // so a canonical `buttons` array (even empty) always wins over the stale fields
 if(Array.isArray(d.blocks))d.blocks.forEach((b,i)=>{if(b&&b.type==='hero'&&('btn1'in b||'btn2'in b)){
   if(!Array.isArray(b.buttons))b.buttons=['btn1','btn2'].map(k=>({label:'',url:'#',style:k==='btn2'?'ghost':'solid',...(b[k]||{})}));
   if(d.fx){const of={};for(const fk in d.fx)if(fk.startsWith('blocks.'+i+'.btn1.')||fk.startsWith('blocks.'+i+'.btn2.'))of[fk.replace(/\.btn1\./g,'.buttons.0.').replace(/\.btn2\./g,'.buttons.1.')]=d.fx[fk];for(const fk in d.fx)if(!fk.startsWith('blocks.'+i+'.btn1.')&&!fk.startsWith('blocks.'+i+'.btn2.'))of[fk]=d.fx[fk];d.fx=of}
   delete b.btn1;delete b.btn2}});
 const raw=d.design||{};let g={...DD,...raw};
 // migrate legacy admin keys once: only when the canonical key is absent, then retire the legacy key
 const mv=(l,c,fn)=>{if(raw[l]!=null){if(raw[c]==null)g[c]=fn(raw[l]);delete g[l]}};
 mv('hsize','hscale',v=>+v||DD.hscale);mv('bsize','size',v=>Math.max(10,Math.min(24,Math.round(16*+v/100))));
 mv('sg','space',v=>+v||DD.space);mv('spd','dur',v=>Math.round(DD.dur*+v));
 // the old heading font lived in custom.hfont; move it into design once
 const ch=d.custom&&d.custom.hfont;if(ch&&raw.hfont==null)g.hfont=ch;
 const S=o=>o&&typeof o==='object'&&!Array.isArray(o)?o:{};
 const cust={css:'',head:'',...S(d.custom)};delete cust.hfont;
 const wm=S(S(d.integ).webhookMsg),we=S(S(wm).embed);
 return{...d,accent:d.accent||'#c4a6ff',theme:d.theme||'auto',design:g,
  site:{brand:'',footer:'',title:'',desc:'',favicon:'',...S(d.site),cta:{label:'',url:'#',...S(S(d.site).cta)},ui:{all:'view all',less:'show less',open:'Open',phName:'How should I address you?',phMsg:'What the project is, and your timeline.',...S(S(d.site).ui)}},
  custom:cust,seo:{title:'',desc:'',image:'',favicon:'',color:'',...S(d.seo)},integ:{webhook:'',formUrl:'',plausible:'',...S(d.integ),webhookMsg:{content:'',...wm,embed:{on:false,title:'',desc:'',color:'',footer:'',fields:[],...we}}},fx:S(d.fx),
  blocks:d.blocks.map(b=>T[b?.type]?{...base(b.type),id:b.id||uid(),hidden:!!b.hidden,nav:b.nav||'',...b}:b).map(b=>T[b?.type]?fixB(b):b)}}

// Field helpers: editable in place in edit mode. *word* becomes an italic accent word.
const rich=v=>v.replace(/\[(.+?)\]\((.+?)\)/g,(m,t,u)=>`<a href="${safeUrl(u)}"${/^https?:/i.test(u)?' target="_blank" rel="noopener"':''}>${t}</a>`).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/==(.+?)==/g,'<mark>$1</mark>');
const f=(p,tag='span',cls='')=>{let v=esc(get(data,p));if(!edit)v=rich(v);const st=fxs(p);return`<${tag} class="${cls}"${st?` style="${st}"`:''}${edit?` contenteditable="true" data-p="${p}"`:''}>${v}</${tag}>`};
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
 hero:(b,i)=>{const c=P(i,'chip');const btns=(b.buttons||[]).map((x,j)=>{const p=P(i,'buttons.'+j),cl=x.style==='solid'?'':x.style;return edit?`<span class="bedit"><span class="btn ${cl}">${f(p+'.label')}</span><span class="mut">→ ${f(p+'.url')}</span><select data-sp="${p}.style">${['solid','ghost','pill'].map(o=>`<option${o===x.style?' selected':''}>${o}</option>`).join('')}</select>${ctl(P(i,'buttons'),j)}</span>`:x.label?`<a class="btn ${cl}" href="${esc(safeUrl(x.url))}">${esc(x.label)}</a>`:''}).join('');
  return`<div class="hero-in">${b.chipOn!=='off'?`<div class="chip">${im(c+'.image','av',b.chip.name)}<span>${f(c+'.name')}</span><small>${f(c+'.status')}</small><small>${f(c+'.handle')}</small></div>`:''}${F(i,'eyebrow','p','eye')}${f(P(i,'title'),'h1')}${F(i,'text','p','lead')}<div class="btns">${btns}${edit?add(P(i,'buttons')):''}</div></div>`},
 text:(b,i)=>`<div class="${b.layout==='split'?'split':''}" data-r="${b.ratio}" data-tc="${b.tcols}"><div class="hd rv">${F(i,'eyebrow','p','eye')}${F(i,'title','h2')}</div>${F(i,'text','p','body rv')}</div>`,
 marquee:(b,i)=>{const n=b.items.filter(Boolean),sp=b.speed==='off'?0:({slow:70,fast:18}[b.speed]||+data.design.mqs||40);return`${F(i,'label','p','eye mid')}${edit?`<div class="tkedit">${b.items.map((x,j)=>`<span class="tki">${f(P(i,'items.'+j))}${ctl(P(i,'items'),j)}</span>`).join('')}${add(P(i,'items'))}</div>`:`<div class="mq"><div class="mt" style="${b.speed==='off'?'animation:none':`animation-duration:${sp}s;animation-direction:${b.dir==='right'?'reverse':'normal'}`}">${[...n,...n].map(t=>`<span>${esc(t)}</span>`).join('')}</div></div>`}`},
 stats:(b,i)=>`<div class="stats" style="${/^\d$/.test(b.cols)?`grid-template-columns:repeat(${b.cols},1fr)`:''}">${b.items.map((x,j)=>`<div class="stat rv">${f(P(i,`items.${j}.value`),'b')}${f(P(i,`items.${j}.label`),'span','mut')}${ctl(P(i,'items'),j)}</div>`).join('')}</div>${add(P(i,'items'))}`,
 cards:(b,i)=>{const car=b.layout==='carousel'&&!edit;return`<div class="chead">${HD(b,i)}${car?`<div class="acts"><button class="pill" data-c="all">${esc(data.site.ui.all)} ${b.items.length}</button><button data-c="prev" aria-label="Previous">←</button><button data-c="next" aria-label="Next">→</button></div>`:''}</div><div class="grid ${car?'car':''}" style="--cols:${b.cols}">${b.items.map((x,j)=>cardH(b,i,x,j)).join('')}</div>${add(P(i,'items'))}`},
 list:(b,i)=>`${HD(b,i)}<div class="rows">${b.items.map((x,j)=>{const p=P(i,'items.'+j);return`<div class="rowi rv"><div>${f(p+'.title','h3')}${f(p+'.sub','p','role')}</div>${f(p+'.text','p','mut')}${edit||x.badge?f(p+'.badge','span','badge'):''}${ctl(P(i,'items'),j)}</div>`}).join('')}</div>${add(P(i,'items'))}`,
 feature:(b,i)=>`<article class="card big rv"><p class="eye dot">${f(P(i,'label'))}</p>${f(P(i,'title'),'h2')}${f(P(i,'sub'),'p','role')}${f(P(i,'text'),'p','mut')}${edit||b.stat?`<div class="foot">${f(P(i,'stat'),'b')}${f(P(i,'statLabel'),'span','mut')}</div>`:''}${edit?`<p class="mut">Link: ${f(P(i,'link'))}</p>`:b.link?`<a class="go" href="${esc(safeUrl(b.link))}" target="_blank" rel="noopener">${esc(data.site.ui.open)} ↗</a>`:''}</article>`,
 gallery:(b,i)=>`<div class="split" data-r="${b.ratio}">${HD(b,i)}<div class="panel"><div class="gal" style="--cols:${b.cols}">${b.items.map((x,j)=>`<figure class="tile rv">${im(P(i,`items.${j}.image`),'',x.caption)}${edit||x.caption?f(P(i,`items.${j}.caption`),'figcaption','mut'):''}${ctl(P(i,'items'),j)}</figure>`).join('')}</div>${add(P(i,'items'))}</div></div>${F(i,'note','p','note')}`,
 contact:(b,i)=>{const rows=b.rows.map((x,j)=>{const p=P(i,'rows.'+j);return edit?`<div class="crow">${f(p+'.label','span','mut')}${f(p+'.value')}<span class="mut">→ ${f(p+'.url')}</span>${ctl(P(i,'rows'),j)}</div>`:`<a class="crow" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener"><span class="mut">${esc(x.label)}</span><b>${esc(x.value)} ↗</b></a>`}).join(''),fl=k=>f(P(i,'fl.'+k));
  const form=b.form!=='off'?`<div class="form"><div class="fld"><span>${fl('name')}</span><input name="n" placeholder="${esc(data.site.ui.phName)}"></div><div class="fld"><span>${fl('need')} <small class="mut">${fl('hint')}</small></span>${edit?`<div class="tkedit">${b.options.map((o,j)=>`<span class="tki">${f(P(i,'options.'+j))}${ctl(P(i,'options'),j)}</span>`).join('')}${add(P(i,'options'))}</div>`:`<div class="chips">${b.options.filter(Boolean).map(o=>`<button type="button" data-chip>${esc(o)}</button>`).join('')}</div>`}</div><div class="fld"><span>${fl('msg')}</span><textarea name="m" rows="4" placeholder="${esc(data.site.ui.phMsg)}"></textarea></div>${edit?`<div class="btn">${fl('send')}</div>`:`<button type="button" class="btn" data-send="${i}">${esc(b.fl.send)}</button>`}</div>`:'';
  return`<div class="split" data-r="${b.ratio}"><div>${HD(b,i)}<div class="crows">${rows}</div>${add(P(i,'rows'))}${edit?`<p class="mut">Requests go to: ${f(P(i,'email'))}</p><p class="mut">Form options:</p><div class="tkedit">${b.options.map((x,j)=>`<span class="tki">${f(P(i,'options.'+j))}${ctl(P(i,'options'),j)}</span>`).join('')}${add(P(i,'options'))}</div>`:''}</div>${form}</div>`},
 image:(b,i)=>`<figure class="shot rv" style="--ar:${b.ratio==='auto'?'auto':b.ratio.replace(':','/')};--fit:${b.fit}">${im(P(i,'image'),'bigimg',b.caption)}${F(i,'caption','figcaption','mut')}</figure>`,
 buttons:(b,i)=>`<div class="btns">${b.items.map((x,j)=>{const p=P(i,'items.'+j),c=x.style==='solid'?'':x.style;return edit?`<span class="bedit"><span class="btn ${c}">${f(p+'.label')}</span><span class="mut">→ ${f(p+'.url')}</span><select data-sp="${p}.style">${['solid','ghost','pill'].map(o=>`<option${o===x.style?' selected':''}>${o}</option>`).join('')}</select>${ctl(P(i,'items'),j)}</span>`:`<a class="btn ${c}" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.label)}</a>`}).join('')}${add(P(i,'items'))}</div>`,
 spacer:(b,i)=>`<div class="spc" style="height:${Math.max(0,+b.height||0)}px">${edit?`<span class="mut">Spacer, height in px: ${f(P(i,'height'))}</span>`:''}</div>`,
 notice:(b,i)=>`<p class="note">${f(P(i,'text'))}</p>`,
 embed:(b,i)=>{const ar={'16:9':'16/9','4:3':'4/3','1:1':'1/1','21:9':'21/9',tall:'3/4'}[b.ratio]||'16/9',u=embedUrl(b.src),code=b.mode==='code';
  const fr=code?(b.code?`<iframe class="emb" style="aspect-ratio:${ar}" sandbox="allow-scripts allow-popups" srcdoc="${esc(b.code)}" loading="lazy" title="Embedded content"></iframe>`:''):(u?`<iframe class="emb" style="aspect-ratio:${ar}" src="${esc(u)}" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" title="Embedded content"></iframe>`:'');
  return`${HD(b,i)}${fr||(edit?'<p class="mut">Nothing to show yet. Add a URL or code below.</p>':'')}${edit?`<p class="mut">${code?'HTML code':'Embed URL (https, YouTube, Vimeo, Spotify, Google Maps...)'}:</p>${f(P(i,code?'code':'src'),'code','src')}`:''}${F(i,'note','p','note')}`},
 profile:(b,i)=>`<article class="pcard rv"><div class="pbanner${b.bannerAnim&&b.bannerAnim!=='none'?' bni-'+b.bannerAnim:''}" style="--bns:${Math.max(4,+b.bannerSpd||20)}s;--bnd:${(+b.bannerDim||0)/100};--bdir:${esc(b.bannerDir||'alternate')};--bi:${(1+(+b.bannerInt||3)*.05).toFixed(2)};--bp:${((+b.bannerInt||3)*.8).toFixed(1)}%">${b.banner?`<span class="pbn" style="background-image:url('${esc(safeImg(b.banner))}');background-position:${esc(b.bannerPos||'center')};background-size:${esc(b.bannerSize||'cover')}"></span>`:''}</div><div class="pbody">${im(P(i,'avatar'),'pav',b.name)}<div class="pnames">${f(P(i,'name'),'h3')}${f(P(i,'handle'),'p','mut')}</div></div>${F(i,'bio','p','mut')}${badgesRow(b,i)}<div class="pmeta">${b.loc?`<span class="pm">${f(P(i,'loc'))}</span>`:''}${b.tz?`<span class="pm" data-tz="${esc(b.tz)}" title="Local time">—</span>`:''}${b.status?`<span class="pm st"><i></i>${f(P(i,'status'))}</span>`:''}</div>${pstats(b,i)}</article>`,
 discord:(b,i)=>{const id=String(b.userId||'').replace(/\D/g,''),lk=id?`https://discord.com/users/${id}`:'';return`${HD(b,i)}<div class="dcwrap rv" data-dc="${id}" data-act="${b.showActivity==='off'?0:1}"><a class="dcard"${lk?` href="${esc(lk)}" target="_blank" rel="noopener"`:''}><span class="davw"><img class="dav" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"><i class="ddot offline"></i></span><span class="dcopy"><span class="dtop"><b class="dname">…</b><small class="dst">checking status…</small></span><small class="dhandle"></small><small class="dcustom"></small></span><b class="darrow">↗</b></a><div class="dact"><i></i><span class="mut">…</span></div></div>${F(i,'note','p','note')}${edit?`<p class="mut">Discord user ID: ${f(P(i,'userId'))}</p>`:''}`},
 roblox:(b,i)=>{const id=String(b.userId||'').replace(/\D/g,''),lk=b.link||(id?`https://www.roblox.com/users/${id}/profile`:'');return`<article class="pcard rv rbx"><div class="pbanner rb"><span class="rbxmark">▶</span></div><div class="pbody">${im(P(i,'avatar'),'pav',b.name)}<div class="pnames">${f(P(i,'name'),'h3')}${f(P(i,'handle'),'p','mut')}</div></div>${F(i,'text','p','mut')}${pstats(b,i)}${lk?`<a class="go" href="${esc(safeUrl(lk))}" target="_blank" rel="noopener">Roblox profile ↗</a>`:''}${edit?`<p class="mut">Roblox user ID: ${f(P(i,'userId'))}</p>`:''}</article>`},
 rates:(b,i)=>`${HD(b,i)}<div class="rrows">${b.items.map((x,j)=>{const p=P(i,'items.'+j);return`<div class="rrow rv"><div class="rhead"><h3>${f(p+'.title')}</h3><span class="rprice">${f(p+'.price')}</span></div>${edit||x.priceNote?`<span class="rpnote mut">${f(p+'.priceNote')}</span>`:''}${edit||x.text?f(p+'.text','p','mut'):''}${ctl(P(i,'items'),j)}</div>`}).join('')}${add(P(i,'items'))}</div>`,
 faq:(b,i)=>`${HD(b,i)}<div class="faqs">${b.items.map((x,j)=>`<details class="faq rv"${b.open==='all'||(b.open==='first'&&j===0)?' open':''}><summary>${f(P(i,`items.${j}.q`))}</summary><div class="fa">${f(P(i,`items.${j}.a`),'p','mut')}</div></details>`).join('')}${add(P(i,'items'))}</div>`,
 testimonials:(b,i)=>`${HD(b,i)}<div class="tgrid" style="--cols:${b.cols||'2'}">${b.items.map((x,j)=>{const p=P(i,'items.'+j),n=Math.max(0,Math.min(5,Math.round(+x.stars)||0));return`<figure class="tcard rv"><div class="tstars" aria-label="${n} of 5 stars">${'<span>★</span>'.repeat(n)}${'<span class="off">★</span>'.repeat(5-n)}</div>${f(p+'.quote','blockquote')}${x.avatar||edit?`<figcaption><span class="tavw">${im(p+'.avatar','tav',x.name)}</span><span><b>${f(p+'.name')}</b><small class="mut">${f(p+'.role')}</small></span></figcaption>`:`<figcaption><span><b>${f(p+'.name')}</b><small class="mut">${f(p+'.role')}</small></span></figcaption>`}${ctl(P(i,'items'),j)}</figure>`}).join('')}${add(P(i,'items'))}</div>`,
 cta:(b,i)=>`<article class="ctacard rv">${F(i,'eyebrow','p','eye')}${f(P(i,'title'),'h2')}${F(i,'text','p','sub2')}<div class="btns">${btnList(b,i,'buttons')}${add(P(i,'buttons'))}</div></article>`,
 badges:(b,i)=>`${HD(b,i)}<div class="brow">${b.items.map((x,j)=>`<span class="bpillw"><span class="bpill">${x.icon?`<i>${esc(x.icon)}</i>`:''}${f(P(i,`items.${j}.label`))}</span>${ctl(P(i,'items'),j)}</span>`).join('')}${add(P(i,'items'))}</div>`,
 showcase:(b,i)=>{const tl=b.tilt||'mix',rot=j=>tl==='none'?0:tl==='left'?(j%2?-4:4):tl==='right'?(j%2?5:-5):(j%3===0?-5:j%3===1?4:j%2?-3:3);return`${HD(b,i)}<div class="scrow">${b.items.map((x,j)=>`<a class="scard rv"${x.link?` href="${esc(safeUrl(x.link))}" target="_blank" rel="noopener"`:''} style="--rot:${rot(j)}deg">${im(P(i,`items.${j}.image`),'simg',x.title)}<b>${f(P(i,`items.${j}.title`))}</b>${edit||x.text?f(P(i,`items.${j}.text`),'span','mut'):''}</a>`).join('')}${add(P(i,'items'))}</div>`}};
const badgesRow=(b,i)=>`<div class="pbadges">${split(b.badges).map((x,j)=>edit?`<span class="tki">${f(P(i,'badges.'+j))}${ctl(P(i,'badges'),j)}</span>`:`<span class="pbadge">${esc(x)}</span>`).join('')}${edit?add(P(i,'badges')):''}</div>`;
const bs=(i,k,l,vs)=>`<label>${l}<select data-bo="${k}" data-i="${i}">${vs.map(x=>`<option${String(data.blocks[i][k])===x?' selected':''}>${x}</option>`).join('')}</select></label>`;
// Shared button-list editor/ renderer (hero, buttons and CTA sections).
const btnList=(b,i,key)=>b[key].map((x,j)=>{const p=P(i,key+'.'+j),cl=x.style==='solid'?'':x.style;return edit?`<span class="bedit"><span class="btn ${cl}">${f(p+'.label')}</span><span class="mut">→ ${f(p+'.url')}</span><select data-sp="${p}.style">${['solid','ghost','pill'].map(o=>`<option${o===x.style?' selected':''}>${o}</option>`).join('')}</select>${ctl(P(i,key),j)}</span>`:`<a class="btn ${cl}" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.label)}</a>`}).join('');
// Shared profile stats row (profile and Roblox sections).
const pstats=(b,i)=>`<div class="pstats">${b.stats.map((x,j)=>`<div class="pstat">${x.icon?`<i class="pic">${esc(x.icon)}</i>`:''}<span class="pv">${f(P(i,`stats.${j}.value`),'b')}</span><span class="pl">${f(P(i,`stats.${j}.label`),'span','mut')}</span>${ctl(P(i,'stats'),j)}</div>`).join('')}${add(P(i,'stats'))}</div>`;
const strip=(b,i)=>`<div class="strip"><b>${T[b.type]?.n||b.type}</b>${Object.entries(OPT[b.type]||{}).map(([k,v])=>`<select data-bo="${k}" data-i="${i}" aria-label="${k}" title="${k}">${v.map(x=>`<option${String(b[k])===x?' selected':''}>${x}</option>`).join('')}</select>`).join('')}${b.type==='hero'?'':`<input data-nl="${i}" value="${esc(b.nav)}" placeholder="Nav label" aria-label="Nav label">`}${[['style','Style'],['adm','Admin'],['up','↑'],['down','↓'],['dup','⧉'],['hide',b.hidden?'Show':'Hide'],['del','✕']].map(([k,t])=>`<button data-bk="${k}" data-i="${i}">${t}</button>`).join('')}</div>${sp===i?`<div class="spanel">${bs(i,'align','Align',['left','center'])}${bs(i,'size','Title size',['s','m','l','xl'])}${bs(i,'pad','Spacing',['none','s','m','l'])}${bs(i,'width','Width',['normal','narrow','full'])}${bs(i,'bgs','Background',['none','panel','accent','custom'])}<label>Colour<input type="color" data-bo="bgc" data-i="${i}" value="${b.bgc||'#222222'}"></label>${bs(i,'div','Top divider',['off','on'])}${bs(i,'anim','Animation',['default','rise','fade','left','zoom','blur','none'])}<label>Delay (ms)<input type="number" data-bo="delay" data-i="${i}" value="${+b.delay||0}" min="0" step="100"></label><label>Text colour<input type="color" data-bo="tc" data-i="${i}" value="${b.tc||'#cccccc'}"></label><label>Font<input type="text" list="fl" data-bo="sf" data-i="${i}" value="${esc(b.sf||'')}" placeholder="default"></label>${bs(i,'hide','Hide on',['never','mobile','desktop'])}<label>Anchor id<input type="text" data-bid="${i}" value="${esc(b.id)}"></label></div>`:''}`;

const loaded=new Set();
const fam=(v,c)=>{const n=v==='custom'?(c||'').trim():FONTS[v]?'':v;if(!n)return FONTS[v]||FONTS.system;if(!loaded.has(n)){loaded.add(n);const l=document.createElement('link'),q=encodeURIComponent(n).replace(/%20/g,'+');l.rel='stylesheet';l.href=`https://fonts.googleapis.com/css2?family=${q}:wght@400;500;600;700&display=swap`;l.onerror=()=>{l.href=`https://fonts.googleapis.com/css2?family=${q}&display=swap`};document.head.appendChild(l)}return`"${n}",system-ui,sans-serif`};
const applyDesign=()=>{const d=data.design,r=document.documentElement.style,D=document.documentElement.dataset,so=(k,v)=>v===''||v==null?r.removeProperty(k):r.setProperty(k,v);
  so('--accent',data.accent);so('--radius',d.radius+'px');so('--glow',d.glow/100);so('--fs',d.size);so('--hs',d.hscale/100);so('--hw',d.hweight);so('--sp',d.space/100);so('--gp',d.gap);so('--dur',d.dur+'ms');so('--st',d.stagger+'ms');
  so('--bf',fam(d.font,d.fontC));so('--hf',fam(d.hfont==='system'&&data.custom?.hfont?data.custom.hfont:d.hfont,d.hfontC));so('--ef',fam(d.efont,d.efontC));so('--bg',d.bg);so('--fg',d.fg);so('--mut',d.fg?'color-mix(in srgb,var(--fg) 62%,transparent)':'');
  so('--bgimg',safeImg(d.bgImg)?`url("${d.bgImg.replace(/"/g,'%22')}")`:'none');so('--dim',d.dim/100);so('--bgpos',d.bgPos||'center');so('--bgsz',d.bgSize||'cover');so('--bi',(1+(+d.bgInt||3)*.05).toFixed(2));so('--bp',((+d.bgInt||3)*.8).toFixed(1)+'%');
  const BGA={zoom:'bgzoom',pan:'bgpan',fade:'bgfade',drift:'bgdrift'},bx=$('#bgfx');if(bx)bx.style.animation=d.bgAnim&&BGA[d.bgAnim]&&safeImg(d.bgImg)?`${BGA[d.bgAnim]} ${Math.max(6,+d.bgAnimSpd||30)}s ease-in-out ${d.bgAnimDir||'alternate'} infinite`:'none';
  document.documentElement.dataset.ambient=d.ambient?'on':'off';
  Object.assign(D,{card:d.card,nav:d.nav,head:d.head,width:d.width,hover:d.hover,anim:d.anim?'on':'off',spot:d.spot?'on':'off',cursor:d.cursor?'on':'off',smooth:d.smooth?'on':'off',prog:d.progress?'on':'off',sticky:d.sticky?'on':'off',theme:LS.theme||data.theme||'auto'});
  let u=$('#uc');if(!u){u=document.createElement('style');u.id='uc';document.head.appendChild(u)}u.textContent=d.css||data.custom?.css||'';
  const se=data.seo||{},s=data.site,meta=(sel,attr,val)=>{let m=document.head.querySelector(sel);if(!m&&val){m=document.createElement('meta');m.setAttribute(attr.name,attr.val);document.head.appendChild(m)}if(m)m.content=val||''};
  document.title=se.title||s.title||s.brand||'Portfolio';
  meta('meta[name=description]',{name:'name',val:'description'},se.desc||s.desc||'');
  meta('meta[property="og:title"]',{name:'property',val:'og:title'},se.title||s.title||s.brand||'');
  meta('meta[property="og:description"]',{name:'property',val:'og:description'},se.desc||s.desc||'');
  meta('meta[property="og:image"]',{name:'property',val:'og:image'},se.image||'');
  meta('meta[name="theme-color"]',{name:'name',val:'theme-color'},se.color||'');
  const fav=se.favicon||s.favicon;if(fav){let ic=$('link[rel=icon]');if(!ic){ic=document.createElement('link');ic.rel='icon';document.head.appendChild(ic)}ic.href=/^(https?:|data:)/i.test(fav)?fav:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${esc(fav)}</text></svg>`)}};
// Visitor-only head HTML (analytics, widgets). Never runs in edit mode or the editor preview.
let headInj=[],headKey=null;
function applyHead(){const c=data.custom&&data.custom.head,pl2=data.integ&&data.integ.plausible,mode=edit?'edit':location.hash==='#preview'?'preview':'visitor',k=mode+'|'+(pl2||'')+'|'+(c||'');if(k===headKey)return;headKey=k;headInj.forEach(n=>n.remove());headInj=[];
 const pl=data.integ&&data.integ.plausible;
 if(pl2&&!edit&&location.hash!=='#preview'){const s=document.createElement('script');s.defer=true;s.dataset.domain=pl2;s.src='https://plausible.io/js/script.js';document.head.append(s);headInj.push(s)}
 if(!c||edit||location.hash==='#preview')return;
 const box=document.createElement('div');box.innerHTML=c;
 box.querySelectorAll('script').forEach(sc=>{const n=document.createElement('script');[...sc.attributes].forEach(a=>n.setAttribute(a.name,a.value));n.textContent=sc.textContent;document.head.append(n);headInj.push(n);sc.remove()});
 [...box.children].forEach(n=>{document.head.append(n);headInj.push(n)})}
// Old admin panel (v5) block styles still render: style overrides the section's look.
const bstyle=b=>{const s=b.style;if(!s)return'';let c='';
 if(s.pt!=null&&s.pt!=='')c+=`padding-top:${s.pt}px;`;if(s.pb!=null&&s.pb!=='')c+=`padding-bottom:${s.pb}px;`;
 if(s.bg)c+=`background:${s.bg};`;if(s.color)c+=`color:${s.color};`;
 if(s.font)c+=`font-family:${fam(s.font,'')};`;if(s.align)c+=`text-align:${s.align};`;
 return c};
function render(){
  const s=data.site,cta=s.cta,dz=data.design;
  document.body.classList.toggle('editing',edit);applyDesign();
  $('#nav').innerHTML=`${edit?f('site.brand','b','logo'):`<b class="logo">${esc(s.brand)}</b>`}<div class="nl">${data.blocks.map((b,i)=>[b,i]).filter(([b])=>b.nav&&b.type!=='hero'&&(edit||!b.hidden)).map(([b,i])=>edit?`<span class="navl">${f(P(i,'nav'))}</span>`:`<a href="#${b.id}">${esc(b.nav)}</a>`).join('')}</div>${edit?`<span class="pill">${f('site.cta.label')}</span>`:cta.label?`<a class="pill" href="${esc(safeUrl(cta.url))}">${esc(cta.label)} ↗</a>`:''}${dz.themeBtn?'<button id="tt" aria-label="Toggle light or dark theme">◐</button>':''}`;
  $('#app').innerHTML=data.blocks.map((b,i)=>b.hidden&&!edit?'':`<section id="${esc(b.id)}" class="blk t-${b.type}${b.hidden?' off':''}${b.style?.cls?' '+esc(b.style.cls):''}${b.bgi?' hasbgi':''}${b.bgi&&b.bgiAnim&&b.bgiAnim!=='none'?' bgi-'+b.bgiAnim:''}" data-al="${b.style?.align||b.align}" data-sz="${b.size}" data-pd="${b.pad}" data-w="${b.width}" data-bg="${b.bgs}" data-dv="${b.div}" data-hide="${b.hide||'never'}" data-bgip="${esc(b.bgiPos||'center')}" data-fx="${b.style?.an||(b.anim==='default'?dz.reveal:b.anim)}" style="--delay:${+b.delay+(+b.style?.adl||0)}ms${b.style?.ad?`;--dur:${b.style.ad}s`:''};--bgc:${esc(b.bgc||'transparent')}${b.tc?`;--tc:${esc(b.tc)}`:''}${b.sf?`;--sf:${esc(fam(b.sf,''))}`:''};--bgi:${b.bgi?`url('${String(b.bgi).replace(/[\\"']/g,'')}')`:'none'};--bgis:${Math.max(4,+b.bgiSpd||16)}s;--bgid:${(+b.bgiDim||0)/100};--bgisz:${esc(b.bgiSize||'cover')};--bi:${(1+(+b.bgiInt||3)*.05).toFixed(2)};--bp:${((+b.bgiInt||3)*.8).toFixed(1)}%;${bstyle(b)}">${edit?strip(b,i):''}${b.style?.css?`<style>${b.style.css.replace(/&/g,'#'+esc(b.id))}</style>`:''}${R[b.type]?R[b.type](b,i):'<p class="mut">Unsupported section type</p>'}</section>`).join('')+(edit||s.footer?`<footer>${f('site.footer','p','note')}</footer>`:'');
  $$('.rv:not(.in)').forEach(el=>io.observe(el));bar();
  if(window.ADM)ADM.sync();
  applyHead();
  hydratePresence();tickClocks();
}
function bar(){
  const b=$('#bar'),d=data.design;b.hidden=!edit;
  if(!edit){menu=dr=false;$$('body>#mn,body>#dr').forEach(n=>n.remove());return}
  const IC={admin:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',menu:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',undo:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',redo:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>',design:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.13-.29-.29-.43-.65-.43-1.12a1.64 1.64 0 0 1 1.66-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6 17.46 2 12 2z"/><circle cx="6.5" cy="11.5" r=".5" fill="currentColor"/><circle cx="9.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="14.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/></svg>',export:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',import:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>',publish:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>',exit:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'};
  const tb=(t,l,c='')=>`<button class="${c}" data-t="${t}" title="${l}">${IC[t]||''}<span>${l}</span></button>`,o=(v,c)=>`<option${String(v)===String(c)?' selected':''}>${v}</option>`,
   sel=(k,l,vs)=>`<label>${l}<select data-dz="${k}">${vs.map(v=>o(v,d[k])).join('')}</select></label>`,
   rng=(k,l,mn,mx,stp=1)=>`<label>${l}<span class="mut">${d[k]}</span><input type="range" data-dzr="${k}" min="${mn}" max="${mx}" step="${stp}" value="${d[k]}"></label>`,
   chk=(k,l)=>`<label>${l}<input type="checkbox" data-dz="${k}"${d[k]?' checked':''}></label>`,
   txt=(p,l)=>`<label>${l}<input type="text" data-sp="${p}" value="${esc(get(data,p))}"></label>`,
   col=(k,l)=>`<label>${l}<span><input type="color" data-dz="${k}" value="${d[k]||'#808080'}"><button data-rs="${k}">Reset</button></span></label>`,
   fonts=['system','serif','mono','rounded',...GF,'custom'],fs=(k,l)=>sel(k,l,fonts)+(d[k]==='custom'?`<label>${l} (Google Font name)<input type="text" data-dz="${k}C" value="${esc(d[k+'C'])}"></label>`:''),
   g=(id,t,h)=>`<details data-g="${id}"${dopen[id]?' open':''}><summary>${t}</summary>${h}</details>`;
  b.innerHTML=`<div class="row"><b>Editor</b><span id="st" role="status"></span><span class="sp"></span>${tb('admin','⚙ Admin','pri')}${tb('menu','+ Add section','pri')}${tb('undo','↶ Undo')}${tb('redo','↷ Redo')}${tb('design','Design')}${tb('export','Export')}${tb('import','Import')}${tb('publish','Publish','pri')}${tb('exit','Exit')}</div>
  <div id="mn" class="${menu?'open':''}"><div class="mnbox"><header><div><b>Add section</b><span>Choose a section to add to your page</span></div><button data-t="menu" aria-label="Close">✕</button></header><input class="mnsrch" type="search" placeholder="Search sections…" aria-label="Search sections"><div class="mncats">${MN_CATS.map((c,j)=>`<button data-mcat="${c}"${j?'':' class="on"'}>${c}</button>`).join('')}</div><div class="mngrid">${Object.entries(T).map(([k,v])=>{const cat=MN_CAT[k]||'Content',has=data.blocks.some(b=>b.type===k);return`<button data-add="${k}" data-cat="${cat}"><span class="wf">${(MN_WF[k]||MN_WF.text).map(w=>`<i class="w-${w}"></i>`).join('')}</span><b>${v.n}${has?'<i class="chk">✓</i>':''}</b><span class="xs">${v.x}</span></button>`}).join('')}</div></div></div>
  <aside id="dr" class="${dr?'open':''}"><header><b>Design</b>${tb('design','✕')}</header>
  ${g('c','Colours',`<div class="sw">${SW.map(c=>`<button data-sw="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<input type="color" id="acc" value="${esc(data.accent)}"></div><label>Default theme<select id="thm">${['auto','light','dark'].map(v=>o(v,data.theme)).join('')}</select></label>${col('bg','Background')}${col('fg','Text')}<label>Page image URL<input type="text" data-dz="bgImg" value="${esc(d.bgImg)}"></label>${rng('dim','Image dimming',0,90)}${sel('bgAnim','Image animation',['none','zoom','pan','fade','drift'])}${rng('bgAnimSpd','Animation length (s)',8,90,1)}${sel('bgAnimDir','Direction',['alternate','normal','reverse'])}${sel('bgPos','Image position',['center','top','bottom','left','right'])}${sel('bgSize','Image size',['cover','contain','auto'])}${rng('bgInt','Animation intensity',1,5,1)}${rng('glow','Background glow',0,100)}${chk('ambient','Ambient glow blobs')}`)}
  ${g('t','Typography',`${fs('font','Body font')}${fs('hfont','Heading font')}${fs('efont','Accent italic font')}${rng('size','Base size (px)',12,22)}${rng('hscale','Heading size %',50,150,5)}${rng('hweight','Heading weight',300,900,100)}${sel('head','Heading tracking',['tight','normal'])}`)}
  ${g('l','Layout',`${sel('width','Page width',['narrow','normal','wide'])}${sel('card','Card style',['glass','solid','outline'])}${rng('radius','Corner radius',0,40)}${rng('space','Section spacing %',30,220,10)}${rng('gap','Card gap (px)',0,48)}`)}
  ${g('a','Animation',`${chk('anim','Scroll reveal')}${sel('reveal','Reveal style',['rise','fade','left','zoom','blur','none'])}${rng('dur','Duration (ms)',100,2000,100)}${rng('stagger','Stagger (ms)',0,400,20)}${sel('hover','Card hover',['lift','glow','none'])}${chk('spot','Card spotlight')}${chk('cursor','Cursor glow')}${chk('smooth','Smooth scrolling')}${chk('progress','Progress bar')}`)}
  ${g('ld','Loader',`${chk('loader','Show loader')}${sel('loaderStyle','Style',['orb','bar'])}${rng('loaderSpd','Speed (×)',.5,2.5,.1)}<p class="hint">Shown to visitors while the page loads. Turned off automatically for people who prefer reduced motion.</p>`)}
  ${g('n','Navigation',`${sel('nav','Style',['pill','bar'])}${chk('sticky','Sticky')}${chk('themeBtn','Theme button')}${txt('site.cta.label','Button label')}${txt('site.cta.url','Button link')}`)}
  ${g('s','Site and SEO',`${txt('site.title','Page title')}${txt('site.desc','Description')}${txt('site.favicon','Favicon emoji')}`)}
  ${g('x','Small texts',`${txt('site.ui.all','"view all"')}${txt('site.ui.less','"show less"')}${txt('site.ui.open','Card link text')}${txt('site.ui.phName','Form name hint')}${txt('site.ui.phMsg','Form message hint')}`)}
  ${g('u','Custom CSS',`<textarea data-dz="css" rows="8" placeholder="/* your CSS */">${esc(d.css)}</textarea>`)}
  ${g('m','More',`<div class="srow">${tb('repo','Set repository')}${tb('reset','Discard draft')}</div><p class="hint">Click any text to edit it. *word* makes an italic accent word. Every section has its own toolbar and a Style panel. Ctrl+S saves, Ctrl+Z / Ctrl+Y undo and redo outside text fields, Esc closes panels.</p>`)}</aside>`;
  status();
  // the toolbar has a backdrop-filter, which becomes the containing block for fixed children —
  // move the modal and the drawer to <body> so they cover the whole viewport
  $$('body>#mn,body>#dr').forEach(n=>n.remove());
  ['mn','dr'].forEach(id=>{const n=$('#'+id);if(n)document.body.appendChild(n)});
}
const status=m=>{const s=$('#st');if(s){const same=JSON.stringify(data)===pubStr;s.className=same?'ok':'dirty';s.textContent=m==='Editing...'?'Editing...':same?'Published':'Unpublished changes'}if(m&&m!=='Editing...')toast(m)};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t.k);t.k=setTimeout(()=>t.classList.remove('show'),3500)}
// "Add section" library: categories, search and mini wireframes.
const MN_CATS=['All','Essential','Content','Growth','Integrations'];
const MN_CAT={hero:'Essential',text:'Essential',buttons:'Essential',notice:'Essential',spacer:'Essential',profile:'Essential',cards:'Content',list:'Content',feature:'Content',gallery:'Content',image:'Content',embed:'Content',showcase:'Content',badges:'Content',marquee:'Content',stats:'Growth',rates:'Growth',faq:'Growth',testimonials:'Growth',cta:'Growth',discord:'Integrations',roblox:'Integrations',contact:'Integrations'};
const MN_WF={hero:['av','tt','ll','ll','bb'],text:['tt','ll','ll'],profile:['bn','av','tt','pp'],marquee:['mq'],stats:['c3','c3','c3'],cards:['c3b','c3b','c3b'],list:['rw','rw','rw'],feature:['bx'],gallery:['g4'],contact:['rw','fm'],notice:['ll'],embed:['vd'],image:['im'],buttons:['bb','bb'],spacer:['sp'],discord:['av','tt','ll'],roblox:['bn','av','pp'],rates:['rw','rw','rw'],faq:['rw','rw','rw'],testimonials:['bx','bx'],cta:['bx','bb'],badges:['pp','pp','pp'],showcase:['t1','t2','t3']};
function mnFilter(){const q=($('.mnsrch')?.value||'').trim().toLowerCase(),cat=$('#mn .mncats .on')?.dataset.mcat||'All';$$('#mn .mngrid [data-add]').forEach(b=>{b.style.display=(cat==='All'||b.dataset.cat===cat)&&(!q||b.textContent.toLowerCase().includes(q))?'':'none'})}
// Discord presence (Lanyard REST API, CORS-open; the user must join the Lanyard server).
let dcTimer=null;const dcCache={};
const DC_LBL={online:'online',idle:'idle',dnd:'do not disturb',offline:'offline'};
function fmtElapsed(ms){ms=Math.max(0,ms);const s=Math.floor(ms/1e3),m=Math.floor(s/60),h=Math.floor(m/60);return h?`${h}h ${m%60}m`:m?`${m}m ${s%60}s`:`${s}s`}
function fillDiscord(el,d){const u=d.discord_user||{},st=d.discord_status||'offline',q=s=>el.querySelector(s);
 el.classList.remove('dcfail');el.classList.add('dcok');
 q('.dname').textContent=u.global_name||u.display_name||u.username||'Discord user';
 q('.dhandle').textContent=u.username?'@'+u.username:'';
 q('.dst').textContent=DC_LBL[st]||st;q('.ddot').className='ddot '+st;
 if(u.avatar)q('.dav').src=`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${String(u.avatar).startsWith('a_')?'gif':'webp'}?size=128`;
 const cs=(d.activities||[]).find(a=>a.type===4);q('.dcustom').textContent=cs&&cs.state||'';
 const a=q('.dact');
 if(!a)return;
 const ga=(d.activities||[]).find(x=>x.type!==4);
 if(el.dataset.act==='0'){a.style.display='none';return}
 a.style.display='';
 if(ga){const t=ga.timestamps&&ga.timestamps.start?`<small>${fmtElapsed(Date.now()-ga.timestamps.start)} elapsed</small>`:'';
  a.innerHTML=`<i class="on"></i><span><b>${esc(ga.name)}</b>${ga.details?`<small>${esc(ga.details)}</small>`:''}${ga.state?`<small>${esc(ga.state)}</small>`:''}${t}</span>`}
 else a.innerHTML=`<i></i><span class="mut">Not playing anything right now</span>`}
async function hydratePresence(){const els=$$('[data-dc]');
 if(!els.length){if(dcTimer){clearInterval(dcTimer);dcTimer=null}return}
 // unconfigured sections show a clear hint instead of "checking status…" forever
 els.filter(e=>!e.dataset.dc).forEach(e=>{e.classList.add('dcempty');const q=s=>e.querySelector(s);q('.dst').textContent='not configured';q('.dname').textContent='Discord presence';q('.dhandle').textContent='';q('.dact').innerHTML=`<i></i><span class="mut">Add your Discord user ID in the admin panel to show live presence</span>`});
 const ids=[...new Set(els.map(e=>e.dataset.dc).filter(Boolean))];
 await Promise.all(ids.map(async id=>{let d=dcCache[id],fresh=false;
  if(!d||Date.now()-d._t>25e3){try{const r=await fetch('https://api.lanyard.rest/v1/users/'+id,{cache:'no-store',signal:AbortSignal.timeout?AbortSignal.timeout(7000):undefined});const j=await r.json();if(j&&j.success&&j.data){d={...j.data,_t:Date.now()};dcCache[id]=d;fresh=true}}catch{}}
  els.filter(e=>e.dataset.dc===id).forEach(e=>{if(d){fillDiscord(e,d);const stale=!fresh&&Date.now()-d._t>6e4;e.classList.toggle('dcstale',stale);if(stale){const dst=e.querySelector('.dst');dst.textContent+=' (cached)';dst.title='Last known presence — the service is unreachable, showing the most recent data'}}else{e.classList.add('dcfail');e.querySelector('.dst').textContent='status unavailable';e.querySelector('.dact').innerHTML='<i></i><span class="mut">Presence service unreachable</span>'}})}));
 if(!dcTimer&&!edit)dcTimer=setInterval(()=>{if(!document.hidden)hydratePresence()},3e4)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)hydratePresence()});
// Local-time clocks on profile sections.
function tickClocks(){$$('[data-tz]').forEach(n=>{try{n.textContent=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',timeZone:n.dataset.tz}).format(new Date())}catch{n.textContent=''}})}
setInterval(tickClocks,3e4);
// Customizable webhook message: placeholders + embed, shared by the form and the admin test button.
const wbT=(s,n,o,m)=>String(s||'').replace(/\{name\}/g,n).replace(/\{needs\}/g,o).replace(/\{message\}/g,m).replace(/\{date\}/g,new Date().toLocaleDateString()).replace(/\{time\}/g,new Date().toLocaleTimeString()).replace(/\{page\}/g,location.origin+location.pathname).replace(/\{brand\}/g,data.site?.brand||'');
function webhookBuild(n,o,m){const wm=data.integ.webhookMsg||{},e=wm.embed||{},body={allowed_mentions:{parse:[]}},warns=[];const cl=(s,x)=>String(s||'').slice(0,x);
 const rawC=wbT(wm.content,n,o,m),c=cl(rawC,2000);if(rawC.length>2000)warns.push('content trimmed to Discord\u2019s 2000-character limit');if(c.trim())body.content=c;
 if(e.on){const em={};let budget=6000;const take=(s,x)=>{const r=String(s||''),v=cl(r,Math.min(x,budget));if(r.length>v.length)warns.push('some embed text was trimmed to fit Discord\u2019s limits (6000 characters total)');budget-=v.length;return v};
  const t=take(wbT(e.title,n,o,m),256),f2=take(wbT(e.footer,n,o,m),2048);if(t.trim())em.title=t;if(f2.trim())em.footer={text:f2};
  if(e.color&&/^[0-9a-f]{6}$/i.test(String(e.color).replace('#','')))em.color=parseInt(String(e.color).replace('#',''),16);
  const fl=arr(e.fields).filter(x=>x&&x.value);if(fl.length>25)warns.push((fl.length-25)+' fields dropped (Discord allows 25)');
  const fl2=[];let dropped=0;
  for(const x of fl.slice(0,25)){if(budget<4){dropped++;continue}
   const nm=take(wbT(x.name,n,o,m)||'\u2014',256),vl=take(wbT(x.value,n,o,m),1024);
   if(!vl.trim()){dropped++;budget+=nm.length;continue}
   fl2.push({name:nm,value:vl,inline:x.inline!==false})}
  if(dropped)warns.push(dropped+' field'+(dropped>1?'s':'')+' dropped to fit Discord\u2019s 6000-character embed total');
  if(fl2.length)em.fields=fl2;
  const d2=take(wbT(e.desc,n,o,m),4096);if(d2.trim())em.description=d2;
  if(Object.keys(em).length)body.embeds=[em]}
 if(!body.content&&!body.embeds)body.content=cl(`**New project request**\nName: ${n}\nNeeds: ${o}\n\n${m}`,2000);
 return{body,warns:[...new Set(warns)]}}
function buildWebhookBody(n,o,m){return webhookBuild(n,o,m).body}

// History: debounced snapshots (100 steps), autosaved to LS.
function commit(){clearTimeout(timer);const s=JSON.stringify(data);if(s===hist[pos])return;hist=hist.slice(0,pos+1);hist.push(s);if(hist.length>100)hist.shift();pos=hist.length-1;LS.setItem(KEY,s);status()}
const touch=()=>{status('Editing...');clearTimeout(timer);timer=setTimeout(commit,500)};
const mutate=fn=>{commit();fn();render();commit()};
function jump(d){commit();const n=pos+d;if(n<0||n>=hist.length)return;pos=n;data=JSON.parse(hist[pos]);LS.setItem(KEY,hist[pos]);render()}

function repo(){let s=LS.repo;if(!s){const h=location.hostname,g=location.pathname.split('/')[1];if(h.endsWith('.github.io'))s=h.split('.')[0]+'/'+(g&&!g.includes('.')?g:h)}return(s||'').split('/')}
async function publish(){
  let[o,r]=repo();if(!o||!r){setRepo();[o,r]=repo();if(!o||!r)return}
  let t=SS.token;if(!t){t=prompt('Paste a fine-grained token (this repo only, Contents: read and write). It is kept in this tab only and never saved to the repo.');if(!t)return;SS.token=t}
  commit();
  const h={Authorization:'Bearer '+t,Accept:'application/vnd.github+json'},api=p=>`https://api.github.com/repos/${o}/${r}/contents/${p}`;
  const b64=s=>btoa(unescape(encodeURIComponent(s))),unb64=s=>decodeURIComponent(escape(atob(s)));
  const put=async(path,content,msg,sha)=>{
    let x=await fetch(api(path),{method:'PUT',headers:h,body:JSON.stringify({message:msg,content,sha})});
    if(!x.ok&&x.status===422&&!sha){const g=await fetch(api(path),{headers:h});if(g.ok)return put(path,content,msg,(await g.json()).sha)}
    if(!x.ok)throw new Error((await x.json()).message)};
  try{
    status('Publishing...');
    const g=await fetch(api('content.json'),{headers:h});if(!g.ok&&g.status!==404)throw new Error((await g.json()).message);
    const sha=g.ok?(await g.json()).sha:undefined;
    // 1. uploaded images become files in assets/ and content.json keeps only the path
    const pub2=structuredClone(data),seen=new Map();
    const hsh=async s=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,20)}; // content address: same picture, same name
    const ext=x=>(/^data:image\/png/i.test(x)?'png':/^data:image\/webp/i.test(x)?'webp':'jpg');
    const scan=x=>{if(typeof x==='string'&&/^data:image\/(png|jpeg|webp);base64,/i.test(x)){let p=seen.get(x);if(!p){p=x;seen.set(x,p)}return p}if(x&&typeof x==='object')for(const k in x)x[k]=scan(x[k]);return x};
    scan(pub2);
    for(const[du] of seen){const p=`assets/${await hsh(du)}.${ext(du)}`;seen.set(du,p)}
    const scan2=x=>{if(typeof x==='string'&&seen.has(x))return seen.get(x);if(x&&typeof x==='object')for(const k in x)x[k]=scan2(x[k]);return x};scan2(pub2);
    for(const[du,p] of seen){let esha;const q=await fetch(api(p),{headers:h});if(q.ok)esha=(await q.json()).sha;await put(p,du.split(',')[1],'Add image '+(p.split('/').pop()),esha)}
    // 2. content.json
    await put('content.json',b64(JSON.stringify(pub2,null,2)),'Update content via editor',sha);
    // 3. SEO meta tags written into index.html so Discord and Google can read them
    try{
      const q=await fetch(api('index.html'),{headers:h});
      if(q.ok){const j=await q.json();const raw=j.content.replace(/\n/g,'');let html=unb64(raw);
        const se=pub2.seo||{},s=pub2.site,tv=se.title||s.title||s.brand||'Portfolio',dv=se.desc||s.desc||'',iv=se.image||'',fv=se.favicon||s.favicon||'',cv=se.color||pub2.accent||'';
        // parse and edit the document properly: no regex over markup, the DOM handles all escaping
        const doc=new DOMParser().parseFromString(html,'text/html');
        doc.title=tv;
        const meta=(sel,attrs)=>{let el=doc.querySelector(sel);if(!el){el=doc.createElement('meta');doc.head.append(el)}for(const a in attrs)el.setAttribute(a,attrs[a])};
        meta('meta[name="description"]',{name:'description',content:dv});
        meta('meta[property="og:title"]',{property:'og:title',content:tv});
        meta('meta[property="og:description"]',{property:'og:description',content:dv});
        if(iv)meta('meta[property="og:image"]',{property:'og:image',content:iv});else doc.querySelectorAll('meta[property="og:image"]').forEach(n=>n.remove());
        if(cv)meta('meta[name="theme-color"]',{name:'theme-color',content:cv});else doc.querySelectorAll('meta[name="theme-color"]').forEach(n=>n.remove());
        if(fv){let l=doc.querySelector('link[rel="icon"]');if(!l){l=doc.createElement('link');doc.head.append(l)}l.setAttribute('rel','icon');
          l.setAttribute('href',/^(https?:|data:|\/|\.\/)/i.test(fv)||/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(fv)?fv:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${fv}</text></svg>`));}
        const out=(/^\s*<!doctype/i.test(html)?'<!DOCTYPE html>\n':'')+doc.documentElement.outerHTML;
        if(out!==html)await put('index.html',b64(out),'Update SEO meta tags',j.sha);
      }
    }catch(e2){toast('SEO tags not written to index.html: '+e2.message)}
    pubStr=JSON.stringify(data);status('Published. GitHub Pages takes about a minute to redeploy.');
  }catch(e){if(/bad credentials/i.test(e.message))delete SS.token;status('Publish failed: '+e.message)}
}
function setRepo(){const s=prompt('Repository as owner/name',repo().join('/'));if(s&&/^[\w.-]+\/[\w.-]+$/.test(s))LS.repo=s}
const shrink=file=>new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const i=new Image();i.onerror=no;i.onload=()=>{const k=Math.min(1,1200/i.width),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',.85))};i.src=r.result};r.readAsDataURL(file)});

document.addEventListener('click',async e=>{
  const x=e.target;
  if(x.closest('#mn .mncats [data-mcat]')){const mc=x.closest('[data-mcat]');mc.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===mc));mnFilter();return}
  if(x.id==='mn'){menu=false;bar();return}
  if(x.id==='tt'){const cur=document.documentElement.dataset.theme,dark=cur==='auto'?matchMedia('(prefers-color-scheme:dark)').matches:cur==='dark';LS.theme=dark?'light':'dark';render();return}
  const fb=x.closest('[data-f]');if(fb){fmt(fb.dataset.f);return}
  const c=x.closest('[data-c]');if(c){const g=c.closest('section').querySelector('.grid');if(c.dataset.c==='all'){g.classList.toggle('all');c.textContent=g.classList.contains('all')?data.site.ui.less:`${data.site.ui.all} ${g.children.length}`}else g.scrollBy({left:(c.dataset.c==='next'?1:-1)*g.clientWidth*.8,behavior:'smooth'});return}
  const ch=x.closest('[data-chip]');if(ch){ch.classList.toggle('on');return}
  const sd=x.closest('[data-send]');if(sd){const b=data.blocks[+sd.dataset.send],f0=sd.closest('.form'),n=f0.querySelector('[name=n]').value,m=f0.querySelector('[name=m]').value,o=[...f0.querySelectorAll('[data-chip].on')].map(y=>y.textContent).join(', ');
    if(!b.email&&!data.integ.webhook&&!data.integ.formUrl){toast('No email address or integration is set for this form yet');return}
    if(data.integ.webhook||data.integ.formUrl){
      const old=sd.textContent;sd.disabled=true;sd.textContent='Sending…';let ok=false;
      try{if(data.integ.formUrl){const r=await fetch(data.integ.formUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,needs:o,message:m})});ok=r.ok}}catch{}
      if(!ok&&data.integ.webhook){try{const r=await fetch(data.integ.webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(buildWebhookBody(n,o,m))});ok=r.ok}catch{}}
      sd.disabled=false;sd.textContent=old;
      if(ok){toast('Message sent, thank you');f0.querySelectorAll('input,textarea').forEach(x=>x.value='');f0.querySelectorAll('[data-chip].on').forEach(x=>x.classList.remove('on'));return}
      if(!b.email){toast('The form service could not be reached and no email is set for this form');return}
      toast('The form service could not be reached — opening your email app instead')}
    location.href=`mailto:${b.email}?subject=${encodeURIComponent('Project request from '+n)}&body=${encodeURIComponent(`Name: ${n}\nNeeds: ${o}\n\n${m}`)}`;return}
  const el=x.closest('[data-a],[data-t],[data-img],[data-sw],[data-bk],[data-rs],[data-add]');if(!el||!edit)return;
  const{a,t,p,img,sw,bk,rs,add:ty}=el.dataset,i=+el.dataset.i,q=data.blocks;
  if(img){const u=prompt('Image URL. Leave empty to upload a file. Type - to remove the image.');if(u===null)return;if(u==='-')mutate(()=>set(img,''));else if(u)mutate(()=>set(img,u));else{imgPath=img;$('#imgf').click()}}
  else if(ty){menu=false;mutate(()=>{q.push(blk(ty))});setTimeout(()=>$$('.blk').pop()?.scrollIntoView({behavior:'smooth'}),60)}
  else if(bk){if(bk==='del'){if(confirm('Delete this section?'))mutate(()=>{dropFx(q[i].id);q.splice(i,1)})}else if(bk==='dup')mutate(()=>{const n=structuredClone(q[i]),bid=q[i].id;n.id=uid();for(const fk in data.fx)if(fk.startsWith(bid+'.'))data.fx[n.id+'.'+fk.slice(bid.length+1)]=structuredClone(data.fx[fk]);q.splice(i+1,0,n)});else if(bk==='hide')mutate(()=>{q[i].hidden=!q[i].hidden});else if(bk==='style'){sp=sp===i?-1:i;render()}else if(bk==='adm')window.ADM&&ADM.open(i);else mutate(()=>{const j=bk==='up'?i-1:i+1;if(q[j])[q[i],q[j]]=[q[j],q[i]]})}
  else if(a==='add')mutate(()=>{const seg=p.split('.'),lst=seg[seg.length-1],b=get(data,seg.slice(0,-1).join('.'));get(data,p).push(ITEM[{options:'option',buttons:'buttons',badges:'pbadge',stats:'pstat'}[lst]||b.type]())});
  else if(a==='del')mutate(()=>{get(data,p).splice(i,1);shiftFx(+p.split('.')[1],p.split('.')[2],x=>x===i?null:x>i?x-1:x)});
  else if(a==='dup')mutate(()=>{const l=get(data,p),bi=+p.split('.')[1],lst=p.split('.')[2],bid=data.blocks[bi].id,base=bid+'.'+lst+'.'+i,snap={};for(const fk in data.fx)if(fk===base||fk.startsWith(base+'.'))snap[fk]=structuredClone(data.fx[fk]);l.splice(i+1,0,structuredClone(l[i]));shiftFx(bi,lst,x=>x>i?x+1:x);for(const fk in snap)data.fx[bid+'.'+lst+'.'+(i+1)+fk.slice(base.length)]=snap[fk]});
  else if(a==='up'||a==='down')mutate(()=>{const l=get(data,p),j=a==='up'?i-1:i+1;[l[i],l[j]]=[l[j],l[i]];shiftFx(+p.split('.')[1],p.split('.')[2],x=>x===Math.min(i,j)?Math.max(i,j):x===Math.max(i,j)?Math.min(i,j):x)});
  else if(rs)mutate(()=>{data.design[rs]=''});else if(sw)mutate(()=>{data.accent=sw});
  else if(t==='menu'){menu=!menu;bar()}else if(t==='design'){dr=!dr;bar()}
  else if(t==='admin'&&window.ADM)ADM.isOpen()?ADM.close():ADM.open(sp>=0?sp:-1);
  else if(t==='undo')jump(-1);else if(t==='redo')jump(1);
  else if(t==='export'){const z=document.createElement('a');z.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));z.download='content.json';z.click()}
  else if(t==='import')$('#imp').click();else if(t==='publish')publish();else if(t==='repo')setRepo();else if(t==='exit')location.hash='';
  else if(t==='reset'&&confirm('Discard local edits and go back to the published version?')){LS.removeItem(KEY);load()}
});
document.addEventListener('input',e=>{const t=e.target;
  if(t.classList.contains('mnsrch')){mnFilter();return}
  if(t.dataset.dzr){data.design[t.dataset.dzr]=+t.value;applyDesign();touch();return}
  if(t.id==='rad'){data.design.radius=+t.value;applyDesign();touch();return}
  const el=t.closest('[data-p]');if(el){set(el.dataset.p,el.innerText);touch()}});
document.addEventListener('paste',e=>{if(e.target.closest('[data-p]')){e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))}});
document.addEventListener('change',async e=>{const t=e.target;
  if(t.id==='acc'){data.accent=t.value;applyDesign();touch()}
  else if(t.id==='thm'){data.theme=t.value;LS.removeItem('theme');applyDesign();touch()}
  else if(t.dataset.dz)mutate(()=>{data.design[t.dataset.dz]=t.type==='checkbox'?t.checked:t.value});
  else if(t.dataset.bo)mutate(()=>{data.blocks[+t.dataset.i][t.dataset.bo]=t.value});
  else if(t.dataset.nl)mutate(()=>{data.blocks[+t.dataset.nl].nav=t.value});
  else if(t.dataset.sp)mutate(()=>set(t.dataset.sp,t.value));else if(t.dataset.bid)mutate(()=>{const v=t.value.toLowerCase().replace(/[^a-z0-9-]/g,'');if(v)data.blocks[+t.dataset.bid].id=v});
  else if(t.id==='imgf'&&t.files[0]){try{const v=await shrink(t.files[0]);mutate(()=>set(imgPath,v))}catch{toast('Could not read that image')}t.value=''}
  else if(t.id==='imp'&&t.files[0]){try{const j=JSON.parse(await t.files[0].text());if(!j||typeof j!=='object')throw 0;mutate(()=>{data=norm(j)})}catch{alert('Not a valid content.json file')}t.value=''}
});
addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault();location.hash=edit?'':'#edit';return}
  if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='a'&&window.ADM){e.preventDefault();ADM.isOpen()?ADM.close():ADM.open(-1);return}
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

// Fixed background image layer (animatable) and ambient glow blobs.
document.body.insertAdjacentHTML('afterbegin','<div id="bgfx" aria-hidden="true"></div><div id="amb" aria-hidden="true"><i></i><i></i></div>');
// Visitor loader: brand, progress line and percentage. Off in edit mode, instant for reduced motion.
function initLoader(){if(edit||!data.design.loader)return;const l=document.createElement('div');l.id='ld';l.className=data.design.loaderStyle==='bar'?'bar':'orb';
 l.innerHTML=`<div class="ld-orb"></div><div class="ld-in"><div class="ld-brand">${esc(data.site.brand||data.seo?.title||'Portfolio')}</div><div class="ld-line"><i></i></div><div class="ld-meta"><span>LOADING</span><b>0%</b></div></div>`;
 document.body.append(l);document.documentElement.classList.add('ld-on');
 const t0=performance.now(),dur=Math.round(1400/Math.max(.4,Math.min(2.5,+data.design.loaderSpd||1))),bar=l.querySelector('.ld-line i'),pct=l.querySelector('.ld-meta b');
 const fin=()=>{l.classList.add('done');document.documentElement.classList.remove('ld-on');setTimeout(()=>l.remove(),900)};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){fin();return}
 let loaded=document.readyState==='complete';addEventListener('load',()=>{loaded=true},{once:true});
 requestAnimationFrame(function step(now){const el=(now-t0)/dur;let p=loaded&&el>.3?1:el>=1?.92:Math.min(.92,el*.88);
  if(el>=1&&!loaded&&now-t0>dur+2500)p=1;
  bar.style.width=Math.round(p*100)+'%';pct.textContent=Math.round(p*100)+'%';
  if(p>=1){setTimeout(fin,240);return}requestAnimationFrame(step)})}

function load(){
  const was=edit;edit=location.hash==='#edit';
  if(was&&!edit)commit(); // leaving the editor: save whatever was still being typed
  data=structuredClone(pubN);
  // the editor preview iframe also shows the draft, not the published version
  if(edit||location.hash==='#preview'){try{const d=window.__pdraft||LS.getItem(KEY);if(d)data=norm(JSON.parse(d))}catch{}}
  hist=[JSON.stringify(data)];pos=0;dr=menu=false;sp=-1;render();
  applyHead();
  if(!edit&&!window.__ldone){window.__ldone=true;initLoader()}
}
// the editor shares its draft with the preview iframe (works even where storage is blocked)
addEventListener('message',e=>{if(e.data&&e.data.__draftReq&&edit&&e.source&&e.source===window.__pvFrame)e.source.postMessage({__draft:LS.getItem(KEY)||''},'*')});
if(window.parent!==window){parent.postMessage({__draftReq:1},'*');addEventListener('message',e=>{const d=e.data&&e.data.__draft;if(e.source!==window.parent)return;if(typeof d==='string'&&d&&location.hash==='#preview'){window.__pdraft=d;try{if(window.__booted){data=norm(JSON.parse(d));hist=[JSON.stringify(data)];render()}}catch{}}})}
(async()=>{
  try{pub=await(await fetch('content.json',{cache:'no-store'})).json()}catch{pub={blocks:[{type:'text',eyebrow:'Error',title:'Content could not be loaded',text:'content.json is missing or invalid. Open the site from GitHub Pages instead of a local file.',layout:'stack'}]}}
  pubN=norm(pub);pubStr=JSON.stringify(pubN);load();window.__booted=true;
})();
