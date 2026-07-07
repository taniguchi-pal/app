"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 📝 全現場リスト
const sites = [
  { id: "K-01", name: "福山通運 藤沢支店", area: "関東", sales: 4500000, margin: 675000, rate: 15.0 },
  { id: "K-02", name: "ネオヴィア・ロジ 相模原部品センター", area: "関東", sales: 2500000, margin: 375000, rate: 15.0 },
  { id: "K-03", name: "PCS 関東（重工相模原）", area: "関東", sales: 1800000, margin: 270000, rate: 15.0 },
  { id: "K-04", name: "PCS 関東（重工丸の内）", area: "関東", sales: 1500000, margin: 225000, rate: 15.0 },
  { id: "K-05", name: "PCS 関東（豊洲）", area: "関東", sales: 1200000, margin: 180000, rate: 15.0 },
  { id: "K-06", name: "メニコン 千葉八千代支店", area: "関東", sales: 900000, margin: 135000, rate: 15.0 },
  { id: "K-07", name: "PCS 関東（田町タワー）", area: "関東", sales: 1100000, margin: 165000, rate: 15.0 },
  { id: "C-01", name: "afs 中部XD（派遣）", area: "中部", sales: 1400000, margin: 210000, rate: 15.0 },
  { id: "C-02", name: "福山通運 名古屋南流通センター", area: "中部", sales: 2100000, margin: 315000, rate: 15.0 },
  { id: "C-03", name: "株式会社Rian Japan 中部物流センター", area: "中部", sales: 1800000, margin: 270000, rate: 15.0 },
  { id: "C-04", name: "福山通運 東海支店（セリア）", area: "中部", sales: 2500000, margin: 375000, rate: 15.0 },
  { id: "C-05", name: "岐阜アグリフーズ 本社・工場（食鳥部鶏肉加工課）", area: "中部", sales: 1200000, margin: 180000, rate: 15.0 },
  { id: "C-06", name: "昭和冷蔵 小牧センター", area: "中部", sales: 3500000, margin: 490000, rate: 14.0 },
  { id: "C-07", name: "昭和冷蔵 名古屋センター", area: "中部", sales: 2800000, margin: 420000, rate: 15.0 },
  { id: "C-08", name: "昭和冷蔵犬山ドライセンター", area: "中部", sales: 1500000, margin: 225000, rate: 15.0 },
  { id: "O-01", name: "福山通運 大阪支店", area: "大阪支店", sales: 20000000, margin: 3000000, rate: 15.0 },
  { id: "S-01", name: "日生トーム 高槻事業所", area: "関西", sales: 1200000, margin: 180000, rate: 15.0 },
  { id: "S-02", name: "任天堂販売 京都物流センター", area: "関西", sales: 3200000, margin: 480000, rate: 15.0 },
  { id: "S-03", name: "岡山県貨物運送 南港支店 6/30", area: "関西", sales: 2100000, margin: 315000, rate: 15.0 },
  { id: "S-04", name: "加茂商事株式会社", area: "関西", sales: 800000, margin: 120000, rate: 15.0 },
  { id: "S-05", name: "尾家産業 阪南支店（派遣）", area: "関西", sales: 1500000, margin: 225000, rate: 15.0 },
  { id: "S-06", name: "コーナン商事 貝塚センター", area: "関西", sales: 2800000, margin: 420000, rate: 15.0 },
  { id: "S-07", name: "フェリシモ エスパス（フェリシモ業務_選別作業）", area: "関西", sales: 1400000, margin: 210000, rate: 15.0 },
  { id: "S-08", name: "PCS 関西（BPOソリューション事業本部）", area: "関西", sales: 1900000, margin: 285000, rate: 15.0 },
  { id: "S-09", name: "阪菱企業 第三（12号倉庫）", area: "関西", sales: 2200000, margin: 330000, rate: 15.0 },
  { id: "S-10", name: "阪菱企業 第二 5号配送センター", area: "関西", sales: 1800000, margin: 270000, rate: 15.0 },
  { id: "S-11", name: "HMKロジサービス 西神戸センター", area: "関西", sales: 3500000, margin: 525000, rate: 15.0 },
  { id: "S-12", name: "ハウス物流サービス株式会社 6/30", area: "関西", sales: 1100000, margin: 165000, rate: 15.0 },
  { id: "S-13", name: "阪菱企業 第一 1号配送センター", area: "関西", sales: 2500000, margin: 375000, rate: 15.0 },
  { id: "S-14", name: "阪菱企業 第一 11号倉庫", area: "関西", sales: 1300000, margin: 195000, rate: 15.0 },
  { id: "S-15", name: "YSO Logi株式会社 神戸営業所", area: "関西", sales: 1600000, margin: 240000, rate: 15.0 },
  { id: "S-16", name: "西鉄運輸 枚方物流センター", area: "関西", sales: 2400000, margin: 360000, rate: 15.0 },
  { id: "S-17", name: "阪菱企業 西神現業所", area: "関西", sales: 1500000, margin: 225000, rate: 15.0 },
  { id: "S-18", name: "フェリシモ エスパス（フェリシモ業務_検品・箱入作業）", area: "関西", sales: 1200000, margin: 180000, rate: 15.0 },
  { id: "S-19", name: "摂津倉庫 京田辺センター", area: "関西", sales: 2100000, margin: 315000, rate: 15.0 },
  { id: "S-20", name: "エヌエス物流 関西物流センター", area: "関西", sales: 1900000, margin: 285000, rate: 15.0 },
  { id: "S-21", name: "エヌエス物流 滋賀物流センター", area: "関西", sales: 1700000, margin: 255000, rate: 15.0 },
  { id: "S-22", name: "西鉄運輸 加古川支店", area: "関西", sales: 2900000, margin: 435000, rate: 15.0 },
  { id: "N-01", name: "HMKロジサービス 南港センターGLP（短期:06/15~）", area: "関西", sales: 1000000, margin: 150000, rate: 15.0 },
  { id: "N-02", name: "HMKロジサービス 南港センターRW（短期:06/04~）", area: "関西", sales: 1200000, margin: 180000, rate: 15.0 },
  { id: "N-03", name: "HMKロジサービス 西神戸センター（短期:06/09~）", area: "関西", sales: 800000, margin: 120000, rate: 15.0 },
];

