// ── 27期 人材ソリューション事業部 共有データソース ──────────────
// /budget, /budget/area/[area], /budget/site/[id] の3画面で同じ数字を参照するための単一ソース。

export const MONTHS = [
  '4月実績', '5月実績', '6月進捗',
  '7月進捗', '8月予定', '9月予定', '10月予定', '11月予定', '12月予定',
  '1月予定', '2月予定', '3月予定',
] as const;

export type MonthKey = typeof MONTHS[number];

// 4月〜3月を通期で表示（8-9月は一部予算あり、10月以降はまだ予算未確定のため予算のみ表示）
export const VISIBLE_MONTHS: MonthKey[] = [...MONTHS];

// 27期は2026年4月始まり。ボタンの表示ラベル（◯月実績／◯月進捗／◯月予定）は
// 固定文字列ではなく「今日」との前後関係から動的に算出する（過去=実績／当月=進捗／未来=予定）。
const FISCAL_YEAR_START_CALENDAR_YEAR = 2026;
export function monthCalendar(key: MonthKey): { year: number; month: number } {
  const idx = MONTHS.indexOf(key);
  const month = ((idx + 3) % 12) + 1; // idx0(4月)→4 ... idx8(12月)→12, idx9(1月)→1 ...
  const year = idx <= 8 ? FISCAL_YEAR_START_CALENDAR_YEAR : FISCAL_YEAR_START_CALENDAR_YEAR + 1;
  return { year, month };
}
export function monthLabel(key: MonthKey, now: Date = new Date()): string {
  const { year, month } = monthCalendar(key);
  const nowY = now.getFullYear(), nowM = now.getMonth() + 1;
  const isPast = year < nowY || (year === nowY && month < nowM);
  const isCurrent = year === nowY && month === nowM;
  const suffix = isPast ? '実績' : isCurrent ? '進捗' : '予定';
  return `${month}月${suffix}`;
}
export function monthLabels(keys: readonly MonthKey[], now: Date = new Date()): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, monthLabel(k, now)]));
}

// 最低賃金・時給相場・マージン率は週次で確認・更新する運用。最終更新日をダッシュボード各所に小さく表示する。
export const RATES_UPDATED_AT = '2026-07-13';
export function ratesUpdatedLabel(): string {
  const d = new Date(RATES_UPDATED_AT);
  return `最終更新 ${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（週次更新）`;
}

export const ANNUAL_GOAL = { sales: 620000000, gpRate: 14.51, opRate: 6.87 };

export const ANNUAL_SCHEDULE = [
  { period: 'Q1', range: '4–6月', title: '基盤構築期', desc: '関西の稼働密度維持と関東・中部の工数引き上げ。新規立ち上げ4案件の完遂。' },
  { period: 'Q2', range: '7–9月', title: '利益体質転換期', desc: '受注残35名の完全充足。総稼働235名・平均工数120hの同時達成。' },
  { period: 'Q3', range: '10–12月', title: '価格交渉・拡大期', desc: '全エリアでの価格交渉実行（+30円/h目標）。新規大型案件の受注獲得。' },
  { period: 'Q4', range: '1–3月', title: '通期目標達成期', desc: '年間売上6.2億円、営業利益率6.87%の必達。次期に向けたリーダー育成。' },
];

export const AREAS: { id: string; title: string }[] = [
  { id: 'kanto', title: '関東' },
  { id: 'chubu', title: '中部' },
  { id: 'kansai', title: '関西' },
  { id: 'osaka', title: '大阪支店' },
];

// タスク管理の担当者プルダウン用
export const ASSIGNEES = ['田中', '谷口', '岩田', '山口', '五十嵐', '貴子'] as const;

const AREA_WEIGHT: Record<string, number> = { kanto: 0.140, chubu: 0.1447, kansai: 0.3312, osaka: 0.3841 };

export interface CompanyMonth {
  status: 'actual' | 'inprogress' | 'planned';
  salesBudget: number; salesActual: number | null; yoyLastYear: number | null;
  gpBudget: number | null; gpActual: number | null;
  opBudget: number; opActual: number | null;
  activeStaff: number | null; targetStaff: number;
  joined: number | null; resigned: number | null;
  avgHours: number | null; orderBacklog: number | null;
  backlogStackupPotential?: number | null; // 受注残を全充足した場合の積上可能金額（月次）
  topics: string[]; schedule: string[];
  // 見通し（予算とは別に、進捗を踏まえて更新される着地見込み）。予算を上書きせず並記する。
  salesForecast?: number | null;
  gpForecast?: number | null;
}

// 2Q目標: 受注残の積上げによる単月売上インパクト ¥500万/月
export const BACKLOG_STACKUP_MONTHLY_TARGET = 5000000;

// SO（採用オペレーション）管理KPI。件数は入力値、率は件数から自動計算。
export interface SOMetrics {
  recruitingCost?: number; // 募集費
  applicantUnitCost?: number; // 応募単価
  validResourceUnitCost?: number; // 有効リソース単価
  hireUnitCost?: number; // 入職単価
  totalApplicants?: number; // 総応募者数
  validApplicants?: number; // 有効応募数
  validResources?: number; // 有効リソース数
  candidates?: number; // 候補者数
  hires?: number; // 入職者数
  midMonthResignations?: number; // 月内退職者数
  endMonthResignations?: number; // 月末退職者数
  overtimeExcessCount?: number; // 残業超過人数（基準工数を超えたスタッフ数）
  dailyAbsenceRate?: number; // 当日欠勤率（%、入力値）
}

export interface AreaMonth {
  salesBudget: number; salesActual: number | null; yoyLastYear: number | null;
  gpBudget: number | null; gpActual: number | null;
  activeStaff: number | null; avgHours: number | null;
  joined: number | null; resigned: number | null;
  heat: string | null;
  siteCount?: number | null;
  funnel: { meetings: number; proposals: number; estimates: number; orders: number } | null;
  soMetrics?: SOMetrics;
  // 見通し（予算とは別に、進捗を踏まえて更新される着地見込み）。予算を上書きせず並記する。
  salesForecast?: number | null;
  gpForecast?: number | null;
}

function plannedCompany(budget: number, quarterDesc: string, backlog?: { orderBacklog: number; stackupPotential: number }): CompanyMonth {
  return {
    status: 'planned', salesBudget: budget, salesActual: null, yoyLastYear: null,
    gpBudget: Math.round(budget * (ANNUAL_GOAL.gpRate / 100)), gpActual: null,
    opBudget: Math.round(budget * (ANNUAL_GOAL.opRate / 100)), opActual: null,
    activeStaff: null, targetStaff: 235, joined: null, resigned: null, avgHours: null,
    orderBacklog: backlog?.orderBacklog ?? null,
    backlogStackupPotential: backlog?.stackupPotential ?? null,
    topics: ['月次実績データは未登録です（月末確定後に反映されます）'],
    schedule: [`■ 今四半期方針: ${quarterDesc}`],
  };
}

function plannedArea(budget: number): AreaMonth {
  return {
    salesBudget: budget, salesActual: null, yoyLastYear: null, gpBudget: null, gpActual: null,
    activeStaff: null, avgHours: null, joined: null, resigned: null, heat: null, funnel: null,
  };
}

