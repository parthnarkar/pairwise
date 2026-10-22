import { useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Activity, Send, ChevronRight, UserRoundSearch } from 'lucide-react';
import {
    listCustomers,
    listMyCities,
    type ListParams,
} from '../api/customers';
import { fetchMatchStats } from '../api/matches';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { MetricTile } from '../components/MetricTile';
import { initials } from '../lib/format';
import { JOURNEY_STATUSES, type JourneyStatus } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';

export function DashboardPage() {
    const { matchmaker } = useAuth();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();

    const filters: ListParams = useMemo(
        () => ({
            q: params.get('q') || '',
            status: (params.get('status') as JourneyStatus) || '',
            gender: (params.get('gender') as ListParams['gender']) || '',
            city: params.get('city') || '',
            sort: (params.get('sort') as ListParams['sort']) || 'recent',
        }),
        [params]
    );

    const updateParam = (key: string, value: string) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next, { replace: true });
    };

    // Customer list (filtered)
    const { data, isLoading, error } = useQuery({
        queryKey: ['customers', filters],
        queryFn: () => listCustomers(filters),
    });

    // Full city list (unfiltered)
    const { data: cities = [] } = useQuery({
        queryKey: ['meta-cities'],
        queryFn: listMyCities,
        staleTime: 5 * 60_000,
    });

    // Dashboard metrics
    const { data: stats } = useQuery({
        queryKey: ['match-stats'],
        queryFn: fetchMatchStats,
        staleTime: 30_000,
    });

    if (isLoading) {
        return <LoadingScreen label="Loading your dashboard" />;
    }

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}>
            <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
                <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-rose-50 px-6 py-8 text-slate-900 shadow-xl shadow-slate-200/60 sm:px-10">
                    <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />
                    <div className="relative">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Matchmaker workspace</p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Good morning, {matchmaker?.name?.split(' ')[0] || 'Matchmaker'}.</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-600">Keep every client moving toward a meaningful connection.</p>
                    </div>
                </section>
                {/* Metrics row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricTile
                        label="Customers Assigned"
                        value={stats?.customersAssigned ?? '—'}
                        icon={<Users size={20} />}
                    />
                    <MetricTile
                        label="Active Searches"
                        value={stats?.activeSearches ?? '—'}
                        icon={<Activity size={20} />}
                    />
                    <MetricTile
                        label="Matches Sent"
                        value={stats?.matchesSent ?? '—'}
                        hint={stats?.accepted ? `${stats.accepted} accepted` : undefined}
                        icon={<Send size={20} />}
                    />
                    <MetricTile
                        label="Candidate Pool"
                        value={stats?.candidatesCount ?? '—'}
                        hint="View all candidates"
                        icon={<UserRoundSearch size={20} />}
                        to="/candidates"
                    />
                </div>

                {/* Recent Matches Row */}
                {stats?.recentMatches && stats.recentMatches.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recently sent matches</p>
                            <Link to="/matches" className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium">
                                View All History <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {stats.recentMatches.map((rm: any) => (
                                <div key={rm.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                    <span className="font-medium text-slate-900">{rm.customerName}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="font-medium text-slate-900">{rm.candidateName}</span>
                                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{rm.score}pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters bar */}
                <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex-1 min-w-[220px]">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={filters.q}
                                onChange={(e) => updateParam('q', e.target.value)}
                                placeholder="Search by name…"
                                aria-label="Search customers"
                                className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>

                    <Select
                        label="Status"
                        value={filters.status}
                        onChange={(e) => updateParam('status', e.target.value)}
                        className="min-w-[150px]"
                    >
                        <option value="">All</option>
                        {JOURNEY_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </Select>

                    <Select
                        label="Gender"
                        value={filters.gender}
                        onChange={(e) => updateParam('gender', e.target.value)}
                        className="min-w-[120px]"
                    >
                        <option value="">All</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </Select>

                    <Select
                        label="City"
                        value={filters.city}
                        onChange={(e) => updateParam('city', e.target.value)}
                        className="min-w-[140px]"
                    >
                        <option value="">All</option>
                        {cities.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </Select>

                    <Select
                        label="Sort"
                        value={filters.sort}
                        onChange={(e) => updateParam('sort', e.target.value)}
                        className="min-w-[150px]"
                    >
                        <option value="recent">Most recent</option>
                        <option value="name">Name (A–Z)</option>
                        <option value="age_asc">Age ↑</option>
                        <option value="age_desc">Age ↓</option>
                    </Select>
                </div>

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="grid grid-cols-5 gap-4 bg-slate-50 px-4 py-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="h-3 bg-slate-200 rounded animate-pulse"
                                />
                            ))}
                        </div>
                        {[1, 2, 3, 4, 5].map((r) => (
                            <div
                                key={r}
                                className="px-4 py-3 grid grid-cols-5 gap-4 border-t border-slate-100"
                            >
                                {[1, 2, 3, 4, 5].map((c) => (
                                    <div
                                        key={c}
                                        className="h-3 bg-slate-100 rounded animate-pulse"
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Could not load customers.
                    </div>
                )}

                {data && data.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <Users size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">
                            No customers match your filters.
                        </p>
                    </div>
                )}

                {data && data.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Age
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        City
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Marital
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="cursor-pointer transition hover:bg-slate-50"
                                        onClick={() => navigate(`/customers/${c.id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                to={`/customers/${c.id}`}
                                                className="flex items-center gap-3"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium">
                                                    {initials(c.firstName, c.lastName)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {c.firstName} {c.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{c.gender}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{c.age}</td>
                                        <td className="px-4 py-3 text-slate-700">{c.city}</td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {c.maritalStatus}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={c.journeyStatus} />
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