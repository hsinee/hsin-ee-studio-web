-- HSIN.EE 工作室後台 — Supabase 資料表設定
-- 在 Supabase 專案的 SQL Editor 貼上並執行一次即可。
--
-- 設計說明：整個系統的資料（客戶、服務項目、成本、服務紀錄、預約）
-- 存成一列 JSON，對應到登入帳號（auth.uid()）。這樣可以直接沿用前端
-- 既有的資料結構，同時用 Row Level Security 確保只有登入者本人能讀寫。

create table if not exists app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table app_data enable row level security;

drop policy if exists "app_data_select_own" on app_data;
create policy "app_data_select_own"
  on app_data for select
  using (auth.uid() = user_id);

drop policy if exists "app_data_insert_own" on app_data;
create policy "app_data_insert_own"
  on app_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "app_data_update_own" on app_data;
create policy "app_data_update_own"
  on app_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
