const FALLBACK_CATEGORIES=[
{name:'Home Repairs',description:'Plumbing, electrical and carpentry support.',pills:['Plumbing','Electrical','Carpentry'],emoji:'🔧',image_url:'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80'},
{name:'Gadgets & IT',description:'Keep your essential technology running.',pills:['Smartphone','Laptop repair','Data recovery'],emoji:'💻',image_url:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'},
{name:'Appliances',description:'Care for the appliances you rely on.',pills:['Washing machine','Refrigerator','RO service'],emoji:'🔌',image_url:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80'},
{name:'Painting & Wall Decor',description:'Make every wall feel considered.',pills:['Home painting','Waterproofing','Textures'],emoji:'🎨',image_url:'https://images.unsplash.com/photo-1574359411659-15573a27fd0c?auto=format&fit=crop&w=600&q=80'},
{name:'Gardening & Plant Care',description:'A little more life around your home.',pills:['Lawn care','Plant repotting','Kitchen garden'],emoji:'🌱',image_url:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80'},
{name:'Vehicle Wash & Detailing',description:'Doorstep care for the drive ahead.',pills:['Car wash','Deep cleaning','Monthly care'],emoji:'🚗',image_url:'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80'},
{name:'Domestic Help',description:'Practical help for a lighter routine.',pills:['Deep cleaning','Maid service','Cook'],emoji:'🧹',image_url:'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'},
{name:'Professional Drivers',description:'Reliable support for every journey.',pills:['One-way trip','Outstation','Monthly driver'],emoji:'🛞',image_url:'assets/professional-driver-cover.png'},
{name:'Interior & Turnkey Projects',description:'Bring a bigger vision to life.',pills:['Interiors','Modular kitchen','Wardrobes'],emoji:'🛋️',image_url:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80'}
];
const FALLBACK_POPULAR=[
{name:'Tap Repair',description:'Leaks, washers and spindles.',pricing_label:'Inspection & Quote',emoji:'🚰',image_url:'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=85',image_color:'#dce9f2'},
{name:'Electrician',description:'Switches, wiring and fittings.',pricing_label:'Inspection & Quote',emoji:'⚡',image_url:'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=85',image_color:'#fdf1d8'},
{name:'TV Mounting',description:'A clean, secure installation.',pricing_label:'Fixed Price',emoji:'📺',image_url:'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=85',image_color:'#e3e8f5'},
{name:'AC / Appliance Repair',description:'Diagnosis and professional care.',pricing_label:'Inspection & Quote',emoji:'❄',image_url:'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=85',image_color:'#dff0f7'},
{name:'RO Service',description:'Care for cleaner water.',pricing_label:'Fixed + Parts',emoji:'💧',image_url:'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=85',image_color:'#d8ecf7'},
{name:'Home Painting',description:'A considered refresh for every room.',pricing_label:'Based on Area / Quantity',emoji:'🖌',image_url:'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=85',image_color:'#f1e7db'},
{name:'Garden Maintenance',description:'Ongoing green-space care.',pricing_label:'Monthly / Recurring',emoji:'🌿',image_url:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=85',image_color:'#e2efe0'},
{name:'Deep Cleaning',description:'A home that feels fresh again.',pricing_label:'Based on Area / Quantity',emoji:'✨',image_url:'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=85',image_color:'#f3efe7'}
];
const FALLBACK_FAQS=[
{question:'How do I submit an enquiry?',answer:'Choose a service or tell us your requirement, add a few details, and submit. Our team will review it and contact you with the appropriate next step.'},
{question:'How does Smart Bondhu pricing work?',answer:'Pricing depends on the service. We label services clearly as fixed price, fixed + parts, inspection + quote, area based or recurring.'},
{question:'Can I request multiple services?',answer:'Yes. Mention all the things you need in the requirement step and we will help organise the right follow-up.'},
{question:'Do you provide inspection-based services?',answer:'Yes. For issues that need a professional assessment, the final pricing is shared after inspection.'},
{question:'Can I upload photos of the problem?',answer:'Yes. The enquiry flow includes an optional photo or video upload field to help us understand your requirement faster.'},
{question:'How do interior projects work?',answer:'Project enquiries move through lead, consultation, design, quotation and execution, with a clear next step at each stage.'},
{question:'Can I track my enquiry?',answer:'Yes. Use Track enquiry with your enquiry ID and mobile number to view the next expected action.'}
];

let categories=FALLBACK_CATEGORIES.slice();
let popular=FALLBACK_POPULAR.slice();
let faqs=FALLBACK_FAQS.slice();

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function getSb(){
  const cfg=window.SB_CONFIG||{};
  const key=(cfg.supabaseAnonKey||'').trim();
  if(!cfg.supabaseUrl||!key||key.startsWith('PASTE_'))return null;
  if(!window.supabase)return null;
  if(!window._sb)window._sb=window.supabase.createClient(cfg.supabaseUrl,key);
  return window._sb;
}

function renderSite(){
  const catEl=document.getElementById('categoryGrid');
  const popEl=document.getElementById('popularGrid');
  const faqEl=document.getElementById('accordion');
  if(catEl)catEl.innerHTML=categories.map(c=>`<article class="category-card" onclick='showService(${JSON.stringify(c.name)})' tabindex="0" role="button"><div class="category-photo" style="background-image:url('${esc(c.image_url||'')}');background-size:cover;background-position:center"><span class="photo-overlay"></span></div><div class="category-content"><h3>${esc(c.name)}</h3><p>${esc(c.description||'')}</p><div class="service-pills">${(c.pills||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div><button class="card-link" onclick='event.stopPropagation();showService(${JSON.stringify(c.name)})'>Explore services <i>→</i></button></div></article>`).join('');
  if(popEl)popEl.innerHTML=popular.map(p=>`<article class="service-card"><div class="service-image" style="background-image:url('${esc(p.image_url||'')}');background-color:${esc(p.image_color||'#e9f1e9')}"></div><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><span class="pricing-tag">${esc(p.pricing_label||'')}</span><button onclick='showService(${JSON.stringify(p.name)})'>View details →</button></article>`).join('');
  if(faqEl)faqEl.innerHTML=faqs.map(f=>`<div class="faq-item"><button class="faq-question" onclick="this.parentElement.classList.toggle('open')">${esc(f.question)} <span>+</span></button><div class="faq-answer">${esc(f.answer)}</div></div>`).join('');
}

async function loadFromSupabase(){
  const sb=getSb();
  if(!sb){renderSite();return}
  try{
    const [{data:cats},{data:svcs},{data:faqRows}]=await Promise.all([
      sb.from('categories').select('*').eq('active',true).order('sort_order'),
      sb.from('services').select('*').eq('active',true).order('sort_order'),
      sb.from('faqs').select('*').eq('active',true).order('sort_order')
    ]);
    if(cats?.length)categories=cats.map(c=>({...c,pills:c.pills||[]}));
    if(svcs?.length){
      const featured=svcs.filter(s=>s.featured);
      popular=(featured.length?featured:svcs).map(s=>s);
    }
    if(faqRows?.length)faqs=faqRows;
  }catch(err){console.warn('Supabase load skipped',err)}
  renderSite();
}

window.addEventListener('scroll',()=>document.getElementById('nav')?.classList.toggle('scrolled',scrollY>20));
function toggleMenu(){document.getElementById('mobileMenu').classList.toggle('open')}
document.getElementById('mobileMenu')?.addEventListener('click',e=>{if(e.target.closest('a,button'))document.getElementById('mobileMenu').classList.remove('open')});
function openModal(content){document.getElementById('modalContent').innerHTML=content;document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
document.getElementById('modal')?.addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.querySelectorAll('.quote-trigger').forEach(b=>b.addEventListener('click',showEnquiry));

function showEnquiry(){
  const names=categories.map(c=>c.name);
  openModal(`<div class="form-step active"><p class="eyebrow"><span></span> Step 1 of 3</p><h2>What can we help<br>you with?</h2><p class="modal-sub">Choose a service to start your enquiry.</p><div class="choice-grid">${names.slice(0,8).map(n=>`<button class="choice" onclick="selectChoice(this)">${esc(n)}</button>`).join('')}</div><div class="form-actions"><span class="form-count">A few simple questions. No commitment.</span><button class="button" onclick="nextStep(1)">Continue <span>→</span></button></div></div><div class="form-step"><p class="eyebrow"><span></span> Step 2 of 3</p><h2>Tell us a little more.</h2><p class="modal-sub">Not sure of the technical details? Describe the problem in your own words.</p><label>Your requirement <i class="req">*</i></label><textarea id="requirement" required placeholder="Describe your requirement or the problem you are facing."></textarea><label>Have photos or a video? <small>(optional)</small></label><input type="file" accept="image/*,video/*"><div class="form-actions"><button class="text-btn" onclick="backStep(0)">← Back</button><button class="button" onclick="nextStep(2)">Continue <span>→</span></button></div></div><div class="form-step"><p class="eyebrow"><span></span> Step 3 of 3</p><h2>Where should we<br>follow up?</h2><p class="modal-sub">Name and mobile number are required so our team can reach you.</p><label>Your name <i class="req">*</i></label><input id="name" required placeholder="Name"><label>Mobile number <i class="req">*</i></label><input id="phone" type="tel" inputmode="numeric" maxlength="10" required placeholder="10-digit mobile number"><div class="form-actions"><button class="text-btn" onclick="backStep(1)">← Back</button><button class="button" onclick="submitEnquiry()">Submit enquiry <span>→</span></button></div></div>`);
  limitPhoneInput(document.getElementById('phone'));
}
function selectChoice(el){document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');const ta=document.getElementById('requirement');if(ta)ta.placeholder=serviceHint(el.textContent.trim())}
function serviceHint(s){const hints={'Home Repairs':'For example: My kitchen tap has been leaking for two days.','Tap Repair':'For example: The tap in my kitchen keeps leaking and one washer is worn out.','Electrician':'For example: One of my switches stopped working and a plug point sparks.','TV Mounting':'For example: I just bought a 43-inch TV and need it mounted on the wall.','AC / Appliance Repair':'For example: My AC is not cooling properly and it makes a noise.','Appliances':'For example: My washing machine stops mid-cycle and does not drain.','RO Service':'For example: My RO water purifier is leaking and water tastes different.','Gadgets & IT':'For example: My phone screen is cracked and it does not charge.','Laptop repair':'For example: My laptop is slow and overheats quickly.','Painting & Wall Decor':'For example: I want to repaint my living room walls.','Home Painting':'For example: I would like a fresh coat of paint in my bedroom.','Gardening & Plant Care':'For example: My lawn needs care and the plants are turning dry.','Garden Maintenance':'For example: Please help with weekly lawn mowing and plant care.','Vehicle Wash & Detailing':'For example: I need a deep interior and exterior car wash.','Domestic Help':'For example: I need help with regular cleaning and cooking.','Deep Cleaning':'For example: I want a complete deep cleaning of my home.','Professional Drivers':'For example: I need a monthly driver who knows the local routes.','Interior & Turnkey Projects':'For example: I want to renovate my modular kitchen.'};return hints[s]||'Describe your requirement or the problem you are facing.'}
function validateRequirement(){const v=document.getElementById('requirement')?.value.trim()||'';if(!v){alert('Please describe your requirement before continuing.');return false}return true}
function digitsOnly(v){return String(v||'').replace(/\D/g,'').slice(0,10)}
function limitPhoneInput(el){
  if(!el||el.dataset.phoneBound)return;
  el.dataset.phoneBound='1';
  el.setAttribute('maxlength','10');
  el.setAttribute('inputmode','numeric');
  el.setAttribute('pattern','[6-9][0-9]{9}');
  el.setAttribute('autocomplete','tel');
  const clamp=()=>{el.value=digitsOnly(el.value)};
  el.addEventListener('input',clamp);
  el.addEventListener('blur',clamp);
  el.addEventListener('paste',e=>{
    e.preventDefault();
    const pasted=(e.clipboardData||window.clipboardData).getData('text');
    el.value=digitsOnly(pasted);
  });
  el.addEventListener('keydown',e=>{
    const ok=['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
    if(ok.includes(e.key)||e.ctrlKey||e.metaKey)return;
    if(!/^\d$/.test(e.key))e.preventDefault();
    if(/^\d$/.test(e.key)&&digitsOnly(el.value).length>=10&&el.selectionStart===el.selectionEnd)e.preventDefault();
  });
}
function validateContact(){
  const name=document.getElementById('name')?.value.trim()||'';
  const phone=digitsOnly(document.getElementById('phone')?.value);
  const el=document.getElementById('phone');
  if(el)el.value=phone;
  let err='';
  if(!name)err+='Please enter your name.\n';
  if(!phone)err+='Please enter your mobile number.\n';
  else if(phone.length!==10)err+='Mobile number must be exactly 10 digits.\n';
  else if(!/^[6-9]\d{9}$/.test(phone))err+='Enter a valid 10-digit Indian mobile number.\n';
  if(err){alert(err);return false}
  return true;
}
function nextStep(n){if(n===2&&!validateRequirement())return;const steps=document.querySelectorAll('.form-step');steps.forEach(x=>x.classList.remove('active'));steps[n].classList.add('active')}
function backStep(n){if(n===0){const ta=document.getElementById('requirement');if(ta)ta.value='';const f=document.querySelector('.form-step input[type=file]');if(f)f.value=''}nextStep(n)}

async function submitEnquiry(){
  if(!validateRequirement()||!validateContact())return;
  const name=document.getElementById('name')?.value.trim()||'';
  const phone=digitsOnly(document.getElementById('phone')?.value);
  const requirement=document.getElementById('requirement')?.value.trim()||'';
  const service=document.querySelector('.choice.selected')?.textContent.trim()||'General enquiry';
  const sb=getSb();
  if(!sb){
    alert('Enquiry could not be saved to Supabase. Add your project anon key in config.js, then submit again.');
    return;
  }
  const enquiry_code='SB-'+Math.floor(100000+Math.random()*899999);
  const {data,error}=await sb.from('enquiries').insert({enquiry_code,name,phone,service,requirement,status:'new'}).select('enquiry_code').single();
  if(error){
    alert('Could not save your enquiry in Supabase. Check that schema.sql was run, then try again.\n\n'+(error.message||''));
    console.error(error);
    return;
  }
  const id=data?.enquiry_code||enquiry_code;
  openModal(`<p class="eyebrow"><span></span> Enquiry submitted</p><h2>Your enquiry is with <em>Smart Bondhu.</em></h2><p class="modal-sub">Thank you${name?', '+esc(name):''}! Our team will review your enquiry and contact you on ${esc(phone)} shortly.</p><div class="confirmation"><b>${esc(id)}</b><span>Your enquiry ID · save it to track your request</span></div><div class="service-detail"><div class="detail-meta"><span>${esc(service)}</span><span>Expected next step: Review & follow-up</span></div></div><div class="enquiry-brief"><b>Your requirement:</b><span>${esc(requirement)}</span></div><button class="button" onclick="closeModal()">Done <span>→</span></button>`);
}

function showTrack(){openModal(`<p class="eyebrow"><span></span> Enquiry support</p><h2>Track your enquiry.</h2><p class="modal-sub">Enter your enquiry ID and mobile number to see the expected next step.</p><label>Enquiry ID</label><input id="trackId" placeholder="e.g. SB-123456"><label>Mobile number</label><input id="trackPhone" type="tel" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number"><div class="form-actions"><span></span><button class="button" onclick="trackEnquiry()">Track enquiry <span>→</span></button></div><div id="trackOutput"></div>`);limitPhoneInput(document.getElementById('trackPhone'))}
async function trackEnquiry(){
  const id=document.getElementById('trackId').value.trim();
  const phone=(document.getElementById('trackPhone')?.value||'').replace(/[\s-]/g,'');
  const out=document.getElementById('trackOutput');
  const sb=getSb();
  if(sb&&id&&phone){
    const {data,error}=await sb.rpc('track_enquiry',{code:id,mobile:phone});
    if(!error&&data?.length){
      const row=data[0];
      out.innerHTML=`<div class="track-result"><b>${esc(row.enquiry_code)}</b><br><span>Status: ${esc(row.status)}. Service: ${esc(row.service)}. A Smart Bondhu team member will follow up with the appropriate next step.</span></div>`;
      return;
    }
  }
  out.innerHTML=`<div class="track-result"><b>${esc(id||'SB-XXXXXX')}</b><br><span>We’re ready to review your requirement. A Smart Bondhu team member will follow up with the appropriate next step.</span></div>`;
}

function findNamed(name){
  return popular.find(p=>p.name===name)||categories.find(c=>c.name===name);
}
function showService(name){
  const item=findNamed(name)||{name,description:'Professional help, when your home needs it.',pricing_label:'Transparent pricing model'};
  openModal(`<div class="service-detail"><p class="eyebrow"><span></span> Smart Bondhu service</p><h2>${esc(item.name)}</h2><p class="modal-sub">${esc(item.description||'Professional help, when your home needs it.')}</p><div class="detail-meta"><span>${esc(item.pricing_label||'Transparent pricing model')}</span><span>Easy enquiry</span><span>Professional follow-up</span></div><h3>What’s included</h3><p>${esc(item.details||'Share your requirement, receive the right guidance, and understand the suitable next step or quote before you proceed.')}</p><h3>Pricing</h3><p>${esc(item.pricing_notes||'Final pricing depends on service requirements and, where needed, a professional inspection.')}</p><button class="button" onclick="showEnquiry()">Send enquiry <span>→</span></button></div>`);
}
function quickSearch(value){document.getElementById('serviceSearch').value=value;searchService()}
function searchService(){
  const q=document.getElementById('serviceSearch').value.trim();
  if(!q){document.getElementById('serviceSearch').focus();return}
  const query=q.toLowerCase();
  const hits=new Map();
  const push=n=>{const s=findNamed(n);if(s)hits.set(n,s)};
  categories.forEach(c=>{const text=(c.name+' '+(c.description||'')+' '+(c.pills||[]).join(' ')).toLowerCase();(text.includes(query)||Object.entries(aliases).some(([k,v])=>query.includes(k)&&v===c.name))&&push(c.name)});
  popular.forEach(p=>{const text=(p.name+' '+(p.description||'')).toLowerCase();text.includes(query)&&push(p.name)});
  Object.entries(aliases).forEach(([k,v])=>{query.includes(k)&&push(v)});
  const list=hits.size?[...hits.keys()].slice(0,6):null;
  if(!list)return openModal(`<p class="eyebrow"><span></span> Smart match</p><h2>Not sure yet?<br><em>We’ll help.</em></h2><p class="modal-sub">We couldn’t find an exact match for “${esc(q)}”. Tell us what’s happening and our team will guide you to the right service.</p><div class="form-actions"><button class="text-btn" onclick="closeModal()">Close</button><button class="button" onclick="showEnquiry()">Send an enquiry <span>→</span></button></div>`);
  openModal(`<p class="eyebrow"><span></span> Smart match</p><h2>We found<br><em>help for you.</em></h2><p class="modal-sub">Based on “${esc(q)}”, these services best match your need. Choose one to continue.</p><div class="search-results">${list.map(n=>{const s=findNamed(n);const em=s?.emoji||'🛠';return `<button class="result-card" onclick="showService('${esc(n)}')"><b>${em}</b><span>${esc(n)}</span><i>→</i></button>`}).join('')}</div><div class="form-actions"><button class="text-btn" onclick="closeModal()">Keep exploring</button><button class="button" onclick="showEnquiry()">Skip, send enquiry <span>→</span></button></div>`);
}
const aliases={'plumber':'Home Repairs','plumbing':'Home Repairs','electrical':'Home Repairs','electrician':'Home Repairs','carpenter':'Home Repairs','carpentry':'Home Repairs','paint':'Painting & Wall Decor','painting':'Painting & Wall Decor','painter':'Painting & Wall Decor','wall':'Painting & Wall Decor','clean':'Domestic Help','cleaning':'Domestic Help','maid':'Domestic Help','cook':'Domestic Help','driver':'Professional Drivers','car':'Vehicle Wash & Detailing','vehicle':'Vehicle Wash & Detailing','car wash':'Vehicle Wash & Detailing','interior':'Interior & Turnkey Projects','interiors':'Interior & Turnkey Projects','kitchen':'Interior & Turnkey Projects','wardrobe':'Interior & Turnkey Projects','phone':'Gadgets & IT','smartphone':'Gadgets & IT','laptop':'Gadgets & IT','computer':'Gadgets & IT','data':'Gadgets & IT','tv':'TV Mounting','mounting':'TV Mounting','garden':'Garden Maintenance','lawn':'Garden Maintenance','plant':'Garden Maintenance','ac':'AC / Appliance Repair','appliance':'AC / Appliance Repair'};
document.getElementById('serviceSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')searchService()});
function openAllServices(){document.getElementById('services').scrollIntoView({behavior:'smooth'})}
function showContact(){openModal(`<p class="eyebrow"><span></span> Contact Smart Bondhu</p><h2>Let’s solve it<br><em>together.</em></h2><p class="modal-sub">Share your service requirement and our team will contact you shortly.</p><div class="contact-card"><b>Call us</b><span><a href="tel:+918910754862" style="color:var(--green);font-weight:600;font-size:16px">+91 89107 54862</a><br>Monday – Sunday · 9 AM – 8 PM</span></div><div class="contact-card"><b>Visit us</b><span>Samali Ghosh Para, P.O. Nahazari<br>P.S. Bishnupur, Kolkata — 700104</span></div><div class="map-frame"><iframe src="https://maps.google.com/maps?q=Samali%20Ghosh%20Para%2C%20Nahazari%2C%20Bishnupur%2C%20Kolkata%2C%20West%20Bengal%20%20700104&z=14&output=embed" width="100%" height="220" style="border:0;border-radius:10px" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div><div class="form-actions"><a href="tel:+918910754862" class="button" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;background:var(--green);color:#fff">Call +91 89107 54862</a></div><button class="button" onclick="showEnquiry()" style="margin-top:10px;width:100%">Get a service quote <span>→</span></button>`)}
function showHelp(){openModal(`<p class="eyebrow"><span></span> Need help?</p><h2>We’re here to<br><em>guide you.</em></h2><p class="modal-sub">Not sure which service to choose? Tell us about the problem and we’ll help you find the right next step.</p><button class="button" onclick="showEnquiry()">Start an enquiry <span>→</span></button>`)}
function matchNeed(need){openModal(`<p class="eyebrow"><span></span> Bondhu Match</p><h2>We’ve got a<br><em>good starting point.</em></h2><p class="modal-sub">You selected: “${esc(need)}”</p><div class="search-result"><b>Here’s what happens next</b><br>Tell us a little more in your own words. Smart Bondhu will guide your enquiry to the right service and next step.</div><div class="form-actions"><button class="text-btn" onclick="closeModal()">Choose again</button><button class="button" onclick="showEnquiry()">Continue <span>→</span></button></div>`)}

renderSite();
loadFromSupabase();
