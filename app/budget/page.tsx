'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shell, Eyebrow, Card, HeroStat, TabRow, MiniStat, ProgressBar, AGVLine, AGV_PASTEL, WeatherBadge, BackLink } from './_ui';
import { MONTHS, MonthKey, VISIBLE_MONTHS, monthLabel, monthLabels, COMPANY_MONTHLY, AREA_MONTHLY, ANNUAL_SCHEDULE, ANNUAL_GOAL, AREAS, ASSIGNEES, PROJECTS, SITES, yen, BACKLOG_STACKUP_MONTHLY_TARGET, sitesOfArea, sitesChangingInMonth, ratesUpdatedLabel, CURRENT_ACTUAL_MONTH, sumSitesActual, sumAreaStaff } from './_data';

const numOrNull = (v: unknown): number | null => (v === '' || v == null ? null : Number(v));

interface ScheduleTask { id: string; title: string; period: string; status: string; note: string; area: string; site: string; assignee: string; createdAt: string }

const QUARTER_MONTHS = [[4, 5, 6], [7, 8, 9], [10, 11, 12], [1, 2, 3]];

export default function GlobalDashboard() {
  const router = useRouter();
  const [activeMonth, setActiveMonth] = useState<MonthKey>(CURRENT_ACTUAL_MONTH);
  const monthIndex = MONTHS.indexOf(activeMonth);
  const activeQuarter = Math.floor(monthIndex / 3);
  const siteList = Object.values(SITES).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  const [expandedQuarter, setExpandedQuarter] = useState<number | null>(null);

  // ── 7月以降の月次実績・予算はSheetsの値があれば上書き ──
  const [monthlyOverrides, setMonthlyOverrides] = useState<Record<string, any>>({});
  useEffect(() => {
    fetch('/api/monthly-data').then((r) => r.json()).then((data) => { if (!data?.error) setMonthlyOverrides(data); }).catch(() => {});
  }, []);

  // ── 現場カルテで入力された配置人数（SOが入職・退職を反映）を全社集計するため取得 ──
  const [siteOverrides, setSiteOverrides] = useState<Record<string, any>>({});
  useEffect(() => {
    fetch('/api/site-overrides').then((r) => r.json()).then((data) => { if (!data?.error) setSiteOverrides(data); }).catch(() => {});
  }, []);
  const staffSums = AREAS.reduce(
    (acc, a) => {
      const s = sumAreaStaff(a.id, siteOverrides);
      return {
        sum: acc.sum + s.sum, filled: acc.filled + s.filled, total: acc.total + s.total,
        hoursSum: acc.hoursSum + s.hoursSum, hoursFilled: acc.hoursFilled + s.hoursFilled,
      };
    },
    { sum: 0, filled: 0, total: 0, hoursSum: 0, hoursFilled: 0 }
  );

  // ── トピックス・プロジェクトの参照URL（Sheets連携） ──
  const [projectData, setProjectData] = useState<Record<string, { url?: string; note?: string }>>({});
  const [projectApiStatus, setProjectApiStatus] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const [projectEdits, setProjectEdits] = useState<Record<string, string>>({});
  const [projectSaving, setProjectSaving] = useState<string | null>(null);
  const loadProjects = () => {
    fetch('/api/projects').then((r) => r.json()).then((data) => {
      if (data?.error) { setProjectApiStatus('unconfigured'); return; }
      setProjectData(data || {});
      setProjectApiStatus('ready');
    }).catch(() => setProjectApiStatus('error'));
  };
  useEffect(() => { loadProjects(); }, []);
  const handleSaveProject = async (projectId: string) => {
    const url = projectEdits[projectId] ?? projectData[projectId]?.url ?? '';
    setProjectSaving(projectId);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, url }),
      });
      loadProjects();
    } finally {
      setProjectSaving(null);
    }
  };

  // ── 週次 応募対応（募集費・応募数・面接数・入職数・退職数・入職率など、Sheets連携） ──
  interface WeeklyRecruitingEntry {
    id: string; areaId: string; assignee: string; weekStart: string;
    recruitingCost: number; applicants: number; interviews: number; hires: number; resignations: number;
  }
  const [weeklyRecruiting, setWeeklyRecruiting] = useState<WeeklyRecruitingEntry[]>([]);
  const [weeklyApiStatus, setWeeklyApiStatus] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const [weeklyAreaFilter, setWeeklyAreaFilter] = useState<string>('');
  const [newWeekly, setNewWeekly] = useState({ areaId: 'kanto', assignee: '', weekStart: '', recruitingCost: '', applicants: '', interviews: '', hires: '', resignations: '' });
  const [weeklyAdding, setWeeklyAdding] = useState(false);
  const loadWeeklyRecruiting = () => {
    fetch('/api/weekly-recruiting').then((r) => r.json()).then((data) => {
      if (data?.error) { setWeeklyApiStatus('unconfigured'); return; }
      setWeeklyRecruiting(Array.isArray(data) ? data : []);
      setWeeklyApiStatus('ready');
    }).catch(() => setWeeklyApiStatus('error'));
  };
  useEffect(() => { loadWeeklyRecruiting(); }, []);
  const handleAddWeekly = async () => {
    if (!newWeekly.weekStart) return;
    setWeeklyAdding(true);
    try {
      await fetch('/api/weekly-recruiting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaId: newWeekly.areaId, assignee: newWeekly.assignee, weekStart: newWeekly.weekStart,
          recruitingCost: numOrNull(newWeekly.recruitingCost) ?? 0,
          applicants: numOrNull(newWeekly.applicants) ?? 0,
          interviews: numOrNull(newWeekly.interviews) ?? 0,
          hires: numOrNull(newWeekly.hires) ?? 0,
          resignations: numOrNull(newWeekly.resignations) ?? 0,
        }),
      });
      setNewWeekly({ areaId: newWeekly.areaId, assignee: newWeekly.assignee, weekStart: '', recruitingCost: '', applicants: '', interviews: '', hires: '', resignations: '' });
      loadWeeklyRecruiting();
    } finally {
      setWeeklyAdding(false);
    }
  };
  const weeklyNum = (v: unknown) => Number(v) || 0;
  const weeklyWeekLabel = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : `${d.getMonth() + 1}/${d.getDate()}週〜`;
  };
  const weeklyRows = (() => {
    const filtered = weeklyRecruiting.filter((e) => !weeklyAreaFilter || e.areaId === weeklyAreaFilter);
    if (weeklyAreaFilter) {
      return [...filtered]
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .map((e) => ({ ...e }));
    }
    const byWeek = new Map<string, Omit<WeeklyRecruitingEntry, 'id' | 'areaId' | 'assignee'>>();
    for (const e of filtered) {
      const cur = byWeek.get(e.weekStart) ?? { weekStart: e.weekStart, recruitingCost: 0, applicants: 0, interviews: 0, hires: 0, resignations: 0 };
      cur.recruitingCost += weeklyNum(e.recruitingCost);
      cur.applicants += weeklyNum(e.applicants);
      cur.interviews += weeklyNum(e.interviews);
      cur.hires += weeklyNum(e.hires);
      cur.resignations += weeklyNum(e.resignations);
      byWeek.set(e.weekStart, cur);
    }
    return [...byWeek.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart)).map((r) => ({ ...r, assignee: '' }));
  })();
  const weeklyTotals = weeklyRows.reduce(
    (acc, r) => ({
      recruitingCost: acc.recruitingCost + weeklyNum(r.recruitingCost),
      applicants: acc.applicants + weeklyNum(r.applicants),
      interviews: acc.interviews + weeklyNum(r.interviews),
      hires: acc.hires + weeklyNum(r.hires),
      resignations: acc.resignations + weeklyNum(r.resignations),
    }),
    { recruitingCost: 0, applicants: 0, interviews: 0, hires: 0, resignations: 0 }
  );
  const weeklyHireRate = (hires: number, applicants: number) => (applicants > 0 ? `${((hires / applicants) * 100).toFixed(1)}%` : '—');
  const weeklyUnitCost = (cost: number, hires: number) => (hires > 0 ? yen(Math.round(cost / hires)) : '—');

  // 7月は関東・中部（現場実績を自動集計）＋関西・大阪支店（自社システムの実数値）の
  // 全4エリア合算で全社実績を算出する。見通し（salesForecast）が全4エリア計のため、
  // 予算・進捗も同じ範囲（全4エリア）で揃えないと見通しとの整合性が崩れるため統一。
  const base = (() => {
    const b = COMPANY_MONTHLY[activeMonth];
    if (activeMonth !== CURRENT_ACTUAL_MONTH) return b;
    const kanto = sumSitesActual('kanto');
    const chubu = sumSitesActual('chubu');
    const kansaiMonth = AREA_MONTHLY.kansai[CURRENT_ACTUAL_MONTH];
    const osakaMonth = AREA_MONTHLY.osaka[CURRENT_ACTUAL_MONTH];
    const salesBudget = kanto.salesBudget + chubu.salesBudget + kansaiMonth.salesBudget + osakaMonth.salesBudget;
    const salesActual = kanto.salesActual + chubu.salesActual + (kansaiMonth.salesActual ?? 0) + (osakaMonth.salesActual ?? 0);
    const opActual = kanto.opProfitActual + chubu.opProfitActual + (kansaiMonth.gpActual ?? 0) + (osakaMonth.gpActual ?? 0);
    return {
      ...b,
      status: 'inprogress' as const,
      salesBudget,
      salesActual,
      gpBudget: Math.round(salesBudget * (ANNUAL_GOAL.gpRate / 100)),
      opBudget: Math.round(salesBudget * (ANNUAL_GOAL.opRate / 100)),
      opActual,
      activeStaff: b.activeStaff == null && staffSums.filled > 0 ? staffSums.sum : b.activeStaff,
      avgHours: b.avgHours == null && staffSums.hoursFilled > 0 && staffSums.filled > 0
        ? Math.round((staffSums.hoursSum / staffSums.sum) * 100) / 100
        : b.avgHours,
      topics: ['関東・中部・関西・大阪支店の管轄現場実績を自動集計した全社速報値です'],
    };
  })();
  const ov = monthlyOverrides[`company__${activeMonth}`];
  const current = ov
    ? {
        ...base,
        salesBudget: numOrNull(ov.salesBudget) ?? base.salesBudget,
        salesActual: numOrNull(ov.salesActual),
        gpBudget: numOrNull(ov.gpBudget) ?? base.gpBudget,
        gpActual: numOrNull(ov.gpActual),
        opBudget: numOrNull(ov.opBudget) ?? base.opBudget,
        opActual: numOrNull(ov.opActual),
        activeStaff: numOrNull(ov.activeStaff),
        avgHours: numOrNull(ov.avgHours),
        joined: numOrNull(ov.joined),
        resigned: numOrNull(ov.resigned),
      }
    : base;

  // 見通しは大阪支店を含む全エリア合計と比較する（予実管理の「予算」は大阪支店除く全社の従来定義のため、
  // 分母を揃えないと見通し達成率が実態より高く出てしまう）。
  const allAreaBudget = AREAS.reduce((sum, a) => sum + (AREA_MONTHLY[a.id]?.[activeMonth]?.salesBudget ?? 0), 0);
  const salesRate = current.salesActual != null ? (current.salesActual / current.salesBudget) * 100 : null;
  const salesGap = current.salesActual != null ? current.salesActual - current.salesBudget : null;
  const yoyPct = current.salesActual != null && current.yoyLastYear != null ? ((current.salesActual - current.yoyLastYear) / current.yoyLastYear) * 100 : null;

  // ── エリア別 実際の気象情報（当日分をOpen-Meteoから取得） ──
  const [weather, setWeather] = useState<Record<string, { tempC: number; humidity: number; weatherCode: number } | null>>({});
  useEffect(() => {
    fetch('/api/weather').then((r) => r.json()).then((data) => { if (!data?.error) setWeather(data); }).catch(() => {});
  }, []);
  const weatherAlerts = AREAS
    .map((a) => ({ area: a, w: weather[a.id] }))
    .filter((x): x is { area: typeof x.area; w: NonNullable<typeof x.w> } => x.w != null);

  // ── この月に契約終了・非稼働化する現場（全社） ──
  const changingSites = sitesChangingInMonth(activeMonth);

  // ── 年間スケジュール・タスク（Sheets連携） ──
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [taskApiStatus, setTaskApiStatus] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const [newTask, setNewTask] = useState({ title: '', period: '', note: '', area: '', site: '', assignee: '' });
  const [adding, setAdding] = useState(false);
  const newTaskSites = newTask.area ? sitesOfArea(newTask.area) : [];

  const loadTasks = () => {
    fetch('/api/schedule').then((r) => r.json()).then((data) => {
      if (data?.error) { setTaskApiStatus('unconfigured'); return; }
      setTasks(Array.isArray(data) ? data : []);
      setTaskApiStatus('ready');
    }).catch(() => setTaskApiStatus('error'));
  };
  useEffect(() => { loadTasks(); }, []);

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    setAdding(true);
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask.title, period: newTask.period, status: '未着手', note: newTask.note, area: newTask.area, site: newTask.site, assignee: newTask.assignee }),
      });
      setNewTask({ title: '', period: '', note: '', area: '', site: '', assignee: '' });
      loadTasks();
    } finally {
      setAdding(false);
    }
  };

  const cycleStatus = async (t: ScheduleTask) => {
    const next = t.status === '未着手' ? '進行中' : t.status === '進行中' ? '完了' : '未着手';
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...t, status: next }),
    });
  };

  return (
    <Shell agvColor={AGV_PASTEL.company}>
      {/* ── ヘッダー ─────────────────────────────────── */}
      <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 md:px-10 py-5 bg-white border-b border-zinc-100 overflow-hidden">
        <AGVLine color={AGV_PASTEL.company} />
        <div>
          <BackLink href="/" label="TOPページへ戻る" />
          <Eyebrow>Staffing Management Brain</Eyebrow>
          <h1 className="mt-1 text-xl md:text-2xl font-black text-zinc-900 tracking-tight">27期 人材ソリューション事業部 DASHBOARD</h1>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-[9px] font-bold text-zinc-400 font-montserrat tracking-[0.15em] uppercase">Powered by</span>
          <img src="/logo.png" alt="PAL Logo" className="h-7 object-contain mix-blend-multiply opacity-90" />
        </div>
      </header>

      <main className="px-4 md:px-10 mt-5 space-y-5">

        {/* ── エリア気象注意報（点滅） ─────────────── */}
        {weatherAlerts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 font-montserrat tracking-[0.15em] uppercase">Weather</span>
            {weatherAlerts.map(({ area, w }) => (
              <WeatherBadge key={area.id} areaTitle={area.title} tempC={w.tempC} weatherCode={w.weatherCode} />
            ))}
          </div>
        )}

        {/* ── 事業部の管理数値 ドン ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HeroStat
            eyebrow={`予実管理 (${monthLabel(activeMonth)})`}
            value={current.salesActual == null ? `${yen(current.salesBudget)}（予算）` : yen(current.salesActual)}
            sub={
              <div className="space-y-0.5">
                <div className="flex justify-between">
                  <span>予算 {yen(current.salesBudget)}</span>
                  <span className={salesGap == null ? '' : salesGap >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                    {salesGap == null ? '実績未確定' : `${salesGap > 0 ? '+' : ''}${salesGap.toLocaleString()} (${salesRate!.toFixed(1)}%)`}
                  </span>
                </div>
                {current.salesForecast != null && (
                  <div className="flex justify-between text-white/70">
                    <span>見通し {yen(current.salesForecast)}（全エリア計）</span>
                    <span>{allAreaBudget ? `${((current.salesForecast / allAreaBudget) * 100).toFixed(1)}%` : ''}</span>
                  </div>
                )}
              </div>
            }
          />
          <HeroStat
            eyebrow="KPI進捗（稼働人数）"
            value={current.activeStaff == null ? '—' : `${current.activeStaff} / ${current.targetStaff}名`}
            sub={
              activeMonth === CURRENT_ACTUAL_MONTH && COMPANY_MONTHLY[activeMonth].activeStaff == null && staffSums.filled > 0 ? (
                <div className="flex justify-between">
                  <span>現場入力 {staffSums.filled}/{staffSums.total}件から集計中</span>
                  <span className={current.orderBacklog != null && current.orderBacklog >= 20 ? 'text-rose-300' : ''}>受注残 {current.orderBacklog ?? '—'}名</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span>平均工数 {current.avgHours == null ? '—' : `${current.avgHours}h`}（基準120h）</span>
                  <span className={current.orderBacklog != null && current.orderBacklog >= 20 ? 'text-rose-300' : ''}>受注残 {current.orderBacklog ?? '—'}名</span>
                </div>
              )
            }
          />
          <HeroStat
            eyebrow="当月 入職 / 退職"
            value={
              <span>
                <span className="text-emerald-300">入職 {current.joined ?? '—'}名</span>
                <span className="text-blue-300 mx-2">/</span>
                <span className="text-rose-300">退職 {current.resigned ?? '—'}名</span>
              </span>
            }
            sub={yoyPct == null ? '前年同月比データ未登録' : <span>前年同月比 <span className={yoyPct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{yoyPct >= 0 ? '+' : ''}{yoyPct.toFixed(1)}%</span></span>}
          />
        </div>

        {/* ── タイムライン & エリア選択（横並びで省スペース） ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card eyebrow="Timeline" title="月次フィルター">
            <TabRow items={VISIBLE_MONTHS} active={activeMonth} onSelect={(m) => setActiveMonth(m as MonthKey)} labels={monthLabels(VISIBLE_MONTHS)} />
            {monthIndex >= 3 && current.salesActual == null && (
              <p className="text-[10px] text-zinc-400 mt-2">※ この月の実績はまだSheetsに未入力のため、予算のプレースホルダー値を表示しています</p>
            )}
          </Card>
          <Card eyebrow="Area" title="エリア別に見る">
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-900 text-white shadow-sm">事業部全体</span>
              {AREAS.map((a) => (
                <Link key={a.id} href={`/budget/area/${a.id}`} className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-500 hover:bg-blue-50 hover:text-blue-700 transition">
                  {a.title} ➔
                </Link>
              ))}
            </div>
            <select
              defaultValue=""
              onChange={(e) => { if (e.target.value) router.push(`/budget/site/${e.target.value}`); }}
              className="mt-2 w-full px-2 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
            >
              <option value="">現場名で直接検索 ➔</option>
              {AREAS.map((a) => (
                <optgroup key={a.id} label={a.title}>
                  {siteList.filter((s) => s.areaId === a.id).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}（{s.id}）</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-[9px] text-zinc-400 mt-2">現場ごとの最低賃金・時給相場・マージン率は{ratesUpdatedLabel()}</p>
          </Card>
        </div>

        {/* ── KPIの詳細 ────────────────────────────── */}
        <Card eyebrow="KPI Detail" title="全社 予実管理・KPI詳細">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              {[
                { name: '売上高', budget: current.salesBudget, actual: current.salesActual },
                { name: '売上総利益', budget: current.gpBudget, actual: current.gpActual },
                { name: '営業利益', budget: current.opBudget, actual: current.opActual },
              ].map((item, idx) => {
                const hasActual = item.actual != null && item.budget != null;
                const rate = hasActual ? (item.actual! / item.budget!) * 100 : null;
                const gap = hasActual ? item.actual! - item.budget! : null;
                const barColor = rate == null ? 'bg-zinc-200' : rate >= 100 ? 'bg-emerald-500' : rate >= 90 ? 'bg-blue-500' : 'bg-rose-500';
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-bold text-zinc-600">{item.name}</span>
                      <div className="text-right font-mono">
                        <span className="text-sm font-black text-zinc-800">{hasActual ? yen(item.actual) : '計画中'}</span>
                        <span className="text-[10px] text-zinc-400 ml-2">予算 {yen(item.budget)}</span>
                      </div>
                    </div>
                    <ProgressBar rate={rate} color={barColor} />
                    <div className="flex justify-between mt-1 text-[10px] font-bold font-mono">
                      <span className={gap == null ? 'text-zinc-400' : gap >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {gap == null ? '実績未確定' : `${gap > 0 ? '+' : ''}¥${gap.toLocaleString()}`}
                      </span>
                      <span className="text-zinc-400">{rate == null ? '—' : `${rate.toFixed(1)}%`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              <MiniStat label="現在稼働人数" value={current.activeStaff ?? '—'} unit="名" sub={`目標 ${current.targetStaff}名`} />
              <MiniStat
                label="受注残（未充足）"
                value={current.orderBacklog ?? '—'}
                unit="名"
                sub={current.orderBacklog != null && current.orderBacklog >= 20 ? '早急な採用補填が必要' : current.orderBacklog == null ? '実績未確定' : '正常範囲'}
                danger={current.orderBacklog != null && current.orderBacklog >= 20}
              />
              <MiniStat
                label="受注残 積上可能金額"
                value={current.backlogStackupPotential != null ? yen(current.backlogStackupPotential) : '—'}
                sub={current.backlogStackupPotential != null
                  ? `2Q目標 ${yen(BACKLOG_STACKUP_MONTHLY_TARGET)}/月 ${current.backlogStackupPotential >= BACKLOG_STACKUP_MONTHLY_TARGET ? '達成' : `残り${yen(BACKLOG_STACKUP_MONTHLY_TARGET - current.backlogStackupPotential)}`}`
                  : `2Q目標 ${yen(BACKLOG_STACKUP_MONTHLY_TARGET)}/月`}
              />
              <MiniStat label="1人あたり平均工数" value={current.avgHours ?? '—'} unit="h" sub="基準値 120h" />
              <MiniStat label="入職 / 退職" value={<span><span className="text-emerald-600">入職{current.joined ?? '—'}名</span> / <span className="text-rose-600">退職{current.resigned ?? '—'}名</span></span>} />
            </div>
          </div>
        </Card>

        {/* ── 年間スケジュール ─────────────────────── */}
        <Card eyebrow="Roadmap" title="第27期 年間スケジュール・コミットメント">
          <p className="text-xs text-zinc-500 -mt-2 mb-3">通期目標: 売上 {yen(ANNUAL_GOAL.sales)} ／ 粗利②目標 {ANNUAL_GOAL.gpRate}% ／ 営業利益率 {ANNUAL_GOAL.opRate}%</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {ANNUAL_SCHEDULE.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedQuarter(expandedQuarter === idx ? null : idx)}
                className={`text-left p-3 rounded-xl border relative overflow-hidden transition ${idx === activeQuarter ? 'bg-blue-50 border-blue-200' : 'bg-zinc-50 border-zinc-100'} ${expandedQuarter === idx ? 'ring-2 ring-blue-400' : 'hover:border-blue-200'}`}
              >
                <span className={`absolute top-0 right-0 text-[9px] font-black px-2 py-1 rounded-bl-lg ${idx === activeQuarter ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>{q.period}</span>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">{q.range}</p>
                <p className="text-xs font-black text-blue-900 mt-1">{q.title}</p>
                <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">{q.desc}</p>
                <p className="text-[9px] font-bold text-blue-500 mt-2">{expandedQuarter === idx ? '閉じる ▲' : '月別詳細を見る ▼'}</p>
              </button>
            ))}
          </div>

          {expandedQuarter != null && (
            <div className="mt-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
                {ANNUAL_SCHEDULE[expandedQuarter].period}（{ANNUAL_SCHEDULE[expandedQuarter].range}）の月別スケジュール
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {QUARTER_MONTHS[expandedQuarter].map((m) => {
                  const monthTasks = tasks.filter((t) => parseInt((t.period.match(/(\d{1,2})月/) || [])[1] || '', 10) === m);
                  return (
                    <div key={m} className="p-2.5 rounded-lg bg-white border border-zinc-100">
                      <p className="text-xs font-black text-zinc-700">{m}月</p>
                      {monthTasks.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 mt-1">登録タスクなし</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {monthTasks.map((t) => (
                            <li key={t.id} className="text-[10px] text-zinc-600">
                              <span className={`font-bold ${t.status === '完了' ? 'text-emerald-600' : 'text-zinc-700'}`}>{t.title}</span>
                              {t.assignee && <span className="text-zinc-400"> ・担当: {t.assignee}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-zinc-400 mt-2">※ タスク管理カードで登録した項目のうち、期限（例:「7月末」）から月を判定して表示しています</p>
            </div>
          )}
        </Card>

        {/* ── タスク管理（追加・ステータス変更） ────── */}
        <Card eyebrow="Tasks" title="スケジュール・タスク管理">
          {taskApiStatus === 'unconfigured' && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 -mt-1 mb-3">
              共有保存基盤（Google Sheets連携）が未設定のため、タスクの追加・保存はまだできません。docs/site-overrides-setup.md をご参照ください。
            </p>
          )}
          <div className="space-y-2 mb-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newTask.title}
                onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                placeholder="タスク名（例: 関西エリア価格交渉フォロー）"
                className="flex-1 px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
              />
              <input
                value={newTask.period}
                onChange={(e) => setNewTask((t) => ({ ...t, period: e.target.value }))}
                placeholder="期限（例: 7月末）"
                className="sm:w-32 px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newTask.area}
                onChange={(e) => setNewTask((t) => ({ ...t, area: e.target.value, site: '' }))}
                className="flex-1 px-2 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
              >
                <option value="">エリア（任意）</option>
                {AREAS.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
              <select
                value={newTask.site}
                onChange={(e) => setNewTask((t) => ({ ...t, site: e.target.value }))}
                disabled={!newTask.area}
                className="flex-1 px-2 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400 disabled:opacity-40"
              >
                <option value="">現場（任意）</option>
                {newTaskSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select
                value={newTask.assignee}
                onChange={(e) => setNewTask((t) => ({ ...t, assignee: e.target.value }))}
                className="flex-1 px-2 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
              >
                <option value="">担当（任意）</option>
                {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button
                onClick={handleAddTask}
                disabled={taskApiStatus !== 'ready' || adding || !newTask.title.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 transition shrink-0"
              >
                {adding ? '追加中…' : '+ タスク追加'}
              </button>
            </div>
          </div>
          {tasks.length === 0 ? (
            <p className="text-xs text-zinc-400">登録されているタスクはありません</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => {
                const taskArea = AREAS.find((a) => a.id === t.area);
                const taskSite = t.site ? sitesOfArea(t.area).find((s) => s.id === t.site) : null;
                const createdLabel = t.createdAt ? new Date(t.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
                return (
                  <li key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <button
                      onClick={() => cycleStatus(t)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 transition ${
                        t.status === '完了' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : t.status === '進行中' ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-zinc-500 bg-zinc-100 border-zinc-200'
                      }`}
                    >
                      {t.status || '未着手'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold ${t.status === '完了' ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>{t.title}</span>
                      {(taskArea || taskSite || t.assignee || createdLabel) && (
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                          {[taskArea?.title, taskSite?.name, t.assignee && `担当: ${t.assignee}`, createdLabel && `登録: ${createdLabel}`].filter(Boolean).join(' ・ ')}
                        </p>
                      )}
                    </div>
                    {t.period && <span className="text-[10px] text-zinc-400 font-mono shrink-0">{t.period}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ── トピックス・プロジェクト（参照URL） ──── */}
        <Card eyebrow="Projects" title="トピックス・プロジェクト">
          {projectApiStatus === 'unconfigured' && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 -mt-1 mb-3">
              共有保存基盤（Google Sheets連携）が未設定のため、URLの保存はまだできません。docs/site-overrides-setup.md の「Projects」シートをご参照ください。
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROJECTS.map((p, i) => {
              const saved = projectData[p.id]?.url ?? '';
              const value = projectEdits[p.id] ?? saved;
              return (
                <div key={p.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <p className="text-xs font-bold text-zinc-700">{`①②③④`[i] ?? ''} {p.name}</p>
                  {p.note && <p className="text-[10px] text-zinc-400 mt-0.5">{p.note}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      value={value}
                      onChange={(e) => setProjectEdits((f) => ({ ...f, [p.id]: e.target.value }))}
                      placeholder="Googleドライブ・AIツールなどのURL"
                      className="flex-1 px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={() => handleSaveProject(p.id)}
                      disabled={projectApiStatus !== 'ready' || projectSaving === p.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 transition shrink-0"
                    >
                      {projectSaving === p.id ? '保存中…' : '保存'}
                    </button>
                  </div>
                  {saved && (
                    <a href={saved} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 hover:bg-blue-100">
                      開く ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── 週次 応募対応（募集費・入職率） ────────── */}
        <Card eyebrow="Recruiting" title="週次 応募対応（募集費・入職率）">
          {weeklyApiStatus === 'unconfigured' && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 -mt-1 mb-3">
              共有保存基盤（Google Sheets連携）が未設定のため、週次応募対応の追加・保存はまだできません。docs/site-overrides-setup.md をご参照ください。
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setWeeklyAreaFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${weeklyAreaFilter === '' ? 'bg-blue-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-blue-50 hover:text-blue-700'}`}
            >
              全社
            </button>
            {AREAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setWeeklyAreaFilter(a.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${weeklyAreaFilter === a.id ? 'bg-blue-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-blue-50 hover:text-blue-700'}`}
              >
                {a.title}
              </button>
            ))}
          </div>

          {weeklyRows.length === 0 ? (
            <p className="text-xs text-zinc-400 mb-3">登録されている週次データはありません</p>
          ) : (
            <div className="overflow-x-auto -mx-1 mb-3">
              <table className="min-w-[720px] w-full text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-100">
                    <th className="text-left font-bold px-2 py-1.5">週</th>
                    {!weeklyAreaFilter ? null : <th className="text-left font-bold px-2 py-1.5">担当者</th>}
                    <th className="text-right font-bold px-2 py-1.5">募集費</th>
                    <th className="text-right font-bold px-2 py-1.5">応募数</th>
                    <th className="text-right font-bold px-2 py-1.5">面接数</th>
                    <th className="text-right font-bold px-2 py-1.5">入職数</th>
                    <th className="text-right font-bold px-2 py-1.5">退職数</th>
                    <th className="text-right font-bold px-2 py-1.5">入職率</th>
                    <th className="text-right font-bold px-2 py-1.5">採用単価</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyRows.map((r, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      <td className="px-2 py-1.5 font-bold text-zinc-700">{weeklyWeekLabel(r.weekStart)}</td>
                      {!weeklyAreaFilter ? null : <td className="px-2 py-1.5 text-zinc-500">{r.assignee || '—'}</td>}
                      <td className="px-2 py-1.5 text-right font-mono">{yen(weeklyNum(r.recruitingCost))}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{weeklyNum(r.applicants)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{weeklyNum(r.interviews)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{weeklyNum(r.hires)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{weeklyNum(r.resignations)}</td>
                      <td className="px-2 py-1.5 text-right font-mono font-bold text-blue-700">{weeklyHireRate(weeklyNum(r.hires), weeklyNum(r.applicants))}</td>
                      <td className="px-2 py-1.5 text-right font-mono font-bold text-blue-700">{weeklyUnitCost(weeklyNum(r.recruitingCost), weeklyNum(r.hires))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 bg-zinc-50">
                    <td className="px-2 py-1.5 font-black text-zinc-700">合計</td>
                    {!weeklyAreaFilter ? null : <td className="px-2 py-1.5" />}
                    <td className="px-2 py-1.5 text-right font-mono font-black">{yen(weeklyTotals.recruitingCost)}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black">{weeklyTotals.applicants}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black">{weeklyTotals.interviews}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black">{weeklyTotals.hires}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black">{weeklyTotals.resignations}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black text-blue-800">{weeklyHireRate(weeklyTotals.hires, weeklyTotals.applicants)}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black text-blue-800">{weeklyUnitCost(weeklyTotals.recruitingCost, weeklyTotals.hires)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="h-px bg-zinc-100 my-3" />
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">週次データを追加（数字だけ入力すればOK）</p>
          <div className="flex flex-wrap gap-2 items-end">
            <select
              value={newWeekly.areaId}
              onChange={(e) => setNewWeekly((w) => ({ ...w, areaId: e.target.value }))}
              className="px-2 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
            >
              {AREAS.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
            <select
              value={newWeekly.assignee}
              onChange={(e) => setNewWeekly((w) => ({ ...w, assignee: e.target.value }))}
              className="px-2 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
            >
              <option value="">担当者（任意）</option>
              {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <input
              type="date"
              value={newWeekly.weekStart}
              onChange={(e) => setNewWeekly((w) => ({ ...w, weekStart: e.target.value }))}
              className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
            />
            {([
              ['recruitingCost', '募集費'], ['applicants', '応募数'], ['interviews', '面接数'],
              ['hires', '入職数'], ['resignations', '退職数'],
            ] as const).map(([key, label]) => (
              <input
                key={key}
                type="number"
                value={newWeekly[key]}
                onChange={(e) => setNewWeekly((w) => ({ ...w, [key]: e.target.value }))}
                placeholder={label}
                className="w-24 px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
              />
            ))}
            <button
              onClick={handleAddWeekly}
              disabled={weeklyApiStatus !== 'ready' || weeklyAdding || !newWeekly.weekStart}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 transition shrink-0"
            >
              {weeklyAdding ? '追加中…' : '+ 追加'}
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">週は開始日（例: 7/1・7/6・7/13・7/20・7/27）で入力。担当者・エリアはプルダウン選択のみで入力できます。</p>
        </Card>

        {/* ── トピックス ───────────────────────────── */}
        <Card eyebrow="Topics" title={`${monthLabel(activeMonth)} 事業部トピックス`}>
          <ul className="text-sm text-zinc-600 space-y-1.5 list-disc list-inside font-medium">
            {current.topics.map((t, i) => <li key={i}>{t}</li>)}
            {changingSites.length > 0 && (
              <li className="text-amber-700">⚠ {monthLabel(activeMonth)}に契約状況が変わる現場（{changingSites.length}件）: {changingSites.map((s) => `${s.name}（${s.lifecycle}）`).join(' / ')}</li>
            )}
          </ul>
          <div className="h-px bg-zinc-100 my-3" />
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">重要スケジュール / コミット</p>
          <ul className="text-sm text-zinc-600 space-y-1.5 font-medium">
            {current.schedule.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Card>
      </main>
    </Shell>
  );
}
