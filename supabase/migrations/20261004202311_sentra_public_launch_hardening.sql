create schema if not exists sentra_private;
revoke all on schema sentra_private from public, anon, authenticated;
create table if not exists sentra_private.server_config (id boolean primary key default true check(id), secret_hash text not null);
alter table sentra_private.server_config enable row level security;
create table if not exists sentra_private.rate_buckets (scope text not null, key text not null, window_start timestamptz not null, count integer not null, primary key(scope,key,window_start));
alter table sentra_private.rate_buckets enable row level security;
create index if not exists sentra_rate_expiry_idx on sentra_private.rate_buckets(window_start);
revoke all on all tables in schema sentra_private from public, anon, authenticated;

create or replace function public.sentra_rate_limit(p_key text, p_scope text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n integer; started timestamptz; period integer; quota integer;
begin
  if p_secret is null or length(p_secret)<>64 or not exists(select 1 from sentra_private.server_config where secret_hash=encode(extensions.digest(p_secret,'sha256'),'hex')) then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_key is null or p_key !~ '^[a-f0-9]{64}$' or p_scope not in ('investigate','connect','save') then raise exception 'Invalid rate scope'; end if;
  period := case when p_scope='save' then 86400 else 60 end;
  quota := case when p_scope='save' then 20 when p_scope='connect' then 6 else 30 end;
  started := to_timestamp(floor(extract(epoch from clock_timestamp()) / period) * period);
  delete from sentra_private.rate_buckets where window_start < clock_timestamp()-interval '2 days';
  insert into sentra_private.rate_buckets(scope,key,window_start,count) values(p_scope,p_key,started,1)
    on conflict(scope,key,window_start) do update set count=least(sentra_private.rate_buckets.count+1,1000000) returning count into n;
  return jsonb_build_object('allowed',n<=quota,'retryAfter',greatest(1,ceil(extract(epoch from started+make_interval(secs=>period)-clock_timestamp()))::integer));
end $$;
revoke all on function public.sentra_rate_limit(text,text,text) from public;
grant execute on function public.sentra_rate_limit(text,text,text) to anon, authenticated;

create unique index if not exists sentra_cases_id_owner_idx on public.sentra_cases(id,user_id);
alter table public.sentra_evidence add constraint sentra_evidence_parent_owner_fk foreign key(case_id,user_id) references public.sentra_cases(id,user_id) on delete cascade;
alter table public.sentra_cases add constraint sentra_cases_text_bounds check(length(input_preview)<=180 and length(case_ref)<=80 and length(explanation)<=4000);
alter table public.sentra_evidence add constraint sentra_evidence_text_bounds check(length(source)<=300 and length(title)<=300 and length(detail)<=4000 and cardinality(tags)<=32 and cardinality(attack_technique_ids)<=32);

create or replace function public.sentra_save_case(p_case jsonb, p_evidence jsonb, p_secret text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); case_id uuid; quota jsonb; item jsonb;
begin
  if uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Sign in to save cases' using errcode='42501'; end if;
  if p_case is null or p_evidence is null or jsonb_typeof(p_case)<>'object' or jsonb_typeof(p_evidence)<>'array' or jsonb_array_length(p_evidence)>100 or octet_length(p_case::text)+octet_length(p_evidence::text)>100000 then raise exception 'Invalid case'; end if;
  quota := public.sentra_rate_limit(encode(extensions.digest(uid::text,'sha256'),'hex'),'save',p_secret);
  if not (quota->>'allowed')::boolean then raise exception 'Daily case storage limit reached'; end if;
  insert into public.sentra_cases(user_id,case_ref,kind,input_preview,risk_score,decision,explanation,scam_fingerprint)
    values(uid,p_case->>'case_ref',p_case->>'kind',p_case->>'input_preview',(p_case->>'risk_score')::integer,p_case->>'decision',p_case->>'explanation',left(p_case->>'scam_fingerprint',80)) returning id into case_id;
  for item in select value from jsonb_array_elements(p_evidence) loop
    insert into public.sentra_evidence(case_id,user_id,source,title,detail,severity,confidence,tags,attack_technique_ids)
      values(case_id,uid,item->>'source',item->>'title',item->>'detail',item->>'severity',(item->>'confidence')::float8,
        array(select jsonb_array_elements_text(coalesce(item->'tags','[]'::jsonb))),array(select jsonb_array_elements_text(coalesce(item->'attack_technique_ids','[]'::jsonb))));
  end loop;
  return case_id;
end $$;
revoke all on function public.sentra_save_case(jsonb,jsonb,text) from public, anon;
grant execute on function public.sentra_save_case(jsonb,jsonb,text) to authenticated;
