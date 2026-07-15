'use client';

import React, { useEffect, useState } from 'react';
import { Shell, Eyebrow, Card, BackLink } from '../budget/_ui';

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

const LINK_FIELDS: { key: 'quoteUrl' | 'notebookLmUrl' | 'asanaUrl' | 'minutesUrl'; label: string }[] = [
  { key: 'quoteUrl', label: '見積書' },
  { key: 'notebookLmUrl', label: 'NotebookLM' },
  { key: 'asanaUrl', label: 'Asana' },
  { key: 'minutesUrl', label: '議事録' },
];

export default function AttackListPage() {
  const [entries, setEntries] = useState<AttackEntry[]>([]);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const [statusFilter, setStatusFilter] = useState('');
  const [repFilter, setRepFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState<Partial<AttackEntry>>({});
  const [detailSaving, setDetailSaving] = useState(false);
  const [contactForm, setContactForm] = useState({ method: '訪問' as ContactMethod, content: '' });

  const [newEntry, setNewEntry] = useState({ company: '', area: '', salesRep: '', repContact: '', nextVisitDate: '' });
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
      await save({ ...newEntry, status: '初商談', probability: 'C', telAppoCount: 0, contactLogJson: '[]' });
      setNewEntry({ company: '', area: '', salesRep: '', repContact: '', nextVisitDate: '' });
      load();
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
        <p className="text-xs text-zinc-400 mt-0.5">商談確度・ステータス・コンタクト履歴をSales内で共有管理（毎週月曜MTGで確認）</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
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
              value={newEntry.repContact}
              onChange={(e) => setNewEntry((f) => ({ ...f, repContact: e.target.value }))}
              placeholder="先方担当者・連絡先"
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
                      <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border ${PROBABILITY_STYLE[entry.probability] || PROBABILITY_STYLE.C}`} title="商談確度">
                        {entry.probability || 'C'}
                      </span>
                      <select
                        value={entry.status || STATUS_OPTIONS[0]}
                        onChange={(e) => updateField(entry, 'status', e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none ${STATUS_STYLE[entry.status] || STATUS_STYLE[STATUS_OPTIONS[0]]}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select
                        value={entry.probability || 'C'}
                        onChange={(e) => updateField(entry, 'probability', e.target.value)}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border text-zinc-500 bg-white border-zinc-200 outline-none"
                        title="商談確度を変更"
                      >
                        {PROBABILITY_OPTIONS.map((p) => <option key={p} value={p}>確度 {p}</option>)}
                      </select>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {entry.area || 'エリア未設定'} ・ 担当: {entry.salesRep || '未設定'}
                      {entry.repContact && <> ・ 先方: {entry.repContact}</>}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-zinc-500">
                      <span>次回訪問: <span className="font-bold text-zinc-700">{entry.nextVisitDate || '—'}</span></span>
                      <span>最終接触: <span className="font-bold text-zinc-700">{entry.lastContactDate || '—'}</span></span>
                      <span>TEL回数: <span className="font-bold text-zinc-700">{entry.telAppoCount}回</span></span>
                    </div>
                    {(entry.quoteUrl || entry.notebookLmUrl || entry.asanaUrl || entry.minutesUrl) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {LINK_FIELDS.filter(({ key }) => entry[key]).map(({ key, label }) => (
                          <a
                            key={key}
                            href={entry[key] as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 hover:bg-blue-100"
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
                    className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 shrink-0"
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
                        <input
                          value={detailForm.repContact ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, repContact: e.target.value }))}
                          placeholder="先方担当者・連絡先（例: 総務部 山田様 090-xxxx-xxxx）"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                        />
                        <input
                          value={detailForm.quoteUrl ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, quoteUrl: e.target.value }))}
                          placeholder="見積書URL"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                        />
                        <input
                          value={detailForm.notebookLmUrl ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, notebookLmUrl: e.target.value }))}
                          placeholder="NotebookLM URL"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                        />
                        <input
                          value={detailForm.asanaUrl ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, asanaUrl: e.target.value }))}
                          placeholder="Asana URL"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                        />
                        <input
                          value={detailForm.minutesUrl ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, minutesUrl: e.target.value }))}
                          placeholder="議事録URL"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400 sm:col-span-2"
                        />
                        <textarea
                          value={detailForm.needsIssues ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, needsIssues: e.target.value }))}
                          placeholder="例: 繁忙期の人員不足に課題あり。夜勤帯の時給改善を希望している"
                          rows={2}
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400 sm:col-span-2 resize-none"
                        />
                        <textarea
                          value={detailForm.escalatedTo ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, escalatedTo: e.target.value }))}
                          placeholder="例: SO担当（谷口）に共有し中部エリア新規現場として展開検討"
                          rows={2}
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400 sm:col-span-2 resize-none"
                        />
                        <input
                          value={detailForm.notes ?? ''}
                          onChange={(e) => setDetailForm((f) => ({ ...f, notes: e.target.value }))}
                          placeholder="その他メモ"
                          className="px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400 sm:col-span-2"
                        />
                      </div>
                      <button
                        onClick={() => saveDetail(entry)}
                        disabled={detailSaving}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white disabled:opacity-40 hover:bg-blue-800 transition"
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
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-blue-700 bg-blue-50 border-blue-100 shrink-0">{c.method}</span>
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
                          className="flex-1 px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-blue-400"
                        />
                        <button
                          onClick={() => addContact(entry)}
                          disabled={!contactForm.content.trim()}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 transition shrink-0"
                        >
                          記録
                        </button>
                      </div>
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
