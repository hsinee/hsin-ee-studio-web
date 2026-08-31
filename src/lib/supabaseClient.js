import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 環境變數，請參考 README 設定。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 這個系統只設計給單一工作室帳號使用（共用一組密碼），
// 所以登入畫面只讓使用者輸入密碼，帳號固定用這個環境變數帶入。
export const LOGIN_EMAIL = import.meta.env.VITE_APP_LOGIN_EMAIL || '';
