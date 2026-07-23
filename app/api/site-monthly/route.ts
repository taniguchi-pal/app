// 現場別の月次実績（損益書・稼働人数・工数・募集費）をGoogle Sheets経由で読み書きするプロキシ。
// セットアップ手順: docs/site-overrides-setup.md

const SHEET_API_URL = process.env.SITE_OVERRIDES_API_URL;

export async function GET() {
  if (!SHEET_API_URL) {
    return Response.json({ error: 'SITE_OVERRIDES_API_URL is not configured' }, { status: 501 });
  }
  const res = await fetch(`${SHEET_API_URL}?sheet=sitemonthly`, { cache: 'no-store' });
  const data = await res.json();
  return Response.json(data);
}

export async function POST(request: Request) {
  if (!SHEET_API_URL) {
    return Response.json({ error: 'SITE_OVERRIDES_API_URL is not configured' }, { status: 501 });
  }
  const body = await request.json();
  if (!body.siteId || !body.month) {
    return Response.json({ error: 'siteId and month are required' }, { status: 400 });
  }
  const res = await fetch(SHEET_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, sheet: 'sitemonthly' }),
  });
  const data = await res.json();
  return Response.json(data);
}