// 「全体」＝ 関東+中部+関西の合計（大阪支店は現場一覧・実績規模が突出しているため別枠管理で、この合計には含まない）。
// 4-6月の実績値は現場一覧（現場売上×現場稼働数）から算出した実数値に更新済み。
// ※ 関西の予算のみ実測値が無く旧予算からの比例推定のため、営業利益・粗利予算は参考値。
export const COMPANY_MONTHLY: Record<MonthKey, CompanyMonth> = {
  '4月実績': {
    status: 'actual', salesBudget: 46302000, salesActual: 49652000, yoyLastYear: 45200000,
    gpBudget: 6178000, gpActual: 8806000, opBudget: 3900000, opActual: 4170000,
    activeStaff: 200, targetStaff: 235, joined: 12, resigned: 10, avgHours: 119.0, orderBacklog: 18,
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
  },
  '5月実績': {
    status: 'actual', salesBudget: 44534000, salesActual: 43174500, yoyLastYear: 39800000,
    gpBudget: 6266000, gpActual: 4995000, opBudget: 3800000, opActual: 1450000,
    activeStaff: 193, targetStaff: 235, joined: 4, resigned: 19, avgHours: 107.26, orderBacklog: 35,
    topics: [
      '売上実績 4,348万円、利益率3.8%へ低下 (有給費+64万などの一時要因)',
      '退職19名の損失(月次241万減)と受注残35名(月次901万減)の解消が急務',
      '採用状況: 5月入社確定4名 (HRドメイン・Q-mate並走で応募獲得中)',
      '営業進捗: 商談11件 / 新規成約4件 (目標超過！)',
    ],
    schedule: [
      '■ 6月20日: 退職19名の入替採用の媒体掲載完了',
      '■ 6月末: 6月立ち上げ4案件の稼働確認完了',
      '■ 7月末: 稼働235名水準への回復 / 関東・中部工数改善(120h目標)',
    ],
  },
  '6月進捗': {
    status: 'inprogress', salesBudget: 53500000, salesActual: 47213000, yoyLastYear: 44800000,
    gpBudget: 9501000, gpActual: 5108000, opBudget: 4500000, opActual: 2100000,
    activeStaff: 204, targetStaff: 235, joined: 15, resigned: 2, avgHours: 110.43, orderBacklog: 20,
    topics: [
      '6月予算 ¥5,350万 ➔ 見込み ¥4,978万 (GAP ▲372万)',
      '将来スプレッドシートやAPIからここへ直接数字を流し込むソースパターンとして設計済',
    ],
    schedule: [
      '■ 6月末: 受注残35名のうち15名充足',
      '■ 7月末: 稼働235名水準への回復',
    ],
  },
  // 稼働人数・平均工数は7/14時点の実績KPIスナップショット（全体=関東+中部+関西+大阪支店）より。
  // salesForecast/gpForecastは2Q見通しレポート（事業部合計）より、予算とは別枠の着地見込みとして並記。
  '7月進捗': {
    ...plannedCompany(50000000, ANNUAL_SCHEDULE[1].desc, { orderBacklog: 31, stackupPotential: 6625700 }),
    activeStaff: 186, avgHours: 110.42,
    salesForecast: 49074660, gpForecast: 6784281,
  },
  '8月予定': { ...plannedCompany(51000000, ANNUAL_SCHEDULE[1].desc), salesForecast: 41053925 },
  '9月予定': { ...plannedCompany(53000000, ANNUAL_SCHEDULE[1].desc), salesForecast: 42095120 },
  '10月予定': plannedCompany(54000000, ANNUAL_SCHEDULE[2].desc),
  '11月予定': plannedCompany(55000000, ANNUAL_SCHEDULE[2].desc),
  '12月予定': plannedCompany(58000000, ANNUAL_SCHEDULE[2].desc),
  '1月予定': plannedCompany(56000000, ANNUAL_SCHEDULE[3].desc),
  '2月予定': plannedCompany(55000000, ANNUAL_SCHEDULE[3].desc),
  '3月予定': plannedCompany(60000000, ANNUAL_SCHEDULE[3].desc),
};

const PLANNED_BUDGETS: Record<string, number> = {
  '7月進捗': 50000000, '8月予定': 51000000, '9月予定': 53000000, '10月予定': 54000000,
  '11月予定': 55000000, '12月予定': 58000000, '1月予定': 56000000, '2月予定': 55000000, '3月予定': 60000000,
};

