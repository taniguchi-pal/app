"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AREA_ORDER = ["全体", "関東", "中部", "関西", "大阪支店"];
const AREA_TABS = ["すべて", "関東", "中部", "関西", "大阪支店"];

const ALL_MONTHS = [
  { key: "4", label: "4月実績" }, { key: "5", label: "5月実績" }, { key: "6", label: "6月進捗" },
  { key: "7", label: "7月計画" }, { key: "8", label: "8月計画" }, { key: "9", label: "9月計画" },
  { key: "10", label: "10月計画" }, { key: "11", label: "11月計画" }, { key: "12", label: "12月計画" },
  { key: "1", label: "1月計画" }, { key: "2", label: "2月計画" }, { key: "3", label: "3月計画" }
];

// 💡 取得したあなたのAPI URL
const API_URL = "https://script.google.com/macros/s/AKfycbwPJCkRmjjnJdoj4Ndruec-6d8Fp3izBJAFCc6mp-pqtzFAUfRVqKgxW-WaLiWj7xilBA/exec";

function yen(n: number) { return `¥${Math.round(n || 0).toLocaleString()}`; }
function GapBadge({ gap }: { gap: number }) { 
  const pos = gap >= 0; 
  return (<span className={`text-[12px] font-montserrat font-bold px-2 py-0.5 rounded ${pos ? "text-emerald-700 bg-emerald-100/50" : "text-rose-700 bg-rose-100/50"}`}>{pos ? "+" : ""}{(gap || 0).toLocaleString()}</span>); 
}

