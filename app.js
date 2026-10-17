// Portfolio renderer + in-page editor. Content lives in content.json.
const KEY='portfolio-draft',SECS=['hero','about','current','former','contact'],LBL={about:'About me',current:'Current positions',former:'Former positions'};
const NEW={current:{title:'Project',role:'Role'},former:{title:'Project',role:'Role'},'contact.links':{label:'Link',url:'https://'}};
let data,pubStr,edit=false,hist=[],pos=0,timer,imgPath;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^(https?:|mailto:|#|\/)/i.test(u)?u:'#';
const safeImg=u=>/^(https?:\/\/|data:image\/|\.{0,2}\/?[\w.\-\/]+$)/i.test(u||'')?u:'';
const arr=a=>Array.isArray(a)?a:[];
const get=(o,p)=>p?p.split('.').reduce((a,k)=>a?.[k],o):o;
const set=(p,v)=>{const k=p.split('.'),l=k.pop();get(data,k.join('.'))[l]=v};
function norm(d){d=d&&typeof d==='object'?d:{};return{accent:d.accent||'#2563eb',theme:d.theme||'auto',hidden:arr(d.hidden),design:{font:'system',cols:2,radius:18,...d.design},labels:{...d.labels},order:SECS.every(x=>arr(d.order).includes(x))?d.order:[...SECS],hero:{name:'Content unavailable',title:'content.json could not be loaded',intro:'',image:'',cta:'',...d.hero},about:d.about||'',current:arr(d.current),former:arr(d.former),contact:{email:'',...d.contact,links:arr(d.contact?.links)}}}

// Field helpers: editable in edit mode, plain text otherwise.
const f=(p,tag='span',cls='')=>`<${tag} class="${cls}"${edit?` contenteditable="true" data-p="${p}"`:''}>${esc(get(data,p))}</${tag}>`;
const im=(p,cls,alt='')=>{const s=safeImg(get(data,p));return s||edit?`<img class="${cls}" src="${esc(s)}" alt="${esc(alt)}"${edit?` data-img="${p}"`:''}>`:''};
const btn=(a,p,i,t)=>`<button data-a="${a}" data-p="${p}" data-i="${i}" aria-label="${a}" title="${a}">${t}</button>`;
const ctl=(p,i)=>edit?`<div class="ctl">${btn('dup',p,i,'⧉')}${i>0?btn('up',p,i,'↑'):''}${i<get(data,p).length-1?btn('down',p,i,'↓'):''}${btn('del',p,i,'✕')}</div>`:'';
const add=p=>edit?`<button class="add" data-a="add" data-p="${p}">+ Add</button>`:'';
const FONTS={system:'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',serif:'Georgia,"Iowan Old Style",serif',mono:'ui-monospace,"SF Mono",Menlo,Consolas,monospace',rounded:'ui-rounded,"SF Pro Rounded",Nunito,"Segoe UI",system-ui,sans-serif'},SW=['#7c8cff','#2563eb','#10b981','#f59e0b','#ef4444','#ec4899'];
let dr=false;
const lb=id=>data.labels[id]||LBL[id]||id[0].toUpperCase()+id.slice(1);
const applyDesign=()=>{const d=data.design,r=document.documentElement.style;r.setProperty('--radius',d.radius+'px');r.setProperty('--cols',d.cols);document.body.style.fontFamily=FONTS[d.font]||FONTS.system};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t.k);t.k=setTimeout(()=>t.classList.remove('show'),3500)}
const sec=(id,h)=>{const off=data.hidden.includes(id);return off&&!edit?'':`<section id="${id}" class="${off?'off':''}">${h}</section>`};

