import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS } from './config.js';

export const SettingsContext = createContext(DEFAULT_SETTINGS);

export function useSettings() {
  return useContext(SettingsContext);
}

// 後台存的設定若少了某些欄位（例如之後新增的功能），用預設值補上
export function mergeSettings(remote) {
  if (!remote || typeof remote !== 'object') return DEFAULT_SETTINGS;
  const merged = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const def = DEFAULT_SETTINGS[key];
    const val = remote[key];
    if (val == null) continue;
    merged[key] = Array.isArray(def) ? val : typeof def === 'object' ? { ...def, ...val } : val;
  }
  merged.pricing = { ...merged.pricing, labels: { ...DEFAULT_SETTINGS.pricing.labels, ...(merged.pricing.labels || {}) } };
  return merged;
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
