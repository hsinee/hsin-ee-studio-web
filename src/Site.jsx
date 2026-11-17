import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useSettings } from './settings.js';
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

function tabsOf(settings) {
  return [
    ...settings.priceLists.map((l) => ({ id: l.id, label: l.label })),
    { id: 'notes', label: settings.bookingNotes.title || '預約須知' },
    { id: 'care', label: '蠟前蠟後' },
    { id: 'schedule', label: '可預約時段' },
  ];
}

function tabFromHash(tabs) {
  const id = decodeURIComponent(window.location.hash.slice(1));
  return tabs.some((t) => t.id === id) ? id : tabs[0].id;
}

/* ============================================================
   頁面
   ============================================================ */

export default function Site() {
  const settings = useSettings();
  const { store, line } = settings;
  const tabs = tabsOf(settings);
  const [tab, setTab] = useState(() => tabFromHash(tabs));

  // 網址帶 #female、#schedule 等可直接開到該分頁（方便貼在 IG / LINE）
  useEffect(() => {
    const onHash = () => setTab(tabFromHash(tabsOf(settings)));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [settings]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const go = (id) => {
    setTab(id);
    history.replaceState(null, '', '#' + id);
  };

  const list = settings.priceLists.find((l) => l.id === tab);

  return (
    <div className="page site">
      <header className="site-head">
        <img src="/logo.png" alt={store.name} className="site-logo" />
        {store.tagline && <p className="site-tagline">{store.tagline}</p>}
      </header>

      <nav className="site-tabs" aria-label="分頁">
        <div className="site-tabs-inner">
          {tabs.map((t) => (
            <button key={t.id} className={'site-tab' + (tab === t.id ? ' active' : '')} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="site-main step-in" key={tab}>
        {list && <PriceList list={list} />}
        {tab === 'notes' && <BookingNotes />}
        {tab === 'care' && <Care />}
        {tab === 'schedule' && <Schedule />}
      </main>

      <section className="site-about">
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
      </section>

      <footer className="site-foot">
        <span className="foot-badge">預約制</span>
        <span className="foot-en">BY APPOINTMENT ONLY</span>
        <div className="foot-links">
          {store.instagram && (
            <a href={igUrl(store.instagram)} target="_blank" rel="noreferrer">IG {store.instagram}</a>
          )}
          <a href={lineUrl(line.id)} target="_blank" rel="noreferrer">LINE {line.id}</a>
        </div>
      </footer>

      {/* 「可預約時段」分頁本身已有 LINE 按鈕 */}
      {tab !== 'schedule' && (
        <a className="line-cta" href={lineUrl(line.id)} target="_blank" rel="noreferrer">
          LINE 預約
        </a>
      )}
    </div>
  );
}

/* ============================================================
   價目表
   ============================================================ */

function PriceList({ list }) {
  return (
    <article className="pl">
      <div className="pl-head">
        <div className="pl-meta">
          {list.tag && <span className={'pl-tag pl-tag-' + list.id}>{list.tag}</span>}
          {list.updated && <span className="pl-updated">{list.updated}</span>}
        </div>
        <h1 className="pl-title">PRICE LIST</h1>
        {list.subtitle && <p className="pl-sub">{list.subtitle}</p>}
      </div>

      {list.sections.map((sec, si) => {
        const cols = sec.columns.length || 1;
        const hasHeader = sec.columns.some((c) => c.zh || c.en);
        const grid = { gridTemplateColumns: `minmax(0, 1fr) repeat(${cols}, var(--price-col))` };
        return (
          <section key={si} className="pl-sec">
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
      })}

      {list.footnote && <p className="pl-foot">{list.footnote}</p>}
    </article>
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
   蠟前蠟後
   ============================================================ */

function Care() {
  const { care } = useSettings();
  return (
    <article className="care">
      {[care.before, care.after].map((part, pi) => (
        <section key={pi} className="care-part">
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
      ))}
    </article>
  );
}

/* ============================================================
   可預約時段（只供查看，預約請私訊官方 LINE）
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
