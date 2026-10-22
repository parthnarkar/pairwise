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
    age: number | null;
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

// Match types
export type MatchLabel =
    | 'High Potential Match'
    | 'Good Compatibility'
    | 'Worth Exploring';

export interface IMatchCandidate {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    city: string;
    height: number;
    maritalStatus: string;
    education: { undergraduateCollege: string; degree: string };
    profession: { currentCompany: string; designation: string; income: number };
    lifestyle: {
        drinking: 'Never' | 'Socially' | 'Regularly';
        smoking: 'Never' | 'Socially' | 'Regularly';
        diet: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';
    };
    preferences: {
        wantKids: TriState;
        openToRelocate: TriState;
        openToPets: TriState;
    };
    background: { religion?: string };
}

export interface IMatchBreakdown {
    age: number;
    height: number;
    income: number;
    location: number;
    kids: number;
    lifestyle: number;
    education: number;
}

export interface IMatchResult {
    candidateId: string;
    candidate: IMatchCandidate;
    compatibilityScore: number;
    label: MatchLabel;
    breakdown: IMatchBreakdown;
    matchRationale: string;
    personalizedIntro?: string;
    rationaleSource: 'ai' | 'fallback';
}

export interface ICalculateMatchesResponse {
    customerId: string;
    customerName: string;
    totalCandidates: number;
    afterHardFilters: number;
    returned: number;
    matches: IMatchResult[];
}

// Match history + stats (Phase 5)
export type MatchActionStatus = 'Suggested' | 'Sent' | 'Accepted' | 'Rejected' | 'Revoked';

export interface IMatchHistoryPerson {
    id: string;
    name: string;
    city: string;
    gender: string;
    age: number;
    height: number;
    maritalStatus: string;
    education: { undergraduateCollege: string; degree: string };
    profession: { currentCompany: string; designation: string; income: number };
    background: { religion?: string; caste?: string };
}

export interface IGlobalMatchHistoryEntry {
    id: string;
    compatibilityScore: number;
    status: MatchActionStatus;
    matchRationale: string;
    personalizedIntro?: string;
    sentAt: string;
    revokedAt?: string | null;
    revokeNote?: string | null;
    clientMessage?: string | null;
    customer: IMatchHistoryPerson | null;
    candidate: IMatchHistoryPerson | null;
}

export interface IMatchHistoryEntry {
    id: string;
    compatibilityScore: number;
    status: MatchActionStatus;
    matchRationale: string;
    personalizedIntro?: string;
    sentAt: string;
    candidate: {
        id: string;
        firstName: string;
        lastName: string;
        age: number;
        city: string;
        height: number;
        maritalStatus: string;
        education: { undergraduateCollege: string; degree: string };
        profession: {
            currentCompany: string;
            designation: string;
            income: number;
        };
        background: { religion?: string };
    } | null;
}

export interface IRecentMatch {
    id: string;
    customerName: string;
    candidateName: string;
    score: number;
    sentAt: string;
}

export interface IMatchesStats {
    customersAssigned: number;
    activeSearches: number;
    matchesSent: number;
    accepted: number;
    candidatesCount: number;
    recentMatches: IRecentMatch[];
}