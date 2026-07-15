'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell, Eyebrow, Card, HeroStat, TabRow, MiniStat, ProgressBar, AGVLine, WeatherBadge, BackLink } from './_ui';
import { MONTHS, MonthKey, VISIBLE_MONTHS, MONTH_SHORT_LABELS, COMPANY_MONTHLY, AREA_MONTHLY, ANNUAL_SCHEDULE, ANNUAL_GOAL, AREAS, ASSIGNEES, yen, BACKLOG_STACKUP_MONTHLY_TARGET, sitesOfArea } from './_data';

const numOrNull = (v: unknown): number | null => (v === '' || v == null ? null : Number(v));

interface ScheduleTask { id: string; title: string; period: string; status: string; note: string; area: string; site: string; assignee: string; createdAt: string }

export default function GlobalDashboard() {
  const [activeMonth, setActiveMonth] = useState<MonthKey>('6月進捗');
  const monthIndex = MONTHS.indexOf(activeMonth);
  const activeQuarter = Math.floor(monthIndex / 3);

  // ── 7月以降の月次実績・予算はSheetsの値があれば上書き ──
  const [monthlyOverrides, setMonthlyOverrides] = useState<Record<string, any>>({});
  useEffect(() => {
    fetch('/api/monthly-data').then((r) => r.json()).then((data) => { if (!data?.error) setMonthlyOverrides(data); }).catch(() => {});
  }, []);

  const base = COMPANY_MONTHLY[activeMonth];
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

  const salesRate = current.salesActual != null ? (current.salesActual / current.salesBudget) * 100 : null;
  const salesGap = current.salesActual != null ? current.salesActual - current.salesBudget : null;
  const yoyPct = current.salesActual != null && current.yoyLastYear != null ? ((current.salesActual - current.yoyLastYear) / current.yoyLastYear) * 100 : null;

  // ── エリア別 気象注意報（小さく点滅表示） ──
  const weatherAlerts = AREAS
    .map((a) => ({ area: a, heat: AREA_MONTHLY[a.id]?.[activeMonth]?.heat }))
    .filter((x) => x.heat);

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
    <Shell agvColor="#1e40af">
      {/* ── ヘッダー ─────────────────────────────────── */}
      <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 md:px-10 py-5 bg-white border-b border-zinc-100 overflow-hidden">
        <AGVLine />
        <div>
          <BackLink href="/" label="TOPページへ戻る" />
          <Eyebrow>Staffing Management Brain</Eyebrow>
          <h1 className="mt-1 text-xl md:text-2xl font-black text-zinc-900 tracking-tight">27期 人材ソリューション事業部 経営ダッシュボード</h1>
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
            {weatherAlerts.map(({ area, heat }) => (
              <WeatherBadge key={area.id} text={`${area.title}: ${heat}`} />
            ))}
          </div>
        )}

        {/* ── 事業部の管理数値 ドン ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HeroStat
            eyebrow={`予実管理 (${activeMonth})`}
            value={current.salesActual == null ? `${yen(current.salesBudget)}（予算）` : yen(current.salesActual)}
            sub={
              <div className="flex justify-between">
                <span>予算 {yen(current.salesBudget)}</span>
                <span className={salesGap == null ? '' : salesGap >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {salesGap == null ? '実績未確定' : `${salesGap > 0 ? '+' : ''}${salesGap.toLocaleString()} (${salesRate!.toFixed(1)}%)`}
                </span>
              </div>
            }
          />
          <HeroStat
            eyebrow="KPI進捗（稼働人数）"
            value={current.activeStaff == null ? '—' : `${current.activeStaff} / ${current.targetStaff}名`}
            sub={
              <div className="flex justify-between">
                <span>平均工数 {current.avgHours == null ? '—' : `${current.avgHours}h`}（基準120h）</span>
                <span className={current.orderBacklog != null && current.orderBacklog >= 20 ? 'text-rose-300' : ''}>受注残 {current.orderBacklog ?? '—'}名</span>
              </div>
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
            <TabRow items={VISIBLE_MONTHS} active={activeMonth} onSelect={(m) => setActiveMonth(m as MonthKey)} labels={MONTH_SHORT_LABELS} />
            {monthIndex >= 3 && !ov && (
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
              <div key={idx} className={`p-3 rounded-xl border relative overflow-hidden ${idx === activeQuarter ? 'bg-blue-50 border-blue-200' : 'bg-zinc-50 border-zinc-100'}`}>
                <span className={`absolute top-0 right-0 text-[9px] font-black px-2 py-1 rounded-bl-lg ${idx === activeQuarter ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>{q.period}</span>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">{q.range}</p>
                <p className="text-xs font-black text-blue-900 mt-1">{q.title}</p>
                <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">{q.desc}</p>
              </div>
            ))}
          </div>
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

        {/* ── トピックス ───────────────────────────── */}
        <Card eyebrow="Topics" title={`${activeMonth} 事業部トピックス`}>
          <ul className="text-sm text-zinc-600 space-y-1.5 list-disc list-inside font-medium">
            {current.topics.map((t, i) => <li key={i}>{t}</li>)}
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
