import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { History, CheckCircle2, Clock, XCircle, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { fetchMatchHistory, revokeMatch } from '../api/matches';
import { formatDateTime, initials } from '../lib/format';
import type { IMatchHistoryEntry, MatchActionStatus } from '../types';
import { useToast } from './ToastProvider';

const statusBadge = (s: MatchActionStatus) => {
    if (s === 'Accepted')
        return (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> Accepted
            </span>
        );
    if (s === 'Rejected')
        return (
            <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                <XCircle size={10} /> Rejected
            </span>
        );
    if (s === 'Sent')
        return (
            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                <Clock size={10} /> Sent
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
            Suggested
        </span>
    );
};

export function SentMatchesPanel({ customerId }: { customerId: string }) {
    const qc = useQueryClient();
    const showToast = useToast();
    const [revokeEntry, setRevokeEntry] = useState<IMatchHistoryEntry | null>(null);
    const [revokeNote, setRevokeNote] = useState('');
    const [clientMessage, setClientMessage] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['match-history', customerId],
        queryFn: () => fetchMatchHistory(customerId),
        staleTime: 30_000,
    });

    const revokeMutation = useMutation({
        mutationFn: ({ id, revokeNote, clientMessage }: { id: string; revokeNote: string; clientMessage: string }) =>
            revokeMatch(id, { revokeNote, clientMessage }),
        onSuccess: () => {
            // Refresh the history panel, dashboard stats, and customers list
            qc.invalidateQueries({ queryKey: ['match-history', customerId] });
            qc.invalidateQueries({ queryKey: ['match-stats'] });
            qc.invalidateQueries({ queryKey: ['customers'] });
            qc.invalidateQueries({ queryKey: ['customer', customerId] });
            qc.invalidateQueries({ queryKey: ['candidate-pool'] });
            showToast('Match revoked and candidate returned to the pool.');
            setRevokeEntry(null);
            setRevokeNote('');
            setClientMessage('');
        },
        onError: (error) => showToast((error as any)?.response?.data?.error || 'Could not revoke match.', 'error'),
    });

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-xs text-red-600">Could not load sent matches.</p>;
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <History size={20} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs text-slate-500">No matches sent to this customer yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {data.map((entry) => {
                const c = entry.candidate;
                return (
                    <div key={entry.id} className="border border-slate-100 rounded-lg px-3 py-2 text-sm bg-white">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                {c && (
                                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-medium shrink-0">
                                        {initials(c.firstName, c.lastName)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900 truncate">
                                        {c ? `${c.firstName} ${c.lastName}` : 'Candidate unavailable'}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {c?.age} · {c?.city} · Score {entry.compatibilityScore}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {statusBadge(entry.status)}
                                <button
                                    onClick={() => setRevokeEntry(entry)}
                                    disabled={revokeMutation.isPending}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                    title="Revoke Match"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">
                            {formatDateTime(entry.sentAt)}
                        </p>
                    </div>
                );
            })}
            {revokeEntry && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h3 className="font-semibold text-slate-900">Revoke match</h3>
                                <p className="text-xs text-slate-500">The candidate will return to the match pool.</p>
                            </div>
                            <button onClick={() => setRevokeEntry(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 px-5 py-4">
                            <label className="block text-sm text-slate-700">
                                Private note
                                <textarea value={revokeNote} onChange={(e) => setRevokeNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-slate-500" placeholder="Why are you revoking this match?" />
                            </label>
                            <label className="block text-sm text-slate-700">
                                Message to client
                                <textarea value={clientMessage} onChange={(e) => setClientMessage(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-slate-500" placeholder="Optional message to send to the client" />
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
                            <button onClick={() => setRevokeEntry(null)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
                            <button
                                onClick={() => revokeMutation.mutate({ id: revokeEntry.id, revokeNote, clientMessage })}
                                disabled={revokeMutation.isPending}
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {revokeMutation.isPending ? 'Revoking...' : 'Delete / Revoke'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}