'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Oswald, Inter, JetBrains_Mono } from 'next/font/google';

// ── 書体構成 ──────────────────────────────────────────────
// Oswald: 見出し/ラベル用コンデンス書体（無機質すぎない業務感）
// Inter: 本文/UI用
// JetBrains Mono: 数値専用（計器盤のような読み取り速度を狙う）
const display = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono' });

// ── パレット（Tailwindのデフォルトblue/slate/roseは使わない） ──
const COLOR = {
  bg: '#1B2027',
  panel: '#1F2530',
  panelBorder: '#2E3542',
  stat: '#232935',
  statBorder: '#313847',
  text: '#EDEFF2',
  textSub: '#9AA2B1',
  textMuted: '#7C8493',
  ok: '#5FAE7C',
  watch: '#E3A23C',
  alert: '#D65A4A',
  info: '#4E8098',
  topic: '#6E9BD1',
};

interface AreaData {
  id: string;
  title: string;
  salesBudget: number;
  salesActual: number | null;
  gpBudget: number | null;
  gpActual: number | null;
  yoyLastYear: number | null;
  recruitment: { joined: number; resigned: number; cost?: number } | null;
  heat?: string | null;
}

interface FunnelData { meetings: number; proposals: number; estimates: number; orders: number }
interface AlertItem { level: 'critical' | 'warning'; text: string }

interface MonthlyData {
  status: 'actual' | 'inprogress' | 'planned';
  topics: string[];
  schedule: string[];
  monthSales: { actual: number | null; budget: number; yoyLastYear: number | null };
  infra: { sites: number; staff: number };
  kpiSummary: { activeStaff: number | null; targetStaff: number; joined: number | null; resigned: number | null; avgHours: number | null; orderBacklog: number | null };
  funnel: FunnelData | null;
  alerts: AlertItem[];
  budgetVsActual: { opProfit: { budget: number; actual: number | null } };
  areas: AreaData[];
}

const ANNUAL_GOAL = { sales: 620000000, gpRate: 14.51, opRate: 6.87 };

const ANNUAL_SCHEDULE = [
  { period: 'Q1', range: '4–6月', title: '基盤構築期', desc: '関西の稼働密度維持と関東・中部の工数引き上げ。新規立ち上げ4案件の完遂。' },
  { period: 'Q2', range: '7–9月', title: '利益体質転換期', desc: '受注残35名の完全充足。総稼働225名・平均工数120hの同時達成。' },
  { period: 'Q3', range: '10–12月', title: '価格交渉・拡大期', desc: '全エリアでの価格交渉実行（+30円/h目標）。新規大型案件の受注獲得。' },
  { period: 'Q4', range: '1–3月', title: '通期目標達成期', desc: '年間売上6.2億円、営業利益率6.87%の必達。次期に向けたリーダー育成。' },
];

// エリア予算配分比率（6月実績構成比ベース。計画月の按分に使用）
const AREA_WEIGHT: Record<string, number> = { kanto: 0.140, chubu: 0.1447, kansai: 0.3312, osaka: 0.3841 };

function splitAreas(totalBudget: number): AreaData[] {
  const ids: { id: string; title: string }[] = [
    { id: 'kanto', title: '関東' },
    { id: 'chubu', title: '中部' },
    { id: 'kansai', title: '関西' },
    { id: 'osaka', title: '大阪' },
  ];
  const parts = ids.map((a) => ({
    id: a.id,
    title: a.title,
    salesBudget: Math.round((totalBudget * AREA_WEIGHT[a.id]) / 1000) * 1000,
    salesActual: null,
    gpBudget: null,
    gpActual: null,
    yoyLastYear: null,
    recruitment: null,
    heat: null,
  }));
  return [
    { id: 'all', title: '全体', salesBudget: totalBudget, salesActual: null, gpBudget: null, gpActual: null, yoyLastYear: null, recruitment: null, heat: null },
    ...parts,
  ];
}

