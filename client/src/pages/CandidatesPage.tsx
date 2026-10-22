import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { listCandidatePool } from '../api/customers';
import { initials } from '../lib/format';

export function CandidatesPage() {
    const { data: candidates = [], isLoading, error } = useQuery({
        queryKey: ['candidate-pool'],
        queryFn: listCandidatePool,
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Candidate Pool</h1>
                        <p className="text-xs text-slate-500">{candidates.length} candidates available for matching</p>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-6 py-8">
                {isLoading && <p className="text-sm text-slate-500 text-center">Loading candidates...</p>}
                {error && <p className="text-sm text-red-600 text-center">Could not load candidates.</p>}
                {!isLoading && !error && candidates.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Users size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No candidates are currently available.</p>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {candidates.map((candidate) => (
                        <div key={candidate.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium">
                                {initials(candidate.firstName, candidate.lastName)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate">{candidate.firstName} {candidate.lastName}</p>
                                <p className="text-xs text-slate-500">{candidate.age} yrs · {candidate.gender} · {candidate.city}</p>
                                <p className="text-xs text-slate-500">{candidate.maritalStatus}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
