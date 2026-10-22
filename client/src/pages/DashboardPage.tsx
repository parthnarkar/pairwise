import { useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Search, Users, Activity, Send } from 'lucide-react';
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

export function DashboardPage() {
    const { matchmaker, logout } = useAuth();
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

    // Full city list (unfiltered) — Fix from Phase 3
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

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">
                            Pairwise Dashboard
                        </h1>
                        <p className="text-xs text-slate-500">
                            {matchmaker?.name} · {matchmaker?.assignedRegion}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
                {/* Metrics row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                </div>

                {/* Filters bar */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
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
                                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 grid grid-cols-5 gap-4">
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
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                        Could not load customers.
                    </div>
                )}

                {data && data.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Users size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">
                            No customers match your filters.
                        </p>
                    </div>
                )}

                {data && data.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                                        Name
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                                        Age
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                                        City
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                                        Marital
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="hover:bg-slate-50 cursor-pointer"
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