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
        <>
            <style>{'@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");'}</style>
            <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur print:hidden">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                <Link to="/" className="flex items-center gap-3">
                    <img src="/pairwise-logo.png" alt="Pairwise" className="h-10 w-10 rounded-xl object-cover" />
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
        </>
    );
}
