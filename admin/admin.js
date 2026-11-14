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

// Default sign-in email (just a convenience prefill — the real check is the
// Supabase Auth password, which is NEVER stored in this file).
const ADMIN_EMAIL='admin@smartbondhu.in';

// Storage bucket that holds category/service images.
const IMAGE_BUCKET='catalog-images';

// Backend API (bookings + dashboard live here, not in Supabase).
const BACKEND_API='https://eal5zocqpln7howaxskjjvdmcm0asgdb.lambda-url.ap-south-1.on.aws/api/v1';
const inr=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0});
async function apiGet(path){
  const r=await fetch(BACKEND_API+path,{headers:{'Accept':'application/json'}});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}

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
  const emailField=document.getElementById('authEmail');
  if(emailField&&!emailField.value)emailField.value=ADMIN_EMAIL;
  await ensureClient();
  if(!sb)return;
  try{
    const {data}=await sb.auth.getSession();
    if(data.session)return enterApp();
  }catch(e){}
}

// Real Supabase Auth sign-in. The password is typed by the admin and sent
// straight to Supabase — it is never kept in this file or in the page.
document.getElementById('authSubmit').onclick=async()=>{
  const email=document.getElementById('authEmail').value.trim();
  const password=document.getElementById('authPassword').value;
  authError.hidden=true;
  if(!email||!password)return showErr('Enter your email and password.');
  const btn=document.getElementById('authSubmit');
  btn.disabled=true;
  await ensureClient();
  if(!sb){btn.disabled=false;return showErr('Could not connect. Please try again.');}
  const {error}=await sb.auth.signInWithPassword({email,password});
  btn.disabled=false;
  if(error){
    if(/confirm/i.test(error.message||''))return showErr('This account’s email is not confirmed yet.');
    return showErr('Wrong email or password.');
  }
  document.getElementById('authPassword').value='';
  enterApp();
};

document.getElementById('logoutBtn').onclick=async()=>{
  try{if(sb)await sb.auth.signOut()}catch(e){}
  location.reload();
};

async function enterApp(){
  authScreen.hidden=true;
  appScreen.hidden=false;
  loadDashboard();
  loadBookings();
  await Promise.all([loadEnquiries(),loadDeletions(),loadCategories(),loadServices(),loadFaqs()]);
}

