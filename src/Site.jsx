import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useSettings, shortListLabel } from './settings.js';
import { fmtDate, todayStr, addDays, isClosedDay, fullSlotsOf, lastOpenDate } from './dates.js';
import Calendar from './Calendar.jsx';

/* ============================================================
   小工具
   ============================================================ */

// 支援換行與 **強調**
function Rich({ text }) {
  const lines = String(text || '').split('\n');
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part
      )}
    </React.Fragment>
  ));
}

function lineUrl(id) {
  return `https://line.me/R/ti/p/${encodeURIComponent(id)}`;
}

function igUrl(handle) {
  return `https://www.instagram.com/${String(handle || '').replace(/^@/, '')}/`;
}

const TABS = [
  { id: 'notes', label: '預約須知' },
  { id: 'schedule', label: '當月時段' },
  { id: 'care', label: '蠟前蠟後' },
  { id: 'prices', label: '價目表' },
  { id: 'products', label: '居家產品' },
];

// 網址 #分頁 或 #分頁/子分頁，例如 #prices/male、#care/after
function readHash() {
  const [tab, sub] = decodeURIComponent(window.location.hash.slice(1)).split('/');
  // 舊網址 #female、#male 導到價目表
  if (tab === 'female' || tab === 'male') return { tab: 'prices', sub: tab };
  return { tab: TABS.some((t) => t.id === tab) ? tab : TABS[0].id, sub: sub || '' };
}

