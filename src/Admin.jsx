import React, { useEffect, useState } from 'react';
import { loadSettings, saveSettings } from './settings.js';
import { WEEKDAYS, fmtDate, todayStr, weekdayOf, isClosedDay } from './dates.js';
import Calendar from './Calendar.jsx';

const SECTIONS = [
  { id: 'store', label: '店家資訊' },
  { id: 'notices', label: '預約須知' },
  { id: 'services', label: '項目與價格' },
  { id: 'pricing', label: '價格規則' },
  { id: 'deposit', label: '訂金與 LINE' },
  { id: 'slots', label: '時段與公休' },
];

function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// 儲存前把數字欄位轉成數字、去掉空白
function normalize(s) {
  return {
    ...s,
    pricing: { ...s.pricing, revisitWindowDays: toNum(s.pricing.revisitWindowDays) || 42 },
    deposit: { ...s.deposit, amount: toNum(s.deposit.amount), deadlineHours: toNum(s.deposit.deadlineHours) || 24 },
    line: { id: s.line.id.trim() },
    notices: s.notices.map((n) => n.trim()).filter(Boolean),
    store: { ...s.store, intro: s.store.intro.map((p) => p.trim()).filter(Boolean) },
    timeSlots: [...s.timeSlots].sort(),
    closedDates: [...new Set(s.closedDates)].filter((d) => d >= todayStr()).sort(),
    closedWeekdays: [...s.closedWeekdays].sort(),
    closedSlots: Object.fromEntries(
      Object.entries(s.closedSlots || {})
        .filter(([d, list]) => d >= todayStr() && list.length)
        .map(([d, list]) => [d, [...list].sort()])
    ),
    bookingWindowDays: toNum(s.bookingWindowDays) || 60,
    services: s.services.map((it) => {
      const base = { id: it.id, category: it.category, name: it.name.trim(), active: it.active !== false };
      if (it.note && it.note.trim()) base.note = it.note.trim();
      if (it.duration !== '' && it.duration != null) base.duration = toNum(it.duration);
      if (it.price != null) return { ...base, price: toNum(it.price) };
      return {
        ...base,
        priceFirstTrial: toNum(it.priceFirstTrial),
        priceRevisit: toNum(it.priceRevisit),
        priceNormal: toNum(it.priceNormal),
      };
    }),
  };
}

function validate(s) {
  if (!s.store.name.trim()) return '請填寫店名';
  if (!s.line.id.trim()) return '請填寫官方 LINE ID';
  if (s.services.some((it) => !it.name.trim())) return '有項目沒有填名稱（在「項目與價格」）';
  if (!s.timeSlots.length) return '至少要有一個預約時段';
  if (s.closedWeekdays.length >= 7) return '每週公休不能七天全選';
  return '';
}

/* ============================================================
   編輯畫面
   ============================================================ */

