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

// ページ初期表示で選ぶ「今月」のMONTHSキーを「今日」から動的に算出する。
// CURRENT_ACTUAL_MONT（実績データの反映が済んでいる最新月）とは別物：
// あちらは手動更新のデータ鮮度マーカーで、日付が進んでも自動では動かない。
export function currentCalendarMonthKey(now: Date = new Date()): MonthKey {
  const y = now.getFullYear(), m = now.getMonth() + 1;
  return MONTHS.find((k) => { const c = monthCalendar(k); return c.year === y && c.month === m; }) ?? MONTHS[MONTHS.length - 1];
}

// 最低賃金・時給相場・マージン率は週次で確認・更新する運用。最終更新日をダッシュボード各所に小さく表示する。
export const RATES_UPDATED_AT = '2026-08-01';
export function ratesUpdatedLabel(): string {
  const d = new Date(RATES_UPDATED_AT);
  return `最終更新 ${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（週次更新）`;
}

// P&L・KPI等ダッシュボード掲載数値の反映時点（現場からの報告都度、手動更新）。右上バッジに表示。
export const DASHBOARD_DATA_UPDATED_AT = '2026/8/5 14:32';
export function dashboardUpdatedLabel(): string {
  return `${DASHBOARD_DATA_UPDATED_AT}更新`;
}

// 地域別最低賃金（令和7年度・厚生労働省公表、2025年10〜11月発効）。都道府県ごとに一元管理し、
// 現場のprefectureから自動反映する（現場側で個別にminimumWageを持たせている場合はそちらを優先）。
// 出典: 厚生労働省 地域別最低賃金の全国一覧（https://saiteichingin.mhlw.go.jp/）
export const MINIMUM_WAGE_BY_PREFECTURE: Record<string, number> = {
  '東京都': 1226, '神奈川県': 1225, '千葉県': 1140, '愛知県': 1140, '岐阜県': 1065,
  '大阪府': 1177, '兵庫県': 1116, '京都府': 1122, '滋賀県': 1080,
};
export const MINIMUM_WAGE_SOURCE_LABEL = '出典: 厚生労働省 地域別最低賃金（令和7年度、2025年10〜11月発効）';
export function effectiveMinimumWage(site: SiteData): number | null {
  if (site.minimumWage != null) return site.minimumWage;
  return site.prefecture ? MINIMUM_WAGE_BY_PREFECTURE[site.prefecture] ?? null : null;
}

// 時給相場（都道府県別・全職種平均、ハローワーク求人データ集計）。軽作業・リフト等の職種別公的データが
// 無いため全職種平均を暫定値として使う。現場固有の実相場が分かればsite.marketHourlyWageで上書きされる
// （現場側の値を優先）。要現場確認・マスタ整備次第で随時更新。
// 出典: ハローワークプラス 都道府県別時給比較（https://helloworkplus.com/parttime/salary-by-area/）
export const MARKET_HOURLY_WAGE_BY_PREFECTURE: Record<string, number> = {
  '東京都': 1445, '神奈川県': 1439, '千葉県': 1358, '愛知県': 1338, '岐阜県': 1253,
  '大阪府': 1393, '兵庫県': 1320, '京都府': 1319, '滋賀県': 1266,
};
export const MARKET_HOURLY_WAGE_SOURCE_LABEL = '参考値（全職種平均・ハローワーク求人データ集計） ・ 要現場確認';
export function effectiveMarketHourlyWage(site: SiteData): number | null {
  if (site.marketHourlyWage != null) return site.marketHourlyWage;
  return site.prefecture ? MARKET_HOURLY_WAGE_BY_PREFECTURE[site.prefecture] ?? null : null;
}

export const ANNUAL_GOAL = { sales: 620000000, gpRate: 14.51, opRate: 6.87 };

export const ANNUAL_SCHEDULE = [
  { period: 'Q1', range: '4–6月', title: '基盤構築期', desc: '関西の稼働密度維持と関東・中部の工数引き上げ。新規立ち上げ4案件の完遂。' },
  { period: 'Q2', range: '7–9月', title: '利益体質転換期', desc: '受注残35名の完全充足。総稼働235名・平均工数120hの同時達成。' },
  { period: 'Q3', range: '10–12月', title: '価格交渉・拡大期', desc: '全エリアでの価格交渉実行（+30円/h目標）。新規大型案件の受注獲得。' },
  { period: 'Q4', range: '1–3月', title: '通期目標達成期', desc: '年間売上6.2億円、営業利益率6.87%の必達。次期に向けたリーダー育成。' },
];

// 「年間スケジュール・イベント」シート（人ソ実績一覧・年間スケジュール.xlsx）の定型タスクを
// Sheets連携未設定時のローカル既定値として登録。四半期クリックの月別タスク一覧に表示される。
export interface DefaultScheduleTask {
  id: string; title: string; period: string; status: string; note: string; area: string; site: string; assignee: string; createdAt: string;
}
const dTask = (id: string, title: string, period: string, assignee: '営業' | 'SO', note = ''): DefaultScheduleTask => (
  { id, title, period, status: '未着手', note, area: '', site: '', assignee, createdAt: '' }
);
export const DEFAULT_SCHEDULE_TASKS: DefaultScheduleTask[] = [
  // ── 営業 ──
  dTask('sched-eigyo-1', '有料職業紹介事業報告書', '4月', '営業', '前年度1年間で、紹介予定派遣や直雇用に切替があった際に報告する（丸全 福留さん 令和6年度）'),
  dTask('sched-eigyo-2', '衛生委員会', '4月', '営業'),
  dTask('sched-eigyo-3', '西鉄運輸<短期>掲載・採用', '4月', '営業'),
  dTask('sched-eigyo-4', '衛生委員会', '5月', '営業'),
  dTask('sched-eigyo-5', '暑さ対策グッズ準備・発送', '5月', '営業'),
  dTask('sched-eigyo-6', 'HMK<短期>掲載・採用', '5月', '営業'),
  dTask('sched-eigyo-7', '派遣事業報告書', '6月', '営業'),
  dTask('sched-eigyo-8', '衛生委員会', '6月', '営業'),
  dTask('sched-eigyo-9', '西鉄運輸<短期> 稼働', '6月', '営業'),
  dTask('sched-eigyo-10', '衛生委員会', '7月', '営業'),
  dTask('sched-eigyo-11', 'HMK<短期>掲載・採用', '7月', '営業'),
  dTask('sched-eigyo-12', 'HMK<短期> 稼働（7月中旬〜お盆まで）', '7月', '営業'),
  dTask('sched-eigyo-13', '衛生委員会', '8月', '営業'),
  dTask('sched-eigyo-14', '同労賃情報収集', '8月', '営業'),
  dTask('sched-eigyo-15', '任天堂<短期>掲載・採用', '8月', '営業'),
  dTask('sched-eigyo-13b', '8月分 価格交渉棚卸し・同労賃マスタシート更新', '8月', '営業'),
  dTask('sched-eigyo-16', '上期振り返り・下期見通し資料作成', '9月', '営業'),
  dTask('sched-eigyo-17', '衛生委員会', '9月', '営業'),
  dTask('sched-eigyo-18', '同労賃・地域指数マスタ シス部にコア取り込み依頼', '9月', '営業', '「2 該当職種の平均的な賃金」「3 〜地域の指数」「4 〜算出した金額」など同労賃地域マスタ取り込み依頼。地域指数などの情報（同労賃マスタのシート）を坂中さん・まさしさんに共有'),
  dTask('sched-eigyo-18b', '同労賃マスタ価格交渉・資料作成スタート', '9月', '営業', '資料内容と上げ幅について社内で検討・共有予定'),
  dTask('sched-eigyo-19', '同労賃一発目 資料提示', '10月', '営業'),
  dTask('sched-eigyo-20', '衛生委員会', '10月', '営業'),
  dTask('sched-eigyo-21', 'HMK<短期> 稼働', '10月', '営業'),
  dTask('sched-eigyo-22', '任天堂<短期> 稼働（10月上旬〜1月上旬まで）', '10月', '営業'),
  dTask('sched-eigyo-22b', 'お歳暮案件準備：HMK西神戸・IH（アイエイチロジ尼崎）採用・掘り起こし開始', '10月', '営業', 'IHは2026年11月2日〜12月26日稼働予定、初日13名スタート・ストック作成後は1.5倍人員に増員。貴子さん担当、SO＋五十嵐さんが全面バックアップ。任天堂の短期案件があれば同様に対応'),
  dTask('sched-eigyo-23', '同労賃見積書ご提示', '11月', '営業'),
  dTask('sched-eigyo-24', '来期予算作成', '11月', '営業'),
  dTask('sched-eigyo-25', '衛生委員会', '11月', '営業'),
  dTask('sched-eigyo-23b', 'HMK西神戸・IH（アイエイチロジ尼崎）始動', '11月', '営業'),
  dTask('sched-eigyo-26', '同労賃回答〆切', '12月', '営業', '12月末を価格交渉の合意期限とする'),
  dTask('sched-eigyo-27', '衛生委員会', '12月', '営業'),
  dTask('sched-eigyo-26b', 'セリア（東海支店）終了対応：リフトマンのみ稼働継続', '12月', '営業', '10月以降の物量減少により最大12月末で現場終了の可能性。お盆明けにスタッフへ告知済み'),
  dTask('sched-eigyo-28', 'お年賀周り', '1月', '営業'),
  dTask('sched-eigyo-29', '来期予算・修正①', '1月', '営業'),
  dTask('sched-eigyo-30', '労働者代表選出', '2月', '営業'),
  dTask('sched-eigyo-31', '衛生委員会', '2月', '営業'),
  dTask('sched-eigyo-32', '同労賃時給変更（WF 3月上旬）', '3月', '営業'),
  dTask('sched-eigyo-33', '衛生委員会', '3月', '営業'),
  // ── SO ──
  dTask('sched-so-1', '交通費運賃改正', '4月', 'SO'),
  dTask('sched-so-2', '障害者手帳所持者調査', '4月', 'SO'),
  dTask('sched-so-3', '衛生委員会', '4月', 'SO'),
  dTask('sched-so-4', '衛生委員会', '5月', 'SO'),
  dTask('sched-so-5', '暑さ対策グッズ準備・発送', '5月', 'SO', '塩飴は消耗品／空調服は福利厚生費／送料塩飴1件270円。準備は4/23〜開始'),
  dTask('sched-so-6', '雇用契約書類発送（20日過ぎ頃）', '6月', 'SO'),
  dTask('sched-so-7', '衛生委員会', '6月', 'SO'),
  dTask('sched-so-8', '暑さ対策グッズ準備・発送［6月以降新規入職スタッフ分対応］', '6月', 'SO', '塩飴は消耗品／空調服は福利厚生費／送料塩飴1件270円'),
  dTask('sched-so-9', '夏季休業期間についてお知らせメール', '7月', 'SO'),
  dTask('sched-so-10', '衛生委員会', '7月', 'SO'),
  dTask('sched-so-11', 'PALMEE全現場導入', '7月', 'SO'),
  dTask('sched-so-12', '衛生委員会', '8月', 'SO'),
  dTask('sched-so-13', 'PALMEE速払いフェーズ取りまとめ・イレギュラー対応の承認フロー確定', '8月', 'SO', '労務・芦田さんと連携。固まり次第、中部から試験運用スタート。予定マニュアル・速払い手順書・口座開設マニュアル・社内業務フローマニュアルを同時進行で作成'),
  dTask('sched-so-14', '今年定年迎えるスタッフ確認（定年再雇用手続き準備）', '9月', 'SO'),
  dTask('sched-so-15', '雇用契約書類発送（20日過ぎ頃）', '9月', 'SO'),
  dTask('sched-so-16', '衛生委員会', '9月', 'SO'),
  dTask('sched-so-15b', 'PALMEE追加機能・速払い移行を全スタッフへ告知', '9月', 'SO', '上旬に告知。口座・手数料について通知し、口座開設希望確認アンケートを実施。追加機能: ①雇用契約書発行・確認 ②シフト回収 ③有給申請 ④給与明細 ⑤（将来）源泉徴収票まで一括管理'),
  dTask('sched-so-15c', '中部 PALMEE試験運用・速払いスタート', '9月', 'SO', '9月後半〜10月にかけて実施'),
  dTask('sched-so-17', '交通費運賃改正', '10月', 'SO'),
  dTask('sched-so-18', '事業所抵触日更新', '10月', 'SO'),
  dTask('sched-so-17b', '中部・関東 PALMEE速払い移行', '10月', 'SO', 'みずほ銀行口座開設を中部・関東・大阪支店で同時進行'),
  dTask('sched-so-19', '冬季休業期間についてお知らせメール', '11月', 'SO'),
  dTask('sched-so-20', '衛生委員会', '11月', 'SO'),
  dTask('sched-so-19b', '大阪支店 PALMEE速払い移行', '11月', 'SO', '関西の口座開設を同時進行'),
  dTask('sched-so-21', '雇用契約書類発送（20日過ぎ頃）', '12月', 'SO'),
  dTask('sched-so-22', '衛生委員会', '12月', 'SO'),
  dTask('sched-so-21b', '全現場 PALMEE速払いフェーズ完了・追加機能実装', '12月', 'SO'),
  dTask('sched-so-23', '衛生委員会', '1月', 'SO'),
  dTask('sched-so-25', '労働者代表選出・任命', '2月', 'SO'),
  dTask('sched-so-26', '衛生委員会', '2月', 'SO'),
  dTask('sched-so-27', '障害者手帳所持者調査', '2月', 'SO'),
  dTask('sched-so-28', '雇用契約書類発送（20日過ぎ頃）', '3月', 'SO'),
  dTask('sched-so-29', '労働者代表選出完了・労務連携', '3月', 'SO'),
  dTask('sched-so-30', '被扶養者異動の確認', '3月', 'SO'),
];

