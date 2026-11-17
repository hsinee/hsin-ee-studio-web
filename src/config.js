/* ============================================================
   預設內容 —— 只在後台還沒儲存過該欄位時使用
   日常修改請到店家後台：https://hsin-ee-booking.vercel.app/admin
   文字中用 **兩個星號** 包起來的字會顯示為粗體／強調色
   ============================================================ */

const STORE = {
  name: '芯伊 HSIN.EE',
  tagline: 'PREMIUM WAXING',
  // 頁面下方「關於」的介紹（每一行是一段）
  intro: [
    '芯於肌膚本質，伊見光滑之美',
    'Beauty begins beneath the surface.',
  ],
  signature: '— 芯伊創辦人 Winnie',
  address: '',
  hours: '',
  instagram: 'hsin.ee',
  // 頁底文字
  footerBadge: '預約制',
  footerText: 'BY APPOINTMENT ONLY',
};

const LINE = {
  id: '@577mynjf',
};

// 價目表：每張表有數個區塊，每個區塊有自己的價格欄位
const EXP_SINGLE = [
  { zh: '體驗價', en: 'EXPERIENCE' },
  { zh: '單次價', en: 'SINGLE' },
];
const SPECIAL_ORIGINAL = [
  { zh: '優惠價', en: 'SPECIAL PRICE' },
  { zh: '原價', en: 'ORIGINAL PRICE' },
];
const ONE_PRICE = [{ zh: '', en: '' }];

const FEMALE = {
  id: 'female',
  label: '女生',
  updated: '2026.10.01 更新',
  footnote: '*六周內回除皆享體驗價',
  sections: [
    {
      title: '小部位',
      en: 'SMALL PARTS',
      columns: EXP_SINGLE,
      items: [
        { name: '唇周', en: 'Lip Area', prices: ['$250', '$350'] },
        { name: '眉毛', en: 'Eyebrow', prices: ['$200', '$300'] },
        { name: '乳暈', en: 'Areola', prices: ['$200', '$300'] },
        { name: '手指/腳趾', en: 'Fingers/Toes', prices: ['$150', '$250'] },
      ],
    },
    {
      title: '上半身',
      en: 'UPPER BODY',
      columns: EXP_SINGLE,
      items: [
        { name: '腋下', en: 'Underarm', prices: ['$399', '$500'] },
        { name: '腹部', en: 'Abdomen', prices: ['$700', '$850'] },
        { name: '前臂', en: 'Forearm', prices: ['$900', '$1,000'] },
        { name: '全臂', en: 'Full Arm', prices: ['$1,200', '$1,400'] },
        { name: '全臉', en: 'Full Face', prices: ['$1,500', '$1,700'], note: '含修復面膜一片' },
      ],
    },
    {
      title: '下半身',
      en: 'LOWER BODY',
      columns: EXP_SINGLE,
      items: [
        { name: '小腿', en: 'Calf', prices: ['$900', '$1,100'] },
        { name: '全腿', en: 'Full Leg', prices: ['$1,300', '$1,500'] },
        { name: '比基尼', en: 'Bikini Line', prices: ['$1,200', '$1,400'] },
        { name: '巴西式', en: 'VIO(Full)', prices: ['$1,300', '$1,500'] },
      ],
    },
    {
      title: '組合優惠',
      en: 'PACKAGES',
      columns: SPECIAL_ORIGINAL,
      items: [
        { name: 'VIO + 腋下', en: 'VIO + Underarm', prices: ['$1,500', '$2,000'] },
        { name: '腋下 + 小腿/前臂', en: 'Underarm + Calf/Forearm', prices: ['$1,200', '$1,600'] },
        { name: 'VIO + 小腿/前臂', en: 'VIO + Calf/Forearm', prices: ['$2,000', '$2,600'] },
      ],
    },
    {
      title: '加購服務',
      en: 'ADD-ONS',
      columns: ONE_PRICE,
      items: [
        { name: '簡易嫩白敷膜', en: 'Brightening Mask', prices: ['$199'] },
        { name: '極萃煥白全效敷膜', en: 'Ultra-Pure All-in-One Brightening Mask', prices: ['$199-$399'], note: '各部位不同' },
      ],
    },
  ],
};

