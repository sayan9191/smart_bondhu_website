if(!window.SB_CONFIG||!(window.SB_CONFIG.supabaseAnonKey||'').trim()||String(window.SB_CONFIG.supabaseAnonKey).startsWith('PASTE_')){
  window.SB_CONFIG={
    supabaseUrl:'https://fecohhbsklscltyixzru.supabase.co',
    supabaseAnonKey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlY29oaGJza2xzY2x0eWl4enJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDg1MDksImV4cCI6MjEwNTMyNDUwOX0.LoauqH6LdxaxCCbv_orzRsc3Xdp4FANxJvO8N2-4l1k'
  };
}

const cfg=window.SB_CONFIG||{};
const key=(cfg.supabaseAnonKey||'').trim();
let sb=(cfg.supabaseUrl&&key&&window.supabase)?window.supabase.createClient(cfg.supabaseUrl,key):null;

const authScreen=document.getElementById('authScreen');
const appScreen=document.getElementById('appScreen');
const authError=document.getElementById('authError');
const authTitle=document.getElementById('authTitle');
const authSub=document.getElementById('authSub');
const ADMIN_USERNAME='SmartBondhu@2026';
const ADMIN_PASSWORD='Admin@2026';
const ADMIN_EMAIL='admin@smartbondhu.in';
const ADMIN_FLAG='sb_admin_ok';

function showErr(msg){authError.hidden=false;authError.textContent=msg}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function closeModal(){document.getElementById('modal').classList.remove('show')}
function openModal(html){document.getElementById('modalContent').innerHTML=html;document.getElementById('modal').classList.add('show')}
document.getElementById('modalClose').onclick=closeModal;
document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});

document.getElementById('adminMenuBtn').onclick=()=>document.getElementById('adminTabs').classList.toggle('open');
document.getElementById('adminTabs').addEventListener('click',e=>{
  const btn=e.target.closest('button[data-tab]');
  if(!btn)return;
  document.querySelectorAll('.admin-tabs [data-tab]').forEach(b=>b.classList.toggle('on',b===btn));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.dataset.panel===btn.dataset.tab));
  document.getElementById('adminTabs').classList.remove('open');
});

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;
    s.onload=()=>resolve(true);
    s.onerror=()=>reject(new Error(src));
    document.head.appendChild(s);
  });
}

async function ensureClient(){
  if(sb)return sb;
  if(!window.supabase){
    const urls=[
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
      'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
    ];
    for(const src of urls){
      try{await loadScript(src);if(window.supabase)break}catch(e){}
    }
  }
  if(cfg.supabaseUrl&&key&&window.supabase)sb=window.supabase.createClient(cfg.supabaseUrl,key);
  return sb;
}

async function boot(){
  document.getElementById('authSubmit').disabled=false;
  authTitle.textContent='Admin login';
  authSub.textContent='Sign in to manage enquiries and services.';
  await ensureClient();
  if(sessionStorage.getItem(ADMIN_FLAG)==='1')return enterApp();
  if(!sb)return;
  try{
    const {data}=await sb.auth.getSession();
    if(data.session)return enterApp();
  }catch(e){}
}

async function trySupabaseAuth(){
  if(!sb)await ensureClient();
  if(!sb)return;
  let {error}=await sb.auth.signInWithPassword({email:ADMIN_EMAIL,password:ADMIN_PASSWORD});
  if(error&&/not confirmed/i.test(error.message||''))return;
  if(error&&/invalid|credentials|email/i.test(error.message||'')){
    await sb.auth.signUp({email:ADMIN_EMAIL,password:ADMIN_PASSWORD});
    ({error}=await sb.auth.signInWithPassword({email:ADMIN_EMAIL,password:ADMIN_PASSWORD}));
  }
}

document.getElementById('authSubmit').onclick=async()=>{
  const username=document.getElementById('authEmail').value.trim();
  const password=document.getElementById('authPassword').value;
  authError.hidden=true;
  if(!username||!password)return showErr('Enter username and password.');
  if(username!==ADMIN_USERNAME||password!==ADMIN_PASSWORD)return showErr('Wrong username or password.');
  sessionStorage.setItem(ADMIN_FLAG,'1');
  enterApp();
  trySupabaseAuth().then(()=>loadEnquiries()).catch(()=>{});
};

document.getElementById('logoutBtn').onclick=async()=>{
  sessionStorage.removeItem(ADMIN_FLAG);
  try{if(sb)await sb.auth.signOut()}catch(e){}
  location.reload();
};

async function enterApp(){
  authScreen.hidden=true;
  appScreen.hidden=false;
  await Promise.all([loadEnquiries(),loadCategories(),loadServices(),loadFaqs()]);
}

