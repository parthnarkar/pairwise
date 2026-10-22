import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
    const { login, matchmaker } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from || '/';

    const [email, setEmail] = useState('matchmaker@thedatecrew.com');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // If already logged in, bounce to dashboard
    useEffect(() => {
        if (matchmaker) navigate(from, { replace: true });
    }, [matchmaker, navigate, from]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFieldErrors({});

        const parsed = schema.safeParse({ email, password });
        if (!parsed.success) {
            const errs: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                errs[issue.path[0] as string] = issue.message;
            }
            setFieldErrors(errs);
            return;
        }

        setSubmitting(true);
        try {
            await login(parsed.data.email, parsed.data.password);
            navigate(from, { replace: true });
        } catch (err: any) {
            const msg =
                err?.response?.data?.error ||
                'Could not sign in. Please try again.';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full grid lg:grid-cols-2 bg-white"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
        >
            {/* Font (swap for a <link> in index.html if you prefer) */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* LEFT — text / branding (full height) */}
            <div className="relative overflow-hidden bg-slate-900 text-white px-8 py-10 sm:px-14 lg:px-20 lg:py-16 flex flex-col justify-between gap-16 lg:min-h-screen">
                {/* soft decorative glow */}
                <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl" />

                <div className="relative flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white text-slate-900 flex items-center justify-center text-xl font-extrabold">
                        <img src="/pairwise-logo.png" className='rounded-lg' />
                    </div>
                    <span className="text-base font-semibold tracking-wide text-slate-200">
                        Pairwise
                    </span>
                </div>

                <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300 mb-5">
                        Matchmaker Dashboard
                    </p>
                    <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight">
                        Welcome back.
                        <br />
                        <span className="text-slate-400">
                            Let&apos;s make great matches.
                        </span>
                    </h1>
                    <p className="mt-6 text-base leading-relaxed text-slate-400 max-w-md">
                        Manage your assigned clients, track their journey from
                        onboarding to matching, and send thoughtful introductions - all in one place.
                    </p>
                </div>

                <p className="relative text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} Parth Narkar
                </p>
            </div>

            {/* RIGHT — login form (full height) */}
            <div className="flex items-center justify-center px-8 py-12 sm:px-14 lg:px-20 lg:min-h-screen bg-slate-50">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Sign in
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">
                            Enter your credentials to access your dashboard.
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5" noValidate>
                        <Input
                            label="Email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={fieldErrors.email}
                        />
                        <Input
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={fieldErrors.password}
                            placeholder="TDC@2026"
                        />

                        {formError && (
                            <div
                                role="alert"
                                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
                            >
                                {formError}
                            </div>
                        )}

                        <Button type="submit" loading={submitting} className="w-full">
                            Sign in
                        </Button>
                    </form>

                    <div className="mt-10 rounded-xl bg-white border border-slate-200 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            Demo credentials
                        </p>
                        <p className="text-xs text-slate-600 break-all">
                            matchmaker@thedatecrew.com{' '}
                            <span className="text-slate-300">/</span> TDC@2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}