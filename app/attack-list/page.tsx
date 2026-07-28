'use client';

import React, { useEffect, useState } from 'react';
import { Shell, Card, BackLink } from '../budget/_ui';
import { SITES, COMPANY_MONTHLY, CURRENT_ACTUAL_MONTH, BACKLOG_STACKUP_MONTHLY_TARGET, yen } from '../budget/_data';

const SALES_REPS = ['田中', '谷口', '岩田'] as const;

const STATUS_OPTIONS = ['初商談', 'ニーズなし定期タッチ', '見積提示', '成約', '稼働中', '非稼働中'] as const;
type AttackStatus = typeof STATUS_OPTIONS[number];

const STATUS_STYLE: Record<string, string> = {
  初商談: 'text-blue-700 bg-blue-50 border-blue-200',
  ニーズなし定期タッチ: 'text-zinc-500 bg-zinc-100 border-zinc-200',
  見積提示: 'text-amber-700 bg-amber-50 border-amber-200',
  成約: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  稼働中: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  非稼働中: 'text-rose-600 bg-rose-50 border-rose-200',
};
const STATUS_ICON: Record<string, string> = {
  初商談: '🤝', ニーズなし定期タッチ: '🌙', 見積提示: '📝', 成約: '🎉', 稼働中: '🔥', 非稼働中: '💤',
};

const PROBABILITY_OPTIONS = ['A', 'B', 'C', 'D'] as const;
type Probability = typeof PROBABILITY_OPTIONS[number];
const PROBABILITY_STYLE: Record<string, string> = {
  A: 'text-white bg-emerald-600 border-emerald-600',
  B: 'text-white bg-blue-600 border-blue-600',
  C: 'text-white bg-amber-500 border-amber-500',
  D: 'text-white bg-zinc-400 border-zinc-400',
};

const CONTACT_METHODS = ['訪問', 'TEL', 'メール'] as const;
type ContactMethod = typeof CONTACT_METHODS[number];
interface ContactLogEntry { datetime: string; method: ContactMethod; content: string }

interface AttackEntry {
  id: string;
  company: string;
  area: string;
  status: AttackStatus | string;
  probability: Probability | string;
  salesRep: string;
  repContact: string;
  linkedSiteId: string; // 既存現場に成約した場合、SITESのidを紐づけて現場カルテと連動させる
  nextVisitDate: string;
  lastContactDate: string;
  telAppoCount: number;
  quoteUrl: string;
  notebookLmUrl: string;
  asanaUrl: string;
  minutesUrl: string;
  needsIssues: string;
  escalatedTo: string;
  notes: string;
  contactLogJson: string;
  createdAt: string;
  updatedAt: string;
}

