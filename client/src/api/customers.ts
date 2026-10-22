import { api } from './axios';
import type { ICustomerDetail, ICustomerListItem, JourneyStatus, INote } from '../types';

export interface ListParams {
    q?: string;
    status?: JourneyStatus | '';
    gender?: 'Male' | 'Female' | 'Other' | '';
    city?: string;
    sort?: 'recent' | 'name' | 'age_asc' | 'age_desc';
}

export async function listCustomers(
    params: ListParams
): Promise<ICustomerListItem[]> {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') cleaned[k] = String(v);
    }
    const { data } = await api.get<{ customers: ICustomerListItem[] }>(
        '/customers',
        { params: cleaned }
    );
    return data.customers;
}

export async function getCustomer(id: string): Promise<ICustomerDetail> {
    const { data } = await api.get<{ customer: ICustomerDetail }>(
        `/customers/${id}`
    );
    return data.customer;
}

export async function updateStatus(
    id: string,
    journeyStatus: JourneyStatus
): Promise<JourneyStatus> {
    const { data } = await api.patch<{ journeyStatus: JourneyStatus }>(
        `/customers/${id}/status`,
        { journeyStatus }
    );
    return data.journeyStatus;
}

export async function addNote(id: string, text: string): Promise<INote> {
    const { data } = await api.post<{ note: INote }>(
        `/customers/${id}/notes`,
        { text }
    );
    return data.note;
}