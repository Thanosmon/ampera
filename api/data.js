// Vercel API Function — AMPERA
// GET  /api/data          → ambil data dari Supabase
// POST /api/data          → simpan data ke Supabase

const SUPABASE_URL = 'https://okuxxpzzzqjvwjqeydtn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_gn0Qj8WozvpWi5MFm2MtRA_rTomZAyY';
const AMPERA_SECRET = process.env.AMPERA_SECRET || 'ampera-djpb-2026';
const TABLE = 'ampera_data';
const ROW_ID = 1;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ampera-secret');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth
  const secret = req.headers['x-ampera-secret'];
  if (secret !== AMPERA_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${ROW_ID}&select=payload,updated_at,updated_by`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const rows = await response.json();
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'No data' });
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'POST') {
    const { payload, updated_by } = req.body;
    if (!payload) return res.status(400).json({ error: 'payload required' });

    // Upsert: otomatis INSERT jika belum ada, UPDATE jika sudah ada
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({ id: ROW_ID, payload, updated_by, updated_at: new Date().toISOString() }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'Upsert failed', detail: errText });
    }

    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
