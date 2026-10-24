import { createClient } from '@supabase/supabase-js';
import { PRICING } from './config.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// 沒設定 Supabase 時進入「展示模式」：資料只存在這台瀏覽器，方便先預覽畫面
export const DEMO_MODE = !url || !key;
const supabase = DEMO_MODE ? null : createClient(url, key);

const DEMO_KEY = 'hsin-ee-booking-demo-v1';

function demoLoad() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY)) || [];
  } catch {
    return [];
  }
}

function demoSave(list) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(list));
  } catch {
    // 無痕模式等情況無法儲存，展示模式下忽略即可
  }
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export function normalizePhone(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function isValidPhone(phone) {
  return /^09\d{8}$/.test(phone);
}

// 回傳 'trial' | 'revisit' | 'normal'
export async function checkCustomer(phone, date) {
  if (DEMO_MODE) {
    const history = demoLoad().filter((b) => b.phone === phone);
    if (!history.length) return 'trial';
    const past = history.map((b) => b.date).filter((d) => d <= date).sort();
    const last = past[past.length - 1];
    if (!last || daysBetween(last, date) <= PRICING.revisitWindowDays) return 'revisit';
    return 'normal';
  }
  const { data, error } = await supabase.rpc('check_customer', {
    p_phone: phone,
    p_date: date,
    p_window_days: PRICING.revisitWindowDays,
  });
  if (error) throw error;
  return data;
}

export async function getTakenSlots(date) {
  if (DEMO_MODE) {
    return demoLoad().filter((b) => b.date === date).map((b) => b.time);
  }
  const { data, error } = await supabase.rpc('taken_slots', { p_date: date });
  if (error) throw error;
  return data || [];
}

export async function createBooking(booking) {
  if (DEMO_MODE) {
    const list = demoLoad();
    if (list.some((b) => b.date === booking.date && b.time === booking.time)) {
      throw new Error('SLOT_TAKEN');
    }
    const code = 'HE' + booking.date.slice(5).replace('-', '') + Math.random().toString(16).slice(2, 6).toUpperCase();
    list.push({ ...booking, code });
    demoSave(list);
    return code;
  }
  const { data, error } = await supabase.rpc('create_booking', {
    p_name: booking.name,
    p_phone: booking.phone,
    p_date: booking.date,
    p_time: booking.time,
    p_items: booking.items,
    p_total: booking.total,
    p_deposit: booking.deposit,
    p_note: booking.note,
  });
  if (error) {
    throw new Error(error.message && error.message.includes('SLOT_TAKEN') ? 'SLOT_TAKEN' : error.message);
  }
  return data;
}
