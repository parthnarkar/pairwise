import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { matchmaker, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingScreen label="Signing you in" />;
    }

    if (!matchmaker) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return <>{children}</>;
}