import { api } from './axios';
import type {
    ICalculateMatchesResponse,
    IMatchHistoryEntry,
    IMatchesStats,
} from '../types';

// ---------- POST /api/matches/calculate/:customerId ---------------------

export async function calculateMatches(
    customerId: string
): Promise<ICalculateMatchesResponse> {
    const { data } = await api.post<ICalculateMatchesResponse>(
        `/matches/calculate/${customerId}`
    );
    return data;
}

// ---------- POST /api/matches/send --------------------------------------

export interface SendMatchPayload {
    customerId: string;
    candidateId: string;
    matchRationale: string;
    personalizedIntro?: string;
}

export interface SendMatchResponse {
    matchActionId: string;
    compatibilityScore: number;
    sentAt: string;
    status: string;
}

export async function sendMatch(
    payload: SendMatchPayload
): Promise<SendMatchResponse> {
    const { data } = await api.post<SendMatchResponse>('/matches/send', payload);
    return data;
}

// ---------- GET /api/matches/history/:customerId -----------------------

export async function fetchMatchHistory(
    customerId: string
): Promise<IMatchHistoryEntry[]> {
    const { data } = await api.get<{ history: IMatchHistoryEntry[] }>(
        `/matches/history/${customerId}`
    );
    return data.history;
}

// ---------- GET /api/matches/stats --------------------------------------

export async function fetchMatchStats(): Promise<IMatchesStats> {
    const { data } = await api.get<IMatchesStats>('/matches/stats');
    return data;
}