export const AREA_MONTHLY: Record<string, Record<MonthKey, AreaMonth>> = {
  // kanto/chubu/kansaiの4-6月実績値は、現場一覧（現場売上×現場稼働数）から算出した実数値に更新。
  // yoyLastYearも2025年度の同じ計算式による実数値。
  kanto: {
    '4月実績': { salesBudget: 7452000, salesActual: 7480000, yoyLastYear: 15494000, gpBudget: 999747, gpActual: 1232567, activeStaff: 36, avgHours: 104.43, joined: 0, resigned: 0, heat: null, siteCount: 6, funnel: { meetings: 2, proposals: 1, estimates: 1, orders: 1 } },
    '5月実績': { salesBudget: 7100000, salesActual: 6878370, yoyLastYear: 13848000, gpBudget: 1174255, gpActual: 1015258, activeStaff: 36, avgHours: 94.42, joined: 0, resigned: 0, heat: null, siteCount: 6, funnel: { meetings: 2, proposals: 1, estimates: 1, orders: 1 } },
    '6月進捗': { salesBudget: 7490000, salesActual: 7500000, yoyLastYear: 13701000, gpBudget: 1232684, gpActual: 1079448, activeStaff: 36, avgHours: 101.71, joined: 3, resigned: 0, heat: null, siteCount: 6, funnel: { meetings: 3, proposals: 2, estimates: 1, orders: 0 } },
    // 7月は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 所属部署: 人ソ（関東））より反映。
    // 稼働人数・総工数は7/14時点の実績KPIスナップショットより。gpBudget/salesForecast/gpForecastは
    // 7/14時点の2Q見通しレポートより（見通しは予算とは別に着地見込みとして並記）。
    '7月進捗': {
      salesBudget: 7632000, salesActual: 7799828, yoyLastYear: null,
      gpBudget: 1244779, gpActual: 1329319,
      activeStaff: 34, avgHours: 108.10, joined: null, resigned: null,
      heat: null, siteCount: 5, funnel: null,
      salesForecast: 7625333, gpForecast: 1361779,
    },
    // 8-9月の予算は月次予算表（現場積み上げ）を自動集計。見通しは2Q見通しレポートより。
    '8月予定': { ...plannedArea(Math.round((PLANNED_BUDGETS['8月予定'] * AREA_WEIGHT.kanto) / 1000) * 1000), salesForecast: 5635000 },
    '9月予定': { ...plannedArea(Math.round((PLANNED_BUDGETS['9月予定'] * AREA_WEIGHT.kanto) / 1000) * 1000), salesForecast: 5780000 },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).filter(([m]) => !['7月進捗', '8月予定', '9月予定'].includes(m)).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.kanto) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
  chubu: {
    // 4月の稼働人数・工数は各現場の実績（派遣人数・総工数）を積み上げた実数値に修正（34名/105.33h、旧33名/108.52hから訂正）。
    '4月実績': { salesBudget: 6770000, salesActual: 7735000, yoyLastYear: 9131000, gpBudget: 1071695, gpActual: 1211200, activeStaff: 34, avgHours: 105.33, joined: 0, resigned: 0, heat: null, siteCount: 8, funnel: { meetings: 2, proposals: 1, estimates: 1, orders: 1 } },
    '5月実績': { salesBudget: 6354000, salesActual: 6972000, yoyLastYear: 8706000, gpBudget: 1071695, gpActual: 1157937, activeStaff: 33, avgHours: 98.43, joined: 2, resigned: 3, heat: null, siteCount: 7, funnel: { meetings: 2, proposals: 2, estimates: 1, orders: 1 } },
    '6月進捗': { salesBudget: 7740000, salesActual: 7116000, yoyLastYear: 8589000, gpBudget: 1220940, gpActual: 1173160, activeStaff: 33, avgHours: 100.22, joined: 3, resigned: 0, heat: '注意 31℃', siteCount: 7, funnel: { meetings: 3, proposals: 2, estimates: 1, orders: 0 } },
    // 7月は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 所属部署: 人ソ（中部））より反映。
    // gpActualは粗利益2（社保・雇保・有給等控除後）の部門合計。稼働人数・総工数は7/14時点の実績KPIスナップショットより。
    '7月進捗': {
      salesBudget: 7620000, salesActual: 7986636, yoyLastYear: null,
      gpBudget: 1303020, gpActual: 1401755,
      activeStaff: 36, avgHours: 97.22, joined: null, resigned: null,
      heat: null, siteCount: 7, funnel: null,
      salesForecast: 7480000, gpForecast: 1279080,
    },
    '8月予定': { ...plannedArea(Math.round((PLANNED_BUDGETS['8月予定'] * AREA_WEIGHT.chubu) / 1000) * 1000), salesForecast: 7600000 },
    '9月予定': { ...plannedArea(Math.round((PLANNED_BUDGETS['9月予定'] * AREA_WEIGHT.chubu) / 1000) * 1000), salesForecast: 7700000 },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).filter(([m]) => !['7月進捗', '8月予定', '9月予定'].includes(m)).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.chubu) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
  // 関西: 売上予算は現場ベース売上と大きく乖離するため要ユーザー確認のまま。
  // 稼働人数・工数は各現場の実績（派遣人数・総工数）を積み上げた実数値に修正
  // （旧: 130/124/135名は現場ベースの再計算前の推定値だったため、52/50/56名に訂正）。
  kansai: {
    '4月実績': { salesBudget: 30856000, salesActual: 34436000, yoyLastYear: 40202000, gpBudget: 4107000, gpActual: 6362000, activeStaff: 52, avgHours: 109.09, joined: 12, resigned: 10, heat: null, siteCount: 25, funnel: { meetings: 4, proposals: 3, estimates: 2, orders: 2 } },
    '5月実績': { salesBudget: 29624000, salesActual: 29324000, yoyLastYear: 37920000, gpBudget: 4020000, gpActual: 2822000, activeStaff: 50, avgHours: 93.76, joined: 2, resigned: 16, heat: null, siteCount: 25, funnel: { meetings: 3, proposals: 2, estimates: 1, orders: 1 } },
    '6月進捗': { salesBudget: 49616000, salesActual: 32475000, yoyLastYear: 38577000, gpBudget: 7047000, gpActual: 2855000, activeStaff: 56, avgHours: 96.02, joined: 6, resigned: 1, heat: '厳重警戒', siteCount: 27, funnel: { meetings: 5, proposals: 3, estimates: 1, orders: 1 } },
    // 7月は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 人ソ関西）の部門合計から
    // 大阪支店（福山通運大阪支店、osakaエリアで別管理）の分を差し引いた関西のみの実数値。
    // 稼働人数・総工数は7/14時点の実績KPIスナップショットより。
    '7月進捗': {
      salesBudget: 17720000, salesActual: 12293534, yoyLastYear: null,
      gpBudget: 2541026, gpActual: 2013358,
      activeStaff: 49, avgHours: 130.20, joined: null, resigned: null,
      heat: null, siteCount: 26, funnel: null,
      salesForecast: 14607700, gpForecast: 2046539,
    },
    // 8-9月の予算は現場積み上げ(現場マスタ登録分)＋関西新規枠(月次6,500,000、未登録の新規現場分)の合計。
    '8月予定': { ...plannedArea(17290000), salesForecast: 10510000 },
    '9月予定': { ...plannedArea(17720000), salesForecast: 10290000 },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).filter(([m]) => !['7月進捗', '8月予定', '9月予定'].includes(m)).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.kansai) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
  osaka: {
    // 稼働人数・工数は現場実績（福山通運大阪支店）の積み上げ実数値に修正（旧122/123/124名は推定値だったため、78/74/79名に訂正）。
    '4月実績': { salesBudget: 21060000, salesActual: 23423983, yoyLastYear: 21300000, gpBudget: 3086758, gpActual: 3552490, activeStaff: 78, avgHours: 137.71, joined: 0, resigned: 0, heat: null, funnel: { meetings: 5, proposals: 4, estimates: 2, orders: 1 } },
    '5月実績': { salesBudget: 20500000, salesActual: 20329795, yoyLastYear: 18700000, gpBudget: 2557300, gpActual: 2478432, activeStaff: 74, avgHours: 126.56, joined: 0, resigned: 0, heat: null, funnel: { meetings: 4, proposals: 3, estimates: 2, orders: 1 } },
    '6月進捗': { salesBudget: 20550000, salesActual: 20220000, yoyLastYear: 18400000, gpBudget: 2543060, gpActual: 2459806, activeStaff: 79, avgHours: 128.87, joined: 3, resigned: 1, heat: '厳重警戒', funnel: { meetings: 5, proposals: 4, estimates: 2, orders: 1 } },
    // 7月は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 人ソ関西内の福山通運大阪支店行）より反映。
    // 稼働人数・総工数は7/14時点の実績KPIスナップショットより。
    '7月進捗': {
      salesBudget: 21570000, salesActual: 17669531, yoyLastYear: null,
      gpBudget: 2838044, gpActual: 2883072,
      activeStaff: 67, avgHours: 103.64, joined: null, resigned: null,
      heat: null, siteCount: 1, funnel: null,
      salesForecast: 19361627, gpForecast: 2096883,
    },
    '8月予定': { ...plannedArea(Math.round((PLANNED_BUDGETS['8月予定'] * AREA_WEIGHT.osaka) / 1000) * 1000), salesForecast: 17308925 },
    '9月予定': { ...plannedArea(Math.round((PLANNED_BUDGETS['9月予定'] * AREA_WEIGHT.osaka) / 1000) * 1000), salesForecast: 18325120 },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).filter(([m]) => !['7月進捗', '8月予定', '9月予定'].includes(m)).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.osaka) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
};

// ── 現場カルテ ──────────────────────────────────────────────
// 財務系フィールドは任意。実在するが損益書未反映の現場は active/lifecycle のみ設定し、
// 財務情報は「データ未登録」としてUI側でプレースホルダー表示する。
export interface SiteFinancial { actual: number; budget: number; yoy: number; mom: number }
export type NegotiationStatus = '未着手' | '交渉中' | '合意済' | '見送り';
export type ActionType = '価格交渉' | 'コンタクト' | '横展開' | '課題';
export interface ActionLogEntry { date: string; type: ActionType; text: string }

// ── 現場ごとのPL勘定科目（固定フォーマット）─────────────
// section: revenue(売上) / cogs(売上原価) / sga(販管費) / nonOpInc(営業外収益) /
//          nonOpExp(営業外費用) / extraordinary(特別損益) / tax(法人税等)
export type PLSection = 'revenue' | 'cogs' | 'sga' | 'nonOpInc' | 'nonOpExp' | 'extraordinary' | 'tax';
export interface PLAccountDef { label: string; section: PLSection; isSubtotal?: boolean }