export default function Admin() {
  const [draft, setDraft] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [section, setSection] = useState('store');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings({ timeoutMs: 8000 }).then(({ settings, ok }) => {
      setDraft(settings);
      setLoadError(!ok);
    });
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = (fn) => {
    setDraft((prev) => fn(prev));
    setDirty(true);
    setStatus('');
  };

  const save = async () => {
    const err = validate(draft);
    if (err) {
      setStatus(err);
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const clean = normalize(draft);
      await saveSettings(clean);
      setDraft(clean);
      setDirty(false);
      setStatus('已儲存，前台已更新');
    } catch {
      setStatus('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  if (!draft) return <div className="admin-loading">載入中…</div>;

  return (
    <div className="admin">
      <aside className="admin-side">
        <img src="/logo.png" alt="" className="admin-logo" />
        <div className="admin-sub">預約系統後台</div>
        <ul className="admin-nav">
          {SECTIONS.map((s) => (
            <li key={s.id} className={'admin-nav-item' + (section === s.id ? ' active' : '')} onClick={() => setSection(s.id)}>
              {s.label}
            </li>
          ))}
        </ul>
        <div className="admin-side-foot">
          <a href="/" target="_blank" rel="noreferrer">查看預約頁面 ↗</a>
        </div>
      </aside>

      <nav className="admin-tabs">
        {SECTIONS.map((s) => (
          <button key={s.id} className={'cat-tab' + (section === s.id ? ' active' : '')} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      <main className="admin-main">
        {loadError && <p className="admin-warn">讀取目前設定失敗，顯示的是預設內容。請重新整理再試一次，確認無誤再儲存。</p>}

        {section === 'store' && <StoreSection draft={draft} update={update} />}
        {section === 'notices' && <NoticesSection draft={draft} update={update} />}
        {section === 'services' && <ServicesSection draft={draft} update={update} />}
        {section === 'pricing' && <PricingSection draft={draft} update={update} />}
        {section === 'deposit' && <DepositSection draft={draft} update={update} />}
        {section === 'slots' && <SlotsSection draft={draft} update={update} />}

        <div className="admin-mobile-foot">
          <a href="/" target="_blank" rel="noreferrer">查看預約頁面 ↗</a>
        </div>
      </main>

      <div className="save-bar">
        <span className={'save-status' + (status && status.startsWith('已儲存') ? ' ok' : status ? ' err' : '')}>
          {status || (dirty ? '有尚未儲存的修改' : '目前內容與預約頁面一致')}
        </span>
        <button className="btn-primary" disabled={!dirty || saving} onClick={save}>
          {saving ? '儲存中…' : '儲存並發布'}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   共用欄位
   ============================================================ */

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function SectionHead({ title, desc }) {
  return (
    <div className="admin-head">
      <h2 className="serif">{title}</h2>
      {desc && <p className="muted">{desc}</p>}
    </div>
  );
}

function moveItem(list, index, dir) {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/* ============================================================
   各區塊
   ============================================================ */

function StoreSection({ draft, update }) {
  const set = (key) => (e) => {
    const value = e.target.value;
    update((d) => ({ ...d, store: { ...d.store, [key]: value } }));
  };
  return (
    <section className="card">
      <SectionHead title="店家資訊" desc="顯示在預約頁面的首頁" />
      <Field label="店名"><input value={draft.store.name} onChange={set('name')} /></Field>
      <Field label="標語"><input value={draft.store.tagline} onChange={set('tagline')} /></Field>
      <Field label="店家自介" hint="每換一行就是一個段落">
        <textarea
          rows={6}
          value={draft.store.intro.join('\n')}
          onChange={(e) => {
            const value = e.target.value;
            update((d) => ({ ...d, store: { ...d.store, intro: value.split('\n') } }));
          }}
        />
      </Field>
      <Field label="營業時間"><input value={draft.store.hours} onChange={set('hours')} /></Field>
      <Field label="地址"><input value={draft.store.address} onChange={set('address')} /></Field>
    </section>
  );
}

function NoticesSection({ draft, update }) {
  const setNotices = (fn) => update((d) => ({ ...d, notices: fn(d.notices) }));
  return (
    <section className="card">
      <SectionHead title="預約須知" desc="客人開始預約前會看到，並同意這些規範" />
      <ol className="edit-list">
        {draft.notices.map((n, i) => (
          <li key={i}>
            <span className="edit-num">{i + 1}</span>
            <textarea rows={2} value={n} onChange={(e) => { const v = e.target.value; setNotices((l) => l.map((x, j) => (j === i ? v : x))); }} />
            <div className="row-tools">
              <button className="icon-btn" onClick={() => setNotices((l) => moveItem(l, i, -1))} aria-label="上移">↑</button>
              <button className="icon-btn" onClick={() => setNotices((l) => moveItem(l, i, 1))} aria-label="下移">↓</button>
              <button className="icon-btn danger" onClick={() => setNotices((l) => l.filter((_, j) => j !== i))} aria-label="刪除">✕</button>
            </div>
          </li>
        ))}
      </ol>
      <button className="btn-secondary" onClick={() => setNotices((l) => [...l, ''])}>＋ 新增一條</button>
    </section>
  );
}

function ServicesSection({ draft, update }) {
  const [cat, setCat] = useState(draft.categories[0] ? draft.categories[0].id : '');
  const current = draft.categories.find((c) => c.id === cat);
  const list = draft.services.filter((s) => s.category === cat);
  const { labels } = draft.pricing;

  const setServices = (fn) => update((d) => ({ ...d, services: fn(d.services) }));
  const patch = (id, changes) => setServices((all) => all.map((s) => (s.id === id ? { ...s, ...changes } : s)));

  // 在同分類內上下移動
  const move = (id, dir) =>
    setServices((all) => {
      const idxs = all.map((s, i) => (s.category === cat ? i : -1)).filter((i) => i >= 0);
      const pos = idxs.findIndex((i) => all[i].id === id);
      const target = pos + dir;
      if (target < 0 || target >= idxs.length) return all;
      const next = [...all];
      [next[idxs[pos]], next[idxs[target]]] = [next[idxs[target]], next[idxs[pos]]];
      return next;
    });

  const addService = () => {
    const fixed = cat === 'addon' || cat === 'product';
    const item = fixed
      ? { id: uid(), category: cat, name: '', price: 0, active: true }
      : { id: uid(), category: cat, name: '', duration: 30, priceFirstTrial: 0, priceRevisit: 0, priceNormal: 0, active: true };
    setServices((all) => [...all, item]);
  };

  const addCategory = () => {
    const id = 'c' + uid();
    update((d) => ({ ...d, categories: [...d.categories, { id, label: '新分類' }] }));
    setCat(id);
  };

  const removeCategory = () => {
    if (list.length) return;
    const rest = draft.categories.filter((c) => c.id !== cat);
    update((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== cat) }));
    setCat(rest[0] ? rest[0].id : '');
  };

  return (
    <section>
      <div className="card">
        <SectionHead title="項目與價格" desc="選擇分類後，可以新增、修改、排序或暫停項目" />
        <nav className="cat-nav admin-cat-nav">
          {draft.categories.map((c) => (
            <button key={c.id} className={'cat-tab' + (cat === c.id ? ' active' : '')} onClick={() => setCat(c.id)}>
              {c.label || '（未命名）'}
              <span className="cat-count muted-count">{draft.services.filter((s) => s.category === c.id).length}</span>
            </button>
          ))}
          <button className="cat-tab add" onClick={addCategory}>＋ 分類</button>
        </nav>

        {current && (
          <div className="cat-edit">
            <Field label="分類名稱">
              <input
                value={current.label}
                onChange={(e) => {
                  const v = e.target.value;
                  update((d) => ({ ...d, categories: d.categories.map((c) => (c.id === cat ? { ...c, label: v } : c)) }));
                }}
              />
            </Field>
            <div className="cat-edit-tools">
              <button className="icon-btn" onClick={() => update((d) => ({ ...d, categories: moveItem(d.categories, d.categories.findIndex((c) => c.id === cat), -1) }))}>← 往前</button>
              <button className="icon-btn" onClick={() => update((d) => ({ ...d, categories: moveItem(d.categories, d.categories.findIndex((c) => c.id === cat), 1) }))}>往後 →</button>
              <button className="icon-btn danger" disabled={list.length > 0} title={list.length ? '分類內還有項目，請先刪除或移走' : ''} onClick={removeCategory}>刪除分類</button>
            </div>
          </div>
        )}
      </div>

      {list.map((s, i) => {
        const fixed = s.price != null;
        return (
          <div key={s.id} className={'card service-edit' + (s.active === false ? ' paused' : '')}>
            <div className="service-edit-head">
              <input className="name-input" value={s.name} placeholder="項目名稱" onChange={(e) => patch(s.id, { name: e.target.value })} />
              <label className="switch">
                <input type="checkbox" checked={s.active !== false} onChange={(e) => patch(s.id, { active: e.target.checked })} />
                <span>{s.active !== false ? '上架中' : '已暫停'}</span>
              </label>
            </div>

            <div className="grid-2">
              <Field label="小標籤（選填）"><input value={s.note || ''} placeholder="例如：人氣組合" onChange={(e) => patch(s.id, { note: e.target.value })} /></Field>
              <Field label="時間（分鐘，選填）"><input type="number" inputMode="numeric" value={s.duration ?? ''} onChange={(e) => patch(s.id, { duration: e.target.value })} /></Field>
            </div>

            <div className="price-mode">
              <button className={'pill' + (!fixed ? ' active' : '')} onClick={() => fixed && patch(s.id, { price: undefined, priceFirstTrial: s.price, priceRevisit: s.price, priceNormal: s.price })}>依身分三種價格</button>
              <button className={'pill' + (fixed ? ' active' : '')} onClick={() => !fixed && patch(s.id, { price: s.priceNormal ?? 0 })}>固定價格</button>
            </div>

            {fixed ? (
              <Field label="價格"><input type="number" inputMode="numeric" value={s.price} onChange={(e) => patch(s.id, { price: e.target.value })} /></Field>
            ) : (
              <div className="grid-3">
                <Field label={labels.trial}><input type="number" inputMode="numeric" value={s.priceFirstTrial ?? ''} onChange={(e) => patch(s.id, { priceFirstTrial: e.target.value })} /></Field>
                <Field label={labels.revisit}><input type="number" inputMode="numeric" value={s.priceRevisit ?? ''} onChange={(e) => patch(s.id, { priceRevisit: e.target.value })} /></Field>
                <Field label={labels.normal}><input type="number" inputMode="numeric" value={s.priceNormal ?? ''} onChange={(e) => patch(s.id, { priceNormal: e.target.value })} /></Field>
              </div>
            )}

            <div className="service-edit-foot">
              <select value={s.category} onChange={(e) => patch(s.id, { category: e.target.value })} aria-label="移到其他分類">
                {draft.categories.map((c) => (
                  <option key={c.id} value={c.id}>移到：{c.label}</option>
                ))}
              </select>
              <div className="row-tools">
                <button className="icon-btn" disabled={i === 0} onClick={() => move(s.id, -1)} aria-label="上移">↑</button>
                <button className="icon-btn" disabled={i === list.length - 1} onClick={() => move(s.id, 1)} aria-label="下移">↓</button>
                <button
                  className="icon-btn danger"
                  onClick={() => window.confirm(`確定刪除「${s.name || '未命名項目'}」？`) && setServices((all) => all.filter((x) => x.id !== s.id))}
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {current && <button className="btn-secondary full add-service" onClick={addService}>＋ 新增項目到「{current.label}」</button>}
    </section>
  );
}

function PricingSection({ draft, update }) {
  const setLabel = (key) => (e) => {
    const v = e.target.value;
    update((d) => ({ ...d, pricing: { ...d.pricing, labels: { ...d.pricing.labels, [key]: v } } }));
  };
  return (
    <section className="card">
      <SectionHead title="價格規則" desc="客人預約時自己選擇身分，你在 LINE 收到後再核對" />
      <Field label="回訪價期限（天）" hint="最近一次到店後幾天內再來，享回訪價。6 週請填 42">
        <input
          type="number"
          inputMode="numeric"
          value={draft.pricing.revisitWindowDays}
          onChange={(e) => { const v = e.target.value; update((d) => ({ ...d, pricing: { ...d.pricing, revisitWindowDays: v } })); }}
        />
      </Field>
      <div className="grid-3">
        <Field label="第一次的價格名稱"><input value={draft.pricing.labels.trial} onChange={setLabel('trial')} /></Field>
        <Field label="回訪的價格名稱"><input value={draft.pricing.labels.revisit} onChange={setLabel('revisit')} /></Field>
        <Field label="超過期限的價格名稱"><input value={draft.pricing.labels.normal} onChange={setLabel('normal')} /></Field>
      </div>
    </section>
  );
}

function DepositSection({ draft, update }) {
  const set = (key) => (e) => {
    const v = e.target.value;
    update((d) => ({ ...d, deposit: { ...d.deposit, [key]: v } }));
  };
  return (
    <section className="card">
      <SectionHead title="訂金與 LINE" desc="顯示在客人確認預約後的匯款提醒頁" />
      <div className="grid-2">
        <Field label="訂金金額"><input type="number" inputMode="numeric" value={draft.deposit.amount} onChange={set('amount')} /></Field>
        <Field label="幾小時內完成匯款"><input type="number" inputMode="numeric" value={draft.deposit.deadlineHours} onChange={set('deadlineHours')} /></Field>
      </div>
      <Field label="銀行名稱（含代碼）"><input value={draft.deposit.bankName} placeholder="例如：國泰世華（013）" onChange={set('bankName')} /></Field>
      <Field label="帳號"><input value={draft.deposit.bankAccount} onChange={set('bankAccount')} /></Field>
      <Field label="戶名"><input value={draft.deposit.accountName} onChange={set('accountName')} /></Field>
      <Field label="官方 LINE ID" hint="含 @，例如 @abc1234。客人按「傳送到官方 LINE」會打開這個帳號的聊天室">
        <input value={draft.line.id} onChange={(e) => { const v = e.target.value; update((d) => ({ ...d, line: { ...d.line, id: v } })); }} />
      </Field>
    </section>
  );
}

function SlotsSection({ draft, update }) {
  const [newSlot, setNewSlot] = useState('');
  const [mode, setMode] = useState('day'); // day：整天公休／slots：關閉部分時段
  const [picked, setPicked] = useState('');
  const slots = [...draft.timeSlots].sort();
  const today = todayStr();
  const upcoming = draft.closedDates.filter((d) => d >= today).sort();
  const closedSlots = draft.closedSlots || {};
  const partialDays = Object.keys(closedSlots).filter((d) => d >= today && closedSlots[d].length).sort();

  const setDaySlots = (date, list) =>
    update((d) => {
      const next = { ...(d.closedSlots || {}) };
      if (list.length) next[date] = list;
      else delete next[date];
      return { ...d, closedSlots: next };
    });
  const toggleSlot = (t) => {
    const cur = closedSlots[picked] || [];
    setDaySlots(picked, cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  };

  const add = () => {
    if (!newSlot || draft.timeSlots.includes(newSlot)) return;
    update((d) => ({ ...d, timeSlots: [...d.timeSlots, newSlot] }));
    setNewSlot('');
  };
  const toggleWeekday = (w) =>
    update((d) => ({
      ...d,
      closedWeekdays: d.closedWeekdays.includes(w) ? d.closedWeekdays.filter((x) => x !== w) : [...d.closedWeekdays, w],
    }));
  const toggleDate = (date) =>
    update((d) => ({
      ...d,
      closedDates: d.closedDates.includes(date) ? d.closedDates.filter((x) => x !== date) : [...d.closedDates, date],
    }));

  const dayState = (d) => {
    const weekly = draft.closedWeekdays.includes(weekdayOf(d));
    const dayOff = weekly || draft.closedDates.includes(d);
    const allFull = !dayOff && isClosedDay(d, draft);
    const partial = (closedSlots[d] || []).length > 0;
    // 每週公休的日子在這裡不能點，要到下方取消；關閉時段模式下公休日也不能點
    return {
      closed: dayOff || allFull,
      closedLabel: allFull ? '滿' : '休',
      partial,
      selected: mode === 'slots' && d === picked,
      disabled: d < today || weekly || (mode === 'slots' && dayOff),
    };
  };

  return (
    <section>
      <div className="card">
        <SectionHead title="公休日與已滿時段" desc="先選擇要做什麼，再點月曆上的日期" />
        <div className="price-mode mode-switch">
          <button className={'pill' + (mode === 'day' ? ' active' : '')} onClick={() => setMode('day')}>整天公休</button>
          <button className={'pill' + (mode === 'slots' ? ' active' : '')} onClick={() => setMode('slots')}>關閉部分時段（已滿）</button>
        </div>
        <p className="muted small mode-hint">
          {mode === 'day' ? '點日期設為公休，再點一次取消' : '點日期，再點下方已經滿的時段'}
        </p>
        <Calendar minDate={today} dayState={dayState} onPick={mode === 'day' ? toggleDate : setPicked} />

        {mode === 'slots' && picked && (
          <div className="slot-close">
            <div className="field-label-row">{fmtDate(picked)} 已滿的時段（點選切換）</div>
            <div className="weekday-picks">
              {slots.map((t) => (
                <button key={t} type="button" className={'pill' + ((closedSlots[picked] || []).includes(t) ? ' active' : '')} onClick={() => toggleSlot(t)}>
                  {(closedSlots[picked] || []).includes(t) ? `${t} 已滿` : t}
                </button>
              ))}
            </div>
          </div>
        )}

        {partialDays.length > 0 && (
          <div className="closed-list">
            {partialDays.map((d) => (
              <span key={d} className="slot-chip">
                {fmtDate(d)} {closedSlots[d].slice().sort().join('、')} 已滿
                <button aria-label={`恢復 ${d} 所有時段`} onClick={() => setDaySlots(d, [])}>✕</button>
              </span>
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="closed-list">
            {upcoming.map((d) => (
              <span key={d} className="slot-chip">
                {fmtDate(d)}
                <button aria-label={`取消 ${d} 公休`} onClick={() => toggleDate(d)}>✕</button>
              </span>
            ))}
          </div>
        )}

        <Field label="每週固定公休" hint="選到的星期每週都不開放預約">
          <div className="weekday-picks">
            {WEEKDAYS.map((w, i) => (
              <button key={w} type="button" className={'pill' + (draft.closedWeekdays.includes(i) ? ' active' : '')} onClick={() => toggleWeekday(i)}>
                週{w}
              </button>
            ))}
          </div>
        </Field>

        <Field label="開放預約天數" hint="客人最多可以預約幾天後，例如 60 天">
          <input
            type="number"
            inputMode="numeric"
            value={draft.bookingWindowDays}
            onChange={(e) => { const v = e.target.value; update((d) => ({ ...d, bookingWindowDays: v })); }}
          />
        </Field>
      </div>

      <div className="card">
        <SectionHead title="預約時段" desc="客人可選擇的希望時段，實際時間由你在 LINE 回覆確認" />
        <div className="slot-chips">
          {slots.map((t) => (
            <span key={t} className="slot-chip">
              {t}
              <button aria-label={`刪除 ${t}`} onClick={() => update((d) => ({ ...d, timeSlots: d.timeSlots.filter((x) => x !== t) }))}>✕</button>
            </span>
          ))}
        </div>
        <div className="add-slot">
          <input type="time" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} />
          <button className="btn-secondary" disabled={!newSlot} onClick={add}>＋ 新增時段</button>
        </div>
      </div>
    </section>
  );
}
