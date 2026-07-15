'use client';

import React, { useEffect, useState } from 'react';
import { Shell, Eyebrow, Card, BackLink } from '../budget/_ui';

const STATUS_OPTIONS = ['未接触', 'アプローチ中', '商談化', '見送り'] as const;
type AttackStatus = typeof STATUS_OPTIONS[number];

const STATUS_STYLE: Record<string, string> = {
  未接触: 'text-zinc-500 bg-zinc-100 border-zinc-200',
  アプローチ中: 'text-amber-700 bg-amber-50 border-amber-200',
  商談化: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  見送り: 'text-rose-600 bg-rose-50 border-rose-200',
};

const CONTACT_TYPES = ['テレアポ', '訪問', 'メール', 'その他'] as const;
type ContactType = typeof CONTACT_TYPES[number];
interface ContactLogEntry { date: string; type: ContactType; note: string }

interface AttackEntry {
  id: string;
  company: string;
  area: string;
  status: AttackStatus | string;
  salesRep: string;
  nextVisitDate: string;
  lastContactDate: string;
  telAppoCount: number;
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

export default function AttackListPage() {
  const [entries, setEntries] = useState<AttackEntry[]>([]);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const [statusFilter, setStatusFilter] = useState('');
  const [repFilter, setRepFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ type: 'テレアポ' as ContactType, note: '' });

  const [newEntry, setNewEntry] = useState({ company: '', area: '', salesRep: '', nextVisitDate: '' });
  const [adding, setAdding] = useState(false);

  const load = () => {
    fetch('/api/attack-list').then((r) => r.json()).then((data) => {
      if (data?.error) { setApiStatus('unconfigured'); return; }
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
      await save({ ...newEntry, status: '未接触', telAppoCount: 0, contactLogJson: '[]' });
      setNewEntry({ company: '', area: '', salesRep: '', nextVisitDate: '' });
      load();
    } finally {
      setAdding(false);
    }
  };

  const cycleStatus = async (entry: AttackEntry) => {
    const idx = STATUS_OPTIONS.indexOf(entry.status as AttackStatus);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: next } : e)));
    await save({ ...entry, status: next });
  };

  const addContact = async (entry: AttackEntry) => {
    if (!contactForm.note.trim()) return;
    const log = parseLog(entry.contactLogJson);
    log.push({ date: todayStr(), type: contactForm.type, note: contactForm.note });
    const updated: AttackEntry = {
      ...entry,
      contactLogJson: JSON.stringify(log),
      lastContactDate: todayStr(),
      telAppoCount: contactForm.type === 'テレアポ' ? entry.telAppoCount + 1 : entry.telAppoCount,
    };
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
    setContactForm({ type: 'テレアポ', note: '' });
    setExpanded(null);
    await save(updated);
  };

  const repOptions = Array.from(new Set(entries.map((e) => e.salesRep).filter(Boolean)));
  const filtered = entries.filter((e) =>
    (!statusFilter || e.status === statusFilter) && (!repFilter || e.salesRep === repFilter)
  );

  return (
    <Shell agvColor="#1e40af">
      <header className="px-4 md:px-10 pt-6 pb-4">
        <BackLink href="/" label="TOPページへ戻る" />
        <Eyebrow>Sales Activity</Eyebrow>
        <h1 className="mt-1 text-xl md:text-2xl font-black text-zinc-900 tracking-tight">ATTACK LIST</h1>
        <p className="text-xs text-zinc-400 mt-0.5">テレアポ・コンタクト履歴・次回訪問予定をSales内で共有管理</p>
      </header>

      <main className="px-4 md:px-10 space-y-5">
        {apiStatus === 'unconfigured' && (
          <Card>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              共有保存基盤（Google Sheets連携）が未設定です。docs/site-overrides-setup.md の手順で「AttackList」シートを追加し、`.env.local`にURLを設定してください。
            </p>
          </Card>
        )}

        <Card eyebrow="New" title="新規アタック先を追加">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <input
              value={newEntry.company}
              onChange={(e) => setNewEntry((f) => ({ ...f, company: e.target.value }))}
              placeholder="企業名"
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
            />
            <input
              value={newEntry.area}
              onChange={(e) => setNewEntry((f) => ({ ...f, area: e.target.value }))}
              placeholder="エリア（例: 関西）"
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
            />
            <input
              value={newEntry.salesRep}
              onChange={(e) => setNewEntry((f) => ({ ...f, salesRep: e.target.value }))}
              placeholder="担当Sales"
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
            />
            <input
              value={newEntry.nextVisitDate}
              onChange={(e) => setNewEntry((f) => ({ ...f, nextVisitDate: e.target.value }))}
              placeholder="次回訪問予定（例: 2026-08-01）"
              className="px-2 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={apiStatus !== 'ready' || adding || !newEntry.company.trim()}
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 transition"
          >
            {adding ? '追加中…' : '+ アタック先を追加'}
          </button>
        </Card>

        <Card eyebrow="Filter" title="絞り込み">
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs font-bold px-2 py-1.5 bg-white border border-zinc-200 rounded-lg">
              <option value="">ステータス（すべて）</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
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
          {filtered.map((entry) => {
            const log = parseLog(entry.contactLogJson);
            return (
              <Card key={entry.id}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-zinc-800">{entry.company}</h3>
                      <button
                        onClick={() => cycleStatus(entry)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[entry.status] || STATUS_STYLE['未接触']}`}
                      >
                        {entry.status || '未接触'}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {entry.area || 'エリア未設定'} ・ 担当: {entry.salesRep || '未設定'}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-zinc-500">
                      <span>次回訪問: <span className="font-bold text-zinc-700">{entry.nextVisitDate || '—'}</span></span>
                      <span>最終接触: <span className="font-bold text-zinc-700">{entry.lastContactDate || '—'}</span></span>
                      <span>テレアポ回数: <span className="font-bold text-zinc-700">{entry.telAppoCount}回</span></span>
                    </div>
                    {entry.notes && <p className="text-xs text-zinc-500 mt-2">{entry.notes}</p>}
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 shrink-0"
                  >
                    {expanded === entry.id ? '閉じる' : 'コンタクト履歴 ➔'}
                  </button>
                </div>

                {expanded === entry.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    {log.length === 0 ? (
                      <p className="text-xs text-zinc-400 mb-3">履歴はまだありません</p>
                    ) : (
                      <ul className="space-y-2 mb-3">
                        {log.slice().reverse().map((c, i) => (
                          <li key={i} className="flex gap-3 items-start text-xs">
                            <span className="font-mono text-zinc-400 shrink-0 w-20">{c.date}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-blue-700 bg-blue-50 border-blue-100 shrink-0">{c.type}</span>
                            <span className="text-zinc-600">{c.note}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2">
                      <select
                        value={contactForm.type}
                        onChange={(e) => setContactForm((f) => ({ ...f, type: e.target.value as ContactType }))}
                        className="text-xs font-bold px-2 py-1.5 bg-white border border-zinc-200 rounded-lg"
                      >
                        {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        value={contactForm.note}
                        onChange={(e) => setContactForm((f) => ({ ...f, note: e.target.value }))}
                        placeholder="内容メモ"
                        className="flex-1 px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                      />
                      <button
                        onClick={() => addContact(entry)}
                        disabled={!contactForm.note.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 transition shrink-0"
                      >
                        記録
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </Shell>
  );
}
