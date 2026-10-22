// Tuning knobs & shared constants for the matching engine.

export const WEIGHTS = {
    age: 15,
    height: 10,
    income: 20,
    location: 15,
    kids: 15,
    lifestyle: 15,
    education: 10,
} as const;

export const MIN_SCORE_THRESHOLD = 50;
export const MAX_RESULTS = 20;
export const DEFAULT_AGE_WINDOW = 5; // ±5 years if customer prefs omitted

// Tier-1 & tier-2 lists used for premium education weighting.
// Keep these names matching seedData usage — that file imports from here.
export const TIER_1_COLLEGES: string[] = [
    'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'BITS Pilani',
    'IIM Ahmedabad', 'IIM Bangalore', 'NIT Trichy', 'AIIMS Delhi',
];

export const TIER_2_COLLEGES: string[] = [
    'Delhi University', 'St. Xavier\u2019s Mumbai', 'Symbiosis Pune',
    'Christ University Bengaluru', 'Pune University', 'KEM Mumbai',
    'NLU Delhi', 'NID Ahmedabad', 'Fergusson College Pune',
];