const MALE = {
  id: 'male',
  label: '男生',
  updated: '2026.08.01 更新',
  footnote: '*六周內回除皆享體驗價',
  sections: [
    {
      title: '小部位',
      en: 'SMALL PARTS',
      columns: EXP_SINGLE,
      items: [
        // 只填第一欄、其他欄留空時，文字會橫跨整列
        { name: '唇周', en: 'Lip Area', prices: ['依毛量報價', ''] },
        { name: '眉毛', en: 'Eyebrow', prices: ['$200', '$300'] },
        { name: '乳暈', en: 'Areola', prices: ['$200', '$300'] },
        { name: '手指/腳趾', en: 'Fingers/Toes', prices: ['$350', '$450'] },
      ],
    },
    {
      title: '上半身',
      en: 'UPPER BODY',
      columns: EXP_SINGLE,
      items: [
        { name: '腋下', en: 'Underarm', prices: ['$599', '$700'] },
        { name: '腹部', en: 'Abdomen', prices: ['$850', '$1,000'] },
        { name: '前臂', en: 'Forearm', prices: ['$1,200', '$1,400'] },
        { name: '全臂', en: 'Full Arm', prices: ['$1,400', '$1,600'] },
        { name: '全臉', en: 'Full Face', prices: ['$1,800', '$2,200'], note: '含修復面膜一片' },
      ],
    },
    {
      title: '下半身',
      en: 'LOWER BODY',
      columns: EXP_SINGLE,
      items: [
        { name: '小腿', en: 'Calf', prices: ['$1,200', '$1,400'] },
        { name: '全腿', en: 'Full Leg', prices: ['$1,600', '$1,800'] },
        { name: '比基尼', en: 'Bikini Line', prices: ['-', '-'] },
        { name: '巴西式', en: 'VIO(Full)', prices: ['-', '-'] },
      ],
    },
    {
      title: '組合優惠',
      en: 'PACKAGES',
      columns: SPECIAL_ORIGINAL,
      items: [
        { name: '腋下 + 腹部', en: 'Underarm + Abdomen', prices: ['$1,200', '$1,700'] },
        { name: '腋下 + 小腿/前臂', en: 'Underarm + Calf/Forearm', prices: ['$1,600', '$2,100'] },
      ],
    },
    {
      title: '加購服務',
      en: 'ADD-ONS',
      columns: ONE_PRICE,
      items: [
        { name: '極萃煥白全效敷膜', en: 'Ultra-Pure All-in-One Brightening Mask', prices: ['$199-$399'], note: '各部位不同' },
      ],
    },
  ],
};

// 預約須知：每一條可以換行
const BOOKING_NOTES = {
  title: '預約須知',
  subtitle: '請詳閱以下內容',
  items: [
    '每月25日開放下個月預約',
    '預約前請確認日期、時段及服務項目',
    '更改日期或項目請於3天前告知；\n臨時取消將沒收訂金。（生理期可免費延期 1 次）',
    '更改預約需支付NT$300訂金\n限異動1次；再次取消或異動，訂金恕不退還',
    '無故未到者，未來將不再提供預約服務',
    '當日保留10分鐘，逾時將視情況取消或調整服務內容',
    '請依預約時間抵達\n為維護服務品質，**請勿提前進入工作室**',
  ],
};

// 熱蠟前後照顧
const CARE = {
  before: {
    tab: '蠟前遵守',
    title: '熱蠟**前**請遵守！',
    en: 'PRE-WAX INSTRUCTIONS',
    blocks: [
      {
        title: '預約前',
        en: 'Pre Care',
        items: ['毛髮長度至少0.5–1 公分', '前一天避免刮毛、拔毛', '前一周避免去角質與酸類保養品', '特殊肌膚狀況，請提前告知', '避開生理期前後三天，減少疼痛感'],
      },
      {
        title: '當天',
        en: 'Appointment Day',
        items: ['保持施作部位乾淨即可', '避免擦拭乳液、精油或防曬產品', '建議穿著寬鬆舒適的衣物', '保持輕鬆的心情'],
      },
      {
        title: '孕媽咪',
        en: 'Pregnancy Guide',
        items: ['孕期 12 週後可評估施作', '如有特殊狀況，請先諮詢醫師', '施作前請主動告知孕期週數', '施做當下若有任何不適，請立即告知'],
      },
      {
        title: '自然產 ♡',
        en: 'Natural Birth',
        items: ['固定保養：預產前 2 週', '首次保養：預產前 1 個月'],
      },
      {
        title: '剖腹產 ♡',
        en: 'C-Section',
        items: ['固定保養：預產前 1–2 週', '首次保養：預產前 2–3 週'],
      },
    ],
  },
  after: {
    tab: '蠟後必看',
    title: '熱蠟**後**必看！',
    en: 'WAX AFTERCARE',
    blocks: [
      { title: '02 HOUR', en: '', items: ['施做部位避免接觸到生水/淋浴'] },
      {
        title: '03 DAYS',
        en: '',
        items: ['避免游泳、泡湯、三溫暖等水上活動', '私密處熱蠟後，避免親密性行為', '盡量穿著寬鬆衣褲，避免肌膚摩擦', '激烈運動或大量流汗後，盡快清潔肌膚', '避免使用過熱的洗澡水'],
      },
      { title: '01 WEEK', en: '', items: ['暫停使用A酸、果酸等換膚產品', '避免使用止汗產品/體香膏'] },
      {
        title: '居家保養',
        en: 'Home Care',
        items: ['徹底清潔，時時保濕', '使用專業保養品，避免人造香料', '定期去角質，預防內包毛', '4–6 週定期回除，延緩毛髮生長'],
      },
    ],
  },
};

