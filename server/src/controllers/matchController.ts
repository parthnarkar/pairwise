import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Customer, MatchAction, MatchRevocation } from '../models';
import { runMatching, getAge, scoreMatch, type EngineCustomer } from '../services/matchingEngine';
import { generateRationale } from '../services/aiService';
import { WEIGHTS, MIN_SCORE_THRESHOLD } from '../services/matchingConfig';
import { z } from 'zod';

// Do NOT expose sensitive / contact fields on the candidate card
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

    // ---------- AI enrichment (top-N only) ----------

    const AI_TOP_N = Number(process.env.AI_TOP_N) || 5;
    const topN = results.slice(0, AI_TOP_N);
    const rest = results.slice(AI_TOP_N);

    const aiResults = await Promise.allSettled(
        topN.map((r) =>
            generateRationale(
                customer as unknown as EngineCustomer,
                r.candidate,
                Math.round(r.score),
                r.label,
                r.breakdown
            )
        )
    );

    const enrichedTop = topN.map((r, i) => {
        const settled = aiResults[i];
        if (settled.status === 'fulfilled' && settled.value) {
            return {
                ...r,
                matchRationale: settled.value.rationale,
                personalizedIntro: settled.value.personalizedIntro,
                rationaleSource: 'ai' as const,
            };
        }
        return { ...r, rationaleSource: 'fallback' as const };
    });

    const enrichedRest = rest.map((r) => ({
        ...r,
        rationaleSource: 'fallback' as const,
    }));

    const enriched = [...enrichedTop, ...enrichedRest];

    return res.json({
        customerId: String(customer._id),
        customerName: `${customer.firstName} ${customer.lastName}`,
        totalCandidates: candidates.length,
        afterHardFilters: eligibleCount,
        returned: enriched.length,
        matches: enriched.map((r) => ({
            candidateId: String(r.candidate._id),
            candidate: shapeCandidate(r.candidate),
            compatibilityScore: Math.round(r.score),
            label: r.label,
            breakdown: r.breakdown,
            matchRationale: r.matchRationale,
            personalizedIntro:
                'personalizedIntro' in r ? r.personalizedIntro : undefined,
            rationaleSource: r.rationaleSource,
        })),
    });
}

// ---------- POST /api/matches/send -------------------------------------

const sendSchema = z.object({
    customerId: z
        .string()
        .refine((v) => mongoose.isValidObjectId(v), 'Invalid customerId'),
    candidateId: z
        .string()
        .refine((v) => mongoose.isValidObjectId(v), 'Invalid candidateId'),
    matchRationale: z.string().trim().min(1).max(1000),
    personalizedIntro: z.string().trim().max(2000).optional(),
});

export async function sendMatch(req: Request, res: Response) {
    const matchmakerId = req.matchmakerId!;

    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const { customerId, candidateId, matchRationale, personalizedIntro } =
        parsed.data;

    // 1. Customer must belong to this matchmaker
    const customer = await Customer.findOne({
        _id: customerId,
        assignedMatchmaker: matchmakerId,
    }).lean();
    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    // 2. Candidate must be an unassigned opposite-gender profile
    const candidate = await Customer.findOne({
        _id: candidateId,
        assignedMatchmaker: null,
    }).lean();
    if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
    }

    // 3. Recompute score server-side (source of truth)
    const { score } = scoreMatch(
        customer as unknown as EngineCustomer,
        candidate as unknown as EngineCustomer
    );
    const roundedScore = Math.round(score);

    if (roundedScore < MIN_SCORE_THRESHOLD) {
        return res
            .status(400)
            .json({ error: 'Candidate does not meet minimum compatibility threshold' });
    }

    // 4. Create the MatchAction (unique index blocks duplicates)
    try {
        const action = await MatchAction.create({
            customerId,
            candidateId,
            matchmakerId,
            compatibilityScore: roundedScore,
            matchRationale,
            personalizedIntro,
            status: 'Sent',
            sentAt: new Date(),
        });

        // NEW: Auto-update journey status to 'Matching' if it's currently 'Active Search'
        if (customer.journeyStatus === 'Active Search') {
            await Customer.updateOne(
                { _id: customerId },
                { $set: { journeyStatus: 'Matching' } }
            );
        }

        return res.status(201).json({
            matchActionId: String(action._id),
            compatibilityScore: roundedScore,
            sentAt: action.sentAt,
            status: action.status,
        });
    } catch (err: any) {
        if (err?.code === 11000) {
            return res.status(409).json({
                error: 'This match has already been sent to the customer.',
            });
        }
        throw err;
    }
}

