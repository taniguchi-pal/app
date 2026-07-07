"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const JOB_TYPES = ["フォークリフト", "倉庫内作業", "ピッキング", "一般事務", "軽作業", "ドライバー"];

// 📝 Level2と同じ全現場リスト
const masterSites = [
  { id: "K-01", name: "福山通運 藤沢支店", area: "関東", baseSales: 4500000 },
  { id: "K-02", name: "ネオヴィア・ロジ 相模原部品センター", area: "関東", baseSales: 2500000 },
  { id: "K-03", name: "PCS 関東（重工相模原）", area: "関東", baseSales: 1800000 },
  { id: "K-04", name: "PCS 関東（重工丸の内）", area: "関東", baseSales: 1500000 },
  { id: "K-05", name: "PCS 関東（豊洲）", area: "関東", baseSales: 1200000 },
  { id: "K-06", name: "メニコン 千葉八千代支店", area: "関東", baseSales: 900000 },
  { id: "K-07", name: "PCS 関東（田町タワー）", area: "関東", baseSales: 1100000 },
  { id: "C-01", name: "afs 中部XD（派遣）", area: "中部", baseSales: 1400000 },
  { id: "C-02", name: "福山通運 名古屋南流通センター", area: "中部", baseSales: 2100000 },
  { id: "C-03", name: "株式会社Rian Japan 中部物流センター", area: "中部", baseSales: 1800000 },
  { id: "C-04", name: "福山通運 東海支店（セリア）", area: "中部", baseSales: 2500000 },
  { id: "C-05", name: "岐阜アグリフーズ 本社・工場（食鳥部鶏肉加工課）", area: "中部", baseSales: 1200000 },
  { id: "C-06", name: "昭和冷蔵 小牧センター", area: "中部", baseSales: 3500000 },
  { id: "C-07", name: "昭和冷蔵 名古屋センター", area: "中部", baseSales: 2800000 },
  { id: "C-08", name: "昭和冷蔵犬山ドライセンター", area: "中部", baseSales: 1500000 },
  { id: "O-01", name: "福山通運 大阪支店", area: "大阪支店", baseSales: 20000000 },
  { id: "S-01", name: "日生トーム 高槻事業所", area: "関西", baseSales: 1200000 },
  { id: "S-02", name: "任天堂販売 京都物流センター", area: "関西", baseSales: 3200000 },
  { id: "S-03", name: "岡山県貨物運送 南港支店 6/30", area: "関西", baseSales: 2100000 },
  { id: "S-04", name: "加茂商事株式会社", area: "関西", baseSales: 800000 },
  { id: "S-05", name: "尾家産業 阪南支店（派遣）", area: "関西", baseSales: 1500000 },
  { id: "S-06", name: "コーナン商事 貝塚センター", area: "関西", baseSales: 2800000 },
  { id: "S-07", name: "フェリシモ エスパス（フェリシモ業務_選別作業）", area: "関西", baseSales: 1400000 },
  { id: "S-08", name: "PCS 関西（BPOソリューション事業本部）", area: "関西", baseSales: 1900000 },
  { id: "S-09", name: "阪菱企業 第三（12号倉庫）", area: "関西", baseSales: 2200000 },
  { id: "S-10", name: "阪菱企業 第二 5号配送センター", area: "関西", baseSales: 1800000 },
  { id: "S-11", name: "HMKロジサービス 西神戸センター", area: "関西", baseSales: 3500000 },
  { id: "S-12", name: "ハウス物流サービス株式会社 6/30", area: "関西", baseSales: 1100000 },
  { id: "S-13", name: "阪菱企業 第一 1号配送センター", area: "関西", baseSales: 2500000 },
  { id: "S-14", name: "阪菱企業 第一 11号倉庫", area: "関西", baseSales: 1300000 },
  { id: "S-15", name: "YSO Logi株式会社 神戸営業所", area: "関西", baseSales: 1600000 },
  { id: "S-16", name: "西鉄運輸 枚方物流センター", area: "関西", baseSales: 2400000 },
  { id: "S-17", name: "阪菱企業 西神現業所", area: "関西", baseSales: 1500000 },
  { id: "S-18", name: "フェリシモ エスパス（フェリシモ業務_検品・箱入作業）", area: "関西", baseSales: 1200000 },
  { id: "S-19", name: "摂津倉庫 京田辺センター", area: "関西", baseSales: 2100000 },
  { id: "S-20", name: "エヌエス物流 関西物流センター", area: "関西", baseSales: 1900000 },
  { id: "S-21", name: "エヌエス物流 滋賀物流センター", area: "関西", baseSales: 1700000 },
  { id: "S-22", name: "西鉄運輸 加古川支店", area: "関西", baseSales: 2900000 },
  { id: "N-01", name: "HMKロジサービス 南港センターGLP（短期:06/15~）", area: "関西", baseSales: 1000000 },
  { id: "N-02", name: "HMKロジサービス 南港センターRW（短期:06/04~）", area: "関西", baseSales: 1200000 },
  { id: "N-03", name: "HMKロジサービス 西神戸センター（短期:06/09~）", area: "関西", baseSales: 800000 }
];

