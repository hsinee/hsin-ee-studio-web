import React, { useEffect, useState } from 'react';
import { loadSettings, saveSettings, shortListLabel } from './settings.js';
import { WEEKDAYS, fmtDate, todayStr, weekdayOf, isClosedDay } from './dates.js';
import Calendar from './Calendar.jsx';

function sectionsOf(draft) {
  return [
    { id: 'notes', label: '預約須知' },
    { id: 'slots', label: '時段與公休' },
    { id: 'care-before', label: draft.care.before.tab || '蠟前遵守' },
    { id: 'care-after', label: draft.care.after.tab || '蠟後必看' },
    ...draft.priceLists.map((l, i) => ({ id: 'price-' + i, label: `${shortListLabel(l.label) || i + 1}價目表` })),
    { id: 'products', label: '產品介紹' },
    { id: 'bundles', label: '產品組合' },
    { id: 'store', label: '店家資訊與頁底' },
  ];
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const trim = (v) => String(v ?? '').trim();
const lines = (text) => text.split('\n');

// 儲存前去掉空白、空行，並整理時段資料
function normalize(s) {
  return {
    ...s,
    line: { id: trim(s.line.id) },
    store: { ...s.store, intro: s.store.intro.map(trim).filter(Boolean) },
    priceLists: s.priceLists.map((l) => ({
      ...l,
      sections: l.sections.map((sec) => ({
        ...sec,
        columns: sec.columns.map((c) => ({ zh: trim(c.zh), en: trim(c.en) })),
        items: sec.items
          .filter((it) => trim(it.name))
          .map((it) => {
            const item = { name: trim(it.name), en: trim(it.en), prices: sec.columns.map((_, ci) => trim((it.prices || [])[ci])) };
            if (trim(it.note)) item.note = trim(it.note);
            return item;
          }),
      })),
    })),
    bookingNotes: { ...s.bookingNotes, items: s.bookingNotes.items.map(trim).filter(Boolean) },
    care: Object.fromEntries(
      Object.entries(s.care).map(([k, part]) => [
        k,
        { ...part, blocks: part.blocks.map((b) => ({ ...b, items: b.items.map(trim).filter(Boolean) })) },
      ])
    ),
    products: {
      intro: {
        ...s.products.intro,
        items: s.products.intro.items
          .filter((p) => trim(p.name))
          .map((p) => ({ ...p, name: trim(p.name), size: trim(p.size), price: trim(p.price), points: p.points.map(trim).filter(Boolean) })),
      },
      bundles: {
        ...s.products.bundles,
        items: s.products.bundles.items
          .filter((b) => trim(b.title))
          .map((b) => ({ ...b, title: trim(b.title), subtitle: trim(b.subtitle), price: trim(b.price), original: trim(b.original), lines: b.lines.map(trim).filter(Boolean) })),
      },
    },
    timeSlots: [...s.timeSlots].sort(),
    closedDates: [...new Set(s.closedDates)].filter((d) => d >= todayStr()).sort(),
    closedWeekdays: [...s.closedWeekdays].sort(),
    closedSlots: Object.fromEntries(
      Object.entries(s.closedSlots || {})
        .filter(([d, list]) => d >= todayStr() && list.length)
        .map(([d, list]) => [d, [...list].sort()])
    ),
    openNextMonthDay: Math.min(Math.max(toNum(s.openNextMonthDay), 0), 28),
  };
}

function validate(s) {
  if (!trim(s.store.name)) return '請填寫店名';
  if (!trim(s.line.id)) return '請填寫官方 LINE ID';
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
  const [section, setSection] = useState('notes');
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

  const sections = sectionsOf(draft);
  const priceIndex = section.startsWith('price-') ? Number(section.slice(6)) : -1;

  return (
    <div className="admin">
      <aside className="admin-side">
        <img src="/logo.png" alt="" className="admin-logo" />
        <div className="admin-sub">店家後台</div>
        <ul className="admin-nav">
          {sections.map((s) => (
            <li key={s.id} className={'admin-nav-item' + (section === s.id ? ' active' : '')} onClick={() => setSection(s.id)}>
              {s.label}
            </li>
          ))}
        </ul>
        <div className="admin-side-foot">
          <a href="/" target="_blank" rel="noreferrer">查看前台頁面 ↗</a>
        </div>
      </aside>

      <nav className="admin-tabs">
        {sections.map((s) => (
          <button key={s.id} className={'cat-tab' + (section === s.id ? ' active' : '')} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      <main className="admin-main">
        {loadError && <p className="admin-warn">讀取目前設定失敗，顯示的是預設內容。請重新整理再試一次，確認無誤再儲存。</p>}

        {section === 'store' && <StoreSection draft={draft} update={update} />}
        {priceIndex >= 0 && draft.priceLists[priceIndex] && <PriceListSection key={priceIndex} index={priceIndex} draft={draft} update={update} />}
        {section === 'notes' && <NotesSection draft={draft} update={update} />}
        {section === 'care-before' && <CareSection key="before" part="before" draft={draft} update={update} />}
        {section === 'care-after' && <CareSection key="after" part="after" draft={draft} update={update} />}
        {section === 'products' && <ProductsSection draft={draft} update={update} />}
        {section === 'bundles' && <BundlesSection draft={draft} update={update} />}
        {section === 'slots' && <SlotsSection draft={draft} update={update} />}

        <div className="admin-mobile-foot">
          <a href="/" target="_blank" rel="noreferrer">查看前台頁面 ↗</a>
        </div>
      </main>

      <div className="save-bar">
        <span className={'save-status' + (status && status.startsWith('已儲存') ? ' ok' : status ? ' err' : '')}>
          {status || (dirty ? '有尚未儲存的修改' : '目前內容與前台一致')}
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

function RowTools({ index, count, onMove, onDelete, confirmText }) {
  return (
    <div className="row-tools">
      <button className="icon-btn" disabled={index === 0} onClick={() => onMove(-1)} aria-label="上移">↑</button>
      <button className="icon-btn" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="下移">↓</button>
      <button className="icon-btn danger" onClick={() => (!confirmText || window.confirm(confirmText)) && onDelete()} aria-label="刪除">刪除</button>
    </div>
  );
}

/* ============================================================
   店家資訊
   ============================================================ */

function StoreSection({ draft, update }) {
  const set = (key) => (e) => {
    const value = e.target.value;
    update((d) => ({ ...d, store: { ...d.store, [key]: value } }));
  };
  return (
    <section className="card">
      <SectionHead title="店家資訊與頁底" desc="顯示在每一頁的上方、下方「關於」方塊與頁底" />
      <div className="grid-2">
        <Field label="店名"><input value={draft.store.name} onChange={set('name')} /></Field>
        <Field label="標語"><input value={draft.store.tagline} placeholder="例如：PREMIUM WAXING" onChange={set('tagline')} /></Field>
      </div>
      <Field label="關於（店家介紹）" hint="每換一行就是一個段落">
        <textarea
          rows={6}
          value={draft.store.intro.join('\n')}
          onChange={(e) => {
            const value = e.target.value;
            update((d) => ({ ...d, store: { ...d.store, intro: lines(value) } }));
          }}
        />
      </Field>
      <Field label="署名（選填）"><input value={draft.store.signature || ''} placeholder="例如：— 芯伊創辦人 Winnie" onChange={set('signature')} /></Field>
      <div className="grid-2">
        <Field label="營業時間（選填）"><input value={draft.store.hours || ''} onChange={set('hours')} /></Field>
        <Field label="地址（選填）"><input value={draft.store.address || ''} onChange={set('address')} /></Field>
      </div>
      <div className="grid-2">
        <Field label="官方 LINE ID" hint="含 @，客人按「官方 LINE 預約」會打開這個帳號">
          <input value={draft.line.id} onChange={(e) => { const v = e.target.value; update((d) => ({ ...d, line: { ...d.line, id: v } })); }} />
        </Field>
        <Field label="Instagram 帳號（選填）" hint="不用加 @，例如 hsin.ee">
          <input value={draft.store.instagram || ''} onChange={set('instagram')} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="頁底標籤（選填）"><input value={draft.store.footerBadge || ''} placeholder="例如：預約制" onChange={set('footerBadge')} /></Field>
        <Field label="頁底文字（選填）"><input value={draft.store.footerText || ''} placeholder="例如：BY APPOINTMENT ONLY" onChange={set('footerText')} /></Field>
      </div>
    </section>
  );
}

/* ============================================================
   價目表
   ============================================================ */

function PriceListSection({ index, draft, update }) {
  const list = draft.priceLists[index];
  const setList = (fn) => update((d) => ({ ...d, priceLists: d.priceLists.map((l, i) => (i === index ? fn(l) : l)) }));
  const setField = (key) => (e) => {
    const v = e.target.value;
    setList((l) => ({ ...l, [key]: v }));
  };
  const setSections = (fn) => setList((l) => ({ ...l, sections: fn(l.sections) }));
  const setSection = (si, fn) => setSections((all) => all.map((s, i) => (i === si ? fn(s) : s)));

  const addSection = () =>
    setSections((all) => [
      ...all,
      { title: '新區塊', en: '', columns: [{ zh: '體驗價', en: 'EXPERIENCE' }, { zh: '單次價', en: 'SINGLE' }], items: [] },
    ]);

  return (
    <section>
      <div className="card">
        <SectionHead title={`${shortListLabel(list.label)}價目表`} desc="每個區塊會變成價目表上方的分類按鈕；價格可以直接打文字，例如 $1,200、依毛量報價、-" />
        <div className="grid-2">
          <Field label="切換按鈕名稱"><input value={list.label} placeholder="例如：女生" onChange={setField('label')} /></Field>
          <Field label="更新日期（選填）"><input value={list.updated || ''} placeholder="例如：2026.10.01 更新" onChange={setField('updated')} /></Field>
        </div>
        <Field label="底部備註（選填）"><input value={list.footnote || ''} placeholder="例如：*六周內回除皆享體驗價" onChange={setField('footnote')} /></Field>
      </div>

      {list.sections.map((sec, si) => (
        <PriceSectionEditor
          key={si}
          sec={sec}
          index={si}
          count={list.sections.length}
          onChange={(fn) => setSection(si, fn)}
          onMove={(dir) => setSections((all) => moveItem(all, si, dir))}
          onDelete={() => setSections((all) => all.filter((_, i) => i !== si))}
        />
      ))}

      <button className="btn-secondary full add-service" onClick={addSection}>＋ 新增區塊（例如：小部位、組合優惠）</button>
    </section>
  );
}

function PriceSectionEditor({ sec, index, count, onChange, onMove, onDelete }) {
  const set = (key) => (e) => {
    const v = e.target.value;
    onChange((s) => ({ ...s, [key]: v }));
  };
  const setColumn = (ci, key, v) => onChange((s) => ({ ...s, columns: s.columns.map((c, i) => (i === ci ? { ...c, [key]: v } : c)) }));
  const addColumn = () =>
    onChange((s) => ({ ...s, columns: [...s.columns, { zh: '', en: '' }], items: s.items.map((it) => ({ ...it, prices: [...(it.prices || []), ''] })) }));
  const removeColumn = (ci) =>
    onChange((s) => ({
      ...s,
      columns: s.columns.filter((_, i) => i !== ci),
      items: s.items.map((it) => ({ ...it, prices: (it.prices || []).filter((_, i) => i !== ci) })),
    }));
  const setItems = (fn) => onChange((s) => ({ ...s, items: fn(s.items) }));
  const setItem = (ii, changes) => setItems((all) => all.map((it, i) => (i === ii ? { ...it, ...changes } : it)));

  return (
    <div className="card price-sec-edit">
      <div className="service-edit-head">
        <input className="name-input" value={sec.title} placeholder="區塊名稱，例如：小部位" onChange={set('title')} />
        <input className="en-input" value={sec.en || ''} placeholder="英文，例如：SMALL PARTS" onChange={set('en')} />
      </div>

      <div className="col-edit">
        <span className="col-edit-label">價格欄位</span>
        {sec.columns.map((c, ci) => (
          <div key={ci} className="col-chip">
            <input value={c.zh} placeholder="中文" onChange={(e) => setColumn(ci, 'zh', e.target.value)} />
            <input value={c.en} placeholder="英文" onChange={(e) => setColumn(ci, 'en', e.target.value)} />
            {sec.columns.length > 1 && (
              <button className="icon-btn danger" onClick={() => removeColumn(ci)} aria-label="刪除欄位">✕</button>
            )}
          </div>
        ))}
        {sec.columns.length < 3 && <button className="icon-btn" onClick={addColumn}>＋ 欄位</button>}
      </div>

      <div className="item-edit-list">
        {sec.items.map((it, ii) => (
          <div key={ii} className="item-edit">
            <div className="item-edit-main">
              <input value={it.name} placeholder="項目名稱" onChange={(e) => setItem(ii, { name: e.target.value })} />
              <input value={it.en || ''} placeholder="英文（選填）" onChange={(e) => setItem(ii, { en: e.target.value })} />
            </div>
            <div className="item-edit-prices">
              {sec.columns.map((c, ci) => (
                <label key={ci}>
                  <span>{c.zh || `價格 ${ci + 1}`}</span>
                  <input
                    value={(it.prices || [])[ci] || ''}
                    placeholder="$"
                    onChange={(e) => {
                      const v = e.target.value;
                      setItem(ii, { prices: sec.columns.map((_, k) => (k === ci ? v : (it.prices || [])[k] || '')) });
                    }}
                  />
                </label>
              ))}
            </div>
            <div className="item-edit-foot">
              <input className="note-input" value={it.note || ''} placeholder="備註（選填），例如：含修復面膜一片" onChange={(e) => setItem(ii, { note: e.target.value })} />
              <RowTools
                index={ii}
                count={sec.items.length}
                onMove={(dir) => setItems((all) => moveItem(all, ii, dir))}
                onDelete={() => setItems((all) => all.filter((_, i) => i !== ii))}
                confirmText={`確定刪除「${it.name || '未命名項目'}」？`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="service-edit-foot">
        <button className="btn-secondary" onClick={() => setItems((all) => [...all, { name: '', en: '', prices: sec.columns.map(() => '') }])}>＋ 新增項目</button>
        <RowTools index={index} count={count} onMove={onMove} onDelete={onDelete} confirmText={`確定刪除整個「${sec.title || '區塊'}」？`} />
      </div>
    </div>
  );
}

/* ============================================================
   預約須知
   ============================================================ */

function NotesSection({ draft, update }) {
  const notes = draft.bookingNotes;
  const setNotes = (fn) => update((d) => ({ ...d, bookingNotes: fn(d.bookingNotes) }));
  const setItems = (fn) => setNotes((n) => ({ ...n, items: fn(n.items) }));
  return (
    <section className="card">
      <SectionHead title="預約須知" desc="每一條可以換行；用 **兩個星號** 包起來的字會變成粗體" />
      <div className="grid-2">
        <Field label="標題"><input value={notes.title} onChange={(e) => { const v = e.target.value; setNotes((n) => ({ ...n, title: v })); }} /></Field>
        <Field label="副標題"><input value={notes.subtitle || ''} onChange={(e) => { const v = e.target.value; setNotes((n) => ({ ...n, subtitle: v })); }} /></Field>
      </div>
      <ol className="edit-list">
        {notes.items.map((n, i) => (
          <li key={i}>
            <span className="edit-num">{i + 1}</span>
            <textarea rows={2} value={n} onChange={(e) => { const v = e.target.value; setItems((l) => l.map((x, j) => (j === i ? v : x))); }} />
            <RowTools index={i} count={notes.items.length} onMove={(dir) => setItems((l) => moveItem(l, i, dir))} onDelete={() => setItems((l) => l.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ol>
      <button className="btn-secondary" onClick={() => setItems((l) => [...l, ''])}>＋ 新增一條</button>
    </section>
  );
}

/* ============================================================
   熱蠟前／熱蠟後
   ============================================================ */

function CareSection({ part, draft, update }) {
  const data = draft.care[part];
  const setPart = (fn) => update((d) => ({ ...d, care: { ...d.care, [part]: fn(d.care[part]) } }));
  const setBlocks = (fn) => setPart((p) => ({ ...p, blocks: fn(p.blocks) }));
  const setBlock = (bi, changes) => setBlocks((all) => all.map((b, i) => (i === bi ? { ...b, ...changes } : b)));

  return (
    <section>
      <div className="card">
        <SectionHead title={data.tab || (part === 'before' ? '蠟前遵守' : '蠟後必看')} desc="顯示在「蠟前蠟後」分頁；用 **兩個星號** 包起來的字會變成強調色" />
        <Field label="切換按鈕名稱"><input value={data.tab || ''} onChange={(e) => { const v = e.target.value; setPart((p) => ({ ...p, tab: v })); }} /></Field>
        <div className="grid-2">
          <Field label="大標題"><input value={data.title} onChange={(e) => { const v = e.target.value; setPart((p) => ({ ...p, title: v })); }} /></Field>
          <Field label="英文標題"><input value={data.en || ''} onChange={(e) => { const v = e.target.value; setPart((p) => ({ ...p, en: v })); }} /></Field>
        </div>
      </div>

      {data.blocks.map((b, bi) => (
        <div key={bi} className="card">
          <div className="service-edit-head">
            <input className="name-input" value={b.title} placeholder="小標題，例如：預約前" onChange={(e) => setBlock(bi, { title: e.target.value })} />
            <input className="en-input" value={b.en || ''} placeholder="英文（選填）" onChange={(e) => setBlock(bi, { en: e.target.value })} />
          </div>
          <Field label="內容" hint="每換一行就是一點">
            <textarea rows={Math.max(3, b.items.length + 1)} value={b.items.join('\n')} onChange={(e) => setBlock(bi, { items: lines(e.target.value) })} />
          </Field>
          <div className="service-edit-foot">
            <span />
            <RowTools
              index={bi}
              count={data.blocks.length}
              onMove={(dir) => setBlocks((all) => moveItem(all, bi, dir))}
              onDelete={() => setBlocks((all) => all.filter((_, i) => i !== bi))}
              confirmText={`確定刪除「${b.title || '這個區塊'}」？`}
            />
          </div>
        </div>
      ))}

      <button className="btn-secondary full add-service" onClick={() => setBlocks((all) => [...all, { title: '', en: '', items: [] }])}>＋ 新增小區塊</button>
    </section>
  );
}

/* ============================================================
   居家產品：產品介紹／產品組合
   ============================================================ */

function PartHeader({ part, draft, update, title }) {
  const data = draft.products[part];
  const set = (key) => (e) => {
    const v = e.target.value;
    update((d) => ({ ...d, products: { ...d.products, [part]: { ...d.products[part], [key]: v } } }));
  };
  return (
    <div className="card">
      <SectionHead title={title} desc="顯示在「居家產品」分頁" />
      <div className="grid-2">
        <Field label="切換按鈕名稱"><input value={data.tab || ''} onChange={set('tab')} /></Field>
        <Field label="標題"><input value={data.title || ''} onChange={set('title')} /></Field>
      </div>
      <div className="grid-2">
        <Field label="英文標題（選填）"><input value={data.en || ''} onChange={set('en')} /></Field>
        {part === 'intro' && <Field label="價格前的文字"><input value={data.priceLabel || ''} placeholder="例如：專屬價" onChange={set('priceLabel')} /></Field>}
      </div>
    </div>
  );
}

function ProductsSection({ draft, update }) {
  const items = draft.products.intro.items;
  const setItems = (fn) => update((d) => ({ ...d, products: { ...d.products, intro: { ...d.products.intro, items: fn(d.products.intro.items) } } }));
  const setItem = (i, changes) => setItems((all) => all.map((p, j) => (j === i ? { ...p, ...changes } : p)));
  return (
    <section>
      <PartHeader part="intro" draft={draft} update={update} title="產品介紹" />
      {items.map((p, i) => (
        <div key={i} className="card product-edit">
          <div className="product-edit-row">
            {p.image ? <img src={p.image} alt="" className="product-thumb" /> : <span className="product-thumb empty">無圖片</span>}
            <div className="product-edit-fields">
              <input className="name-input" value={p.name} placeholder="產品名稱" onChange={(e) => setItem(i, { name: e.target.value })} />
              <div className="grid-2">
                <Field label="容量"><input value={p.size || ''} placeholder="例如：150ml" onChange={(e) => setItem(i, { size: e.target.value })} /></Field>
                <Field label="價格"><input value={p.price || ''} placeholder="例如：$1,280" onChange={(e) => setItem(i, { price: e.target.value })} /></Field>
              </div>
            </div>
          </div>
          <Field label="特色" hint="每換一行就是一點">
            <textarea rows={Math.max(3, p.points.length + 1)} value={p.points.join('\n')} onChange={(e) => setItem(i, { points: lines(e.target.value) })} />
          </Field>
          <div className="service-edit-foot">
            {p.image ? <button className="icon-btn" onClick={() => setItem(i, { image: '' })}>移除圖片</button> : <span className="field-hint">需要放產品照片時，把照片傳給 Claude</span>}
            <RowTools index={i} count={items.length} onMove={(dir) => setItems((all) => moveItem(all, i, dir))} onDelete={() => setItems((all) => all.filter((_, j) => j !== i))} confirmText={`確定刪除「${p.name || '這個產品'}」？`} />
          </div>
        </div>
      ))}
      <button className="btn-secondary full add-service" onClick={() => setItems((all) => [...all, { name: '', size: '', price: '', image: '', points: [] }])}>＋ 新增產品</button>
    </section>
  );
}

function BundlesSection({ draft, update }) {
  const items = draft.products.bundles.items;
  const setItems = (fn) => update((d) => ({ ...d, products: { ...d.products, bundles: { ...d.products.bundles, items: fn(d.products.bundles.items) } } }));
  const setItem = (i, changes) => setItems((all) => all.map((b, j) => (j === i ? { ...b, ...changes } : b)));
  return (
    <section>
      <PartHeader part="bundles" draft={draft} update={update} title="產品組合" />
      {items.map((b, i) => (
        <div key={i} className="card">
          <input className="name-input" value={b.title} placeholder="組合名稱，例如：小資族必備 **2** 寶" onChange={(e) => setItem(i, { title: e.target.value })} />
          <p className="field-hint">用 **兩個星號** 包起來的字（例如數字）會放大成強調色</p>
          <Field label="副標題（選填）"><input value={b.subtitle || ''} onChange={(e) => setItem(i, { subtitle: e.target.value })} /></Field>
          <Field label="內容" hint="每換一行就是一項；以「／」結尾的行（例如 A區／）會顯示成小標">
            <textarea rows={Math.max(3, b.lines.length + 1)} value={b.lines.join('\n')} onChange={(e) => setItem(i, { lines: lines(e.target.value) })} />
          </Field>
          <div className="grid-2">
            <Field label="優惠價"><input value={b.price || ''} placeholder="例如：$2,499" onChange={(e) => setItem(i, { price: e.target.value })} /></Field>
            <Field label="原價（選填）"><input value={b.original || ''} placeholder="例如：$2,860" onChange={(e) => setItem(i, { original: e.target.value })} /></Field>
          </div>
          <div className="service-edit-foot">
            <span />
            <RowTools index={i} count={items.length} onMove={(dir) => setItems((all) => moveItem(all, i, dir))} onDelete={() => setItems((all) => all.filter((_, j) => j !== i))} confirmText={`確定刪除「${b.title || '這個組合'}」？`} />
          </div>
        </div>
      ))}
      <button className="btn-secondary full add-service" onClick={() => setItems((all) => [...all, { title: '', subtitle: '', lines: [], price: '', original: '' }])}>＋ 新增組合</button>
    </section>
  );
}

/* ============================================================
   時段與公休
   ============================================================ */

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
        <SectionHead title="公休日與已滿時段" desc="先選擇要做什麼，再點月曆上的日期；客人在「可預約時段」分頁會看到" />
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

        <Field label="每月幾號開放下個月" hint="例如 25：每月 25 日起，可預約時段會顯示到下個月底；填 0 則一律顯示到下個月底">
          <input
            type="number"
            inputMode="numeric"
            value={draft.openNextMonthDay}
            onChange={(e) => { const v = e.target.value; update((d) => ({ ...d, openNextMonthDay: v })); }}
          />
        </Field>
      </div>

      <div className="card">
        <SectionHead title="預約時段" desc="顯示在「可預約時段」分頁的每日時段" />
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
