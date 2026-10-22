import {
    WEIGHTS,
    DEFAULT_AGE_WINDOW,
    MIN_SCORE_THRESHOLD,
    MAX_RESULTS,
    TIER_1_COLLEGES,
    TIER_2_COLLEGES,
} from './matchingConfig';

// ---------- types -------------------------------------------------------

type Gender = 'Male' | 'Female' | 'Other';
type TriState = 'Yes' | 'No' | 'Maybe';
type MaritalStatus = 'Never Married' | 'Divorced' | 'Widowed';
type Habit = 'Never' | 'Socially' | 'Regularly';
type Diet = 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';

export interface EngineCustomer {
    _id: any;
    firstName: string;
    lastName: string;
    gender: Gender;
    dateOfBirth: Date;
    height: number;
    city: string;
    country: string;
    maritalStatus: MaritalStatus;
    profession: { income: number; currentCompany: string; designation: string };
    education: { undergraduateCollege: string; degree: string };
    lifestyle: { drinking: Habit; smoking: Habit; diet: Diet };
    background?: { religion?: string; caste?: string };
    preferences: {
        wantKids: TriState;
        openToRelocate: TriState;
        openToPets: TriState;
        minAge?: number;
        maxAge?: number;
    };
}

export type ScoreBreakdown = {
    age: number;
    height: number;
    income: number;
    location: number;
    kids: number;
    lifestyle: number;
    education: number;
};

export type MatchLabel =
    | 'High Potential Match'
    | 'Good Compatibility'
    | 'Worth Exploring';

export interface ScoredResult {
    candidate: EngineCustomer;
    score: number;
    breakdown: ScoreBreakdown;
    label: MatchLabel;
    matchRationale: string;
}

// ---------- helpers -----------------------------------------------------