// ---------- GET /api/matches/history/:customerId -----------------------

export async function getMatchHistory(req: Request, res: Response) {
    const { customerId } = req.params;
    const matchmakerId = req.matchmakerId!;

    if (!mongoose.isValidObjectId(customerId)) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify ownership before returning history
    const owns = await Customer.exists({
        _id: customerId,
        assignedMatchmaker: matchmakerId,
    });
    if (!owns) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    const actions = await MatchAction.find({ customerId })
        .sort({ createdAt: -1 })
        .populate({
            path: 'candidateId',
            select:
                'firstName lastName gender dateOfBirth city height maritalStatus ' +
                'education profession lifestyle preferences background',
        })
        .lean();

    const history = actions.map((a: any) => {
        const c = a.candidateId as any;
        return {
            id: String(a._id),
            compatibilityScore: a.compatibilityScore,
            status: a.status,
            matchRationale: a.matchRationale,
            personalizedIntro: a.personalizedIntro,
            sentAt: a.sentAt ?? a.createdAt,
            candidate: c
                ? {
                    id: String(c._id),
                    firstName: c.firstName,
                    lastName: c.lastName,
                    age: getAge(c.dateOfBirth),
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
                    background: { religion: c.background?.religion },
                }
                : null,
        };
    });

    return res.json({ customerId, history });
}

// ---------- GET /api/matches/stats -------------------------------------

export async function getMatchStats(req: Request, res: Response) {
    const matchmakerId = req.matchmakerId!;

    const [customersAssigned, activeSearches, matchesSent, accepted, candidatesCount, recent] =
        await Promise.all([
            Customer.countDocuments({ assignedMatchmaker: matchmakerId }),
            Customer.countDocuments({
                assignedMatchmaker: matchmakerId,
                journeyStatus: 'Active Search',
            }),
            MatchAction.countDocuments({ matchmakerId, status: 'Sent' }),
            MatchAction.countDocuments({ matchmakerId, status: 'Accepted' }),
            Customer.countDocuments({ assignedMatchmaker: null }),
            // NEW: Fetch the 4 most recent matches with populated names
            MatchAction.find({ matchmakerId, status: 'Sent' })
                .sort({ createdAt: -1 })
                .limit(4)
                .populate('customerId', 'firstName lastName')
                .populate('candidateId', 'firstName lastName')
                .lean(),
        ]);

    const recentMatches = recent.map((m: any) => ({
        id: String(m._id),
        customerName: `${m.customerId?.firstName} ${m.customerId?.lastName}`,
        candidateName: `${m.candidateId?.firstName} ${m.candidateId?.lastName}`,
        score: m.compatibilityScore,
        sentAt: m.sentAt || m.createdAt,
    }));

    return res.json({
        customersAssigned,
        activeSearches,
        matchesSent,
        accepted,
        candidatesCount,
        recentMatches, // <-- Added this
    });
}

// ---------- DELETE /api/matches/:id ------------------------------------

const revokeSchema = z.object({
    revokeNote: z.string().trim().max(2000).optional().default(''),
    clientMessage: z.string().trim().max(2000).optional().default(''),
});

