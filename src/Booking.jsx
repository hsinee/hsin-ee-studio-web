import React, { useEffect, useMemo, useState } from 'react';
import { useSettings } from './settings.js';
import { fmtDate, todayStr, addDays, isClosedDay, fullSlotsOf } from './dates.js';
import Calendar from './Calendar.jsx';

/* ============================================================
   小工具
   ============================================================ */

function fmtMoney(n) {
  return 'NT$ ' + Number(n || 0).toLocaleString('zh-TW');
}

// 客人的姓名電話記在他自己的手機上，下次自動帶入
const CUSTOMER_KEY = 'hsin-ee-booking-customer';

function loadCustomer() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function saveCustomer(data) {
  try {
    if (data) localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data));
    else localStorage.removeItem(CUSTOMER_KEY);
  } catch {
    // 無痕模式等情況無法記住，下次再輸入一次即可
  }
}

function normalizePhone(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function isValidPhone(phone) {
  return /^09\d{8}$/.test(phone);
}

// 依價格身分取得項目價格；固定價項目（加購 / 產品）直接回傳 price
function priceOf(service, tier) {
  if (service.price != null) return service.price;
  if (tier === 'trial') return service.priceFirstTrial;
  if (tier === 'revisit') return service.priceRevisit;
  return service.priceNormal;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 部分 LINE 內建瀏覽器不支援 clipboard API，改用舊方法
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}

// 打開官方 LINE 聊天室，並把訊息預先填好
function lineMessageUrl(lineId, text) {
  return `https://line.me/R/oaMessage/${encodeURIComponent(lineId)}/?${encodeURIComponent(text)}`;
}

// 回訪期限以「週」顯示，不是整週時改顯示天數
function windowText(days) {
  return days % 7 === 0 ? `${days / 7} 週` : `${days} 天`;
}

function tierOptions(pricing) {
  const w = windowText(pricing.revisitWindowDays);
  return [
    { id: 'trial', label: '第一次預約' },
    { id: 'revisit', label: `${w}內曾到店` },
    { id: 'normal', label: `超過 ${w}未到店` },
  ];
}

function tierHint(pricing, tier, storeName) {
  const w = windowText(pricing.revisitWindowDays);
  if (tier === 'trial') return `歡迎第一次來到${storeName}，本次享${pricing.labels.trial}`;
  if (tier === 'revisit') return `距上次到店 ${w}內，本次享${pricing.labels.revisit}`;
  return `距上次到店已超過 ${w}，本次以${pricing.labels.normal}計費`;
}

/* ============================================================
   App
   ============================================================ */

export default function Booking() {
  const { store: STORE, pricing: PRICING, deposit: DEPOSIT, services: SERVICES } = useSettings();
  const [step, setStep] = useState('welcome');
  const [saved] = useState(loadCustomer);
  const [name, setName] = useState(saved.name || '');
  const [phone, setPhone] = useState(saved.phone || '');
  const [tier, setTier] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const items = useMemo(
    () => SERVICES.filter((s) => selected.includes(s.id)).map((s) => ({ id: s.id, name: s.name, price: priceOf(s, tier) })),
    [SERVICES, selected, tier]
  );
  const total = items.reduce((sum, it) => sum + it.price, 0);
  const deposit = Math.min(DEPOSIT.amount, total);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bookingText = [
    `【${STORE.name} 預約申請】`,
    `姓名：${name}`,
    `電話：${phone}`,
    `日期時間：${fmtDate(date)} ${time}`,
    `價格方案：${tier ? PRICING.labels[tier] : ''}`,
    `項目：`,
    ...items.map((it) => `・${it.name} ${fmtMoney(it.price)}`),
    `預估總金額：${fmtMoney(total)}`,
    `已匯訂金：${fmtMoney(deposit)}`,
    `匯款帳號末五碼：`,
    note ? `備註：${note}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="page">
      <header className="top">
        <img src="/logo.png" alt={STORE.name} className={'logo' + (step === 'welcome' ? '' : ' small')} onClick={() => setStep('welcome')} />
      </header>

      {step !== 'welcome' && step !== 'done' && <Progress step={step} />}

      <main className="container">
        {step === 'welcome' && <Welcome onStart={() => setStep('info')} />}

        {step === 'info' && (
          <InfoStep
            name={name}
            setName={setName}
            phone={phone}
            setPhone={setPhone}
            tier={tier}
            setTier={setTier}
            remembered={Boolean(saved.name && saved.phone)}
            onBack={() => setStep('welcome')}
            onNext={() => setStep('items')}
          />
        )}

        {step === 'items' && (
          <ItemsStep
            tier={tier}
            selected={selected}
            toggle={toggle}
            total={total}
            onBack={() => setStep('info')}
            onNext={() => setStep('time')}
          />
        )}

        {step === 'time' && (
          <TimeStep
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            onBack={() => setStep('items')}
            onNext={() => setStep('confirm')}
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            booking={{ name, phone, date, time, tier, items, total, deposit }}
            note={note}
            setNote={setNote}
            onBack={() => setStep('time')}
            onNext={() => setStep('done')}
          />
        )}

        {step === 'done' && <DoneStep deposit={deposit} bookingText={bookingText} onBack={() => setStep('confirm')} />}
      </main>

      <footer className="foot">
        <div>{STORE.name}</div>
        <div>{STORE.address}</div>
      </footer>
    </div>
  );
}

/* ============================================================
   進度條
   ============================================================ */

const STEPS = [
  { id: 'info', label: '基本資料' },
  { id: 'items', label: '選擇項目' },
  { id: 'time', label: '預約時間' },
  { id: 'confirm', label: '確認預約' },
];

function Progress({ step }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="progress">
      {STEPS.map((s, i) => (
        <li key={s.id} className={i < idx ? 'done' : i === idx ? 'active' : ''}>
          <span className="dot">{i + 1}</span>
          <span className="label">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

/* ============================================================
   首頁：店家自介 + 預約須知
   ============================================================ */

function Welcome({ onStart }) {
  const { store: STORE, notices: NOTICES } = useSettings();
  return (
    <div className="welcome">
      <p className="tagline serif">{STORE.tagline}</p>

      <section className="card">
        <h2 className="card-title serif">關於我們</h2>
        {STORE.intro.map((p, i) => (
          <p key={i} className="intro-p">{p}</p>
        ))}
        <dl className="store-meta">
          <div>
            <dt>營業時間</dt>
            <dd>{STORE.hours}</dd>
          </div>
          <div>
            <dt>地點</dt>
            <dd>{STORE.address}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2 className="card-title serif">預約須知</h2>
        <ol className="notice-list">
          {NOTICES.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ol>
      </section>

      <div className="cta">
        <button className="btn-primary full lg" onClick={onStart}>開始預約</button>
        <p className="agree-text">點選「開始預約」即表示您已閱讀並同意本店預約須知與規範</p>
      </div>
    </div>
  );
}

/* ============================================================
   Step 1：姓名、電話、身分
   ============================================================ */

function InfoStep({ name, setName, phone, setPhone, tier, setTier, remembered, onBack, onNext }) {
  const { pricing } = useSettings();
  const [showRemembered, setShowRemembered] = useState(remembered);
  const cleanPhone = normalizePhone(phone);
  const canNext = name.trim() && isValidPhone(cleanPhone) && tier;

  const next = () => {
    setPhone(cleanPhone);
    saveCustomer({ name: name.trim(), phone: cleanPhone });
    onNext();
  };

  const clear = () => {
    saveCustomer(null);
    setName('');
    setPhone('');
    setShowRemembered(false);
  };

  return (
    <section className="card">
      <h2 className="card-title serif">基本資料</h2>
      {showRemembered && (
        <p className="remembered">
          已帶入您上次的資料
          <button type="button" className="link" onClick={clear}>不是我，清除</button>
        </p>
      )}

      <div className="field">
        <label htmlFor="name">姓名</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="請輸入真實姓名" autoComplete="name" />
      </div>

      <div className="field">
        <label htmlFor="phone">手機號碼</label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09xxxxxxxx"
          autoComplete="tel"
        />
        {phone && !isValidPhone(cleanPhone) && <span className="field-error">請輸入 09 開頭的 10 碼手機號碼</span>}
      </div>

      <div className="field">
        <label>預約身分</label>
        <div className="tier-options">
          {tierOptions(pricing).map((o) => (
            <button key={o.id} type="button" className={'tier-option' + (tier === o.id ? ' active' : '')} onClick={() => setTier(o.id)}>
              <span className="tier-option-label">{o.label}</span>
            </button>
          ))}
        </div>
        <span className="field-hint">本店將依您的到店紀錄核對，如有不符將以實際身分計價</span>
      </div>

      <div className="actions">
        <button className="btn-secondary" onClick={onBack}>返回</button>
        <button className="btn-primary grow" disabled={!canNext} onClick={next}>下一步：選擇項目</button>
      </div>
    </section>
  );
}

/* ============================================================
   Step 2：選擇項目（分類導覽列）
   ============================================================ */

function ItemsStep({ tier, selected, toggle, total, onBack, onNext }) {
  const { store, pricing: PRICING, categories: CATEGORIES, services: SERVICES } = useSettings();
  const cats = CATEGORIES.filter((c) => SERVICES.some((s) => s.category === c.id && s.active !== false));
  const [cat, setCat] = useState(cats[0] ? cats[0].id : '');
  const list = SERVICES.filter((s) => s.category === cat && s.active !== false);
  const countIn = (id) => SERVICES.filter((s) => s.category === id && selected.includes(s.id)).length;

  return (
    <div className="items-step">
      <div className={'tier-banner tier-' + tier}>
        <span className="tier-badge">{PRICING.labels[tier]}</span>
        <span>{tierHint(PRICING, tier, store.name)}</span>
      </div>

      <nav className="cat-nav" aria-label="項目分類">
        {cats.map((c) => (
          <button key={c.id} className={'cat-tab' + (cat === c.id ? ' active' : '')} onClick={() => setCat(c.id)}>
            {c.label}
            {countIn(c.id) > 0 && <span className="cat-count">{countIn(c.id)}</span>}
          </button>
        ))}
      </nav>

      <ul className="service-list">
        {list.map((s) => {
          const on = selected.includes(s.id);
          const price = priceOf(s, tier);
          const showOriginal = s.price == null && s.priceNormal > price;
          return (
            <li key={s.id}>
              <button className={'service' + (on ? ' on' : '')} onClick={() => toggle(s.id)} aria-pressed={on}>
                <div className="service-main">
                  <div className="service-name">{s.name}</div>
                  <div className="service-sub">
                    {s.note && <span className="service-note">{s.note}</span>}
                    {s.duration && <span>約 {s.duration} 分鐘</span>}
                  </div>
                </div>
                <div className="service-price">
                  {showOriginal && <s className="price-orig">{fmtMoney(s.priceNormal)}</s>}
                  <span className="price-now serif">{fmtMoney(price)}</span>
                </div>
                <span className="check" aria-hidden="true">{on ? '✓' : '+'}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="bottom-bar">
        <div className="bottom-inner">
          <button className="btn-secondary" onClick={onBack}>返回</button>
          <div className="bottom-sum">
            <span className="muted small">已選 {selected.length} 項</span>
            <span className="serif strong">{fmtMoney(total)}</span>
          </div>
          <button className="btn-primary" disabled={!selected.length} onClick={onNext}>下一步</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Step 3：預約日期與時段
   ============================================================ */

function TimeStep({ date, setDate, time, setTime, onBack, onNext }) {
  const settings = useSettings();
  const { timeSlots: TIME_SLOTS, bookingWindowDays } = settings;
  const minDate = addDays(todayStr(), 1);
  const maxDate = addDays(todayStr(), bookingWindowDays);

  const dayState = (d) => {
    const closed = isClosedDay(d, settings);
    const partial = fullSlotsOf(d, settings).length > 0;
    // 不是公休、只是時段全滿的日子顯示「滿」
    const allFull = closed && partial && !isClosedDay(d, { ...settings, closedSlots: {} });
    return { closed, closedLabel: allFull ? '滿' : '休', partial, selected: d === date, disabled: closed || d < minDate || d > maxDate };
  };

  // 之前選的日期或時段後來變成公休／已滿時，要重選
  const dateOk = date && !dayState(date).disabled;
  const full = dateOk ? fullSlotsOf(date, settings) : [];
  const timeOk = time && !full.includes(time);

  return (
    <section className="card">
      <h2 className="card-title serif">預約時間</h2>

      <div className="field">
        <label>預約日期{dateOk && <span className="picked-date">{fmtDate(date)}</span>}</label>
        <Calendar initial={dateOk ? date : minDate} minDate={minDate} maxDate={maxDate} dayState={dayState} onPick={setDate} />
        <div className="cal-legend">
          <span><i style={{ background: 'var(--rose-deep)' }} />已選擇</span>
          <span><i style={{ background: 'var(--rose-soft)' }} />公休</span>
          <span><small className="dot">●</small> 部分時段已滿</span>
          <span>灰色日期無法預約</span>
        </div>
      </div>

      {dateOk && (
        <div className="field">
          <label>希望時段</label>
          <div className="slot-grid">
            {TIME_SLOTS.map((t) => {
              const isFull = full.includes(t);
              return (
                <button key={t} type="button" className={'slot' + (time === t && !isFull ? ' active' : '')} disabled={isFull} onClick={() => setTime(t)}>
                  {t}
                  {isFull && <span className="slot-full">已滿</span>}
                </button>
              );
            })}
          </div>
          <span className="field-hint">實際時段以官方 LINE 回覆確認為準</span>
        </div>
      )}

      <div className="actions">
        <button className="btn-secondary" onClick={onBack}>返回</button>
        <button className="btn-primary grow" disabled={!dateOk || !timeOk} onClick={onNext}>下一步：確認預約</button>
      </div>
    </section>
  );
}

/* ============================================================
   Step 4：確認預約
   ============================================================ */

function ConfirmStep({ booking, note, setNote, onBack, onNext }) {
  const { pricing: PRICING } = useSettings();
  return (
    <section className="card">
      <h2 className="card-title serif">確認預約內容</h2>

      <dl className="summary">
        <div><dt>姓名</dt><dd>{booking.name}</dd></div>
        <div><dt>電話</dt><dd>{booking.phone}</dd></div>
        <div><dt>日期時間</dt><dd>{fmtDate(booking.date)} {booking.time}</dd></div>
        <div><dt>價格方案</dt><dd><span className={'tier-tag tier-' + booking.tier}>{PRICING.labels[booking.tier]}</span></dd></div>
      </dl>

      <ul className="summary-items">
        {booking.items.map((it) => (
          <li key={it.id}><span>{it.name}</span><span>{fmtMoney(it.price)}</span></li>
        ))}
        <li className="total"><span>預估總金額</span><span className="serif">{fmtMoney(booking.total)}</span></li>
        <li className="deposit"><span>預約訂金</span><span className="serif">{fmtMoney(booking.deposit)}</span></li>
      </ul>
      <p className="muted small">實際金額以現場服務內容為準，訂金將於當日消費中折抵</p>

      <div className="field">
        <label htmlFor="note">備註（選填）</label>
        <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：皮膚較敏感、想詢問的問題…" />
      </div>

      <div className="actions">
        <button className="btn-secondary" onClick={onBack}>修改時間</button>
        <button className="btn-primary grow" onClick={onNext}>確認，前往付訂金</button>
      </div>
      <p className="agree-text">送出預約即表示您同意本店預約須知與規範</p>
    </section>
  );
}

/* ============================================================
   完成：匯款訂金提醒 → 傳送到官方 LINE
   ============================================================ */

function DoneStep({ deposit, bookingText, onBack }) {
  const { deposit: DEPOSIT, line: LINE } = useSettings();
  const [copied, setCopied] = useState('');

  const doCopy = async (key, text) => {
    const ok = await copyText(text);
    setCopied(ok ? key : 'fail');
    setTimeout(() => setCopied(''), 2500);
  };

  return (
    <div className="done">
      <section className="card center">
        <h2 className="card-title serif">請完成訂金匯款</h2>
        <p className="deposit-alert">
          匯款並傳送預約資訊到官方 LINE 後，<strong>預約才算成立</strong><br />
          請於 {DEPOSIT.deadlineHours} 小時內完成
        </p>
      </section>

      <section className="card">
        <h2 className="card-title serif">匯款資訊</h2>
        <dl className="summary">
          <div><dt>訂金金額</dt><dd className="serif strong">{fmtMoney(deposit)}</dd></div>
          <div><dt>銀行</dt><dd>{DEPOSIT.bankName}</dd></div>
          <div>
            <dt>帳號</dt>
            <dd className="with-btn">
              <span>{DEPOSIT.bankAccount}</span>
              <button className="btn-mini" onClick={() => doCopy('account', DEPOSIT.bankAccount.replace(/\D/g, ''))}>
                {copied === 'account' ? '已複製' : '複製'}
              </button>
            </dd>
          </div>
          <div><dt>戶名</dt><dd>{DEPOSIT.accountName}</dd></div>
        </dl>
      </section>

      <section className="card">
        <h2 className="card-title serif">匯款完成後</h2>
        <ol className="how-list">
          <li>按下「傳送到官方 LINE」，預約資訊會自動帶入</li>
          <li>在最後一行補上<strong>匯款帳號末五碼</strong>後送出</li>
          <li>我們確認後會在 LINE 回覆您，預約即完成</li>
        </ol>

        <pre className="booking-text">{bookingText}</pre>

        <a className="btn-line full lg" href={lineMessageUrl(LINE.id, bookingText)} target="_blank" rel="noreferrer">傳送到官方 LINE</a>
        <button className="btn-secondary full copy-btn" onClick={() => doCopy('booking', bookingText)}>
          {copied === 'booking' ? '已複製 ✓' : '沒有自動帶入？按這裡複製預約資訊'}
        </button>
        {copied === 'fail' && <p className="form-error">此瀏覽器無法自動複製，請長按上方文字手動複製</p>}
        <p className="agree-text">官方 LINE：{LINE.id}</p>
      </section>

      <button className="btn-secondary full" onClick={onBack}>返回修改預約內容</button>
    </div>
  );
}
