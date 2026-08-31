import { supabase } from './supabaseClient.js';

// 資料整包存在 Supabase 的 app_data 表格（一個登入帳號一列 JSON），
// 取代原本 artifact 沙盒環境裡的 window.storage，讓資料改成真正存在雲端資料庫、
// 登入後跨裝置（iPad／手機／電腦）都能讀到同一份。
const TABLE = 'app_data';

export async function loadRemoteData(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('讀取資料失敗', error);
    return null;
  }
  return data ? data.data : null;
}

export async function saveRemoteData(userId, data) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) {
    console.error('儲存資料失敗', error);
    return false;
  }
  return true;
}
