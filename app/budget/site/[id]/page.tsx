'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shell, Eyebrow, Card, BackLink, Breadcrumb, AREA_THEME } from '../../_ui';
import { SITES, AREAS, yen, ActionType, NegotiationStatus, POSTING_PERIOD_OPTIONS, PL_ACCOUNTS, getPLRow, hasAnyPLData, PLAccountDef } from '../../_data';

const ACTION_COLOR: Record<ActionType, string> = {
  価格交渉: 'text-blue-700 bg-blue-50 border-blue-100',
  コンタクト: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  横展開: 'text-purple-700 bg-purple-50 border-purple-100',
  課題: 'text-rose-700 bg-rose-50 border-rose-100',
};

// 売上高は金額規模が大きく、売上総利益/営業利益と同じ軸だと後者が潰れて見えるため、
// 売上高=左軸、粗利・営業利益=右軸の2軸グラフにする。
const CHART_METRIC_LABELS: { label: string; color: string; axis: 'left' | 'right' }[] = [
  { label: '売上高', color: '#2563eb', axis: 'left' },
  { label: '売上総利益', color: '#059669', axis: 'right' },
  { label: '営業利益', color: '#d97706', axis: 'right' },
];
// PL_ACCOUNTS内で一意なラベルなので、対応するPLAccountDefを引く
const CHART_METRICS: { account: PLAccountDef; color: string; axis: 'left' | 'right' }[] = CHART_METRIC_LABELS.map(({ label, color, axis }) => ({
  account: PL_ACCOUNTS.find((a) => a.label === label)!,
  color,
  axis,
}));

const NEGOTIATION_OPTIONS: NegotiationStatus[] = ['未着手', '交渉中', '合意済', '見送り'];

interface EditableForm {
  salesRep: string;
  soRep: string;
  negotiationStatus: NegotiationStatus | '';
  recruitingActive: boolean;
  recruitingCostSpent: string;
  recruitingCostBudget: string;
  postingPeriod: string;
}

