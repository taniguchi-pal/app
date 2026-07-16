# ダッシュボード共有保存基盤セットアップ（Google Sheets連携）

以下の3つをチーム全員で共有・編集できるよう、Googleスプレッドシート + Google Apps Script（Web Appとして公開）を
シンプルなAPI代わりに使います。

1. **SiteOverrides**: 現場カルテの手入力項目（担当Sales/SO・価格交渉ステータス・募集状況）
2. **MonthlyData**: 7月以降の月次実績・予算・稼働人数など（4〜6月は確定値なのでアプリ内に固定値のまま）
3. **Schedule**: 年間スケジュール・タスクの追加/管理
4. **AttackList**: 営業アタックリスト（テレアポ・コンタクト履歴、Sales専用の営業活動管理）
5. **RecruitingHistory**: 現場ごとの掲載履歴（募集費・原稿URL）
6. **Projects**: ダッシュボード大元「トピックス・プロジェクト」の参照URL

## 1. スプレッドシートを作成

新しいGoogleスプレッドシートを1つ作成し、以下の6枚のシートを作ってください（シート名は正確に）。

### シート `SiteOverrides`（1行目ヘッダー）
```
siteId	salesRep	soRep	negotiationStatus	recruitingActive	recruitingCostSpent	recruitingCostBudget	postingPeriod	staffCount	totalHours	updatedAt
```
- `staffCount` はSOが入職・退職を反映するたびに更新する現場の配置人数。現場カルテの「配置人数」表示に即反映されます
- `totalHours` はSOが週次で更新する現場の総工数。配置人数とあわせて1人当たり工数を自動算出します
  （エリア・全社の稼働人数・平均工数は、その月にまだ手動確定値が無い場合に限り、現場の入力値から自動集計されます。
  4-7月など既に確定値がある月は上書きされません）

### シート `MonthlyData`（1行目ヘッダー）
```
scope	month	salesBudget	salesActual	gpBudget	gpActual	opBudget	opActual	activeStaff	avgHours	joined	resigned	siteCount	heat	updatedAt
```
- `scope` は `company` / `kanto` / `chubu` / `kansai` / `osaka` のいずれか
- `month` は `7月予定` `8月予定` `9月予定` `10月予定` `11月予定` `12月予定` `1月予定` `2月予定` `3月予定` のいずれか（アプリ内の表記と揃えてください）
- 1行 = 1つの `scope` × `month` の組み合わせ。入力した行だけアプリに反映され、未入力の月はプレースホルダー予算のままになります

### シート `Schedule`（1行目ヘッダー）
```
id	title	period	status	note	area	site	assignee	createdAt
```
- `status` は `未着手` / `進行中` / `完了` を想定
- `area` は `kanto` / `chubu` / `kansai` / `osaka`、`site` は現場の案件コード、`assignee` は `田中`/`谷口`/`岩田`/`山口`/`五十嵐`/`貴子` を想定（いずれも任意入力）

### シート `AttackList`（1行目ヘッダー）
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

### シート `RecruitingHistory`（1行目ヘッダー）
```
id	siteId	postingPeriod	costSpent	costBudget	adUrl	note	createdAt
```
- `siteId` は現場の案件コード。現場カルテの「掲載履歴」に自動的に絞り込んで表示されます
- `adUrl` は求人原稿のURL。現場カルテからクリックで開けます
- 「担当者・募集状況」カードの掲載中チェック・当月の募集費（進捗）は引き続きSiteOverridesシート側で管理し、
  RecruitingHistoryは掲載が終わるごとに追加していく履歴ログという位置づけです

### シート `Projects`（1行目ヘッダー）
```
projectId	url	note	updatedAt
```
- `projectId` は `fukuyama` / `palmee` / `so-flow` / `ai-agent` の4つ（アプリ側に固定表示される4プロジェクトに対応）
- `url` はGoogleドライブ・AIツールなどの参照リンク、`note` は自由記述の補足メモ

## 2. Apps Scriptを設置

スプレッドシートのメニューから「拡張機能」→「Apps Script」を開き、`Code.gs` の中身を全部消して以下を貼り付けてください。

```javascript
const SHEETS = {
  overrides:  { name: 'SiteOverrides', key: 'siteId', headers: ['siteId', 'salesRep', 'soRep', 'negotiationStatus', 'recruitingActive', 'recruitingCostSpent', 'recruitingCostBudget', 'postingPeriod', 'staffCount', 'totalHours', 'updatedAt'] },
  monthly:    { name: 'MonthlyData',   key: 'compositeKey', headers: ['scope', 'month', 'salesBudget', 'salesActual', 'gpBudget', 'gpActual', 'opBudget', 'opActual', 'activeStaff', 'avgHours', 'joined', 'resigned', 'siteCount', 'heat', 'updatedAt'] },
  schedule:   { name: 'Schedule',      key: 'id',       headers: ['id', 'title', 'period', 'status', 'note', 'area', 'site', 'assignee', 'createdAt'] },
  attacklist: { name: 'AttackList',    key: 'id',       headers: ['id', 'company', 'area', 'status', 'probability', 'salesRep', 'repContact', 'linkedSiteId', 'nextVisitDate', 'lastContactDate', 'telAppoCount', 'quoteUrl', 'notebookLmUrl', 'asanaUrl', 'minutesUrl', 'needsIssues', 'escalatedTo', 'notes', 'contactLogJson', 'createdAt', 'updatedAt'] },
  recruitinghistory: { name: 'RecruitingHistory', key: 'id', headers: ['id', 'siteId', 'postingPeriod', 'costSpent', 'costBudget', 'adUrl', 'note', 'createdAt'] },
  projects:   { name: 'Projects',      key: 'projectId', headers: ['projectId', 'url', 'note', 'updatedAt'] },
};

function getSheetConfig(key) {
  return SHEETS[key] || SHEETS.overrides;
}

function doGet(e) {
  const which = (e.parameter && e.parameter.sheet) || 'overrides';
  const cfg = getSheetConfig(which);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.name);
  const rows = sheet.getDataRange().getValues();

  if (which === 'schedule' || which === 'attacklist' || which === 'recruitinghistory') {
    // Schedule/AttackList/RecruitingHistoryは配列で返す（一覧表示のため）
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

  // overrides / monthly はキーで引けるオブジェクトで返す
  const data = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const keyIdx = which === 'monthly' ? -1 : 0; // monthlyはscope+monthの複合キー
    const obj = {};
    cfg.headers.forEach((h, idx) => { obj[h] = row[idx]; });
    const rowKey = which === 'monthly' ? `${row[0]}__${row[1]}` : row[0];
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
  if (which === 'monthly') {
    if (!body.scope || !body.month) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'scope and month are required' })).setMimeType(ContentService.MimeType.JSON);
    }
    rowKey = (r) => r[0] === body.scope && r[1] === body.month;
  } else if (which === 'schedule') {
    if (!body.id) body.id = 'task_' + new Date().getTime();
    rowKey = (r) => r[0] === body.id;
  } else if (which === 'attacklist') {
    if (!body.id) body.id = 'attack_' + new Date().getTime();
    rowKey = (r) => r[0] === body.id;
  } else if (which === 'recruitinghistory') {
    if (!body.id) body.id = 'rec_' + new Date().getTime();
    rowKey = (r) => r[0] === body.id;
  } else if (which === 'projects') {
    if (!body.projectId) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'projectId is required' })).setMimeType(ContentService.MimeType.JSON);
    }
    rowKey = (r) => r[0] === body.projectId;
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

設定が終わったらURLを教えてください。動作確認まで行います。
