# hsin-ee-studio-web
HSIN.EE 工作室後台管理系統 - 線上部署版本

## 系統介紹網站

這是 HSIN.EE 工作室後台管理系統的產品介紹網站，向美容、美甲、美睫、紋繡、SPA 按摩等工作室老闆介紹系統功能與適用對象。

純靜態網頁（HTML / CSS / JS），不需要建置流程，可直接部署到 GitHub Pages、Vercel、Netlify 等平台，或本機開啟 `index.html` 預覽。

### 檔案結構

```
index.html      主頁面
css/style.css   樣式
js/main.js      互動效果（手機版選單開關）
```

### 本機預覽

直接用瀏覽器開啟 `index.html`，或用簡易伺服器：

```bash
python3 -m http.server 8000
```

然後開啟 http://localhost:8000

### 聯絡方式

頁面上的「加入官方 LINE 立即預約」按鈕會直接開啟官方 LINE（`https://lin.ee/rnvEEY1`），若 LINE 網址有變更，記得同步更新 `index.html` 中的連結。

