import { useQuery } from '@tanstack/react-query';
import { History, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { fetchMatchHistory } from '../api/matches';
import { formatDateTime, initials } from '../lib/format';
import type { MatchActionStatus } from '../types';

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
    const { data, isLoading, error } = useQuery({
        queryKey: ['match-history', customerId],
        queryFn: () => fetchMatchHistory(customerId),
        staleTime: 30_000,
    });

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-16 rounded-lg bg-slate-100 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <p className="text-xs text-red-600">
                Could not load sent matches.
            </p>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <History size={20} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs text-slate-500">
                    No matches sent to this customer yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {data.map((entry) => {
                const c = entry.candidate;
                return (
                    <div
                        key={entry.id}
                        className="border border-slate-100 rounded-lg px-3 py-2 text-sm bg-white"
                    >
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
                            {statusBadge(entry.status)}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">
                            {formatDateTime(entry.sentAt)}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}