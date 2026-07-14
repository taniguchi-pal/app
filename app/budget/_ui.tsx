// ── ログイン画面のトーンに揃えた共通UIパーツ ──────────────
// 白カード + ブルーアクセント + Montserrat(見出し/ラベル) + Noto Sans JP(本文)

import React from 'react';
import Link from 'next/link';

export function Shell({ children, agvColor }: { children: React.ReactNode; agvColor?: string }) {
  return (
    <div className="relative min-h-screen bg-[#f0f2f5] text-zinc-800 font-noto pb-10">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(26,54,110,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(26,54,110,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      {agvColor && <AGVLineVertical color={agvColor} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ログイン画面と同じ「AGVが走る水色スキャンライン」演出。ヘッダー等の相対配置コンテナ内に置く（横向き）。
export function AGVLine() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes budget-scan-line { 0% { transform: translateX(-10%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(110%); opacity: 0; } }
        @keyframes budget-agv-dot { 0% { left: -3%; } 100% { left: 103%; } }
      `}} />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] overflow-hidden pointer-events-none">
        <div className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ animation: 'budget-scan-line 6s ease-in-out infinite' }} />
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.7)] pointer-events-none" style={{ animation: 'budget-agv-dot 6s linear infinite' }} />
    </>
  );
}

// 物流倉庫の床ラインをイメージした縦のAGV走行演出。ページ背景に敷く（z-indexは最背面）。
export function AGVLineVertical({ color = '#22d3ee', left = '6%' }: { color?: string; left?: string }) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div className="fixed top-0 bottom-0 pointer-events-none z-0 hidden md:block" style={{ left }} aria-hidden>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes agv-travel-${id} { 0% { top: -12%; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { top: 108%; opacity: 0; } }
      `}} />
      {/* 床の走行ライン（点線） */}
      <div className="absolute inset-y-0 left-0 w-px" style={{ background: `repeating-linear-gradient(to bottom, ${color}33 0, ${color}33 10px, transparent 10px, transparent 20px)` }} />
      {/* 走行するAGVの光跡 */}
      <div className="absolute left-1/2 -translate-x-1/2 w-2 h-16 rounded-full blur-[2px]" style={{ background: `linear-gradient(to bottom, transparent, ${color}aa, transparent)`, animation: `agv-travel-${id} 9s ease-in-out infinite` }} />
      <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px 2px ${color}`, animation: `agv-travel-${id} 9s ease-in-out infinite` }} />
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] md:text-xs font-bold text-blue-600 font-montserrat tracking-[0.15em] uppercase">{children}</p>;
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

export function Card({ title, eyebrow, right, children, className = '' }: { title?: string; eyebrow?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-4 ${className}`}>
      {(title || eyebrow) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
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
export const AREA_THEME: Record<string, { from: string; to: string; soft: string; text: string }> = {
  kanto: { from: '#0e7490', to: '#164e63', soft: '#cffafe', text: '#0e7490' },
  chubu: { from: '#4d7c0f', to: '#365314', soft: '#ecfccb', text: '#4d7c0f' },
  kansai: { from: '#be185d', to: '#831843', soft: '#fce7f3', text: '#be185d' },
  osaka: { from: '#b45309', to: '#78350f', soft: '#fef3c7', text: '#b45309' },
};
const BLUE_THEME = { from: '#1e40af', to: '#1e3a8a', soft: '#dbeafe', text: '#1e40af' };

export function HeroStat({ eyebrow, value, sub, areaId }: { eyebrow: string; value: React.ReactNode; sub?: React.ReactNode; areaId?: string }) {
  const t = (areaId && AREA_THEME[areaId]) || BLUE_THEME;
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 text-white shadow-lg"
      style={{ backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})`, boxShadow: `0 10px 30px -8px ${t.from}66` }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sheen-${uid} { 0% { transform: translateX(-120%) skewX(-15deg); } 100% { transform: translateX(220%) skewX(-15deg); } }
      `}} />
      {/* つやのある光の帯が定期的に通過 */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" style={{ animation: `sheen-${uid} 5s ease-in-out infinite` }} />
      <p className="relative text-[10px] font-bold text-white/70 font-montserrat tracking-[0.15em] uppercase">{eyebrow}</p>
      <p className="relative mt-2 text-2xl md:text-3xl font-black tracking-tight font-mono">{value}</p>
      {sub && <div className="relative mt-2 text-xs font-bold text-white/70">{sub}</div>}
    </div>
  );
}

// エリアの気象注意報を控えめに点滅表示するチップ（太陽/警戒アイコン）
export function WeatherBadge({ text }: { text: string }) {
  const icon = text.includes('厳重') ? '☀️' : text.includes('台風') ? '🌀' : '⚠️';
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes weather-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }` }} />
      <span
        className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5"
        style={{ animation: 'weather-blink 1.8s ease-in-out infinite' }}
      >
        <span aria-hidden>{icon}</span>{text}
      </span>
    </>
  );
}

export function TabRow({ items, active, onSelect }: { items: string[]; active: string; onSelect: (v: string) => void }) {
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
          {m}
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

export function ProgressBar({ rate, color = 'bg-blue-600' }: { rate: number | null; color?: string }) {
  return (
    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${rate == null ? 'bg-zinc-200' : color}`} style={{ width: `${Math.min(rate ?? 0, 100)}%` }} />
    </div>
  );
}
