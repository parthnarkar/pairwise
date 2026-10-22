import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Customer, MatchAction } from '../models';
import { runMatching, getAge, type EngineCustomer } from '../services/matchingEngine';

// Do NOT expose sensitive / contact fields on the candidate card (blueprint §3.2)
function shapeCandidate(c: any) {
    return {
        id: String(c._id),
        firstName: c.firstName,
        lastName: c.lastName,
        age: getAge(c.dateOfBirth),
        gender: c.gender,
        city: c.city,
        height: c.height,
        maritalStatus: c.maritalStatus,
        education: {
            undergraduateCollege: c.education?.undergraduateCollege,
            degree: c.education?.degree,
        },
        profession: {
            currentCompany: c.profession?.currentCompany,
            designation: c.profession?.designation,
            income: c.profession?.income,
        },
        lifestyle: c.lifestyle,
        preferences: {
            wantKids: c.preferences?.wantKids,
            openToRelocate: c.preferences?.openToRelocate,
            openToPets: c.preferences?.openToPets,
        },
        background: {
            religion: c.background?.religion, // caste intentionally omitted
        },
    };
}

export async function calculateMatches(req: Request, res: Response) {
    const { id } = req.params;
    const matchmakerId = req.matchmakerId!;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await Customer.findOne({
        _id: id,
        assignedMatchmaker: matchmakerId,
    }).lean();

    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.gender === 'Other') {
        return res
            .status(400)
            .json({ error: 'Matching is not supported for Other gender in MVP' });
    }

    const oppositeGender = customer.gender === 'Male' ? 'Female' : 'Male';

    // Exclude candidates with an existing Sent/Accepted/Rejected match action
    const existing = await MatchAction.find({
        customerId: id,
        status: { $in: ['Sent', 'Accepted', 'Rejected'] },
    })
        .select('candidateId')
        .lean();

    const excludedIds = new Set(existing.map((a) => String(a.candidateId)));

    // Candidate pool: unassigned customers of the opposite gender
    const candidates = await Customer.find({
        gender: oppositeGender,
        assignedMatchmaker: null,
    }).lean();

    const { eligibleCount, results } = runMatching(
        customer as unknown as EngineCustomer,
        candidates as unknown as EngineCustomer[],
        excludedIds
    );

    return res.json({
        customerId: String(customer._id),
        customerName: `${customer.firstName} ${customer.lastName}`,
        totalCandidates: candidates.length,
        afterHardFilters: eligibleCount,
        returned: results.length,
        matches: results.map((r) => ({
            candidateId: String(r.candidate._id),
            candidate: shapeCandidate(r.candidate),
            compatibilityScore: Math.round(r.score),
            label: r.label,
            breakdown: r.breakdown,
            matchRationale: r.matchRationale,
            rationaleSource: 'fallback' as const, // 4b will upgrade to 'ai' when applicable
        })),
    });
}