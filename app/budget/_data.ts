// ── 27期 人材ソリューション事業部 共有データソース ──────────────
// /budget, /budget/area/[area], /budget/site/[id] の3画面で同じ数字を参照するための単一ソース。

export const MONTHS = [
  '4月実績', '5月実績', '6月進捗',
  '7月予定', '8月予定', '9月予定', '10月予定', '11月予定', '12月予定',
  '1月予定', '2月予定', '3月予定',
] as const;

export type MonthKey = typeof MONTHS[number];

export const ANNUAL_GOAL = { sales: 620000000, gpRate: 14.51, opRate: 6.87 };

export const ANNUAL_SCHEDULE = [
  { period: 'Q1', range: '4–6月', title: '基盤構築期', desc: '関西の稼働密度維持と関東・中部の工数引き上げ。新規立ち上げ4案件の完遂。' },
  { period: 'Q2', range: '7–9月', title: '利益体質転換期', desc: '受注残35名の完全充足。総稼働225名・平均工数120hの同時達成。' },
  { period: 'Q3', range: '10–12月', title: '価格交渉・拡大期', desc: '全エリアでの価格交渉実行（+30円/h目標）。新規大型案件の受注獲得。' },
  { period: 'Q4', range: '1–3月', title: '通期目標達成期', desc: '年間売上6.2億円、営業利益率6.87%の必達。次期に向けたリーダー育成。' },
];

export const AREAS: { id: string; title: string }[] = [
  { id: 'kanto', title: '関東' },
  { id: 'chubu', title: '中部' },
  { id: 'kansai', title: '関西' },
  { id: 'osaka', title: '大阪支店' },
];

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
}

// 2Q目標: 受注残の積上げによる単月売上インパクト ¥500万/月
export const BACKLOG_STACKUP_MONTHLY_TARGET = 5000000;

export interface AreaMonth {
  salesBudget: number; salesActual: number | null; yoyLastYear: number | null;
  gpBudget: number | null; gpActual: number | null;
  activeStaff: number | null; avgHours: number | null;
  joined: number | null; resigned: number | null;
  heat: string | null;
  siteCount?: number | null;
  funnel: { meetings: number; proposals: number; estimates: number; orders: number } | null;
}

function plannedCompany(budget: number, quarterDesc: string, backlog?: { orderBacklog: number; stackupPotential: number }): CompanyMonth {
  return {
    status: 'planned', salesBudget: budget, salesActual: null, yoyLastYear: null,
    gpBudget: Math.round(budget * (ANNUAL_GOAL.gpRate / 100)), gpActual: null,
    opBudget: Math.round(budget * (ANNUAL_GOAL.opRate / 100)), opActual: null,
    activeStaff: null, targetStaff: 225, joined: null, resigned: null, avgHours: null,
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
    activeStaff: 200, targetStaff: 225, joined: 12, resigned: 10, avgHours: 119.0, orderBacklog: 18,
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
    activeStaff: 193, targetStaff: 225, joined: 4, resigned: 19, avgHours: 107.26, orderBacklog: 35,
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
  },
  '6月進捗': {
    status: 'inprogress', salesBudget: 53500000, salesActual: 47213000, yoyLastYear: 44800000,
    gpBudget: 9501000, gpActual: 5108000, opBudget: 4500000, opActual: 2100000,
    activeStaff: 204, targetStaff: 225, joined: 15, resigned: 2, avgHours: 110.43, orderBacklog: 20,
    topics: [
      '6月予算 ¥5,350万 ➔ 見込み ¥4,978万 (GAP ▲372万)',
      '将来スプレッドシートやAPIからここへ直接数字を流し込むソースパターンとして設計済',
    ],
    schedule: [
      '■ 6月末: 受注残35名のうち15名充足',
      '■ 7月末: 稼働225名水準への回復',
    ],
  },
  '7月予定': plannedCompany(50000000, ANNUAL_SCHEDULE[1].desc, { orderBacklog: 31, stackupPotential: 6625700 }),
  '8月予定': plannedCompany(51000000, ANNUAL_SCHEDULE[1].desc),
  '9月予定': plannedCompany(53000000, ANNUAL_SCHEDULE[1].desc),
  '10月予定': plannedCompany(54000000, ANNUAL_SCHEDULE[2].desc),
  '11月予定': plannedCompany(55000000, ANNUAL_SCHEDULE[2].desc),
  '12月予定': plannedCompany(58000000, ANNUAL_SCHEDULE[2].desc),
  '1月予定': plannedCompany(56000000, ANNUAL_SCHEDULE[3].desc),
  '2月予定': plannedCompany(55000000, ANNUAL_SCHEDULE[3].desc),
  '3月予定': plannedCompany(60000000, ANNUAL_SCHEDULE[3].desc),
};

