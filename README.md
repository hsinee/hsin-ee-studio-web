# 芯伊 HSIN.EE 線上預約系統（前台）

客人看到的預約網站，配色與後台營運管理系統一致。
不使用資料庫：客人選完後，網站會把預約資訊整理好，一鍵帶入官方 LINE 聊天室傳給店家。

網址：https://hsin-ee-booking.vercel.app

## 預約流程

1. 首頁：店家自介、預約須知、「點選開始預約即表示同意本店規範」
2. 基本資料：姓名、手機、預約身分（第一次／6 週內回訪／超過 6 週）、日期、希望時段
3. 選擇項目：依身分顯示首次體驗價／回訪價／原價
   分類導覽列：小部位／上半身／下半身／組合優惠／加購優惠／保養產品
4. 確認預約內容
5. 匯款訂金提醒 →「傳送到官方 LINE」（自動帶入預約資訊，客人補上匯款末五碼送出）

## 如何修改內容（店家後台）

所有文字、價格、項目都在 **`src/config.js`** 這一個檔案。

### 用手機或電腦修改

1. 打開 https://github.com/hsinee/hsin-ee-studio-web/blob/main/src/config.js
2. 按右上角的 **鉛筆圖示（Edit）**
3. 只改 **引號 `' '` 裡面的文字** 和 **數字**
4. 改完按右上角綠色 **Commit changes** → 再按一次 **Commit changes**
5. 等大約 1 分鐘，網站就會自動更新

### 檔案裡每一區是什麼

| 想改的東西 | 找這一區 |
| --- | --- |
| 店名、自介、營業時間、地址 | `STORE` |
| 預約須知 | `NOTICES` |
| 回訪價的期限（預設 42 天） | `PRICING` |
| 訂金金額、銀行、帳號、戶名 | `DEPOSIT` |
| 官方 LINE ID | `LINE` |
| 可預約時段 | `TIME_SLOTS` |
| 分類名稱 | `CATEGORIES` |
| 項目與價格 | `SERVICES` |

### 項目怎麼寫

一般項目（會依身分顯示不同價格）：

```js
{ id: 'underarm', category: 'small', name: '腋下', duration: 20, priceFirstTrial: 199, priceRevisit: 299, priceNormal: 399 },
```

加購／產品（固定價格）：

```js
{ id: 'product-oil', category: 'product', name: '舒緩修護油 30ml', price: 680 },
```

- `id`：英文代號，每個項目不能重複，隨便取即可
- `category`：放在哪個分類（`small` 小部位、`upper` 上半身、`lower` 下半身、`combo` 組合優惠、`addon` 加購優惠、`product` 保養產品）
- `name`：項目名稱
- `note`：小標籤，可不填（例如 `note: '人氣組合',`）
- `duration`：大約幾分鐘，可不填
- 暫時不想顯示：加上 `active: false,`
- 新增項目：複製一整行貼在下面再修改；刪除項目：整行刪掉

### 注意

- 每一行結尾的 **逗號 `,`** 和 **引號** 不要刪掉
- 如果改壞了網站沒更新，到 Vercel 看到紅色的 Error，回到 GitHub 檢查剛剛改的地方，或直接請 Claude 幫你修

## 本機開發

```bash
npm install
npm run dev
```