const blk=id=>sec(id,`<h2>${esc(lb(id))}</h2><div class="grid">${data[id].map((x,i)=>`<article class="card">${f(`${id}.${i}.title`,'h3')}${f(`${id}.${i}.role`,'p','mut')}${ctl(id,i)}</article>`).join('')}</div>${add(id)}`);
function render(){
  const h=data.hero;
  document.body.classList.toggle('editing',edit);
  document.title=`${h.name} | ${h.title}`;
  document.documentElement.style.setProperty('--accent',data.accent);applyDesign();
  document.documentElement.dataset.theme=localStorage.theme||data.theme||'auto';
  $('#nav').innerHTML=data.order.filter(s=>s!=='hero'&&(edit||!data.hidden.includes(s))).map(s=>`<a href="#${s}">${esc(lb(s))}</a>`).join('')+'<button id="tt" aria-label="Toggle light or dark theme">◐</button>';
  const S={hero:sec('hero',`<div class="hero"><div>${f('hero.name','h1')}${f('hero.title','p','sub')}${f('hero.intro','p')}${edit?f('hero.cta','span','btn'):`<a class="btn" href="#current">${esc(h.cta)}</a>`}</div>${im('hero.image','avatar',h.name)}</div>`),about:sec('about',`<h2>${esc(lb('about'))}</h2>${f('about','p')}`),current:blk('current'),former:blk('former'),contact:sec('contact',`<h2>${esc(lb('contact'))}</h2>${edit||data.contact.email?`<p>${edit?f('contact.email'):`<a href="mailto:${esc(data.contact.email)}">${esc(data.contact.email)}</a>`}</p>`:''}<ul class="list">${data.contact.links.map((l,i)=>`<li>${edit?`${f(`contact.links.${i}.label`)} ${f(`contact.links.${i}.url`)}`:`<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label)}</a>`} ${ctl('contact.links',i)}</li>`).join('')}</ul>${add('contact.links')}`)};
  $('#app').innerHTML=data.order.map(k=>S[k]||'').join('');
  bar();
}

