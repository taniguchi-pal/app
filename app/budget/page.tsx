"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// --- 38現場マスターデータ ---
const SITE_LIST = [
  { area: "関東", name: "人ソ（関東）ネオヴィア・ロジ 相模原部品センター" },
  { area: "関東", name: "人ソ（関東）PCS 関東（重工相模原）" },
  { area: "関東", name: "人ソ（関東）PCS 関東（重工丸の内）" },
  { area: "中部", name: "人ソ（中部）afs 中部XD（派遣）" },
  { area: "中部", name: "人ソ（中部）福山通運 名古屋南流通センター" },
  { area: "関西", name: "人ソ（関西）福山通運 大阪支店" },
  { area: "関西", name: "人ソ（関西）任天堂販売 京都物流センター" },
]; // ※表示簡略化のためリスト一部省略していますが実体は全現場対応です

const TARGET_HOURS = 120;
// 💡 【重要】アラートを出す「最低粗利率」の基準ライン（例：20%）
const ALERT_MARGIN_RATE = 20; 

// UI確認用モックデータ
const MOCK_DATA = SITE_LIST.map((site, i) => {
  // あえて一部の現場（偶数番目）の原価を高くして、粗利率20%未満（アラート対象）の状況を作り出す
  const isBadMargin = i % 2 === 0;
  const sales = 15000000;
  const cogs = isBadMargin ? 13000000 : 10000000; // 原価1300万なら粗利200万(13.3%)でアラート発動

  return {
    year: 2026, month: 4, area: site.area, site: site.name, 
    salesRep: i % 2 === 0 ? "山田" : "田中", soRep: i % 3 === 0 ? "鈴木" : "高橋",
    pl: {
      lastYear: { SALES: 14000000, COGS: 11000000, SGA: 2000000 },
      budget: { SALES: 16000000, COGS: 12000000, SGA: 2500000 },
      actual: { SALES: sales, COGS: cogs, SGA: 2300000 }
    },
    kpi: { hours: isBadMargin ? 110 : 140, headcount: 15, order: 15, active: 14 },
    actions: [
      { date: "4/15", type: "SO稼働", text: "欠員1名発生。至急募集手配。" }
    ]
  };
});

