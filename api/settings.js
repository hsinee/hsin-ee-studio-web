import { head, put, BlobNotFoundError } from '@vercel/blob';

// 店家設定存在 Vercel Blob 的這個檔案
const PATHNAME = 'settings.json';
const MAX_BYTES = 200 * 1024;
const REQUIRED_KEYS = ['store', 'notices', 'pricing', 'deposit', 'line', 'timeSlots', 'categories', 'services'];

async function readSettings() {
  try {
    const meta = await head(PATHNAME);
    // 帶上更新時間，避免讀到 CDN 快取的舊版本
    const res = await fetch(`${meta.url}?v=${new Date(meta.uploadedAt).getTime()}`);
    return await res.json();
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
    const json = JSON.stringify(body);
    if (Buffer.byteLength(json) > MAX_BYTES) {
      return res.status(413).json({ error: 'TOO_LARGE' });
    }
    try {
      await put(PATHNAME, json, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
      });
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'WRITE_FAILED' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