function parseLog(json: string): ContactLogEntry[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowDatetimeLocal = () => new Date().toISOString().slice(0, 16);

// ── 専用スプレッドシート設定前の一時保存（このブラウザのみ）用シード ──
// いただいた営業リストのうち、企業名・連絡先・住所などが明確に読み取れた分をあらかじめ登録しておく。
// 列が崩れて読み取れなかった行（例: ミツカンロジテックの直後で複数行が混在していた箇所）は含めていない。
const LOCAL_STORAGE_KEY = 'attackListLocalEntries_v1';
type SeedEntry = Partial<AttackEntry> & { company: string; salesRep: string };
const SEED_ENTRIES: SeedEntry[] = [
  { company: 'ダイキン工業株式会社', area: '関西', salesRep: '岩田', repContact: '生地 幹', notes: '06-6373-4365・7/22会議中', updatedAt: '2026-07-17' },
  { company: 'タカラスタンダード株式会社', area: '関西', salesRep: '岩田', status: '初商談', notes: '滋賀物流0748(63)5053', updatedAt: '2026-07-17' },
  { company: '安田倉庫株式会社', area: '関西', salesRep: '岩田', repContact: '吉田 祐耶', notes: '072-648-5855・7/22不在', updatedAt: '2026-07-17' },
  { company: '滋賀近交運輸倉庫 大阪支店', area: '関西', salesRep: '岩田', repContact: '平田さん', notes: '072-881-3311・7/22週末まで岡山出張', updatedAt: '2026-07-17' },
  { company: '日本梱包運輸倉庫 新茨木営業所', area: '関西', salesRep: '岩田', status: '初商談', notes: '072-646-5188・7/22席外し', updatedAt: '2026-07-17' },
  { company: '株式会社中央倉庫', area: '関西', salesRep: '岩田', repContact: '田口 忠夫', notes: '075-321-9135・京都市下京区朱雀内畑町41', updatedAt: '2026-07-17' },
  { company: '株式会社マルカミ物流', area: '関西', salesRep: '岩田', repContact: '濱本 邦広', notes: '072-650-3737・7/22繁忙 盆明けくらいに再架電', updatedAt: '2026-07-17' },
  { company: '株式会社キーエンス', area: '関西', salesRep: '岩田', repContact: '髙森 亮輔', notes: '072-662-8061・7/22外出', updatedAt: '2026-07-17' },
  { company: 'イズミヤ株式会社', area: '関西', salesRep: '岩田', repContact: '田中 寿幸', notes: '06-6657-3403・7/22使用されていない', updatedAt: '2026-07-17' },
  { company: 'エクセディ物流', area: '関西', salesRep: '岩田', repContact: 'たなべさん（センター長）', notes: '072-822-1462・7/22席外し', updatedAt: '2026-07-17' },
  { company: 'トールエクスプレスジャパン株式会社', area: '関西', salesRep: '岩田', status: '初商談', notes: '072-641-7130・大阪府茨木市宿久庄2-10-2', updatedAt: '2026-07-17' },
  { company: '福山通運 茨木 アルファリンク', area: '関西', salesRep: '岩田', repContact: '池内支店長', status: '初商談', nextVisitDate: '2026-07-29', notes: '072-643-1095・7/22支店長タッチ→7/29アポ', updatedAt: '2026-07-17' },
  { company: 'キャメル珈琲西日本物流センター', area: '関西', salesRep: '岩田', status: 'ニーズなし定期タッチ', notes: '072-631-1272・7/22新規お断り', updatedAt: '2026-07-17' },
  { company: '西濃運輸（株） りんくう物流センター', area: '関西', salesRep: '岩田', repContact: '西尾センター長', notes: '072-464-2411・7/22不在', updatedAt: '2026-07-17' },
  { company: 'シャープ産業株式会社', area: '関西', salesRep: '岩田', status: '初商談', notes: '078-452-5222・7/23会議中', updatedAt: '2026-07-17' },
  { company: 'トランコムEX西日本株式会社', area: '関西', salesRep: '岩田', repContact: 'ハタダン', notes: '06-6300-7135・7/23席外し・2022年5月投入', updatedAt: '2026-07-17' },
  { company: 'オーティーティーロジスティクス株式会社【大阪ロジスティックパーク】', area: '関西', salesRep: '岩田', repContact: 'センター長 川谷様', notes: '072-867-8795・7/23席外し', updatedAt: '2026-07-17' },
  { company: '日本郵便 神戸LSC', area: '関西', salesRep: '岩田', repContact: '橘木さん', notes: '7/22橘木さんタッチ・採用計画思案中', updatedAt: '2026-07-17' },
  { company: '西濃運輸ロジ部', area: '関西', salesRep: '岩田', repContact: '瓦部長', notes: '大阪市西成区玉出西2丁目20-48', updatedAt: '2026-07-17' },
  { company: '（株）ミツカンロジテック 関西物流センター', area: '関西', salesRep: '岩田', repContact: '永吉様・田中', notes: '072-858-2353・大阪府枚方市春日北町5丁目1-1', updatedAt: '2026-07-17' },
  { company: '大阪運輸倉庫株式会社（旭区）', area: '関西', salesRep: '岩田', status: '初商談', notes: '06-6921-6174・大阪市旭区赤川1-11-8', updatedAt: '2026-07-23' },
  { company: '大阪運輸倉庫株式会社（摂津）', area: '関西', salesRep: '岩田', status: '初商談', notes: '06-6349-1821・摂津市東別府3-1-7', updatedAt: '2026-07-23' },
  { company: '大阪運輸倉庫株式会社（堺）', area: '関西', salesRep: '岩田', status: '初商談', notes: '072-241-0221・堺市西区石津西町9', updatedAt: '2026-07-23' },
  { company: '大阪運輸倉庫株式会社（鶴見）', area: '関西', salesRep: '岩田', status: '初商談', notes: '06-6911-5000・大阪市鶴見区焼野3-2-36', updatedAt: '2026-07-23' },
  { company: 'トランコムEX西日本株式会社（茨木南）', area: '関西', salesRep: '岩田', status: '初商談', notes: '072-646-5583・茨木市南目垣3-3-3 ALFALINK茨木2', updatedAt: '2026-07-23' },
  { company: 'トランコムEX西日本株式会社 茨木北ロジスティクスセンター', area: '関西', salesRep: '岩田', repContact: '吉村さん', notes: '0726-48-7871・茨木市彩都あかね2-1 プロロジスパーク茨木2F', updatedAt: '2026-07-23' },
  { company: '福山通運株式会社東海支店', area: '中部', salesRep: '谷口', status: '初商談', nextVisitDate: '2026-07-23', notes: '7/23アポ', updatedAt: '2026-07-21' },
  { company: '西鉄運輸枚方', area: '関西', salesRep: '谷口', linkedSiteId: '808-1', status: '初商談', nextVisitDate: '2026-07-21', notes: '7/21アポ', updatedAt: '2026-07-21' },
  { company: '西鉄運輸加古川', area: '関西', salesRep: '谷口', linkedSiteId: '832-1', status: '初商談', nextVisitDate: '2026-07-22', notes: '7/22アポ', updatedAt: '2026-07-21' },
  { company: '福山通運株式会社北名古屋センター', area: '中部', salesRep: '谷口', status: '初商談', notes: '日程調整中', updatedAt: '2026-07-21' },
  { company: 'AFS中部センター', area: '中部', salesRep: '谷口', linkedSiteId: '675-1', status: '初商談', notes: '日程調整中', updatedAt: '2026-07-21' },
  { company: '昭和冷蔵小牧センター', area: '中部', salesRep: '谷口', linkedSiteId: '790-1', status: '初商談', nextVisitDate: '2026-07-23', notes: '7/23アポ', updatedAt: '2026-07-21' },
  { company: '日本通運 名古屋港コンテナ', area: '中部', salesRep: '谷口', status: '初商談', notes: '担当者確認中', updatedAt: '2026-07-21' },
  { company: '尾家産業', area: '関西', salesRep: '谷口', status: '初商談', notes: '日程調整中', updatedAt: '2026-07-21' },
  { company: '昭和冷蔵株式会社小坂井センター', area: '中部', salesRep: '谷口', status: '初商談', notes: '担当者確認中・愛知県豊川市篠束町栗穴33番1', updatedAt: '2026-07-22' },
  { company: '昭和冷蔵三重センター', area: '中部', salesRep: '谷口', status: '初商談', notes: '担当者確認中・三重県津市一志町井生1158-6', updatedAt: '2026-07-22' },
  { company: '昭和冷蔵岡崎センター', area: '中部', salesRep: '谷口', status: '初商談', notes: '担当者確認中・愛知県岡崎市西蔵前町字沖8-1', updatedAt: '2026-07-22' },
  { company: '昭和冷蔵牧之原低温センター', area: '中部', salesRep: '谷口', status: '初商談', notes: '担当者確認中・静岡県牧之原市白井745-4', updatedAt: '2026-07-22' },
  { company: '昭和冷蔵牧之原第2センター', area: '中部', salesRep: '谷口', status: '初商談', notes: '担当者確認中・静岡県牧之原市布引原918-1', updatedAt: '2026-07-22' },
  { company: '昭和冷蔵冨士センター', area: '中部', salesRep: '谷口', status: '初商談', notes: '担当者確認中・静岡県富士市大渕字垣ノ内3177番1', updatedAt: '2026-07-22' },
  { company: '株式会社コラビス（東海DDC）', area: '中部', salesRep: '谷口', notes: '愛知県東海市浅山1-15・ピッキング・物流管理・営業事務', updatedAt: '2026-07-24' },
  { company: '株式会社コラビス（名古屋物流センター）', area: '中部', salesRep: '谷口', notes: '名古屋市北区中切町・倉庫内作業（飲料水の仕分け等）', updatedAt: '2026-07-24' },
  { company: '株式会社エスラインヒダ', area: '中部', salesRep: '谷口', notes: '東海市浅山・4tドライバー（コンビニ配送）', updatedAt: '2026-07-24' },
  { company: 'ASKUL LOGIST株式会社（名古屋物流センター）', area: '中部', salesRep: '谷口', notes: '東海市浅山・入荷検品・棚入れ・ピッキング', updatedAt: '2026-07-24' },
  { company: '株式会社レイズ', area: '中部', salesRep: '谷口', notes: '豊明市・商品管理・入出荷業務', updatedAt: '2026-07-24' },
  { company: '伊勢湾海運株式会社（弥富物流センター等）', area: '中部', salesRep: '谷口', notes: '飛島村東浜・倉庫作業員・フォークリフト', updatedAt: '2026-07-24' },
  { company: '株式会社大川屋', area: '関東', salesRep: '谷口', notes: '台東区浅草・ピッキング（おもちゃ）', updatedAt: '2026-07-24' },
  { company: '株式会社iGrus', area: '関東', salesRep: '谷口', notes: '渋谷区円山町・倉庫内仕分け・ピッキング', updatedAt: '2026-07-24' },
  { company: 'テイケイネクスト株式会社', area: '関東', salesRep: '谷口', notes: '草加市草加駅・ピッキング（アーティストグッズ出荷）', updatedAt: '2026-07-24' },
  { company: '株式会社LIXIL', area: '中部', salesRep: '谷口', notes: '知多市北浜町・プラスチック成形（射出成形）', updatedAt: '2026-07-24' },
];
function buildSeedEntries(): AttackEntry[] {
  return SEED_ENTRIES.map((e, i) => ({
    id: `seed_${i}`,
    company: e.company,
    area: e.area || '',
    status: e.status || '',
    probability: e.probability || 'C',
    salesRep: e.salesRep,
    repContact: e.repContact || '',
    linkedSiteId: e.linkedSiteId || '',
    nextVisitDate: e.nextVisitDate || '',
    lastContactDate: e.lastContactDate || '',
    telAppoCount: e.telAppoCount || 0,
    quoteUrl: '', notebookLmUrl: '', asanaUrl: '', minutesUrl: '',
    needsIssues: e.needsIssues || '',
    escalatedTo: e.escalatedTo || '',
    notes: e.notes || '',
    contactLogJson: '[]',
    createdAt: e.updatedAt || todayStr(),
    updatedAt: e.updatedAt || todayStr(),
  }));
}
function readLocalEntries(): AttackEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function writeLocalEntries(list: AttackEntry[]) {
  try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list)); } catch {}
}

