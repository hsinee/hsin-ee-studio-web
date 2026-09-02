# hsin-ee-studio-web
HSIN.EE 工作室後台管理系統 - 線上部署版本

## 系統介紹網站

這是 HSIN.EE 工作室後台管理系統的產品介紹網站，向美容、美甲、美睫、紋繡、SPA 按摩等工作室老闆介紹系統功能與適用對象。

純靜態網頁（HTML / CSS / JS），不需要建置流程，可直接部署到 GitHub Pages、Vercel、Netlify 等平台，或本機開啟 `index.html` 預覽。

### 檔案結構

```
index.html      主頁面
css/style.css   樣式
js/main.js      互動效果（選單、表單、滾動動畫）
```

### 本機預覽

直接用瀏覽器開啟 `index.html`，或用簡易伺服器：

```bash
python3 -m http.server 8000
```

然後開啟 http://localhost:8000

### 待補充

- 聯絡表單目前為前端展示用，尚未串接實際送出（Email / API），上線前需要串接後端或第三方表單服務。

