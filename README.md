# 芯伊 HSIN.EE 線上預約系統（前台）

客人看到的預約網站，配色與後台營運管理系統（hsin-ee-beauty-system）一致。
客人只會看到前台，**看不到任何後台資料**。

## 預約流程

1. 首頁：店家自介、預約須知、「點選開始預約即表示同意本店規範」
2. 基本資料：姓名、手機、日期、時段（已被預約的時段會顯示「已額滿」）
3. 選擇項目：依手機號碼自動判斷價格
   - 第一次預約 → **首次體驗價**
   - 距上次到店 6 週內 → **回訪價**
   - 超過 6 週 → **原價**
   - 分類導覽列：小部位／上半身／下半身／組合優惠／加購優惠／保養產品
4. 確認預約內容
5. 匯款訂金提醒 → 「複製預約資訊」→「前往官方 LINE 傳送」

## 要改文字、價格、項目

全部在 **`src/config.js`**：

| 想改的東西 | 位置 |
| --- | --- |
| 店家自介、營業時間、地址 | `STORE` |
| 預約須知 | `NOTICES` |
| 訂金金額、匯款帳號 | `DEPOSIT` |
| 官方 LINE | `LINE` |
| 可預約時段 | `TIME_SLOTS` |
| 項目與價格 | `SERVICES`（一般項目填三種價格；加購／產品只填 `price`；暫停販售填 `active: false`） |

在 GitHub 網頁上直接編輯這個檔案、存檔，Vercel 就會自動重新部署。

## 第一次上線設定

1. **Supabase**：SQL Editor 貼上 `supabase/schema.sql` 全部內容 → Run
2. **Vercel**：匯入這個 repo，在 Environment Variables 加上
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. 部署完成，把網址放到 IG / LINE 選單即可

沒設定 Supabase 時網站會進入「展示模式」（頂端會有提示），預約只存在該裝置，適合先預覽畫面。

## 查看預約

Supabase → Table Editor：
- `bookings`：所有預約。確認收到訂金後把 `status` 改成 `confirmed`，完成服務改 `completed`，取消改 `cancelled`（取消後時段會釋出）
- `booking_customers`：客人名單。**舊客人**可以手動新增一筆並填上 `last_visit_date`（最近一次到店日），系統就會正確判斷回訪價／原價

## 本機開發

```bash
npm install
npm run dev
```
