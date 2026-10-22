export interface IMatchmaker {
    id: string;
    name: string;
    email: string;
    assignedRegion: string;
}

export interface ICustomerListItem {
    id: string;
    firstName: string;
    lastName: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    city: string;
    maritalStatus: 'Never Married' | 'Divorced' | 'Widowed';
    journeyStatus:
    | 'Onboarding'
    | 'Active Search'
    | 'Matching'
    | 'Dates Planned'
    | 'Paused'
    | 'Success';
}

export interface LoginResponse {
    token: string;
    matchmaker: IMatchmaker;
}

export interface ApiError {
    error: string;
    details?: unknown;
}