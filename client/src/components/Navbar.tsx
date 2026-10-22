import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, History, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
    const { matchmaker, logout } = useAuth();
    const links = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/matches', label: 'History', icon: History },
        { to: '/candidates', label: 'Candidates', icon: Users },
    ];

    return (
        <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur print:hidden">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                <Link to="/" className="flex items-center gap-3">
                    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-label="Pairwise">
                        <defs>
                            <linearGradient id="pairwise-gradient" x1="0" x2="1">
                                <stop offset="0" stopColor="#2563eb" />
                                <stop offset="1" stopColor="#ec4899" />
                            </linearGradient>
                        </defs>
                        <circle cx="20" cy="20" r="19" fill="url(#pairwise-gradient)" />
                        <circle cx="15" cy="14" r="4" fill="white" />
                        <circle cx="25" cy="14" r="4" fill="white" />
                        <path d="M9 29c1-5 4-7 7-7s5 2 6 7M18 29c1-5 4-7 7-7s5 2 6 7" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span className="hidden text-sm font-semibold text-slate-900 sm:block">Pairwise Matchmaker</span>
                </Link>
                <div className="flex items-center gap-1">
                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`
                            }
                        >
                            <Icon size={15} /> <span className="hidden md:inline">{label}</span>
                        </NavLink>
                    ))}
                    <span className="mx-2 hidden h-6 w-px bg-slate-200 sm:block" />
                    <span className="hidden text-xs text-slate-500 lg:block">{matchmaker?.name}</span>
                    <button onClick={logout} title="Sign out" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
