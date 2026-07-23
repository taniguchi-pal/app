# ダッシュボード共有保存基盤セットアップ（Google Sheets連携）

チーム全員で共有・編集できるよう、Googleスプレッドシート + Google Apps Script（Web Appとして公開）を
シンプルなAPI代わりに使います。ダッシュボードの主要項目（予実管理・KPI・現場損益・採用進捗・スケジュール・
アタックリストなど）をなるべく「管轄」単位でまとめ、以下の9枚のシートに集約しています。

1. **KPI**: 全社・エリア別の予実管理・KPI進捗・営業パイプライン・SO管理指標・トピックス（月次）
2. **SiteMonthly**: 現場別の月次実績（損益書・稼働人数・総工数・募集費）
3. **SiteOverrides**: 現場カルテの手入力項目（担当Sales/SO・価格交渉ステータス・当月の配置人数など、常に「現在値」）
4. **RecruitingHistory**: 現場ごとの掲載履歴・アクション履歴（価格交渉・コンタクト・横展開・課題）
5. **WeeklyRecruiting**: 週次の応募対応（1週目〜4週目、募集費・応募数・入職数・退職数）
6. **Schedule**: 年間スケジュール・単月タスクの追加/管理
7. **AttackList**: 営業アタックリスト（テレアポ・コンタクト履歴、Sales専用の営業活動管理）
8. **Projects**: ダッシュボード大元「トピックス・プロジェクト」の参照URL
9. **NewSites**: 新規現場の一覧（案件番号つき）。コードを直さなくてもエリアページに一覧表示されます

> **KPIとSiteMonthlyの2枚が今回の新規追加分です。** それ以外は既存の仕組みのままなので、
> 先に一部だけ設定して段階的に増やしていくこともできます。

## 1. スプレッドシートを作成

新しいGoogleスプレッドシートを1つ作成し、以下の9枚のシートを作ってください（シート名は正確に）。

### シート `KPI`（1行目ヘッダー）— 全社・エリア別 予実管理・KPI進捗
```
scope	month	salesBudget	salesActual	salesForecast	yoyLastYear	gpBudget	gpActual	gpForecast	opBudget	opActual	activeStaff	targetStaff	siteCount	totalHours	avgHours	joined	resigned	orderBacklog	backlogStackupPotential	heat	funnelMeetings	funnelProposals	funnelEstimates	funnelOrders	soRecruitingCost	soApplicantUnitCost	soValidResourceUnitCost	soHireUnitCost	soTotalApplicants	soValidApplicants	soValidResources	soCandidates	soHires	soMidMonthResignations	soEndMonthResignations	soOvertimeExcessCount	soDailyAbsenceRate	topics	updatedAt
```
- `scope` は `company` / `kanto` / `chubu` / `kansai` / `osaka` のいずれか。1行 = 1つの `scope` × `month`
- `month` は `4月実績`〜`3月予定`（アプリ内の表記と揃えてください。4-6月は既に確定値があるため通常は7月以降を入力）
- 予算・実績・見通し: `salesBudget`/`salesActual`/`salesForecast`（見通し）/`yoyLastYear`（前年同月）/
  `gpBudget`/`gpActual`/`gpForecast`（粗利②）/`opBudget`/`opActual`（営業利益、companyのみ想定）
- KPI進捗: `activeStaff`（稼働人数）/`targetStaff`（目標人数、companyのみ）/`siteCount`（稼働現場数）/
  `totalHours`（総工数h）/`avgHours`（1人当たり工数h）/`joined`（入職）/`resigned`（退職）
  - 1人当たり売上・1顧客当たり売上はアプリ側で `salesActual ÷ activeStaff` / `salesActual ÷ siteCount` から自動計算するため、シートへの入力は不要です
- 受注残: `orderBacklog`（未充足人数）/`backlogStackupPotential`（全充足時の積上可能金額）
- `heat`: 熱中症警戒レベルなどの短いテキスト（任意）
- 営業パイプライン: `funnelMeetings`（新規商談）/`funnelProposals`（提案）/`funnelEstimates`（見積）/`funnelOrders`（受注）
- SO管理KPI（採用・稼働管理）: `so`で始まる13項目（募集費・応募単価・有効リソース単価・入職単価・総応募者数・
  有効応募数・有効リソース数・候補者数・入職者数・月内退職者数・月末退職者数・残業超過人数・当日欠勤率）