export default function AreaDashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [decodedArea, setDecodedArea] = useState("");
  
  useEffect(() => { 
    // 💡 究極の解決策：Next.jsのパラメータ取得に頼らず、直接URLから文字を引っこ抜く！
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split('/');
      const rawArea = pathParts[pathParts.length - 1]; // URLの一番最後の部分を取得
      setDecodedArea(decodeURIComponent(rawArea));
      setIsMounted(true);
    }
  }, []);
  
  // URLから正しく文字が取れるまではローディング画面にする
  if (!isMounted || !decodedArea || decodedArea === "undefined") {
    return <div className="min-h-screen bg-gradient-to-br from-[#f4f7fb] via-[#f8fafc] to-[#e2e8f0] flex items-center justify-center text-zinc-400 font-bold tracking-widest text-sm">LOADING...</div>;
  }

  // 💡 大阪支店の場合は「エリア」を省くスマートタイトル
  const pageTitle = decodedArea.includes("支店") 
    ? `${decodedArea} ダッシュボード` 
    : `${decodedArea}エリア ダッシュボード`;

  const areaSites = sites.filter(s => s.area === decodedArea);
  const totalSales = areaSites.reduce((sum, s) => sum + s.sales, 0);
  const totalMargin = areaSites.reduce((sum, s) => sum + s.margin, 0);
  const avgRate = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;

  return (
    <div translate="no" className="min-h-screen bg-gradient-to-br from-[#f4f7fb] via-[#f8fafc] to-[#e2e8f0] p-4 md:p-8 font-noto pb-24 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Noto+Sans+JP:wght@500;700;800;900&display=swap'); .font-montserrat { font-family: 'Montserrat', sans-serif; } .font-noto { font-family: 'Noto Sans JP', sans-serif; }` }} />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto mb-8 border-b border-zinc-300/60 pb-6 relative z-10">
        <button onClick={() => router.push("/budget")} className="text-xs font-bold text-zinc-500 hover:text-blue-700 transition-colors mb-2">← 全社ダッシュボードへ戻る</button>
        <h1 className="text-3xl font-black text-zinc-900 mt-2 tracking-tight">{pageTitle}</h1>
      </div>

      <div className="max-w-[1200px] mx-auto space-y-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-zinc-200/80"><span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">管轄当月売上</span><p className="text-[28px] font-montserrat font-black text-[#1e40af] tabular-nums">¥{totalSales.toLocaleString()}</p></div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-zinc-200/80"><span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">管轄粗利 / 平均率</span><div className="flex items-baseline gap-3"><p className="text-[28px] font-montserrat font-black text-cyan-600 tabular-nums">¥{totalMargin.toLocaleString()}</p><span className={`text-sm font-bold ${avgRate >= 15 ? 'text-zinc-500' : 'text-rose-600'}`}>{avgRate.toFixed(1)}%</span></div></div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-zinc-200/80 flex flex-col justify-center"><span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-2">管轄現場数</span><p className="text-[28px] font-montserrat font-black text-zinc-800 tabular-nums">{areaSites.length}</p></div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-[24px] shadow-sm border border-zinc-200/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100"><span className="text-sm font-black text-zinc-800">管轄現場一覧</span></div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="p-4 text-xs font-bold text-zinc-400">現場ID / 現場名</th>
                  <th className="p-4 text-xs font-bold text-zinc-400 text-right">当月売上</th>
                  <th className="p-4 text-xs font-bold text-zinc-400 text-right">粗利率</th>
                  <th className="p-4 text-center text-xs font-bold text-zinc-400">分析へ進む</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {areaSites.map(s => (
                  <tr key={s.id} onClick={() => router.push(`/budget/site/${s.id}`)} className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="p-4">
                      <span className="text-[11px] font-montserrat font-bold bg-zinc-100 text-zinc-500 px-2 py-1 rounded-md mr-3">{s.id}</span>
                      <span className="font-bold text-zinc-800 text-base group-hover:text-blue-700">{s.name}</span>
                      {s.rate < 14.5 && <span className="ml-3 text-[10px] bg-rose-100 text-rose-600 px-2 py-1 rounded font-bold">要改善</span>}
                      {s.name.includes('短期') && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">短期PJ</span>}
                      {s.name.includes('6/30') && <span className="ml-2 text-[10px] bg-zinc-200 text-zinc-600 px-2 py-1 rounded font-bold">終了予定</span>}
                    </td>
                    <td className="p-4 text-right font-montserrat font-black text-xl text-[#1e40af] tabular-nums">¥{s.sales.toLocaleString()}</td>
                    <td className={`p-4 text-right font-montserrat font-bold text-lg tabular-nums ${s.rate < 14.5 ? 'text-rose-600' : 'text-zinc-600'}`}>{s.rate.toFixed(1)}%</td>
                    <td className="p-4 text-center"><span className="text-xs font-bold text-zinc-400 group-hover:text-blue-600 transition-colors">詳細を見る →</span></td>
                  </tr>
                ))}
                {areaSites.length === 0 && <tr><td colSpan={4} className="p-8 text-center font-bold text-zinc-400">このエリアの現場データがありません</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}