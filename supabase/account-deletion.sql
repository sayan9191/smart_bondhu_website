-- Smart Bondhu — account deletion requests (Google Play "Delete account" URL)
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- Public API (called from delete-account.html with the anon key):
--   POST /rest/v1/rpc/submit_deletion_request
--        { p_name, p_phone, p_email, p_scope, p_reason }  → returns request code, e.g. "DEL-482913"
--   POST /rest/v1/rpc/check_deletion_request
--        { p_code, p_phone }                                → returns status row
-- Admin API (used by /admin):
--   sb_admin_deletion_requests(u, p)
--   sb_admin_update_deletion_request(u, p, rid, patch)

create extension if not exists pgcrypto;

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text unique not null,
  name text not null,
  phone text not null,
  email text,
  scope text not null default 'account',
  reason text default '',
  status text not null default 'new',
  notes text default '',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint deletion_requests_phone_10_digits check (phone ~ '^[6-9][0-9]{9}$'),
  constraint deletion_requests_scope_check check (scope in ('account', 'data')),
  constraint deletion_requests_status_check check (status in ('new', 'verifying', 'completed', 'rejected'))
);

create index if not exists deletion_requests_created_at_idx on public.deletion_requests (created_at desc);
create index if not exists deletion_requests_phone_idx on public.deletion_requests (phone);

alter table public.deletion_requests enable row level security;

-- Nobody reads or writes the table directly from the browser except signed-in admins.
revoke all on public.deletion_requests from anon;
grant select, update on public.deletion_requests to authenticated;
drop policy if exists "admin manage deletion requests" on public.deletion_requests;
create policy "admin manage deletion requests" on public.deletion_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Public: submit a request. Returns the request code.
-- If the same phone already has an open request, returns that code instead of creating a duplicate.
create or replace function public.submit_deletion_request(
  p_name text, p_phone text, p_email text default null, p_scope text default 'account', p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_scope text := coalesce(nullif(btrim(p_scope), ''), 'account');
  v_code text;
begin
  if length(v_phone) = 12 and left(v_phone, 2) = '91' then v_phone := right(v_phone, 10); end if;
  if p_name is null or btrim(p_name) = '' or length(btrim(p_name)) > 100 then raise exception 'Please enter your name'; end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Please enter a valid 10-digit mobile number'; end if;
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'Please enter a valid email address'; end if;
  if v_scope not in ('account', 'data') then raise exception 'Invalid request type'; end if;
  if length(coalesce(p_reason, '')) > 1000 then raise exception 'Reason is too long'; end if;

  select request_code into v_code from public.deletion_requests
   where phone = v_phone and status in ('new', 'verifying')
   order by created_at desc limit 1;
  if v_code is not null then return v_code; end if;

  loop
    v_code := 'DEL-' || lpad(floor(random() * 900000 + 100000)::int::text, 6, '0');
    exit when not exists (select 1 from public.deletion_requests where request_code = v_code);
  end loop;

  insert into public.deletion_requests (request_code, name, phone, email, scope, reason)
  values (v_code, btrim(p_name), v_phone, v_email, v_scope, coalesce(btrim(p_reason), ''));
  return v_code;
end;
$$;

-- Public: check status with request code + the same mobile number.
create or replace function public.check_deletion_request(p_code text, p_phone text)
returns table (request_code text, scope text, status text, created_at timestamptz, completed_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select d.request_code, d.scope, d.status, d.created_at, d.completed_at
  from public.deletion_requests d
  where d.request_code = upper(btrim(p_code))
    and d.phone = right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10);
$$;

-- Admin: list requests (same login check as the other admin functions).
create or replace function public.sb_admin_deletion_requests(u text, p text)
returns setof public.deletion_requests
language plpgsql
security definer
set search_path = public
as $$
begin
  if u is distinct from 'SmartBondhu@2026' or p is distinct from 'Admin@2026' then
    raise exception 'Unauthorized';
  end if;
  return query select * from public.deletion_requests order by created_at desc;
end;
$$;

-- Admin: update status / notes. Sets completed_at when marked completed.
create or replace function public.sb_admin_update_deletion_request(u text, p text, rid uuid, patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if u is distinct from 'SmartBondhu@2026' or p is distinct from 'Admin@2026' then
    raise exception 'Unauthorized';
  end if;
  update public.deletion_requests
     set status = coalesce(patch->>'status', status),
         notes = coalesce(patch->>'notes', notes),
         completed_at = case
           when coalesce(patch->>'status', status) = 'completed' then coalesce(completed_at, now())
           else null end
   where id = rid;
end;
$$;

revoke all on function public.submit_deletion_request(text, text, text, text, text) from public;
revoke all on function public.check_deletion_request(text, text) from public;
revoke all on function public.sb_admin_deletion_requests(text, text) from public;
revoke all on function public.sb_admin_update_deletion_request(text, text, uuid, jsonb) from public;
grant execute on function public.submit_deletion_request(text, text, text, text, text) to anon, authenticated;
grant execute on function public.check_deletion_request(text, text) to anon, authenticated;
grant execute on function public.sb_admin_deletion_requests(text, text) to anon, authenticated;
grant execute on function public.sb_admin_update_deletion_request(text, text, uuid, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
