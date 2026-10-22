import type { Request, Response } from 'express';
import { Customer } from '../models';
import { getAge } from '../services/matchingEngine';

export async function listCandidatePool(_req: Request, res: Response) {
    const candidates = await Customer.find({ assignedMatchmaker: null })
        .select(
            'firstName lastName gender dateOfBirth city height maritalStatus ' +
            'education profession lifestyle preferences background'
        )
        .sort({ firstName: 1, lastName: 1 })
        .lean();

    return res.json({
        candidates: candidates.map((candidate: any) => ({
            id: String(candidate._id),
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            gender: candidate.gender,
            age: getAge(candidate.dateOfBirth),
            city: candidate.city,
            height: candidate.height,
            maritalStatus: candidate.maritalStatus,
            education: candidate.education,
            profession: candidate.profession,
            lifestyle: candidate.lifestyle,
            preferences: candidate.preferences,
            background: { religion: candidate.background?.religion },
        })),
    });
}