export const PL_ACCOUNTS: PLAccountDef[] = [
  { label: '売上高', section: 'revenue', isSubtotal: true },
  { label: '純売上高', section: 'revenue' },
  { label: '仕入高', section: 'cogs' },
  { label: '給与手当（原）', section: 'cogs' },
  { label: '労務費', section: 'cogs' },
  { label: '有給', section: 'cogs' },
  { label: '法定福利費（原）', section: 'cogs' },
  { label: '旅費交通費（原）', section: 'cogs' },
  { label: '車両費（原）', section: 'cogs' },
  { label: '旅費高速代（原）', section: 'cogs' },
  { label: '地代家賃（原）', section: 'cogs' },
  { label: '外注費（原）', section: 'cogs' },
  { label: 'リース料（原）', section: 'cogs' },
  { label: '減価償却費（原）', section: 'cogs' },
  { label: '売上原価', section: 'cogs', isSubtotal: true },
  { label: '売上総利益', section: 'cogs', isSubtotal: true },
  { label: '給料手当', section: 'sga' },
  { label: '雑給', section: 'sga' },
  { label: '賞与', section: 'sga' },
  { label: '法定福利費', section: 'sga' },
  { label: '福利厚生費', section: 'sga' },
  { label: '労働災害費', section: 'sga' },
  { label: '人材募集費', section: 'sga' },
  { label: '社員採用費引当', section: 'sga' },
  { label: '外注費', section: 'sga' },
  { label: '荷造運賃', section: 'sga' },
  { label: '商品誤配費', section: 'sga' },
  { label: '広告宣伝費', section: 'sga' },
  { label: '交際費', section: 'sga' },
  { label: '会議費', section: 'sga' },
  { label: '研修費', section: 'sga' },
  { label: '旅費交通費', section: 'sga' },
  { label: '通信費', section: 'sga' },
  { label: '消耗品費', section: 'sga' },
  { label: '商品破損費', section: 'sga' },
  { label: '修繕費', section: 'sga' },
  { label: '福利厚生費引当', section: 'sga' },
  { label: '修繕引当金', section: 'sga' },
  { label: '水道光熱費', section: 'sga' },
  { label: '新聞図書費', section: 'sga' },
  { label: '諸会費', section: 'sga' },
  { label: '支払手数料', section: 'sga' },
  { label: '車両費', section: 'sga' },
  { label: '地代家賃', section: 'sga' },
  { label: '賃借料', section: 'sga' },
  { label: 'リース料', section: 'sga' },
  { label: '保険料', section: 'sga' },
  { label: '租税公課', section: 'sga' },
  { label: '支払報酬料', section: 'sga' },
  { label: '寄付金', section: 'sga' },
  { label: '減価償却費', section: 'sga' },
  { label: '研究開発費', section: 'sga' },
  { label: '雑費', section: 'sga' },
  { label: '販売費及び一般管理費計', section: 'sga', isSubtotal: true },
  { label: '営業利益', section: 'sga', isSubtotal: true },
  { label: '受取利息', section: 'nonOpInc' },
  { label: '受取配当金', section: 'nonOpInc' },
  { label: '有価証券売却益', section: 'nonOpInc' },
  { label: '固定資産売却益', section: 'nonOpInc' },
  { label: '雑収入', section: 'nonOpInc' },
  { label: '営業外収益', section: 'nonOpInc', isSubtotal: true },
  { label: '支払利息', section: 'nonOpExp' },
  { label: '支払手数料', section: 'nonOpExp' },
  { label: '雑損失', section: 'nonOpExp' },
  { label: '長期前払費用償却', section: 'nonOpExp' },
  { label: '社債発行費償却', section: 'nonOpExp' },
  { label: '有価証券評価損', section: 'nonOpExp' },
  { label: '固定資産売却損', section: 'nonOpExp' },
  { label: '固定資産圧縮損', section: 'nonOpExp' },
  { label: '営業外費用', section: 'nonOpExp', isSubtotal: true },
  { label: '経常利益', section: 'nonOpExp', isSubtotal: true },
  { label: '特別利益', section: 'extraordinary', isSubtotal: true },
  { label: '特別損失', section: 'extraordinary', isSubtotal: true },
  { label: '税引前当期純利益', section: 'extraordinary', isSubtotal: true },
  { label: '法人税、住民税及び事業税', section: 'tax' },
  { label: '法人税等調整額', section: 'tax' },
  { label: '法人税等', section: 'tax', isSubtotal: true },
  { label: '当期純利益', section: 'tax', isSubtotal: true },
];

// 事業所内の役割単位（リフト/軽作業/日勤/夜勤など）。損益は事業所（現場)単位で
// 一本化されるが、採用状況・コンタクト履歴はこの役割単位でも細分化管理する。
export interface SiteRole {
  code: string; label: string; isNew?: boolean;
  salesRep?: string | null; soRep?: string | null;
  recruiting?: { active: boolean; costSpent?: number; costBudget?: number; postingPeriod?: string } | null;
  actionLog?: ActionLogEntry[];
}

export interface SiteData {
  id: string; name: string; areaId: string; prefecture: string | null;
  active: boolean; lifecycle?: string;
  roles?: SiteRole[]; // 事業所内の役割別内訳（案件番号つき）
  sales?: Partial<SiteFinancial>; cost?: Partial<SiteFinancial>; paidLeave?: Partial<SiteFinancial>; opProfit?: Partial<SiteFinancial>;
  monthlyBudget?: Partial<Record<MonthKey, number>>; // 現場ごとの月次売上予算（4-9月予算表より。10月以降は未確定）
  staffCountByMonth?: Partial<Record<MonthKey, number>>; // 現場ごとの月次派遣人数（実績、4-6月）
  totalHoursByMonth?: Partial<Record<MonthKey, number>>; // 現場ごとの月次総工数（実績、4-6月）
  plDetail?: Record<string, Partial<SiteFinancial>>; // PL_ACCOUNTSのlabelをキーとした明細（実データ提供後に充実予定）
  staffCount?: number; totalHours?: number; avgHours?: number;
  liftUnitPrice?: number | null; workerUnitPrice?: number; minimumWage?: number;
  marketHourlyWage?: number; // 同職種・同エリアの時給相場（参考値）
  backlogCount?: number; // 受注残（未充足人数）
  expectedImpact?: number; // 充足/交渉成立時に期待できるインパクト額（円）
  negotiationStatus?: NegotiationStatus;
  actionLog?: ActionLogEntry[]; // 価格交渉・コンタクト・横展開・課題の統合アクションログ（事業所全体）
  // 手入力運用項目（チーム共有の保存基盤が必要 — 現状は静的プレースホルダー）
  salesRep?: string | null; soRep?: string | null;
  recruiting?: { active: boolean; costSpent?: number; costBudget?: number; postingPeriod?: string } | null;
}

function placeholderSite(id: string, name: string, areaId: string, opts?: { active?: boolean; lifecycle?: string; roles?: SiteRole[] }): SiteData {
  return { id, name, areaId, prefecture: null, active: opts?.active ?? true, lifecycle: opts?.lifecycle, roles: opts?.roles };
}

function role(code: string, label: string, isNew?: boolean): SiteRole {
  return { code, label, isNew };
}

