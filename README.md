# hsin-ee-studio-web

HSIN.EE 工作室後台管理系統 - 線上部署版本

一個給 HSIN.EE 熱蠟工作室用的後台系統：客戶 CRM、日曆／預約、回訪提醒、服務項目與價格、成本紀錄、營運總覽儀表板。整個網站需要密碼登入才能使用，資料存在雲端資料庫（Supabase），在 iPad、手機、電腦上登入都能看到同一份最新資料。

## 技術架構

- **前端**：React + Vite（純靜態網站，部署到 Vercel）
- **資料庫／登入**：[Supabase](https://supabase.com)（Postgres 資料庫 + Auth 帳號密碼登入，有免費額度）
- **登入方式**：只有一組帳號、共用一組密碼。畫面上只會看到「密碼」欄位。

資料儲存方式：所有客戶／服務／成本／紀錄，整包存成一筆 JSON，掛在你登入的帳號底下（Supabase 的 Row Level Security 保證只有你自己能讀寫），前端每次修改後會自動存檔（約 0.6 秒防抖動）。

## 第一次上線設定（照順序做一次就好）

### 1. 建立 Supabase 專案

1. 到 [supabase.com](https://supabase.com) 免費註冊、建立一個新專案（New Project），資料庫密碼自己保管好。
2. 專案建立好之後，進左側 **SQL Editor**，貼上這個 repo 裡的 `supabase/migration.sql` 全部內容，按 Run 執行一次（會建立 `app_data` 這張表格跟安全性規則）。
3. 左側 **Authentication → Providers**，確認 Email 登入是開啟的；**Authentication → Settings**，把「Confirm email」關閉（因為我們是手動建立帳號，不需要寄確認信）。
4. 左側 **Authentication → Users → Add user**，建立唯一一個帳號：
   - Email：可以隨便填一個沒人用的（例如 `studio@hsin-ee.app`），不用是真的信箱，只是內部用來對應密碼。
   - Password：就是之後大家登入要輸入的**共用密碼**，設定一組容易記但夠安全的密碼。
5. 左側 **Project Settings → API**，記下：
   - `Project URL`（就是 `VITE_SUPABASE_URL`）
   - `anon public` key（就是 `VITE_SUPABASE_ANON_KEY`）

### 2. 部署到 Vercel

1. 到 [vercel.com](https://vercel.com) 用 GitHub 帳號登入，選擇 **Add New → Project**，選這個 repo（`hsin-ee-studio-web`）。
2. Framework Preset 選 **Vite**（Vercel 通常會自動偵測到）。Build Command 用預設的 `vite build`，Output Directory 用預設的 `dist`。
3. 在 **Environment Variables** 加三個變數（跟 `.env.example` 對應）：
   - `VITE_SUPABASE_URL` → 上一步記下的 Project URL
   - `VITE_SUPABASE_ANON_KEY` → 上一步記下的 anon public key
   - `VITE_APP_LOGIN_EMAIL` → 你在 Supabase 建立帳號時用的那個 email
4. 按 **Deploy**，等一兩分鐘部署完成後會拿到一個網址（例如 `hsin-ee-studio-web.vercel.app`），這個網址在 iPad、手機、電腦上都能開。
5. 之後只要把新的程式碼 push 到這個 repo 的 GitHub，Vercel 會自動重新部署。

### 3. 在 iPad / 手機上使用

用 Safari（iPad/iPhone）或 Chrome 打開部署好的網址，輸入密碼登入。想要更像「App」的體驗：

- iPhone/iPad Safari：點分享 icon → **加入主畫面**，之後會像一個獨立 App 一樣有自己的圖示，全螢幕顯示不會有網址列。
- 這個網站的版面本來就針對手機／平板做過響應式設計（側邊選單在小螢幕會收合成漢堡選單）。

## 本機開發

```bash
npm install
cp .env.example .env   # 填入你自己的 Supabase 資訊
npm run dev
```

## 修改密碼

之後想換密碼，直接到 Supabase Dashboard → Authentication → Users → 點那個帳號 → Reset Password（或直接改密碼）即可，不需要改程式碼、不需要重新部署。

## 資料備份

Supabase 專案本身會保留資料庫，但建議偶爾到 Supabase Dashboard → Table Editor → `app_data` 把 `data` 欄位的內容複製存一份，或使用 Supabase 的 Database Backups 功能，避免帳號被誤刪或資料被誤改時沒有備份。