export default function SiteKarte({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const site = SITES[id] ?? Object.values(SITES)[0];
  const area = AREAS.find((a) => a.id === site.areaId);

  const [form, setForm] = useState<EditableForm>({
    salesRep: site.salesRep ?? '',
    soRep: site.soRep ?? '',
    negotiationStatus: site.negotiationStatus ?? '',
    recruitingActive: site.recruiting?.active ?? false,
    recruitingCostSpent: site.recruiting?.costSpent != null ? String(site.recruiting.costSpent) : '',
    recruitingCostBudget: site.recruiting?.costBudget != null ? String(site.recruiting.costBudget) : '',
    postingPeriod: site.recruiting?.postingPeriod ?? '',
  });
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site-overrides')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.error) { setApiStatus('unconfigured'); return; }
        const o = data[id];
        if (o) {
          setForm((f) => ({
            salesRep: o.salesRep || f.salesRep,
            soRep: o.soRep || f.soRep,
            negotiationStatus: (o.negotiationStatus as NegotiationStatus) || f.negotiationStatus,
            recruitingActive: o.recruitingActive === true || o.recruitingActive === 'TRUE' || o.recruitingActive === 'true',
            recruitingCostSpent: o.recruitingCostSpent ? String(o.recruitingCostSpent) : f.recruitingCostSpent,
            recruitingCostBudget: o.recruitingCostBudget ? String(o.recruitingCostBudget) : f.recruitingCostBudget,
            postingPeriod: o.postingPeriod || f.postingPeriod,
          }));
        }
        setApiStatus('ready');
      })
      .catch(() => { if (!cancelled) setApiStatus('error'); });
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    setSaveState('saving');
    try {
      const res = await fetch('/api/site-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: id,
          salesRep: form.salesRep,
          soRep: form.soRep,
          negotiationStatus: form.negotiationStatus,
          recruitingActive: form.recruitingActive,
          recruitingCostSpent: form.recruitingCostSpent,
          recruitingCostBudget: form.recruitingCostBudget,
          postingPeriod: form.postingPeriod,
        }),
      });
      const data = await res.json();
      setSaveState(data?.ok ? 'saved' : 'error');
    } catch {
      setSaveState('error');
    }
  };

  const hasFinancials = hasAnyPLData(site);
  const chartData = (['yoy', 'mom', 'actual', 'budget'] as const).map((key) => {
    const point: Record<string, number | string | null> = {
      name: key === 'yoy' ? '前年同月' : key === 'mom' ? '先月' : key === 'actual' ? '当月実績' : '予算',
    };
    CHART_METRICS.forEach(({ account }) => {
      const row = getPLRow(site, account);
      point[account.label] = row?.[key] ?? null;
    });
    return point;
  });
  const actionLog = site.actionLog ?? [];
  const opProfitAccount = PL_ACCOUNTS.find((a) => a.label === '営業利益')!;
  const salesAccount = PL_ACCOUNTS.find((a) => a.label === '売上高')!;
  const opProfitRow = getPLRow(site, opProfitAccount);
  const salesRow = getPLRow(site, salesAccount);
  const opMarginRate = opProfitRow?.actual != null && salesRow?.actual ? (opProfitRow.actual / salesRow.actual) * 100 : null;

  return (
    <Shell agvColor={(AREA_THEME[site.areaId] || AREA_THEME.kanto).from}>
      <header className="px-4 md:px-10 pt-6 pb-4">
        <BackLink href={`/budget/area/${site.areaId}`} label={`${area?.title}エリア進捗一覧へ戻る`} />
        <Breadcrumb items={[{ label: '事業部ダッシュボード', href: '/budget' }, { label: `${area?.title}エリア`, href: `/budget/area/${site.areaId}` }, { label: site.name }]} />
        <Eyebrow>Site Karte</Eyebrow>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <h1 className={`text-xl md:text-2xl font-black tracking-tight ${site.active ? 'text-zinc-900' : 'text-zinc-500 line-through decoration-zinc-300'}`}>{site.name}</h1>
          {!site.active && <span className="text-[10px] font-black text-white bg-zinc-500 px-2 py-1 rounded">非稼働</span>}
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">{site.prefecture ?? '所在地未登録'} ・ 案件コード: {site.id} | 現場別P&Lカルテ</p>
        {site.lifecycle && (
          <p className="mt-2 inline-block text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">⚠ {site.lifecycle}</p>
        )}
      </header>

      <main className="px-4 md:px-10 space-y-5">

        {/* ── 当月現場KPI ──────────────────────────── */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl p-5 text-white shadow-lg shadow-blue-900/20">
          <p className="text-[11px] font-bold text-blue-200 font-montserrat tracking-[0.15em] uppercase mb-3">当月現場KPI 稼働密度</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-blue-300">配置人数</p>
              <p className="text-2xl font-black mt-0.5 font-mono">{site.staffCount ?? '—'}<span className="text-xs font-normal ml-1">名</span></p>
            </div>
            <div>
              <p className="text-[10px] text-blue-300">総工数実績</p>
              <p className="text-2xl font-black mt-0.5 font-mono">{site.totalHours != null ? site.totalHours.toLocaleString() : '—'}<span className="text-xs font-normal ml-1">h</span></p>
            </div>
            <div>
              <p className="text-[10px] text-blue-300">1人当たり工数</p>
              <p className="text-2xl font-black mt-0.5 font-mono">{site.avgHours ?? '—'}<span className="text-xs font-normal ml-1">h</span></p>
            </div>
          </div>
        </div>

        {/* ── 受注残・期待インパクト・交渉ステータス ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card eyebrow="Backlog" title="受注残（未充足人数）">
            <p className="text-2xl font-black text-zinc-800 font-mono">{site.backlogCount ?? 'データ未登録'}{site.backlogCount != null && <span className="text-xs font-normal ml-1">名</span>}</p>
          </Card>
          <Card eyebrow="Impact" title="期待できるインパクト額">
            <p className="text-2xl font-black text-zinc-800 font-mono">{site.expectedImpact != null ? yen(site.expectedImpact) : 'データ未登録'}</p>
            <p className="text-[10px] text-zinc-400 mt-1">受注残充足・価格交渉成立時の月次見込み</p>
          </Card>
          <Card eyebrow="Negotiation" title="価格交渉ステータス">
            {form.negotiationStatus ? (
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded border ${
                form.negotiationStatus === '合意済' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : form.negotiationStatus === '交渉中' ? 'text-amber-700 bg-amber-50 border-amber-200'
                : form.negotiationStatus === '見送り' ? 'text-zinc-500 bg-zinc-100 border-zinc-200'
                : 'text-zinc-500 bg-zinc-50 border-zinc-200'
              }`}>{form.negotiationStatus}</span>
            ) : (
              <p className="text-xs font-bold text-zinc-400">データ未登録</p>
            )}
          </Card>
        </div>

        {/* ── 前年・先月・予算 対比（指標ごとに折れ線グラフを分離） ── */}
        <Card eyebrow="P&L Analysis" title="前年・先月・予算 対比推移（主要指標）">
          {!hasFinancials ? (
            <div className="h-40 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center gap-1">
              <p className="text-xs font-bold text-zinc-400">損益データ未登録</p>
              <p className="text-[10px] text-zinc-400">現場ごとの損益書をご提供いただき次第、反映します</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CHART_METRICS.map((m) => {
                const row = getPLRow(site, m.account);
                return (
                  <div key={m.account.label} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <p className="text-xs font-bold text-zinc-500 text-center">{m.account.label}</p>
                    <p className="text-2xl font-black text-center mt-1 font-mono" style={{ color: m.color }}>
                      {row?.actual != null ? yen(row.actual) : '—'}
                    </p>
                    <p className="text-[10px] text-zinc-400 text-center mb-1">当月実績</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#a1a1aa" />
                        <YAxis tick={{ fontSize: 9 }} stroke="#a1a1aa" width={48} tickFormatter={(v) => `${Math.round(Number(v) / 10000)}万`} />
                        <Tooltip formatter={(v) => yen(typeof v === 'number' ? v : Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Line type="monotone" dataKey={m.account.label} stroke={m.color} strokeWidth={2} connectNulls dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── 損益明細（勘定科目別） ────────────────── */}
        <Card eyebrow="P&L Detail" title="損益明細（勘定科目別）">
          {!hasFinancials ? (
            <p className="text-xs font-bold text-zinc-400">損益明細データはまだ登録されていません</p>
          ) : (
            <div className="overflow-y-auto max-h-[420px] -mx-1">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-zinc-400 border-b border-zinc-100">
                    <th className="py-1.5 px-2 font-bold">科目</th>
                    <th className="py-1.5 px-2 text-right font-bold">当月実績</th>
                    <th className="py-1.5 px-2 text-right font-bold">予算</th>
                    <th className="py-1.5 px-2 text-right font-bold">前年</th>
                    <th className="py-1.5 px-2 text-right font-bold">先月</th>
                  </tr>
                </thead>
                <tbody>
                  {PL_ACCOUNTS.map((acc, idx) => {
                    const row = getPLRow(site, acc);
                    return (
                      <tr key={`${acc.label}-${idx}`} className={acc.isSubtotal ? 'bg-blue-50/60' : 'hover:bg-zinc-50'}>
                        <td className={`py-1 px-2 ${acc.isSubtotal ? 'font-bold text-zinc-800' : 'pl-4 text-zinc-500'}`}>{acc.label}</td>
                        <td className={`py-1 px-2 text-right font-mono ${acc.isSubtotal ? 'font-bold text-zinc-800' : 'text-zinc-600'}`}>{row?.actual != null ? yen(row.actual) : '—'}</td>
                        <td className="py-1 px-2 text-right font-mono text-zinc-400">{row?.budget != null ? yen(row.budget) : '—'}</td>
                        <td className="py-1 px-2 text-right font-mono text-zinc-400">{row?.yoy != null ? yen(row.yoy) : '—'}</td>
                        <td className="py-1 px-2 text-right font-mono text-zinc-400">{row?.mom != null ? yen(row.mom) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── 収益性（営業利益・営業利益率） ────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card eyebrow="Profit" title="営業利益（当月実績）">
            <p className="text-2xl font-black text-zinc-800 font-mono">{opProfitRow?.actual != null ? yen(opProfitRow.actual) : 'データ未登録'}</p>
          </Card>
          <Card eyebrow="Margin" title="営業利益率">
            <p className={`text-2xl font-black font-mono ${opMarginRate != null && opMarginRate < 0 ? 'text-rose-600' : 'text-zinc-800'}`}>
              {opMarginRate != null ? `${opMarginRate.toFixed(1)}%` : 'データ未登録'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">営業利益 ÷ 売上高</p>
          </Card>
        </div>

        {/* ── 単価情報 & 賃金相場 ──────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card eyebrow="Unit Price" title="リフト単価">
            <p className="text-2xl font-black text-zinc-800 font-mono">{site.liftUnitPrice == null ? 'データ未登録' : `¥${site.liftUnitPrice.toLocaleString()}`}{site.liftUnitPrice != null && <span className="text-xs font-normal ml-1">/h</span>}</p>
            <p className="text-[10px] text-zinc-400 mt-1">フォークリフト作業員 請求単価</p>
          </Card>
          <Card eyebrow="Unit Price" title="作業員単価">
            <p className="text-2xl font-black text-zinc-800 font-mono">{site.workerUnitPrice != null ? `¥${site.workerUnitPrice.toLocaleString()}` : 'データ未登録'}{site.workerUnitPrice != null && <span className="text-xs font-normal ml-1">/h</span>}</p>
            <p className="text-[10px] text-zinc-400 mt-1">一般作業員 請求単価</p>
          </Card>
          <Card eyebrow="Reference" title="時給相場">
            <p className="text-2xl font-black text-zinc-800 font-mono">{site.marketHourlyWage != null ? `¥${site.marketHourlyWage.toLocaleString()}` : 'データ未登録'}{site.marketHourlyWage != null && <span className="text-xs font-normal ml-1">/h</span>}</p>
            <p className="text-[10px] text-zinc-400 mt-1">同職種・同エリアの支払相場（参考値）</p>
          </Card>
          <Card eyebrow="Reference" title="地域別最低賃金">
            <p className="text-2xl font-black text-zinc-800 font-mono">{site.minimumWage != null ? `¥${site.minimumWage.toLocaleString()}` : 'データ未登録'}{site.minimumWage != null && <span className="text-xs font-normal ml-1">/h</span>}</p>
            <p className="text-[10px] text-zinc-400 mt-1">{site.prefecture ?? '所在地未登録'} 最低賃金（参考値）</p>
          </Card>
        </div>

        {/* ── 役割別内訳（案件番号） ────────────────── */}
        {site.roles && site.roles.length > 0 && (
          <Card eyebrow="Roles" title="役割別内訳（採用状況・コンタクト履歴の細分化管理用）">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {site.roles.map((r) => (
                <div key={r.code} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-700">{r.label}</span>
                    {r.isNew && <span className="text-[9px] font-black text-white bg-emerald-500 px-1.5 py-0.5 rounded">新規</span>}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">案件コード: {r.code}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">採用状況・コンタクト履歴は今後この単位で入力予定</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 担当者・募集状況（手入力・チーム共有） ── */}
        <Card eyebrow="Assignment" title="担当者・募集状況">
          {apiStatus === 'unconfigured' && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 -mt-1 mb-3">
              共有保存基盤（Google Sheets連携）が未設定です。docs/site-overrides-setup.md の手順で設定すると、この項目がチーム全員に共有されます。
            </p>
          )}
          {apiStatus === 'error' && (
            <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 -mt-1 mb-3">共有データの取得に失敗しました。時間をおいて再度お試しください。</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400">担当Sales</label>
                <input
                  value={form.salesRep}
                  onChange={(e) => setForm((f) => ({ ...f, salesRep: e.target.value }))}
                  placeholder="未設定"
                  className="w-full mt-1 px-2 py-1.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400">担当SO</label>
                <input
                  value={form.soRep}
                  onChange={(e) => setForm((f) => ({ ...f, soRep: e.target.value }))}
                  placeholder="未設定"
                  className="w-full mt-1 px-2 py-1.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-zinc-400">価格交渉ステータス</label>
                <select
                  value={form.negotiationStatus}
                  onChange={(e) => setForm((f) => ({ ...f, negotiationStatus: e.target.value as NegotiationStatus }))}
                  className="w-full mt-1 px-2 py-1.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                >
                  <option value="">未設定</option>
                  {NEGOTIATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                <input type="checkbox" checked={form.recruitingActive} onChange={(e) => setForm((f) => ({ ...f, recruitingActive: e.target.checked }))} />
                掲載（採用募集）中
              </label>
              {form.recruitingActive && (
                <>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400 w-16 shrink-0">募集費進捗</span>
                    <input
                      value={form.recruitingCostSpent}
                      onChange={(e) => setForm((f) => ({ ...f, recruitingCostSpent: e.target.value }))}
                      placeholder="使用額"
                      inputMode="numeric"
                      className="w-full px-2 py-1 font-mono bg-white border border-zinc-200 rounded outline-none focus:border-blue-400"
                    />
                    <span className="text-zinc-400">/</span>
                    <input
                      value={form.recruitingCostBudget}
                      onChange={(e) => setForm((f) => ({ ...f, recruitingCostBudget: e.target.value }))}
                      placeholder="予算額"
                      inputMode="numeric"
                      className="w-full px-2 py-1 font-mono bg-white border border-zinc-200 rounded outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400 w-16 shrink-0">掲載期間</span>
                    <select
                      value={form.postingPeriod}
                      onChange={(e) => setForm((f) => ({ ...f, postingPeriod: e.target.value }))}
                      className="w-full px-2 py-1 font-bold bg-white border border-zinc-200 rounded outline-none focus:border-blue-400"
                    >
                      <option value="">未設定</option>
                      {POSTING_PERIOD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={apiStatus !== 'ready' || saveState === 'saving'}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 transition"
            >
              {saveState === 'saving' ? '保存中…' : '保存する'}
            </button>
            {saveState === 'saved' && <span className="text-xs font-bold text-emerald-600">✓ 保存しました（全員に共有されます）</span>}
            {saveState === 'error' && <span className="text-xs font-bold text-rose-600">保存に失敗しました</span>}
          </div>
        </Card>

        {/* ── アクション履歴（価格交渉・コンタクト・横展開） ── */}
        <Card eyebrow="History" title="アクション履歴">
          {actionLog.length === 0 ? (
            <p className="text-xs font-bold text-zinc-400">履歴はまだ登録されていません</p>
          ) : (
            <ul className="space-y-3">
              {actionLog.map((h, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-[10px] font-bold text-zinc-500 font-mono shrink-0 mt-1 w-16">{h.date}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${ACTION_COLOR[h.type]}`}>{h.type}</span>
                  <p className="text-xs text-zinc-600 font-medium leading-relaxed">{h.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </Shell>
  );
}