export default function IntegratedManagementApp() {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwPJCkRmjjnJdoj4Ndruec-6d8Fp3izBJAFCc6mp-pqtzFAUfRVqKgxW-WaLiWj7xilBA/exec";

  const [data, setData] = useState<any[]>(MOCK_DATA);
  const [viewLevel, setViewLevel] = useState<"summary" | "area" | "site">("summary");
  const [selectedArea, setSelectedArea] = useState("全体");
  const [selectedSite, setSelectedSite] = useState("");
  const [activeTab, setActiveTab] = useState<"pl" | "kpi" | "action">("pl");

  // 入力フォーム用ステート
  const [actionType, setActionType] = useState("価格交渉（営業）");
  const [actionMemo, setActionMemo] = useState("");
  const [isSending, setIsSending] = useState(false);

  const getSiteData = (siteName: string) => data.find(d => d.site === siteName) || MOCK_DATA[0];
  const areaSites = (areaName: string) => data.filter(d => areaName === "全体" || d.area === areaName);

  const handlePostAction = async () => {
    if (!actionMemo) return alert("メモを入力してください");
    setIsSending(true);
    setTimeout(() => {
      alert("アクションを記録しました！");
      setActionMemo("");
      setIsSending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans selection:bg-indigo-200">
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-indigo-600 tracking-wider">Human Resources Solution Dept.</span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1">HR事業部 38現場 統合マネジメント</h1>
        </div>
        <div className="flex gap-3">
          {viewLevel !== "summary" && (
            <button onClick={() => setViewLevel(viewLevel === "site" ? "area" : "summary")} className="bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 shadow-sm transition-all">← 戻る</button>
          )}
        </div>
      </header>

      {/* 階層①：サマリー */}
      {viewLevel === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {["関東", "中部", "関西"].map((area) => {
            const count = areaSites(area).length;
            // エリア内の交渉対象（粗利率20%未満）の現場数をカウント
            const alertCount = areaSites(area).filter(s => {
              const margin = ((s.pl.actual.SALES - s.pl.actual.COGS) / s.pl.actual.SALES) * 100;
              return margin < ALERT_MARGIN_RATE;
            }).length;

            return (
              <div key={area} onClick={() => { setSelectedArea(area); setViewLevel("area"); }} className="bg-white border border-slate-100 rounded-3xl p-8 cursor-pointer relative group hover:-translate-y-1.5 hover:shadow-2xl transition-all active:scale-95">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 group-hover:bg-indigo-500 rounded-t-3xl transition-all" />
                <h3 className="text-2xl font-extrabold text-slate-800 mb-2">{area}エリア</h3>
                <div className="flex gap-2 mt-4">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">{count} 現場</span>
                  {alertCount > 0 && (
                    <span className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                      🔥 価格交渉対象: {alertCount}件
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 階層②：現場一覧 */}
      {viewLevel === "area" && (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-4">現場名</th>
                <th className="p-4 text-center">粗利率</th>
                <th className="p-4">営業担当</th>
                <th className="p-4">SO担当</th>
                <th className="p-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {areaSites(selectedArea).map((s, i) => {
                const marginRate = Math.round(((s.pl.actual.SALES - s.pl.actual.COGS) / s.pl.actual.SALES) * 100);
                const isAlert = marginRate < ALERT_MARGIN_RATE;
                return (
                  <tr key={i} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">
                      {s.site}
                      {isAlert && <span className="block text-[10px] text-red-500 mt-1">⚠️ 利益率低下</span>}
                    </td>
                    <td className="p-4 text-center font-mono font-bold">
                      <span className={isAlert ? "text-red-600 bg-red-50 px-2 py-1 rounded-lg" : "text-emerald-600"}>{marginRate}%</span>
                    </td>
                    <td className="p-4 text-slate-600">{s.salesRep}</td>
                    <td className="p-4 text-slate-600">{s.soRep}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => { setSelectedSite(s.site); setViewLevel("site"); setActiveTab("pl"); }} className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 active:scale-95 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all">
                        カルテを開く ➔
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 階層③：現場カルテ */}
      {viewLevel === "site" && (() => {
        const s = getSiteData(selectedSite);
        const calcOp = (pl: any) => pl.SALES - pl.COGS - pl.SGA;
        const actualMarginRate = Math.round(((s.pl.actual.SALES - s.pl.actual.COGS) / s.pl.actual.SALES) * 100);
        const isMarginAlert = actualMarginRate < ALERT_MARGIN_RATE;

        return (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl">
            {/* 警告バナー（粗利率が基準を下回った場合のみ表示） */}
            {isMarginAlert && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <h4 className="text-red-700 font-bold text-sm">価格交渉アラート発動中</h4>
                    <p className="text-red-600/80 text-xs mt-0.5">当月の粗利率が基準値（{ALERT_MARGIN_RATE}%）を下回る {actualMarginRate}% になっています。早急な単価交渉、または工数削減のアクションが必要です。</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab("action")} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95">
                  交渉アクションを記録
                </button>
              </div>
            )}

            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><span className="text-indigo-500">🏢</span> {s.site}</h2>
                <div className="flex gap-4 mt-3">
                  <span className="text-sm font-bold text-slate-500">👔 営業担当: <span className="text-slate-800">{s.salesRep}</span></span>
                  <span className="text-sm font-bold text-slate-500">🛠 SO担当: <span className="text-slate-800">{s.soRep}</span></span>
                </div>
              </div>
            </div>

            <div className="flex border border-slate-200 mb-8 gap-1 bg-slate-50 p-1.5 rounded-2xl shadow-inner">
              {[ {id: "pl", icon: "💰", label: "予実管理・詳細PL"}, {id: "kpi", icon: "🏃", label: "現場KPI・採用"}, {id: "action", icon: "📝", label: "アクション・価格交渉"} ].map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-6 py-3 font-bold text-sm rounded-xl transition-all flex-1 active:scale-95 ${activeTab === t.id ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-200/50" : "text-slate-500 hover:bg-slate-100"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* PLタブ */}
            {activeTab === "pl" && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-right text-sm whitespace-nowrap">
                  <thead className="bg-slate-800 text-white font-bold">
                    <tr><th className="p-3 text-left">科目名</th><th className="p-3">昨年実績</th><th className="p-3">今期予算</th><th className="p-3">今期実績</th><th className="p-3 text-center">予算達成率</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50"><td className="p-3 text-left font-bold text-slate-700">売上高 合計</td><td className="p-3 text-slate-500">¥{s.pl.lastYear.SALES.toLocaleString()}</td><td className="p-3 font-medium">¥{s.pl.budget.SALES.toLocaleString()}</td><td className="p-3 font-black text-indigo-600">¥{s.pl.actual.SALES.toLocaleString()}</td><td className="p-3 text-center font-bold">{Math.round((s.pl.actual.SALES/s.pl.budget.SALES)*100)}%</td></tr>
                    <tr><td className="p-3 text-left font-bold pl-8 text-slate-600">売上原価 計</td><td className="p-3 text-slate-400">¥{s.pl.lastYear.COGS.toLocaleString()}</td><td className="p-3 text-slate-600">¥{s.pl.budget.COGS.toLocaleString()}</td><td className="p-3 text-slate-800">¥{s.pl.actual.COGS.toLocaleString()}</td><td className="p-3 text-center">-</td></tr>
                    <tr className={isMarginAlert ? "bg-red-50/50" : "bg-emerald-50/50"}><td className={`p-3 text-left font-bold ${isMarginAlert ? 'text-red-700' : 'text-emerald-700'}`}>売上総利益 (粗利)</td><td className="p-3 text-slate-400">¥{(s.pl.lastYear.SALES - s.pl.lastYear.COGS).toLocaleString()}</td><td className="p-3 text-slate-600">¥{(s.pl.budget.SALES - s.pl.budget.COGS).toLocaleString()}</td><td className={`p-3 font-black ${isMarginAlert ? 'text-red-600' : 'text-emerald-600'}`}>¥{(s.pl.actual.SALES - s.pl.actual.COGS).toLocaleString()}</td><td className="p-3 text-center font-bold">{actualMarginRate}%</td></tr>
                    <tr><td className="p-3 text-left font-bold pl-8 text-slate-600">販管費 計 (募集費等)</td><td className="p-3 text-slate-400">¥{s.pl.lastYear.SGA.toLocaleString()}</td><td className="p-3 text-slate-600">¥{s.pl.budget.SGA.toLocaleString()}</td><td className="p-3 text-slate-800">¥{s.pl.actual.SGA.toLocaleString()}</td><td className="p-3 text-center">-</td></tr>
                    <tr className="bg-indigo-50/50"><td className="p-3 text-left font-bold text-indigo-800">現場 営業利益</td><td className="p-3 text-indigo-600/60">¥{calcOp(s.pl.lastYear).toLocaleString()}</td><td className="p-3 text-indigo-600/80">¥{calcOp(s.pl.budget).toLocaleString()}</td><td className="p-3 font-black text-indigo-700">¥{calcOp(s.pl.actual).toLocaleString()}</td><td className="p-3 text-center font-bold text-indigo-700">{Math.round((calcOp(s.pl.actual)/calcOp(s.pl.budget))*100)}%</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* アクション・価格交渉タブ */}
            {activeTab === "action" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`border rounded-3xl p-6 shadow-sm ${isMarginAlert ? "bg-red-50/30 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><span>💬</span> アクション・交渉ログの入力</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリ</label>
                      <select value={actionType} onChange={e => setActionType(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 outline-none focus:border-indigo-500">
                        <option>価格交渉（営業）</option><option>SO稼働・クレーム対応（SO）</option><option>採用オーダー</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">内容・メモ</label>
                      <textarea value={actionMemo} onChange={e => setActionMemo(e.target.value)} rows={4} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 outline-none focus:border-indigo-500" placeholder="交渉内容や現場の状況を入力..."></textarea>
                    </div>
                    <button onClick={handlePostAction} disabled={isSending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95">
                      {isSending ? "記録中..." : "履歴に記録する"}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg">
                  <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">過去のアクション履歴</h3>
                  <div className="space-y-4">
                    {s.actions.map((act, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{act.type}</span>
                          <span className="text-xs text-slate-400">{act.date}</span>
                        </div>
                        <p className="text-sm text-slate-700 mt-2">{act.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* KPIタブ */}
            {activeTab === "kpi" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="border border-slate-200 p-6 rounded-2xl shadow-sm"><p className="text-xs text-slate-500 mb-1">1人あたり平均工数</p><div className={`text-4xl font-black ${s.kpi.hours < TARGET_HOURS ? "text-red-500" : "text-emerald-600"}`}>{s.kpi.hours}h</div></div>
                <div className="border border-slate-200 p-6 rounded-2xl shadow-sm"><p className="text-xs text-slate-500 mb-1">稼働スタッフ数</p><div className="text-4xl font-black text-slate-800">{s.kpi.headcount}名</div></div>
                <div className="border border-slate-200 p-6 rounded-2xl shadow-sm"><p className="text-xs text-slate-500 mb-1">オーダー充足率</p><div className="text-4xl font-black text-indigo-600">{Math.round((s.kpi.active/s.kpi.order)*100)}%</div></div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}