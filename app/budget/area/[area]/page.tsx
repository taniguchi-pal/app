'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shell, Eyebrow, Card, HeroStat, TabRow, MiniStat, AchieveBadge, BackLink, Breadcrumb, WeatherBadge, AREA_THEME } from '../../_ui';
import { MONTHS, MonthKey, VISIBLE_MONTHS, monthLabel, monthLabels, monthCalendar, AREA_MONTHLY, AREAS, sitesOfArea, sitesChangingInMonth, ratesUpdatedLabel, yen } from '../../_data';

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

  // ── 担当Sales/SOの絞り込み用に現場ごとの手入力情報を取得 ──
  const [siteOverrides, setSiteOverrides] = useState<Record<string, any>>({});
  useEffect(() => {
    fetch('/api/site-overrides').then((r) => r.json()).then((data) => { if (!data?.error) setSiteOverrides(data); }).catch(() => {});
  }, []);
  const [repFilter, setRepFilter] = useState<string>('');

  // ── 実際の気象情報（当日分をOpen-Meteoから取得） ──
  const [weather, setWeather] = useState<Record<string, { tempC: number; humidity: number; weatherCode: number } | null>>({});
  useEffect(() => {
    fetch('/api/weather').then((r) => r.json()).then((data) => { if (!data?.error) setWeather(data); }).catch(() => {});
  }, []);
  const areaWeather = weather[areaId];

  const monthly = AREA_MONTHLY[areaId] ?? AREA_MONTHLY.kanto;
  const mergeOverride = (m: MonthKey) => {
    const b = monthly[m];
    const o = monthlyOverrides[`${areaId}__${m}`];
    if (!o) return b;
    return {
      ...b,
      salesBudget: numOrNull(o.salesBudget) ?? b.salesBudget,
      salesActual: numOrNull(o.salesActual),
      gpBudget: numOrNull(o.gpBudget) ?? b.gpBudget,
      gpActual: numOrNull(o.gpActual),
      activeStaff: numOrNull(o.activeStaff),
      avgHours: numOrNull(o.avgHours),
      joined: numOrNull(o.joined),
      resigned: numOrNull(o.resigned),
      heat: o.heat || b.heat,
    };
  };
  const current = mergeOverride(activeMonth);
  const sites = sitesOfArea(areaId);
  const endedSites = sites.filter((s) => !s.active);

  const rate = current.salesActual != null ? (current.salesActual / current.salesBudget) * 100 : null;
  const gap = current.salesActual != null ? current.salesActual - current.salesBudget : null;
  const yoyPct = current.salesActual != null && current.yoyLastYear != null ? ((current.salesActual - current.yoyLastYear) / current.yoyLastYear) * 100 : null;

  // 縦軸=売上高、横軸=4月〜3月の通期。予算/前年/先月(前月実績)/当月実績(進捗)の4本で比較する。
  const salesTrend = MONTHS.map((m, i) => {
    const row = mergeOverride(m);
    const prevRow = i > 0 ? mergeOverride(MONTHS[i - 1]) : null;
    return {
      name: `${monthCalendar(m).month}月`,
      予算: row.salesBudget,
      当月実績: row.salesActual,
      前年: row.yoyLastYear,
      先月: prevRow?.salesActual ?? null,
    };
  });

  const topics: { text: string; tone: 'default' | 'alert' | 'notice' }[] = [];
  if (rate != null && gap != null) topics.push({ text: `売上 予算比 ${rate.toFixed(1)}%（GAP ${gap > 0 ? '+' : ''}¥${gap.toLocaleString()}）`, tone: 'default' });
  if (yoyPct != null) topics.push({ text: `前年同月比 ${yoyPct >= 0 ? '+' : ''}${yoyPct.toFixed(1)}%`, tone: 'default' });
  if (current.joined != null) topics.push({ text: `当月 採用動態: 入職 ${current.joined}名 / 退職 ${current.resigned}名`, tone: 'default' });
  if (current.heat) topics.push({ text: `⚠ 現場環境警報: ${current.heat}`, tone: 'alert' });
  if (endedSites.length > 0) {
    topics.push({ text: `終了・非稼働現場（${endedSites.length}件）: ${endedSites.map((s) => `${s.name}${s.lifecycle ? `（${s.lifecycle}）` : ''}`).join(' / ')}`, tone: 'notice' });
  }
  const changingSites = sitesChangingInMonth(activeMonth, areaId);
  if (changingSites.length > 0) {
    topics.push({ text: `⚠ ${monthLabel(activeMonth)}に契約状況が変わる現場（${changingSites.length}件）: ${changingSites.map((s) => `${s.name}（${s.lifecycle}）`).join(' / ')}`, tone: 'alert' });
  }
  if (topics.length === 0) topics.push({ text: '月次実績データは未登録です（月末確定後に反映されます）', tone: 'default' });
  if (monthIndex >= 3 && current.salesActual == null) topics.push({ text: 'この月の実績はまだSheetsに未入力です（予算のみ表示）', tone: 'default' });

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
            {areaWeather && <WeatherBadge areaTitle={area.title} tempC={areaWeather.tempC} weatherCode={areaWeather.weatherCode} />}
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
            eyebrow={`予実管理 (${monthLabel(activeMonth)})`}
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
          <TabRow items={VISIBLE_MONTHS} active={activeMonth} onSelect={(m) => setActiveMonth(m as MonthKey)} labels={monthLabels(VISIBLE_MONTHS)} />
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

          {/* ── 売上高 前年・先月・予算 対比（通期折れ線） ── */}
          <Card eyebrow="Analysis" title="売上高 前年・先月・予算 対比推移（4月〜3月）">
            <p className="text-3xl font-black text-center font-mono" style={{ color: (AREA_THEME[areaId] || AREA_THEME.kanto).from }}>
              {current.salesActual != null ? yen(current.salesActual) : `${yen(current.salesBudget)}（予算）`}
            </p>
            <p className="text-[10px] text-zinc-400 text-center mb-2">{monthLabel(activeMonth)}</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 10 }} stroke="#a1a1aa" width={56} tickFormatter={(v) => `${Math.round(Number(v) / 10000)}万`} />
                <Tooltip formatter={(v) => (v == null ? '—' : yen(typeof v === 'number' ? v : Number(v)))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="予算" stroke="#a1a1aa" strokeDasharray="4 3" strokeWidth={1.5} connectNulls dot={{ r: 2 }} />
                <Line type="monotone" dataKey="前年" stroke="#a855f7" strokeDasharray="4 3" strokeWidth={1.5} connectNulls dot={{ r: 2 }} />
                <Line type="monotone" dataKey="先月" stroke="#f59e0b" strokeWidth={1.5} connectNulls dot={{ r: 2 }} />
                <Line type="monotone" dataKey="当月実績" stroke={(AREA_THEME[areaId] || AREA_THEME.kanto).from} strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── SO管理KPI（採用・稼働管理） ─────────── */}
        {(() => {
          const so = current.soMetrics;
          const rate = (a?: number, b?: number) => (a != null && b) ? `${((a / b) * 100).toFixed(1)}%` : '—';
          const num = (v?: number, unit = '') => (v != null ? `${v.toLocaleString()}${unit}` : 'データ未登録');
          const yenv = (v?: number) => (v != null ? yen(v) : 'データ未登録');
          return (
            <Card eyebrow="SO Management" title="SO管理KPI（採用・稼働管理）">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="残業超過人数" value={num(so?.overtimeExcessCount, '名')} />
                <MiniStat label="当日欠勤率" value={so?.dailyAbsenceRate != null ? `${so.dailyAbsenceRate.toFixed(1)}%` : 'データ未登録'} />
                <MiniStat label="募集費" value={yenv(so?.recruitingCost)} />
                <MiniStat label="応募単価" value={yenv(so?.applicantUnitCost)} />
                <MiniStat label="有効リソース単価" value={yenv(so?.validResourceUnitCost)} />
                <MiniStat label="入職単価" value={yenv(so?.hireUnitCost)} />
                <MiniStat label="総応募者数" value={num(so?.totalApplicants, '名')} />
                <MiniStat label="有効応募数" value={num(so?.validApplicants, '名')} sub={`有効応募率 ${rate(so?.validApplicants, so?.totalApplicants)}`} />
                <MiniStat label="有効リソース数" value={num(so?.validResources, '名')} sub={`有効リソース率 ${rate(so?.validResources, so?.validApplicants)}`} />
                <MiniStat label="候補者数" value={num(so?.candidates, '名')} />
                <MiniStat label="入職者数" value={num(so?.hires, '名')} sub={`入職率 ${rate(so?.hires, so?.totalApplicants)} ／ 候補入職率 ${rate(so?.hires, so?.candidates)}`} />
                <MiniStat label="月内退職者数" value={num(so?.midMonthResignations, '名')} />
                <MiniStat label="月末退職者数" value={num(so?.endMonthResignations, '名')} />
              </div>
            </Card>
          );
        })()}

        {/* ── トピックス ───────────────────────────── */}
        <Card eyebrow="Topics" title={`${monthLabel(activeMonth)} ${area.title}エリア トピックス`}>
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
        {(() => {
          const effectiveRep = (site: (typeof sites)[number]) => {
            const ov = siteOverrides[site.id];
            return { salesRep: (ov?.salesRep || site.salesRep) ?? null, soRep: (ov?.soRep || site.soRep) ?? null };
          };
          const repOptions = Array.from(new Set(
            sites.flatMap((s) => { const r = effectiveRep(s); return [r.salesRep, r.soRep].filter(Boolean) as string[]; })
          ));
          const filteredSites = repFilter
            ? sites.filter((s) => { const r = effectiveRep(s); return r.salesRep === repFilter || r.soRep === repFilter; })
            : sites;
          return (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div>
                  <p id="sites" className="text-[10px] font-bold text-zinc-400 font-montserrat tracking-[0.15em] uppercase scroll-mt-4">管轄現場の個別収益一覧（{filteredSites.length}/{sites.length}現場）</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">現場ごとの最低賃金・時給相場・マージン率は{ratesUpdatedLabel()}</p>
                </div>
                {repOptions.length > 0 && (
                  <select
                    value={repFilter}
                    onChange={(e) => setRepFilter(e.target.value)}
                    className="text-xs font-bold px-2 py-1.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                  >
                    <option value="">担当Sales/SOで絞り込み（全員）</option>
                    {repOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
              {filteredSites.length === 0 && (
                <p className="text-xs text-zinc-400 py-4 text-center">該当する現場がありません</p>
              )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSites.map((site) => {
            const hasFinancials = site.sales?.actual != null && site.sales?.budget != null;
            const siteRate = hasFinancials ? (site.sales!.actual! / site.sales!.budget!) * 100 : null;
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
            </>
          );
        })()}
      </main>
    </Shell>
  );
}
