// ── ログイン画面のトーンに揃えた共通UIパーツ ──────────────
// 白カード + ブルーアクセント + Montserrat(見出し/ラベル) + Noto Sans JP(本文)

import React from 'react';
import Link from 'next/link';
import { dashboardUpdatedLabel } from './_data';

export function Shell({ children, agvColor }: { children: React.ReactNode; agvColor?: string }) {
  return (
    <div className="relative min-h-screen bg-[#f0f2f5] text-zinc-800 font-noto pb-10">
      {/* 方眼紙風の背景（細線20px + 太線100pxごとの2重グリッド） */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(26,54,110,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,54,110,0.05) 1px, transparent 1px),
            linear-gradient(rgba(26,54,110,0.11) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,54,110,0.11) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
        }}
      />
      {agvColor && <AGVLineVertical color={agvColor} />}
      <div className="fixed top-2 right-2 md:top-3 md:right-3 z-30 pointer-events-none">
        <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-zinc-500 bg-white/80 backdrop-blur border border-zinc-200 rounded-full px-2.5 py-1 shadow-sm">
          <span aria-hidden>🕒</span>{dashboardUpdatedLabel()}
        </span>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ログイン画面と同じ「AGVが走るスキャンライン」演出。ヘッダー等の相対配置コンテナ内に置く（横向き）。
// colorはAGVLineVertical・ShellのagvColorと揃えたパステル色を渡す想定（目立ちすぎないように）。
export function AGVLine({ color = '#93c5fd' }: { color?: string }) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes budget-scan-line-${id} { 0% { transform: translateX(-10%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(110%); opacity: 0; } }
        @keyframes budget-agv-dot-${id} { 0% { left: -3%; } 100% { left: 103%; } }
      `}} />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px overflow-hidden pointer-events-none opacity-50">
        <div
          className="absolute top-0 h-full w-1/3"
          style={{
            background: `linear-gradient(to right, transparent, ${color}, transparent)`,
            boxShadow: `0 0 4px ${color}55`,
            animation: `budget-scan-line-${id} 6s ease-in-out infinite`,
          }}
        />
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-sm pointer-events-none opacity-50"
        style={{ background: color, boxShadow: `0 0 3px ${color}66`, animation: `budget-agv-dot-${id} 6s linear infinite` }}
      />
    </>
  );
}

// エリア別・全社共通のAGVライン用パステルカラー（HeroStat等の濃い配色とは別枠。目立ちすぎない柔らかい色調）。
export const AGV_PASTEL: Record<string, string> = {
  kanto: '#a5f3fc', // pastel cyan
  chubu: '#d9f99d', // pastel lime
  kansai: '#fbcfe8', // pastel pink
  osaka: '#fde68a', // pastel amber
  company: '#bfdbfe', // pastel blue
};

// 物流倉庫の床ラインをイメージした縦のAGV走行演出。ページ背景に敷く（z-indexは最背面）。
export function AGVLineVertical({ color = '#22d3ee', left = '6%' }: { color?: string; left?: string }) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div className="fixed top-0 bottom-0 pointer-events-none z-0 hidden md:block" style={{ left }} aria-hidden>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes agv-travel-${id} { 0% { top: -12%; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { top: 108%; opacity: 0; } }
      `}} />
      {/* 床の走行ライン（点線） */}
      <div className="absolute inset-y-0 left-0 w-px" style={{ background: `repeating-linear-gradient(to bottom, ${color}22 0, ${color}22 10px, transparent 10px, transparent 20px)` }} />
      {/* 走行するAGVの光跡 */}
      <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-14 rounded-full blur-[3px] opacity-60" style={{ background: `linear-gradient(to bottom, transparent, ${color}66, transparent)`, animation: `agv-travel-${id} 9s ease-in-out infinite` }} />
      <div className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-60" style={{ background: color, boxShadow: `0 0 4px 1px ${color}99`, animation: `agv-travel-${id} 9s ease-in-out infinite` }} />
    </div>
  );
}

