-- Run once in Supabase → SQL Editor so the admin panel can open without email confirmation.

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
where email = 'admin@smartbondhu.in';

create or replace function public.sb_admin_enquiries(u text, p text)
returns setof public.enquiries
language plpgsql
security definer
set search_path = public
as $$
begin
  if u is distinct from 'SmartBondhu@2026' or p is distinct from 'Admin@2026' then
    raise exception 'Unauthorized';
  end if;
  return query select * from public.enquiries order by created_at desc;
end;
$$;

create or replace function public.sb_admin_update_enquiry(u text, p text, eid uuid, patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if u is distinct from 'SmartBondhu@2026' or p is distinct from 'Admin@2026' then
    raise exception 'Unauthorized';
  end if;
  update public.enquiries
     set status = coalesce(patch->>'status', status),
         notes = coalesce(patch->>'notes', notes)
   where id = eid;
end;
$$;

create or replace function public.sb_admin_save(u text, p text, entity text, payload jsonb, eid uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare rid uuid;
begin
  if u is distinct from 'SmartBondhu@2026' or p is distinct from 'Admin@2026' then
    raise exception 'Unauthorized';
  end if;
  if entity not in ('categories','services','faqs') then
    raise exception 'Invalid entity';
  end if;
  if entity = 'categories' then
    if eid is null then
      insert into public.categories (name, description, pills, emoji, image_url, sort_order, active)
      values (
        payload->>'name',
        coalesce(payload->>'description',''),
        coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(payload->'pills','[]'::jsonb)) as x), '{}'),
        coalesce(payload->>'emoji','🔧'),
        payload->>'image_url',
        coalesce((payload->>'sort_order')::int,0),
        coalesce((payload->>'active')::boolean,true)
      ) returning id into rid;
    else
      update public.categories set
        name = payload->>'name',
        description = coalesce(payload->>'description',''),
        pills = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(payload->'pills','[]'::jsonb)) as x), '{}'),
        emoji = coalesce(payload->>'emoji','🔧'),
        image_url = payload->>'image_url',
        sort_order = coalesce((payload->>'sort_order')::int,0),
        active = coalesce((payload->>'active')::boolean,true)
      where id = eid;
      rid := eid;
    end if;
  elsif entity = 'services' then
    if eid is null then
      insert into public.services (name, description, pricing_label, details, pricing_notes, emoji, image_url, image_color, featured, sort_order, active)
      values (
        payload->>'name',
        coalesce(payload->>'description',''),
        coalesce(payload->>'pricing_label',''),
        coalesce(payload->>'details',''),
        coalesce(payload->>'pricing_notes',''),
        coalesce(payload->>'emoji','🛠'),
        payload->>'image_url',
        coalesce(payload->>'image_color','#e9f1e9'),
        coalesce((payload->>'featured')::boolean,false),
        coalesce((payload->>'sort_order')::int,0),
        coalesce((payload->>'active')::boolean,true)
      ) returning id into rid;
    else
      update public.services set
        name = payload->>'name',
        description = coalesce(payload->>'description',''),
        pricing_label = coalesce(payload->>'pricing_label',''),
        details = coalesce(payload->>'details',''),
        pricing_notes = coalesce(payload->>'pricing_notes',''),
        emoji = coalesce(payload->>'emoji','🛠'),
        image_url = payload->>'image_url',
        image_color = coalesce(payload->>'image_color','#e9f1e9'),
        featured = coalesce((payload->>'featured')::boolean,false),
        sort_order = coalesce((payload->>'sort_order')::int,0),
        active = coalesce((payload->>'active')::boolean,true)
      where id = eid;
      rid := eid;
    end if;
  else
    if eid is null then
      insert into public.faqs (question, answer, sort_order, active)
      values (
        payload->>'question',
        payload->>'answer',
        coalesce((payload->>'sort_order')::int,0),
        coalesce((payload->>'active')::boolean,true)
      ) returning id into rid;
    else
      update public.faqs set
        question = payload->>'question',
        answer = payload->>'answer',
        sort_order = coalesce((payload->>'sort_order')::int,0),
        active = coalesce((payload->>'active')::boolean,true)
      where id = eid;
      rid := eid;
    end if;
  end if;
  return rid;
end;
$$;

create or replace function public.sb_admin_delete(u text, p text, entity text, eid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if u is distinct from 'SmartBondhu@2026' or p is distinct from 'Admin@2026' then
    raise exception 'Unauthorized';
  end if;
  if entity not in ('categories','services','faqs') then
    raise exception 'Invalid entity';
  end if;
  if entity = 'categories' then delete from public.categories where id = eid;
  elsif entity = 'services' then delete from public.services where id = eid;
  else delete from public.faqs where id = eid;
  end if;
end;
$$;

grant execute on function public.sb_admin_enquiries(text, text) to anon, authenticated;
grant execute on function public.sb_admin_update_enquiry(text, text, uuid, jsonb) to anon, authenticated;
grant execute on function public.sb_admin_save(text, text, text, jsonb, uuid) to anon, authenticated;
grant execute on function public.sb_admin_delete(text, text, text, uuid) to anon, authenticated;
