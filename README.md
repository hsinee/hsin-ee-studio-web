# 芯伊 HSIN.EE 價目表與預約資訊

客人點開即可查看的資訊網站，配色與後台營運管理系統一致。預約請客人私訊官方 LINE。

網址：https://hsin-ee-booking.vercel.app

## 分頁

頂部按鈕切換，網址加上 `#分頁` 可直接開到該頁（方便貼在 IG / LINE）：

| 分頁 | 網址 |
| --- | --- |
| 女生價目表 | https://hsin-ee-booking.vercel.app/#female |
| 男生價目表 | https://hsin-ee-booking.vercel.app/#male |
| 預約須知 | https://hsin-ee-booking.vercel.app/#notes |
| 蠟前蠟後 | https://hsin-ee-booking.vercel.app/#care |
| 可預約時段 | https://hsin-ee-booking.vercel.app/#schedule |

每頁下方有「關於」介紹與 IG／LINE 連結，右下角有「LINE 預約」按鈕。

## 店家後台

網址：https://hsin-ee-booking.vercel.app/admin

打開就能直接修改（不需要密碼），按「儲存並發布」後前台立即更新：

| 區塊 | 可以改什麼 |
| --- | --- |
| 店家資訊 | 店名、標語、關於、署名、營業時間、地址、官方 LINE ID、Instagram |
| 女生／男生價目表 | 分頁名稱、標籤、更新日期、副標題、底部備註；區塊（新增／排序／刪除）、價格欄位、項目（名稱、英文、價格、備註、排序、刪除） |
| 預約須知 | 標題、副標題、每一條內容（可換行、`**粗體**`） |
| 熱蠟前／熱蠟後 | 大標題、英文標題、小區塊（標題、英文、每行一點） |
| 時段與公休 | 整天公休／某天部分時段已滿（月曆點選）、每週固定公休、每月幾號開放下個月、每日時段 |

- 價格欄可以直接打文字，例如 `$1,200`、`依毛量報價`、`-`；只填第一欄時會橫跨整列
- 後台沒有密碼，知道網址的人都能修改，請不要公開 `/admin` 網址（已設定不被搜尋引擎收錄）
- 設定存在 Vercel Blob（`settings.json`），由 `api/settings.js` 讀寫，只保存上述欄位
- `src/config.js` 是預設內容，後台還沒儲存過該欄位時才會使用

## 本機開發

```bash
npm install
npm run dev
```

本機 `npm run dev` 沒有 `/api`，前台會使用 `src/config.js` 的預設內容；後台的儲存需要部署到 Vercel 才能使用。
