import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    X,
    Sparkles,
    MapPin,
    Briefcase,
    GraduationCap,
    Send,
} from 'lucide-react';
import { calculateMatches } from '../api/matches';
import { Button } from './ui/Button';
import { SendMatchModal } from './SendMatchModal';
import { initials, formatINR } from '../lib/format';
import type { IMatchResult } from '../types';

interface Props {
    customerId: string;
    customerName: string;
    open: boolean;
    onClose: () => void;
    /**
     * Called after a match is successfully sent. Use it to invalidate
     * `['match-history', customerId]` and `['match-stats']` in the parent
     * so the Sent Matches panel + dashboard tiles refresh immediately.
     */
    onSendSuccess?: () => void;
}

const scoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
};

export function SuggestedMatchesDrawer({
    customerId,
    customerName,
    open,
    onClose,
    onSendSuccess,
}: Props) {
    const [sendingMatch, setSendingMatch] = useState<IMatchResult | null>(null);
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());

    // Fetch matches when the drawer opens
    const { data, isLoading, error } = useQuery({
        queryKey: ['matches', customerId],
        queryFn: () => calculateMatches(customerId),
        enabled: open && !!customerId,
        staleTime: 60_000,
    });

    // Clear local sent IDs when drawer closes so a fresh reopen re-renders
    // everything (server already excludes actually-sent candidates)
    useEffect(() => {
        if (!open) setSentIds(new Set());
    }, [open]);

    const visibleMatches = (data?.matches || []).filter(
        (m) => !sentIds.has(m.candidateId)
    );

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={onClose}
                aria-hidden
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Suggested Matches
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            For {customerName}
                            {data && (
                                <>
                                    {' · '}
                                    {data.afterHardFilters} eligible · {visibleMatches.length}{' '}
                                    shown
                                </>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
                    {/* Loading skeleton */}
                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                                            <div className="h-2.5 w-48 bg-slate-100 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 rounded animate-pulse" />
                                    <div className="h-2.5 w-4/5 bg-slate-100 rounded animate-pulse" />
                                </div>
                            ))}
                            <p className="text-xs text-slate-400 text-center pt-2">
                                Calculating matches &amp; generating AI rationales… (2–5s)
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                            Could not load matches. Please try again.
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !error && visibleMatches.length === 0 && (
                        <div className="text-center py-12 space-y-2">
                            <p className="text-sm text-slate-600">
                                No eligible matches for this customer.
                            </p>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                All candidates either fail the age/marital filters or fall below
                                the 50-point compatibility threshold. Consider widening
                                preferences or sending the previous batch first.
                            </p>
                        </div>
                    )}

                    {/* Match cards */}
                    {visibleMatches.map((m) => (
                        <div
                            key={m.candidateId}
                            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white text-sm flex items-center justify-center font-medium shrink-0">
                                        {initials(m.candidate.firstName, m.candidate.lastName)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {m.candidate.firstName} {m.candidate.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {m.candidate.age} · {m.candidate.city} ·{' '}
                                            {m.candidate.maritalStatus}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span
                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreColor(
                                            m.compatibilityScore
                                        )}`}
                                    >
                                        {m.compatibilityScore}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {m.label}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                    <GraduationCap size={12} />
                                    {m.candidate.education.degree} ·{' '}
                                    {m.candidate.education.undergraduateCollege}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Briefcase size={12} />
                                    {m.candidate.profession.designation}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <MapPin size={12} />
                                    {m.candidate.city}
                                </span>
                                <span className="text-slate-500">
                                    {formatINR(m.candidate.profession.income)} ·{' '}
                                    {m.candidate.height}cm
                                </span>
                            </div>

                            <p className="text-sm text-slate-700 leading-relaxed">
                                {m.matchRationale}
                            </p>

                            {m.rationaleSource === 'ai' && (
                                <p className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                                    <Sparkles size={10} /> AI-generated rationale
                                </p>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setSendingMatch(m)}
                                    className="!py-1.5 !px-3 text-xs"
                                >
                                    <Send size={12} className="mr-1.5" />
                                    Send Match
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Send Match confirmation modal */}
            {sendingMatch && (
                <SendMatchModal
                    open={!!sendingMatch}
                    customerId={customerId}
                    match={sendingMatch}
                    onClose={() => setSendingMatch(null)}
                    onSuccess={() => {
                        // 1. Remove card locally so it disappears immediately
                        setSentIds((prev) => new Set(prev).add(sendingMatch.candidateId));
                        // 2. Close the modal
                        setSendingMatch(null);
                        // 3. Notify the parent so it can invalidate related queries
                        onSendSuccess?.();
                    }}
                />
            )}
        </>
    );
}