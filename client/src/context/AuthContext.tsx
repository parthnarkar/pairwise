import {
    createContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { loginRequest, fetchMe } from '../api/auth';
import { tokenStorage } from '../api/axios';
import type { IMatchmaker } from '../types';

interface AuthContextValue {
    matchmaker: IMatchmaker | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [matchmaker, setMatchmaker] = useState<IMatchmaker | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        tokenStorage.clear();
        setMatchmaker(null);
    }, []);

    // Bootstrap on mount: if a token exists, try /me
    useEffect(() => {
        let cancelled = false;
        const token = tokenStorage.get();
        if (!token) {
            setLoading(false);
            return;
        }
        fetchMe()
            .then((m) => {
                if (!cancelled) setMatchmaker(m);
            })
            .catch(() => {
                if (!cancelled) tokenStorage.clear();
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Listen for global 401 events from axios interceptor
    useEffect(() => {
        const handler = () => logout();
        window.addEventListener('pairwise:logout', handler);
        return () => window.removeEventListener('pairwise:logout', handler);
    }, [logout]);

    const login = useCallback(async (email: string, password: string) => {
        const { token, matchmaker } = await loginRequest(email, password);
        tokenStorage.set(token);
        setMatchmaker(matchmaker);
    }, []);

    return (
        <AuthContext.Provider value={{ matchmaker, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}