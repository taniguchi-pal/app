'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shell, Eyebrow, Card, HeroStat, TabRow, MiniStat, AchieveBadge, BackLink, Breadcrumb, WeatherBadge, AREA_THEME } from '../../_ui';
import { MONTHS, MonthKey, AREA_MONTHLY, AREAS, sitesOfArea, yen } from '../../_data';

const numOrNull = (v: unknown): number | null => (v === '' || v == null ? null : Number(v));

export default function AreaDashboard({ params }: { params: Promise<{ area: string }> }) {
  const { area: areaId } = React.use(params);
  const area = AREAS.find((a) => a.id === areaId) ?? AREAS[0];
  const [activeMonth, setActiveMonth] = useState<MonthKey>('6月進捗');
  const monthIndex = MONTHS.indexOf(activeMonth);

  // ── 7月以降の実績はSheetsの値があれば上書き ──
  const [monthlyOverrides, setMonthlyOverrides] = useState<Record<string, any>>({});
  useEffect(() => {
    fetch('/api/monthly-data').then((r) => r.json()).then((data) => { if (!data?.error) setMonthlyOverrides(data); }).catch(() => {});
  }, []);

  const monthly = AREA_MONTHLY[areaId] ?? AREA_MONTHLY.kanto;
  const base = monthly[activeMonth];
  const ov = monthlyOverrides[`${areaId}__${activeMonth}`];
  const current = ov
    ? {
        ...base,
        salesBudget: numOrNull(ov.salesBudget) ?? base.salesBudget,
        salesActual: numOrNull(ov.salesActual),
        gpBudget: numOrNull(ov.gpBudget) ?? base.gpBudget,
        gpActual: numOrNull(ov.gpActual),
        activeStaff: numOrNull(ov.activeStaff),
        avgHours: numOrNull(ov.avgHours),
        joined: numOrNull(ov.joined),
        resigned: numOrNull(ov.resigned),
        heat: ov.heat || base.heat,
      }
    : base;
  const sites = sitesOfArea(areaId);
  const endedSites = sites.filter((s) => !s.active);

  const rate = current.salesActual != null ? (current.salesActual / current.salesBudget) * 100 : null;
  const gap = current.salesActual != null ? current.salesActual - current.salesBudget : null;
  const yoyPct = current.salesActual != null && current.yoyLastYear != null ? ((current.salesActual - current.yoyLastYear) / current.yoyLastYear) * 100 : null;

  const prevMonthActual = monthIndex > 0 ? monthly[MONTHS[monthIndex - 1]]?.salesActual ?? null : null;
  const salesChartData = [
    { name: '前年同月', 売上高: current.yoyLastYear },
    { name: '先月', 売上高: prevMonthActual },
    { name: '当月実績', 売上高: current.salesActual },
    { name: '予算', 売上高: current.salesBudget },
  ];

  const topics: { text: string; tone: 'default' | 'alert' | 'notice' }[] = [];
  if (rate != null && gap != null) topics.push({ text: `売上 予算比 ${rate.toFixed(1)}%（GAP ${gap > 0 ? '+' : ''}¥${gap.toLocaleString()}）`, tone: 'default' });
  if (yoyPct != null) topics.push({ text: `前年同月比 ${yoyPct >= 0 ? '+' : ''}${yoyPct.toFixed(1)}%`, tone: 'default' });
  if (current.joined != null) topics.push({ text: `当月 採用動態: 入職 ${current.joined}名 / 退職 ${current.resigned}名`, tone: 'default' });
  if (current.heat) topics.push({ text: `⚠ 現場環境警報: ${current.heat}`, tone: 'alert' });
  if (endedSites.length > 0) {
    topics.push({ text: `終了・非稼働現場（${endedSites.length}件）: ${endedSites.map((s) => `${s.name}${s.lifecycle ? `（${s.lifecycle}）` : ''}`).join(' / ')}`, tone: 'notice' });
  }
  if (topics.length === 0) topics.push({ text: '月次実績データは未登録です（月末確定後に反映されます）', tone: 'default' });
  if (monthIndex >= 3 && !ov) topics.push({ text: 'この月の実績はまだSheetsに未入力です（予算のみ表示）', tone: 'default' });

  return (
    <Shell agvColor={(AREA_THEME[areaId] || AREA_THEME.kanto).from}>
      <header className="px-4 md:px-10 pt-6 pb-4">
        <BackLink href="/budget" label="事業部ダッシュボードへ戻る" />
        <Breadcrumb items={[{ label: '事業部ダッシュボード', href: '/budget' }, { label: `${area.title}エリア` }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Eyebrow>Area Dashboard</Eyebrow>
            <h1 className="mt-1 text-xl md:text-2xl font-black text-zinc-900 tracking-tight">{area.title}エリア 管轄分析</h1>
          </div>
          <div className="flex items-center gap-2">
            {current.heat && <WeatherBadge text={`現場環境警報: ${current.heat}`} />}
            <a href="#sites" className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-full px-4 py-2 shadow-sm transition shrink-0">
              現場ごとに見る（{sites.length}件） ↓
            </a>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-10 space-y-5">

        {/* ── エリア管理数値 ドン ──────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HeroStat
            areaId={areaId}
            eyebrow={`予実管理 (${activeMonth})`}
            value={current.salesActual == null ? `${yen(current.salesBudget)}（予算）` : yen(current.salesActual)}
            sub={<div className="flex justify-between"><span>予算 {yen(current.salesBudget)}</span><span>{rate == null ? '計画中' : `${rate.toFixed(1)}%`}</span></div>}
          />
          <HeroStat
            areaId={areaId}
            eyebrow="KPI（稼働人数・工数）"
            value={current.activeStaff == null ? '—' : `${current.activeStaff}名`}
            sub={<span>平均工数 {current.avgHours == null ? '—' : `${current.avgHours}h`}（基準120h）</span>}
          />
          <HeroStat
            areaId={areaId}
            eyebrow="当月 入職 / 退職"
            value={<span><span className="text-emerald-300">入職 {current.joined ?? '—'}名</span><span className="text-blue-300 mx-2">/</span><span className="text-rose-300">退職 {current.resigned ?? '—'}名</span></span>}
            sub={yoyPct == null ? '前年同月比データ未登録' : <span>前年同月比 <span className={yoyPct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{yoyPct >= 0 ? '+' : ''}{yoyPct.toFixed(1)}%</span></span>}
          />
        </div>

        <Card eyebrow="Timeline" title="月次フィルター">
          <TabRow items={[...MONTHS]} active={activeMonth} onSelect={(m) => setActiveMonth(m as MonthKey)} />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ── 営業パイプライン（ファネル型・転換率つき） ── */}
          <Card eyebrow="Pipeline" title="営業パイプライン（商談→受注）">
            {current.funnel == null ? (
              <div className="h-40 border-2 border-dashed border-zinc-100 rounded-2xl flex items-center justify-center">
                <p className="text-xs font-bold text-zinc-400">パイプラインデータ未登録</p>
              </div>
            ) : (() => {
              const stages = [
                { label: '新規商談', val: current.funnel.meetings },
                { label: '提案', val: current.funnel.proposals },
                { label: '見積', val: current.funnel.estimates },
                { label: '受注', val: current.funnel.orders },
              ];
              const base = Math.max(stages[0].val, 1);
              const stageTheme = (AREA_THEME[areaId] || AREA_THEME.kanto);
              return (
                <div className="space-y-1">
                  {stages.map((s, i) => {
                    const widthPct = Math.max((s.val / base) * 100, 14);
                    const prev = i > 0 ? stages[i - 1].val : null;
                    const convRate = prev != null && prev > 0 ? (s.val / prev) * 100 : null;
                    return (
                      <div key={s.label}>
                        {i > 0 && (
                          <div className="flex items-center justify-center py-0.5">
                            <span className="text-[9px] font-bold text-zinc-400">↓ 転換率 {convRate != null ? `${convRate.toFixed(0)}%` : '—'}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-center">
                          <div
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-white text-xs font-bold transition-all duration-500"
                            style={{ width: `${widthPct}%`, minWidth: '40%', backgroundImage: `linear-gradient(135deg, ${stageTheme.from}, ${stageTheme.to})`, opacity: 0.55 + (i / stages.length) * 0.45 }}
                          >
                            <span>{s.label}</span>
                            <span className="font-mono">{s.val}件</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>

          {/* ── 売上高 前年・先月・予算 対比（折れ線） ── */}
          <Card eyebrow="Analysis" title="売上高 前年・先月・予算 対比推移">
            {current.salesActual == null ? (
              <div className="h-40 border-2 border-dashed border-zinc-100 rounded-2xl flex items-center justify-center">
                <p className="text-xs font-bold text-zinc-400">実績データ未登録（計画月）</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={salesChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#a1a1aa" width={56} tickFormatter={(v) => `${Math.round(Number(v) / 10000)}万`} />
                  <Tooltip formatter={(v) => yen(typeof v === 'number' ? v : Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="売上高" stroke={(AREA_THEME[areaId] || AREA_THEME.kanto).from} strokeWidth={2.5} connectNulls dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* ── トピックス ───────────────────────────── */}
        <Card eyebrow="Topics" title={`${activeMonth} ${area.title}エリア トピックス`}>
          <ul className="space-y-2">
            {topics.map((t, i) => (
              <li
                key={i}
                className={`text-sm font-medium rounded-lg px-3 py-2 ${
                  t.tone === 'alert' ? 'text-rose-700 bg-rose-50 border border-rose-100'
                  : t.tone === 'notice' ? 'text-amber-700 bg-amber-50 border border-amber-100'
                  : 'text-zinc-600 bg-zinc-50 border border-zinc-100'
                }`}
              >
                {t.text}
              </li>
            ))}
          </ul>
        </Card>

        {/* ── 管轄現場一覧 ─────────────────────────── */}
        <p id="sites" className="text-[10px] font-bold text-zinc-400 font-montserrat tracking-[0.15em] uppercase pt-2 scroll-mt-4">管轄現場の個別収益一覧（{sites.length}現場）</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site) => {
            const hasFinancials = site.sales != null;
            const siteRate = hasFinancials ? (site.sales!.actual / site.sales!.budget) * 100 : null;
            return (
              <Link
                key={site.id}
                href={`/budget/site/${site.id}`}
                className={`p-4 rounded-2xl border shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col gap-3 hover:shadow-md transition ${site.active ? 'bg-white border-zinc-100' : 'bg-zinc-50 border-zinc-200'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className={`font-bold text-sm ${site.active ? 'text-zinc-800' : 'text-zinc-500 line-through decoration-zinc-300'}`}>{site.name}</h3>
                      {!site.active && <span className="text-[9px] font-black text-white bg-zinc-500 px-1.5 py-0.5 rounded shrink-0">非稼働</span>}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{site.prefecture ?? '所在地未登録'} ・ 案件コード {site.id}</p>
                  </div>
                  {hasFinancials ? <AchieveBadge rate={siteRate} /> : <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded shrink-0">データ未登録</span>}
                </div>
                {hasFinancials ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">当月売上</span>
                      <span className="font-bold font-mono">{yen(site.sales!.actual)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">配置人数</span>
                      <span className="font-bold font-mono">{site.staffCount}名</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-zinc-400">損益データはまだ登録されていません</p>
                )}
                {(site.backlogCount != null || site.expectedImpact != null) && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">受注残 / 期待インパクト</span>
                    <span className="font-bold font-mono">{site.backlogCount ?? '—'}名 / {yen(site.expectedImpact)}</span>
                  </div>
                )}
                {site.negotiationStatus && (
                  <span className={`self-start text-[10px] font-bold px-2 py-1 rounded border ${
                    site.negotiationStatus === '合意済' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : site.negotiationStatus === '交渉中' ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : site.negotiationStatus === '見送り' ? 'text-zinc-500 bg-zinc-100 border-zinc-200'
                    : 'text-zinc-500 bg-zinc-50 border-zinc-200'
                  }`}>価格交渉: {site.negotiationStatus}</span>
                )}
                {site.lifecycle && (
                  <p className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">⚠ {site.lifecycle}</p>
                )}
                <span className="text-center bg-zinc-50 py-1.5 rounded text-[10px] font-bold text-blue-600 border border-zinc-100">現場カルテを見る ➔</span>
              </Link>
            );
          })}
        </div>
      </main>
    </Shell>
  );
}
