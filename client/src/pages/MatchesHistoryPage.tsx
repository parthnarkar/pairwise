import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, History, Search, X, Printer } from 'lucide-react';
import { fetchGlobalMatchHistory } from '../api/matches';
import { formatDateTime } from '../lib/format';
import type { IGlobalMatchHistoryEntry, MatchActionStatus } from '../types';

const statuses: Array<MatchActionStatus | ''> = ['', 'Sent', 'Accepted', 'Rejected', 'Revoked'];

function statusStyle(status: MatchActionStatus) {
    if (status === 'Revoked') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'Accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
}

function PersonCard({ label, person }: { label: string; person: IGlobalMatchHistoryEntry['customer'] }) {
    if (!person) return <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">{label} unavailable</div>;
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <h3 className="text-lg font-semibold text-slate-900">{person.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{person.age === null ? 'Age unavailable' : `${person.age} yrs`} · {person.gender} · {person.city}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <span>Height: {person.height} cm</span>
                <span>Status: {person.maritalStatus}</span>
                <span className="col-span-2">Education: {person.education?.degree || '—'}</span>
                <span className="col-span-2">Profession: {person.profession?.designation || '—'}</span>
            </div>
        </div>
    );
}

function MatchDetails({ entry, onClose }: { entry: IGlobalMatchHistoryEntry; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 print:static print:bg-white print:p-0">
            <div className="mx-auto my-8 max-w-4xl rounded-2xl bg-white shadow-xl print:my-0 print:max-w-none print:shadow-none">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 print:hidden">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Match recommendation</p>
                        <h2 className="text-xl font-semibold text-slate-900">{entry.customer?.name} &amp; {entry.candidate?.name}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"><Printer size={15} /> Save to PDF</button>
                        <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
                    </div>
                </div>
                <div className="space-y-6 p-6">
                    <div className="hidden print:block">
                        <h1 className="text-2xl font-bold text-slate-900">Pairwise Match Recommendation</h1>
                        <p className="mt-1 text-sm text-slate-500">Generated {formatDateTime(entry.sentAt)}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <PersonCard label="Customer" person={entry.customer} />
                        <PersonCard label="Recommended candidate" person={entry.candidate} />
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-semibold text-slate-900">Compatibility assessment</h3>
                            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-blue-700">{entry.compatibilityScore === null ? 'Score unavailable' : `${entry.compatibilityScore}/100`}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{entry.matchRationale}</p>
                    </div>
                    {entry.personalizedIntro && <div><h3 className="font-semibold text-slate-900">Personalized introduction</h3><p className="mt-2 text-sm leading-6 text-slate-600">{entry.personalizedIntro}</p></div>}
                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                        <span>Sent: {formatDateTime(entry.sentAt)}</span>
                        <span>Status: <b className="text-slate-900">{entry.status}</b></span>
                        {entry.revokedAt && <span>Revoked: {formatDateTime(entry.revokedAt)}</span>}
                    </div>
                    {entry.revokeNote && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800"><b>Private revoke note:</b> {entry.revokeNote}</div>}
                    {entry.clientMessage && <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800"><b>Client message:</b> {entry.clientMessage}</div>}
                </div>
            </div>
        </div>
    );
}

export function MatchesHistoryPage() {
    const { data: history = [], isLoading, error } = useQuery({ queryKey: ['global-match-history'], queryFn: fetchGlobalMatchHistory });
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<MatchActionStatus | ''>('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [sort, setSort] = useState<'date' | 'score-high' | 'score-low'>('date');
    const [selected, setSelected] = useState<IGlobalMatchHistoryEntry | null>(null);

    const filtered = useMemo(() => history
        .filter((entry) => !query || `${entry.customer?.name} ${entry.candidate?.name}`.toLowerCase().includes(query.toLowerCase()))
        .filter((entry) => !status || entry.status === status)
        .filter((entry) => !from || entry.sentAt.slice(0, 10) >= from)
        .filter((entry) => !to || entry.sentAt.slice(0, 10) <= to)
        .sort((a, b) => sort === 'score-high'
            ? (b.compatibilityScore ?? -1) - (a.compatibilityScore ?? -1)
            : sort === 'score-low'
                ? (a.compatibilityScore ?? 101) - (b.compatibilityScore ?? 101)
                : new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()), [history, query, status, from, to, sort]);

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white print:hidden">
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5">
                    <Link to="/" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={18} className="text-slate-600" /></Link>
                    <div><h1 className="text-lg font-semibold text-slate-900">Match History</h1><p className="text-xs text-slate-500">Every sent and revoked match activity</p></div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl space-y-5 px-6 py-8 print:hidden">
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5">
                    <label className="relative md:col-span-2"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter customer or matched with" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" /></label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as MatchActionStatus | '')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{statuses.map((item) => <option key={item} value={item}>{item || 'All statuses'}</option>)}</select>
                    <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="date">Newest first</option><option value="score-high">Highest score</option><option value="score-low">Lowest score</option></select>
                    <div className="flex gap-2"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="min-w-0 w-1/2 rounded-lg border border-slate-300 px-2 py-2 text-sm" /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="min-w-0 w-1/2 rounded-lg border border-slate-300 px-2 py-2 text-sm" /></div>
                </div>
                {isLoading && <p className="text-center text-sm text-slate-500">Loading history...</p>}
                {error && <p className="text-center text-sm text-red-600">Could not load match history.</p>}
                {!isLoading && !error && filtered.length === 0 && <div className="rounded-xl border border-slate-200 bg-white py-12 text-center"><History size={32} className="mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-500">No activity matches these filters.</p></div>}
                {filtered.length > 0 && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="px-4 py-3 font-medium text-slate-600">Customer</th><th className="px-4 py-3 font-medium text-slate-600">Matched with</th><th className="px-4 py-3 font-medium text-slate-600">Score</th><th className="px-4 py-3 font-medium text-slate-600">Date sent</th><th className="px-4 py-3 font-medium text-slate-600">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((entry) => <tr key={entry.id} onClick={() => setSelected(entry)} className="cursor-pointer hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{entry.customer?.name || 'Unavailable'}</td><td className="px-4 py-3 text-slate-700">{entry.candidate?.name || 'Unavailable'}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{entry.compatibilityScore === null ? 'Unavailable' : `${entry.compatibilityScore}/100`}</span></td><td className="px-4 py-3 text-slate-600">{formatDateTime(entry.sentAt)}</td><td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${statusStyle(entry.status)}`}>{entry.status}</span></td></tr>)}</tbody></table></div>}
            </main>
            {selected && <MatchDetails entry={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