const PLANNED_BUDGETS: Record<string, number> = {
  '7月予定': 50000000, '8月予定': 51000000, '9月予定': 53000000, '10月予定': 54000000,
  '11月予定': 55000000, '12月予定': 58000000, '1月予定': 56000000, '2月予定': 55000000, '3月予定': 60000000,
};

export const AREA_MONTHLY: Record<string, Record<MonthKey, AreaMonth>> = {
  // kanto/chubu/kansaiの4-6月実績値は、現場一覧（現場売上×現場稼働数）から算出した実数値に更新。
  // yoyLastYearも2025年度の同じ計算式による実数値。
  kanto: {
    '4月実績': { salesBudget: 7452000, salesActual: 7480000, yoyLastYear: 15494000, gpBudget: 999747, gpActual: 1232567, activeStaff: 36, avgHours: 104.43, joined: 0, resigned: 0, heat: null, siteCount: 6, funnel: { meetings: 2, proposals: 1, estimates: 1, orders: 1 } },
    '5月実績': { salesBudget: 7100000, salesActual: 6878370, yoyLastYear: 13848000, gpBudget: 1174255, gpActual: 1015258, activeStaff: 36, avgHours: 94.42, joined: 0, resigned: 0, heat: null, siteCount: 6, funnel: { meetings: 2, proposals: 1, estimates: 1, orders: 1 } },
    '6月進捗': { salesBudget: 7490000, salesActual: 7500000, yoyLastYear: 13701000, gpBudget: 1232684, gpActual: 1079448, activeStaff: 36, avgHours: 101.71, joined: 3, resigned: 0, heat: null, siteCount: 6, funnel: { meetings: 3, proposals: 2, estimates: 1, orders: 0 } },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.kanto) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
  chubu: {
    '4月実績': { salesBudget: 6770000, salesActual: 7735000, yoyLastYear: 9131000, gpBudget: 1071695, gpActual: 1211200, activeStaff: 33, avgHours: 108.52, joined: 0, resigned: 0, heat: null, siteCount: 8, funnel: { meetings: 2, proposals: 1, estimates: 1, orders: 1 } },
    '5月実績': { salesBudget: 6354000, salesActual: 6972000, yoyLastYear: 8706000, gpBudget: 1071695, gpActual: 1157937, activeStaff: 33, avgHours: 98.43, joined: 2, resigned: 3, heat: null, siteCount: 7, funnel: { meetings: 2, proposals: 2, estimates: 1, orders: 1 } },
    '6月進捗': { salesBudget: 7740000, salesActual: 7116000, yoyLastYear: 8589000, gpBudget: 1220940, gpActual: 1173160, activeStaff: 33, avgHours: 100.22, joined: 3, resigned: 0, heat: '注意 31℃', siteCount: 7, funnel: { meetings: 3, proposals: 2, estimates: 1, orders: 0 } },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.chubu) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
  // 関西: 現場一覧(26現場)から再計算した結果、旧予算(11-17M台)は現場ベース売上(30-34M台)と大きく乖離するため、
  // 旧予算の粗利率/達成率のバランスを保つ形で予算・粗利も比例修正済み。要ユーザー確認。
  kansai: {
    '4月実績': { salesBudget: 30856000, salesActual: 34436000, yoyLastYear: 40202000, gpBudget: 4107000, gpActual: 6362000, activeStaff: 130, avgHours: 126.26, joined: 12, resigned: 10, heat: null, siteCount: 25, funnel: { meetings: 4, proposals: 3, estimates: 2, orders: 2 } },
    '5月実績': { salesBudget: 29624000, salesActual: 29324000, yoyLastYear: 37920000, gpBudget: 4020000, gpActual: 2822000, activeStaff: 124, avgHours: 113.33, joined: 2, resigned: 16, heat: null, siteCount: 25, funnel: { meetings: 3, proposals: 2, estimates: 1, orders: 1 } },
    '6月進捗': { salesBudget: 49616000, salesActual: 32475000, yoyLastYear: 38577000, gpBudget: 7047000, gpActual: 2855000, activeStaff: 135, avgHours: 115.24, joined: 6, resigned: 1, heat: '厳重警戒', siteCount: 27, funnel: { meetings: 5, proposals: 3, estimates: 1, orders: 1 } },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.kansai) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
  osaka: {
    '4月実績': { salesBudget: 21060000, salesActual: 23423983, yoyLastYear: 21300000, gpBudget: 3086758, gpActual: 3552490, activeStaff: 122, avgHours: 111.5, joined: 0, resigned: 0, heat: null, funnel: { meetings: 5, proposals: 4, estimates: 2, orders: 1 } },
    '5月実績': { salesBudget: 20500000, salesActual: 20329795, yoyLastYear: 18700000, gpBudget: 2557300, gpActual: 2478432, activeStaff: 123, avgHours: 112.5, joined: 0, resigned: 0, heat: null, funnel: { meetings: 4, proposals: 3, estimates: 2, orders: 1 } },
    '6月進捗': { salesBudget: 20550000, salesActual: 20220000, yoyLastYear: 18400000, gpBudget: 2543060, gpActual: 2459806, activeStaff: 124, avgHours: 113.3, joined: 3, resigned: 1, heat: '厳重警戒', funnel: { meetings: 5, proposals: 4, estimates: 2, orders: 1 } },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.osaka) / 1000) * 1000)])),
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

