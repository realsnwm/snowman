// Admin panel. Loaded by app.js only in edit mode; uses app.js globals (data, set, touch, mutate, render, norm, toast, esc).
(()=>{
let sel=0,tab='block',rt,el='';
const EF=[['color','Colour'],['size','Size (2rem, 18px)'],['weight','Weight','300,400,500,600,700,800,900'],['font','Font (Google Font name)'],['align','Align','left,center,right'],['ls','Letter spacing'],['tt','Case','none,uppercase,lowercase,capitalize'],['mt','Margin top (px)'],['mb','Margin bottom (px)'],['op','Opacity (0 to 1)']];
const elemForm=()=>{if(!el)return'<p class="hint">Click any text on the page first, then come back here to style just that element.</p>';const s=data.fx[fxk(el)]||{};
 return`<h4>${esc(el)}</h4>${EF.map(([k,l,t])=>`<label>${l}${t?`<select data-ae="${k}"><option value="">default</option>${t.split(',').map(o=>`<option${s[k]===o?' selected':''}>${o}</option>`).join('')}</select>`:`<input data-ae="${k}" value="${esc(s[k]??'')}">`}</label>`).join('')}<p><button data-adm="fxclear">Clear this element</button></p>`};
const p=document.createElement('aside');p.id='adm';p.hidden=true;document.body.append(p);
const TABS=[['block','Block'],['elem','Element'],['design','Design'],['site','Site'],['code','Code'],['json','JSON']];
const SF=[['pt','Padding top (px)','n'],['pb','Padding bottom (px)','n'],['bg','Background (any CSS)'],['color','Text colour'],['align','Align','left,center,right'],['font','Font (Google Font name)'],['an','Animation','fade,up,zoom,left,none'],['ad','Anim. duration (s)','n'],['adl','Anim. delay (s)','n'],['cls','CSS class'],['css','Custom CSS, & = this block','t']];
// Generic recursive form: every field of an object becomes an input bound by path.
const fld=(path,v,k)=>Array.isArray(v)?`<fieldset><legend>${k} (${v.length})</legend>${v.map((x,j)=>fld(path+'.'+j,x,'#'+(j+1))).join('')}</fieldset>`
 :v&&typeof v==='object'?`<fieldset><legend>${k}</legend>${Object.entries(v).map(([a,b])=>fld(path+'.'+a,b,a)).join('')}</fieldset>`
 :`<label>${k}${typeof v==='boolean'?`<input type="checkbox" data-ap="${path}" data-ty="b"${v?' checked':''}>`
 :typeof v==='string'&&(v.length>36||v.includes('\n'))?`<textarea data-ap="${path}" data-ty="s" rows="4">${esc(v)}</textarea>`
 :`<input data-ap="${path}" data-ty="${typeof v==='number'?'n':'s'}" value="${esc(v)}">`}</label>`;
const sf=(b)=>SF.map(([k,l,t])=>{const v=b.style?.[k]??'';return`<label>${l}${t==='t'?`<textarea data-as="${k}" rows="4">${esc(v)}</textarea>`:t&&t.includes(',')?`<select data-as="${k}"><option value="">default</option>${t.split(',').map(o=>`<option${v===o?' selected':''}>${o}</option>`).join('')}</select>`:`<input data-as="${k}" value="${esc(v)}">`}</label>`}).join('');
function draw(){
 const b=data.blocks[sel]||data.blocks[sel=0];let h=`<header><b>Admin</b><button data-adm="close">✕</button></header><div class="at">${TABS.map(([k,l])=>`<button data-tab="${k}"${k===tab?' class="on"':''}>${l}</button>`).join('')}</div>`;
 if(tab==='block'&&b)h+=`<select data-sel>${data.blocks.map((x,i)=>`<option value="${i}"${i===sel?' selected':''}>${i+1}. ${x.type}: ${esc(x.nav||x.title||x.id)}</option>`).join('')}</select><h4>Style and animation</h4>${sf(b)}<h4>Content, every field</h4>${Object.entries(b).filter(([k])=>k!=='style').map(([k,v])=>fld(`blocks.${sel}.${k}`,v,k)).join('')}`;
 else if(tab==='elem')h+=elemForm();else if(tab==='design')h+=fld('accent',data.accent,'accent')+fld('theme',data.theme,'theme (auto, light, dark)')+fld('design',data.design,'design')+'<p class="hint">font: system, serif, mono, rounded or any Google Font name. card: glass, solid, outline. nav: pill, bar. width: narrow, normal, wide.</p>';
 else if(tab==='site')h+=fld('site',data.site,'site')+fld('integ',data.integ,'integrations')+'<p class="hint">webhook: Discord webhook URL, form requests are posted there. formUrl: Formspree, Web3Forms or any JSON endpoint. plausible: your domain. These values are public in content.json.</p>';
 else if(tab==='code')h+=fld('custom',data.custom,'custom')+'<p class="hint">css applies everywhere. head: raw HTML or scripts added to the page head for visitors only.</p>';
 else h+=`<textarea class="big" id="adj" spellcheck="false">${esc(JSON.stringify(data,null,2))}</textarea><p><button data-adm="apply">Apply JSON</button> <button data-adm="copy">Copy</button></p>`;
 p.innerHTML=h}
const open=i=>{if(i<0&&!p.hidden)return close();if(i>=0){sel=i;tab='block'}p.hidden=false;document.body.classList.add('adm');draw()};
const close=()=>{p.hidden=true;document.body.classList.remove('adm')};
p.addEventListener('input',e=>{const t=e.target,a=t.dataset.ap,s=t.dataset.as;
 if(a){const y=t.dataset.ty;set(a,y==='b'?t.checked:y==='n'?+t.value:t.value)}
 else if(t.dataset.ae){const k=fxk(el);(data.fx[k]||(data.fx[k]={}))[t.dataset.ae]=t.value;const n=document.querySelector(`[data-p="${el}"]`);if(n)n.style.cssText=fxs(el);touch();return}
 else if(s){const b=data.blocks[sel];(b.style||(b.style={}))[s]=t.value}else return;
 touch();clearTimeout(rt);rt=setTimeout(render,250)});
p.addEventListener('change',e=>{if(e.target.dataset.sel!==undefined){sel=+e.target.value;draw()}});
p.addEventListener('click',e=>{const t=e.target,k=t.dataset.tab,a=t.dataset.adm;
 if(k){tab=k;draw()}else if(a==='close')close();
 else if(a==='fxclear'){delete data.fx[fxk(el)];const n=document.querySelector(`[data-p="${el}"]`);if(n)n.style.cssText='';touch();draw()}
 else if(a==='copy'){navigator.clipboard?.writeText(p.querySelector('#adj').value);toast('Copied')}
 else if(a==='apply'){try{const j=JSON.parse(p.querySelector('#adj').value);mutate(()=>{data=norm(j)});toast('Applied')}catch(x){toast('Invalid JSON: '+x.message)}}});
document.addEventListener('focusin',e=>{const n=e.target.closest?.('[data-p]');if(n&&!p.hidden){el=n.dataset.p;if(tab==='elem')draw()}});
addEventListener('hashchange',()=>{if(!edit)close()});
window.ADM={open,close,sync:()=>{if(!p.hidden&&!p.contains(document.activeElement))draw()}};
})();
