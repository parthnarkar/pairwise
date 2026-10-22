import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { MatchesHistoryPage } from './pages/MatchesHistoryPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { ToastProvider } from './components/ToastProvider';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customers/:id"
                            element={
                                <ProtectedRoute>
                                    <CustomerDetailPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/matches"
                            element={
                                <ProtectedRoute>
                                    <MatchesHistoryPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/candidates"
                            element={
                                <ProtectedRoute>
                                    <CandidatesPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}