// Advanced renderer + near-universal in-page editor
// - Everything in content.json is editable in-place
// - Deep customization controls (fonts, sizes, colors, layout)
// - Image upload/resizing to JPEG data URLs
// - Font upload (woff/woff2/ttf) and usage via @font-face stored in content
// - Undo/Redo history, autosave to localStorage
// - Export/Import/Publish via GitHub REST API (token in sessionStorage)
// - Sanitized embeds (iframe allowed only with https)

const KEY = 'portfolio-draft-v2';
const MAX_HISTORY = 500;
let pub = null, data = null, edit = false, hist = [], pos = -1, timer = 0, pendingImgPath = null;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const arr = a => Array.isArray(a) ? a : [];

// Basic safe checks for urls and images
const safeUrl = u => /^(https?:|mailto:|#|\/)/i.test(u) ? u : '#';
const safeImg = u => /^(https?:\/\/|data:image\/)/i.test(u || '') ? u : '';

// Simple sanitizer allowing a limited set of tags and attributes (for embeds)
function sanitizeHTML(html){
  const template = document.createElement('template');
  template.innerHTML = html;
  const ALLOWED = new Set(['A','P','BR','B','STRONG','EM','I','UL','OL','LI','IFRAME','IMG','FIGURE','FIGCAPTION','DIV','SPAN']);
  const ATTRS = { 'A':['href','rel','target'], 'IFRAME':['src','title','width','height','allow','loading'], 'IMG':['src','alt','width','height'] };
  function clean(node){
    const children = Array.from(node.childNodes);
    for(const child of children){
      if(child.nodeType === 3) continue; // text
      if(child.nodeType !== 1){ node.removeChild(child); continue }
      const tag = child.tagName.toUpperCase();
      if(!ALLOWED.has(tag)){ // replace with textContent
        const txt = document.createTextNode(child.textContent);
        node.replaceChild(txt, child);
        continue;
      }
      // strip disallowed attributes
      for(const attr of Array.from(child.attributes)){
        const allowed = ATTRS[tag] || [];
        if(!allowed.includes(attr.name)) child.removeAttribute(attr.name);
        if(attr.name === 'src' && tag === 'IFRAME'){
          if(!/^https:\/\//i.test(attr.value)) child.removeAttribute('src');
        }
        if(attr.name === 'href'){
          if(!/^(https?:|mailto:|#|\/)/i.test(attr.value)) child.removeAttribute('href');
        }
      }
      clean(child);
    }
  }
  clean(template.content);
  return template.innerHTML;
}

function norm(d){
  d = d && typeof d === 'object' ? d : {};
  return Object.assign({
    accent:'#7c8cff', theme:'dark', design:{font:'system',cols:2,radius:18,card:'glass',nav:'pill',width:'normal',glow:60,anim:true,spot:true,head:'tight'},
    site:{brand:'Snowman',footer:'',cta:{label:'Discord: @ctmo',url:'#'}},
    blocks:[] , assets:{images:[],fonts:[]}
  }, d);
}

// render helpers
function tpl(tag, inner='', cls=''){ return `<${tag} class="${cls}">${inner}</${tag}>` }

function field(p, tag='span', cls=''){ const val = get(data,p); if(edit) return `<${tag} class="${cls}" contenteditable="true" data-p="${p}" spellcheck="false">${escapeHtml(val)}</${tag}>`; return tpl(tag, escapeHtml(val), cls) }
function escapeHtml(s){ return esc(String(s||'')) }
function im(p,cls,alt=''){ const s = safeImg(get(data,p)); return s || edit ? `<img class="${cls}" src="${esc(s)}" alt="${esc(alt)}" ${edit?`data-img="${p}"`:''}>` : '' }

function get(o,p){ if(!p) return o; return p.split('.').reduce((a,k)=>a?.[k], o); }
function set(p,v){ const ks=p.split('.'); const last=ks.pop(); let o=data; for(const k of ks){ if(!o[k]) o[k]={}; o=o[k]; } o[last]=v }

// Build nav
function renderNav(){
  const nav = $('#nav');
  const links = data.blocks.filter(b=>b.type!== 'hidden').map(b=>{
    const label = b.nav || b.title || b.id; return `<a href="#${b.id}" data-id="${b.id}">${escapeHtml(label)}</a>`;
  }).join('') + `<button id="tt">Theme</button>`;
  nav.innerHTML = links;
}

// Render the full page from data.blocks
function render(){
  document.documentElement.style.setProperty('--accent', data.accent || '#7c8cff');
  document.documentElement.dataset.theme = localStorage.theme || data.theme || 'dark';
  document.documentElement.dataset.width = data.design?.width||'normal';
  document.documentElement.dataset-anim = data.design?.anim ? 'on' : 'off';

  renderNav();
  const app = $('#app');
  let out = '';
  for(const block of data.blocks){
    // if block.hidden and not edit, skip
    if(block.hidden && !edit) continue;
    const cls = block.hidden ? 'off' : '';
    if(block.type==='hero'){
      out += `<section id="${block.id}" class="hero ${cls}"><div><h1 ${edit?`data-p="blocks.${indexOf(block)}.title" contenteditable="true"`:''}>${escapeHtml(block.title||'')}</h1><p class="sub" ${edit?`data-p="blocks.${indexOf(block)}.text" contenteditable="true"`:''}>${escapeHtml(block.text||'')}</p>${im(`blocks.${indexOf(block)}.chip.image`,'chip')}${edit?`<div class="ctl"></div>`:''}</div></section>`;
    } else if(block.type==='text'){
      out += `<section id="${block.id}" class="text ${cls}"><h2>${escapeHtml(block.title || block.nav || '')}</h2><div id="about">${edit?`<div data-p="blocks.${indexOf(block)}.text" contenteditable="true">${escapeHtml(block.text||'')}</div>`:`<p>${escapeHtml(block.text||'')}</p>`}</div></section>`;
    } else if(block.type==='cards' || block.type==='list'){
      out += `<section id="${block.id}" class="cards ${cls}"><h2>${escapeHtml(block.title||block.nav||'')}</h2><div class="grid">`;
      (block.items||[]).forEach((it, i) => {
        const base = `blocks.${indexOf(block)}.items.${i}`;
        out += `<article class="card rv">${edit?`<h3 contenteditable="true" data-p="${base}.title">${escapeHtml(it.title||'')}</h3><p contenteditable="true" data-p="${base}.eyebrow">${escapeHtml(it.eyebrow||'')}</p>`:`<h3>${escapeHtml(it.title||'')}</h3><p class="mut">${escapeHtml(it.eyebrow||'')}</p>`}`;
        out += `${it.image?`<img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.title||'')}">`:''}`;
        out += `${edit?`<div class="ctl">${btn('up',indexOf(block),i,'↑')}${btn('down',indexOf(block),i,'↓')}${btn('del',indexOf(block),i,'✕')}</div>`:''}`;
        out += `</article>`;
      });
      if(edit) out += `<button class="add" data-a="add" data-p="blocks.${indexOf(block)}.items">+ Add</button>`;
      out += `</div></section>`;
    } else if(block.type==='marquee'){
      out += `<section id="${block.id}" class="marquee ${cls}"><h2>${escapeHtml(block.label||'')}</h2><p>${escapeHtml(block.items||'')}</p></section>`;
    } else if(block.type==='stats'){
      out += `<section id="${block.id}" class="stats ${cls}"><div class="grid">`;
      (block.items||[]).forEach((it,i)=>{
        out += `<div class="card rv"><h3>${escapeHtml(it.value||'')}</h3><p class="mut">${escapeHtml(it.label||'')}</p></div>`;
      });
      out += `</div></section>`;
    } else if(block.type==='contact'){
      out += `<section id="${block.id}" class="contact ${cls}"><h2>${escapeHtml(block.title||'Contact')}</h2>`;
      if(edit) out += `<div contenteditable="true" data-p="blocks.${indexOf(block)}.text">${escapeHtml(block.text||'')}</div>`; else out += `<p>${escapeHtml(block.text||'')}</p>`;
      if(block.email && !edit) out += `<p><a href="mailto:${escapeHtml(block.email)}">${escapeHtml(block.email)}</a></p>`;
      out += `<ul class="list">`;
      (block.rows||block.options||block.items||[]).forEach((l,i)=>{
        const base = `blocks.${indexOf(block)}.rows.${i}`;
        if(edit) out += `<li><span contenteditable="true" data-p="${base}.label">${escapeHtml(l.label||l.title||'')}</span> <span contenteditable="true" data-p="${base}.value">${escapeHtml(l.value||l.value||'')}</span></li>`;
        else out += `<li><a href="${escapeHtml(safeUrl(l.url||'#'))}" target="_blank" rel="noopener">${escapeHtml(l.label||l.value||l.title||'')}</a></li>`;
      })
      out += `</ul>`;
      if(edit) out += `<button class="add" data-a="add" data-p="blocks.${indexOf(block)}.rows">+ Add</button>`;
      out += `</section>`;
    } else {
      // generic fallback
      out += `<section id="${block.id}" class="generic ${cls}"><h2>${escapeHtml(block.title||block.nav||block.id)}</h2><div>${edit?`<div contenteditable="true" data-p="blocks.${indexOf(block)}.text">${escapeHtml(block.text||'')}</div>`:`<p>${escapeHtml(block.text||'')}</p>`}</div></section>`;
    }
  }
  app.innerHTML = out;
  attachListeners();
}

function indexOf(block){ return data.blocks.indexOf(block) }

function btn(a,p,i,t){ return `<button data-a="${a}" data-p="${p}" data-i="${i}" aria-label="${a}">${t}</button>` }

// Editor bar
function renderBar(){
  const b = $('#bar');
  b.hidden = !edit;
  if(!edit) return;
  b.innerHTML = `<b>Edit mode</b>
    <label>Accent <input id="acc" type="color" value="${escapeHtml(data.accent||'#7c8cff')}"></label>
    <label>Font <select id="fontsel"><option value="system">System</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></label>
    <label>Default <select id="thm"><option>auto</option><option>light</option><option>dark</option></select></label>
    <details><summary>Sections</summary>${data.blocks.map(b=>`<label><input type="checkbox" data-sec="${b.id}" ${b.hidden ? '' : 'checked'}> ${escapeHtml(b.id)}</label>`).join('')}</details>
    <button data-t="undo">Undo</button><button data-t="redo">Redo</button>
    <button data-t="export">Export</button><button data-t="import">Import</button>
    <button data-t="publish">Publish</button>
    <button data-t="reset">Reset</button>
    <button data-t="repo">Repo</button>
    <button data-t="exit">Exit</button>
    <span id="st" role="status"></span>`;
  const th = $('#thm'); if(th) th.value = data.theme || 'dark';
  status();
}

function status(msg){ const s = $('#st'); if(!s) return; s.textContent = msg || (JSON.stringify(data) === JSON.stringify(norm(pub)) ? 'Matches published version' : 'Saved locally, not yet published') }

// History
function snapshot(){ clearTimeout(timer); const s = JSON.stringify(data); if(hist[pos] === s) return; hist = hist.slice(0,pos+1); hist.push(s); if(hist.length>MAX_HISTORY) hist.shift(); pos = hist.length-1; localStorage.setItem(KEY, hist[pos]); }
function touch(){ status('Editing...'); clearTimeout(timer); timer = setTimeout(snapshot, 400); }
function jump(d){ const n = pos + d; if(n<0||n>=hist.length) return; pos = n; data = JSON.parse(hist[pos]); localStorage.setItem(KEY, hist[pos]); render(); }

// Mutations
function mutate(fn){ fn(); render(); snapshot(); }

// Image shrink to JPEG data URL (max width 1200)
function shrink(file){ return new Promise((ok,fail)=>{ const r=new FileReader(); r.onerror=fail; r.onload=()=>{ const img=new Image(); img.onerror=fail; img.onload=()=>{ const k=Math.min(1,1200/img.width); const c=document.createElement('canvas'); c.width=Math.round(img.width*k); c.height=Math.round(img.height*k); const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,c.width,c.height); ok(c.toDataURL('image/jpeg',0.85)); }; img.src = r.result }; r.readAsDataURL(file); }) }

// Font upload -> create @font-face and store base64 in data.assets.fonts
function installFont(file){ return new Promise((ok,fail)=>{ const r=new FileReader(); r.onerror=fail; r.onload=()=>{ const name = file.name.replace(/\.[^.]+$/,''); const mime = file.type || 'font/woff2'; const b64 = r.result.split(',')[1]; const rule = `@font-face{font-family:"${name}";src:url(data:${mime};base64,${b64}) format("woff2");}`; data.assets = data.assets || {}; data.assets.fonts = data.assets.fonts || []; data.assets.fonts.push({name,rule}); ok(name); }; r.readAsDataURL(file); }) }

// Repo detection
function repo(){ let s = localStorage.repo; if(!s){ const h=location.hostname; const path=location.pathname.split('/')[1]; if(h.endsWith('.github.io')) s = h.split('.')[0] + '/' + (path && !path.includes('.') ? path : ''); } return s ? s.split('/') : [] }
function setRepo(){ const s = prompt('Repository as owner/name', repo().join('/')); if(s && /^[\w.-]+\/[\w.-]+$/.test(s)) localStorage.repo = s }

// Publish flow using GitHub REST API
async function publish(){ let [o,r] = repo(); if(!o||!r){ setRepo(); [o,r] = repo(); if(!o||!r) return; } let t = sessionStorage.token; if(!t){ t = prompt('Paste a fine-grained token (Contents read/write). Kept in this tab only.'); if(!t) return; sessionStorage.token = t; }
  try{ status('Publishing...'); const url = `https://api.github.com/repos/${o}/${r}/contents/content.json`; const headers = { Authorization: 'Bearer '+t, Accept: 'application/vnd.github+json' };
    const g = await fetch(url, { headers }); if(!g.ok && g.status !== 404) throw new Error((await g.json()).message || g.statusText);
    const sha = g.ok ? (await g.json()).sha : undefined; const txt = JSON.stringify(data, null, 2); const res = await fetch(url, { method:'PUT', headers, body: JSON.stringify({ message:'Update content via editor', content: btoa(unescape(encodeURIComponent(txt))), sha }) });
    if(!res.ok) throw new Error((await res.json()).message);
    pub = JSON.parse(JSON.stringify(data)); snapshot(); status('Published. GitHub Pages redeploys in about a minute.'); }
  catch(e){ if(/bad credentials/i.test(String(e.message))) sessionStorage.removeItem('token'); status('Publish failed: '+e.message); }
}

// Load published content.json
async function loadPublished(){ try{ const res = await fetch('content.json',{cache:'no-store'}); if(!res.ok) throw new Error('Not found'); const j = await res.json(); pub = j; return j; } catch(e){ return null } }

// UI interactions
function attachListeners(){
  // nav active link on scroll
  document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',e=>{ document.querySelectorAll('#nav a').forEach(x=>x.classList.remove('active')); a.classList.add('active'); }));

  // global click handlers for editor actions
  document.addEventListener('click', onDocClick);
  document.addEventListener('input', onInput);
  document.addEventListener('paste', onPaste);
  document.querySelectorAll('[data-img]').forEach(img=>img.addEventListener('click', onImageClick));
}

function onDocClick(e){
  const target = e.target.closest('[data-a],[data-t],[data-p],[data-img]') || e.target;
  if(!target) return;
  if(target.dataset.t){ // toolbar actions
    const t = target.dataset.t;
    if(t==='undo') jump(-1);
    else if(t==='redo') jump(1);
    else if(t==='export'){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); a.download='content.json'; a.click(); }
    else if(t==='import') document.querySelector('#imp').click();
    else if(t==='publish') publish();
    else if(t==='reset'){ if(confirm('Discard local edits and reload published content?')){ localStorage.removeItem(KEY); init(); } }
    else if(t==='repo') setRepo();
    else if(t==='exit'){ location.hash=''; }
    return;
  }
  if(target.dataset.a && edit){ // element-level actions
    const a = target.dataset.a, p = target.dataset.p, i = parseInt(target.dataset.i);
    if(a==='add'){ mutate(()=>{ const arrv = get(data,p) || []; arrv.push({title:'New item',eyebrow:''}); set(p,arrv); }); }
    if(a==='del'){ mutate(()=>{ const arrv = get(data,p) || []; arrv.splice(i,1); set(p,arrv); }); }
    if(a==='up' || a==='down'){ mutate(()=>{ const arrv = get(data,p) || []; const j = a==='up'?i-1:i+1; if(j<0||j>=arrv.length) return; [arrv[i],arrv[j]]=[arrv[j],arrv[i]]; set(p,arrv); }); }
  }
}