// 居家產品：產品介紹與產品組合
const PRODUCTS = {
  intro: {
    tab: '產品介紹',
    title: '產品介紹',
    en: 'PRODUCTS INTRODUCTION',
    priceLabel: '專屬價',
    items: [
      { name: '葡萄籽去角質', size: '60g', price: '$1,280', image: '/products/grape-scrub.webp', points: ['天然葡萄籽製造', '代謝老廢角質', '預防內包毛產生'] },
      { name: '玫瑰精萃肌膚養護精華凝露', size: '150ml', price: '$1,580', image: '/products/rose-gel.webp', points: ['保濕、鎮定、補水', '增加肌膚保水度', '高純度玻尿酸'] },
      { name: '豐盈嫩白抗菌精華霜', size: '30g', price: '$1,080', image: '/products/brightening-cream.webp', points: ['清爽乳霜質地', '肌膚暗沉救星', '瞬吸不黏膩'] },
      { name: '嫩白保濕潔淨慕斯', size: '150ml', price: '$1,080', image: '/products/cleansing-mousse.webp', points: ['天然花卉植萃配方', '平衡私密處的酸鹼值', '一瓶使用半年不是問題'] },
      { name: '360度秘密花園保衛噴霧', size: '35ml', price: '$1,180', image: '/products/secret-spray.webp', points: ['泌尿道感染救星', '抗菌除臭', '玫瑰純露不添加水'] },
      { name: '玫瑰精萃肌膚養護潤膚乳', size: '250ml', price: '$1,180', image: '/products/rose-lotion.webp', points: ['維他命E', '高麗人參萃取液', '肌膚濕潤光澤'] },
    ],
  },
  bundles: {
    tab: '產品組合',
    title: '產品組合',
    en: 'RECOMMENDED ROUTINE',
    items: [
      {
        title: '小資族必備 **2** 寶',
        subtitle: '跟毛囊炎SAY BYE BYE',
        lines: ['葡萄籽去角質', '玫瑰精萃肌膚養護精華凝露'],
        price: '$2,499',
        original: '$2,860',
      },
      {
        title: 'CP值套組 **3** 寶',
        subtitle: '',
        // 以「／」結尾的行會顯示成小標
        lines: ['A區／', '葡萄籽去角質', '玫瑰精萃肌膚養護精華凝露', 'B區／三選一', '嫩白保濕潔淨慕斯', '豐盈嫩白抗菌精華霜', '360°秘密花園保衛噴霧'],
        price: '$3,199',
        original: '$3,940',
      },
      {
        title: '蠟後 **5** 寶推薦',
        subtitle: '多種效果一次滿足，輕鬆擁有燈泡肌',
        lines: ['葡萄籽去角質', '嫩白保濕潔淨慕斯', '豐盈嫩白抗菌精華霜', '玫瑰精萃肌膚養護精華凝露', '360°秘密花園保衛噴霧'],
        price: '$4,650',
        original: '$6,200',
      },
    ],
  },
};

// 可預約時段
const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

// 公休：指定日期（'2026-11-03'）與每週固定公休（0 = 週日、1 = 週一 …）
const CLOSED_DATES = [];
const CLOSED_WEEKDAYS = [];

// 某天部分時段已滿：{ '2026-11-03': ['13:00', '14:30'] }
const CLOSED_SLOTS = {};

// 每月幾號開放下個月的時段
const OPEN_NEXT_MONTH_DAY = 25;

export const DEFAULT_SETTINGS = {
  store: STORE,
  line: LINE,
  priceLists: [FEMALE, MALE],
  bookingNotes: BOOKING_NOTES,
  care: CARE,
  products: PRODUCTS,
  timeSlots: TIME_SLOTS,
  closedDates: CLOSED_DATES,
  closedWeekdays: CLOSED_WEEKDAYS,
  closedSlots: CLOSED_SLOTS,
  openNextMonthDay: OPEN_NEXT_MONTH_DAY,
};

// 後台儲存、伺服器回傳時只保留這些欄位（舊的匯款資訊等不再保存）
export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS);
