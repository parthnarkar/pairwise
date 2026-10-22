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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white text-2xl font-bold mb-4">
                        P
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Pairwise Matchmaker
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Sign in to your matchmaker dashboard
                    </p>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
                >
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
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {formError}
                        </div>
                    )}

                    <Button type="submit" loading={submitting} className="w-full">
                        Sign in
                    </Button>

                    <p className="text-xs text-slate-400 text-center pt-2">
                        Demo: matchmaker@thedatecrew.com / TDC@2026
                    </p>
                </form>
            </div>
        </div>
    );
}