function onInput(e){ const el = e.target.closest('[data-p]'); if(el){ const p = el.dataset.p; set(p, el.innerText); touch(); }}

function onPaste(e){ const el = e.target.closest('[contenteditable]'); if(el){ e.preventDefault(); const text = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, text); }}

function onImageClick(e){ if(!edit) return; const el = e.target.closest('[data-img]'); if(!el) return; const p = el.getAttribute('data-img'); const url = prompt('Image URL (leave empty to upload a file)'); if(url===null) return; if(url) mutate(()=> set(p, url)); else { pendingImgPath = p; document.querySelector('#imgf').click(); } }

// file inputs
document.querySelector('#imgf').addEventListener('change', async function(){ const f = this.files[0]; if(!f) return; try{ const dataUrl = await shrink(f); mutate(()=> set(pendingImgPath, dataUrl)); pendingImgPath = null; }catch(e){ console.error(e); toast('Image upload failed'); } this.value=''; });

document.querySelector('#imp').addEventListener('change', async function(){ const f = this.files[0]; if(!f) return; try{ const txt = await f.text(); const j = JSON.parse(txt); if(!j || !Array.isArray(j.blocks)) throw new Error('Invalid'); mutate(()=>{ data = norm(j); }); }catch(e){ alert('Import failed: Not a valid content.json file'); } this.value=''; });

document.querySelector('#fontf').addEventListener('change', async function(){ const f = this.files[0]; if(!f) return; try{ const name = await installFont(f); toast('Font installed: '+name); render(); } catch(e){ toast('Font install failed'); } this.value=''; });

// keyboard shortcuts
addEventListener('keydown', e=>{ if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='e'){ e.preventDefault(); location.hash = edit ? '' : '#edit'; } if(e.ctrlKey && e.key.toLowerCase()==='z'){ e.preventDefault(); jump(-1); } if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='z'){ e.preventDefault(); jump(1); } });

// small UI helpers
function toast(msg, t=2500){ const el = $('#toast'); el.textContent = msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), t); }

// initial load
async function init(){ const published = await loadPublished(); data = norm(published || data || {});
  // if there's a saved draft and we're in edit mode, load it
  if(location.hash==='#edit'){ try{ const d = localStorage.getItem(KEY); if(d) data = norm(JSON.parse(d)); }catch{} }
  hist = [JSON.stringify(data)]; pos = 0; renderBar(); render(); snapshot(); }

// toggle edit mode based on hash
addEventListener('hashchange', ()=>{ edit = location.hash==='#edit'; renderBar(); render(); });

// start
init();
