// Self-contained assertion script — run via `npm run check:engine`.
// Covers: gender hard filters, age bounds, kids scoring, income direction,
// height direction, weight totals, label thresholds, deterministic ordering.

import {
    isEligible,
    scoreMatch,
    labelFor,
    runMatching,
    getAge,
    type EngineCustomer,
} from '../matchingEngine';
import { WEIGHTS } from '../matchingConfig';

// ---------- tiny test harness -------------------------------------------

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, hint?: string) {
    if (cond) {
        passed++;
        console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    } else {
        failed++;
        console.log(`  \x1b[31m✗\x1b[0m ${name}${hint ? `  → ${hint}` : ''}`);
    }
}

// ---------- fixtures ----------------------------------------------------

function cust(overrides: Partial<EngineCustomer> = {}): EngineCustomer {
    return {
        _id: 'CUST',
        firstName: 'Arjun',
        lastName: 'Mehta',
        gender: 'Male',
        dateOfBirth: new Date(Date.now() - 32 * 365.25 * 24 * 3600 * 1000),
        height: 178,
        city: 'Mumbai',
        country: 'India',
        maritalStatus: 'Never Married',
        profession: {
            income: 4500000,
            currentCompany: 'Google India',
            designation: 'Senior Software Engineer',
        },
        education: { undergraduateCollege: 'IIT Bombay', degree: 'B.Tech' },
        lifestyle: { drinking: 'Socially', smoking: 'Never', diet: 'Non-Vegetarian' },
        background: { religion: 'Hindu' },
        preferences: {
            wantKids: 'Yes',
            openToRelocate: 'Maybe',
            openToPets: 'Yes',
            minAge: 26,
            maxAge: 32,
        },
        ...overrides,
    };
}

function cand(overrides: Partial<EngineCustomer> = {}): EngineCustomer {
    return {
        _id: 'CAND',
        firstName: 'Priya',
        lastName: 'Sharma',
        gender: 'Female',
        dateOfBirth: new Date(Date.now() - 28 * 365.25 * 24 * 3600 * 1000),
        height: 162,
        city: 'Mumbai',
        country: 'India',
        maritalStatus: 'Never Married',
        profession: {
            income: 2200000,
            currentCompany: 'HUL',
            designation: 'Marketing Manager',
        },
        education: {
            undergraduateCollege: 'St. Xavier\u2019s Mumbai',
            degree: 'B.Com',
        },
        lifestyle: { drinking: 'Socially', smoking: 'Never', diet: 'Vegetarian' },
        background: { religion: 'Hindu' },
        preferences: {
            wantKids: 'Yes',
            openToRelocate: 'Maybe',
            openToPets: 'Yes',
        },
        ...overrides,
    };
}

// ---------- tests -------------------------------------------------------

console.log('\nMatching engine — self-checks\n');

console.log('Hard filters (Stage 1):');
check(
    'male customer rejects male candidate',
    !isEligible(cust(), cand({ gender: 'Male' }))
);
check(
    'female customer rejects female candidate',
    !isEligible(cust({ gender: 'Female' }), cand({ gender: 'Female' }))
);
check(
    'Other gender always rejected',
    !isEligible(cust({ gender: 'Other' }), cand({ gender: 'Female' }))
);
check(
    'candidate below minAge rejected',
    !isEligible(
        cust(),
        cand({ dateOfBirth: new Date(Date.now() - 24 * 365.25 * 24 * 3600 * 1000) })
    )
);
check(
    'candidate above maxAge rejected',
    !isEligible(
        cust(),
        cand({ dateOfBirth: new Date(Date.now() - 35 * 365.25 * 24 * 3600 * 1000) })
    )
);
check(
    'Never-Married customer rejects Divorced candidate',
    !isEligible(cust(), cand({ maritalStatus: 'Divorced' }))
);
check(
    'Divorced customer accepts Never-Married candidate',
    isEligible(cust({ maritalStatus: 'Divorced' }), cand())
);
check(
    'default ±5y window when prefs empty',
    isEligible(
        cust({ preferences: { wantKids: 'Yes', openToRelocate: 'Maybe', openToPets: 'Yes' } as any }),
        cand()
    )
);