export interface SiteData {
  id: string; name: string; areaId: string; prefecture: string | null;
  active: boolean; lifecycle?: string;
  sales?: SiteFinancial; cost?: SiteFinancial; paidLeave?: SiteFinancial; opProfit?: SiteFinancial;
  plDetail?: Record<string, Partial<SiteFinancial>>; // PL_ACCOUNTSのlabelをキーとした明細（実データ提供後に充実予定）
  staffCount?: number; totalHours?: number; avgHours?: number;
  liftUnitPrice?: number | null; workerUnitPrice?: number; minimumWage?: number;
  marketHourlyWage?: number; // 同職種・同エリアの時給相場（参考値）
  backlogCount?: number; // 受注残（未充足人数）
  expectedImpact?: number; // 充足/交渉成立時に期待できるインパクト額（円）
  negotiationStatus?: NegotiationStatus;
  actionLog?: ActionLogEntry[]; // 価格交渉・コンタクト・横展開・課題の統合アクションログ
  // 手入力運用項目（チーム共有の保存基盤が必要 — 現状は静的プレースホルダー）
  salesRep?: string | null; soRep?: string | null;
  recruiting?: { active: boolean; costSpent?: number; costBudget?: number; postingPeriod?: string } | null;
}

function placeholderSite(id: string, name: string, areaId: string, opts?: { active?: boolean; lifecycle?: string }): SiteData {
  return { id, name, areaId, prefecture: null, active: opts?.active ?? true, lifecycle: opts?.lifecycle };
}

