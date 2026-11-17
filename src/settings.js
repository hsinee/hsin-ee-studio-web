import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS } from './config.js';

export const SettingsContext = createContext(DEFAULT_SETTINGS);

export function useSettings() {
  return useContext(SettingsContext);
}

function kindOf(v) {
  return Array.isArray(v) ? 'array' : typeof v;
}

// 後台存的設定若少了某些欄位（例如之後新增的功能），用預設值補上；
// 型別不同的舊欄位（例如舊版的預約須知）直接改用預設值
export function mergeSettings(remote) {
  if (!remote || typeof remote !== 'object') return DEFAULT_SETTINGS;
  const merged = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const def = DEFAULT_SETTINGS[key];
    const val = remote[key];
    if (val == null || kindOf(val) !== kindOf(def)) continue;
    merged[key] = kindOf(def) === 'object' ? { ...def, ...val } : val;
  }
  // 舊存檔的熱蠟後英文小字「/ 時」「/ 天」「/ 週」已不使用
  const after = merged.care && merged.care.after;
  if (after && Array.isArray(after.blocks)) {
    merged.care = {
      ...merged.care,
      after: { ...after, blocks: after.blocks.map((b) => (/^\/\s*\S$/.test(b.en || '') ? { ...b, en: '' } : b)) },
    };
  }
  return merged;
}

// 價目表切換按鈕顯示「女生」「男生」，不重複「價目表」三個字
export function shortListLabel(label) {
  return String(label || '').replace(/價目表$/, '') || label;
}

export async function loadSettings({ timeoutMs = 5000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('/api/settings', { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error('LOAD_FAILED');
    return { settings: mergeSettings(await res.json()), ok: true };
  } catch {
    return { settings: DEFAULT_SETTINGS, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function saveSettings(settings) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('SAVE_FAILED');
}