const generateAnnualTrend = (baseSales: number) => {
  const months = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];
  return months.map((m, i) => {
    const isFuture = i > 2;
    const sales = i === 0 ? baseSales * 1.1 : i === 1 ? baseSales : isFuture ? baseSales * 1.02 : baseSales * 0.95;
    const prevSales = sales * 0.92;
    const labor = i === 0 ? sales * 0.72 : i === 1 ? sales * 0.7 : sales * 0.65;
    const opProfit = sales - labor - (i === 0 ? 210000 : i === 1 ? 28000 : 0) - 22000;
    return { month: m, 売上高: Math.round(sales), 前年売上: Math.round(prevSales), 営業利益: Math.round(opProfit) };
  });
};

const plDetails = [{ name: "労務費", apr: 2887091, may: 2615793, isCost: true }, { name: "有給", apr: 210000, may: 28000, isCost: true }, { name: "法定福利費(原)", apr: 305728, may: 251224, isCost: true }, { name: "人材募集費", apr: 40000, may: 22000, isSgna: true }];

export default function SiteDetailPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [jobs, setJobs] = useState([{ id: 1, type: "倉庫内作業", count: 4, bill: 2100, wage: 1350 }]);
  const [logs, setLogs] = useState([{ id: 1, date: "2026/06/18", author: "SO", text: "工数減を補うため土日の増枠を検討。" }]);
  const [newLogText, setNewLogText] = useState("");
  const [globalTopics, setGlobalTopics] = useState<any[]>([]);

  useEffect(() => { 
    if (typeof window !== "undefined") {
      // 💡 究極の解決策：URLから直接IDを引っこ抜く
      const pathParts = window.location.pathname.split('/');
      const rawId = pathParts[pathParts.length - 1]; 
      const decodedId = decodeURIComponent(rawId);
      setSiteId(decodedId);

      const saved = localStorage.getItem("pal_dashboard_topics");
      if(saved) {
        const all = JSON.parse(saved);
        const filtered = all.filter((t: any) => t.siteId === "全体" || t.siteId === decodedId);
        setGlobalTopics(filtered);
      }
      setIsMounted(true);
    }
  }, []);

  if (!isMounted || !siteId || siteId === "undefined") {
    return <div className="min-h-screen bg-gradient-to-br from-[#f4f7fb] via-[#f8fafc] to-[#e2e8f0] flex items-center justify-center text-zinc-400 font-bold tracking-widest text-sm">LOADING...</div>;
  }

  const siteInfo = masterSites.find(s => s.id === siteId) || { area: "管轄外", name: "未登録現場", baseSales: 3500000 };
  const trendData = generateAnnualTrend(siteInfo.baseSales);
  const currentSales = trendData[1].売上高; 
  const currentMargin = currentSales - (currentSales * 0.7) - 28000 - 251224; // モック計算
  const currentOpProfit = trendData[1].営業利益;
  const marginRate = (currentMargin / currentSales) * 100;
  const opProfitRate = (currentOpProfit / currentSales) * 100;

  function yen(n: number) { return `¥${Math.round(n).toLocaleString()}`; }
  const updateJob = (id: number, field: string, value: string | number) => setJobs(jobs.map(j => j.id === id ? { ...j, [field]: value } : j));
  const removeJob = (id: number) => setJobs(jobs.filter(j => j.id !== id));

  const handleAddLog = () => {
    if (!newLogText.trim()) return;
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    setLogs([{ id: Date.now(), date: today, author: "Sales", text: newLogText }, ...logs]);
    setNewLogText(""); 
  };

  return (
    <div translate="no" className="min-h-screen bg-gradient-to-br from-[#f4f7fb] via-[#f8fafc] to-[#e2e8f0] text-zinc-800 p-4 md:p-8 font-noto pb-24 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Noto+Sans+JP:wght@500;700;800;900&display=swap'); .font-montserrat { font-family: 'Montserrat', sans-serif; } .font-noto { font-family: 'Noto Sans JP', sans-serif; }` }} />
      <datalist id="job-types-list">{JOB_TYPES.map(j => <option key={j} value={j} />)}</datalist>
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto mb-8 border-b border-zinc-300/60 pb-6 relative z-10">
        <button onClick={() => router.back()} className="text-xs font-bold text-zinc-500 hover:text-blue-700 transition-colors mb-2">← エリア画面へ戻る</button>
        <div className="flex items-center gap-3 mt-1 mb-2">
          <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded uppercase">{siteInfo.area}管轄</span>
          <span className="text-xs font-bold text-zinc-400 font-montserrat">ID: {siteId}</span>
        </div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{siteInfo.name}</h1>
      </div>

      <div className="max-w-[1200px] mx-auto space-y-6 relative z-10">
        {globalTopics.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-[24px] border border-blue-200 shadow-sm space-y-3">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest block border-b pb-2">📢 本現場に関わる全社共有トピック・連絡事項</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {globalTopics.map(t => (
                <div key={t.id} className="bg-zinc-50/50 p-3.5 rounded-xl border border-zinc-200">
                  <div className="flex justify-between items-center mb-1.5"><span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{t.type}</span></div>
                  <h4 className="text-xs font-black text-zinc-800 mb-1">{t.title}</h4>
                  <p className="text-[11px] text-zinc-600 leading-relaxed font-semibold">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-zinc-200/80"><span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">純売上高 (5月実績)</span><p className="text-3xl font-montserrat font-black text-[#1e40af] tabular-nums">{yen(currentSales)}</p></div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-zinc-200/80"><span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">売上総利益 / 粗利率</span><div className="flex items-baseline gap-2"><p className="text-3xl font-montserrat font-black text-cyan-600 tabular-nums">{yen(currentMargin)}</p><span className="text-sm font-bold text-zinc-500">{marginRate.toFixed(1)}%</span></div></div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-zinc-200/80"><span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">営業利益 / 営利率</span><div className="flex items-baseline gap-2"><p className="text-3xl font-montserrat font-black text-amber-500 tabular-nums">{yen(currentOpProfit)}</p><span className={`text-sm font-bold ${opProfitRate < 13 ? 'text-rose-600' : 'text-zinc-500'}`}>{opProfitRate.toFixed(1)}%</span></div></div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-zinc-200/80"><span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">稼働人数</span><p className="text-3xl font-montserrat font-black text-zinc-800 tabular-nums">20<span className="text-sm font-bold text-zinc-400 ml-1">名</span></p></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-[24px] shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col h-full xl:row-span-2">
            <div className="px-6 py-5 border-b border-zinc-100"><span className="text-sm font-black text-zinc-800">損益計算書 (PL)</span></div>
            <div className="p-6 flex-1 space-y-6">
              <div><div className="flex justify-between border-b-2 border-[#1e40af] pb-2 mb-3"><span className="font-bold text-zinc-700 text-sm">Ⅰ. 純売上高</span><span className="font-montserrat font-black text-[#1e40af] text-lg tabular-nums">{yen(currentSales)}</span></div></div>
              <div>
                <div className="flex justify-between border-b border-zinc-200 pb-2 mb-3"><span className="font-bold text-zinc-700 text-sm">Ⅱ. 売上原価</span><span className="font-montserrat font-bold text-zinc-700 text-base tabular-nums">{yen(currentSales - currentMargin)}</span></div>
                <div className="space-y-3 pl-2">
                  <div className="flex justify-between text-xs"><span className="text-zinc-500 font-bold">労務費</span><span className="font-montserrat font-bold text-zinc-600 tabular-nums">{yen(currentSales * 0.7)}</span></div>
                </div>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl flex justify-between items-center"><span className="font-bold text-zinc-800 text-sm">Ⅲ. 粗利②</span><span className="font-montserrat font-black text-zinc-900 text-lg tabular-nums">{yen(currentMargin)}</span></div>
              <div>
                <div className="flex justify-between border-b border-zinc-200 pb-2 mb-3"><span className="font-bold text-zinc-700 text-sm">Ⅳ. 販管費</span><span className="font-montserrat font-bold text-zinc-700 text-base tabular-nums">¥22,000</span></div>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-800 text-white flex justify-between items-center"><span className="text-sm font-black">Ⅴ. 営業利益</span><span className="text-2xl font-montserrat font-black text-amber-400 tabular-nums">{yen(currentOpProfit)}</span></div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-zinc-200/80 h-80">
              <h3 className="text-sm font-black text-zinc-800 mb-4">月次トレンド比較 (前年対比)</h3>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717a", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "Montserrat", fontWeight: "bold" }} tickFormatter={(v) => `¥${Math.round(v / 10000)}万`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => yen(value)} contentStyle={{ fontSize: '12px', fontFamily: 'Montserrat', fontWeight: 'bold', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="売上高" stroke="#1e40af" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="営業利益" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="前年売上" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-[24px] shadow-sm border border-zinc-200/80 overflow-hidden">
               <div className="px-6 py-5 border-b border-zinc-100"><span className="text-sm font-black text-zinc-800">現場内 ローカル交渉履歴（SO / sales 共有）</span></div>
               <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                     <textarea value={newLogText} onChange={e => setNewLogText(e.target.value)} placeholder="この現場独自の交渉内容を入力..." className="flex-1 border border-zinc-200 rounded-xl p-4 text-sm outline-none focus:border-[#1e40af] resize-none h-14 shadow-inner font-bold text-zinc-700" />
                     <button onClick={handleAddLog} className="bg-[#1e40af] text-white font-bold text-sm px-6 rounded-xl hover:bg-blue-800 h-14 shadow-md transition-colors">記録</button>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                     {logs.map(log => (
                        <div key={log.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100"><div className="flex items-center gap-3 mb-2"><span className="text-[10px] text-zinc-400 font-montserrat font-bold">{log.date}</span><span className="text-[10px] font-bold text-[#1e40af] bg-blue-100 px-2 py-0.5 rounded">{log.author}</span></div><p className="text-xs font-bold text-zinc-700">{log.text}</p></div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}