export function Eyebrow({ children, color = 'text-blue-600' }: { children: React.ReactNode; color?: string }) {
  return <p className={`text-[10px] md:text-xs font-bold ${color} font-montserrat tracking-[0.15em] uppercase`}>{children}</p>;
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-full px-3 py-1.5 transition mb-2">
      <span aria-hidden>←</span>{label}
    </Link>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 mb-1 flex-wrap">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-zinc-300">/</span>}
          {it.href ? <Link href={it.href} className="text-blue-600 hover:underline">{it.label}</Link> : <span className="text-zinc-600">{it.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export function Card({ title, eyebrow, eyebrowColor, right, children, className = '' }: { title?: string; eyebrow?: string; eyebrowColor?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-4 ${className}`}>
      {(title || eyebrow) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {eyebrow && <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-sm font-bold text-zinc-900 mt-0.5">{title}</h2>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// エリア別アクセントカラー（関東=水色 / 中部=黄緑 / 関西=ピンク / 大阪支店=琥珀）
// 彩度・明度を抑えた「くすみカラー」。以前は原色に近く目に刺さる配色だったため、少し淡く落ち着いたトーンに調整。
export const AREA_THEME: Record<string, { from: string; to: string; soft: string; text: string }> = {
  kanto: { from: '#3d94a8', to: '#2a6d7c', soft: '#e3f4f7', text: '#2a6d7c' },
  chubu: { from: '#84a352', to: '#61793c', soft: '#eff5e4', text: '#61793c' },
  kansai: { from: '#c56c8f', to: '#a14e70', soft: '#f8e9ef', text: '#a14e70' },
  osaka: { from: '#c39355', to: '#9c723c', soft: '#f6ede1', text: '#9c723c' },
};
const BLUE_THEME = { from: '#1e40af', to: '#1e3a8a', soft: '#dbeafe', text: '#1e40af' };

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ガラス細工風（グラスモーフィズム）: 背景をやや透過させて方眼紙を透かし、backdrop-blurですりガラス感を出す。
// 上部に薄いハイライト帯を重ねてガラスの反射っぽさを演出。
export function HeroStat({ eyebrow, value, sub, areaId }: { eyebrow: string; value: React.ReactNode; sub?: React.ReactNode; areaId?: string }) {
  const t = (areaId && AREA_THEME[areaId]) || BLUE_THEME;
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 text-white shadow-lg border"
      style={{
        backgroundImage: `linear-gradient(135deg, ${hexToRgba(t.from, 0.7)}, ${hexToRgba(t.to, 0.78)})`,
        borderColor: 'rgba(255,255,255,0.35)',
        boxShadow: `0 8px 32px -10px ${t.from}66, inset 0 1px 0 rgba(255,255,255,0.3)`,
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sheen-${uid} { 0% { transform: translateX(-120%) skewX(-15deg); } 100% { transform: translateX(220%) skewX(-15deg); } }
      `}} />
      {/* ガラス上部の反射ハイライト */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
      {/* つやのある光の帯が定期的に通過 */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" style={{ animation: `sheen-${uid} 5s ease-in-out infinite` }} />
      <p className="relative text-[10px] font-bold text-white/70 font-montserrat tracking-[0.15em] uppercase">{eyebrow}</p>
      <p className="relative mt-2 text-2xl md:text-3xl font-black tracking-tight font-mono" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>{value}</p>
      {sub && <div className="relative mt-2 text-xs font-bold text-white/70">{sub}</div>}
    </div>
  );
}

// WMO weather_code（Open-Meteo）を可愛い天気アイコンに変換
export function weatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code === 1) return '🌤️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if ([51, 53, 55, 56, 57, 80, 81, 82].includes(code)) return '🌦️';
  if ([61, 63, 65, 66, 67].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌡️';
}

// エリアの実際の気象情報（気温・天気アイコン）を表示するチップ。
// 熱中症の危険がある気温（34℃以上）では赤く点滅して警告する。
export function WeatherBadge({ areaTitle, tempC, weatherCode }: { areaTitle: string; tempC: number; weatherCode: number }) {
  const icon = weatherIcon(weatherCode);
  const danger = tempC >= 34;
  const caution = !danger && tempC >= 31;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes weather-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }` }} />
      <span
        className={`inline-flex items-center gap-1 text-[9px] font-bold rounded-full px-1.5 py-0.5 border ${
          danger ? 'text-white bg-rose-600 border-rose-600' : caution ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-zinc-500 bg-zinc-50 border-zinc-200'
        }`}
        style={danger ? { animation: 'weather-blink 1.2s ease-in-out infinite' } : undefined}
      >
        <span aria-hidden>{icon}</span>{areaTitle} {Math.round(tempC)}℃
        {danger && <span aria-hidden> ⚠熱中症厳重警戒</span>}
      </span>
    </>
  );
}

export function TabRow({ items, active, onSelect, labels }: { items: string[]; active: string; onSelect: (v: string) => void; labels?: Record<string, string> }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((m) => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
            active === m ? 'bg-blue-900 text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
          }`}
        >
          {labels?.[m] ?? m}
        </button>
      ))}
    </div>
  );
}

export function AchieveBadge({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded">計画中</span>;
  const tone = rate >= 100 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : rate >= 95 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200';
  return <span className={`text-[10px] font-bold px-2 py-1 rounded border ${tone}`}>達成 {rate.toFixed(1)}%</span>;
}

export function MiniStat({ label, value, unit, sub, danger }: { label: string; value: React.ReactNode; unit?: string; sub?: string; danger?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border ${danger ? 'bg-rose-50 border-rose-100' : 'bg-zinc-50 border-zinc-100'}`}>
      <p className={`text-[10px] font-bold ${danger ? 'text-rose-500' : 'text-zinc-400'}`}>{label}</p>
      <p className={`text-xl font-black mt-1 font-mono ${danger ? 'text-rose-700' : 'text-zinc-800'}`}>
        {value} {unit && <span className="text-xs font-normal">{unit}</span>}
      </p>
      {sub && <p className={`text-[9px] mt-1 font-bold ${danger ? 'text-rose-500' : 'text-zinc-400'}`}>{sub}</p>}
    </div>
  );
}

// 折れ線グラフのY軸目盛りを、データの規模（現場ごとの売上~数十万円〜エリア全体の数千万円まで様々）に応じて
// キリのいい間隔（1・2・5×10^n）に自動調整する。tickCountだけに頼ると半端な数値の目盛りになりやすいため、
// 実際の最大値から目盛り本数targetCount本ぶんの「きれいな刻み幅」を逆算してticks配列を生成する。
export function niceTicks(maxValue: number, targetCount = 6): number[] {
  const max = Math.max(maxValue, 1);
  const rawStep = max / Math.max(targetCount, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceMultiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceMultiplier * magnitude;
  const ticks: number[] = [0];
  while (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export function ProgressBar({ rate, color = 'bg-blue-600' }: { rate: number | null; color?: string }) {
  return (
    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${rate == null ? 'bg-zinc-200' : color}`} style={{ width: `${Math.min(rate ?? 0, 100)}%` }} />
    </div>
  );
}
