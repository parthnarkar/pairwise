import axios from 'axios';

const TOKEN_KEY = 'pairwise.token';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global 401 handling → clear token; AuthContext watches storage
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            window.dispatchEvent(new Event('pairwise:logout'));
        }
        return Promise.reject(err);
    }
);

export const tokenStorage = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};