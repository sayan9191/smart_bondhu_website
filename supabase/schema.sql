-- Smart Bondhu — run once in Supabase SQL Editor
-- Project: https://fecohhbsklscltyixzru.supabase.co

create extension if not exists pgcrypto;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  pills text[] default '{}',
  emoji text default '🔧',
  image_url text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  pricing_label text default '',
  emoji text default '🛠',
  image_url text,
  image_color text default '#e9f1e9',
  details text default '',
  pricing_notes text default '',
  featured boolean default false,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_code text unique not null,
  name text not null,
  phone text not null,
  service text default 'General enquiry',
  requirement text not null,
  status text not null default 'new',
  notes text default '',
  created_at timestamptz default now(),
  constraint enquiries_phone_10_digits check (phone ~ '^[6-9][0-9]{9}$')
);
alter table public.enquiries drop constraint if exists enquiries_phone_10_digits;
alter table public.enquiries add constraint enquiries_phone_10_digits check (phone ~ '^[6-9][0-9]{9}$');

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_phone_idx on public.enquiries (phone);
create index if not exists categories_sort_idx on public.categories (sort_order, name);
create index if not exists services_sort_idx on public.services (featured desc, sort_order, name);

create or replace function public.set_enquiry_code()
returns trigger language plpgsql as $$
begin
  if new.enquiry_code is null or btrim(new.enquiry_code) = '' then
    new.enquiry_code := 'SB-' || lpad(floor(random()*900000 + 100000)::int::text, 6, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_enquiry_code on public.enquiries;
create trigger trg_enquiry_code before insert on public.enquiries
for each row execute procedure public.set_enquiry_code();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.needs_admin_setup()
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.admins);
$$;

create or replace function public.track_enquiry(code text, mobile text)
returns table (
  enquiry_code text,
  service text,
  status text,
  requirement text,
  created_at timestamptz
) language sql stable security definer set search_path = public as $$
  select e.enquiry_code, e.service, e.status, e.requirement, e.created_at
  from public.enquiries e
  where e.enquiry_code = btrim(code)
    and e.phone = regexp_replace(coalesce(mobile,''), '[^0-9]', '', 'g');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins) then
    insert into public.admins (user_id, email) values (new.id, new.email);
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.faqs enable row level security;
alter table public.enquiries enable row level security;

drop policy if exists "admins read own" on public.admins;
create policy "admins read own" on public.admins for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select to anon, authenticated
  using (active = true or public.is_admin());
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read services" on public.services;
create policy "public read services" on public.services for select to anon, authenticated
  using (active = true or public.is_admin());
drop policy if exists "admin write services" on public.services;
create policy "admin write services" on public.services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read faqs" on public.faqs;
create policy "public read faqs" on public.faqs for select to anon, authenticated
  using (active = true or public.is_admin());
drop policy if exists "admin write faqs" on public.faqs;
create policy "admin write faqs" on public.faqs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public insert enquiries" on public.enquiries;
create policy "public insert enquiries" on public.enquiries for insert to anon, authenticated
  with check (true);
drop policy if exists "admin manage enquiries" on public.enquiries;
create policy "admin manage enquiries" on public.enquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.services, public.faqs to anon, authenticated;
grant insert on public.enquiries to anon, authenticated;
grant select, insert, update, delete on public.categories, public.services, public.faqs, public.enquiries to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.track_enquiry(text, text) to anon, authenticated;
grant execute on function public.needs_admin_setup() to anon, authenticated;

insert into public.categories (name, description, pills, emoji, image_url, sort_order)
select v.column1, v.column2, v.column3, v.column4, v.column5, v.column6
from (values
('Home Repairs','Plumbing, electrical and carpentry support.',array['Plumbing','Electrical','Carpentry'],'🔧','https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',1),
('Gadgets & IT','Keep your essential technology running.',array['Smartphone','Laptop repair','Data recovery'],'💻','https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',2),
('Appliances','Care for the appliances you rely on.',array['Washing machine','Refrigerator','RO service'],'🔌','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',3),
('Painting & Wall Decor','Make every wall feel considered.',array['Home painting','Waterproofing','Textures'],'🎨','https://images.unsplash.com/photo-1574359411659-15573a27fd0c?auto=format&fit=crop&w=600&q=80',4),
('Gardening & Plant Care','A little more life around your home.',array['Lawn care','Plant repotting','Kitchen garden'],'🌱','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',5),
('Vehicle Wash & Detailing','Doorstep care for the drive ahead.',array['Car wash','Deep cleaning','Monthly care'],'🚗','https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80',6),
('Domestic Help','Practical help for a lighter routine.',array['Deep cleaning','Maid service','Cook'],'🧹','https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',7),
('Professional Drivers','Reliable support for every journey.',array['One-way trip','Outstation','Monthly driver'],'🛞','assets/professional-driver-cover.png',8),
('Interior & Turnkey Projects','Bring a bigger vision to life.',array['Interiors','Modular kitchen','Wardrobes'],'🛋️','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',9)
) as v
where not exists (select 1 from public.categories);

insert into public.services (name, description, pricing_label, emoji, image_url, image_color, featured, sort_order)
select v.column1, v.column2, v.column3, v.column4, v.column5, v.column6, v.column7, v.column8
from (values
('Tap Repair','Leaks, washers and spindles.','Inspection & Quote','🚰','https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=85','#dce9f2',true,1),
('Electrician','Switches, wiring and fittings.','Inspection & Quote','⚡','https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=85','#fdf1d8',true,2),
('TV Mounting','A clean, secure installation.','Fixed Price','📺','https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=85','#e3e8f5',true,3),
('AC / Appliance Repair','Diagnosis and professional care.','Inspection & Quote','❄','https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=85','#dff0f7',true,4),
('RO Service','Care for cleaner water.','Fixed + Parts','💧','https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=85','#d8ecf7',true,5),
('Home Painting','A considered refresh for every room.','Based on Area / Quantity','🖌','https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=85','#f1e7db',true,6),
('Garden Maintenance','Ongoing green-space care.','Monthly / Recurring','🌿','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=85','#e2efe0',true,7),
('Deep Cleaning','A home that feels fresh again.','Based on Area / Quantity','✨','https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=85','#f3efe7',true,8)
) as v
where not exists (select 1 from public.services);

insert into public.faqs (question, answer, sort_order)
select v.column1, v.column2, v.column3
from (values
('How do I submit an enquiry?','Choose a service or tell us your requirement, add a few details, and submit. Our team will review it and contact you with the appropriate next step.',1),
('How does Smart Bondhu pricing work?','Pricing depends on the service. We label services clearly as fixed price, fixed + parts, inspection + quote, area based or recurring.',2),
('Can I request multiple services?','Yes. Mention all the things you need in the requirement step and we will help organise the right follow-up.',3),
('Do you provide inspection-based services?','Yes. For issues that need a professional assessment, the final pricing is shared after inspection.',4),
('Can I upload photos of the problem?','Yes. The enquiry flow includes an optional photo or video upload field to help us understand your requirement faster.',5),
('How do interior projects work?','Project enquiries move through lead, consultation, design, quotation and execution, with a clear next step at each stage.',6),
('Can I track my enquiry?','Yes. Use Track enquiry with your enquiry ID and mobile number to view the next expected action.',7)
) as v
where not exists (select 1 from public.faqs);

-- Also run supabase/fix-admin.sql so the admin panel can sign in without email confirmation.
