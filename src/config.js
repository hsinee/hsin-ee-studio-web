/* ============================================================
   店家設定檔 —— 前台顯示的文字、價格都在這裡改
   在 GitHub 網頁上修改這個檔案 →「Commit changes」→ 約 1 分鐘後網站自動更新
   ============================================================ */

export const STORE = {
  name: '芯伊 HSIN.EE',
  tagline: '熱蠟除毛工作室',
  // 店家自介（每一行是一段）
  intro: [
    '歡迎來到芯伊 HSIN.EE，一間一對一預約制的私人除毛工作室。',
    '使用低溫熱蠟，溫和不刺激，每一位客人都使用全新耗材。',
    '希望你在這裡，可以放心、放鬆地照顧自己。',
  ],
  address: '台北市○○區○○路○號（預約成功後提供詳細位置）',
  hours: '每日 10:00 – 21:00（採預約制）',
  instagram: 'https://www.instagram.com/',
};

// 預約須知（每一條是一個項目）
export const NOTICES = [
  '本店採全預約制，請提前至少 1 天預約。',
  '預約需先支付訂金，訂金於當日消費中折抵。',
  '如需改期，請於預約時間 24 小時前告知，可保留訂金一次。',
  '未提前告知取消或無故未到，訂金恕不退還。',
  '遲到超過 15 分鐘將視情況縮短服務或改期。',
  '除毛部位毛髮長度建議 0.5 – 1 公分，效果最佳。',
  '生理期、皮膚有傷口或過敏狀況，請提前告知。',
];

// 價格規則（客人在預約時自己選身分，你在 LINE 收到時再核對）
export const PRICING = {
  // 回訪價的期限：最近一次到店後幾天內（6 週 = 42 天）
  revisitWindowDays: 42,
  labels: {
    trial: '首次體驗價',
    revisit: '回訪價',
    normal: '原價',
  },
};

// 訂金與匯款資訊
export const DEPOSIT = {
  amount: 300, // 固定訂金金額
  bankName: '○○銀行（000）',
  bankAccount: '0000-0000-0000',
  accountName: '○○○',
  deadlineHours: 24, // 幾小時內完成匯款
};

// 官方 LINE：填官方帳號 ID（含 @），客人按「傳送到官方 LINE」會直接打開聊天室並帶入預約資訊
export const LINE = {
  id: '@hsinee',
};

// 可預約時段
export const TIME_SLOTS = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'];

/* ------------------------------------------------------------
   預約項目
   - 一般項目：填 priceFirstTrial（首次體驗價）、priceRevisit（回訪價）、priceNormal（原價）
     系統會依客人的身分自動帶入對應價格
   - 加購 / 保養產品這類固定價格：只填 price 即可
   - 不想顯示的項目：active: false
   ------------------------------------------------------------ */
export const CATEGORIES = [
  { id: 'small', label: '小部位' },
  { id: 'upper', label: '上半身' },
  { id: 'lower', label: '下半身' },
  { id: 'combo', label: '組合優惠' },
  { id: 'addon', label: '加購優惠' },
  { id: 'product', label: '保養產品' },
];

export const SERVICES = [
  // 小部位
  { id: 'underarm', category: 'small', name: '腋下', duration: 20, priceFirstTrial: 199, priceRevisit: 299, priceNormal: 399 },
  { id: 'lip', category: 'small', name: '唇周', duration: 15, priceFirstTrial: 150, priceRevisit: 199, priceNormal: 250 },
  { id: 'face', category: 'small', name: '臉部', duration: 20, priceFirstTrial: 250, priceRevisit: 320, priceNormal: 400 },

  // 上半身
  { id: 'arm-half', category: 'upper', name: '半手（手肘以下）', duration: 20, priceFirstTrial: 249, priceRevisit: 349, priceNormal: 400 },
  { id: 'arm-full', category: 'upper', name: '全手', duration: 25, priceFirstTrial: 299, priceRevisit: 420, priceNormal: 500 },
  { id: 'back', category: 'upper', name: '背部', duration: 35, priceFirstTrial: 600, priceRevisit: 750, priceNormal: 900 },

  // 下半身
  { id: 'bikini', category: 'lower', name: '比基尼線', duration: 30, priceFirstTrial: 500, priceRevisit: 650, priceNormal: 800 },
  { id: 'brazilian', category: 'lower', name: '全私密處', duration: 45, priceFirstTrial: 999, priceRevisit: 1250, priceNormal: 1500 },
  { id: 'calf', category: 'lower', name: '小腿', duration: 30, priceFirstTrial: 399, priceRevisit: 500, priceNormal: 600 },
  { id: 'leg-full', category: 'lower', name: '全腿', duration: 50, priceFirstTrial: 799, priceRevisit: 1000, priceNormal: 1200 },

  // 組合優惠
  { id: 'combo-a', category: 'combo', name: '腋下 + 全私密處', note: '人氣組合', duration: 60, priceFirstTrial: 1099, priceRevisit: 1399, priceNormal: 1800 },
  { id: 'combo-b', category: 'combo', name: '全腿 + 全私密處', note: '夏日必備', duration: 90, priceFirstTrial: 1699, priceRevisit: 2099, priceNormal: 2600 },

  // 加購優惠（固定價）
  { id: 'addon-soothe', category: 'addon', name: '術後鎮定修護', note: '限搭配除毛服務', duration: 10, price: 150 },
  { id: 'addon-ingrown', category: 'addon', name: '毛囊淨化處理', note: '限搭配除毛服務', duration: 15, price: 200 },

  // 保養產品（固定價）
  { id: 'product-oil', category: 'product', name: '舒緩修護油 30ml', price: 680 },
  { id: 'product-scrub', category: 'product', name: '溫和去角質霜 100ml', price: 520 },
];
