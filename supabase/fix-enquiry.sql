-- Run this in Supabase → SQL Editor so website enquiries can be saved.

grant insert on public.enquiries to anon, authenticated;
drop policy if exists "public insert enquiries" on public.enquiries;
create policy "public insert enquiries" on public.enquiries
  for insert to anon, authenticated
  with check (true);

create or replace function public.submit_enquiry(p_name text, p_phone text, p_service text, p_requirement text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare code text;
begin
  if p_name is null or btrim(p_name) = '' then raise exception 'Name required'; end if;
  if p_phone is null or p_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Invalid phone'; end if;
  if p_requirement is null or btrim(p_requirement) = '' then raise exception 'Requirement required'; end if;
  code := 'SB-' || lpad(floor(random()*900000 + 100000)::int::text, 6, '0');
  insert into public.enquiries (enquiry_code, name, phone, service, requirement, status)
  values (code, btrim(p_name), p_phone, coalesce(nullif(btrim(p_service), ''), 'General enquiry'), btrim(p_requirement), 'new');
  return code;
end;
$$;
grant execute on function public.submit_enquiry(text, text, text, text) to anon, authenticated;