- `topics`: その月のトピックス。1セル内で改行して1行1トピックとして入力（アプリ側で改行分割して箇条書き表示）

### シート `SiteMonthly`（1行目ヘッダー）— 現場別 月次実績・損益書
```
siteId	month	salesActual	salesBudget	cost	paidLeave	opProfit	staffCount	totalHours	recruitingCostSpent	recruitingCostBudget	updatedAt
```
- `siteId` は現場の案件コード、`month` は対象月（`4月実績`〜`3月予定`）。1行 = 1つの `siteId` × `month`
- `salesActual`/`salesBudget`（売上）・`cost`（原価）・`paidLeave`（有給）・`opProfit`（営業利益/粗利益2）が損益書の主要項目
- `staffCount`（配置人数）・`totalHours`（総工数）はその月の確定値（過去月のアーカイブ用）
- `recruitingCostSpent`/`recruitingCostBudget`（募集費の実績・予算）
- **SiteOverridesとの違い**: SiteMonthlyは「月ごとに確定した実績のアーカイブ」（過去月も含めて何行でも追加可）、
  SiteOverridesは「現在進行中の月の生きた値」（現場1件につき1行のみ、SOが週次で更新）という役割分担です

### シート `SiteOverrides`（1行目ヘッダー）— 現場カルテの手入力項目（常に現在値）
```
siteId	salesRep	soRep	negotiationStatus	recruitingActive	recruitingCostSpent	recruitingCostBudget	postingPeriod	staffCount	totalHours	updatedAt
```
- `staffCount` はSOが入職・退職を反映するたびに更新する現場の配置人数。現場カルテの「配置人数」表示に即反映されます
- `totalHours` はSOが週次で更新する現場の総工数。配置人数とあわせて1人当たり工数を自動算出します
  （エリア・全社の稼働人数・平均工数は、その月にまだ手動確定値が無い場合に限り、現場の入力値から自動集計されます。
  4-7月など既に確定値がある月は上書きされません）

### シート `RecruitingHistory`（1行目ヘッダー）— 現場ごとの掲載履歴・アクション履歴
```
id	siteId	logType	postingPeriod	costSpent	costBudget	adUrl	actionType	date	text	note	createdAt
```
- `logType` は `posting`（掲載履歴）または `action`（価格交渉・コンタクト・横展開・課題のアクション履歴）
- `logType=posting` のとき: `postingPeriod`（掲載期間）・`costSpent`/`costBudget`（募集費）・`adUrl`（求人原稿URL）を入力
- `logType=action` のとき: `actionType`（`価格交渉`/`コンタクト`/`横展開`/`課題`のいずれか）・`date`（実施日）・`text`（内容）を入力
- `siteId` は現場の案件コード。現場カルテの「掲載履歴」に自動的に絞り込んで表示されます（`logType=action`のアクション履歴表示は今後のアップデートで対応予定）
- 「担当者・募集状況」カードの掲載中チェック・当月の募集費（進捗）は引き続きSiteOverridesシート側で管理し、
  RecruitingHistoryは掲載・アクションが発生するごとに追加していく履歴ログという位置づけです

### シート `WeeklyRecruiting`（1行目ヘッダー）— 週次の応募対応
```
id	areaId	assignee	month	weekOfMonth	recruitingCost	applicants	hires	resignations	createdAt
```
- `areaId` は `kanto` / `chubu` / `kansai` / `osaka`
- `assignee` は `田中`/`谷口`/`岩田`/`山口`/`五十嵐`/`貴子`（任意入力）
- `month` はダッシュボードの月表記（例: `7月進捗` `8月予定`）。ダッシュボードで選択中の月のデータだけが表に表示されます
- `weekOfMonth` はその月の第何週か（`1`〜`4`）。ダッシュボード側で「1週目」のように表示されます。
  大阪支店など週次で数字が拾えない現場は `0` を入れると「月次まとめ」として月1行で入力できます
- `recruitingCost`（募集費）・`applicants`（応募数）・`hires`（入職数）・`resignations`（退職数）は件数・金額の入力値
- 純増数（入職数－退職数）・応募単価（募集費÷応募数）・入職単価（募集費÷入職数）はアプリ側で自動計算されるため、シートには入力不要です