// 4-9月の月次予算表（現場名で突合）から、現場ごとの月次売上予算シリーズを組み立てる。10月以降は未確定のため含めない。
function budgetSeries(apr: number | null, may: number | null, jun: number | null, jul: number | null, aug: number | null, sep: number | null): Partial<Record<MonthKey, number>> {
  const keys: MonthKey[] = ['4月実績', '5月実績', '6月進捗', '7月進捗', '8月予定', '9月予定'];
  const vals = [apr, may, jun, jul, aug, sep];
  const out: Partial<Record<MonthKey, number>> = {};
  keys.forEach((k, i) => { if (vals[i] != null) out[k] = vals[i]!; });
  return out;
}

// 現場ごとの月次派遣人数・総工数の実績（4-6月）を組み立てる。
function monthSeries3(apr: number | null, may: number | null, jun: number | null): Partial<Record<MonthKey, number>> {
  const keys: MonthKey[] = ['4月実績', '5月実績', '6月進捗'];
  const vals = [apr, may, jun];
  const out: Partial<Record<MonthKey, number>> = {};
  keys.forEach((k, i) => { if (vals[i] != null) out[k] = vals[i]!; });
  return out;
}

export const POSTING_PERIOD_OPTIONS = ['1週間', '2週間', '1ヶ月', '2ヶ月', '3ヶ月以上'] as const;

