// 現場ごとの掲載履歴（募集費・原稿URL）をGoogle Sheets経由で読み書きするプロキシ。
// セットアップ手順: docs/site-overrides-setup.md

const SHEET_API_URL = process.env.SITE_OVERRIDES_API_URL;

export async function GET() {
  if (!SHEET_API_URL) {
    return Response.json({ error: 'SITE_OVERRIDES_API_URL is not configured' }, { status: 501 });
  }
  const res = await fetch(`${SHEET_API_URL}?sheet=recruitinghistory`, { cache: 'no-store' });
  const data = await res.json();
  return Response.json(data);
}

export async function POST(request: Request) {
  if (!SHEET_API_URL) {
    return Response.json({ error: 'SITE_OVERRIDES_API_URL is not configured' }, { status: 501 });
  }
  const body = await request.json();
  const res = await fetch(SHEET_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, sheet: 'recruitinghistory' }),
  });
  const data = await res.json();
  return Response.json(data);
}