export const AREAS: { id: string; title: string }[] = [
  { id: 'kanto', title: '関東' },
  { id: 'chubu', title: '中部' },
  { id: 'kansai', title: '関西' },
  { id: 'osaka', title: '大阪支店' },
];

// タスク管理の担当者プルダウン用
export const ASSIGNEES = ['田中', '谷口', '岩田', '山口', '五十嵐', '貴子'] as const;

// ダッシュボード大元「トピックス・プロジェクト」で参照URLを貼れる進行中プロジェクト
// PJごとに雰囲気の違うアイコン・テーマカラーを割り当てる（内容に応じて自由に）。
export const PROJECTS: { id: string; name: string; note?: string; icon: string; color: string }[] = [
  { id: 'fukuyama', name: '福山通運様PJ', icon: '🚚', color: '#2563eb' },
  { id: 'palmee', name: 'PALMEE PJ', note: '運用アップデート：勤怠表の紙ベース終了承認問題のフェーズへ', icon: '📱', color: '#059669' },
  { id: 'so-flow', name: 'SO業務フロー改善', icon: '🔄', color: '#d97706' },
  { id: 'ai-agent', name: 'AIエージェント', icon: '🤖', color: '#7c3aed' },
];

// プロジェクトごとに貼れる参照URLの種類（ドライブ・Asana・NotebookLM）。
export interface ProjectLinkField { key: 'driveUrl' | 'asanaUrl' | 'notebookLmUrl'; label: string; icon: string }
export const PROJECT_LINK_FIELDS: ProjectLinkField[] = [
  { key: 'driveUrl', label: 'ドライブ', icon: '🗂️' },
  { key: 'asanaUrl', label: 'Asana', icon: '✅' },
  { key: 'notebookLmUrl', label: 'NotebookLM', icon: '🧠' },
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
  // 見通し（予算とは別に、進捗を踏まえて更新される着地見込み）。予算を上書きせず並記する。
  salesForecast?: number | null;
  gpForecast?: number | null;
}

// 2Q目標: 受注残の積上げによる単月売上インパクト ¥500万/月
export const BACKLOG_STACKUP_MONTHLY_TARGET = 5000000;

// KPI: 現場あたり月次売上の目標ライン
export const SITE_SALES_TARGET = 1500000;

// KPI: 1人あたり月次工数の基準値
export const STAFF_HOURS_TARGET = 120;

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

