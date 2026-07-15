// エリア別の現在の気象情報をOpen-Meteo（無料・APIキー不要）から取得するプロキシ。
// 熱中症リスク判定のため気温・湿度も返す。

const AREA_COORDS: Record<string, { lat: number; lon: number }> = {
  kanto: { lat: 35.6812, lon: 139.7671 }, // 東京
  chubu: { lat: 35.1815, lon: 136.9066 }, // 名古屋
  kansai: { lat: 34.6901, lon: 135.1955 }, // 神戸
  osaka: { lat: 34.6937, lon: 135.5023 }, // 大阪
};

export async function GET() {
  try {
    const entries = await Promise.all(
      Object.entries(AREA_COORDS).map(async ([areaId, { lat, lon }]) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FTokyo`;
        const res = await fetch(url, { next: { revalidate: 1800 } });
        if (!res.ok) return [areaId, null] as const;
        const data = await res.json();
        const current = data?.current;
        if (!current) return [areaId, null] as const;
        return [
          areaId,
          {
            tempC: current.temperature_2m as number,
            humidity: current.relative_humidity_2m as number,
            weatherCode: current.weather_code as number,
            observedAt: current.time as string,
          },
        ] as const;
      })
    );
    return Response.json(Object.fromEntries(entries));
  } catch {
    return Response.json({ error: 'weather fetch failed' }, { status: 502 });
  }
}
