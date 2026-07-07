import { NextResponse } from 'next/server';

export async function GET() {
  // 💡 6月以降スプレッドシートからデータを引っ張るための、器となるダミーデータ
  const mockJuneData = {
    topics: ['6月予算 ¥5,350万 ➔ 見込み ¥4,978万', '関西GAP ▲322万の補填計画を週次追跡中'],
    schedule: ['■ 6月末: 受注残35名のうち15名充足', '■ 7月末: 稼働225名水準への回復'],
    summary: { sales: 49780000, grossProfit: 5986296, sites: 38, staffs: 193 },
    areas: [
      { id: 'all', title: '全体', salesBudget: 53500000, salesActual: 49780000, gpBudget: 7513610, gpActual: 5986296, recruitment: { joined: 15, resigned: 2 } },
      { id: 'kanto', title: '関東', salesBudget: 7490000, salesActual: 7500000, gpBudget: 1232684, gpActual: 1079448, recruitment: { joined: 3, resigned: 0 } },
      { id: 'chubu', title: '中部', salesBudget: 7740000, salesActual: 7560000, gpBudget: 1220940, gpActual: 1173160, recruitment: { joined: 3, resigned: 0 } },
      { id: 'kansai', title: '関西', salesBudget: 17720000, salesActual: 14500000, gpBudget: 2516926, gpActual: 1273882, recruitment: { joined: 6, resigned: 1 } },
      { id: 'osaka', title: '大阪', salesBudget: 20550000, salesActual: 20220000, gpBudget: 2543060, gpActual: 2459806, recruitment: { joined: 3, resigned: 1 } },
    ]
  };

  return NextResponse.json(mockJuneData);
}