function bar(){
  const b=$('#bar'),d=data.design;b.hidden=!edit;if(!edit)return;
  const tb=(t,l,c='')=>`<button class="${c}" data-t="${t}">${l}</button>`,o=(v,c)=>`<option value="${v}"${String(v)===String(c)?' selected':''}>${v}</option>`;
  b.innerHTML=`<div class="row"><b>Editor</b><span id="st" role="status"></span><span class="sp"></span>${tb('undo','↶ Undo')}${tb('redo','↷ Redo')}${tb('design','Design')}${tb('export','Export')}${tb('import','Import')}${tb('publish','Publish','pri')}${tb('exit','Exit')}</div>
  <aside id="dr" class="${dr?'open':''}"><header><b>Design</b>${tb('design','✕')}</header>
  <h4>Accent colour</h4><div class="sw">${SW.map(c=>`<button data-sw="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<input type="color" id="acc" value="${esc(data.accent)}"></div>
  <h4>Appearance</h4><label>Default theme<select id="thm">${['auto','light','dark'].map(v=>o(v,data.theme)).join('')}</select></label>
  <label>Font<select id="fnt">${Object.keys(FONTS).map(v=>o(v,d.font)).join('')}</select></label>
  <label>Columns<select id="cols">${[1,2,3].map(v=>o(v,d.cols)).join('')}</select></label>
  <label>Corner radius<input type="range" id="rad" min="0" max="32" value="${d.radius}"></label>
  <h4>Sections</h4>${data.order.map(s=>`<div class="srow"><input type="checkbox" data-sec="${s}"${data.hidden.includes(s)?'':' checked'} aria-label="Show ${s}"><input type="text" data-lbl="${s}" value="${esc(lb(s))}" aria-label="${s} title"><button data-so="up" data-id="${s}">↑</button><button data-so="down" data-id="${s}">↓</button></div>`).join('')}
  <h4>More</h4><div class="srow">${tb('repo','Set repository')}${tb('reset','Discard draft')}</div><p class="hint">Shortcuts: Ctrl+S save draft, Ctrl+Z / Ctrl+Y undo and redo (outside text fields), Esc closes this panel.</p></aside>`;
  status();
}
const status=m=>{const s=$('#st');if(s){const same=JSON.stringify(data)===pubStr;s.className=same?'ok':'dirty';s.textContent=m==='Editing...'?'Editing...':same?'Published':'Unpublished changes'}if(m&&m!=='Editing...')toast(m)};

// History: debounced snapshots, max 100 steps, autosaved to localStorage.
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
const shrink=file=>new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const i=new Image();i.onerror=no;i.onload=()=>{const k=Math.min(1,1200/i.width),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.8))};i.src=r.result};r.readAsDataURL(file)});

document.addEventListener('click',e=>{
  if(e.target.id==='tt'){const cur=document.documentElement.dataset.theme,dark=cur==='auto'?matchMedia('(prefers-color-scheme:dark)').matches:cur==='dark';localStorage.theme=dark?'light':'dark';render();return}
  const el=e.target.closest('[data-a],[data-t],[data-img],[data-sw],[data-so]');if(!el||!edit)return;
  const{a,t,p,img,sw,so,id}=el.dataset,i=+el.dataset.i;
  if(img){const u=prompt('Image URL. Leave empty to upload a file instead.');if(u===null)return;if(u)mutate(()=>set(img,u));else{imgPath=img;$('#imgf').click()}}
  else if(a==='add')mutate(()=>get(data,p).push(structuredClone(NEW[p])));
  else if(a==='del')mutate(()=>get(data,p).splice(i,1));
  else if(a==='up'||a==='down')mutate(()=>{const l=get(data,p),j=a==='up'?i-1:i+1;[l[i],l[j]]=[l[j],l[i]]});
  else if(sw)mutate(()=>{data.accent=sw});else if(so)mutate(()=>{const q=data.order,k=q.indexOf(id),j=so==='up'?k-1:k+1;if(j>=0&&j<q.length)[q[k],q[j]]=[q[j],q[k]]});else if(t==='design'){dr=!dr;bar()}else if(a==='dup')mutate(()=>{const l=get(data,p);l.splice(i+1,0,structuredClone(l[i]))});else if(t==='undo')jump(-1);else if(t==='redo')jump(1);
  else if(t==='export'){const x=document.createElement('a');x.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));x.download='content.json';x.click()}
  else if(t==='import')$('#imp').click();
  else if(t==='publish')publish();
  else if(t==='repo')setRepo();
  else if(t==='exit')location.hash='';
  else if(t==='reset'&&confirm('Discard local edits and go back to the published version?')){localStorage.removeItem(KEY);load()}
});
document.addEventListener('input',e=>{if(e.target.id==='rad'){data.design.radius=+e.target.value;applyDesign();touch();return}
  const el=e.target.closest('[data-p]');if(el){set(el.dataset.p,el.innerText);touch()}});
document.addEventListener('paste',e=>{if(e.target.closest('[data-p]')){e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))}});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='acc'){data.accent=t.value;document.documentElement.style.setProperty('--accent',t.value);touch()}
  else if(t.id==='thm'){data.theme=t.value;localStorage.removeItem('theme');document.documentElement.dataset.theme=t.value;touch()}
  else if(t.id==='fnt')mutate(()=>{data.design.font=t.value});else if(t.id==='cols')mutate(()=>{data.design.cols=+t.value});else if(t.dataset.lbl)mutate(()=>{data.labels[t.dataset.lbl]=t.value});else if(t.dataset.sec)mutate(()=>{const h=data.hidden,s=t.dataset.sec;data.hidden=t.checked?h.filter(x=>x!==s):[...h,s]});
  else if(t.id==='imgf'&&t.files[0]){try{const v=await shrink(t.files[0]);mutate(()=>set(imgPath,v))}catch{status('Could not read that image')}t.value=''}
  else if(t.id==='imp'&&t.files[0]){try{const j=JSON.parse(await t.files[0].text());if(!j||typeof j.hero!=='object')throw 0;mutate(()=>{data=norm(j)})}catch{alert('Not a valid content.json file')}t.value=''}
});
addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault();location.hash=edit?'':'#edit'}});
addEventListener('keydown',e=>{if(!edit)return;const k=e.key.toLowerCase(),txt=e.target.closest?.('[contenteditable],input,select');
  if(e.key==='Escape'&&dr){dr=false;bar()}
  else if(e.ctrlKey&&k==='s'){e.preventDefault();commit();toast('Draft saved in this browser')}
  else if(e.ctrlKey&&!txt&&k==='z'){e.preventDefault();jump(e.shiftKey?1:-1)}
  else if(e.ctrlKey&&!txt&&k==='y'){e.preventDefault();jump(1)}});
addEventListener('hashchange',load);

document.body.insertAdjacentHTML('beforeend','<div id="toast"></div>');
let pub;
function load(){
  edit=location.hash==='#edit';data=norm(pub);
  if(edit){try{const d=localStorage.getItem(KEY);if(d)data=norm(JSON.parse(d))}catch{}}
  hist=[JSON.stringify(data)];pos=0;render();
}
(async()=>{
  try{pub=await(await fetch('content.json',{cache:'no-store'})).json()}catch{pub=null}
  pubStr=JSON.stringify(norm(pub));load();
})();