function plannedMonth(quarterDesc: string, totalBudget: number): MonthlyData {
  return {
    status: 'planned',
    topics: ['月次実績データは未登録です（月末確定後に反映されます）'],
    schedule: [`■ 今四半期方針: ${quarterDesc}`],
    monthSales: { actual: null, budget: totalBudget, yoyLastYear: null },
    infra: { sites: 39, staff: 225 },
    kpiSummary: { activeStaff: null, targetStaff: 225, joined: null, resigned: null, avgHours: null, orderBacklog: null },
    funnel: null,
    alerts: [],
    budgetVsActual: { opProfit: { budget: Math.round(totalBudget * 0.0687), actual: null } },
    areas: splitAreas(totalBudget),
  };
}

const MONTHLY_DATA: Record<string, MonthlyData> = {
  '4月実績': {
    status: 'actual',
    topics: [
      '売上実績 4,988万円 (予算比+8.8%) の好スタート！',
      '営業利益 417万円 (利益率8.4%) を記録。関西が大きく牽引',
      '採用状況: 応募70件、入職12名、退職10名で純増(+2名)',
      '採用単価: ¥16,083 (募集費管理より)',
    ],
    schedule: [
      '■ 5月: 新規案件の仕込み (黒岩運輸、SHUUEI物流など)',
      '■ 6月: 新規4案件の稼働開始 / 受注残18名の完全充足',
      '■ 下期: ドライバー派遣乗り換えによる+80万積上 / 価格交渉',
    ],
    monthSales: { actual: 49883158, budget: 46302000, yoyLastYear: 45200000 },
    infra: { sites: 39, staff: 200 },
    kpiSummary: { activeStaff: 200, targetStaff: 225, joined: 12, resigned: 10, avgHours: 110.0, orderBacklog: 18 },
    funnel: { meetings: 13, proposals: 9, estimates: 6, orders: 5 },
    alerts: [],
    budgetVsActual: { opProfit: { budget: 3900000, actual: 4170000 } },
    areas: [
      { id: 'all', title: '全体', salesBudget: 46302000, salesActual: 49883158, gpBudget: 6623846, gpActual: 8057108, yoyLastYear: 45200000, recruitment: { joined: 12, resigned: 10, cost: 16083 } },
      { id: 'kanto', title: '関東', salesBudget: 7452000, salesActual: 7580256, gpBudget: 999747, gpActual: 1232567, yoyLastYear: 6900000, recruitment: { joined: 0, resigned: 0 } },
      { id: 'chubu', title: '中部', salesBudget: 6770000, salesActual: 7719682, gpBudget: 1071695, gpActual: 1211200, yoyLastYear: 6700000, recruitment: { joined: 0, resigned: 0 } },
      { id: 'kansai', title: '関西', salesBudget: 11020000, salesActual: 11158937, gpBudget: 1466646, gpActual: 2060851, yoyLastYear: 10300000, recruitment: { joined: 12, resigned: 10 } },
      { id: 'osaka', title: '大阪', salesBudget: 21060000, salesActual: 23423983, gpBudget: 3086758, gpActual: 3552490, yoyLastYear: 21300000, recruitment: { joined: 0, resigned: 0 } },
    ],
  },
  '5月実績': {
    status: 'actual',
    topics: [
      '売上実績 4,348万円、利益率3.8%へ低下 (有給費+64万などの一時要因)',
      '退職19名の損失(月次241万減)と受注残35名(月次901万減)の解消が急務',
      '採用状況: 5月入社確定4名 (HRドメイン・Q-mate並走で応募獲得中)',
      '営業進捗: 商談11件 / 新規成約4件 (目標超過！)',
    ],
    schedule: [
      '■ 6月20日: 退職19名の入替採用の媒体掲載完了',
      '■ 6月末: 6月立ち上げ4案件の稼働確認完了',
      '■ 7月末: 稼働225名水準への回復 / 関東・中部工数改善(120h目標)',
    ],
    monthSales: { actual: 43478011, budget: 44534000, yoyLastYear: 39800000 },
    infra: { sites: 38, staff: 193 },
    kpiSummary: { activeStaff: 193, targetStaff: 225, joined: 4, resigned: 19, avgHours: 101.2, orderBacklog: 35 },
    funnel: { meetings: 11, proposals: 8, estimates: 5, orders: 4 },
    alerts: [
      { level: 'critical', text: '営業利益の進捗が90％未満です' },
      { level: 'critical', text: '退職者が19名と非常に高い水準です' },
      { level: 'warning', text: '受注残が35名残っています' },
    ],
    budgetVsActual: { opProfit: { budget: 3800000, actual: 1450000 } },
    areas: [
      { id: 'all', title: '全体', salesBudget: 44534000, salesActual: 43478011, gpBudget: 6239310, gpActual: 5548158, yoyLastYear: 39800000, recruitment: { joined: 4, resigned: 19, cost: 22092 } },
      { id: 'kanto', title: '関東', salesBudget: 7100000, salesActual: 6878370, gpBudget: 1174255, gpActual: 1015258, yoyLastYear: 6300000, recruitment: { joined: 0, resigned: 0 } },
      { id: 'chubu', title: '中部', salesBudget: 6354000, salesActual: 6947740, gpBudget: 1071695, gpActual: 1157937, yoyLastYear: 6100000, recruitment: { joined: 2, resigned: 3 } },
      { id: 'kansai', title: '関西', salesBudget: 10580000, salesActual: 9322106, gpBudget: 1436060, gpActual: 896531, yoyLastYear: 8700000, recruitment: { joined: 2, resigned: 16 } },
      { id: 'osaka', title: '大阪', salesBudget: 20500000, salesActual: 20329795, gpBudget: 2557300, gpActual: 2478432, yoyLastYear: 18700000, recruitment: { joined: 0, resigned: 0 } },
    ],
  },
  '6月進捗': {
    status: 'inprogress',
    topics: [
      '6月予算 ¥5,350万 ➔ 見込み ¥4,978万 (GAP ▲372万)',
      '将来スプレッドシートやAPIからここへ直接数字を流し込むソースパターンとして設計済',
    ],
    schedule: [
      '■ 6月末: 受注残35名のうち15名充足',
      '■ 7月末: 稼働225名水準への回復',
    ],
    monthSales: { actual: 49780000, budget: 53500000, yoyLastYear: 44800000 },
    infra: { sites: 38, staff: 193 },
    kpiSummary: { activeStaff: 193, targetStaff: 225, joined: 15, resigned: 2, avgHours: 104.5, orderBacklog: 20 },
    funnel: { meetings: 16, proposals: 10, estimates: 4, orders: 2 },
    alerts: [
      { level: 'critical', text: '売上見込みが予算に対し▲372万のギャップが生じています' },
      { level: 'warning', text: '受注残が20名に達しています' },
      { level: 'warning', text: '関西・大阪エリアに熱中症警戒アラートが発令されています' },
    ],
    budgetVsActual: { opProfit: { budget: 4500000, actual: 2100000 } },
    areas: [
      { id: 'all', title: '全体', salesBudget: 53500000, salesActual: 49780000, gpBudget: 7513610, gpActual: 5986296, yoyLastYear: 44800000, recruitment: { joined: 15, resigned: 2 } },
      { id: 'kanto', title: '関東', salesBudget: 7490000, salesActual: 7500000, gpBudget: 1232684, gpActual: 1079448, yoyLastYear: 6800000, recruitment: { joined: 3, resigned: 0 }, heat: null },
      { id: 'chubu', title: '中部', salesBudget: 7740000, salesActual: 7560000, gpBudget: 1220940, gpActual: 1173160, yoyLastYear: 6400000, recruitment: { joined: 3, resigned: 0 }, heat: '注意 31℃' },
      { id: 'kansai', title: '関西', salesBudget: 17720000, salesActual: 14500000, gpBudget: 2516926, gpActual: 1273882, yoyLastYear: 13200000, recruitment: { joined: 6, resigned: 1 }, heat: '厳重警戒' },
      { id: 'osaka', title: '大阪', salesBudget: 20550000, salesActual: 20220000, gpBudget: 2543060, gpActual: 2459806, yoyLastYear: 18400000, recruitment: { joined: 3, resigned: 1 }, heat: '厳重警戒' },
    ],
  },
  '7月予定': plannedMonth(ANNUAL_SCHEDULE[1].desc, 50000000),
  '8月予定': plannedMonth(ANNUAL_SCHEDULE[1].desc, 51000000),
  '9月予定': plannedMonth(ANNUAL_SCHEDULE[1].desc, 53000000),
  '10月予定': plannedMonth(ANNUAL_SCHEDULE[2].desc, 54000000),
  '11月予定': plannedMonth(ANNUAL_SCHEDULE[2].desc, 55000000),
  '12月予定': plannedMonth(ANNUAL_SCHEDULE[2].desc, 58000000),
  '1月予定': plannedMonth(ANNUAL_SCHEDULE[3].desc, 56000000),
  '2月予定': plannedMonth(ANNUAL_SCHEDULE[3].desc, 55000000),
  '3月予定': plannedMonth(ANNUAL_SCHEDULE[3].desc, 60000000),
};

