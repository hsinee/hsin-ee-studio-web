-- ============================================================
-- 芯伊 HSIN.EE 線上預約系統 —— Supabase 資料表與函式
-- 使用方式：Supabase 後台 → SQL Editor → 貼上整份 → Run
-- ============================================================
-- 安全設計：
--   兩張表都開啟 RLS 且「不給」前台任何讀寫權限，
--   前台只能透過下面三個函式做事：
--     check_customer  → 只回傳價格身分（首次 / 回訪 / 原價），不會洩漏任何客人資料
--     taken_slots     → 只回傳某天已被預約的時段
--     create_booking  → 新增一筆預約
--   你自己在 Supabase 後台（Table Editor）可以看到全部資料。
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.booking_customers (
  phone text primary key,
  name text not null,
  -- 舊客人匯入用：填上最近一次到店日期，系統就會判斷為回訪 / 原價
  last_visit_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  phone text not null references public.booking_customers (phone) on update cascade,
  name text not null,
  booking_date date not null,
  booking_time text not null,
  items jsonb not null default '[]'::jsonb,
  price_tier text not null check (price_tier in ('trial', 'revisit', 'normal')),
  total integer not null default 0,
  deposit integer not null default 0,
  note text,
  -- pending：待匯訂金 / confirmed：已確認 / completed：已完成 / cancelled：已取消
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_phone_idx on public.bookings (phone);
create index if not exists bookings_date_idx on public.bookings (booking_date);

alter table public.booking_customers enable row level security;
alter table public.bookings enable row level security;
-- 不建立任何 policy = 前台 (anon) 完全無法直接讀寫這兩張表

-- ------------------------------------------------------------
-- 判斷價格身分
-- ------------------------------------------------------------
create or replace function public.check_customer(p_phone text, p_date date, p_window_days int default 42)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_history boolean;
  v_last date;
begin
  select exists (select 1 from bookings where phone = p_phone and status <> 'cancelled')
      or exists (select 1 from booking_customers where phone = p_phone and last_visit_date is not null)
    into v_has_history;

  if not v_has_history then
    return 'trial';
  end if;

  select max(d) into v_last from (
    select booking_date as d from bookings
      where phone = p_phone and status <> 'cancelled' and booking_date <= p_date
    union all
    select last_visit_date from booking_customers
      where phone = p_phone and last_visit_date <= p_date
  ) t;

  -- 只有比這次更晚的預約（例如先約了下個月、再補約這週）→ 視為回訪
  if v_last is null or p_date - v_last <= p_window_days then
    return 'revisit';
  end if;
  return 'normal';
end;
$$;

-- ------------------------------------------------------------
-- 某天已被預約的時段
-- ------------------------------------------------------------
create or replace function public.taken_slots(p_date date)
returns setof text
language sql
security definer
set search_path = public
as $$
  select booking_time from bookings where booking_date = p_date and status <> 'cancelled';
$$;

-- ------------------------------------------------------------
-- 新增預約
-- ------------------------------------------------------------
create or replace function public.create_booking(
  p_name text,
  p_phone text,
  p_date date,
  p_time text,
  p_items jsonb,
  p_total int,
  p_deposit int,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_tier text;
begin
  if coalesce(trim(p_name), '') = '' or p_phone !~ '^09[0-9]{8}$' then
    raise exception 'INVALID_INPUT';
  end if;
  if p_date < current_date then
    raise exception 'INVALID_DATE';
  end if;
  if exists (select 1 from bookings where booking_date = p_date and booking_time = p_time and status <> 'cancelled') then
    raise exception 'SLOT_TAKEN';
  end if;

  -- 價格身分以伺服器判斷為準
  v_tier := check_customer(p_phone, p_date);

  insert into booking_customers (phone, name) values (p_phone, trim(p_name))
    on conflict (phone) do update set name = excluded.name;

  v_code := 'HE' || to_char(p_date, 'MMDD') || upper(substr(md5(random()::text), 1, 4));

  insert into bookings (code, phone, name, booking_date, booking_time, items, price_tier, total, deposit, note)
    values (v_code, p_phone, trim(p_name), p_date, p_time, p_items, v_tier, p_total, p_deposit, nullif(trim(p_note), ''));

  return v_code;
end;
$$;

revoke all on function public.check_customer(text, date, int) from public;
revoke all on function public.taken_slots(date) from public;
revoke all on function public.create_booking(text, text, date, text, jsonb, int, int, text) from public;
grant execute on function public.check_customer(text, date, int) to anon, authenticated;
grant execute on function public.taken_slots(date) to anon, authenticated;
grant execute on function public.create_booking(text, text, date, text, jsonb, int, int, text) to anon, authenticated;
