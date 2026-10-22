import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { fetchGlobalMatchHistory } from '../api/matches';
import { formatDateTime } from '../lib/format';

export function MatchesHistoryPage() {
    const { data: history, isLoading, error } = useQuery({
        queryKey: ['global-match-history'],
        queryFn: fetchGlobalMatchHistory,
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Match History</h1>
                        <p className="text-xs text-slate-500">All matches sent by you</p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {isLoading && <p className="text-sm text-slate-500 text-center">Loading history...</p>}
                {error && <p className="text-sm text-red-600 text-center">Could not load match history.</p>}

                {!isLoading && !error && (!history || history.length === 0) && (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <History size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No matches have been sent yet.</p>
                    </div>
                )}

                {!error && history && history.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-slate-600">Customer</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Matched With</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Score</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Date Sent</th>
                                    <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((h) => (
                                    <tr key={h.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">{h.customer.name}</p>
                                            <p className="text-xs text-slate-500">{h.customer.city}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">{h.candidate.name}</p>
                                            <p className="text-xs text-slate-500">{h.candidate.city}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 rounded-full border border-green-200">
                                                {h.compatibilityScore}/100
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{formatDateTime(h.sentAt)}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                                {h.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}