export function getAge(dob: Date | string): number {
    const d = typeof dob === 'string' ? new Date(dob) : dob;
    return Math.floor(
        (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
}

function inList(name: string, list: string[]): boolean {
    return list.some((c) => c.toLowerCase() === name.toLowerCase());
}

// ---------- Stage 1: eligibility (hard filters) -------------------------

export function isEligible(
    customer: EngineCustomer,
    candidate: EngineCustomer
): boolean {
    // Gender: strictly opposite
    if (customer.gender === 'Male' && candidate.gender !== 'Female') return false;
    if (customer.gender === 'Female' && candidate.gender !== 'Male') return false;
    if (customer.gender === 'Other') return false; // not supported in MVP

    // Age: candidate must fit customer's stated range (or default ±5y)
    const custAge = getAge(customer.dateOfBirth);
    const candAge = getAge(candidate.dateOfBirth);
    const minAge = customer.preferences?.minAge ?? custAge - DEFAULT_AGE_WINDOW;
    const maxAge = customer.preferences?.maxAge ?? custAge + DEFAULT_AGE_WINDOW;
    if (candAge < minAge || candAge > maxAge) return false;

    // Marital status compatibility (MVP conservative rule):
    // Never-Married customers only see Never-Married candidates.
    if (
        customer.maritalStatus === 'Never Married' &&
        candidate.maritalStatus !== 'Never Married'
    ) {
        return false;
    }

    return true;
}

// ---------- Stage 2: weighted scoring -----------------------------------

function scoreAge(
    customerAge: number,
    candidateAge: number,
    gender: Gender
): number {
    // diff > 0 means candidate is younger
    const diff = customerAge - candidateAge;

    let idealLow: number, idealHigh: number;
    if (gender === 'Male') {
        idealLow = 2;
        idealHigh = 5;
    } else if (gender === 'Female') {
        idealLow = -7;
        idealHigh = -2;
    } else {
        idealLow = -2;
        idealHigh = 2;
    }

    if (diff >= idealLow && diff <= idealHigh) return WEIGHTS.age;
    if (diff >= idealLow - 3 && diff < idealLow) return 10;
    if (diff > idealHigh && diff <= idealHigh + 3) return 10;
    if (diff >= idealLow - 6 && diff < idealLow - 3) return 6;
    if (diff > idealHigh + 3 && diff <= idealHigh + 6) return 6;
    return 2;
}

function scoreHeight(
    customerHeight: number,
    candidateHeight: number,
    gender: Gender
): number {
    // diff > 0 means candidate is shorter
    const diff = customerHeight - candidateHeight;

    let idealLow: number, idealHigh: number;
    if (gender === 'Male') {
        idealLow = 5;
        idealHigh = 20;
    } else if (gender === 'Female') {
        idealLow = -20;
        idealHigh = -5;
    } else {
        idealLow = -5;
        idealHigh = 5;
    }

    if (diff >= idealLow && diff <= idealHigh) return WEIGHTS.height;
    if (diff >= idealLow - 4 && diff < idealLow) return 7;
    if (diff > idealHigh && diff <= idealHigh + 4) return 7;
    return 3;
}

function scoreIncome(
    customerIncome: number,
    candidateIncome: number,
    gender: Gender
): number {
    if (customerIncome <= 0 || candidateIncome <= 0) {
        return Math.round(WEIGHTS.income * 0.5); // neutral if missing
    }
    const ratio = candidateIncome / customerIncome;

    if (gender === 'Male') {
        // Prefer candidate income lower or aligned
        if (ratio >= 0.4 && ratio <= 0.9) return WEIGHTS.income; // 20
        if (ratio < 0.4) return 15;
        if (ratio <= 1.2) return 16;
        if (ratio <= 2.0) return 10;
        return 4;
    }
    if (gender === 'Female') {
        // Prefer candidate income >= customer (parity or higher)
        if (ratio >= 1.0 && ratio <= 2.5) return WEIGHTS.income; // 20
        if (ratio >= 0.8 && ratio < 1.0) return 16;
        if (ratio > 2.5) return 12;
        if (ratio >= 0.5) return 10;
        return 4;
    }
    return Math.round(WEIGHTS.income * 0.5);
}

function scoreLocation(
    customerCity: string,
    customerCountry: string,
    candidateCity: string,
    candidateCountry: string
): number {
    if (
        customerCity.toLowerCase() === candidateCity.toLowerCase() &&
        customerCountry.toLowerCase() === candidateCountry.toLowerCase()
    ) {
        return WEIGHTS.location; // 15
    }
    if (customerCountry.toLowerCase() === candidateCountry.toLowerCase()) {
        return 8;
    }
    return 0;
}

function scoreKids(custKids: TriState, candKids: TriState): number {
    if (custKids === candKids) return WEIGHTS.kids; // 15
    // Adjacent preferences (Yes↔Maybe, Maybe↔No) get half
    if (
        (custKids === 'Yes' && candKids === 'Maybe') ||
        (custKids === 'Maybe' && candKids === 'Yes') ||
        (custKids === 'No' && candKids === 'Maybe') ||
        (custKids === 'Maybe' && candKids === 'No')
    ) {
        return 7;
    }
    return 0; // Yes vs No → dealbreaker
}

function scoreLifestyle(
    cust: EngineCustomer,
    cand: EngineCustomer
): number {
    let pts = 0;

    // Diet (5 pts)
    if (cust.lifestyle.diet === cand.lifestyle.diet) pts += 5;
    else pts += 3;

    // Drinking + smoking (5 pts) — combined harmony
    const drinkMatch = cust.lifestyle.drinking === cand.lifestyle.drinking;
    const smokeMatch = cust.lifestyle.smoking === cand.lifestyle.smoking;
    if (drinkMatch && smokeMatch) pts += 5;
    else if (drinkMatch || smokeMatch) pts += 3;
    else pts += 1;

    // Pets (5 pts)
    const cp = cust.preferences.openToPets;
    const kp = cand.preferences.openToPets;
    if (cp === kp) pts += 5;
    else if (cp === 'Maybe' || kp === 'Maybe') pts += 3;
    else pts += 0; // Yes vs No

    return Math.min(pts, WEIGHTS.lifestyle);
}

function scoreEducation(
    custCollege: string,
    candCollege: string
): number {
    const custT1 = inList(custCollege, TIER_1_COLLEGES);
    const candT1 = inList(candCollege, TIER_1_COLLEGES);
    const custT2 = inList(custCollege, TIER_2_COLLEGES);
    const candT2 = inList(candCollege, TIER_2_COLLEGES);

    if (custT1 && candT1) return WEIGHTS.education; // 10
    if (custT1 || candT1) return 8;
    if (custT2 && candT2) return 6;
    if (custT2 || candT2) return 4;
    return 3;
}

export function scoreMatch(
    customer: EngineCustomer,
    candidate: EngineCustomer
): { score: number; breakdown: ScoreBreakdown } {
    const custAge = getAge(customer.dateOfBirth);
    const candAge = getAge(candidate.dateOfBirth);

    const breakdown: ScoreBreakdown = {
        age: scoreAge(custAge, candAge, customer.gender),
        height: scoreHeight(customer.height, candidate.height, customer.gender),
        income: scoreIncome(
            customer.profession.income,
            candidate.profession.income,
            customer.gender
        ),
        location: scoreLocation(
            customer.city,
            customer.country,
            candidate.city,
            candidate.country
        ),
        kids: scoreKids(
            customer.preferences.wantKids,
            candidate.preferences.wantKids
        ),
        lifestyle: scoreLifestyle(customer, candidate),
        education: scoreEducation(
            customer.education.undergraduateCollege,
            candidate.education.undergraduateCollege
        ),
    };

    const score =
        breakdown.age +
        breakdown.height +
        breakdown.income +
        breakdown.location +
        breakdown.kids +
        breakdown.lifestyle +
        breakdown.education;

    return { score, breakdown };
}

// ---------- Stage 3: label ----------------------------------------------

export function labelFor(score: number): MatchLabel | null {
    if (score >= 85) return 'High Potential Match';
    if (score >= 70) return 'Good Compatibility';
    if (score >= MIN_SCORE_THRESHOLD) return 'Worth Exploring';
    return null;
}

// ---------- deterministic rationale (Phase 4b replaces with AI) ---------

export function generateFallbackRationale(
    candidate: EngineCustomer,
    breakdown: ScoreBreakdown
): string {
    const reasons: string[] = [];
    if (breakdown.age >= 12) reasons.push('a well-aligned age gap');
    if (breakdown.height >= 8) reasons.push('compatible physical profiles');
    if (breakdown.income >= 15) reasons.push('aligned socioeconomic expectations');
    if (breakdown.location >= 12) reasons.push(`both based in ${candidate.city}`);
    if (breakdown.kids >= 12) reasons.push('matching views on children');
    if (breakdown.lifestyle >= 10) reasons.push('compatible lifestyle habits');
    if (breakdown.education >= 8) reasons.push('strong educational alignment');

    if (reasons.length === 0) {
        return 'A candidate worth exploring based on broad compatibility.';
    }
    if (reasons.length === 1) {
        return `Suggested based on ${reasons[0]}.`;
    }
    const last = reasons.pop()!;
    return `Suggested based on ${reasons.join(', ')} and ${last}.`;
}

// ---------- orchestrator ------------------------------------------------

export function runMatching(
    customer: EngineCustomer,
    candidates: EngineCustomer[],
    excludedCandidateIds: Set<string>
): {
    eligibleCount: number;
    results: ScoredResult[];
} {
    const eligible = candidates.filter(
        (c) =>
            !excludedCandidateIds.has(String(c._id)) && isEligible(customer, c)
    );

    const scored: ScoredResult[] = [];
    for (const candidate of eligible) {
        const { score, breakdown } = scoreMatch(customer, candidate);
        const label = labelFor(score);
        if (!label) continue; // below threshold
        scored.push({
            candidate,
            score,
            breakdown,
            label,
            matchRationale: generateFallbackRationale(candidate, breakdown),
        });
    }

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // deterministic tie-break: alphabetical by name
        return (
            a.candidate.firstName.localeCompare(b.candidate.firstName) ||
            a.candidate.lastName.localeCompare(b.candidate.lastName)
        );
    });

    return {
        eligibleCount: eligible.length,
        results: scored.slice(0, MAX_RESULTS),
    };
}