// 分頁裡的分頁（膠囊切換）
function SubTabs({ options, value, onChange }) {
  return (
    <div className="sub-tabs" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} className={'sub-tab' + (value === o.id ? ' active' : '')} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   頁面
   ============================================================ */

export default function Site() {
  const { store, line } = useSettings();
  const [route, setRoute] = useState(readHash);
  const { tab, sub } = route;

  // 網址帶 #notes、#prices/male 等可直接開到該分頁（方便貼在 IG / LINE）
  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const go = (nextTab, nextSub = '') => {
    setRoute({ tab: nextTab, sub: nextSub });
    history.replaceState(null, '', '#' + nextTab + (nextSub ? '/' + nextSub : ''));
  };
  const setSub = (s) => go(tab, s);

  return (
    <div className="page site">
      <header className="site-head">
        <img src="/logo.png" alt={store.name} className="site-logo" />
        {store.tagline && <p className="site-tagline">{store.tagline}</p>}
      </header>

      <nav className="site-tabs" aria-label="分頁">
        <div className="site-tabs-inner">
          {TABS.map((t) => (
            <button key={t.id} className={'site-tab' + (tab === t.id ? ' active' : '')} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="site-main step-in" key={tab}>
        {tab === 'notes' && <BookingNotes />}
        {tab === 'schedule' && <Schedule />}
        {tab === 'care' && <Care sub={sub} setSub={setSub} />}
        {tab === 'prices' && <Prices sub={sub} setSub={setSub} />}
        {tab === 'products' && <Products sub={sub} setSub={setSub} />}
      </main>

      <section className="site-about">
        <div className="glass">
          <h2 className="about-title serif">ABOUT {store.name}</h2>
          {store.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {store.signature && <p className="about-sign">{store.signature}</p>}
          {(store.hours || store.address) && (
            <dl className="about-meta">
              {store.hours && (
                <div>
                  <dt>營業時間</dt>
                  <dd>{store.hours}</dd>
                </div>
              )}
              {store.address && (
                <div>
                  <dt>地點</dt>
                  <dd>{store.address}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </section>

      <footer className="site-foot">
        {store.footerBadge && <span className="foot-badge">{store.footerBadge}</span>}
        {store.footerText && <span className="foot-en">{store.footerText}</span>}
        <div className="foot-links">
          {store.instagram && (
            <a href={igUrl(store.instagram)} target="_blank" rel="noreferrer">IG {store.instagram}</a>
          )}
          <a href={lineUrl(line.id)} target="_blank" rel="noreferrer">LINE {line.id}</a>
        </div>
      </footer>

      {/* 「當月時段」分頁本身已有 LINE 按鈕 */}
      {tab !== 'schedule' && (
        <a className="line-cta" href={lineUrl(line.id)} target="_blank" rel="noreferrer">
          LINE 預約
        </a>
      )}
    </div>
  );
}

/* ============================================================
   價目表：女生／男生 → 分類按鈕 → 該分類的價格
   ============================================================ */

function Prices({ sub, setSub }) {
  const { priceLists } = useSettings();
  const list = priceLists.find((l) => l.id === sub) || priceLists[0];
  const [secIndex, setSecIndex] = useState(0);
  const sec = list.sections[Math.min(secIndex, list.sections.length - 1)];

  const pickList = (id) => {
    setSecIndex(0);
    setSub(id);
  };

  return (
    <article className="pl">
      <SubTabs options={priceLists.map((l) => ({ id: l.id, label: shortListLabel(l.label) }))} value={list.id} onChange={pickList} />
      {list.updated && <p className="pl-updated">{list.updated}</p>}

      <div className="cat-chips" role="tablist">
        {list.sections.map((s, i) => (
          <button key={i} role="tab" aria-selected={s === sec} className={'cat-chip' + (s === sec ? ' active' : '')} onClick={() => setSecIndex(i)}>
            {s.title}
          </button>
        ))}
      </div>

      {sec && <PriceSection sec={sec} key={list.id + secIndex} />}

      {list.footnote && <p className="pl-foot">{list.footnote}</p>}
    </article>
  );
}

function PriceSection({ sec }) {
  const cols = sec.columns.length || 1;
  const hasHeader = sec.columns.some((c) => c.zh || c.en);
  const grid = { gridTemplateColumns: `minmax(0, 1fr) repeat(${cols}, var(--price-col))` };
  return (
    <section className="pl-sec step-in">
      <div className="pl-sec-head">
        <h2 className="serif">{sec.title}</h2>
        {sec.en && <span>{sec.en}</span>}
      </div>
      {hasHeader && (
        <div className="pl-row pl-cols" style={grid}>
          <span />
          {sec.columns.map((c, ci) => (
            <span key={ci} className="pl-col">
              <b>{c.zh}</b>
              <small>{c.en}</small>
            </span>
          ))}
        </div>
      )}
      {sec.items.map((it, ii) => {
        const prices = it.prices || [];
        // 只有第一欄有字時（例如「依毛量報價」），橫跨所有價格欄
        const spanAll = cols > 1 && prices[0] && prices.slice(1).every((p) => !p);
        return (
          <div key={ii} className="pl-row pl-item" style={grid}>
            <div className="pl-name">
              <span className="zh">{it.name}</span>
              {it.en && <span className="en">{it.en}</span>}
              {it.note && <span className="note">（{it.note}）</span>}
            </div>
            {spanAll ? (
              <span className="pl-price span" style={{ gridColumn: `2 / span ${cols}` }}>{prices[0]}</span>
            ) : (
              sec.columns.map((_, ci) => (
                <span key={ci} className="pl-price">{prices[ci] || ''}</span>
              ))
            )}
          </div>
        );
      })}
    </section>
  );
}

/* ============================================================
   蠟前蠟後：蠟前遵守／蠟後必看
   ============================================================ */

function Care({ sub, setSub }) {
  const { care } = useSettings();
  const which = sub === 'after' ? 'after' : 'before';
  const part = care[which];
  return (
    <article className="care">
      <SubTabs
        options={[
          { id: 'before', label: care.before.tab || '蠟前遵守' },
          { id: 'after', label: care.after.tab || '蠟後必看' },
        ]}
        value={which}
        onChange={setSub}
      />
      <section className="care-part step-in" key={which}>
        <h1 className="care-title serif">
          <Rich text={part.title} />
        </h1>
        {part.en && <p className="care-en">{part.en}</p>}
        <div className="care-blocks">
          {part.blocks.map((b, bi) => (
            <div key={bi} className="care-block">
              <div className="care-block-head">
                <h2 className="serif">{b.title}</h2>
                {b.en && <span>{b.en}</span>}
              </div>
              <ul>
                {b.items.map((it, ii) => (
                  <li key={ii}>
                    <Rich text={it} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

/* ============================================================
   居家產品：產品介紹／產品組合
   ============================================================ */

function Products({ sub, setSub }) {
  const { products } = useSettings();
  const which = sub === 'bundles' ? 'bundles' : 'intro';
  const part = products[which];
  return (
    <article className="products">
      <SubTabs
        options={[
          { id: 'intro', label: products.intro.tab || '產品介紹' },
          { id: 'bundles', label: products.bundles.tab || '產品組合' },
        ]}
        value={which}
        onChange={setSub}
      />
      <section className="step-in" key={which}>
        <h1 className="page-title serif">{part.title}</h1>
        {part.en && <p className="page-en">{part.en}</p>}
        {which === 'intro' ? <ProductList part={part} /> : <BundleList part={part} />}
      </section>
    </article>
  );
}

function ProductList({ part }) {
  return (
    <div className="product-list">
      {part.items.map((p, i) => (
        <div key={i} className="product">
          <div className="product-pic">
            {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <span className="product-pic-empty" />}
            {p.size && <small>{p.size}</small>}
          </div>
          <div className="product-body">
            <h2 className="serif">{p.name}</h2>
            {p.price && (
              <p className="product-price">
                ／{part.priceLabel || '專屬價'}　{p.price}
              </p>
            )}
            <ul>
              {p.points.map((pt, j) => (
                <li key={j}>{pt}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function BundleList({ part }) {
  return (
    <div className="bundle-list">
      {part.items.map((b, i) => (
        <div key={i} className="bundle">
          <h2 className="bundle-title serif">
            <Rich text={b.title} />
          </h2>
          {b.subtitle && <p className="bundle-sub">{b.subtitle}</p>}
          <div className="bundle-body">
            <ul>
              {b.lines.map((l, j) =>
                /[／/:：]$|^[A-Z]區／/.test(l) ? (
                  <li key={j} className="bundle-group">{l}</li>
                ) : (
                  <li key={j}>{l}</li>
                )
              )}
            </ul>
            {b.price && (
              <div className="bundle-price">
                <small>ONLY</small>
                <strong>{b.price}</strong>
                {b.original && <s>原價{b.original}</s>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   預約須知
   ============================================================ */

function BookingNotes() {
  const { bookingNotes: notes } = useSettings();
  return (
    <article className="notes">
      <h1 className="page-title serif">
        <span className="slash">\</span>
        {notes.title}
        <span className="slash">/</span>
      </h1>
      {notes.subtitle && <p className="page-sub">{notes.subtitle}</p>}
      <ul className="notes-list">
        {notes.items.map((n, i) => (
          <li key={i}>
            <Rich text={n} />
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ============================================================
   當月時段（只供查看，預約請私訊官方 LINE）
   ============================================================ */

function Schedule() {
  const settings = useSettings();
  const { timeSlots, openNextMonthDay, line } = settings;
  const today = todayStr();
  const lastDate = lastOpenDate(openNextMonthDay);

  const dayInfo = (d) => {
    const closed = isClosedDay(d, settings);
    const full = fullSlotsOf(d, settings);
    const dayOff = isClosedDay(d, { ...settings, closedSlots: {} });
    return { closed, dayOff, full, partial: full.length > 0 };
  };
  const firstOpen = () => {
    for (let d = today; d <= lastDate; d = addDays(d, 1)) {
      if (!dayInfo(d).closed) return d;
    }
    return '';
  };
  const [picked, setPicked] = useState(firstOpen);

  const dayState = (d) => {
    const info = dayInfo(d);
    return {
      closed: info.closed,
      closedLabel: info.dayOff ? '休' : '滿',
      partial: info.partial,
      selected: d === picked,
      disabled: info.closed || d < today || d > lastDate,
    };
  };

  const full = picked ? fullSlotsOf(picked, settings) : [];
  const [, m, dd] = lastDate.split('-').map(Number);

  return (
    <article className="schedule">
      <h1 className="page-title serif">可預約時段</h1>
      <p className="page-sub">
        目前開放至 {m}/{dd}
        {openNextMonthDay ? `・每月 ${openNextMonthDay} 日開放下個月` : ''}
      </p>

      <div className="schedule-body">
        <div>
          <Calendar initial={picked || today} minDate={today} maxDate={lastDate} dayState={dayState} onPick={setPicked} />
          <div className="cal-legend">
            <span><i style={{ background: 'var(--rose-soft)' }} />公休／已滿</span>
            <span><small className="dot">●</small> 部分時段已滿</span>
          </div>
        </div>

        {picked && (
          <div className="slot-view">
            <h2 className="serif">{fmtDate(picked)}</h2>
            <div className="slot-grid">
              {timeSlots.map((t) => {
                const isFull = full.includes(t);
                return (
                  <span key={t} className={'slot view' + (isFull ? ' full' : '')}>
                    {t}
                    <small>{isFull ? '已滿' : '可預約'}</small>
                  </span>
                );
              })}
            </div>
            <p className="field-hint">時段為即時參考，實際以官方 LINE 回覆為準</p>
          </div>
        )}
      </div>

      <a className="btn-line full lg schedule-line" href={lineUrl(line.id)} target="_blank" rel="noreferrer">
        私訊官方 LINE 預約
      </a>
    </article>
  );
}
