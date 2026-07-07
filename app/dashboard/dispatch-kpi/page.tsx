'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AreaData {
  id: string;
  title: string;
  salesBudget: number;
  salesActual: number;
  gpBudget: number;
  gpActual: number;
  recruitment: { joined: number; resigned: number; cost?: number };
}

interface MonthlyData {
  topics: string[];
  schedule: string[];
  summary: { sales: number; grossProfit: number; sites: number; staffs: number };
  areas: AreaData[];
}

export default function CompleteDashboard() {
  const [activeMonth, setActiveMonth] = useState<string>('5月実績');
  const [apiData6, setApiData6] = useState<MonthlyData | null>(null);

  // 📊 共有いただいた業況資料・アジェンダシートからの確定データ
  const staticData: Record<string, MonthlyData> = {
    '4月実績': {
      topics: [
        '売上実績 4,988万円 (予算比+8.8%) の好スタート！',
        '営業利益 417万円 (利益率8.4%) を記録。関西が大きく牽引',
        '採用状況: 応募70件、入職12名、退職10名で純増(+2名)',
        '採用単価: ¥16,083 (募集費管理より)'
      ],
      schedule: [
        '■ 5月: 新規案件の仕込み (黒岩運輸、SHUUEI物流など)',
        '■ 6月: 新規4案件の稼働開始 / 受注残18名の完全充足',
        '■ 下期: ドライバー派遣乗り換えによる+80万積上 / 価格交渉'
      ],
      summary: { sales: 49883158, grossProfit: 8057108, sites: 39, staffs: 200 },
      areas: [
        { id: 'all', title: '全体', salesBudget: 46302000, salesActual: 49883158, gpBudget: 6623846, gpActual: 8057108, recruitment: { joined: 12, resigned: 10, cost: 16083 } },
        { id: 'kanto', title: '関東', salesBudget: 7452000, salesActual: 7580256, gpBudget: 999747, gpActual: 1232567, recruitment: { joined: 0, resigned: 0 } },
        { id: 'chubu', title: '中部', salesBudget: 6770000, salesActual: 7719682, gpBudget: 1071695, gpActual: 1211200, recruitment: { joined: 0, resigned: 0 } },
        { id: 'kansai', title: '関西', salesBudget: 11020000, salesActual: 11158937, gpBudget: 1466646, gpActual: 2060851, recruitment: { joined: 12, resigned: 10 } },
        { id: 'osaka', title: '大阪', salesBudget: 21060000, salesActual: 23423983, gpBudget: 3086758, gpActual: 3552490, recruitment: { joined: 0, resigned: 0 } },
      ]
    },
    '5月実績': {
      topics: [
        '売上実績 4,348万円、利益率3.8%へ低下 (有給費+64万などの一時要因)',
        '退職19名の損失(月次241万減)と受注残35名(月次901万減)の解消が急務',
        '採用状況: 5月入社確定4名 (HRドメイン・Q-mate並走で応募獲得中)',
        '営業進捗: 商談11件 / 新規成約4件 (目標超過！)'
      ],
      schedule: [
        '■ 6月20日: 退職19名の入替採用の媒体掲載完了',
        '■ 6月末: 6月立ち上げ4案件の稼働確認完了',
        '■ 7月末: 稼働225名水準への回復 / 関東・中部工数改善(120h目標)'
      ],
      summary: { sales: 43478011, grossProfit: 5548158, sites: 38, staffs: 193 },
      areas: [
        { id: 'all', title: '全体', salesBudget: 44534000, salesActual: 43478011, gpBudget: 6239310, gpActual: 5548158, recruitment: { joined: 4, resigned: 19, cost: 22092 } },
        { id: 'kanto', title: '関東', salesBudget: 7100000, salesActual: 6878370, gpBudget: 1174255, gpActual: 1015258, recruitment: { joined: 0, resigned: 0 } },
        { id: 'chubu', title: '中部', salesBudget: 6354000, salesActual: 6947740, gpBudget: 1071695, gpActual: 1157937, recruitment: { joined: 2, resigned: 3 } },
        { id: 'kansai', title: '関西', salesBudget: 10580000, salesActual: 9322106, gpBudget: 1436060, gpActual: 896531, recruitment: { joined: 2, resigned: 16 } },
        { id: 'osaka', title: '大阪', salesBudget: 20500000, salesActual: 20329795, gpBudget: 2557300, gpActual: 2478432, recruitment: { joined: 0, resigned: 0 } },
      ]
    }
  };

  useEffect(() => {
    // 💡 6月以降はスプレッドシート連携（現状はモックデータ）
    const fetchJuneData = async () => {
      const mock6: MonthlyData = {
        topics: ['※6月進捗は現在テスト用ダミーです', 'スプレッドシートやAPIからのデータをここに反映します。'],
        schedule: ['■ 7月: 稼働225名水準への回復'],
        summary: { sales: 49780000, grossProfit: 5986296, sites: 39, staffs: 215 },
        areas: [
          { id: 'all', title: '全体', salesBudget: 53500000, salesActual: 49780000, gpBudget: 7513610, gpActual: 5986296, recruitment: { joined: 15, resigned: 2 } },
          { id: 'kanto', title: '関東', salesBudget: 7490000, salesActual: 7500000, gpBudget: 1232684, gpActual: 1079448, recruitment: { joined: 3, resigned: 0 } },
          { id: 'chubu', title: '中部', salesBudget: 7740000, salesActual: 7560000, gpBudget: 1220940, gpActual: 1173160, recruitment: { joined: 3, resigned: 0 } },
          { id: 'kansai', title: '関西', salesBudget: 17720000, salesActual: 14500000, gpBudget: 2516926, gpActual: 1273882, recruitment: { joined: 6, resigned: 1 } },
          { id: 'osaka', title: '大阪', salesBudget: 20550000, salesActual: 20220000, gpBudget: 2543060, gpActual: 2459806, recruitment: { joined: 3, resigned: 1 } },
        ]
      };
      setApiData6(mock6);
    };
    fetchJuneData();
  }, []);

  const currentData = activeMonth === '6月進捗' ? apiData6 : staticData[activeMonth];

  if (!currentData) return <div className="p-8 text-center font-bold text-slate-500">データを読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <header className="flex items-center justify-between px-8 py-4 bg-slate-50 border-b border-slate-200 mb-6">
        <div>
          <p className="text-xs font-bold text-blue-900 tracking-widest uppercase">Staffing Management Brain</p>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">人材ソリューション事業部 ダッシュボード</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-3xl font-serif font-bold tracking-widest text-slate-800 flex items-center gap-2">
            <span className="text-red-600">|</span>PAL
          </div>
        </div>
      </header>

      <main className="px-8 space-y-6">
        
        {/* 📢 トピックス ＆ 年間スケジュール */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">TOPICS</span>
              <h2 className="text-sm font-bold text-slate-700">{activeMonth} 事業部トピックス</h2>
            </div>
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside font-medium">
              {currentData.topics.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">SCHEDULE</span>
              <h2 className="text-sm font-bold text-slate-700">重要スケジュール / コミット</h2>
            </div>
            <ul className="text-sm text-slate-600 space-y-1.5 font-medium">
              {currentData.schedule.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>

        {/* 📊 メインKPIカード */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-blue-800 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
            <p className="text-sm font-medium text-blue-200">1Q (4-6月) 累計着地 & 通期比</p>
            <div className="mt-4">
              <span className="text-4xl md:text-5xl font-black tracking-tighter">¥142,300,000</span>
            </div>
            <p className="text-xs font-medium text-blue-300 mt-2">
              前年比(YoY) <span className="text-emerald-300 font-bold">+6.4%</span>
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-bold text-slate-400">選択月 事業部合計 <span className="text-slate-500">({activeMonth})</span></p>
            <div className="flex items-end gap-10 mt-4">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">売上実績</p>
                <p className="text-3xl font-black tracking-tighter text-blue-700">
                  ¥{currentData.summary.sales.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">粗利②実績</p>
                <p className="text-3xl font-black tracking-tighter text-teal-600">
                  ¥{currentData.summary.grossProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-bold text-slate-400 mb-4">事業部運営インフラ <span className="text-slate-500">({activeMonth})</span></p>
            <div className="flex gap-4 h-full">
              <div className="flex-1 bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">現場数</p>
                <p className="text-2xl font-black text-slate-800">{currentData.summary.sites}</p>
              </div>
              <div className="flex-1 bg-white rounded-2xl flex flex-col items-center justify-center p-4 border border-slate-800">
                <p className="text-xs font-bold text-slate-500 mb-1">稼働スタッフ</p>
                <p className="text-2xl font-black text-slate-800">{currentData.summary.staffs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🎛️ フィルター */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-28">Timeline:</span>
            <div className="flex flex-wrap gap-2">
              {['4月実績', '5月実績', '6月進捗'].map(m => (
                <button 
                  key={m} 
                  onClick={() => setActiveMonth(m)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${activeMonth === m ? 'bg-blue-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🏢 エリア別カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {currentData.areas.map((area, idx) => (
            <AreaCard key={idx} area={area} />
          ))}
        </div>
      </main>
    </div>
  );
}

// 💡 入り・出・採用単価・KPIバーを網羅したエリアカード
function AreaCard({ area }: { area: AreaData }) {
  const salesGap = area.salesActual - area.salesBudget;
  const gpGap = area.gpActual - area.gpBudget;
  const achieveRate = ((area.salesActual / area.salesBudget) * 100).toFixed(1);
  const isDanger = Number(achieveRate) < 95;
  const achieveColor = isDanger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600';

  return (
    <div className={`bg-white rounded-3xl border ${isDanger ? 'border-rose-200' : 'border-slate-200'} p-5 shadow-sm flex flex-col relative pb-14 hover:shadow-md transition`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-black text-slate-800 text-lg">{area.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-bold ${achieveColor}`}>
          達成率 {achieveRate}%
        </span>
      </div>
      
      <div className="h-0.5 w-full bg-slate-100 mb-4"></div>

      {/* 💰 売上 & 粗利 */}
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400">売上 (Budget / Actual)</p>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold text-slate-400 line-through decoration-slate-300">¥{area.salesBudget.toLocaleString()}</p>
            <p className="text-xl font-black text-blue-800 tracking-tighter">¥{area.salesActual.toLocaleString()}</p>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] font-bold text-slate-400">GAP</span>
            <span className={`text-sm font-bold ${salesGap < 0 ? 'text-rose-600' : 'text-teal-500'}`}>
              {salesGap > 0 ? '+' : ''}{salesGap.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400">粗利② (Budget / Actual)</p>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold text-slate-400 line-through decoration-slate-300">¥{area.gpBudget.toLocaleString()}</p>
            <p className="text-xl font-black text-teal-700 tracking-tighter">¥{area.gpActual.toLocaleString()}</p>
          </div>
           <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] font-bold text-slate-400">GAP</span>
            <span className={`text-sm font-bold ${gpGap < 0 ? 'text-rose-600' : 'text-teal-500'}`}>
              {gpGap > 0 ? '+' : ''}{gpGap.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="h-0.5 w-full bg-slate-100 my-4"></div>

      {/* 👥 入り・出・採用単価 */}
      <div className="space-y-3 mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 mb-1">採用状況 (入職 / 退職)</p>
          <div className="flex justify-between items-center text-sm font-bold">
            <div className="flex gap-2">
              <span className="text-emerald-600">入 {area.recruitment.joined}名</span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600">退 {area.recruitment.resigned}名</span>
            </div>
            {area.recruitment.cost && (
              <span className="text-[10px] text-slate-600 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                単価 ¥{area.recruitment.cost.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        {/* 📈 KPI進捗バー */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] font-bold text-slate-400">KPI (1人120h / 現場150万)</p>
            <p className={`text-[10px] font-bold ${isDanger ? 'text-rose-600' : 'text-blue-600'}`}>
              {isDanger ? '改善急務' : '順調'}
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className={`${isDanger ? 'bg-rose-500' : 'bg-blue-500'} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(Number(achieveRate), 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* 🔗 エリアへのリンク */}
      {area.id !== 'all' && (
        <div className="absolute bottom-0 left-0 w-full p-3 bg-slate-50 border-t border-slate-200 rounded-b-3xl text-center">
          <Link href={`/budget/area/${area.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 transition group">
            エリア詳細を見る <span className="group-hover:translate-x-1 transition-transform">➔</span>
          </Link>
        </div>
      )}
    </div>
  );
}