import { head, put, BlobNotFoundError } from '@vercel/blob';

// 店家設定存在 Vercel Blob 的這個檔案
const PATHNAME = 'settings.json';
const MAX_BYTES = 200 * 1024;
// 只保存、只回傳這些欄位；舊版的匯款資訊、預約項目等會被丟掉
const ALLOWED_KEYS = ['store', 'line', 'priceLists', 'bookingNotes', 'care', 'products', 'timeSlots', 'closedDates', 'closedWeekdays', 'closedSlots', 'openNextMonthDay'];
const REQUIRED_KEYS = ['store', 'line', 'priceLists', 'bookingNotes', 'care', 'timeSlots'];

function pick(obj) {
  return Object.fromEntries(ALLOWED_KEYS.filter((k) => k in obj).map((k) => [k, obj[k]]));
}

function writeSettings(data) {
  return put(PATHNAME, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
}

async function readSettings() {
  try {
    const meta = await head(PATHNAME);
    // 帶上更新時間，避免讀到 CDN 快取的舊版本
    const res = await fetch(`${meta.url}?v=${new Date(meta.uploadedAt).getTime()}`);
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    const clean = pick(data);
    // 舊版存檔裡還有匯款資訊等欄位時，順手覆寫掉
    if (Object.keys(data).some((k) => !ALLOWED_KEYS.includes(k))) {
      await writeSettings(clean).catch(() => {});
    }
    return clean;
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      return res.status(200).json(await readSettings());
    } catch {
      return res.status(500).json({ error: 'READ_FAILED' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body || typeof body !== 'object' || !REQUIRED_KEYS.every((k) => k in body)) {
      return res.status(400).json({ error: 'INVALID_SETTINGS' });
    }
    const clean = pick(body);
    if (Buffer.byteLength(JSON.stringify(clean)) > MAX_BYTES) {
      return res.status(413).json({ error: 'TOO_LARGE' });
    }
    try {
      await writeSettings(clean);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'WRITE_FAILED' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