### シート `Schedule`（1行目ヘッダー）— 年間・単月スケジュール／タスク
```
id	title	period	status	note	area	site	assignee	createdAt
```
- `status` は `未着手` / `進行中` / `完了` を想定
- `area` は `kanto` / `chubu` / `kansai` / `osaka`、`site` は現場の案件コード、`assignee` は `田中`/`谷口`/`岩田`/`山口`/`五十嵐`/`貴子` を想定（いずれも任意入力）
- `period`（例:「7月末」）から月を判定し、年間スケジュール（Q1〜Q4）の月別詳細に自動表示されます

### シート `AttackList`（1行目ヘッダー）— 営業アタックリスト・コンタクト履歴
```
id	company	area	status	probability	salesRep	repContact	linkedSiteId	nextVisitDate	lastContactDate	telAppoCount	quoteUrl	notebookLmUrl	asanaUrl	minutesUrl	needsIssues	escalatedTo	notes	contactLogJson	createdAt	updatedAt
```
- `status` は `初商談` / `ニーズなし定期タッチ` / `見積提示` / `成約` / `稼働中` / `非稼働中` を想定
- `probability`（商談確度）は `A` / `B` / `C` / `D` を想定
- `repContact` は先方担当者名・連絡先（電話番号やメールなど自由記述）
- `linkedSiteId` は成約済みで既存の現場マスタ（案件コード）と紐づける場合に設定。設定すると現場カルテ側にコンタクト履歴とステータスが連動表示されます
- `quoteUrl` / `notebookLmUrl` / `asanaUrl` / `minutesUrl` はそれぞれ見積書・NotebookLM・Asana・議事録へのリンクURL
- `needsIssues` は先方の課題・ニーズの自由記述、`escalatedTo` はどこ（誰）へ連携したかの自由記述
- `contactLogJson` は訪問・TEL・メールのコンタクト履歴を `[{"datetime":"2026-07-01T10:30","method":"TEL","content":"..."}]` のようなJSON文字列でそのまま保存（アプリ側でパースします）

### シート `Projects`（1行目ヘッダー）— トピックス・プロジェクトの参照URL
```
projectId	url	note	updatedAt
```
- `projectId` は `fukuyama` / `palmee` / `so-flow` / `ai-agent` の4つ（アプリ側に固定表示される4プロジェクトに対応）
- `url` はGoogleドライブ・AIツールなどの参照リンク、`note` は自由記述の補足メモ

### シート `NewSites`（1行目ヘッダー）— 新規現場の一覧
```
siteId	name	areaId	prefecture	lifecycle	note	createdAt
```
- `siteId` は案件番号（既存の現場マスタと重複しないもの）
- `areaId` は `kanto` / `chubu` / `kansai` / `osaka`
- ここに追加した現場は、該当エリアページの現場一覧の下に「新規現場（スプレッドシート管理）」として
  自動的に表示されます。損益・稼働人数などの実データが揃った段階で、通常の現場マスタ（コード）に
  昇格させる運用を想定しています

## 2. Apps Scriptを設置

スプレッドシートのメニューから「拡張機能」→「Apps Script」を開き、`Code.gs` の中身を全部消して以下を貼り付けてください。