let enquiries=[];
async function loadEnquiries(){
  await ensureClient();
  if(!sb)return document.getElementById('enquiryList').innerHTML='<p>Could not connect to Supabase.</p>';
  let {data,error}=await sb.from('enquiries').select('*').order('created_at',{ascending:false});
  if(error){
    const rpc=await sb.rpc('sb_admin_enquiries',{u:ADMIN_USERNAME,p:ADMIN_PASSWORD});
    data=rpc.data;error=rpc.error;
  }
  if(error){
    const msg=String(error.message||'');
    const hint=/permission|rls|not confirmed|function|schema cache/i.test(msg)
      ? 'Login worked. To load enquiries, open Supabase → Authentication → Users, open admin@smartbondhu.in, and click Confirm user. Then refresh this page.'
      : msg;
    return document.getElementById('enquiryList').innerHTML=`<p>${esc(hint)}</p>`;
  }
  enquiries=data||[];
  renderEnquiries();
}
function renderEnquiries(){
  const q=(document.getElementById('enquirySearch').value||'').toLowerCase();
  const rows=enquiries.filter(e=>[e.name,e.phone,e.enquiry_code,e.service,e.requirement].join(' ').toLowerCase().includes(q));
  document.getElementById('enquiryList').innerHTML=rows.length?rows.map(e=>`<article class="admin-card">
    <h3>${esc(e.name)} · ${esc(e.enquiry_code)}</h3>
    <div class="admin-meta"><span>${esc(e.phone)}</span><span>${esc(e.service||'')}</span><span class="status ${esc(e.status)}">${esc(e.status)}</span><span>${new Date(e.created_at).toLocaleString()}</span></div>
    <p>${esc(e.requirement)}</p>
    ${e.notes?`<p><b>Notes:</b> ${esc(e.notes)}</p>`:''}
    <div class="admin-actions">
      <select onchange="updateEnquiry('${e.id}',{status:this.value})">
        ${['new','in_review','contacted','quoted','closed'].map(s=>`<option ${s===e.status?'selected':''}>${s}</option>`).join('')}
      </select>
      <button onclick="noteEnquiry('${e.id}')">Add note</button>
      <a class="button small" href="tel:${esc(e.phone)}">Call</a>
    </div>
  </article>`).join(''):'<p>No enquiries yet.</p>';
}
document.getElementById('enquirySearch').addEventListener('input',renderEnquiries);
async function updateEnquiry(id,patch){
  await ensureClient();
  let {error}=await sb.from('enquiries').update(patch).eq('id',id);
  if(error){
    const rpc=await sb.rpc('sb_admin_update_enquiry',{u:ADMIN_USERNAME,p:ADMIN_PASSWORD,eid:id,patch});
    error=rpc.error;
  }
  if(error)alert(error.message);
  await loadEnquiries();
}
window.updateEnquiry=updateEnquiry;
window.noteEnquiry=id=>{
  const cur=enquiries.find(x=>x.id===id);
  openModal(`<div class="admin-form"><h2>Internal note</h2><textarea id="noteVal">${esc(cur?.notes||'')}</textarea><div class="form-actions"><button class="button" onclick="saveNote('${id}')">Save</button></div></div>`);
};
window.saveNote=async id=>{
  await updateEnquiry(id,{notes:document.getElementById('noteVal').value});
  closeModal();
};

function formFields(item,type){
  if(type==='category')return `
    <label>Name</label><input id="f_name" value="${esc(item.name||'')}">
    <label>Description</label><textarea id="f_description">${esc(item.description||'')}</textarea>
    <label>Pills (comma separated)</label><input id="f_pills" value="${esc((item.pills||[]).join(', '))}">
    <label>Emoji</label><input id="f_emoji" value="${esc(item.emoji||'')}">
    <label>Image URL</label><input id="f_image_url" value="${esc(item.image_url||'')}">
    <label>Sort order</label><input id="f_sort_order" type="number" value="${item.sort_order??0}">
    <label class="check"><input id="f_active" type="checkbox" ${item.active!==false?'checked':''}> Visible on website</label>`;
  if(type==='service')return `
    <label>Name</label><input id="f_name" value="${esc(item.name||'')}">
    <label>Description</label><textarea id="f_description">${esc(item.description||'')}</textarea>
    <label>Pricing label</label><input id="f_pricing_label" value="${esc(item.pricing_label||'')}">
    <label>Details</label><textarea id="f_details">${esc(item.details||'')}</textarea>
    <label>Pricing notes</label><textarea id="f_pricing_notes">${esc(item.pricing_notes||'')}</textarea>
    <label>Emoji</label><input id="f_emoji" value="${esc(item.emoji||'')}">
    <label>Image URL</label><input id="f_image_url" value="${esc(item.image_url||'')}">
    <label>Image color</label><input id="f_image_color" value="${esc(item.image_color||'#e9f1e9')}">
    <label>Sort order</label><input id="f_sort_order" type="number" value="${item.sort_order??0}">
    <label class="check"><input id="f_featured" type="checkbox" ${item.featured?'checked':''}> Show in most requested</label>
    <label class="check"><input id="f_active" type="checkbox" ${item.active!==false?'checked':''}> Visible on website</label>`;
  return `
    <label>Question</label><input id="f_question" value="${esc(item.question||'')}">
    <label>Answer</label><textarea id="f_answer">${esc(item.answer||'')}</textarea>
    <label>Sort order</label><input id="f_sort_order" type="number" value="${item.sort_order??0}">
    <label class="check"><input id="f_active" type="checkbox" ${item.active!==false?'checked':''}> Visible on website</label>`;
}

