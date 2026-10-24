export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(str, n) {
  const d = parseDate(str);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function todayStr() {
  return toDateStr(new Date());
}

export function weekdayOf(str) {
  return parseDate(str).getDay();
}

export function fmtDate(str) {
  if (!str) return '';
  const d = parseDate(str);
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）`;
}

// 某天是否公休（指定日期或每週固定公休）
export function isClosedDay(str, { closedDates = [], closedWeekdays = [] }) {
  return closedDates.includes(str) || closedWeekdays.includes(weekdayOf(str));
}