export async function revokeMatch(req: Request, res: Response) {
    const { id } = req.params;
    const matchmakerId = req.matchmakerId!;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'Match not found' });
    }

    const parsed = revokeSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid revoke details', details: parsed.error.flatten() });
    }

    // Find and delete, ensuring this matchmaker owns the action
    const deleted = await MatchAction.findOneAndDelete({
        _id: id,
        matchmakerId,
    });

    if (!deleted) {
        return res.status(404).json({ error: 'Match not found' });
    }

    await MatchRevocation.create({
        matchActionId: deleted._id,
        customerId: deleted.customerId,
        candidateId: deleted.candidateId,
        matchmakerId,
        compatibilityScore: deleted.compatibilityScore,
        matchRationale: deleted.matchRationale,
        personalizedIntro: deleted.personalizedIntro,
        sentAt: deleted.sentAt,
        revokeNote: parsed.data.revokeNote,
        clientMessage: parsed.data.clientMessage,
    });

    if (parsed.data.revokeNote) {
        await Customer.updateOne(
            { _id: deleted.customerId, assignedMatchmaker: matchmakerId },
            {
                $push: {
                    notes: {
                        author: matchmakerId,
                        text: `Match revoked: ${parsed.data.revokeNote}`,
                        createdAt: new Date(),
                    },
                },
            }
        );
    }

    const remainingSent = await MatchAction.exists({
        customerId: deleted.customerId,
        matchmakerId,
        status: 'Sent',
    });
    if (!remainingSent) {
        await Customer.updateOne(
            { _id: deleted.customerId, assignedMatchmaker: matchmakerId },
            { $set: { journeyStatus: 'Active Search' } }
        );
    }

    return res.json({
        success: true,
        message: 'Match revoked successfully',
        hasRemainingSentMatches: Boolean(remainingSent),
        revokeNote: parsed.data.revokeNote,
        clientMessage: parsed.data.clientMessage,
    });
}

// ---------- GET /api/matches/history (Global) --------------------------

export async function getGlobalMatchHistory(req: Request, res: Response) {
    const matchmakerId = req.matchmakerId!;

    const [actions, revocations] = await Promise.all([
        MatchAction.find({ matchmakerId })
            .populate('customerId')
            .populate('candidateId')
            .lean(),
        MatchRevocation.find({ matchmakerId })
            .populate('customerId')
            .populate('candidateId')
            .lean(),
    ]);

    const shapePerson = (person: any) =>
        person && typeof person === 'object' && person.firstName
            ? {
        id: String(person._id),
        name: `${person.firstName} ${person.lastName}`,
        city: person.city ?? 'Unknown city',
        gender: person.gender ?? 'Unknown',
        age: person.dateOfBirth ? getAge(person.dateOfBirth) : null,
        height: person.height ?? 0,
        maritalStatus: person.maritalStatus ?? 'Unknown',
        education: person.education ?? {},
        profession: person.profession ?? {},
        background: person.background ?? {},
            }
            : null;

    const scoreForHistory = (
        storedScore: unknown,
        customer: any,
        candidate: any
    ): number | null => {
        if (typeof storedScore === 'number' && Number.isFinite(storedScore)) {
            return storedScore;
        }
        const canScore = [customer, candidate].every((person) =>
            person &&
            person.dateOfBirth &&
            person.height &&
            person.city &&
            person.country &&
            person.profession?.income !== undefined &&
            person.education?.undergraduateCollege &&
            person.lifestyle?.drinking &&
            person.lifestyle?.smoking &&
            person.lifestyle?.diet &&
            person.preferences?.wantKids &&
            person.preferences?.openToRelocate &&
            person.preferences?.openToPets
        );
        if (!canScore) return null;
        return Math.round(
            scoreMatch(
                customer as unknown as EngineCustomer,
                candidate as unknown as EngineCustomer
            ).score
        );
    };

    const history = [
        ...actions.map((a: any) => ({
            id: String(a._id),
            compatibilityScore: scoreForHistory(a.compatibilityScore, a.customerId, a.candidateId),
            status: a.status,
            matchRationale: a.matchRationale,
            personalizedIntro: a.personalizedIntro,
            sentAt: a.sentAt ?? a.createdAt,
            revokedAt: null,
            revokeNote: null,
            clientMessage: null,
            customer: shapePerson(a.customerId),
            candidate: shapePerson(a.candidateId),
        })),
        ...revocations.map((r: any) => ({
            id: String(r._id),
            compatibilityScore: scoreForHistory(r.compatibilityScore, r.customerId, r.candidateId),
            status: 'Revoked',
            matchRationale: r.matchRationale,
            personalizedIntro: r.personalizedIntro,
            sentAt: r.sentAt ?? r.createdAt,
            revokedAt: r.createdAt,
            revokeNote: r.revokeNote,
            clientMessage: r.clientMessage,
            customer: shapePerson(r.customerId),
            candidate: shapePerson(r.candidateId),
        })),
    ].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return res.json({ history });
}