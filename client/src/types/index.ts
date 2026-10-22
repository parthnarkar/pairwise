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
    journeyStatus: JourneyStatus
}

export interface LoginResponse {
    token: string;
    matchmaker: IMatchmaker;
}

export interface ApiError {
    error: string;
    details?: unknown;
}

export type TriState = 'Yes' | 'No' | 'Maybe';

export type JourneyStatus =
    | 'Onboarding'
    | 'Active Search'
    | 'Matching'
    | 'Dates Planned'
    | 'Paused'
    | 'Success';

export const JOURNEY_STATUSES: JourneyStatus[] = [
    'Onboarding',
    'Active Search',
    'Matching',
    'Dates Planned',
    'Paused',
    'Success',
];

export interface INote {
    author: { id: string | null; name: string; email: string };
    text: string;
    createdAt: string;
}

export interface ICustomerDetail {
    id: string;
    firstName: string;
    lastName: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    dateOfBirth: string;
    country: string;
    city: string;
    height: number;
    email: string;
    phone: string;
    education: { undergraduateCollege: string; degree: string };
    profession: { currentCompany: string; designation: string; income: number };
    maritalStatus: 'Never Married' | 'Divorced' | 'Widowed';
    languagesKnown: string[];
    siblings: number;
    background: { religion?: string; caste?: string };
    lifestyle: {
        drinking: 'Never' | 'Socially' | 'Regularly';
        smoking: 'Never' | 'Socially' | 'Regularly';
        diet: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';
    };
    preferences: {
        wantKids: TriState;
        openToRelocate: TriState;
        openToPets: TriState;
        minAge?: number;
        maxAge?: number;
        preferredReligions?: string[];
    };
    journeyStatus: JourneyStatus;
    notes: INote[];
    createdAt: string;
    updatedAt: string;
}