```javascript
const SHEETS = {
  kpi: {
    name: 'KPI', key: 'compositeKey',
    headers: [
      'scope', 'month', 'salesBudget', 'salesActual', 'salesForecast', 'yoyLastYear',
      'gpBudget', 'gpActual', 'gpForecast', 'opBudget', 'opActual',
      'activeStaff', 'targetStaff', 'siteCount', 'totalHours', 'avgHours', 'joined', 'resigned',
      'orderBacklog', 'backlogStackupPotential', 'heat',
      'funnelMeetings', 'funnelProposals', 'funnelEstimates', 'funnelOrders',
      'soRecruitingCost', 'soApplicantUnitCost', 'soValidResourceUnitCost', 'soHireUnitCost',
      'soTotalApplicants', 'soValidApplicants', 'soValidResources', 'soCandidates', 'soHires',
      'soMidMonthResignations', 'soEndMonthResignations', 'soOvertimeExcessCount', 'soDailyAbsenceRate',
      'topics', 'updatedAt',
    ],
  },
  sitemonthly: {
    name: 'SiteMonthly', key: 'compositeKey',
    headers: ['siteId', 'month', 'salesActual', 'salesBudget', 'cost', 'paidLeave', 'opProfit', 'staffCount', 'totalHours', 'recruitingCostSpent', 'recruitingCostBudget', 'updatedAt'],
  },
  overrides: {
    name: 'SiteOverrides', key: 'siteId',
    headers: ['siteId', 'salesRep', 'soRep', 'negotiationStatus', 'recruitingActive', 'recruitingCostSpent', 'recruitingCostBudget', 'postingPeriod', 'staffCount', 'totalHours', 'updatedAt'],
  },
  recruitinghistory: {
    name: 'RecruitingHistory', key: 'id',
    headers: ['id', 'siteId', 'logType', 'postingPeriod', 'costSpent', 'costBudget', 'adUrl', 'actionType', 'date', 'text', 'note', 'createdAt'],
  },
  weeklyrecruiting: {
    name: 'WeeklyRecruiting', key: 'id',
    headers: ['id', 'areaId', 'assignee', 'month', 'weekOfMonth', 'recruitingCost', 'applicants', 'hires', 'resignations', 'createdAt'],
  },
  schedule: {
    name: 'Schedule', key: 'id',
    headers: ['id', 'title', 'period', 'status', 'note', 'area', 'site', 'assignee', 'createdAt'],
  },
  attacklist: {
    name: 'AttackList', key: 'id',
    headers: ['id', 'company', 'area', 'status', 'probability', 'salesRep', 'repContact', 'linkedSiteId', 'nextVisitDate', 'lastContactDate', 'telAppoCount', 'quoteUrl', 'notebookLmUrl', 'asanaUrl', 'minutesUrl', 'needsIssues', 'escalatedTo', 'notes', 'contactLogJson', 'createdAt', 'updatedAt'],
  },
  projects: {
    name: 'Projects', key: 'projectId',
    headers: ['projectId', 'url', 'note', 'updatedAt'],
  },
  newsites: {
    name: 'NewSites', key: 'siteId',
    headers: ['siteId', 'name', 'areaId', 'prefecture', 'lifecycle', 'note', 'createdAt'],
  },
};

// 一覧（配列）で返すシート。それ以外はキーで引けるオブジェクトで返す。
const ARRAY_SHEETS = ['schedule', 'attacklist', 'recruitinghistory', 'newsites', 'weeklyrecruiting', 'sitemonthly'];
// scope/siteId + month の複合キーを使うシート。
const COMPOSITE_SHEETS = ['kpi', 'sitemonthly'];

function getSheetConfig(key) {
  return SHEETS[key] || SHEETS.overrides;
}

function doGet(e) {
  const which = (e.parameter && e.parameter.sheet) || 'overrides';
  const cfg = getSheetConfig(which);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.name);
  const rows = sheet.getDataRange().getValues();

  if (ARRAY_SHEETS.indexOf(which) !== -1) {
    const list = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;
      const obj = {};
      cfg.headers.forEach((h, idx) => { obj[h] = row[idx]; });
      list.push(obj);
    }
    return ContentService.createTextOutput(JSON.stringify(list)).setMimeType(ContentService.MimeType.JSON);
  }

  // overrides / kpi / projects はキーで引けるオブジェクトで返す
  const data = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    cfg.headers.forEach((h, idx) => { obj[h] = row[idx]; });
    const rowKey = which === 'kpi' ? `${row[0]}__${row[1]}` : row[0];
    if (!rowKey) continue;
    data[rowKey] = obj;
  }
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const which = body.sheet || 'overrides';
  const cfg = getSheetConfig(which);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.name);
  const rows = sheet.getDataRange().getValues();

  let rowKey;
  if (which === 'kpi') {
    if (!body.scope || !body.month) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'scope and month are required' })).setMimeType(ContentService.MimeType.JSON);
    }
    rowKey = (r) => r[0] === body.scope && r[1] === body.month;
  } else if (which === 'sitemonthly') {
    if (!body.siteId || !body.month) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'siteId and month are required' })).setMimeType(ContentService.MimeType.JSON);
    }
    rowKey = (r) => r[0] === body.siteId && r[1] === body.month;
  } else if (which === 'schedule') {
    if (!body.id) body.id = 'task_' + new Date().getTime();
    rowKey = (r) => r[0] === body.id;
  } else if (which === 'attacklist') {
    if (!body.id) body.id = 'attack_' + new Date().getTime();
    rowKey = (r) => r[0] === body.id;
  } else if (which === 'recruitinghistory') {
    if (!body.id) body.id = 'rec_' + new Date().getTime();
    rowKey = (r) => r[0] === body.id;
  } else if (which === 'weeklyrecruiting') {
    if (!body.id) body.id = 'wr_' + new Date().getTime();
    rowKey = (r) => r[0] === body.id;
  } else if (which === 'projects') {
    if (!body.projectId) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'projectId is required' })).setMimeType(ContentService.MimeType.JSON);
    }
    rowKey = (r) => r[0] === body.projectId;
  } else if (which === 'newsites') {
    if (!body.siteId) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'siteId is required' })).setMimeType(ContentService.MimeType.JSON);
    }
    rowKey = (r) => r[0] === body.siteId;
  } else {
    if (!body.siteId) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'siteId is required' })).setMimeType(ContentService.MimeType.JSON);
    }
    rowKey = (r) => r[0] === body.siteId;
  }

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rowKey(rows[i])) { rowIndex = i + 1; break; }
  }
  const newRow = cfg.headers.map((h) => {
    if (h === 'updatedAt') return new Date().toISOString();
    if (h === 'createdAt' && rowIndex === -1) return new Date().toISOString();
    if (h === 'createdAt') return rows[rowIndex - 1][cfg.headers.indexOf('createdAt')];
    return body[h] !== undefined ? body[h] : '';
  });
  if (rowIndex === -1) {
    sheet.appendRow(newRow);
  } else {
    sheet.getRange(rowIndex, 1, 1, cfg.headers.length).setValues([newRow]);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true, id: body.id })).setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Web Appとして公開

1. Apps Scriptエディタ右上「デプロイ」→「新しいデプロイ」
2. 種類の選択で「ウェブアプリ」を選択
3. 「アクセスできるユーザー」を **全員**（社内共有アプリなのでURLを知っていれば書き込めます。もし限定したい場合は要相談）に設定
4. デプロイすると発行される **ウェブアプリURL**（`https://script.google.com/macros/s/xxxx/exec` の形式）をコピー

