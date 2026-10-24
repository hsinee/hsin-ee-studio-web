import React, { useState } from 'react';
import { WEEKDAYS, toDateStr, todayStr, parseDate } from './dates.js';

function monthKey(y, m) {
  return y * 12 + m;
}

// 月曆：dayState(dateStr) 回傳 { disabled, closed, selected }
export default function Calendar({ initial, minDate, maxDate, dayState, onPick }) {
  const start = parseDate(initial || minDate || todayStr());
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const min = minDate ? parseDate(minDate) : null;
  const max = maxDate ? parseDate(maxDate) : null;
  const canPrev = !min || monthKey(view.y, view.m) > monthKey(min.getFullYear(), min.getMonth());
  const canNext = !max || monthKey(view.y, view.m) < monthKey(max.getFullYear(), max.getMonth());
  const shift = (n) => {
    const d = new Date(view.y, view.m + n, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateStr(new Date(view.y, view.m, d)));
  const today = todayStr();

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="cal-nav" disabled={!canPrev} onClick={() => shift(-1)} aria-label="上個月">‹</button>
        <span className="serif">{view.y} 年 {view.m + 1} 月</span>
        <button type="button" className="cal-nav" disabled={!canNext} onClick={() => shift(1)} aria-label="下個月">›</button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="cal-wd">{w}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={'b' + i} />;
          const s = dayState(d);
          const cls = ['cal-day', s.closed && 'closed', s.selected && 'selected', d === today && 'today'].filter(Boolean).join(' ');
          return (
            <button key={d} type="button" className={cls} disabled={s.disabled} onClick={() => onPick(d)}>
              <span>{Number(d.slice(8))}</span>
              {s.closed && <small>休</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
