import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Send, AlertCircle, Pencil, Check, Ban } from 'lucide-react';
import { sendMatch } from '../api/matches';
import { Button } from './ui/Button';
import { initials } from '../lib/format';
import type { IMatchResult } from '../types';
import { useToast } from './ToastProvider';

interface Props {
    open: boolean;
    customerId: string;
    customerName: string;
    match: IMatchResult;
    onClose: () => void;
    onSuccess: () => void;
}

export function SendMatchModal({ open, customerId, customerName, match, onClose, onSuccess }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedIntro, setEditedIntro] = useState(match.personalizedIntro || '');
    const showToast = useToast();

    // Extract first name (e.g. "Sneha Patel" -> "Sneha")
    const clientFirstName = customerName.split(' ')[0];

    const mutation = useMutation({
        mutationFn: () =>
            sendMatch({
                customerId,
                candidateId: match.candidateId,
                matchRationale: match.matchRationale,
                personalizedIntro: editedIntro, // Send the edited version
            }),
        onSuccess: () => {
            showToast('Match sent successfully.');
            onSuccess();
        },
        onError: (error) => {
            showToast((error as any)?.response?.data?.error || 'Could not send match.', 'error');
        },
    });

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} aria-hidden />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
                        <h3 className="text-base font-semibold text-slate-900">Send this match?</h3>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="px-5 py-4 space-y-4 overflow-y-auto">
                        {/* Candidate preview */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium shrink-0">
                                {initials(match.candidate.firstName, match.candidate.lastName)}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                    {match.candidate.firstName} {match.candidate.lastName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {match.candidate.age} · {match.candidate.city} · {match.compatibilityScore}/100
                                </p>
                            </div>
                        </div>

                        {/* Rationale */}
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                            <p className="text-xs font-medium text-slate-600">Rationale</p>
                            <p className="text-sm text-slate-800 leading-relaxed">{match.matchRationale}</p>
                        </div>

                        {/* Personalized intro (Editable) */}
                        {editedIntro && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-blue-700">
                                        Personalized introduction for {clientFirstName}
                                    </p>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition"
                                            title="Edit intro"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editedIntro}
                                            onChange={(e) => setEditedIntro(e.target.value)}
                                            rows={4}
                                            className="w-full text-sm text-slate-800 p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-300 outline-none resize-none"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditedIntro(match.personalizedIntro || '');
                                                    setIsEditing(false);
                                                }}
                                                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1"
                                            >
                                                <Ban size={12} /> Cancel
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="inline-flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                                            >
                                                <Check size={12} /> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-800 leading-relaxed">{editedIntro}</p>
                                )}
                            </div>
                        )}

                        {mutation.isError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{(mutation.error as any)?.response?.data?.error || 'Could not send match.'}</span>
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0 bg-white">
                        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
                            <Send size={14} className="mr-1.5" />
                            Send Match
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}