console.log('\nScoring direction (Stage 2):');
{
    const { breakdown: b } = scoreMatch(cust(), cand());
    check('male customer → ideal age gap scores full 15', b.age === 15);
    check('male customer → shorter candidate scores full 10', b.height === 10);
    check('male customer → lower income scores full 20', b.income === 20);
    check('same city scores full 15', b.location === 15);
    check('matching kids preference scores full 15', b.kids === 15);
    check('education breakdown within weight cap', b.education <= WEIGHTS.education);
    check('lifestyle breakdown within weight cap', b.lifestyle <= WEIGHTS.lifestyle);
}

{
    const older = scoreMatch(cust(), cand({ dateOfBirth: new Date(Date.now() - 37 * 365.25 * 24 * 3600 * 1000) }));
    // older candidate makes arjun's ideal (-x) fail → but 37 is above maxAge so isEligible would fail.
    // Directly test scorer in isolation with a still-eligible but non-ideal age:
    const oldButEligible = scoreMatch(
        cust({ preferences: { wantKids: 'Yes', openToRelocate: 'Maybe', openToPets: 'Yes', minAge: 20, maxAge: 45 } as any }),
        cand({ dateOfBirth: new Date(Date.now() - 35 * 365.25 * 24 * 3600 * 1000) })
    );
    check('older candidate scores lower on age than ideal', oldButEligible.breakdown.age < 15);
}

{
    const noKids = scoreMatch(cust(), cand({ preferences: { wantKids: 'No', openToRelocate: 'Maybe', openToPets: 'Yes' } as any }));
    check('Yes-vs-No on kids scores 0', noKids.breakdown.kids === 0);

    const maybeKids = scoreMatch(cust(), cand({ preferences: { wantKids: 'Maybe', openToRelocate: 'Maybe', openToPets: 'Yes' } as any }));
    check('Yes-vs-Maybe on kids scores 7', maybeKids.breakdown.kids === 7);
}

{
    const femaleCustomer = cust({
        gender: 'Female',
        height: 165,
        profession: { income: 2200000, currentCompany: 'HUL', designation: 'Marketing Manager' },
    });
    const maleCand = cand({
        gender: 'Male',
        height: 178,
        profession: { income: 4500000, currentCompany: 'Google India', designation: 'Senior Software Engineer' },
        dateOfBirth: new Date(Date.now() - 34 * 365.25 * 24 * 3600 * 1000),
        preferences: { wantKids: 'Yes', openToRelocate: 'Maybe', openToPets: 'Yes', minAge: 25, maxAge: 35 } as any,
    });
    const r = scoreMatch(femaleCustomer, maleCand);
    check('female customer → taller candidate scores full 10', r.breakdown.height === 10);
    check('female customer → higher-earning candidate scores full 20', r.breakdown.income === 20);
}

console.log('\nLabels (Stage 3):');
check('85+ → High Potential Match', labelFor(90) === 'High Potential Match');
check('70–84 → Good Compatibility', labelFor(75) === 'Good Compatibility');
check('50–69 → Worth Exploring', labelFor(55) === 'Worth Exploring');
check('below 50 → null', labelFor(30) === null);

console.log('\nDeterminism & exclusion:');
{
    const customer = cust();
    const pool = [
        cand({ _id: 'A', firstName: 'Aisha', lastName: 'Khan' }),
        cand({ _id: 'B', firstName: 'Bhavna', lastName: 'Rao' }),
        cand({ _id: 'C', firstName: 'Charu', lastName: 'Nair' }),
    ];
    const run1 = runMatching(customer, pool, new Set());
    const run2 = runMatching(customer, pool, new Set());
    check(
        'two identical runs produce identical scores',
        JSON.stringify(run1.results.map((r) => [r.candidate._id, r.score])) ===
        JSON.stringify(run2.results.map((r) => [r.candidate._id, r.score]))
    );

    const excluded = runMatching(customer, pool, new Set(['B']));
    check(
        'excluded ID is absent from results',
        !excluded.results.some((r) => String(r.candidate._id) === 'B')
    );

    check(
        'results are sorted by descending score',
        run1.results.every((r, i) =>
            i === 0 ? true : run1.results[i - 1].score >= r.score
        )
    );
}

// ---------- report ------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);