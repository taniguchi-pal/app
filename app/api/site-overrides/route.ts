// 現場カルテの手入力項目（担当Sales/SO・価格交渉ステータス・募集状況）を
// Google Apps Script経由でスプレッドシートに読み書きするプロキシ。
// セットアップ手順: docs/site-overrides-setup.md

const SHEET_API_URL = process.env.SITE_OVERRIDES_API_URL;

export async function GET() {
  if (!SHEET_API_URL) {
    return Response.json({ error: 'SITE_OVERRIDES_API_URL is not configured' }, { status: 501 });
  }
  const res = await fetch(`${SHEET_API_URL}?sheet=overrides`, { cache: 'no-store' });
  const data = await res.json();
  return Response.json(data);
}

export async function POST(request: Request) {
  if (!SHEET_API_URL) {
    return Response.json({ error: 'SITE_OVERRIDES_API_URL is not configured' }, { status: 501 });
  }
  const body = await request.json();
  if (!body.siteId) {
    return Response.json({ error: 'siteId is required' }, { status: 400 });
  }
  const res = await fetch(SHEET_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, sheet: 'overrides' }),
  });
  const data = await res.json();
  return Response.json(data);
}