const MONTHS = Object.keys(MONTHLY_DATA);

const yen = (n: number | null | undefined) => (n == null ? '—' : `¥${n.toLocaleString()}`);
const statusOf = (rate: number): 'ok' | 'watch' | 'alert' => (rate >= 100 ? 'ok' : rate >= 95 ? 'watch' : 'alert');
const STATUS_COLOR: Record<string, string> = { ok: COLOR.ok, watch: COLOR.watch, alert: COLOR.alert };

export default function CompleteDashboard() {
  const [activeMonth, setActiveMonth] = useState('6月進捗');
  const current = MONTHLY_DATA[activeMonth];
  const monthIndex = MONTHS.indexOf(activeMonth);
  const activeQuarter = Math.floor(monthIndex / 3);
  const dockAreas = current.areas.filter((a) => a.id !== 'all');

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen pb-16`}
      style={{ background: COLOR.bg, color: COLOR.text, fontFamily: 'var(--font-body)' }}
    >
      {/* ── ヘッダー ─────────────────────────────────── */}
      <header
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 md:px-10 py-5 border-b"
        style={{ borderColor: COLOR.panelBorder, background: '#1F2530' }}
      >
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase" style={{ color: COLOR.textMuted, fontFamily: 'var(--font-mono)' }}>
            Staffing Management Brain
          </p>
          <h1 className="mt-1 text-xl md:text-[26px] leading-tight" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.01em' }}>
            27期 人材ソリューション事業部 経営ダッシュボード
          </h1>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: COLOR.textMuted, fontFamily: 'var(--font-mono)' }}>Powered by</span>
          <div className="px-3 py-1.5 rounded" style={{ background: COLOR.text }}>
            <img src="/logo.png" alt="PAL Logo" className="h-6 object-contain" />
          </div>
        </div>
      </header>

      <main className="px-4 md:px-10 mt-6 space-y-6">

        {/* ── ドック状態灯 ─────────────────────────── */}
        <div className="rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ background: COLOR.panel, border: `1px solid ${COLOR.panelBorder}` }}>
          <span className="text-[10px] uppercase tracking-[0.2em] shrink-0" style={{ color: COLOR.textMuted, fontFamily: 'var(--font-mono)' }}>Dock Status</span>
          {dockAreas.map((area) => {
            const rate = area.salesActual != null && area.salesBudget > 0 ? (area.salesActual / area.salesBudget) * 100 : null;
            const st = rate == null ? 'watch' : statusOf(rate);
            return (
              <div key={area.id} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: STATUS_COLOR[st], boxShadow: `0 0 6px ${STATUS_COLOR[st]}66` }} />
                <span className="text-xs" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{area.title}</span>
                <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: COLOR.textSub }}>{rate == null ? '計画中' : `${rate.toFixed(1)}%`}</span>
              </div>
            );
          })}
        </div>

        {/* ── タイムライン ─────────────────────────── */}
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-[10px] uppercase tracking-[0.2em] shrink-0" style={{ color: COLOR.textMuted, fontFamily: 'var(--font-mono)' }}>Timeline</span>
          <div className="flex gap-2">
            {MONTHS.map((m) => {
              const active = activeMonth === m;
              return (
                <button
                  key={m}
                  onClick={() => setActiveMonth(m)}
                  className="px-4 py-1.5 rounded text-xs transition-colors shrink-0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background: active ? COLOR.watch : COLOR.stat,
                    color: active ? '#1B2027' : COLOR.textSub,
                    fontWeight: active ? 700 : 400,
                    border: active ? 'none' : `1px solid ${COLOR.statBorder}`,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── トピックス & スケジュール ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Panel title={`${activeMonth} 事業部トピックス`} accent={COLOR.topic} tag="TOPICS">
              <ul className="text-sm space-y-2 list-disc list-inside" style={{ color: COLOR.textSub }}>
                {current.topics.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </Panel>
          </div>
          <Panel title="重要スケジュール / コミット" accent={COLOR.watch} tag="SCHEDULE">
            <ul className="text-sm space-y-2" style={{ color: COLOR.textSub }}>
              {current.schedule.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Panel>
        </div>

        {/* ── 通期目標 / 当月実績 / 運営インフラ ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-lg p-5" style={{ background: COLOR.watch, color: '#1B2027' }}>
            <p className="text-xs font-bold opacity-80">27期 通期売上総目標</p>
            <p className="mt-3 text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>¥{ANNUAL_GOAL.sales.toLocaleString()}</p>
            <div className="flex justify-between mt-4 text-xs font-bold">
              <span>目標粗利②: {ANNUAL_GOAL.gpRate}%</span>
              <span>営業利益率: {ANNUAL_GOAL.opRate}%</span>
            </div>
          </div>

          <Panel title={`当月売上実績（前年比） (${activeMonth})`} accent={COLOR.info}>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: current.monthSales.actual == null ? COLOR.textMuted : COLOR.text }}>
              {current.monthSales.actual == null ? `${yen(current.monthSales.budget)}（予算）` : yen(current.monthSales.actual)}
            </p>
            <p className="text-xs mt-2" style={{ color: COLOR.textMuted }}>
              {current.monthSales.yoyLastYear == null
                ? '前年同月実績データ未登録'
                : <>前年同月実績: {yen(current.monthSales.yoyLastYear)} <span style={{ color: (current.monthSales.actual! - current.monthSales.yoyLastYear) >= 0 ? COLOR.ok : COLOR.alert, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    ({(current.monthSales.actual! - current.monthSales.yoyLastYear) >= 0 ? '+' : ''}{(((current.monthSales.actual! - current.monthSales.yoyLastYear) / current.monthSales.yoyLastYear) * 100).toFixed(1)}%)
                  </span></>
              }
            </p>
          </Panel>

          <Panel title="運営リソースインフラ" accent={COLOR.ok}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="管理現場数" value={current.infra.sites} unit="拠点" />
              <Stat label="総稼働人数" value={current.infra.staff} unit="名" />
            </div>
          </Panel>
        </div>

        {/* ── 予実管理 & KPI集計 ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="全社 予実管理" accent={COLOR.watch}>
            <div className="space-y-5">
              {[
                { name: '売上高', budget: current.areas[0].salesBudget, actual: current.areas[0].salesActual },
                { name: '売上総利益', budget: current.areas[0].gpBudget, actual: current.areas[0].gpActual },
                { name: '営業利益', budget: current.budgetVsActual.opProfit.budget, actual: current.budgetVsActual.opProfit.actual },
              ].map((item, idx) => {
                const hasActual = item.actual != null && item.budget != null;
                const rate = hasActual ? (item.actual! / item.budget!) * 100 : null;
                const gap = hasActual ? item.actual! - item.budget! : null;
                const barColor = rate == null ? COLOR.statBorder : rate >= 100 ? COLOR.ok : rate >= 90 ? COLOR.info : COLOR.alert;
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-xs" style={{ color: COLOR.textSub }}>{item.name}</span>
                      <div className="text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                        <span className="text-sm font-bold">{hasActual ? yen(item.actual) : '計画中'}</span>
                        <span className="text-[10px] ml-2" style={{ color: COLOR.textMuted }}>予算 {yen(item.budget)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#2A3140' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(rate ?? 0, 100)}%`, background: barColor }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: gap == null ? COLOR.textMuted : gap >= 0 ? COLOR.ok : COLOR.alert }}>
                        {gap == null ? '実績未確定' : `${gap > 0 ? '+' : ''}¥${gap.toLocaleString()}`}
                      </span>
                      <span style={{ color: COLOR.textMuted }}>{rate == null ? '—' : `${rate.toFixed(1)}%`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="主要KPI集計（稼働・採用・工数）" accent={COLOR.info}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="現在稼働人数" value={current.kpiSummary.activeStaff} unit="名" sub={`目標 ${current.kpiSummary.targetStaff}名`} />
              <Stat
                label="受注残（未充足）"
                value={current.kpiSummary.orderBacklog}
                unit="名"
                sub={current.kpiSummary.orderBacklog != null && current.kpiSummary.orderBacklog >= 20 ? '早急な採用補填が必要' : current.kpiSummary.orderBacklog == null ? '実績未確定' : '正常範囲'}
                danger={current.kpiSummary.orderBacklog != null && current.kpiSummary.orderBacklog >= 20}
              />
              <div className="p-3 rounded" style={{ background: COLOR.stat, border: `1px solid ${COLOR.statBorder}` }}>
                <p className="text-[10px]" style={{ color: COLOR.textMuted }}>当月 採用 / 退職</p>
                <div className="flex items-center gap-3 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                  <span className="text-lg font-bold" style={{ color: current.kpiSummary.joined == null ? COLOR.textMuted : COLOR.ok }}>入職 {current.kpiSummary.joined ?? '—'}名</span>
                  <span style={{ color: '#3A4150' }}>/</span>
                  <span className="text-lg font-bold" style={{ color: current.kpiSummary.resigned == null ? COLOR.textMuted : COLOR.alert }}>退職 {current.kpiSummary.resigned ?? '—'}名</span>
                </div>
              </div>
              <Stat label="1人あたり平均工数" value={current.kpiSummary.avgHours} unit="h" sub="基準値 120h" />
            </div>
          </Panel>
        </div>

        {/* ── 年間スケジュール ─────────────────────── */}
        <Panel title="第27期 年間スケジュール・コミットメント" accent={COLOR.watch}>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-px hidden sm:block" style={{ background: COLOR.statBorder }} />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {ANNUAL_SCHEDULE.map((q, idx) => (
                <div key={idx} className="relative">
                  <div
                    className="hidden sm:flex w-2.5 h-2.5 rounded-full absolute -top-[26px] left-0"
                    style={{ background: idx === activeQuarter ? COLOR.watch : COLOR.statBorder }}
                  />
                  <p className="text-[10px] tracking-[0.2em]" style={{ fontFamily: 'var(--font-mono)', color: COLOR.textMuted }}>{q.period} · {q.range}</p>
                  <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: idx === activeQuarter ? COLOR.watch : COLOR.text }}>{q.title}</p>
                  <p className="text-[11px] mt-2 leading-relaxed" style={{ color: COLOR.textSub }}>{q.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* ── 営業パイプライン & アラート ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="当月 営業パイプライン進捗" accent={COLOR.info}>
            {current.funnel == null ? (
              <div className="h-40 rounded flex items-center justify-center" style={{ border: `1px dashed ${COLOR.statBorder}` }}>
                <p className="text-xs" style={{ color: COLOR.textMuted }}>パイプラインデータ未登録（月初集計待ち）</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: '1. 新規商談', val: current.funnel.meetings, target: 15 },
                  { label: '2. 提案', val: current.funnel.proposals, target: 10 },
                  { label: '3. 見積', val: current.funnel.estimates, target: 5 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs" style={{ color: COLOR.textSub }}>{item.label}</span>
                      <span className="text-sm" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {item.val} <span className="text-[10px] font-normal" style={{ color: COLOR.textMuted }}>/ {item.target}件</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#2A3140' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min((item.val / item.target) * 100, 100)}%`, background: COLOR.info }} />
                    </div>
                  </div>
                ))}
                <div className="mt-2 p-3 rounded flex justify-between items-center" style={{ background: 'rgba(227,162,60,0.1)', border: '1px solid rgba(227,162,60,0.35)' }}>
                  <span className="text-xs" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: COLOR.watch }}>4. 新規成約（受注）</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    <span className="text-xl font-bold" style={{ color: COLOR.watch }}>{current.funnel.orders}</span>
                    <span className="text-xs ml-1" style={{ color: '#B8894A' }}>/ 2件</span>
                  </span>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="経営リスク・アラート検知" accent={COLOR.alert}>
            {current.alerts.length === 0 ? (
              <div className="h-40 rounded flex items-center justify-center" style={{ border: `1px dashed ${COLOR.statBorder}` }}>
                <p className="text-xs" style={{ color: COLOR.ok }}>重大なアラートはありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {current.alerts.map((alert, i) => {
                  const c = alert.level === 'critical' ? COLOR.alert : COLOR.watch;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded" style={{ background: COLOR.stat, borderLeft: `3px solid ${c}` }}>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: c, border: `1px solid ${c}55` }}
                      >
                        {alert.level === 'critical' ? 'CRIT' : 'WATCH'}
                      </span>
                      <p className="text-xs leading-relaxed" style={{ color: '#D7DAE0' }}>{alert.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* ── エリア別詳細 ─────────────────────────── */}
        <p className="text-[10px] uppercase tracking-[0.2em] pt-2" style={{ color: COLOR.textMuted, fontFamily: 'var(--font-mono)' }}>
          管轄エリア別 詳細分析
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {current.areas.map((area) => <AreaCard key={area.id} area={area} />)}
        </div>
      </main>
    </div>
  );
}

// ── 共通パーツ ───────────────────────────────────────────
function Panel({ title, accent, tag, children }: { title: string; accent: string; tag?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-5 h-full" style={{ background: COLOR.panel, border: `1px solid ${COLOR.panelBorder}` }}>
      <h2 className="text-sm mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        <span className="w-1.5 h-4 rounded-full inline-block" style={{ background: accent }} />
        {tag && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-bold"
            style={{ fontFamily: 'var(--font-mono)', color: accent, border: `1px solid ${accent}55` }}
          >
            {tag}
          </span>
        )}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Stat({ label, value, unit, sub, danger }: { label: string; value: number | null; unit: string; sub?: string; danger?: boolean }) {
  return (
    <div
      className="p-3 rounded"
      style={{ background: danger ? 'rgba(214,90,74,0.1)' : COLOR.stat, border: `1px solid ${danger ? 'rgba(214,90,74,0.35)' : COLOR.statBorder}` }}
    >
      <p className="text-[10px]" style={{ color: danger ? COLOR.alert : COLOR.textMuted }}>{label}</p>
      <p className="text-xl mt-1" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: value == null ? COLOR.textMuted : danger ? COLOR.alert : COLOR.text }}>
        {value ?? '—'} <span className="text-xs font-normal">{unit}</span>
      </p>
      {sub && <p className="text-[9px] mt-1" style={{ color: danger ? '#B8756A' : COLOR.textMuted }}>{sub}</p>}
    </div>
  );
}

function AreaCard({ area }: { area: AreaData }) {
  const planned = area.salesActual == null;
  const rate = planned ? null : (area.salesActual! / area.salesBudget) * 100;
  const st = rate == null ? 'watch' : statusOf(rate);
  const salesGap = planned ? null : area.salesActual! - area.salesBudget;
  const yoyPct = area.yoyLastYear == null || planned ? null : ((area.salesActual! - area.yoyLastYear) / area.yoyLastYear) * 100;

  return (
    <div
      className="rounded-lg p-4 flex flex-col"
      style={{ background: COLOR.panel, border: `1px solid ${COLOR.panelBorder}`, borderTop: `3px solid ${STATUS_COLOR[st]}` }}
    >
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px' }}>{area.title}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-bold"
          style={{ fontFamily: 'var(--font-mono)', color: STATUS_COLOR[st], border: `1px solid ${STATUS_COLOR[st]}55` }}
        >
          {rate == null ? '計画' : `達成 ${rate.toFixed(1)}%`}
        </span>
      </div>

      <div className="space-y-2.5">
        <div>
          <p className="text-[10px]" style={{ color: COLOR.textMuted }}>売上予実（Budget / Actual）</p>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-xs line-through" style={{ color: COLOR.textMuted, fontFamily: 'var(--font-mono)' }}>{yen(area.salesBudget)}</span>
            <span className="text-base font-bold" style={{ fontFamily: 'var(--font-mono)', color: planned ? COLOR.textMuted : COLOR.text }}>
              {planned ? '計画中' : yen(area.salesActual)}
            </span>
          </div>
          {!planned && (
            <div className="flex justify-between mt-0.5 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: COLOR.textMuted }}>GAP</span>
              <span style={{ color: salesGap! >= 0 ? COLOR.ok : COLOR.alert }}>{salesGap! > 0 ? '+' : ''}{salesGap!.toLocaleString()}</span>
            </div>
          )}
        </div>

        {!planned && (
          <div className="flex justify-between items-center text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: COLOR.textMuted }}>前年対比</span>
            <span style={{ color: yoyPct == null ? COLOR.textMuted : yoyPct >= 0 ? COLOR.ok : COLOR.alert }}>
              {area.yoyLastYear == null ? '—' : `${yen(area.yoyLastYear)} (${yoyPct! >= 0 ? '+' : ''}${yoyPct!.toFixed(1)}%)`}
            </span>
          </div>
        )}

        {area.gpActual != null && (
          <div className="flex justify-between items-center text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: COLOR.textMuted }}>粗利②実績</span>
            <span style={{ color: COLOR.text, fontWeight: 700 }}>{yen(area.gpActual)}</span>
          </div>
        )}
      </div>

      <div className="h-px w-full my-3" style={{ background: COLOR.statBorder }} />

      {area.recruitment ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: COLOR.ok }}>入職 {area.recruitment.joined}名</span>
              <span style={{ color: COLOR.textMuted }}>/</span>
              <span style={{ color: COLOR.alert }}>退職 {area.recruitment.resigned}名</span>
            </div>
            {area.recruitment.cost && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ fontFamily: 'var(--font-mono)', color: COLOR.watch, border: `1px solid ${COLOR.watch}55` }}>
                単価 ¥{area.recruitment.cost.toLocaleString()}
              </span>
            )}
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#2A3140' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(rate ?? 0, 100)}%`, background: STATUS_COLOR[st] }} />
          </div>
          <p className="text-[9px]" style={{ color: COLOR.textMuted }}>稼働密度（120h / 150万基準）</p>
        </div>
      ) : (
        <p className="text-[10px]" style={{ color: COLOR.textMuted }}>採用・稼働密度データ未登録</p>
      )}

      {area.heat && (
        <div
          className="mt-3 inline-block self-start text-[10px] px-2 py-1 rounded"
          style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLOR.watch, background: 'rgba(227,162,60,0.12)', border: '1px solid rgba(227,162,60,0.3)' }}
        >
          {area.heat}
        </div>
      )}

      {area.id !== 'all' && (
        <Link href={`/budget/area/${area.id}`} className="mt-3 text-[10px] font-bold text-right hover:brightness-125 transition" style={{ color: COLOR.info }}>
          エリア詳細を見る ➔
        </Link>
      )}
    </div>
  );
}