/* ---- Dashboard + Bookings (data comes from the backend API) ---- */
async function loadDashboard(){
  const box=document.getElementById('statGrid');
  if(!box)return;
  box.innerHTML='<p>Loading…</p>';
  try{
    const s=await apiGet('/admin/dashboard/stats');
    const cards=[
      ['Revenue',inr(s.total_revenue),'In selected period'],
      ['Revenue today',inr(s.revenue_today),'Live today'],
      ['Bookings',s.total_bookings,(s.bookings_today||0)+' today'],
      ['Users',s.total_users,(s.new_users_today||0)+' today'],
      ['Pending',s.pending_bookings,'Awaiting action'],
      ['Completed',s.completed_bookings,(s.active_vendors||0)+' active vendors'],
    ];
    box.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">'+cards.map(c=>`
      <div style="background:#fff;border:1px solid #e3ebe3;border-radius:14px;padding:16px"><div style="font-size:12px;color:#6b7f72;font-weight:600;text-transform:uppercase;letter-spacing:.03em">${esc(c[0])}</div><div style="font-size:24px;font-weight:800;color:#163a2b;margin:6px 0 2px">${esc(c[1])}</div><div style="font-size:12px;color:#8aa095">${esc(c[2])}</div></div>`).join('')+'</div>';
  }catch(e){
    box.innerHTML=`<p>Could not load dashboard (${esc(e.message)}). If this says "Failed to fetch", the backend may still be deploying — try again shortly.</p>`;
  }
}

let bookings=[];
async function loadBookings(){
  const box=document.getElementById('bookingList');
  if(!box)return;
  box.innerHTML='<p>Loading…</p>';
  try{
    const data=await apiGet('/admin/bookings?page=1&page_size=100');
    bookings=data.items||[];
    renderBookings();
  }catch(e){
    box.innerHTML=`<p>Could not load bookings (${esc(e.message)}).</p>`;
  }
}
function renderBookings(){
  const q=(document.getElementById('bookingSearch').value||'').toLowerCase();
  const rows=bookings.filter(b=>[b.booking_number,b.customer_name,b.customer_phone,b.service_name].join(' ').toLowerCase().includes(q));
  const box=document.getElementById('bookingList');
  box.innerHTML=rows.length?rows.map(b=>`<article class="admin-card">
    <h3>${esc(b.customer_name||'Customer')} · ${esc(b.booking_number||'')}</h3>
    <div class="admin-meta">
      <span>${esc(b.service_name||'')}</span>
      <span>${esc(b.customer_phone||'')}</span>
      <span class="status ${esc(b.status||'')}">${esc(b.status||'')}</span>
      <span>${b.scheduled_at?new Date(b.scheduled_at).toLocaleString():''}</span>
      <span><b>${esc(inr(b.total_amount))}</b></span>
    </div>
    ${b.address_summary?`<p>${esc(b.address_summary)}</p>`:''}
    <div class="admin-actions">
      ${b.customer_phone?`<a class="button small" href="tel:${esc(b.customer_phone)}">Call</a>`:''}
    </div>
  </article>`).join(''):'<p>No bookings found.</p>';
}

function notAdminHint(error){
  const msg=String(error&&error.message||'');
  if(/permission|rls|policy|denied/i.test(msg))
    return 'You are signed in, but this account is not marked as an admin for this project.';
  return msg||'Could not load.';
}

let deletions=[];
async function loadDeletions(){
  await ensureClient();
  const box=document.getElementById('deletionList');
  if(!sb)return box.innerHTML='<p>Could not connect to Supabase.</p>';
  const {data,error}=await sb.from('deletion_requests').select('*').order('created_at',{ascending:false});
  if(error)return box.innerHTML=`<p>${esc(/schema cache|does not exist|relation|not find/i.test(error.message||'')?'The deletion-requests table is not set up in this project yet. New requests are arriving in the Enquiries tab.':notAdminHint(error))}</p>`;
  deletions=data||[];
  renderDeletions();
}
function renderDeletions(){
  const q=(document.getElementById('deletionSearch').value||'').toLowerCase();
  const rows=deletions.filter(d=>[d.name,d.phone,d.email,d.request_code,d.reason].join(' ').toLowerCase().includes(q));
  const tab=document.querySelector('[data-tab="deletions"]');
  const open=deletions.filter(d=>d.status==='new'||d.status==='verifying').length;
  if(tab)tab.textContent=open?`Deletion requests (${open})`:'Deletion requests';
  document.getElementById('deletionList').innerHTML=rows.length?rows.map(d=>{
    const due=new Date(new Date(d.created_at).getTime()+30*864e5);
    const overdue=(d.status==='new'||d.status==='verifying')&&due<new Date();
    return `<article class="admin-card">
    <h3>${esc(d.name)} · ${esc(d.request_code)}</h3>
    <div class="admin-meta"><span>${esc(d.phone)}</span>${d.email?`<span>${esc(d.email)}</span>`:''}<span>${d.scope==='data'?'Some data only':'Whole account'}</span><span class="status ${esc(d.status)}">${esc(d.status)}</span><span>${new Date(d.created_at).toLocaleString()}</span>${d.completed_at?`<span>Done ${new Date(d.completed_at).toLocaleDateString()}</span>`:`<span${overdue?' style="color:#b23a2c;font-weight:700"':''}>Due by ${due.toLocaleDateString()}</span>`}</div>
    ${d.reason?`<p>${esc(d.reason)}</p>`:''}
    ${d.notes?`<p><b>Notes:</b> ${esc(d.notes)}</p>`:''}
    <div class="admin-actions">
      <select onchange="updateDeletion('${d.id}',{status:this.value})">
        ${['new','verifying','completed','rejected'].map(s=>`<option ${s===d.status?'selected':''}>${s}</option>`).join('')}
      </select>
      <button onclick="noteDeletion('${d.id}')">Add note</button>
      <a class="button small" href="tel:${esc(d.phone)}">Call</a>
    </div>
  </article>`}).join(''):'<p>No deletion requests.</p>';
}
document.getElementById('deletionSearch').addEventListener('input',renderDeletions);
async function updateDeletion(id,patch){
  await ensureClient();
  if(patch.status==='completed'&&!confirm('Mark as completed? Only do this after the customer\'s data has been deleted.'))return loadDeletions();
  const {error}=await sb.from('deletion_requests').update(patch).eq('id',id);
  if(error)alert(error.message);
  await loadDeletions();
}
window.updateDeletion=updateDeletion;
window.noteDeletion=id=>{
  const cur=deletions.find(x=>x.id===id);
  openModal(`<div class="admin-form"><h2>Internal note</h2><textarea id="delNoteVal">${esc(cur?.notes||'')}</textarea><div class="form-actions"><button class="button" onclick="saveDeletionNote('${id}')">Save</button></div></div>`);
};
window.saveDeletionNote=async id=>{
  await updateDeletion(id,{notes:document.getElementById('delNoteVal').value});
  closeModal();
};

let enquiries=[];
async function loadEnquiries(){
  await ensureClient();
  const list=document.getElementById('enquiryList');
  if(!sb)return list.innerHTML='<p>Could not connect to Supabase.</p>';
  const {data,error}=await sb.from('enquiries').select('*').order('created_at',{ascending:false});
  if(error)return list.innerHTML=`<p>${esc(notAdminHint(error))}</p>`;
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
  const {error}=await sb.from('enquiries').update(patch).eq('id',id);
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

/* ---------------------------------------------------------------------------
   Image upload: pick from gallery/device -> compress in the browser ->
   upload to Supabase Storage -> store the public URL in the image_url field.
   --------------------------------------------------------------------------- */

function imageField(item){
  const url=item.image_url||'';
  return `
    <label>Image</label>
    <div class="img-upload">
      <img id="f_image_preview" alt="Preview" style="max-width:140px;max-height:140px;border-radius:10px;object-fit:cover;display:${url?'block':'none'};margin:4px 0 8px;border:1px solid #e3ebe3" src="${esc(url)}">
      <input id="f_image_file" type="file" accept="image/*">
      <div id="f_image_status" class="img-status" style="font-size:13px;color:#4a6a57;min-height:18px;margin:6px 0"></div>
      <input id="f_image_url" type="text" value="${esc(url)}" placeholder="Auto-filled after upload — or paste an image URL">
    </div>`;
}

function compressImage(file,{maxDim=1280,quality=0.82,maxBytes=600*1024}={}){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const objectUrl=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(objectUrl);
      let {width,height}=img;
      if(width>maxDim||height>maxDim){
        if(width>=height){height=Math.round(height*maxDim/width);width=maxDim;}
        else{width=Math.round(width*maxDim/height);height=maxDim;}
      }
      const canvas=document.createElement('canvas');
      canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,width,height);
      const tryExport=q=>canvas.toBlob(b=>{
        if(!b)return reject(new Error('Could not process this image'));
        if(b.size>maxBytes&&q>0.45)return tryExport(Math.round((q-0.12)*100)/100);
        resolve(b);
      },'image/jpeg',q);
      tryExport(quality);
    };
    img.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(new Error('Could not read this image'));};
    img.src=objectUrl;
  });
}

async function uploadCatalogImage(blob,originalName){
  await ensureClient();
  if(!sb)throw new Error('Not connected to Supabase');
  const base=(originalName||'image').toLowerCase().replace(/\.[^.]+$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'image';
  const path=`catalog/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${base}.jpg`;
  const {error}=await sb.storage.from(IMAGE_BUCKET).upload(path,blob,{contentType:'image/jpeg',cacheControl:'3600',upsert:false});
  if(error)throw error;
  const {data}=sb.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function wireImageUpload(){
  const fileInput=document.getElementById('f_image_file');
  if(!fileInput)return;
  const urlInput=document.getElementById('f_image_url');
  const preview=document.getElementById('f_image_preview');
  const status=document.getElementById('f_image_status');
  urlInput.addEventListener('input',()=>{
    if(urlInput.value){preview.src=urlInput.value;preview.style.display='block';}
    else{preview.style.display='none';}
  });
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files&&fileInput.files[0];
    if(!file)return;
    if(!/^image\//.test(file.type)){status.textContent='Please choose an image file.';return;}
    const originalKb=Math.round(file.size/1024);
    status.textContent='Compressing…';
    try{
      const blob=await compressImage(file);
      preview.src=URL.createObjectURL(blob);
      preview.style.display='block';
      const newKb=Math.round(blob.size/1024);
      status.textContent=`Uploading… (${originalKb} KB → ${newKb} KB)`;
      const url=await uploadCatalogImage(blob,file.name);
      urlInput.value=url;
      status.textContent=`Uploaded ✓  ${originalKb} KB → ${newKb} KB`;
    }catch(err){
      status.textContent='Upload failed: '+(err&&err.message?err.message:String(err));
    }
  });
}

function formFields(item,type){
  if(type==='category')return `
    <label>Name</label><input id="f_name" value="${esc(item.name||'')}">
    <label>Description</label><textarea id="f_description">${esc(item.description||'')}</textarea>
    <label>Pills (comma separated)</label><input id="f_pills" value="${esc((item.pills||[]).join(', '))}">
    <label>Emoji</label><input id="f_emoji" value="${esc(item.emoji||'')}">
    ${imageField(item)}
    <label>Sort order</label><input id="f_sort_order" type="number" value="${item.sort_order??0}">
    <label class="check"><input id="f_active" type="checkbox" ${item.active!==false?'checked':''}> Visible on website</label>`;
  if(type==='service')return `
    <label>Name</label><input id="f_name" value="${esc(item.name||'')}">
    <label>Description</label><textarea id="f_description">${esc(item.description||'')}</textarea>
    <label>Pricing label</label><input id="f_pricing_label" value="${esc(item.pricing_label||'')}">
    <label>Details</label><textarea id="f_details">${esc(item.details||'')}</textarea>
    <label>Pricing notes</label><textarea id="f_pricing_notes">${esc(item.pricing_notes||'')}</textarea>
    <label>Emoji</label><input id="f_emoji" value="${esc(item.emoji||'')}">
    ${imageField(item)}
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
  wireImageUpload();
  document.getElementById('saveBtn').onclick=()=>saveRow(table,id||null);
};
window.saveRow=async(table,id)=>{
  const payload=table==='categories'?readCategory():table==='services'?readService():readFaq();
  await ensureClient();
  const q=id?sb.from(table).update(payload).eq('id',id):sb.from(table).insert(payload);
  const {error}=await q;
  if(error)return alert(notAdminHint(error));
  closeModal();
  if(table==='categories')loadCategories();
  if(table==='services')loadServices();
  if(table==='faqs')loadFaqs();
};
window.removeRow=async(table,id)=>{
  if(!confirm('Delete this item?'))return;
  await ensureClient();
  const {error}=await sb.from(table).delete().eq('id',id);
  if(error)return alert(notAdminHint(error));
  if(table==='categories')loadCategories();
  if(table==='services')loadServices();
  if(table==='faqs')loadFaqs();
};

document.getElementById('addCategory').onclick=()=>editRow('categories',null);
document.getElementById('addService').onclick=()=>editRow('services',null);
document.getElementById('addFaq').onclick=()=>editRow('faqs',null);
const _bookingSearch=document.getElementById('bookingSearch');
if(_bookingSearch)_bookingSearch.addEventListener('input',renderBookings);

boot();