const LINK_FIELDS: { key: 'quoteUrl' | 'notebookLmUrl' | 'asanaUrl' | 'minutesUrl'; label: string }[] = [
  { key: 'quoteUrl', label: '見積書' },
  { key: 'notebookLmUrl', label: 'NotebookLM' },
  { key: 'asanaUrl', label: 'Asana' },
  { key: 'minutesUrl', label: '議事録' },
];

export default function AttackListPage() {
  const [view, setView] = useState<'list' | 'new'>('list');
  const [entries, setEntries] = useState<AttackEntry[]>([]);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [statusFilter, setStatusFilter] = useState('');
  const [repFilter, setRepFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState<Partial<AttackEntry>>({});
  const [detailSaving, setDetailSaving] = useState(false);
  const [contactForm, setContactForm] = useState({ method: '訪問' as ContactMethod, content: '' });

  const [newEntry, setNewEntry] = useState({ company: '', area: '', salesRep: '', repContact: '', nextVisitDate: '' });
  const [adding, setAdding] = useState(false);
  // 専用スプレッドシート未設定の間は、このブラウザのローカル保存にフォールバックして使えるようにする
  const [dataMode, setDataMode] = useState<'sheets' | 'local'>('sheets');

  const load = () => {
    fetch('/api/attack-list').then((r) => r.json()).then((data) => {
      if (data?.error) {
        setDataMode('local');
        let list = readLocalEntries();
        if (list.length === 0) {
          list = buildSeedEntries();
          writeLocalEntries(list);
        }
        list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        setEntries(list);
        setApiStatus('ready');
        return;
      }
      setDataMode('sheets');
      const list: AttackEntry[] = (Array.isArray(data) ? data : []).map((r: any) => ({
        ...r,
        telAppoCount: Number(r.telAppoCount) || 0,
      }));
      list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      setEntries(list);
      setApiStatus('ready');
    }).catch(() => setApiStatus('error'));
  };
  useEffect(() => { load(); }, []);

  const save = async (entry: Partial<AttackEntry> & { id?: string }) => {
    if (dataMode === 'local') {
      const list = readLocalEntries();
      const now = new Date().toISOString();
      const id = entry.id || `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const idx = list.findIndex((e) => e.id === id);
      const merged: AttackEntry = {
        ...(idx >= 0 ? list[idx] : { ...entry, createdAt: now } as AttackEntry),
        ...entry,
        id,
        updatedAt: now,
      };
      if (idx >= 0) list[idx] = merged; else list.push(merged);
      writeLocalEntries(list);
      return;
    }
    await fetch('/api/attack-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  };

  const handleAdd = async () => {
    if (!newEntry.company.trim()) return;
    setAdding(true);
    try {
      await save({ ...newEntry, status: '初商談', probability: 'C', telAppoCount: 0, contactLogJson: '[]' });
      setNewEntry({ company: '', area: '', salesRep: '', repContact: '', nextVisitDate: '' });
      load();
      setView('list');
    } finally {
      setAdding(false);
    }
  };

  const updateField = async (entry: AttackEntry, field: 'status' | 'probability', value: string) => {
    const updated = { ...entry, [field]: value };
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
    await save(updated);
  };

  const openDetail = (entry: AttackEntry) => {
    if (expanded === entry.id) {
      setExpanded(null);
      return;
    }
    setExpanded(entry.id);
    setDetailForm({
      repContact: entry.repContact || '',
      linkedSiteId: entry.linkedSiteId || '',
      quoteUrl: entry.quoteUrl || '',
      notebookLmUrl: entry.notebookLmUrl || '',
      asanaUrl: entry.asanaUrl || '',
      minutesUrl: entry.minutesUrl || '',
      needsIssues: entry.needsIssues || '',
      escalatedTo: entry.escalatedTo || '',
      notes: entry.notes || '',
    });
  };

  const saveDetail = async (entry: AttackEntry) => {
    setDetailSaving(true);
    try {
      const updated = { ...entry, ...detailForm };
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
      await save(updated);
    } finally {
      setDetailSaving(false);
    }
  };

  const addContact = async (entry: AttackEntry) => {
    if (!contactForm.content.trim()) return;
    const log = parseLog(entry.contactLogJson);
    log.push({ datetime: nowDatetimeLocal(), method: contactForm.method, content: contactForm.content });
    const updated: AttackEntry = {
      ...entry,
      contactLogJson: JSON.stringify(log),
      lastContactDate: todayStr(),
      telAppoCount: contactForm.method === 'TEL' ? entry.telAppoCount + 1 : entry.telAppoCount,
    };
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
    setContactForm({ method: '訪問', content: '' });
    await save(updated);
  };

  // 営業3名（田中・谷口・岩田）以外の担当が入っているデータも一応表示できるよう、実データにある担当も拾っておく
  const repOptions = Array.from(new Set([...SALES_REPS, ...entries.map((e) => e.salesRep).filter(Boolean)]));
  const filtered = entries.filter((e) =>
    (!statusFilter || e.status === statusFilter) && (!repFilter || e.salesRep === repFilter)
  );

  // 「未対応（サラピン）」＝ ステータス未設定・連絡先未取得・TEL実績なし・コンタクト履歴なしの、まだ何も手を付けていない先
  const isUntouched = (e: AttackEntry) => !e.status && !e.repContact && !(e.telAppoCount > 0) && parseLog(e.contactLogJson).length === 0;
  const approachingList = filtered.filter((e) => !isUntouched(e));
  const untouchedList = filtered.filter(isUntouched);

  // ── 担当者別・事業部 営業活動サマリー（件数・コンバージョン） ──
  const WON_STATUSES = ['成約', '稼働中'];
  const repStats = repOptions.map((rep) => {
    const repEntries = entries.filter((e) => e.salesRep === rep);
    const total = repEntries.length;
    const untouched = repEntries.filter(isUntouched).length;
    const won = repEntries.filter((e) => WON_STATUSES.includes(e.status)).length;
    const byStatus = Object.fromEntries(STATUS_OPTIONS.map((s) => [s, repEntries.filter((e) => e.status === s).length]));
    return { rep, total, untouched, approaching: total - untouched, won, byStatus, conversionRate: total > 0 ? (won / total) * 100 : 0 };
  });
  const overallTotal = entries.length;
  const overallUntouched = entries.filter(isUntouched).length;
  const overallWon = entries.filter((e) => WON_STATUSES.includes(e.status)).length;
  const overallConversion = overallTotal > 0 ? (overallWon / overallTotal) * 100 : 0;

  // ── 月間受注残積み上げ目標（事業部全体のKPI。予実管理ダッシュボードと同じ目標値・進捗を参照） ──
  const stackupProgress = COMPANY_MONTHLY[CURRENT_ACTUAL_MONTH]?.backlogStackupPotential ?? null;
  const stackupRate = stackupProgress != null ? (stackupProgress / BACKLOG_STACKUP_MONTHLY_TARGET) * 100 : null;

  // ── 営業KPI（アプローチ→受注ファネル、一般的な人材派遣・人材紹介営業のKPI水準を参考値として併記） ──
  const QUOTE_OR_LATER = ['見積提示', '成約', '稼働中'];
  const funnelApproach = entries.length;
  const funnelMeeting = entries.filter((e) => !isUntouched(e)).length;
  const funnelQuote = entries.filter((e) => QUOTE_OR_LATER.includes(e.status)).length;
  const funnelOrder = entries.filter((e) => WON_STATUSES.includes(e.status)).length;
  const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
  const FUNNEL_STAGES: { label: string; count: number; rateFromPrev: number | null; benchmarkLabel: string; benchmarkRange: string }[] = [
    { label: 'アプローチ数', count: funnelApproach, rateFromPrev: null, benchmarkLabel: '', benchmarkRange: '' },
    { label: '商談化（商談数）', count: funnelMeeting, rateFromPrev: pct(funnelMeeting, funnelApproach), benchmarkLabel: '商談化率', benchmarkRange: '10〜20%' },
    { label: '見積提示（見積数）', count: funnelQuote, rateFromPrev: pct(funnelQuote, funnelMeeting), benchmarkLabel: '見積提示率', benchmarkRange: '40〜60%' },
    { label: '受注（受注数）', count: funnelOrder, rateFromPrev: pct(funnelOrder, funnelQuote), benchmarkLabel: '受注率', benchmarkRange: '20〜40%' },
  ];
  const overallFunnelConversion = pct(funnelOrder, funnelApproach);

  // ── 次回訪問予定（近い順） ──
  const upcomingVisits = entries
    .filter((e) => e.nextVisitDate)
    .sort((a, b) => a.nextVisitDate.localeCompare(b.nextVisitDate))
    .slice(0, 8);

  return (
    <Shell agvColor="#f59e0b">
      <header className="px-4 md:px-10 pt-6 pb-4 border-b-2 border-orange-100">
        <BackLink href="/" label="TOPページへ戻る" />
        <p className="text-[10px] md:text-xs font-bold text-orange-600 font-montserrat tracking-[0.15em] uppercase">Sales Activity</p>
        <h1 className="mt-1 text-xl md:text-2xl font-black text-zinc-900 tracking-tight">ATTACK LIST</h1>
        <p className="text-xs text-zinc-400 mt-0.5">商談確度・ステータス・コンタクト履歴をSales内で共有管理（毎週月曜MTGで確認）</p>
      </header>

      <main className="px-4 md:px-10 space-y-5">
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 shadow-[0_12px_40px_rgba(217,119,6,0.35)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-white/80 tracking-[0.2em] uppercase">🚀 月間積み上げ目標</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{yen(BACKLOG_STACKUP_MONTHLY_TARGET)}<span className="text-sm font-bold text-white/70 ml-2">/ 月</span></p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-black text-white/80 tracking-[0.2em] uppercase">現在の進捗</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                {stackupProgress != null ? yen(stackupProgress) : 'データ未登録'}
                {stackupRate != null && <span className="text-sm font-bold text-white/70 ml-2">（{stackupRate.toFixed(1)}%）</span>}
              </p>
            </div>
          </div>
          <div className="mt-3 w-full bg-white/25 h-2.5 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(stackupRate ?? 0, 100)}%` }} />
          </div>
          <p className="text-[10px] font-bold text-white/80 mt-2">🏆 みんなでこの目標を積み上げよう！受注残の充足・新規開拓、両方が効いてくる数字です。</p>
        </div>

        {dataMode === 'local' && (
          <Card>
            <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2">
              専用スプレッドシート未設定のため、このブラウザだけに一時保存しています（他の端末とは共有されません）。
              docs/site-overrides-setup.md の手順で「AttackList」シートを設定すると、自動的にそちらへ切り替わり、チーム全員で共有できるようになります。
            </p>
          </Card>
        )}

        {entries.length > 0 && (
          <Card eyebrow="KPI" eyebrowColor="text-orange-600" title="🎯 営業KPI（アプローチ→受注ファネル）">
            <p className="text-[10px] text-zinc-400 -mt-1 mb-3">一般的な人材派遣・人材紹介営業のKPI水準を参考値として併記しています</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {FUNNEL_STAGES.map((s, i) => (
                <div key={s.label} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400">{s.label}</p>
                  <p className="text-xl font-black text-zinc-800 font-mono mt-0.5">{s.count}</p>
                  {i > 0 && (
                    <p className="text-[10px] font-bold text-orange-700 mt-1">
                      {s.rateFromPrev!.toFixed(1)}%
                      <span className="text-zinc-400 font-normal ml-1">（{s.benchmarkLabel} 参考 {s.benchmarkRange}）</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-orange-50 border border-orange-100">
              <span className="text-xs font-bold text-orange-900">総合コンバージョン（アプローチ→受注）</span>
              <span className="text-sm font-black text-orange-800 font-mono">{overallFunnelConversion.toFixed(1)}%<span className="text-[10px] font-normal text-orange-600 ml-1">（参考 2〜5%）</span></span>
            </div>
          </Card>
        )}

        {entries.length > 0 && (
          <Card eyebrow="Summary" eyebrowColor="text-orange-600" title="📊 担当者・事業部 営業活動サマリー">
            <p className="text-[10px] text-zinc-400 -mt-1 mb-3">🆕 未対応（サラピン）＝ ステータス・連絡先・コンタクト履歴が何もまだ無い先／🔥 アプローチ中 ＝ 何かしら手を付けた先</p>
            <div className="overflow-x-auto -mx-1 mb-1">
              <table className="min-w-[720px] w-full text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-100">
                    <th className="text-left font-bold px-2 py-1.5">担当Sales</th>
                    <th className="text-right font-bold px-2 py-1.5">件数</th>
                    <th className="text-right font-bold px-2 py-1.5">🆕 未対応</th>
                    <th className="text-right font-bold px-2 py-1.5">🔥 アプローチ中</th>
                    {STATUS_OPTIONS.map((s) => <th key={s} className="text-right font-bold px-2 py-1.5">{STATUS_ICON[s]} {s}</th>)}
                    <th className="text-right font-bold px-2 py-1.5">コンバージョン</th>
                  </tr>
                </thead>
                <tbody>
                  {repStats.map((r) => (
                    <tr key={r.rep} className="border-b border-zinc-50">
                      <td className="px-2 py-1.5 font-bold text-zinc-700">{r.rep}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{r.total}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-zinc-400">{r.untouched}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{r.approaching}</td>
                      {STATUS_OPTIONS.map((s) => <td key={s} className="px-2 py-1.5 text-right font-mono">{r.byStatus[s] || 0}</td>)}
                      <td className="px-2 py-1.5 text-right font-mono font-bold text-orange-700">{r.conversionRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 bg-zinc-50">
                    <td className="px-2 py-1.5 font-black text-zinc-700">事業部全体</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black">{overallTotal}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black text-zinc-400">{overallUntouched}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-black">{overallTotal - overallUntouched}</td>
                    {STATUS_OPTIONS.map((s) => (
                      <td key={s} className="px-2 py-1.5 text-right font-mono font-black">{entries.filter((e) => e.status === s).length}</td>
                    ))}
                    <td className="px-2 py-1.5 text-right font-mono font-black text-orange-800">{overallConversion.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">コンバージョン ＝（成約＋稼働中）÷ 件数</p>
          </Card>
        )}

        {upcomingVisits.length > 0 && (
          <Card eyebrow="Schedule" eyebrowColor="text-orange-600" title="📅 次回訪問予定（近い順）">
            <ul className="space-y-1.5">
              {upcomingVisits.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-700">{e.company}</span>
                  <span className="text-zinc-400">{e.salesRep || '担当未設定'}</span>
                  <span className="font-mono font-bold text-orange-700">{e.nextVisitDate}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${view === 'list' ? 'bg-orange-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
          >
            一覧（{entries.length}件）
          </button>
          <button
            onClick={() => setView('new')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${view === 'new' ? 'bg-orange-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
          >
            + 新規登録
          </button>
        </div>

        {view === 'new' && (
        <Card eyebrow="New" eyebrowColor="text-orange-600" title="➕ 新規アタック先を追加">
          <p className="text-[10px] text-zinc-400 -mt-1 mb-3">既存のスプレッドシートに営業リストがある場合は、AttackListシートにそのまま行を追加すれば一覧に反映されます（このフォームは1件ずつ追加する場合用）。</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            <input
              value={newEntry.company}
              onChange={(e) => setNewEntry((f) => ({ ...f, company: e.target.value }))}
              placeholder="企業名"
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
            />
            <input
              value={newEntry.area}
              onChange={(e) => setNewEntry((f) => ({ ...f, area: e.target.value }))}
              placeholder="エリア（例: 関西）"
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
            />
            <select
              value={newEntry.salesRep}
              onChange={(e) => setNewEntry((f) => ({ ...f, salesRep: e.target.value }))}
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
            >
              <option value="">担当Sales</option>
              {SALES_REPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
              value={newEntry.repContact}
              onChange={(e) => setNewEntry((f) => ({ ...f, repContact: e.target.value }))}
              placeholder="先方担当者・連絡先"
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
            />
            <input
              value={newEntry.nextVisitDate}
              onChange={(e) => setNewEntry((f) => ({ ...f, nextVisitDate: e.target.value }))}
              placeholder="次回訪問予定（例: 2026-08-01）"
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={apiStatus !== 'ready' || adding || !newEntry.company.trim()}
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-600 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-700 transition"
          >
            {adding ? '追加中…' : '+ アタック先を追加'}
          </button>
        </Card>
        )}

        {view === 'list' && (
        <>
        <Card eyebrow="Filter" eyebrowColor="text-orange-600" title="🔍 絞り込み">
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs font-bold px-2 py-1.5 bg-white border border-zinc-200 rounded-lg">
              <option value="">ステータス（すべて）</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_ICON[s]} {s}</option>)}
            </select>
            {repOptions.length > 0 && (
              <select value={repFilter} onChange={(e) => setRepFilter(e.target.value)} className="text-xs font-bold px-2 py-1.5 bg-white border border-zinc-200 rounded-lg">
                <option value="">担当Sales（すべて）</option>
                {repOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-8">
              {apiStatus === 'ready' ? 'アタック先が登録されていません' : '読み込み中、または未設定です'}
            </p>
          )}
          {[...approachingList, ...untouchedList].map((entry, idx) => {
            const log = parseLog(entry.contactLogJson);
            const showApproachingHeader = idx === 0 && approachingList.length > 0;
            const showUntouchedHeader = idx === approachingList.length && untouchedList.length > 0;
            return (
              <React.Fragment key={entry.id}>
              {showApproachingHeader && (
                <p className="text-xs font-black text-orange-700 flex items-center gap-1.5 pt-1">🔥 アプローチ中（{approachingList.length}件）</p>
              )}
              {showUntouchedHeader && (
                <p className="text-xs font-black text-zinc-500 flex items-center gap-1.5 pt-3">🆕 未対応・サラピン（{untouchedList.length}件）</p>
              )}
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-zinc-800">{entry.company}</h3>
                      <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border ${PROBABILITY_STYLE[entry.probability] || PROBABILITY_STYLE.C}`} title="商談確度">
                        {entry.probability || 'C'}
                      </span>
                      <select
                        value={entry.status || STATUS_OPTIONS[0]}
                        onChange={(e) => updateField(entry, 'status', e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none ${STATUS_STYLE[entry.status] || STATUS_STYLE[STATUS_OPTIONS[0]]}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_ICON[s]} {s}</option>)}
                      </select>
                      <select
                        value={entry.probability || 'C'}
                        onChange={(e) => updateField(entry, 'probability', e.target.value)}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border text-zinc-500 bg-white border-zinc-200 outline-none"
                        title="商談確度を変更"
                      >
                        {PROBABILITY_OPTIONS.map((p) => <option key={p} value={p}>確度 {p}</option>)}
                      </select>
                      {entry.linkedSiteId && SITES[entry.linkedSiteId] && (
                        <a href={`/budget/site/${entry.linkedSiteId}`} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 hover:bg-emerald-100">
                          🔗 {SITES[entry.linkedSiteId].name}
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {entry.area || 'エリア未設定'} ・ 担当: {entry.salesRep || '未設定'}
                      {entry.repContact && <> ・ 先方: {entry.repContact}</>}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-zinc-500">
                      <span>次回訪問: <span className="font-bold text-zinc-700">{entry.nextVisitDate || '—'}</span></span>
                      <span>最終接触: <span className="font-bold text-zinc-700">{entry.lastContactDate || '—'}</span></span>
                      <span>TEL回数: <span className="font-bold text-zinc-700">{entry.telAppoCount}回</span></span>
                      <span>更新日: <span className="font-bold text-zinc-700">{(entry.updatedAt || '').slice(0, 10) || '—'}</span></span>
                    </div>
                    {(entry.quoteUrl || entry.notebookLmUrl || entry.asanaUrl || entry.minutesUrl) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {LINK_FIELDS.filter(({ key }) => entry[key]).map(({ key, label }) => (
                          <a
                            key={key}
                            href={entry[key] as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-0.5 hover:bg-orange-100"
                          >
                            {label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                    {entry.needsIssues && (
                      <p className="text-xs text-zinc-600 mt-2"><span className="font-bold text-zinc-400">課題・ニーズ: </span>{entry.needsIssues}</p>
                    )}
                    {entry.escalatedTo && (
                      <p className="text-xs text-zinc-600 mt-1"><span className="font-bold text-zinc-400">連携先: </span>{entry.escalatedTo}</p>
                    )}
                    {entry.notes && <p className="text-xs text-zinc-500 mt-2">{entry.notes}</p>}
                  </div>
                  <button
                    onClick={() => openDetail(entry)}
                    className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 rounded-full px-3 py-1.5 shrink-0"
                  >
                    {expanded === entry.id ? '閉じる' : '詳細・履歴 ➔'}
                  </button>
                </div>

                {expanded === entry.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4">
                    {/* ── 詳細情報（連絡先・関連URL・課題/ニーズ・連携先） ── */}
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">詳細情報</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={detailForm.linkedSiteId ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, linkedSiteId: e.target.value }))}
                          className="px-2 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400 sm:col-span-2"
                        >
                          <option value="">成約済み現場と連動（任意・未設定なら見込み客のまま）</option>
                          {Object.values(SITES).map((s) => <option key={s.id} value={s.id}>{s.name}（{s.id}）</option>)}
                        </select>
                        <input
                          value={detailForm.repContact ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, repContact: e.target.value }))}
                          placeholder="先方担当者・連絡先（例: 総務部 山田様 090-xxxx-xxxx）"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
                        />
                        <input
                          value={detailForm.quoteUrl ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, quoteUrl: e.target.value }))}
                          placeholder="見積書URL"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
                        />
                        <input
                          value={detailForm.notebookLmUrl ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, notebookLmUrl: e.target.value }))}
                          placeholder="NotebookLM URL"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
                        />
                        <input
                          value={detailForm.asanaUrl ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, asanaUrl: e.target.value }))}
                          placeholder="Asana URL"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
                        />
                        <input
                          value={detailForm.minutesUrl ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, minutesUrl: e.target.value }))}
                          placeholder="議事録URL"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400 sm:col-span-2"
                        />
                        <textarea
                          value={detailForm.needsIssues ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, needsIssues: e.target.value }))}
                          placeholder="例: 繁忙期の人員不足に課題あり。夜勤帯の時給改善を希望している"
                          rows={2}
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400 sm:col-span-2 resize-none"
                        />
                        <textarea
                          value={detailForm.escalatedTo ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, escalatedTo: e.target.value }))}
                          placeholder="例: SO担当（谷口）に共有し中部エリア新規現場として展開検討"
                          rows={2}
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400 sm:col-span-2 resize-none"
                        />
                        <input
                          value={detailForm.notes ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, notes: e.target.value }))}
                          placeholder="その他メモ"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400 sm:col-span-2"
                        />
                      </div>
                      <button
                        onClick={() => saveDetail(entry)}
                        disabled={detailSaving}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 text-white disabled:opacity-40 hover:bg-orange-700 transition"
                      >
                        {detailSaving ? '保存中…' : '詳細情報を保存'}
                      </button>
                    </div>

                    {/* ── コンタクト履歴 ── */}
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">コンタクト履歴</p>
                      {log.length === 0 ? (
                        <p className="text-xs text-zinc-400 mb-3">履歴はまだありません</p>
                      ) : (
                        <ul className="space-y-2 mb-3">
                          {log.slice().reverse().map((c, i) => (
                            <li key={i} className="flex gap-3 items-start text-xs">
                              <span className="font-mono text-zinc-400 shrink-0 w-32">{(c.datetime || '').replace('T', ' ')}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-orange-700 bg-orange-50 border-orange-100 shrink-0">{c.method}</span>
                              <span className="text-zinc-600">{c.content}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2">
                        <select
                          value={contactForm.method}
                          onChange={(e) => setContactForm((f) => ({ ...f, method: e.target.value as ContactMethod }))}
                          className="text-xs font-bold px-2 py-1.5 bg-white border border-zinc-200 rounded-lg"
                        >
                          {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <input
                          value={contactForm.content}
                          onChange={(e) => setContactForm((f) => ({ ...f, content: e.target.value }))}
                          placeholder="例: 価格改定の提案を実施。次回8月上旬に再訪問予定"
                          className="flex-1 px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-orange-400"
                        />
                        <button
                          onClick={() => addContact(entry)}
                          disabled={!contactForm.content.trim()}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-700 transition shrink-0"
                        >
                          記録
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              </React.Fragment>
            );
          })}
        </div>
        </>
        )}
      </main>
    </Shell>
  );
}