export const POSTING_PERIOD_OPTIONS = ['1週間', '2週間', '1ヶ月', '2ヶ月', '3ヶ月以上'] as const;

export const SITES: Record<string, SiteData> = {
  '648-1': {
    active: true,
    id: '648-1', name: 'ネオヴィア・ロジ 相模原部品センター', areaId: 'kanto', prefecture: '神奈川県',
    sales: { actual: 2850000, budget: 2800000, yoy: 2500000, mom: 2780000 },
    cost: { actual: 2050000, budget: 2020000, yoy: 1850000, mom: 2000000 },
    paidLeave: { actual: 40000, budget: 25000, yoy: 20000, mom: 30000 },
    opProfit: { actual: 670000, budget: 650000, yoy: 580000, mom: 640000 },
    staffCount: 12, totalHours: 1194, avgHours: 99.5,
    liftUnitPrice: 1480, workerUnitPrice: 1230, minimumWage: 1198, marketHourlyWage: 1250,
    backlogCount: 2, expectedImpact: 480000, negotiationStatus: '合意済',
    salesRep: null, soRep: null, recruiting: { active: false },
    actionLog: [
      { date: '2025-09', type: '価格交渉', text: '部品センター専属化に伴う単価改定 +25円/h 合意' },
    ],
  },
  '790-1': {
    active: true,
    id: '790-1', name: '昭和冷蔵 小牧センター', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 4200000, budget: 4100000, yoy: 3800000, mom: 4050000 },
    cost: { actual: 3350000, budget: 3280000, yoy: 3050000, mom: 3230000 },
    paidLeave: { actual: 90000, budget: 50000, yoy: 45000, mom: 60000 },
    opProfit: { actual: 508000, budget: 490000, yoy: 450000, mom: 480000 },
    staffCount: 18, totalHours: 1818, avgHours: 101.0,
    liftUnitPrice: 1400, workerUnitPrice: 1200, minimumWage: 1077, marketHourlyWage: 1150,
    backlogCount: 3, expectedImpact: 620000, negotiationStatus: '交渉中',
    salesRep: null, soRep: null, recruiting: { active: true, costSpent: 85000, costBudget: 150000, postingPeriod: '1ヶ月' },
    actionLog: [
      { date: '2025-12', type: '価格交渉', text: '冷蔵倉庫手当 新設 +40円/h 合意' },
      { date: '2026-04', type: '価格交渉', text: '最低賃金改定に伴うベース単価見直し予定' },
      { date: '2026-06', type: 'コンタクト', text: '現場責任者と定例MTG。夜間帯の人員不足を確認' },
    ],
  },
  '548-1': {
    active: true,
    id: '548-1', name: '福山通運 東海支店（セリア）', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 2400000, budget: 2350000, yoy: 2150000, mom: 2300000 },
    cost: { actual: 1830000, budget: 1800000, yoy: 1650000, mom: 1760000 },
    paidLeave: { actual: 40000, budget: 25000, yoy: 20000, mom: 30000 },
    opProfit: { actual: 422000, budget: 410000, yoy: 370000, mom: 400000 },
    staffCount: 12, totalHours: 1164, avgHours: 97.0,
    liftUnitPrice: 1380, workerUnitPrice: 1190, minimumWage: 1077, marketHourlyWage: 1140,
    backlogCount: 0, expectedImpact: 0, negotiationStatus: '未着手',
    salesRep: null, soRep: null, recruiting: { active: false },
    actionLog: [
      { date: '2025-10', type: '価格交渉', text: '契約更新に伴う単価据え置き' },
    ],
  },
  '533-1': {
    active: true,
    id: '533-1', name: '任天堂販売 京都物流センター', areaId: 'kansai', prefecture: '京都府',
    sales: { actual: 3800000, budget: 3700000, yoy: 3400000, mom: 3650000 },
    cost: { actual: 2900000, budget: 2830000, yoy: 2600000, mom: 2790000 },
    paidLeave: { actual: 100000, budget: 60000, yoy: 55000, mom: 75000 },
    opProfit: { actual: 695000, budget: 670000, yoy: 620000, mom: 660000 },
    staffCount: 35, totalHours: 3850, avgHours: 110.0,
    liftUnitPrice: 1500, workerUnitPrice: 1280, minimumWage: 1058, marketHourlyWage: 1200,
    backlogCount: 5, expectedImpact: 1250000, negotiationStatus: '交渉中',
    salesRep: null, soRep: null, recruiting: { active: true, costSpent: 210000, costBudget: 300000, postingPeriod: '2ヶ月' },
    actionLog: [
      { date: '2025-11', type: '価格交渉', text: '新棟稼働に伴う増員・単価改定 +20円/h 合意' },
      { date: '2026-05', type: '横展開', text: '任天堂販売の他拠点にも同条件の増員提案を横展開検討' },
    ],
  },
  '133-1': {
    active: true,
    id: '133-1', name: '福山通運 大阪支店 (日勤/夜勤合計)', areaId: 'osaka', prefecture: '大阪府',
    sales: { actual: 20329795, budget: 20550000, yoy: 18200000, mom: 19800000 },
    cost: { actual: 15721065, budget: 16100000, yoy: 14200000, mom: 15100000 },
    paidLeave: { actual: 650000, budget: 350000, yoy: 210000, mom: 150000 },
    opProfit: { actual: 2478432, budget: 2543060, yoy: 2200000, mom: 2350000 },
    staffCount: 124, totalHours: 14049, avgHours: 113.3,
    liftUnitPrice: 1550, workerUnitPrice: 1320, minimumWage: 1177, marketHourlyWage: 1280,
    backlogCount: 4, expectedImpact: 2100000, negotiationStatus: '交渉中',
    salesRep: null, soRep: null, recruiting: { active: true, costSpent: 320000, costBudget: 400000, postingPeriod: '3ヶ月以上' },
    actionLog: [
      { date: '2025-07', type: '価格交渉', text: '夜勤帯単価改定 +35円/h 合意' },
      { date: '2026-01', type: '価格交渉', text: '次期契約（4月更新）に向けた価格交渉開始' },
      { date: '2026-05', type: 'コンタクト', text: '本部担当者と次期契約条件を協議' },
    ],
  },

  // ── 以下、現場一覧のみ反映（損益書ご提供後に財務データを追加予定） ──
  'kanto-p1': placeholderSite('kanto-p1', 'PCS 関東（重工相模原）', 'kanto', { lifecycle: '7月より非稼働予定' }),
  'kanto-p2': placeholderSite('kanto-p2', 'PCS 関東（重工丸の内）', 'kanto'),
  'kanto-p3': placeholderSite('kanto-p3', 'PCS 関東（豊洲）', 'kanto'),
  'kanto-p4': placeholderSite('kanto-p4', 'メニコン 千葉八千代支店', 'kanto'),
  'kanto-p5': placeholderSite('kanto-p5', 'PCS 関東（田町タワー）', 'kanto'),
  'kanto-p6': placeholderSite('kanto-p6', '福山通運 藤沢支店', 'kanto', { active: false, lifecycle: '2026年3月末で契約終了（損益は6月頃まで諸経費計上継続）' }),

  'chubu-p1': placeholderSite('chubu-p1', 'afs 中部XD（派遣）', 'chubu'),
  'chubu-p2': placeholderSite('chubu-p2', '福山通運 名古屋南流通センター', 'chubu'),
  'chubu-p3': placeholderSite('chubu-p3', '株式会社Rian Japan 中部物流センター', 'chubu', { active: false, lifecycle: '2026年5月末で契約終了' }),
  'chubu-p4': placeholderSite('chubu-p4', '岐阜アグリフーズ 本社・工場（食鳥部鶏肉加工課）', 'chubu'),
  'chubu-p5': placeholderSite('chubu-p5', '昭和冷蔵 名古屋センター', 'chubu'),
  'chubu-p6': placeholderSite('chubu-p6', '昭和冷蔵 犬山ドライセンター', 'chubu', { lifecycle: '2026年4月新規稼働' }),

  'kansai-p1': placeholderSite('kansai-p1', '日生トーム 高槻事業所', 'kansai'),
  'kansai-p2': placeholderSite('kansai-p2', '岡山県貨物運送 南港支店', 'kansai', { active: false, lifecycle: '2026年6月末で契約終了' }),
  'kansai-p3': placeholderSite('kansai-p3', '株式会社加茂商事', 'kansai'),
  'kansai-p4': placeholderSite('kansai-p4', '尾家産業 阪南支店（派遣）', 'kansai'),
  'kansai-p5': placeholderSite('kansai-p5', 'コーナン商事 貝塚センター', 'kansai'),
  'kansai-p6': placeholderSite('kansai-p6', 'フェリシモ エスパス（選別作業）', 'kansai'),
  'kansai-p7': placeholderSite('kansai-p7', 'PCS 関西（BPOソリューション事業本部）', 'kansai'),
  'kansai-p8': placeholderSite('kansai-p8', '阪菱企業 第三（12号倉庫）', 'kansai'),
  'kansai-p9': placeholderSite('kansai-p9', '阪菱企業 第二 5号配送センター', 'kansai'),
  'kansai-p10': placeholderSite('kansai-p10', 'HMKロジサービス 西神戸センター', 'kansai'),
  'kansai-p11': placeholderSite('kansai-p11', 'ハウス物流サービス株式会社', 'kansai', { active: false, lifecycle: '2026年6月末で契約終了' }),
  'kansai-p12': placeholderSite('kansai-p12', '阪菱企業 第一 1号配送センター', 'kansai'),
  'kansai-p13': placeholderSite('kansai-p13', '阪菱企業 第一 2号配送センター', 'kansai'),
  'kansai-p14': placeholderSite('kansai-p14', '阪菱企業 第一 11号倉庫', 'kansai'),
  'kansai-p15': placeholderSite('kansai-p15', 'YSO Logi株式会社 神戸営業所', 'kansai'),
  'kansai-p16': placeholderSite('kansai-p16', '西鉄運輸 枚方物流センター', 'kansai'),
  'kansai-p17': placeholderSite('kansai-p17', 'フェリシモ エスパス（伝票管理業務）', 'kansai'),
  'kansai-p18': placeholderSite('kansai-p18', '阪菱企業 西神現業所', 'kansai'),
  'kansai-p19': placeholderSite('kansai-p19', 'フェリシモ エスパス（検品・箱入作業）', 'kansai'),
  'kansai-p20': placeholderSite('kansai-p20', '摂津倉庫 京田辺センター', 'kansai'),
  'kansai-p21': placeholderSite('kansai-p21', 'エヌエス物流 関西物流センター', 'kansai'),
  'kansai-p22': placeholderSite('kansai-p22', 'エヌエス物流 滋賀物流センター', 'kansai'),
  'kansai-p23': placeholderSite('kansai-p23', '西鉄運輸 加古川支店', 'kansai'),
  'kansai-p24': placeholderSite('kansai-p24', 'HMKロジサービス 南港センター（レッドウッド南港）', 'kansai', { lifecycle: '2026年6月新規稼働' }),
  'kansai-p25': placeholderSite('kansai-p25', 'HMKロジサービス 南港センター（GLP大阪）', 'kansai', { lifecycle: '2026年6月新規稼働' }),
};

export function sitesOfArea(areaId: string): SiteData[] {
  return Object.values(SITES).filter((s) => s.areaId === areaId);
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
