import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, MapPin } from 'lucide-react';
import { listCandidatePool } from '../api/customers';
import { initials } from '../lib/format';
import { LoadingScreen } from '../components/LoadingScreen';

export function CandidatesPage() {
    const { data: candidates = [], isLoading, error } = useQuery({
        queryKey: ['candidate-pool'],
        queryFn: listCandidatePool,
    });

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}>
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-8 sm:px-8">
                    <Link to="/" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </Link>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-500">Shared pool</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Candidate pool</h1>
                        <p className="mt-2 text-sm text-slate-500">{candidates.length} profiles ready to explore and match.</p>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
                {isLoading && <LoadingScreen label="Loading candidate pool" />}
                {error && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                        Could not load candidates.
                    </p>
                )}
                {!isLoading && !error && candidates.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <Users size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No candidates are currently available.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            {/* Avatar */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                                {initials(candidate.firstName, candidate.lastName)}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="truncate font-medium text-slate-900">
                                        {candidate.firstName} {candidate.lastName}
                                    </p>
                                    <span className="ml-2 shrink-0 text-xs font-medium text-slate-500">
                                        {candidate.age} yrs
                                    </span>
                                </div>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    {candidate.maritalStatus} · {candidate.height} cm
                                </p>

                                <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin size={12} className="text-slate-400" />
                                    {candidate.city}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