export const SITES: Record<string, SiteData> = {
  // ── 関東 ──────────────────────────────────────────────
  // 7月実績は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 人ソ関東）より反映。
  // budgetは月次予算表（現場名で突合）の7月列。
  '811-1': {
    active: true,
    id: '811-1', name: '福山通運 八千代支店 メニコン', areaId: 'kanto', prefecture: '千葉県',
    sales: { actual: 4167141, budget: 3952000 },
    cost: { actual: 3049701 },
    paidLeave: { actual: 87770 },
    opProfit: { actual: 619170 },
    monthlyBudget: budgetSeries(3952000, 3800000, 3800000, 3952000, 3800000, 3648000),
    staffCountByMonth: monthSeries3(26, 26, 26),
    totalHoursByMonth: monthSeries3(2138.75, 2030.50, 2083.75),
  },
  '116-1': {
    active: true,
    id: '116-1', name: 'PCS 関東（重工田町ビル）', areaId: 'kanto', prefecture: '東京都',
    sales: { actual: 732888, budget: 580000 },
    cost: { actual: 446880 },
    paidLeave: { actual: 10640 },
    opProfit: { actual: 151926 },
    monthlyBudget: budgetSeries(520000, 510000, 570000, 580000, 450000, 540000),
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(306.00, 271.50, 320.00),
  },
  '115-1': {
    active: false,
    id: '115-1', name: 'PCS 関東（重工相模原）', areaId: 'kanto', prefecture: '神奈川県', lifecycle: '2026年7月より非稼働',
    sales: { actual: 0, budget: 350000 },
    cost: { actual: 0 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(290000, 270000, 350000, 350000, 250000, 300000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(136.00, 112.00, 16.00),
  },
  '657-1': {
    active: true,
    id: '657-1', name: 'PCS 関東（重工丸の内）', areaId: 'kanto', prefecture: '東京都',
    sales: { actual: 682010, budget: 560000 },
    cost: { actual: 446220 },
    paidLeave: { actual: 10720 },
    opProfit: { actual: 141371 },
    monthlyBudget: budgetSeries(550000, 490000, 560000, 560000, 410000, 540000),
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(304.00, 256.00, 320.00),
  },
  '715-1': {
    active: true,
    id: '715-1', name: 'PCS 関東（豊洲）', areaId: 'kanto', prefecture: '東京都',
    sales: { actual: 1478196, budget: 1190000 },
    cost: { actual: 1033164 },
    paidLeave: { actual: 30400 },
    opProfit: { actual: 262319 },
    monthlyBudget: budgetSeries(1240000, 1130000, 1210000, 1190000, 1230000, 1390000),
    staffCountByMonth: monthSeries3(3, 3, 3),
    totalHoursByMonth: monthSeries3(474.75, 396.58, 506.83),
  },
  '648-1': {
    active: true,
    id: '648-1', name: 'ネオヴィア・ロジ 相模原部品センター', areaId: 'kanto', prefecture: '神奈川県',
    sales: { actual: 739593, budget: 1000000 },
    cost: { actual: 532827 },
    paidLeave: { actual: 10800 },
    monthlyBudget: budgetSeries(900000, 900000, 1000000, 1000000, 720000, 880000),
    opProfit: { actual: 154533 },
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(399.90, 332.42, 414.93),
  },
  '835-1': placeholderSite('835-1', '有限会社黒岩運輸', 'kanto', { lifecycle: '新規現場' }),

  // ── 中部 ──────────────────────────────────────────────
  // 7月実績は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月）のスクリーンショットより反映。
  // budgetは別途共有された月次予算表（現場名で突合、シート上のコードは不一致のため無視）の7月列。
  '142-3': {
    active: true,
    id: '142-3', name: '福山通運 名古屋南流通センター', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 359360, budget: 350000 },
    cost: { actual: 260810 },
    paidLeave: { actual: 10160 },
    opProfit: { actual: 42249 },
    monthlyBudget: budgetSeries(350000, 300000, 300000, 350000, 300000, 330000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(177.50, 146.75, 165.50),
  },
  '548-1': {
    active: true,
    id: '548-1', name: '福山通運 東海支店（セリア）', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 2276321, budget: 2200000 },
    cost: { actual: 1570455 },
    paidLeave: { actual: 94965 },
    opProfit: { actual: 376231 },
    monthlyBudget: budgetSeries(2450000, 2200000, 2200000, 2200000, 2200000, 2200000),
    staffCountByMonth: monthSeries3(17, 15, 15),
    totalHoursByMonth: monthSeries3(1212.75, 1226.75, 1137.50),
  },
  '505-1': {
    active: true,
    id: '505-1', name: '岐阜アグリフーズ 本社・工場（食鳥部鶏肉加工課）', areaId: 'chubu', prefecture: '岐阜県',
    sales: { actual: 413575, budget: 420000 },
    cost: { actual: 286275 },
    paidLeave: { actual: 9760 },
    opProfit: { actual: 82960 },
    monthlyBudget: budgetSeries(400000, 404000, 450000, 420000, 414000, 456000),
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(226.85, 221.75, 219.30),
  },
  '675-1': placeholderSite('675-1', 'AFS中部センター', 'chubu'),
  '510-2': {
    active: true,
    id: '510-2', name: 'afs 中部XD（派遣）', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 343766, budget: 300000 },
    cost: { actual: 236249 },
    paidLeave: { actual: 20800 },
    opProfit: { actual: 47768 },
    monthlyBudget: budgetSeries(300000, 300000, 300000, 300000, 300000, 300000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(193.58, 170.02, 187.05),
  },
  '790-1': {
    active: true,
    id: '790-1', name: '昭和冷蔵 小牧センター', areaId: 'chubu', prefecture: '愛知県',
    roles: [role('790-1', 'リフト'), role('790-2', '倉庫内仕分け作業')],
    sales: { actual: 3009658, budget: 2600000 },
    cost: { actual: 2193820 },
    paidLeave: { actual: 39200 },
    opProfit: { actual: 566064 },
    monthlyBudget: budgetSeries(2500000, 2500000, 2600000, 2600000, 2600000, 2600000),
    staffCountByMonth: monthSeries3(10, 11, 11),
    totalHoursByMonth: monthSeries3(1136.08, 969.08, 1188.00),
  },
  '833-1': placeholderSite('833-1', '摂津倉庫株式会社 春日井営業所', 'chubu', {
    lifecycle: '新規現場',
    roles: [role('833-1', 'リフト', true), role('833-2', '作業員', true), role('833-3', '事務員', true)],
  }),
  '834-1': {
    active: true,
    id: '834-1', name: '昭和冷蔵 犬山ドライセンター', areaId: 'chubu', prefecture: '愛知県', lifecycle: '新規現場',
    sales: { actual: 983952, budget: 1200000 },
    cost: { actual: 716400 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 224652 },
    monthlyBudget: budgetSeries(null, null, 1200000, 1200000, 1200000, 1200000),
    staffCountByMonth: monthSeries3(1, 1, 2),
    totalHoursByMonth: monthSeries3(233.50, 235.00, 196.00),
  },
  '038-1': {
    active: false,
    id: '038-1', name: '株式会社Rian Japan 中部物流センター', areaId: 'chubu', prefecture: '愛知県', lifecycle: '2026年5月末で契約終了',
    sales: { actual: 0, budget: 250000 },
    cost: { actual: 0 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(370000, 350000, 340000, 250000, 230000, 270000),
    staffCountByMonth: monthSeries3(1, 1, 0),
    totalHoursByMonth: monthSeries3(198.25, 59.00, 0),
  },
  '301-1': {
    active: true,
    id: '301-1', name: '昭和冷蔵 名古屋センター', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 600004, budget: 300000 },
    cost: { actual: 442803 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 61831 },
    monthlyBudget: budgetSeries(400000, 300000, 350000, 300000, 300000, 300000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(202.75, 219.75, 214.00),
  },

  // ── 関西 ──────────────────────────────────────────────
  // 7月実績は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 人ソ関西）より反映。
  // budgetは月次予算表（現場名で突合）の7月列。
  '543-3': {
    active: true,
    id: '543-3', name: 'フェリシモ エスパス（選別作業）', areaId: 'kansai', prefecture: '兵庫県',
    sales: { actual: 2751260, budget: 3000000 },
    cost: { actual: 1854110 },
    paidLeave: { actual: 74400 },
    opProfit: { actual: 542279 },
    monthlyBudget: budgetSeries(3000000, 2800000, 3000000, 3000000, 2800000, 3000000),
    staffCountByMonth: monthSeries3(22, 20, 19),
    totalHoursByMonth: monthSeries3(1610.00, 1222.50, 1429.50),
  },
  '543-4': {
    active: true,
    id: '543-4', name: 'フェリシモ エスパス（検品・箱入作業業務）', areaId: 'kansai', prefecture: '兵庫県',
    sales: { actual: 0, budget: 190000 },
    cost: { actual: 0 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(190000, 190000, 190000, 190000, 190000, 190000),
    staffCountByMonth: monthSeries3(1, 0, 1),
    totalHoursByMonth: monthSeries3(126.00, 0, 120.00),
  },
  '543-5': {
    active: true,
    id: '543-5', name: 'フェリシモ エスパス（伝票管理業務）', areaId: 'kansai', prefecture: '兵庫県',
    staffCountByMonth: monthSeries3(0, 1, 0),
    totalHoursByMonth: monthSeries3(0, 94.50, 0),
  },
  '595-1': {
    active: false,
    id: '595-1', name: '岡山県貨物運送 南港支店［リフト］', areaId: 'kansai', prefecture: null, lifecycle: '2026年6月末で契約終了',
    sales: { actual: 0, budget: 380000 },
    cost: { actual: 0 }, paidLeave: { actual: 0 }, opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(380000, 380000, 380000, 380000, 380000, 380000),
    staffCountByMonth: monthSeries3(1, 1, 0),
    totalHoursByMonth: monthSeries3(188.00, 56.25, 0),
  },
  '136-1': {
    active: true,
    id: '136-1', name: '日生トーム 高槻事業所（軽作業）', areaId: 'kansai', prefecture: '大阪府',
    sales: { actual: 533260, budget: 380000 },
    cost: { actual: 357460 },
    paidLeave: { actual: 16470 },
    opProfit: { actual: 105277 },
    monthlyBudget: budgetSeries(380000, 250000, 380000, 380000, 380000, 380000),
    staffCountByMonth: monthSeries3(3, 3, 3),
    totalHoursByMonth: monthSeries3(157.50, 169.00, 186.00),
  },
  '533-1': {
    active: true,
    id: '533-1', name: '任天堂販売 京都物流センター', areaId: 'kansai', prefecture: '京都府',
    roles: [role('533-1', 'リフト'), role('533-2', '軽作業')],
    sales: { actual: 867375, budget: 320000 },
    cost: { actual: 602325 },
    paidLeave: { actual: 15120 },
    opProfit: { actual: 179725 },
    monthlyBudget: budgetSeries(320000, 320000, 320000, 320000, 320000, 320000),
    staffCountByMonth: monthSeries3(3, 2, 3),
    totalHoursByMonth: monthSeries3(249.75, 188.00, 347.75),
  },
  '570-1': {
    active: true,
    id: '570-1', name: '加茂商事［軽作業］（株式会社マラカナ・加茂商事）', areaId: 'kansai', prefecture: null,
    sales: { actual: 638042, budget: 600000 },
    cost: { actual: 443334 },
    paidLeave: { actual: 21600 },
    opProfit: { actual: 78065 },
    monthlyBudget: budgetSeries(600000, 600000, 600000, 600000, 420000, 600000),
    staffCountByMonth: monthSeries3(2, 2, 0),
    totalHoursByMonth: monthSeries3(374.00, 307.42, 0),
  },
  // budgetは「PCS関西（神戸富士ゼロックス）」、実績システムでは「PCS関西（BPOソリューション事業本部）」表記。同一現場として突合。
  '530-1': {
    active: true,
    id: '530-1', name: 'PCS 関西（神戸）［配達作業員］', areaId: 'kansai', prefecture: null,
    sales: { actual: 211680, budget: 250000 },
    cost: { actual: 122880 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 48271 },
    monthlyBudget: budgetSeries(250000, 250000, 250000, 250000, 250000, 250000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(144.00, 128.00, 176.00),
  },
  '723-1': placeholderSite('723-1', '阪菱企業 茨木', 'kansai', { roles: [role('723-1', 'リフト'), role('723-2', '軽作業')] }),
  '815-1': {
    active: true,
    id: '815-1', name: '阪菱企業 西神現業所［軽作業］', areaId: 'kansai', prefecture: null,
    sales: { actual: 0, budget: 200000 },
    cost: { actual: 0 }, paidLeave: { actual: 0 }, opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(200000, 200000, 200000, 200000, 200000, 200000),
    staffCountByMonth: monthSeries3(1, 0, 0),
    totalHoursByMonth: monthSeries3(120.50, 0, 0),
  },
  '753-1': {
    active: false,
    id: '753-1', name: 'ハウス物流サービス株式会社 伊丹［リフト］', areaId: 'kansai', prefecture: null, lifecycle: '2026年6月末で契約終了',
    sales: { actual: 0, budget: 350000 },
    cost: { actual: 0 }, paidLeave: { actual: 0 }, opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(350000, 300000, 350000, 350000, 300000, 350000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(220.00, 146.75, 184.25),
  },
  '801-1': {
    active: true,
    id: '801-1', name: 'コーナン商事 貝塚センター［リフト］', areaId: 'kansai', prefecture: null, lifecycle: '当月稼働ゼロ（社保等固定費のみ発生）',
    sales: { actual: 0, budget: 350000 },
    cost: { actual: 0 },
    paidLeave: { actual: 0 },
    opProfit: { actual: -42070 },
    monthlyBudget: budgetSeries(350000, 380000, 350000, 350000, 350000, 350000),
    staffCountByMonth: monthSeries3(0, 0, 0),
    totalHoursByMonth: monthSeries3(0, 0, 0),
  },
  '633-1': {
    active: true,
    id: '633-1', name: '尾家産業 阪南支店（派遣）（ドライバー）', areaId: 'kansai', prefecture: null,
    sales: { actual: 339000, budget: 300000 },
    cost: { actual: 250862 },
    paidLeave: { actual: 35520 },
    opProfit: { actual: 12694 },
    monthlyBudget: budgetSeries(300000, 300000, 300000, 300000, 300000, 300000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(194.25, 166.75, 178.25),
  },
  '782-1': placeholderSite('782-1', 'SHUUEI物流 高槻センター［リフト］', 'kansai'),
  '606-3': placeholderSite('606-3', 'SHUUEI物流 枚方センター［リフト］短期', 'kansai'),
  '808-1': {
    active: true,
    id: '808-1', name: '西鉄運輸株式会社 枚方センター', areaId: 'kansai', prefecture: null,
    roles: [role('808-1', '軽作業'), role('808-2', '軽作業（短期）')],
    sales: { actual: 1534098, budget: 600000 },
    cost: { actual: 1100100 },
    paidLeave: { actual: 35440 },
    opProfit: { actual: 290134 },
    monthlyBudget: budgetSeries(600000, 550000, 600000, 600000, 600000, 600000),
    staffCountByMonth: monthSeries3(2, 3, 5),
    totalHoursByMonth: monthSeries3(337.42, 403.50, 565.50),
  },
  '805-1': {
    active: true,
    id: '805-1', name: 'YSOロジ［リフト］（YSO Logi株式会社 神戸営業所）', areaId: 'kansai', prefecture: '兵庫県',
    sales: { actual: 426800, budget: 400000 },
    cost: { actual: 310400 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 55842 },
    monthlyBudget: budgetSeries(400000, 380000, 400000, 400000, 400000, 400000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(211.50, 193.50, 184.50),
  },
  '720-1': {
    active: true,
    id: '720-1', name: 'HMKロジサービス 西神戸センター［軽作業］', areaId: 'kansai', prefecture: null,
    staffCountByMonth: monthSeries3(0, 0, 7),
    totalHoursByMonth: monthSeries3(0, 0, 214.00),
  },
  '828-1': {
    active: true,
    id: '828-1', name: '摂津倉庫 京田辺', areaId: 'kansai', prefecture: '京都府',
    roles: [role('828-1', '軽作業'), role('828-2', 'リフト')],
    sales: { actual: 693197, budget: 580000 },
    cost: { actual: 497557 },
    monthlyBudget: budgetSeries(580000, 560000, 580000, 580000, 580000, 580000),
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(316.75, 267.75, 356.25),
  },
  '830-1': {
    active: true,
    id: '830-1', name: 'エヌエス物流 関西［軽作業］', areaId: 'kansai', prefecture: null,
    sales: { actual: 309295, budget: 270000 },
    cost: { actual: 216506 },
    monthlyBudget: budgetSeries(270000, 270000, 270000, 270000, 270000, 270000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(187.18, 182.12, 148.60),
  },
  '831-1': {
    active: true,
    id: '831-1', name: 'エヌエス物流 滋賀［軽作業］', areaId: 'kansai', prefecture: '滋賀県',
    sales: { actual: 231675, budget: 850000 },
    cost: { actual: 162835 },
    monthlyBudget: budgetSeries(850000, 850000, 850000, 850000, 850000, 850000),
    staffCountByMonth: monthSeries3(3, 3, 2),
    totalHoursByMonth: monthSeries3(343.28, 262.87, 171.05),
  },
  '832-1': {
    active: true,
    id: '832-1', name: '西鉄運輸 加古川支店', areaId: 'kansai', prefecture: '兵庫県',
    roles: [
      role('832-1', '軽作業'), role('832-2', '事務'), role('832-3', 'リフト'),
      role('832-4a', 'ドライバー', true), role('832-4b', '短期作業員', true),
    ],
    sales: { actual: 713188, budget: 750000 },
    cost: { actual: 516665 },
    monthlyBudget: budgetSeries(750000, 750000, 750000, 750000, 750000, 750000),
    staffCountByMonth: monthSeries3(2, 3, 1),
    totalHoursByMonth: monthSeries3(207.42, 334.88, 120.92),
  },
  '836-1': {
    active: true,
    id: '836-1', name: 'HMKロジサービス 南港（レッドウッド南港）', areaId: 'kansai', prefecture: null,
    lifecycle: '新規現場', roles: [role('836-1', '軽作業', true), role('836-2', 'リフト', true)],
    staffCountByMonth: monthSeries3(null, null, 2),
    totalHoursByMonth: monthSeries3(null, null, 203.00),
  },
  '836-3': {
    active: true,
    id: '836-3', name: 'HMKロジサービス 南港（GLP大阪）', areaId: 'kansai', prefecture: null,
    lifecycle: '新規現場', roles: [role('836-3', 'リフト', true), role('836-4', '軽作業（短期）', true)],
    staffCountByMonth: monthSeries3(null, null, 1),
    totalHoursByMonth: monthSeries3(null, null, 70.00),
  },
  '837-1': placeholderSite('837-1', 'SHUUEI物流株式会社 尼崎センター（ロジポート尼崎）［軽作業］', 'kansai', { lifecycle: '新規現場' }),
  // 阪菱企業の配送センター/倉庫は損益書が個別に分かれているため、茨木(723-1)とは別現場として管理。
  '246-1': {
    active: true,
    id: '246-1', name: '阪菱企業 第二 5号配送センター', areaId: 'kansai', prefecture: null,
    sales: { actual: 274120, budget: 600000 },
    cost: { actual: 197120 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 49235 },
    monthlyBudget: budgetSeries(400000, 400000, 600000, 600000, 600000, 600000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(122.50, 82.00, 145.00),
  },
  '285-1': {
    active: true,
    id: '285-1', name: '阪菱企業 第一 1号配送センター', areaId: 'kansai', prefecture: null,
    sales: { actual: 246419, budget: 200000 },
    cost: { actual: 177200 },
    paidLeave: { actual: 17920 },
    opProfit: { actual: 24939 },
    monthlyBudget: budgetSeries(200000, 200000, 200000, 200000, 200000, 200000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(129.00, 126.00, 125.50),
  },
  '287-1': {
    active: true,
    id: '287-1', name: '阪菱企業 第一 2号配送センター', areaId: 'kansai', prefecture: null,
    sales: { actual: 249200, budget: 200000 },
    cost: { actual: 179200 },
    paidLeave: { actual: 17920 },
    opProfit: { actual: 25663 },
    monthlyBudget: budgetSeries(200000, 200000, 200000, 200000, 200000, 200000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(141.75, 115.25, 147.00),
  },
  '288-1': {
    active: true,
    id: '288-1', name: '阪菱企業 第一 11号倉庫', areaId: 'kansai', prefecture: null,
    sales: { actual: 262550, budget: 200000 },
    cost: { actual: 188800 },
    paidLeave: { actual: 8960 },
    opProfit: { actual: 28845 },
    monthlyBudget: budgetSeries(200000, 200000, 200000, 200000, 200000, 200000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(142.00, 113.25, 137.75),
  },
  '229-1': {
    active: true,
    id: '229-1', name: '阪菱企業 第三（12号倉庫）', areaId: 'kansai', prefecture: null,
    sales: { actual: 330750, budget: 250000 },
    cost: { actual: 239400 },
    paidLeave: { actual: 11400 },
    opProfit: { actual: 40827 },
    monthlyBudget: budgetSeries(250000, 250000, 250000, 250000, 250000, 250000),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(150.00, 127.50, 166.25),
  },

  // ── 大阪支店 ──────────────────────────────────────────
  '133-1': {
    active: true,
    id: '133-1', name: '福山通運 大阪支店', areaId: 'osaka', prefecture: '大阪府',
    roles: [role('133-1', '日勤'), role('133-2', '夜勤')],
    // 7月実績は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 人ソ関西内の大阪支店行）より反映。
    sales: { actual: 17669531, budget: 21570000 },
    cost: { actual: 12288918 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 2883072 },
    monthlyBudget: budgetSeries(21060000, 20040000, 20550000, 21570000, 19530000, 20550000),
    staffCountByMonth: monthSeries3(78, 74, 79),
    totalHoursByMonth: monthSeries3(10741.43, 9365.45, 10180.95),
    staffCount: 67, totalHours: 6944, avgHours: 103.64,
    liftUnitPrice: 1550, workerUnitPrice: 1320, minimumWage: 1177, marketHourlyWage: 1280,
    backlogCount: 4, expectedImpact: 2100000, negotiationStatus: '交渉中',
    salesRep: null, soRep: null, recruiting: { active: true, costSpent: 320000, costBudget: 400000, postingPeriod: '3ヶ月以上' },
    actionLog: [
      { date: '2025-07', type: '価格交渉', text: '夜勤帯単価改定 +35円/h 合意' },
      { date: '2026-01', type: '価格交渉', text: '次期契約（4月更新）に向けた価格交渉開始' },
      { date: '2026-05', type: 'コンタクト', text: '本部担当者と次期契約条件を協議' },
    ],
  },
};

export function sitesOfArea(areaId: string): SiteData[] {
  return Object.values(SITES).filter((s) => s.areaId === areaId);
}

// 現在、現場の実績スクリーンショットが反映されている対象月（自社システム反映分は7月進捗）。
export const CURRENT_ACTUAL_MONTH: MonthKey = '7月進捗';

// 現場ごとの実績(sales.actual/opProfit.actual)・月次予算を積み上げて、エリアの当月実績・予算を
// 「自動集計」する。現場を更新すればここを直す必要なく合計に反映される。
// 関西のみ、現場マスタに未登録の現場（関西新規枠・新規HMK3件など）が実データに含まれるため対象外とし、
// 引き続き自社システムの部門合計（大阪支店分を差し引いた実数値）を正としている。
export const AUTO_AGGREGATE_AREAS = ['kanto', 'chubu', 'osaka'] as const;
export function sumSitesActual(areaId: string): { salesActual: number; salesBudget: number; opProfitActual: number; siteCount: number } {
  const sites = sitesOfArea(areaId);
  let salesActual = 0, salesBudget = 0, opProfitActual = 0, siteCount = 0;
  for (const s of sites) {
    if (s.sales?.actual != null) { salesActual += s.sales.actual; siteCount++; }
    if (s.monthlyBudget?.[CURRENT_ACTUAL_MONTH] != null) salesBudget += s.monthlyBudget[CURRENT_ACTUAL_MONTH]!;
    if (s.opProfit?.actual != null) opProfitActual += s.opProfit.actual;
  }
  return { salesActual, salesBudget, opProfitActual, siteCount };
}

// 現場ごとの月次予算表（4-9月）を持つ月。この範囲は現場積み上げで予算を自動集計できる。
export const BUDGET_AGGREGATE_MONTHS: MonthKey[] = ['7月進捗', '8月予定', '9月予定'];
export function sumSiteBudgetForMonth(areaId: string, m: MonthKey): number {
  return sitesOfArea(areaId).reduce((sum, s) => sum + (s.monthlyBudget?.[m] ?? 0), 0);
}

// SOが現場カルテ（またはSiteOverridesシート）に入力した配置人数を積み上げる。
// 7月時点では現場・エリアいずれにも実配置人数の確定値が無いため、部分入力でも「集計中」として
// そのまま表示する（未入力=0件のときのみnullを返し、既存の「データ未登録」表示にフォールバックする）。
export function effectiveStaffCount(site: SiteData, overrides: Record<string, any>): number | null {
  const ov = overrides?.[site.id];
  const raw = ov?.staffCount != null && ov.staffCount !== '' ? ov.staffCount : site.staffCount;
  const n = raw != null ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}
export function sumAreaStaff(areaId: string, overrides: Record<string, any>): { sum: number; filled: number; total: number } {
  const sites = sitesOfArea(areaId);
  let sum = 0, filled = 0;
  for (const s of sites) {
    const v = effectiveStaffCount(s, overrides);
    if (v != null) { sum += v; filled++; }
  }
  return { sum, filled, total: sites.length };
}

// lifecycle文言（例:「2026年6月末で契約終了」「2026年7月より非稼働」）から年月を読み取り、
// 表示中の月に契約終了・非稼働化する現場をトピックスに出すための判定。
const LIFECYCLE_CHANGE_RE = /(\d{4})年(\d{1,2})月.*?(契約終了|非稼働)/;
export function sitesChangingInMonth(m: MonthKey, areaId?: string): SiteData[] {
  const { year, month } = monthCalendar(m);
  return Object.values(SITES).filter((s) => {
    if (areaId && s.areaId !== areaId) return false;
    if (!s.lifecycle) return false;
    const match = s.lifecycle.match(LIFECYCLE_CHANGE_RE);
    if (!match) return false;
    return Number(match[1]) === year && Number(match[2]) === month;
  });
}

export const yen = (n: number | null | undefined) => (n == null ? '—' : `¥${n.toLocaleString()}`);
export const statusOf = (rate: number): 'ok' | 'watch' | 'alert' => (rate >= 100 ? 'ok' : rate >= 95 ? 'watch' : 'alert');

// 既存の簡易サマリー項目（sales/cost/paidLeave/opProfit）を、詳細PL未登録の現場でも
// 該当する勘定科目行にフォールバック表示するためのマッピング。
const SUMMARY_FALLBACK: Record<string, keyof Pick<SiteData, 'sales' | 'cost' | 'paidLeave' | 'opProfit'>> = {
  '売上高': 'sales',
  '売上原価': 'cost',
  '有給': 'paidLeave',
  '営業利益': 'opProfit',
};

// 勘定科目名は「支払手数料」のように複数セクションで重複するため、
// plDetailのキーは `${section}::${label}` の複合キーで一意化する。
export function plKey(acc: PLAccountDef): string {
  return `${acc.section}::${acc.label}`;
}

export function getPLRow(site: SiteData, acc: PLAccountDef): Partial<SiteFinancial> | null {
  const detailed = site.plDetail?.[plKey(acc)];
  if (detailed) return detailed;
  const fallbackKey = SUMMARY_FALLBACK[acc.label];
  if (fallbackKey && site[fallbackKey]) return site[fallbackKey] as SiteFinancial;
  return null;
}

export function hasAnyPLData(site: SiteData): boolean {
  return site.plDetail != null || site.sales != null || site.cost != null || site.opProfit != null;
}
