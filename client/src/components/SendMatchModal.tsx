import { useMutation } from '@tanstack/react-query';
import { X, Send, AlertCircle } from 'lucide-react';
import { sendMatch } from '../api/matches';
import { Button } from './ui/Button';
import { initials } from '../lib/format';
import type { IMatchResult } from '../types';

interface Props {
    open: boolean;
    customerId: string;
    match: IMatchResult;
    onClose: () => void;
    onSuccess: () => void;
}

export function SendMatchModal({
    open,
    customerId,
    match,
    onClose,
    onSuccess,
}: Props) {
    const mutation = useMutation({
        mutationFn: () =>
            sendMatch({
                customerId,
                candidateId: match.candidateId,
                matchRationale: match.matchRationale,
                personalizedIntro: match.personalizedIntro,
            }),
        onSuccess,
    });

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-[60]"
                onClick={onClose}
                aria-hidden
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                        <h3 className="text-base font-semibold text-slate-900">
                            Send this match?
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                        {/* Candidate preview */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium">
                                {initials(match.candidate.firstName, match.candidate.lastName)}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                    {match.candidate.firstName} {match.candidate.lastName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {match.candidate.age} · {match.candidate.city} ·{' '}
                                    {match.compatibilityScore}/100
                                </p>
                            </div>
                        </div>

                        {/* Rationale */}
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                            <p className="text-xs font-medium text-slate-600">Rationale</p>
                            <p className="text-sm text-slate-800 leading-relaxed">
                                {match.matchRationale}
                            </p>
                        </div>

                        {/* Personalized intro */}
                        {match.personalizedIntro && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-medium text-blue-700">
                                    Personalized introduction for the client
                                </p>
                                <p className="text-sm text-slate-800 leading-relaxed">
                                    {match.personalizedIntro}
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {mutation.isError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>
                                    {(mutation.error as any)?.response?.data?.error ||
                                        'Could not send match. Please try again.'}
                                </span>
                            </div>
                        )}

                        <p className="text-xs text-slate-500">
                            The match will be recorded and the candidate will no longer appear
                            in this customer's suggestions.
                        </p>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => mutation.mutate()}
                            loading={mutation.isPending}
                        >
                            <Send size={14} className="mr-1.5" />
                            Send Match
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}