function readCategory(){return{name:f('f_name'),description:f('f_description'),pills:f('f_pills').split(',').map(x=>x.trim()).filter(Boolean),emoji:f('f_emoji'),image_url:f('f_image_url'),sort_order:Number(f('f_sort_order')||0),active:document.getElementById('f_active').checked}}
function readService(){return{name:f('f_name'),description:f('f_description'),pricing_label:f('f_pricing_label'),details:f('f_details'),pricing_notes:f('f_pricing_notes'),emoji:f('f_emoji'),image_url:f('f_image_url'),image_color:f('f_image_color'),sort_order:Number(f('f_sort_order')||0),featured:document.getElementById('f_featured').checked,active:document.getElementById('f_active').checked}}
function readFaq(){return{question:f('f_question'),answer:f('f_answer'),sort_order:Number(f('f_sort_order')||0),active:document.getElementById('f_active').checked}}
function f(id){return document.getElementById(id).value.trim()}

let categoryRows=[], serviceRows=[], faqRows=[];

async function loadCategories(){
  await ensureClient();
  const {data,error}=await sb.from('categories').select('*').order('sort_order');
  if(error)return document.getElementById('categoryList').innerHTML=`<p>${esc(error.message)}</p>`;
  categoryRows=data||[];
  document.getElementById('categoryList').innerHTML=categoryRows.map(c=>`<article class="admin-card"><h3>${esc(c.name)}</h3><p>${esc(c.description||'')}</p><div class="admin-actions"><button onclick="editRow('categories','${c.id}')">Edit</button><button onclick="removeRow('categories','${c.id}')">Delete</button></div></article>`).join('')||'<p>No categories.</p>';
}
async function loadServices(){
  await ensureClient();
  const {data,error}=await sb.from('services').select('*').order('sort_order');
  if(error)return document.getElementById('serviceList').innerHTML=`<p>${esc(error.message)}</p>`;
  serviceRows=data||[];
  document.getElementById('serviceList').innerHTML=serviceRows.map(s=>`<article class="admin-card"><h3>${esc(s.name)}</h3><p>${esc(s.description||'')}</p><div class="admin-meta">${s.featured?'<span>Featured</span>':''}<span>${esc(s.pricing_label||'')}</span></div><div class="admin-actions"><button onclick="editRow('services','${s.id}')">Edit</button><button onclick="removeRow('services','${s.id}')">Delete</button></div></article>`).join('')||'<p>No services.</p>';
}
async function loadFaqs(){
  await ensureClient();
  const {data,error}=await sb.from('faqs').select('*').order('sort_order');
  if(error)return document.getElementById('faqList').innerHTML=`<p>${esc(error.message)}</p>`;
  faqRows=data||[];
  document.getElementById('faqList').innerHTML=faqRows.map(q=>`<article class="admin-card"><h3>${esc(q.question)}</h3><p>${esc(q.answer||'')}</p><div class="admin-actions"><button onclick="editRow('faqs','${q.id}')">Edit</button><button onclick="removeRow('faqs','${q.id}')">Delete</button></div></article>`).join('')||'<p>No FAQs.</p>';
}

window.editRow=(table,id)=>{
  const list=table==='categories'?categoryRows:table==='services'?serviceRows:faqRows;
  const item=id?list.find(x=>x.id===id)||{}:{};
  const type=table==='categories'?'category':table==='services'?'service':'faq';
  openModal(`<div class="admin-form"><h2>${id?'Edit':'Add'} ${type}</h2>${formFields(item,type)}<div class="form-actions"><button class="button" type="button" id="saveBtn">Save</button></div></div>`);
  document.getElementById('saveBtn').onclick=()=>saveRow(table,id||null);
};
window.saveRow=async(table,id)=>{
  const payload=table==='categories'?readCategory():table==='services'?readService():readFaq();
  await ensureClient();
  const q=id?sb.from(table).update(payload).eq('id',id):sb.from(table).insert(payload);
  let {error}=await q;
  if(error){
    const rpc=await sb.rpc('sb_admin_save',{u:ADMIN_USERNAME,p:ADMIN_PASSWORD,entity:table,payload,eid:id||null});
    error=rpc.error;
  }
  if(error)return alert(error.message);
  closeModal();
  if(table==='categories')loadCategories();
  if(table==='services')loadServices();
  if(table==='faqs')loadFaqs();
};
window.removeRow=async(table,id)=>{
  if(!confirm('Delete this item?'))return;
  await ensureClient();
  let {error}=await sb.from(table).delete().eq('id',id);
  if(error){
    const rpc=await sb.rpc('sb_admin_delete',{u:ADMIN_USERNAME,p:ADMIN_PASSWORD,entity:table,eid:id});
    error=rpc.error;
  }
  if(error)return alert(error.message);
  if(table==='categories')loadCategories();
  if(table==='services')loadServices();
  if(table==='faqs')loadFaqs();
};

document.getElementById('addCategory').onclick=()=>editRow('categories',null);
document.getElementById('addService').onclick=()=>editRow('services',null);
document.getElementById('addFaq').onclick=()=>editRow('faqs',null);

boot();