// 前年（26期・2025年4月〜2026年3月）の採用KPI実績。エリア別の月次前年比表示に使用。
// 出典: 営業進捗まとめシート「【人ソ】営業進捗まとめシート」。大阪支店は同シートに個別行が無いため未登録。
export interface RecruitingYoyMonth {
  totalApplicants: number | null; // 総応募者数
  hires: number | null; // 入職者数
  midMonthResignations: number | null; // 月内退職者数
  hireRate: number | null; // 入職率（%、分母は有効応募数）
}
function buildRecruitingYoY(
  totalApplicants: (number | null)[],
  hires: (number | null)[],
  midMonthResignations: (number | null)[],
  hireRate: (number | null)[]
): Partial<Record<MonthKey, RecruitingYoyMonth>> {
  const out: Partial<Record<MonthKey, RecruitingYoyMonth>> = {};
  MONTHS.forEach((mk, i) => {
    out[mk] = {
      totalApplicants: totalApplicants[i] ?? null,
      hires: hires[i] ?? null,
      midMonthResignations: midMonthResignations[i] ?? null,
      hireRate: hireRate[i] ?? null,
    };
  });
  return out;
}
export const RECRUITING_LAST_YEAR: Record<string, Partial<Record<MonthKey, RecruitingYoyMonth>>> = {
  kanto: buildRecruitingYoY(
    [46, 31, 26, 31, 31, 33, 23, 9, 8, 10, 12, null],
    [7, 1, 2, 3, 3, 12, 5, 1, 2, 1, 2, null],
    [1, 5, 5, 0, 2, 6, 3, 2, 1, 6, 2, null],
    [26.92, 6.25, 10.53, 11.11, 16.67, 63.16, 35.71, 12.50, 28.57, 20.00, 40.00, null]
  ),
  chubu: buildRecruitingYoY(
    [17, 8, 16, 16, 17, 19, 6, 7, 2, 0, null, null],
    [1, 4, 5, 1, 2, 3, 1, 2, 0, 0, null, null],
    [0, 2, 1, 0, 1, 1, 0, 1, 0, 0, null, null],
    [7.14, 66.67, 35.71, 8.33, 13.33, 21.43, 25.00, 40.00, null, null, null, null]
  ),
  kansai: buildRecruitingYoY(
    [55, 37, 48, 45, 21, 25, 84, 50, 7, 23, null, null],
    [11, 4, 12, 12, 0, 1, 8, 15, 1, 1, null, null],
    [2, 2, 9, 8, 1, 1, 3, 0, 0, 3, null, null],
    [22.92, 12.90, 32.43, 30.77, 0.00, 4.00, 11.27, 32.61, 14.29, 4.55, null, null]
  ),
};

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
  paidLeaveForecast?: number | null; // 有給金額の見通し
  paidLeaveForecastNote?: string | null; // 補足（例: 仮の退職有給を含む、など）
  topics?: string[]; // 手入力の補足トピックス（スケジュール・PJ由来の連絡事項など）。数値から自動生成されるトピックスに追加表示する
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
  // 稼働人数・平均工数は「実績一覧_2026年度」（自社システム現場一覧、7月末確定値）の現場積み上げに更新（旧193名/117.04hは7/21時点MTGアジェンダの速報値）。
  // 受注残・salesForecast/gpForecastは7/21時点の人ソ予算進捗MTGアジェンダより更新
  // （全体=関東+中部+関西+大阪支店）。見通しは予算とは別枠の着地見込みとして並記。
  // 入職・退職・応募状況は7/28 10:15時点の実績より。入職12名の内訳（6月応募→7月入職も含め全て7月分として計上）:
  // 西鉄運輸加古川(二橋・葉石)、福山通運東海支店セリア(伊藤・杉江)、昭和冷蔵小牧(長尾・国部)、
  // 昭和冷蔵犬山(舟橋)、福山通運大阪支店(2名)、HMKロジ南港RW(川島未来)、HMKロジ西神戸(河野弓真)、任天堂京都(高橋実乃梨)。
  // 応募93件＝直接投稿82件+Q-mate11件。
  '7月進捗': {
    ...plannedCompany(50000000, ANNUAL_SCHEDULE[1].desc, { orderBacklog: 16, stackupPotential: 2410700 }),
    activeStaff: 208, avgHours: 115.06, joined: 12, resigned: 2,
    salesForecast: 49226862, gpForecast: 6819522,
    topics: [
      '7/28 10:15時点 応募93件（内訳: 直接投稿82件・Q-mate11件）、入職12名・退職2名',
      '入職内訳: 西鉄運輸加古川2名・セリア2名・昭和冷蔵小牧2名・昭和冷蔵犬山1名・大阪支店2名・HMKロジ南港1名・HMKロジ西神戸1名・任天堂1名',
    ],
  },
  // 入職・退職は8/6時点の速報値（月末まで変動あり）。
  '8月予定': {
    ...plannedCompany(51000000, ANNUAL_SCHEDULE[1].desc), joined: 3, resigned: 2, salesForecast: 41053925,
    topics: [
      'PALMEE速払いフェーズ取りまとめ・イレギュラー対応の承認フロー確定（労務・芦田さん連携）。固まり次第、中部から試験運用スタート',
      '8月分 価格交渉棚卸し・同労賃マスタシート更新',
      'セリア（東海支店）10月以降物量減少、最大12月末で現場終了の可能性（お盆明けにスタッフへ告知済み）',
    ],
  },
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
    // 7月実績は7/28 10:15時点のP&L実績（現場積み上げ）より反映。
    // 稼働人数・総工数は「実績一覧_2026年度」（自社システム現場一覧、7月末確定値）に更新。salesForecast/gpForecastは7/21時点の人ソ予算進捗MTGアジェンダより更新。
    '7月進捗': {
      salesBudget: 7632000, salesActual: 7425450, yoyLastYear: null,
      gpBudget: 1244779, gpActual: 1193199,
      activeStaff: 34, avgHours: 112.22, joined: null, resigned: null,
      heat: null, siteCount: 5, funnel: null,
      salesForecast: 7684658, gpForecast: 1342521,
    },
    // 8-9月の予算は月次予算表（現場積み上げ）を自動集計。見通しは2Q見通しレポートより。
    '8月予定': {
      ...plannedArea(6860000), gpBudget: 1139229, salesForecast: 5800143, gpForecast: 917723, paidLeaveForecast: 200000,
      topics: ['2026年8月3日付でPCS豊洲からBloomberg丸の内案件へ切替'],
    },
    '9月予定': { ...plannedArea(Math.round((PLANNED_BUDGETS['9月予定'] * AREA_WEIGHT.kanto) / 1000) * 1000), salesForecast: 5780000 },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).filter(([m]) => !['7月進捗', '8月予定', '9月予定'].includes(m)).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.kanto) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
  chubu: {
    // 4月の稼働人数・工数は各現場の実績（派遣人数・総工数）を積み上げた実数値に修正（34名/105.33h、旧33名/108.52hから訂正）。
    '4月実績': { salesBudget: 6770000, salesActual: 7735000, yoyLastYear: 9131000, gpBudget: 1071695, gpActual: 1211200, activeStaff: 34, avgHours: 105.33, joined: 0, resigned: 0, heat: null, siteCount: 8, funnel: { meetings: 2, proposals: 1, estimates: 1, orders: 1 } },
    '5月実績': { salesBudget: 6354000, salesActual: 6972000, yoyLastYear: 8706000, gpBudget: 1071695, gpActual: 1157937, activeStaff: 33, avgHours: 98.43, joined: 2, resigned: 3, heat: null, siteCount: 7, funnel: { meetings: 2, proposals: 2, estimates: 1, orders: 1 } },
    '6月進捗': { salesBudget: 7740000, salesActual: 7116000, yoyLastYear: 8589000, gpBudget: 1220940, gpActual: 1173160, activeStaff: 33, avgHours: 100.22, joined: 3, resigned: 0, heat: '注意 31℃', siteCount: 7, funnel: { meetings: 3, proposals: 2, estimates: 1, orders: 0 } },
    // 7月は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 所属部署: 人ソ（中部））より反映。
    // gpActualは粗利益2（社保・雇保・有給等控除後）の部門合計。稼働人数・総工数は「実績一覧_2026年度」（現場一覧、7月末確定値）に更新（旧37名/101.97hから訂正）。
    // salesForecast/gpForecastは7/21時点の人ソ予算進捗MTGアジェンダより更新。
    '7月進捗': {
      salesBudget: 7620000, salesActual: 7986636, yoyLastYear: null,
      gpBudget: 1303020, gpActual: 1401755,
      activeStaff: 38, avgHours: 98.96, joined: null, resigned: null,
      heat: null, siteCount: 7, funnel: null,
      salesForecast: 7980000, gpForecast: 1364580,
    },
    '8月予定': {
      ...plannedArea(7544000), gpBudget: 1290024, salesForecast: 8000000, gpForecast: 1368000, paidLeaveForecast: 200000,
      topics: [
        '固まり次第、PALMEE速払いの試験運用を中部からスタート予定',
        'セリア（東海支店）10月以降物量減少、最大12月末で現場終了の可能性（お盆明けにスタッフへ告知済み）',
      ],
    },
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
    // 稼働人数・総工数は「実績一覧_2026年度」（現場一覧、7月末確定値）に更新（旧47名/139.53hは7/21時点MTGアジェンダの速報値で、大阪支店分の切り分け誤りにより過小計上だったため訂正）。
    // salesForecast/gpForecastは7/21時点の人ソ予算進捗MTGアジェンダより更新。
    '7月進捗': {
      salesBudget: 17720000, salesActual: 12293534, yoyLastYear: null,
      gpBudget: 2541026, gpActual: 2013358,
      activeStaff: 60, avgHours: 104.29, joined: null, resigned: null,
      heat: null, siteCount: 26, funnel: null,
      salesForecast: 14386426, gpForecast: 2015538,
    },
    // 8-9月の予算は現場積み上げ(現場マスタ登録分)＋関西新規枠(月次6,500,000、未登録の新規現場分)の合計。
    '8月予定': {
      ...plannedArea(17290000), gpBudget: 2461801, salesForecast: 11690783, gpForecast: 1637879, paidLeaveForecast: 308160,
      topics: ['お歳暮案件準備：10月よりHMK西神戸・IH（アイエイチロジ尼崎）の採用・掘り起こし開始予定（貴子さん担当）'],
    },
    '9月予定': { ...plannedArea(17720000), salesForecast: 9620000, paidLeaveForecast: 300000 },
    ...Object.fromEntries(Object.entries(PLANNED_BUDGETS).filter(([m]) => !['7月進捗', '8月予定', '9月予定'].includes(m)).map(([m, b]) => [m, plannedArea(Math.round((b * AREA_WEIGHT.kansai) / 1000) * 1000)])),
  } as Record<MonthKey, AreaMonth>,
  osaka: {
    // 稼働人数・工数は現場実績（福山通運大阪支店）の積み上げ実数値に修正（旧122/123/124名は推定値だったため、78/74/79名に訂正）。
    '4月実績': { salesBudget: 21060000, salesActual: 23423983, yoyLastYear: 21300000, gpBudget: 3086758, gpActual: 3552490, activeStaff: 78, avgHours: 137.71, joined: 0, resigned: 0, heat: null, funnel: { meetings: 5, proposals: 4, estimates: 2, orders: 1 } },
    '5月実績': { salesBudget: 20500000, salesActual: 20329795, yoyLastYear: 18700000, gpBudget: 2557300, gpActual: 2478432, activeStaff: 74, avgHours: 126.56, joined: 0, resigned: 0, heat: null, funnel: { meetings: 4, proposals: 3, estimates: 2, orders: 1 } },
    '6月進捗': { salesBudget: 20550000, salesActual: 20220000, yoyLastYear: 18400000, gpBudget: 2543060, gpActual: 2459806, activeStaff: 79, avgHours: 128.87, joined: 3, resigned: 1, heat: '厳重警戒', funnel: { meetings: 5, proposals: 4, estimates: 2, orders: 1 } },
    // 7月は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 人ソ関西内の福山通運大阪支店行）より反映。
    // 稼働人数・総工数は「実績一覧_2026年度」（現場一覧、7月末確定値）に更新（76名/10,100.08h）。salesForecastは7/21時点の人ソ予算進捗MTGアジェンダより更新。
    '7月進捗': {
      salesBudget: 21570000, salesActual: 17669531, yoyLastYear: null,
      gpBudget: 2838044, gpActual: 2883072,
      activeStaff: 76, avgHours: 132.90, joined: null, resigned: null,
      heat: null, siteCount: 1, funnel: null,
      salesForecast: 19175778, gpForecast: 2096883,
    },
    '8月予定': { ...plannedArea(19530000), gpBudget: 2244170, salesForecast: 17396250, gpForecast: 1602280, paidLeaveForecast: 1050000, paidLeaveForecastNote: '仮の退職有給18万円を含む' },
    '9月予定': { ...plannedArea(Math.round((PLANNED_BUDGETS['9月予定'] * AREA_WEIGHT.osaka) / 1000) * 1000), salesForecast: 18325120, paidLeaveForecast: 880000, paidLeaveForecastNote: '仮の退職有給18万円を含む' },
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

// 職種・シフト別の請求単価・支給単価・利益・利益率①（2026年7月時点の職種別レート表より）。
// 同一現場に複数職種がある場合は配列で全件保持し、情報を欠落させない。
export interface RoleRate {
  label: string | null; // 職種・シフト名（例: 日勤／夜勤／フォークリフト）。単一職種の現場はnull
  billingRate: number | null; // 請求単価（円/h）
  payRate: number | null; // 支給単価（円/h）
  profit: number | null; // 利益（請求単価-支給単価、円/h）
  marginRate: number | null; // 利益率①（%）
}

export interface SiteData {
  id: string; name: string; areaId: string; prefecture: string | null;
  active: boolean; lifecycle?: string;
  roles?: SiteRole[]; // 事業所内の役割別内訳（案件番号つき）
  sales?: Partial<SiteFinancial>; cost?: Partial<SiteFinancial>; paidLeave?: Partial<SiteFinancial>; opProfit?: Partial<SiteFinancial>;
  monthlyBudget?: Partial<Record<MonthKey, number>>; // 現場ごとの月次売上予算（4-9月予算表より。10月以降は未確定）
  salesYoyByMonth?: Partial<Record<MonthKey, number>>; // 前年（26期）月次売上実績（営業進捗まとめシートより。現場名突合、未登録現場は無し）
  roleRates?: RoleRate[]; // 職種別レート表（2026年7月時点、関西・大阪支店・中部分より突合。関東分は未登録）
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

// リフト単価・作業員単価は元々サイトごとの単一値だったが、職種別レート表（roleRates）の方が
// 新しく・粒度も細かいため、roleRatesがあればそちらの請求単価から自動算出する（無ければ旧手入力値にフォールバック）。
export function deriveUnitPrices(site: Pick<SiteData, 'roleRates' | 'liftUnitPrice' | 'workerUnitPrice'>): { liftUnitPrice: number | null; workerUnitPrice: number | null } {
  const roles = site.roleRates ?? [];
  const liftRole = roles.find((r) => r.label && /リフト/.test(r.label) && r.billingRate != null);
  const workerRole = roles.find((r) => r.billingRate != null && (!r.label || !/リフト/.test(r.label)));
  return {
    liftUnitPrice: liftRole?.billingRate ?? site.liftUnitPrice ?? null,
    workerUnitPrice: workerRole?.billingRate ?? site.workerUnitPrice ?? null,
  };
}

// 4-9月の月次予算表（現場名で突合）から、現場ごとの月次売上予算シリーズを組み立てる。10月以降は未確定のため含めない。
function budgetSeries(
  apr: number | null, may: number | null, jun: number | null, jul: number | null, aug: number | null, sep: number | null,
  oct: number | null = null, nov: number | null = null, dec: number | null = null, jan: number | null = null, feb: number | null = null, mar: number | null = null
): Partial<Record<MonthKey, number>> {
  const keys: MonthKey[] = ['4月実績', '5月実績', '6月進捗', '7月進捗', '8月予定', '9月予定', '10月予定', '11月予定', '12月予定', '1月予定', '2月予定', '3月予定'];
  const vals = [apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar];
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
  // 7月実績は7/28 10:15時点のP&L実績（売上合計・労務費・有給金額・粗利益2）より反映。
  // 売上高は後日、確定数字（検索システム 対象年月2026年07月・人ソ（関東）画面）で上書き反映（2026/8/5）。
  // budgetは月次予算表（現場名で突合）の7月列。
  '811-1': {
    active: true,
    id: '811-1', name: '福山通運 八千代支店 メニコン', areaId: 'kanto', prefecture: '千葉県',
    sales: { actual: 4044078, budget: 3952000 },
    cost: { actual: 2903307 },
    paidLeave: { actual: 98250 },
    opProfit: { actual: 562022 },
    monthlyBudget: budgetSeries(3952000, 3800000, 3800000, 3952000, 3800000, 3648000, 3952000, 3648000, 3800000, 3496000, 3496000, 3800000),
    salesYoyByMonth: budgetSeries(2923422, 2852963, 2740535, 2565959, 3011561, 3409905, 4087594, 3860975, 4609539, 3972974, 3874528, 4609974),
    staffCountByMonth: monthSeries3(26, 26, 26),
    totalHoursByMonth: monthSeries3(2138.75, 2030.50, 2083.75),
    staffCount: 25, totalHours: 2259.25, avgHours: 90.37,
    roleRates: [{ label: null, billingRate: 1790, payRate: 1310, profit: 480, marginRate: 26.8 }],
  },
  '116-1': {
    active: true,
    id: '116-1', name: 'PCS 関東（重工田町ビル）', areaId: 'kanto', prefecture: '東京都',
    sales: { actual: 666824, budget: 580000 },
    cost: { actual: 393680 },
    paidLeave: { actual: 10640 },
    opProfit: { actual: 123966 },
    monthlyBudget: budgetSeries(520000, 510000, 570000, 580000, 450000, 540000, 600000, 480000, 550000, 510000, 500000, 520000),
    salesYoyByMonth: budgetSeries(527904, 513240, 571896, 586560, 454584, 542568, 600308, 489411, 542568, 557232, 527904, 601224),
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(306.00, 271.50, 320.00),
    staffCount: 2, totalHours: 328.00, avgHours: 164.00,
    roleRates: [{ label: null, billingRate: 2033, payRate: 1330, profit: 703, marginRate: 34.6 }],
  },
  '115-1': {
    active: false,
    id: '115-1', name: 'PCS 関東（重工相模原）', areaId: 'kanto', prefecture: '神奈川県', lifecycle: '2026年7月より非稼働',
    sales: { actual: 0, budget: 350000 },
    cost: { actual: 0 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(290000, 270000, 350000, 350000, 250000, 300000, 340000, 290000, 300000, 320000, 290000, 350000),
    salesYoyByMonth: budgetSeries(708800, 599520, 909010, 1083250, 499380, 850570, 682080, 511560, 617120, 243600, 278110, 341040),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(136.00, 112.00, 16.00),
    roleRates: [{ label: null, billingRate: 0, payRate: null, profit: null, marginRate: null }],
  },
  '657-1': {
    active: true,
    id: '657-1', name: 'PCS 関東（重工丸の内）', areaId: 'kanto', prefecture: '東京都',
    sales: { actual: 649600, budget: 560000 },
    cost: { actual: 435500 },
    paidLeave: { actual: 10720 },
    opProfit: { actual: 103404 },
    monthlyBudget: budgetSeries(550000, 490000, 560000, 560000, 410000, 540000, 610000, 450000, 510000, 510000, 480000, 440000),
    salesYoyByMonth: budgetSeries(539340, 484160, 555360, 555360, 398720, 526880, 598080, 441440, 541120, 469920, 498400, 541120),
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(304.00, 256.00, 320.00),
    staffCount: 2, totalHours: 320.00, avgHours: 160.00,
    roleRates: [{ label: null, billingRate: 2030, payRate: 1340, profit: 690, marginRate: 34.0 }],
  },
  '715-1': {
    active: true,
    id: '715-1', name: 'PCS 関東（豊洲）', areaId: 'kanto', prefecture: '東京都',
    sales: { actual: 1493050, budget: 1190000 },
    cost: { actual: 991576 },
    paidLeave: { actual: 30400 },
    opProfit: { actual: 244593 },
    monthlyBudget: budgetSeries(1240000, 1130000, 1210000, 1190000, 1230000, 1390000, 1270000, 1100000, 1110000, 1100000, 1050000, 1150000),
    salesYoyByMonth: budgetSeries(1249113, 1135716, 1212101, 1193724, 1232991, 1393451, 1277206, 1106832, 1296240, 991885, 1039084, 1254645),
    staffCountByMonth: monthSeries3(3, 3, 3),
    totalHoursByMonth: monthSeries3(474.75, 396.58, 506.83),
    staffCount: 3, totalHours: 513.00, avgHours: 171.00,
    actionLog: [{ date: '2026-08', type: '横展開', text: '2026年8月3日付でBloomberg丸の内案件へ切替（案件コード未確定・暫定ID: bloomberg-marunouchi-1）' }],
  },
  '648-1': {
    active: true,
    id: '648-1', name: 'ネオヴィア・ロジ 相模原部品センター', areaId: 'kanto', prefecture: '神奈川県',
    sales: { actual: 800743, budget: 1000000 },
    cost: { actual: 543656 },
    paidLeave: { actual: 10800 },
    monthlyBudget: budgetSeries(900000, 900000, 1000000, 1000000, 720000, 880000, 1000000, 850000, 900000, 900000, 850000, 1000000),
    salesYoyByMonth: budgetSeries(1605793, 1406949, 1410253, 1569316, 996414, 1333691, 1004533, 881094, 978409, 905459, 905647, 1030612),
    opProfit: { actual: 159214 },
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(399.90, 332.42, 414.93),
    staffCount: 2, totalHours: 395.13, avgHours: 197.57,
    roleRates: [
      { label: '作業員', billingRate: 1850, payRate: 1350, profit: 500, marginRate: 27.0 },
      { label: 'リフト', billingRate: 2050, payRate: 1450, profit: 600, marginRate: 29.3 },
    ],
  },
  '835-1': placeholderSite('835-1', '有限会社黒岩運輸', 'kanto', { active: false, lifecycle: '失注（先方充足により契約に至らず）' }),
  'bloomberg-marunouchi-1': placeholderSite('bloomberg-marunouchi-1', 'Bloomberg 丸の内', 'kanto', {
    lifecycle: '案件コード未確定（暫定ID）。新規現場・2026年8月3日よりPCS豊洲（715-1）から切替で稼働開始',
  }),

  // ── 関東（2026年8月時点の職種別レート表・価格交渉状況シートで新たに判明した現場。案件コード未確定のため暫定ID） ──
  'fujisawa-1': {
    active: true,
    id: 'fujisawa-1', name: '福山通運 藤沢支店', areaId: 'kanto', prefecture: '神奈川県',
    lifecycle: '案件コード未確定（暫定ID）',
    sales: { actual: 0 },
    roleRates: [{ label: null, billingRate: 1750, payRate: 1271, profit: 479, marginRate: 27.4 }],
    negotiationStatus: '見送り',
    actionLog: [
      { date: '2026-08', type: '価格交渉', text: '同労賃対象。交渉決裂。資料提示10/27（作成済）、回答期限12/04（済）。資料: https://docs.google.com/presentation/d/1t8AtQY9zGac-9cOte0PF_YcLRDf6eGuDOVX20X_DF70/edit?slide=id.p#slide=id.p' },
    ],
  },
  'takizaki-1': {
    active: true,
    id: 'takizaki-1', name: 'タキザキロジスティクス 板橋HUBセンター', areaId: 'kanto', prefecture: '東京都',
    lifecycle: '案件コード未確定（暫定ID）。現状スタッフ0名',
    negotiationStatus: '未着手',
    actionLog: [
      { date: '2026-08', type: '価格交渉', text: '同労賃対象。交渉前。資料提示10/24（作成済）、済。アスクルのランサムウェア問題で今後の展開が見えない。現状スタッフも0名。' },
    ],
  },
  'jaylog-1': {
    active: true,
    id: 'jaylog-1', name: 'ジェイロジ イオン関東RDCセンター', areaId: 'kanto', prefecture: null,
    lifecycle: '案件コード未確定（暫定ID）。2026年3月現場終了予定',
    negotiationStatus: '見送り',
    actionLog: [
      { date: '2026-08', type: '価格交渉', text: '対象外。交渉決裂（作成済／済）。￥450円回答なし。11月中に返答・基本合意なし。12/3訪問→3月現場終了予定。' },
    ],
  },
  'meitetsu-saitama-1': {
    active: true,
    id: 'meitetsu-saitama-1', name: '名鉄運輸 埼玉支店', areaId: 'kanto', prefecture: '埼玉県',
    lifecycle: '案件コード未確定（暫定ID）。撤退対象（9月末撤退予定、有給3カ月按分）',
    actionLog: [
      { date: '2026-08', type: '価格交渉', text: '対象外。撤退対象。9月末撤退完了予定、有給3カ月で按分。' },
    ],
  },
  'mitsui-tsurumi-1': {
    active: true,
    id: 'mitsui-tsurumi-1', name: '三井物産流通グループ 常温鶴見センター（旧物産ロジ）', areaId: 'kanto', prefecture: '神奈川県',
    lifecycle: '案件コード未確定（暫定ID）。2026年3月終了予定',
    negotiationStatus: '見送り',
    actionLog: [
      { date: '2026-08', type: '価格交渉', text: '対象外。交渉決裂（作成済／済）。200円単価交渉決裂で撤退予定、今期中。12/4訪問→3月終了予定。' },
    ],
  },
  'sanwa-suisan-1': placeholderSite('sanwa-suisan-1', '三和水産加工センター 本社', 'kanto', { lifecycle: '案件コード未確定（暫定ID）。詳細情報なし' }),
  'lxpantos-1': {
    active: true,
    id: 'lxpantos-1', name: 'LX PANTOS Japan株式会社', areaId: 'kanto', prefecture: null,
    lifecycle: '案件コード未確定（暫定ID）。7月確定売上は突合ソース未提供のため未反映',
    roleRates: [{ label: null, billingRate: 2970, payRate: 2070, profit: 900, marginRate: 30.3 }],
  },

  // ── 中部 ──────────────────────────────────────────────
  // 7月実績は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月）のスクリーンショットより反映。
  // budgetは別途共有された月次予算表（現場名で突合、シート上のコードは不一致のため無視）の7月列。
  // 売上高は後日、確定数字（検索システム 対象年月2026年07月・人ソ（中部）画面）で上書き反映（2026/8/5）。
  '142-3': {
    active: true,
    id: '142-3', name: '福山通運 名古屋南流通センター', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 368661, budget: 350000 },
    cost: { actual: 260810 },
    paidLeave: { actual: 10160 },
    opProfit: { actual: 42249 },
    monthlyBudget: budgetSeries(350000, 300000, 300000, 350000, 300000, 330000),
    salesYoyByMonth: budgetSeries(350939, 350939, 336938, 371504, 289568, 312651, 373038, 313198, 337155, 317683, 306523, 349516),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(177.50, 146.75, 165.50),
    staffCount: 1, totalHours: 178.25, avgHours: 178.25,
    roleRates: [{ label: null, billingRate: 1750, payRate: 1270, profit: 480, marginRate: 27.4 }],
  },
  '548-1': {
    active: true,
    id: '548-1', name: '福山通運 東海支店（セリア）', areaId: 'chubu', prefecture: '愛知県',
    lifecycle: '2026年10月以降物量減少、最大12月末で現場終了の可能性（お盆明けにスタッフへ告知済み）。終了後もリフトマンのみ稼働継続予定',
    sales: { actual: 2216417, budget: 2200000 },
    cost: { actual: 1570455 },
    paidLeave: { actual: 94965 },
    opProfit: { actual: 376231 },
    monthlyBudget: budgetSeries(2450000, 2200000, 2200000, 2200000, 2200000, 2200000),
    salesYoyByMonth: budgetSeries(2720895, 2676926, 2436321, 2654557, 2255189, 2485878, 2295839, 2102241, 2394320, 2125118, 2072738, 2364164),
    staffCountByMonth: monthSeries3(17, 15, 15),
    totalHoursByMonth: monthSeries3(1212.75, 1226.75, 1137.50),
    staffCount: 16, totalHours: 1225.25, avgHours: 76.58,
    roleRates: [
      { label: 'セリア便①', billingRate: 1780, payRate: 1230, profit: 550, marginRate: 30.9 },
      { label: 'セリア便②', billingRate: 1900, payRate: 1300, profit: 600, marginRate: 31.6 },
    ],
    actionLog: [{ date: '2026-08', type: '課題', text: '10月以降物量減少により最大12月末で現場終了の可能性。12月末を価格交渉の合意期限とする。終了後もリフトマンのみ稼働継続予定' }],
  },
  '505-1': {
    active: true,
    id: '505-1', name: '岐阜アグリフーズ 本社・工場（食鳥部鶏肉加工課）', areaId: 'chubu', prefecture: '岐阜県',
    sales: { actual: 408455, budget: 420000 },
    cost: { actual: 286275 },
    paidLeave: { actual: 9760 },
    opProfit: { actual: 82960 },
    monthlyBudget: budgetSeries(400000, 404000, 450000, 420000, 414000, 456000),
    salesYoyByMonth: budgetSeries(420560, 457408, 447132, 348677, 394842, 391909, 472254, 472254, 439721, 403460, 351984, 326515),
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(226.85, 221.75, 219.30),
    staffCount: 2, totalHours: 231.87, avgHours: 115.94,
    roleRates: [
      { label: '加工課①', billingRate: 1740, payRate: 1220, profit: 520, marginRate: 29.9 },
      { label: '加工課②', billingRate: 1720, payRate: 1220, profit: 500, marginRate: 29.1 },
    ],
  },
  '675-1': { ...placeholderSite('675-1', 'AFS中部センター', 'chubu'), sales: { actual: 69600 }, staffCount: 1, totalHours: 35.60, avgHours: 35.60 },
  '510-2': {
    active: true,
    id: '510-2', name: 'afs 中部XD（派遣）', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 384939, budget: 300000 },
    cost: { actual: 236249 },
    paidLeave: { actual: 20800 },
    opProfit: { actual: 47768 },
    monthlyBudget: budgetSeries(300000, 300000, 300000, 300000, 300000, 300000),
    salesYoyByMonth: budgetSeries(663135, 615368, 637794, 654918, 426422, 354223, 363022, 374645, 371621, 320547, 328693, 278673),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(193.58, 170.02, 187.05),
    staffCount: 1, totalHours: 200.60, avgHours: 200.60,
    roleRates: [{ label: null, billingRate: 1880, payRate: 1300, profit: 580, marginRate: 30.9 }],
  },
  '790-1': {
    active: true,
    id: '790-1', name: '昭和冷蔵 小牧センター', areaId: 'chubu', prefecture: '愛知県',
    roles: [role('790-1', 'リフト'), role('790-2', '倉庫内仕分け作業')],
    sales: { actual: 3024466, budget: 2600000 },
    cost: { actual: 2193820 },
    paidLeave: { actual: 39200 },
    opProfit: { actual: 566064 },
    monthlyBudget: budgetSeries(2500000, 2500000, 2600000, 2600000, 2600000, 2600000),
    salesYoyByMonth: budgetSeries(2321484, 2332881, 2767859, 2461779, 2882392, 2832738, 3074571, 3005007, 3187568, 2919888, 2569444, 3098243),
    staffCountByMonth: monthSeries3(10, 11, 11),
    totalHoursByMonth: monthSeries3(1136.08, 969.08, 1188.00),
    staffCount: 13, totalHours: 1206.75, avgHours: 92.83,
    roleRates: [
      { label: '冷凍リーダー', billingRate: 2660, payRate: 1900, profit: 760, marginRate: 28.6 },
      { label: '冷凍サブリーダー', billingRate: 2580, payRate: 1850, profit: 730, marginRate: 28.3 },
      { label: '冷凍リフト', billingRate: 2500, payRate: 1800, profit: 700, marginRate: 28.0 },
      { label: '冷蔵リフト', billingRate: 2300, payRate: 1700, profit: 600, marginRate: 26.1 },
      { label: '冷蔵作業員', billingRate: 2000, payRate: 1500, profit: 500, marginRate: 25.0 },
    ],
  },
  '833-1': placeholderSite('833-1', '摂津倉庫株式会社 春日井営業所', 'chubu', {
    lifecycle: '新規現場',
    roles: [role('833-1', 'リフト', true), role('833-2', '作業員', true), role('833-3', '事務員', true)],
  }),
  '834-1': {
    active: true,
    id: '834-1', name: '昭和冷蔵 犬山ドライセンター', areaId: 'chubu', prefecture: '愛知県', lifecycle: '新規現場',
    sales: { actual: 997156, budget: 1200000 },
    cost: { actual: 716400 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 224652 },
    monthlyBudget: budgetSeries(null, null, 1200000, 1200000, 1200000, 1200000),
    staffCountByMonth: monthSeries3(1, 1, 2),
    totalHoursByMonth: monthSeries3(233.50, 235.00, 196.00),
    staffCount: 3, totalHours: 444.75, avgHours: 148.25,
    roleRates: [{ label: null, billingRate: 2200, payRate: 1600, profit: 600, marginRate: 27.3 }],
  },
  '038-1': {
    active: false,
    id: '038-1', name: '株式会社Rian Japan 中部物流センター', areaId: 'chubu', prefecture: '愛知県', lifecycle: '2026年5月末で契約終了',
    sales: { actual: 0, budget: 250000 },
    cost: { actual: 0 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(370000, 350000, 340000, 250000, 230000, 270000),
    salesYoyByMonth: budgetSeries(779875, 692875, 386875, 435500, 401875, 484250, 463750, 440625, 396125, 421550, 462177, 421550),
    staffCountByMonth: monthSeries3(1, 1, 0),
    totalHoursByMonth: monthSeries3(198.25, 59.00, 0),
  },
  '301-1': {
    active: true,
    id: '301-1', name: '昭和冷蔵 名古屋センター', areaId: 'chubu', prefecture: '愛知県',
    sales: { actual: 642197, budget: 300000 },
    cost: { actual: 442803 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 61831 },
    monthlyBudget: budgetSeries(400000, 300000, 350000, 300000, 300000, 300000),
    salesYoyByMonth: budgetSeries(0, 0, 0, 0, 0, 0, 0, 0, 0, 483754, 423441, 474066),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(202.75, 219.75, 214.00),
    staffCount: 1, totalHours: 237.25, avgHours: 237.25,
    roleRates: [{ label: null, billingRate: 2500, payRate: 1800, profit: 700, marginRate: 28.0 }],
  },
  // ↓ 2026年8月時点の職種別レート表・価格交渉状況シートで新たに判明した現場（案件コード未確定のため暫定ID）
  'logimedical-obu-1': {
    active: true,
    id: 'logimedical-obu-1', name: 'ロジメディカル 大府営業所', areaId: 'chubu', prefecture: '愛知県',
    lifecycle: '案件コード未確定（暫定ID）。撤退対象',
    roleRates: [{ label: null, billingRate: 1850, payRate: 1350, profit: 500, marginRate: 27.0 }],
    negotiationStatus: '見送り',
    actionLog: [{ date: '2026-08', type: '価格交渉', text: '対象外。撤退対象。' }],
  },
  'tokaizukemono-1': {
    active: true,
    id: 'tokaizukemono-1', name: '東海漬物株式会社 中京物流センター', areaId: 'chubu', prefecture: '愛知県',
    lifecycle: '案件コード未確定（暫定ID）。撤退対象',
    roleRates: [{ label: null, billingRate: 1750, payRate: 1270, profit: 480, marginRate: 27.4 }],
    negotiationStatus: '見送り',
    actionLog: [{ date: '2026-08', type: '価格交渉', text: '対象外。撤退対象。' }],
  },

  // ── 関西 ──────────────────────────────────────────────
  // 7月実績は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 人ソ関西）より反映。
  // budgetは月次予算表（現場名で突合）の7月列。
  // 売上高は後日、確定数字（検索システム 対象年月2026年07月・人ソ（関西）画面）で上書き反映（2026/8/5）。
  '543-3': {
    active: true,
    id: '543-3', name: 'フェリシモ エスパス（選別作業）', areaId: 'kansai', prefecture: '兵庫県',
    sales: { actual: 2721820, budget: 3000000 },
    cost: { actual: 1854110 },
    paidLeave: { actual: 74400 },
    opProfit: { actual: 542279 },
    monthlyBudget: budgetSeries(3000000, 2800000, 3000000, 3000000, 2800000, 3000000),
    salesYoyByMonth: budgetSeries(3998924, 3406797, 3722231, 3690344, 3010988, 4174596, 3481151, 3086883, 3517877, 3346630, 3178479, 3147507),
    roleRates: [{ label: '選別作業', billingRate: 1840, payRate: 1240, profit: 600, marginRate: 32.6 }],
    staffCountByMonth: monthSeries3(22, 20, 19),
    totalHoursByMonth: monthSeries3(1610.00, 1222.50, 1429.50),
    staffCount: 18, totalHours: 1479.25, avgHours: 82.18,
  },
  '543-4': {
    active: true,
    id: '543-4', name: 'フェリシモ エスパス（検品・箱入作業業務）', areaId: 'kansai', prefecture: '兵庫県',
    sales: { actual: 0, budget: 190000 },
    cost: { actual: 0 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(190000, 190000, 190000, 190000, 190000, 190000),
    salesYoyByMonth: budgetSeries(198240, 188505, 199125, 215940, 182310, 199125, 223020, 189390, 209745, 207975, 193815, 212400),
    staffCountByMonth: monthSeries3(1, 0, 1),
    totalHoursByMonth: monthSeries3(126.00, 0, 120.00),
  },
  '543-5': {
    active: true,
    id: '543-5', name: 'フェリシモ エスパス（伝票管理業務）', areaId: 'kansai', prefecture: '兵庫県',
    staffCountByMonth: monthSeries3(0, 1, 0),
    totalHoursByMonth: monthSeries3(0, 94.50, 0),
    salesYoyByMonth: budgetSeries(199125, 201780, 220365, 177443, 176115, 210630, 215055, 195585, 209745, 169920, 159300, 201780),
  },
  '595-1': {
    active: false,
    id: '595-1', name: '岡山県貨物運送 南港支店［リフト］', areaId: 'kansai', prefecture: null, lifecycle: '2026年6月末で契約終了',
    sales: { actual: 0, budget: 380000 },
    cost: { actual: 0 }, paidLeave: { actual: 0 }, opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(380000, 380000, 380000, 380000, 380000, 380000),
    salesYoyByMonth: budgetSeries(463313, 417113, 440213, 464626, 384042, 421052, 468565, 418426, 353727, 452694, 356354, 503488),
    roleRates: [{ label: null, billingRate: 0, payRate: null, profit: null, marginRate: null }],
    staffCountByMonth: monthSeries3(1, 1, 0),
    totalHoursByMonth: monthSeries3(188.00, 56.25, 0),
  },
  '136-1': {
    active: true,
    id: '136-1', name: '日生トーム 高槻事業所（軽作業）', areaId: 'kansai', prefecture: '大阪府',
    sales: { actual: 343070, budget: 380000 },
    cost: { actual: 357460 },
    paidLeave: { actual: 16470 },
    opProfit: { actual: 105277 },
    monthlyBudget: budgetSeries(380000, 250000, 380000, 380000, 380000, 380000),
    salesYoyByMonth: budgetSeries(436020, 282510, 470420, 505250, 430000, 482998, 427850, 433870, 351310, 185330, 244240, 255850),
    roleRates: [{ label: null, billingRate: 1820, payRate: 1220, profit: 600, marginRate: 33.0 }],
    staffCountByMonth: monthSeries3(3, 3, 3),
    totalHoursByMonth: monthSeries3(157.50, 169.00, 186.00),
    staffCount: 3, totalHours: 188.50, avgHours: 62.83,
  },
  '533-1': {
    active: true,
    id: '533-1', name: '任天堂販売 京都物流センター', areaId: 'kansai', prefecture: '京都府',
    roles: [role('533-1', 'リフト'), role('533-2', '軽作業')],
    sales: { actual: 932295, budget: 320000 },
    cost: { actual: 602325 },
    paidLeave: { actual: 15120 },
    opProfit: { actual: 179725 },
    monthlyBudget: budgetSeries(320000, 320000, 320000, 320000, 320000, 320000),
    salesYoyByMonth: budgetSeries(553015, 1618063, 1348105, 598803, 335406, 485266, 741206, 980269, 921767, 581878, 634071, 708067),
    roleRates: [
      { label: '軽作業', billingRate: 1830, payRate: 1260, profit: 570, marginRate: 31.1 },
      { label: 'フォークリフト', billingRate: 2170, payRate: 1530, profit: null, marginRate: null },
    ],
    staffCountByMonth: monthSeries3(3, 2, 3),
    totalHoursByMonth: monthSeries3(249.75, 188.00, 347.75),
    staffCount: 4, totalHours: 482.25, avgHours: 120.56,
  },
  '570-1': {
    active: true,
    id: '570-1', name: '加茂商事［軽作業］（株式会社マラカナ・加茂商事）', areaId: 'kansai', prefecture: null,
    sales: { actual: 606300, budget: 600000 },
    cost: { actual: 443334 },
    paidLeave: { actual: 21600 },
    opProfit: { actual: 78065 },
    monthlyBudget: budgetSeries(600000, 600000, 600000, 600000, 420000, 600000),
    salesYoyByMonth: budgetSeries(844832, 674851, 651073, 674103, 434280, 485266, 659763, 587032, 601600, 575634, 558244, 752950),
    roleRates: [{ label: null, billingRate: 1880, payRate: 1350, profit: 530, marginRate: 28.2 }],
    staffCountByMonth: monthSeries3(2, 2, 0),
    totalHoursByMonth: monthSeries3(374.00, 307.42, 0),
    staffCount: 2, totalHours: 316.50, avgHours: 158.25,
  },
  // budgetは「PCS関西（神戸富士ゼロックス）」、実績システムでは「PCS関西（BPOソリューション事業本部）」表記。同一現場として突合。
  '530-1': {
    active: true,
    id: '530-1', name: 'PCS 関西（神戸）［配達作業員］', areaId: 'kansai', prefecture: null,
    sales: { actual: 352800, budget: 250000 },
    cost: { actual: 122880 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 48271 },
    monthlyBudget: budgetSeries(250000, 250000, 250000, 250000, 250000, 250000),
    salesYoyByMonth: budgetSeries(293400, 288000, 245400, 341400, 240000, 309400, 256000, 261400, 309400, 288000, 245400, 341400),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(144.00, 128.00, 176.00),
    staffCount: 1, totalHours: 168.00, avgHours: 168.00,
    roleRates: [{ label: null, billingRate: 2100, payRate: 1280, profit: 820, marginRate: 39.0 }],
  },
  '723-1': {
    ...placeholderSite('723-1', '阪菱企業 茨木', 'kansai', { roles: [role('723-1', 'リフト'), role('723-2', '軽作業')] }),
    sales: { actual: 0 }, // 「阪菱企業 第一（6、7、8、15…）」行として突合（暫定）。要確認
    roleRates: [
      { label: 'フォークリフト', billingRate: 2100, payRate: 1520, profit: 580, marginRate: 27.6 },
      { label: '一般', billingRate: 1780, payRate: 1280, profit: 500, marginRate: 28.1 },
    ],
  },
  '815-1': {
    active: true,
    id: '815-1', name: '阪菱企業 西神現業所［軽作業］', areaId: 'kansai', prefecture: null,
    sales: { actual: 0, budget: 200000 },
    cost: { actual: 0 }, paidLeave: { actual: 0 }, opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(200000, 200000, 200000, 200000, 200000, 200000),
    salesYoyByMonth: budgetSeries(253880, 229011, 269015, 393684, 202628, 233335, 266420, 213872, 269670, 206035, 218050, 199360),
    staffCountByMonth: monthSeries3(1, 0, 0),
    totalHoursByMonth: monthSeries3(120.50, 0, 0),
    roleRates: [{ label: '一般', billingRate: 1780, payRate: 1280, profit: 500, marginRate: 28.1 }],
  },
  '753-1': {
    active: false,
    id: '753-1', name: 'ハウス物流サービス株式会社 伊丹［リフト］', areaId: 'kansai', prefecture: null, lifecycle: '2026年6月末で契約終了',
    sales: { actual: 0, budget: 350000 },
    cost: { actual: 0 }, paidLeave: { actual: 0 }, opProfit: { actual: 0 },
    monthlyBudget: budgetSeries(350000, 300000, 350000, 350000, 300000, 350000),
    salesYoyByMonth: budgetSeries(390382, 323832, 360155, 395014, 296900, 362214, 414016, 319280, 417648, 337552, 355968, 412944),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(220.00, 146.75, 184.25),
    roleRates: [{ label: '（現状データなし）', billingRate: 0, payRate: null, profit: null, marginRate: null }],
  },
  '801-1': {
    active: true,
    id: '801-1', name: 'コーナン商事 貝塚センター［リフト］', areaId: 'kansai', prefecture: null, lifecycle: '当月稼働ゼロ（社保等固定費のみ発生）',
    sales: { actual: 0, budget: 350000 },
    cost: { actual: 0 },
    paidLeave: { actual: 0 },
    opProfit: { actual: -42070 },
    monthlyBudget: budgetSeries(350000, 380000, 350000, 350000, 350000, 350000),
    salesYoyByMonth: budgetSeries(373147, 430408, 369432, 377012, 375684, 365831, 445718, 336545, 320967, 303529, 328822, 64966),
    staffCountByMonth: monthSeries3(0, 0, 0),
    totalHoursByMonth: monthSeries3(0, 0, 0),
    roleRates: [{ label: null, billingRate: 2130, payRate: 1500, profit: 630, marginRate: 29.6 }],
  },
  '633-1': {
    active: true,
    id: '633-1', name: '尾家産業 阪南支店（派遣）（ドライバー）', areaId: 'kansai', prefecture: null,
    sales: { actual: 339250, budget: 300000 },
    cost: { actual: 250862 },
    paidLeave: { actual: 35520 },
    opProfit: { actual: 12694 },
    monthlyBudget: budgetSeries(300000, 300000, 300000, 300000, 300000, 300000),
    salesYoyByMonth: budgetSeries(354593, 307210, 328942, 359697, 299845, 355540, 323598, 327754, 386653, 311365, 314811, 361835),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(194.25, 166.75, 178.25),
    staffCount: 1, totalHours: 165.25, avgHours: 165.25,
    roleRates: [{ label: null, billingRate: 2000, payRate: 1480, profit: 520, marginRate: 26.0 }],
  },
  '782-1': placeholderSite('782-1', 'SHUUEI物流 高槻センター［リフト］', 'kansai'),
  '606-3': placeholderSite('606-3', 'SHUUEI物流 枚方センター［リフト］短期', 'kansai'),
  '808-1': {
    active: true,
    id: '808-1', name: '西鉄運輸株式会社 枚方センター', areaId: 'kansai', prefecture: null,
    roles: [role('808-1', '軽作業'), role('808-2', '軽作業（短期）')],
    sales: { actual: 1546235, budget: 600000 },
    cost: { actual: 1100100 },
    paidLeave: { actual: 35440 },
    opProfit: { actual: 290134 },
    monthlyBudget: budgetSeries(600000, 550000, 600000, 600000, 600000, 600000),
    salesYoyByMonth: budgetSeries(882662, 764188, 745450, 656789, 640747, 575902, 600136, 853054, 1083884, 602636, 580467, 678154),
    staffCountByMonth: monthSeries3(2, 3, 5),
    totalHoursByMonth: monthSeries3(337.42, 403.50, 565.50),
    staffCount: 5, totalHours: 792.67, avgHours: 158.53,
    roleRates: [
      { label: 'リーダー（フォークリフト兼務）', billingRate: 2130, payRate: 1550, profit: 580, marginRate: 27.2 },
      { label: 'サブリーダー', billingRate: 1850, payRate: 1330, profit: 520, marginRate: 28.1 },
      { label: '作業員', billingRate: 1800, payRate: 1300, profit: 500, marginRate: 27.8 },
      { label: '作業員（短期）', billingRate: 1980, payRate: 1400, profit: 580, marginRate: 29.3 },
    ],
    actionLog: [{ date: '2026-08', type: '課題', text: '作業員（短期）区分は2026年8月15日で稼働終了予定' }],
  },
  '805-1': {
    active: true,
    id: '805-1', name: 'YSOロジ［リフト］（YSO Logi株式会社 神戸営業所）', areaId: 'kansai', prefecture: '兵庫県',
    sales: { actual: 426800, budget: 400000 },
    cost: { actual: 310400 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 55842 },
    monthlyBudget: budgetSeries(400000, 380000, 400000, 400000, 400000, 400000),
    salesYoyByMonth: budgetSeries(447000, 409250, 478775, 536525, 464475, 444400, 435050, 401500, 451275, 388850, 374000, 377025),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(211.50, 193.50, 184.50),
    staffCount: 1, totalHours: 211.00, avgHours: 211.00,
    roleRates: [{ label: 'フォークリフト', billingRate: 2200, payRate: 1600, profit: 600, marginRate: 27.3 }],
  },
  '720-1': {
    active: true,
    id: '720-1', name: 'HMKロジサービス 西神戸センター［軽作業］', areaId: 'kansai', prefecture: null,
    staffCountByMonth: monthSeries3(0, 0, 7),
    totalHoursByMonth: monthSeries3(0, 0, 214.00),
    staffCount: 7, totalHours: 408.50, avgHours: 58.36,
    salesYoyByMonth: budgetSeries(0, 0, 328440, 435120, 0, 0, 0, 549360, 726180, 0, 0, 0),
    roleRates: [{ label: '短期', billingRate: 1710, payRate: 1260, profit: 450, marginRate: 26.3 }],
    actionLog: [{ date: '2026-10', type: '横展開', text: 'お歳暮案件に向け採用・掘り起こし開始、11月始動予定（貴子さん担当、SO＋五十嵐さんが全面バックアップ）' }],
  },
  '828-1': {
    active: true,
    id: '828-1', name: '摂津倉庫 京田辺', areaId: 'kansai', prefecture: '京都府',
    roles: [role('828-1', '軽作業'), role('828-2', 'リフト')],
    sales: { actual: 731296, budget: 580000 },
    cost: { actual: 497557 },
    monthlyBudget: budgetSeries(580000, 560000, 580000, 580000, 580000, 580000),
    salesYoyByMonth: budgetSeries(0, 0, 0, 391200, 703694, 688521, 838547, 652449, 659518, 658337, 579870, 642716),
    staffCountByMonth: monthSeries3(2, 2, 2),
    totalHoursByMonth: monthSeries3(316.75, 267.75, 356.25),
    staffCount: 2, totalHours: 367.75, avgHours: 183.88,
    roleRates: [
      { label: 'リフト', billingRate: 2100, payRate: 1500, profit: 600, marginRate: 28.6 },
      { label: '一般', billingRate: 1800, payRate: 1300, profit: 500, marginRate: 27.8 },
    ],
  },
  '830-1': {
    active: true,
    id: '830-1', name: 'エヌエス物流 関西［軽作業］', areaId: 'kansai', prefecture: null,
    sales: { actual: 327793, budget: 270000 },
    cost: { actual: 216506 },
    monthlyBudget: budgetSeries(270000, 270000, 270000, 270000, 270000, 270000),
    salesYoyByMonth: budgetSeries(0, 0, 0, 67550, 402248, 403213, 388894, 395837, 439843, 419646, 353507, 295549),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(187.18, 182.12, 148.60),
    staffCount: 1, totalHours: 180.40, avgHours: 180.40,
    roleRates: [{ label: null, billingRate: 1800, payRate: 1260, profit: 540, marginRate: 30.0 }],
  },
  '831-1': {
    active: true,
    id: '831-1', name: 'エヌエス物流 滋賀［軽作業］', areaId: 'kansai', prefecture: '滋賀県',
    sales: { actual: 236140, budget: 850000 },
    cost: { actual: 162835 },
    monthlyBudget: budgetSeries(850000, 850000, 850000, 850000, 850000, 850000),
    salesYoyByMonth: budgetSeries(0, 0, 0, 0, 0, 73150, 511449, 646424, 644245, 285423, 433653, 635813),
    staffCountByMonth: monthSeries3(3, 3, 2),
    totalHoursByMonth: monthSeries3(343.28, 262.87, 171.05),
    staffCount: 2, totalHours: 127.63, avgHours: 63.82,
    roleRates: [{ label: null, billingRate: 1800, payRate: 1250, profit: 550, marginRate: 30.6 }],
  },
  '832-1': {
    active: true,
    id: '832-1', name: '西鉄運輸 加古川支店', areaId: 'kansai', prefecture: '兵庫県',
    roles: [
      role('832-1', '軽作業'), role('832-2', '事務'), role('832-3', 'リフト'),
      role('832-4a', 'ドライバー', true), role('832-4b', '短期作業員', true),
    ],
    sales: { actual: 594586, budget: 750000 },
    cost: { actual: 516665 },
    monthlyBudget: budgetSeries(750000, 750000, 750000, 750000, 750000, 750000),
    salesYoyByMonth: budgetSeries(0, 0, 0, 0, 0, 0, 0, 119700, 290664, 487725, 452250, 0),
    staffCountByMonth: monthSeries3(2, 3, 1),
    totalHoursByMonth: monthSeries3(207.42, 334.88, 120.92),
    staffCount: 3, totalHours: 293.42, avgHours: 97.81,
    roleRates: [
      { label: '作業員', billingRate: 1800, payRate: 1300, profit: 500, marginRate: 27.8 },
      { label: 'フォークリフト', billingRate: 2200, payRate: 1600, profit: 600, marginRate: 27.3 },
    ],
  },
  '836-1': {
    active: true,
    id: '836-1', name: 'HMKロジサービス 南港（レッドウッド南港）', areaId: 'kansai', prefecture: null,
    lifecycle: '新規現場', roles: [role('836-1', '軽作業', true), role('836-2', 'リフト', true)],
    staffCountByMonth: monthSeries3(null, null, 2),
    totalHoursByMonth: monthSeries3(null, null, 203.00),
    staffCount: 3, totalHours: 213.50, avgHours: 71.17,
    roleRates: [
      { label: '作業員　短期（RW・GLP共通）', billingRate: 1750, payRate: 1300, profit: 450, marginRate: 25.7 },
      { label: 'リフト　短期（RW・GLP共通）', billingRate: 2200, payRate: 1600, profit: 600, marginRate: 27.3 },
    ],
  },
  '836-3': {
    active: true,
    id: '836-3', name: 'HMKロジサービス 南港（GLP大阪）', areaId: 'kansai', prefecture: null,
    lifecycle: '新規現場', roles: [role('836-3', 'リフト', true), role('836-4', '軽作業（短期）', true)],
    staffCountByMonth: monthSeries3(null, null, 1),
    totalHoursByMonth: monthSeries3(null, null, 70.00),
    staffCount: 2, totalHours: 130.50, avgHours: 65.25,
    roleRates: [
      { label: '作業員　短期（RW・GLP共通）', billingRate: 1750, payRate: 1300, profit: 450, marginRate: 25.7 },
      { label: 'リフト　短期（RW・GLP共通）', billingRate: 2200, payRate: 1600, profit: 600, marginRate: 27.3 },
    ],
  },
  '837-1': placeholderSite('837-1', 'SHUUEI物流株式会社 尼崎センター（ロジポート尼崎）［軽作業］', 'kansai', { lifecycle: '新規現場' }),
  'ih-amagasaki-1': {
    ...placeholderSite('ih-amagasaki-1', 'IH（アイエイチロジ 尼崎）', 'kansai', { lifecycle: '案件コード未確定（暫定ID）。新規現場・お歳暮案件' }),
    actionLog: [
      { date: '2026-10', type: '横展開', text: 'お歳暮案件に向け採用・掘り起こし開始。貴子さん担当、SO＋五十嵐さんが全面バックアップ' },
      { date: '2026-11', type: '横展開', text: '2026年11月2日〜12月26日稼働予定。初日13名スタート、ストック作成後は1.5倍人員に増員予定' },
    ],
  },
  // 阪菱企業の配送センター/倉庫は損益書が個別に分かれているため、茨木(723-1)とは別現場として管理。
  '246-1': {
    active: true,
    id: '246-1', name: '阪菱企業 第二 5号配送センター', areaId: 'kansai', prefecture: null,
    sales: { actual: 274120, budget: 600000 },
    cost: { actual: 197120 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 49235 },
    monthlyBudget: budgetSeries(400000, 400000, 600000, 600000, 600000, 600000),
    salesYoyByMonth: budgetSeries(228901, 204574, 243282, 256040, 187598, 242200, 257122, 217548, 237297, 185120, 201697, 249757),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(122.50, 82.00, 145.00),
    staffCount: 1, totalHours: 154.00, avgHours: 154.00,
  },
  '285-1': {
    active: true,
    id: '285-1', name: '阪菱企業 第一 1号配送センター', areaId: 'kansai', prefecture: null,
    sales: { actual: 239299, budget: 200000 },
    cost: { actual: 177200 },
    paidLeave: { actual: 17920 },
    opProfit: { actual: 24939 },
    monthlyBudget: budgetSeries(200000, 200000, 200000, 200000, 200000, 200000),
    salesYoyByMonth: budgetSeries(0, 0, 0, 0, 157430, 217980, 226523, 205870, 199360, 204478, 209595, 240189),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(129.00, 126.00, 125.50),
    staffCount: 1, totalHours: 133.75, avgHours: 133.75,
  },
  '287-1': {
    active: true,
    id: '287-1', name: '阪菱企業 第一 2号配送センター', areaId: 'kansai', prefecture: null,
    sales: { actual: 244750, budget: 200000 },
    cost: { actual: 179200 },
    paidLeave: { actual: 17920 },
    opProfit: { actual: 25663 },
    monthlyBudget: budgetSeries(200000, 200000, 200000, 200000, 200000, 200000),
    salesYoyByMonth: budgetSeries(438556, 388603, 458883, 395848, 191708, 466455, 511542, 246743, 210708, 241747, 225283, 232958),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(141.75, 115.25, 147.00),
    staffCount: 1, totalHours: 137.50, avgHours: 137.50,
  },
  '288-1': {
    active: true,
    id: '288-1', name: '阪菱企業 第一 11号倉庫', areaId: 'kansai', prefecture: null,
    sales: { actual: 266667, budget: 200000 },
    cost: { actual: 188800 },
    paidLeave: { actual: 8960 },
    opProfit: { actual: 28845 },
    monthlyBudget: budgetSeries(200000, 200000, 200000, 200000, 200000, 200000),
    salesYoyByMonth: budgetSeries(227930, 220792, 245337, 258529, 192141, 0, 0, 148457, 227507, 230288, 222724, 249868),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(142.00, 113.25, 137.75),
    staffCount: 1, totalHours: 149.75, avgHours: 149.75,
  },
  '229-1': {
    active: true,
    id: '229-1', name: '阪菱企業 第三（12号倉庫）', areaId: 'kansai', prefecture: null,
    sales: { actual: 330750, budget: 250000 },
    cost: { actual: 239400 },
    paidLeave: { actual: 11400 },
    opProfit: { actual: 40827 },
    monthlyBudget: budgetSeries(250000, 250000, 250000, 250000, 250000, 250000),
    salesYoyByMonth: budgetSeries(328130, 307500, 322875, 322875, 233573, 246000, 341325, 261375, 275100, 299775, 285863, 330750),
    staffCountByMonth: monthSeries3(1, 1, 1),
    totalHoursByMonth: monthSeries3(150.00, 127.50, 166.25),
    staffCount: 1, totalHours: 157.50, avgHours: 157.50,
  },

  // ── 大阪支店 ──────────────────────────────────────────
  '133-1': {
    active: true,
    id: '133-1', name: '福山通運 大阪支店', areaId: 'osaka', prefecture: '大阪府',
    roles: [role('133-1', '日勤'), role('133-2', '夜勤')],
    // 7月実績は自社システム「LogI P Core」実績一覧（対象年月: 2026年07月, 人ソ関西内の大阪支店行）より反映。
    sales: { actual: 22013346, budget: 21570000 },
    cost: { actual: 12288918 },
    paidLeave: { actual: 0 },
    opProfit: { actual: 2883072 },
    monthlyBudget: budgetSeries(21060000, 20040000, 20550000, 21570000, 19530000, 20550000),
    salesYoyByMonth: budgetSeries(23097206, 21615148, 21429849, 23434610, 21100851, 22510499, 23730715, 21052315, 23427926, 20522802, 19298448, 22238269),
    roleRates: [
      { label: '日勤', billingRate: 1950, payRate: 1338, profit: 612, marginRate: 31.4 },
      { label: '夜勤', billingRate: 2020, payRate: 1344, profit: 676, marginRate: 33.5 },
      { label: 'リーダー日勤', billingRate: 2200, payRate: 1720, profit: 480, marginRate: 21.8 },
      { label: 'リーダー夜勤', billingRate: 2200, payRate: 1647, profit: 553, marginRate: 25.1 },
      { label: 'フォークリフト', billingRate: 2100, payRate: 1447, profit: 653, marginRate: 31.1 },
    ],
    staffCountByMonth: monthSeries3(78, 74, 79),
    totalHoursByMonth: monthSeries3(10741.43, 9365.45, 10180.95),
    staffCount: 76, totalHours: 10100.08, avgHours: 132.90,
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

// 現場積み上げの月次予算データがある月。関東は10-3月まで、他エリアは9月までのため、
// sumSiteBudgetForMonthが0を返す月（データが無い）は自動集計せず既存の概算値のままにする。
export const BUDGET_AGGREGATE_MONTHS: MonthKey[] = MONTHS.filter((m) => m !== '4月実績' && m !== '5月実績' && m !== '6月進捗');
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
export function effectiveTotalHours(site: SiteData, overrides: Record<string, any>): number | null {
  const ov = overrides?.[site.id];
  const raw = ov?.totalHours != null && ov.totalHours !== '' ? ov.totalHours : site.totalHours;
  const n = raw != null ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}
export function sumAreaStaff(areaId: string, overrides: Record<string, any>): { sum: number; filled: number; total: number; hoursSum: number; hoursFilled: number } {
  const sites = sitesOfArea(areaId);
  let sum = 0, filled = 0, hoursSum = 0, hoursFilled = 0;
  for (const s of sites) {
    const v = effectiveStaffCount(s, overrides);
    if (v != null) { sum += v; filled++; }
    const h = effectiveTotalHours(s, overrides);
    if (h != null) { hoursSum += h; hoursFilled++; }
  }
  return { sum, filled, total: sites.length, hoursSum, hoursFilled };
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
// 「営業利益」は本部費配賦後の正式な値で現場側データには無いため、粗利益②(opProfit)を
// フォールバックさせない（粗利②と営業利益は別物のため混同を避ける）。
const SUMMARY_FALLBACK: Record<string, keyof Pick<SiteData, 'sales' | 'cost' | 'paidLeave' | 'opProfit'>> = {
  '売上高': 'sales',
  '売上原価': 'cost',
  '有給': 'paidLeave',
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
