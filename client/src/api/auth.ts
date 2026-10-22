import { api } from './axios';
import type { IMatchmaker, LoginResponse } from '../types';

export async function loginRequest(
    email: string,
    password: string
): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
    });
    return data;
}

export async function fetchMe(): Promise<IMatchmaker> {
    const { data } = await api.get<{ matchmaker: IMatchmaker }>(
        '/matchmakers/me'
    );
    return data.matchmaker;
}