export default function GlobalDashboard() {
  const router = useRouter(); 
  const [isMounted, setIsMounted] = useState(false);
  const [monthKey, setMonthKey] = useState("4"); // デフォルト4月
  const [selectedArea, setSelectedArea] = useState("すべて");

  // 📦 APIから取得したデータを格納する箱
  const [apiData, setApiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 画面を開いた時＆5分ごとにデータを自動取得（ポーリング）
  useEffect(() => { 
    setIsMounted(true);
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setApiData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("API Fetch Error:", error);
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5分ポーリング
    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-[#f4f7fb]"></div>;
  if (isLoading) return <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center font-montserrat font-black text-blue-900 tracking-widest">LOADING LIVE DATA...</div>;

  // --- 🧠 ここから「スプレッドシートのデータ」を自動計算する脳みそ ---
  const master = apiData?.master || [];
  const pl = apiData?.pl || [];
  const kpi = apiData?.kpi || [];
  const topics = apiData?.topics || [];

  // 選ばれた月の文字（例：2026/04）を作る
  const targetMonth = `2026/${monthKey.padStart(2, '0')}`;

  // エリアごとの計算結果をまとめる関数
  const calculateAreaStats = (areaName: string) => {
    // このエリアに属する現場IDのリストを取得
    const areaSiteIds = master.filter((m: any) => areaName === "全体" || m['エリア'] === areaName).map((m: any) => m['現場ID']);
    
    // 選ばれた月のPLデータから、このエリアの現場のものだけを抽出
    const targetPL = pl.filter((p: any) => p['年月'] === targetMonth && areaSiteIds.includes(p['現場ID']));
    
    // 選ばれた月のKPIデータから抽出
    const targetKPI = kpi.filter((k: any) => k['年月'] === targetMonth && areaSiteIds.includes(k['現場ID']));

    // 合計を計算
    const salesBudget = targetPL.reduce((sum: number, row: any) => sum + (Number(row['売上予算']) || 0), 0);
    const salesResult = targetPL.reduce((sum: number, row: any) => sum + (Number(row['売上実績']) || 0), 0);
    const cost = targetPL.reduce((sum: number, row: any) => sum + (Number(row['労務費実績']) || 0) + (Number(row['有給実績']) || 0) + (Number(row['法定福利費実績']) || 0), 0);
    const marginResult = salesResult - cost; // 粗利②
    const marginBudget = salesBudget * 0.15; // 予算の粗利は仮で15%として算出

    const activeStaff = targetKPI.reduce((sum: number, row: any) => sum + (Number(row['当月末稼働人数']) || 0), 0);
    const totalHours = targetKPI.reduce((sum: number, row: any) => sum + (Number(row['当月総工数(h)']) || 0), 0);
    const activeSites = targetPL.length; // その月にPLデータが存在する現場数

    return {
      area: areaName,
      salesBudget, salesResult, salesGap: salesResult - salesBudget, salesRate: salesBudget ? (salesResult / salesBudget) * 100 : 0,
      marginBudget, marginResult, marginGap: marginResult - marginBudget,
      activeStaff, totalHours, activeSites
    };
  };

  const areaStats = AREA_ORDER.map(area => calculateAreaStats(area));
  const totalRow = areaStats.find(a => a.area === "全体") || calculateAreaStats("全体");

  // KPIマトリクス用のデータ生成
  const kpiRows = [
    { m: "稼働人数", u: "名", n: "実績合算", v: areaStats.map(a => a.activeStaff) },
    { m: "稼働現場数", u: "現場", n: "実績合算", v: areaStats.map(a => a.activeSites) },
    { m: "総工数", u: "h", n: "実績合算", v: areaStats.map(a => a.totalHours) },
    { m: "1人当たり工数", u: "h", n: "工数÷人数", v: areaStats.map(a => a.activeStaff ? Math.round(a.totalHours / a.activeStaff) : 0) },
    { m: "1人当たり売上", u: "円", n: "売上÷人数", v: areaStats.map(a => a.activeStaff ? Math.round(a.salesResult / a.activeStaff) : 0) },
  ];

  // トピックのフィルタリング
  const filteredTopics = topics.filter((t: any) => selectedArea === "すべて" || t['紐付け現場ID'] === "全体");

  // スプレッドシートからの年間スケジュール（マスタに紐づかないタスク等）
  // ※ここでは固定のタスクとして表示するか、Topicから「PJ」を抜く等も可能。
  // 今回はTopicから「カテゴリ」が「プロジェクト」のものを引っ張ってきます。
  const projectTopics = topics.filter((t: any) => t['カテゴリ'] === "プロジェクト");

  const currentMonthLabel = ALL_MONTHS.find(m => m.key === monthKey)?.label || "選択月";

  return (
    <div translate="no" className="min-h-screen bg-gradient-to-br from-[#f4f7fb] via-[#f8fafc] to-[#e2e8f0] text-zinc-800 p-4 md:p-8 font-noto pb-24 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Noto+Sans+JP:wght@500;700;800;900&display=swap'); .font-montserrat { font-family: 'Montserrat', sans-serif; } .font-noto { font-family: 'Noto Sans JP', sans-serif; }`}} />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 🚀 ヘッダー */}
      <div className="max-w-[1400px] mx-auto flex justify-between items-center mb-8 border-b border-zinc-300/60 pb-6 relative z-10">
        <div>
          <span className="text-[11px] font-bold text-blue-800 font-montserrat tracking-[0.15em] uppercase">STAFFING MANAGEMENT BRAIN</span>
          <h1 className="text-3xl font-black tracking-tight mt-1 text-zinc-900 font-noto">人材ソリューション事業部 ダッシュボード</h1>
        </div>
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full shadow-sm border border-zinc-200">
          <img src="/logo.png" alt="PAL" className="h-6 object-contain mix-blend-multiply opacity-90" />
          <div className="w-px h-5 bg-zinc-300"></div>
          <button onClick={() => router.push("/")} className="text-xs font-bold text-zinc-500 hover:text-blue-600 tracking-widest transition-colors">LOGOUT</button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-6 relative z-10">
        
        {/* 🏢 サマリー */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-8 rounded-[24px] bg-[#1e3a8a] text-white shadow-lg relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
              <span className="text-sm font-bold text-blue-200 block mb-3">ライブAPI同期中</span>
              <span className="text-[44px] font-montserrat font-black drop-shadow-sm leading-tight text-emerald-400">ACTIVE</span>
              <p className="text-xs text-blue-200 mt-2 font-bold">スプレッドシートと完全連動</p>
            </div>
          </div>
          <div className="p-8 rounded-[24px] bg-white/90 backdrop-blur-sm border border-zinc-200/80 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-zinc-400 block mb-5">選択月 事業部合計 ({currentMonthLabel})</span>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-zinc-400 font-bold block mb-1">売上実績</span><p className="text-[28px] font-montserrat font-black text-[#1e40af] tabular-nums">{yen(totalRow.salesResult)}</p></div>
              <div><span className="text-xs text-zinc-400 font-bold block mb-1">粗利②</span><p className="text-[28px] font-montserrat font-black text-cyan-600 tabular-nums">{yen(totalRow.marginResult)}</p></div>
            </div>
          </div>
          <div className="p-8 rounded-[24px] bg-white/90 backdrop-blur-sm border border-zinc-200/80 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-zinc-400 block mb-5">事業部運営インフラ ({currentMonthLabel})</span>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-zinc-50/80 p-5 rounded-2xl border border-zinc-100 flex flex-col justify-center"><span className="block text-xs font-bold text-zinc-500 mb-1">稼働現場数</span><p className="text-3xl font-montserrat font-black text-zinc-800 tabular-nums">{totalRow.activeSites}</p></div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-300 flex flex-col justify-center shadow-sm"><span className="block text-xs font-bold text-zinc-600 mb-1">稼働スタッフ</span><span className="text-3xl font-montserrat font-black text-zinc-800 tabular-nums">{totalRow.activeStaff}</span></div>
            </div>
          </div>
        </div>

        {/* 🗺️ フィルター */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-[24px] border border-zinc-200/80 shadow-sm space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4 border-b border-zinc-200/80 pb-5">
            <span className="text-xs font-bold text-zinc-500 w-32 uppercase tracking-widest shrink-0">Timeline Select:</span>
            <div className="flex flex-wrap gap-2">
              {ALL_MONTHS.map(m => (
                <button key={m.key} onClick={() => setMonthKey(m.key)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${monthKey === m.key ? "bg-[#1e40af] text-white shadow-md" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <span className="text-xs font-bold text-zinc-500 w-32 uppercase tracking-widest shrink-0">Area Filter:</span>
            <div className="flex flex-wrap gap-2">
              {AREA_TABS.map(tab => (
                <button key={tab} onClick={() => setSelectedArea(tab)} className={`px-6 py-2 rounded-full text-xs font-bold border transition-all ${selectedArea === tab ? "bg-zinc-800 text-white border-zinc-800 shadow-md" : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🏢 エリア別予実GAPカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {AREA_ORDER.map(areaName => {
            const row = areaStats.find(r => r.area === areaName) || calculateAreaStats(areaName);
            const isTotal = areaName === "全体";

            return (
              <button key={areaName} onClick={() => !isTotal ? router.push(`/budget/area/${encodeURIComponent(areaName)}`) : null} className={`text-left p-6 rounded-[24px] bg-white/95 backdrop-blur-sm border cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg focus:outline-none ${isTotal ? "border-blue-300 shadow-sm" : "border-zinc-200/80 shadow-sm hover:border-blue-500"}`}>
                <div className="flex justify-between items-center border-b-2 border-zinc-100 pb-4 mb-5">
                  <span className={`text-lg font-black ${isTotal ? "text-[#1e40af]" : "text-zinc-800"}`}>{areaName} {!isTotal && "➔"}</span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${row.salesRate >= 95 ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}>達成率 {row.salesRate.toFixed(1)}%</span>
                </div>
                <div className="space-y-5">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block mb-2">売上 (Budget / Actual)</span>
                    <div className="flex justify-between items-end mb-1"><span className="font-montserrat font-bold text-zinc-400 text-[13px] tabular-nums">{yen(row.salesBudget)}</span><span className="font-montserrat font-black text-[#1e40af] text-xl tabular-nums">{yen(row.salesResult)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-400 font-bold uppercase">Gap</span><GapBadge gap={row.salesGap} /></div>
                  </div>
                  <div className="pt-4 border-t-2 border-dashed border-zinc-100">
                    <span className="text-xs font-bold text-zinc-400 block mb-2">粗利② (Budget / Actual)</span>
                    <div className="flex justify-between items-end mb-1"><span className="font-montserrat font-bold text-zinc-400 text-[13px] tabular-nums">{yen(row.marginBudget)}</span><span className="font-montserrat font-black text-zinc-800 text-xl tabular-nums">{yen(row.marginResult)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-400 font-bold uppercase">Gap</span><GapBadge gap={row.marginGap} /></div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 📊 KPI マトリクス */}
        <div className="space-y-6 mt-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-zinc-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between"><span className="text-sm font-black text-zinc-800">事業部コアKPI ＆ マトリクス ({currentMonthLabel})</span></div>
            <div className="p-2 w-full">
              <table className="w-full text-left text-sm table-fixed">
                <thead><tr className="border-b border-zinc-100"><th className="p-4 text-xs font-bold text-zinc-400 w-1/4">KPI項目</th>{AREA_ORDER.map(a => (<th key={a} className={`p-4 text-xs font-bold text-right ${a==="全体"?"text-[#1e40af]":"text-zinc-400"}`}>{a}</th>))}</tr></thead>
                <tbody className="divide-y divide-zinc-50">
                  {kpiRows.map(k => (
                    <tr key={k.m} className="hover:bg-blue-50/40">
                      <td className="p-4 font-bold text-zinc-800 truncate">{k.m} <span className="text-[9px] font-bold text-zinc-400 ml-1 bg-zinc-100 px-1.5 py-0.5 rounded">{k.n}</span></td>
                      {AREA_ORDER.map(a => (<td key={a} className={`p-4 text-right font-montserrat font-black text-base tabular-nums ${a==="全体"?"text-[#1e40af]":"text-zinc-700"}`}>{k.v[AREA_ORDER.indexOf(a)].toLocaleString()}<span className="text-[10px] ml-1 font-bold text-zinc-400">{k.u}</span></td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 📝 スプレッドシート連携 共有ボード */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-zinc-200/80 shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center">
            <span className="text-sm font-black text-zinc-800">全社共有トピック・プロジェクト進捗 (スプレッドシート連動)</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map((topic: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">{topic['カテゴリ']}</span>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">{topic['投稿日']} | 投稿者: {topic['投稿者']}</span>
                  </div>
                  <h4 className="text-sm font-black text-zinc-800 mb-2">{topic['トピック・PJ名']}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed font-semibold">{topic['共有内容・進捗状況']}</p>
                </div>
              ))}
              {filteredTopics.length === 0 && <div className="col-span-2 text-center py-6 font-bold text-zinc-400 text-sm">共有トピックはまだありません</div>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}