スプレッドシートの列やシート構成を後から変更した場合は、Apps Scriptを保存し直すだけでOKです（再デプロイ不要、ただし「デプロイを管理」→「編集」→バージョンを「新バージョン」にすると確実です）。

## 4. アプリ側に設定

プロジェクト直下の `.env.local`（無ければ新規作成）に以下を追加してください（実際のURLに置き換え）：

```
SITE_OVERRIDES_API_URL=https://script.google.com/macros/s/xxxx/exec
```

Vercel本番にも同じ環境変数を追加してください（Vercelダッシュボード → Project Settings → Environment Variables）。

## 5. 現在の反映状況（重要）

このドキュメントはシート設計とAPI疎通までを整えるためのものです。項目によって、アプリ側の画面への反映状況が異なります。

| シート | 読み書きAPI | 画面への反映 |
|---|---|---|
| SiteOverrides | `/api/site-overrides` | ✅ 反映済み（配置人数・工数・担当・価格交渉ステータス・募集状況） |
| WeeklyRecruiting | `/api/weekly-recruiting` | ✅ 反映済み（週次応募対応カード） |
| Schedule | `/api/schedule` | ✅ 反映済み（タスク管理・年間スケジュール月別詳細） |
| AttackList | `/api/attack-list` | ✅ 反映済み（アタックリストページ） |
| RecruitingHistory（`logType=posting`） | `/api/recruiting-history` | ✅ 反映済み（現場カルテの掲載履歴） |
| Projects | `/api/projects` | ✅ 反映済み（トピックス・プロジェクトの参照URL） |
| NewSites | `/api/new-sites` | ✅ 反映済み（エリアページの新規現場一覧） |
| KPI（`scope`×`month`） | `/api/monthly-data` | 🟡 一部反映（7月以降の salesBudget/salesActual/gpBudget/gpActual/opBudget/opActual/activeStaff/avgHours/joined/resigned/siteCount/heat のみ）。今回追加した salesForecast/yoyLastYear/gpForecast/targetStaff/totalHours/orderBacklog/backlogStackupPotential/funnel系/so系/topics 列は次のアップデートで画面に反映します |
| SiteMonthly | `/api/site-monthly`（新設） | ⬜ 未反映（API疎通のみ）。現場の月次損益を確定値としてアーカイブするための新しい仕組みで、現場カルテの表示に組み込むのは次のアップデートで対応します |

スプレッドシートを作成いただいたら、まずURLを教えてください。疎通確認と合わせて、🟡・⬜の項目を優先順位を聞きながら順次アプリに反映していきます。
