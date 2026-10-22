import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import type { ICustomerListItem } from '../types';

export function DashboardPage() {
    const { matchmaker, logout } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ['my-customers'],
        queryFn: async () => {
            const { data } = await api.get<{ customers: ICustomerListItem[] }>(
                '/customers'
            );
            return data.customers;
        },
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h2 className="text-base font-medium text-slate-900">
                        My Customers
                    </h2>
                    <p className="text-sm text-slate-500">
                        Phase 3 will replace this with the full table &amp; filters.
                    </p>
                </div>

                {isLoading && <p className="text-sm text-slate-500">Loading customers…</p>}
                {error && (
                    <p className="text-sm text-red-600">Could not load customers.</p>
                )}
                {data && (
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {data.map((c) => (
                            <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">
                                        {c.firstName} {c.lastName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {c.age} · {c.city} · {c.maritalStatus}
                                    </p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                    {c.journeyStatus}
                                </span>
                            </div>
                        ))}
                        {data.length === 0 && (
                            <p className="px-4 py-6 text-sm text-slate-500 text-center">
                                No assigned customers yet.
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}