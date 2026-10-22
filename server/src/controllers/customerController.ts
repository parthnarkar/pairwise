import type { Request, Response } from 'express';
import { Customer } from '../models';

// STUB: returns only this matchmaker's assigned customers.
// Full filters/search/sort come in Phase 3.
export async function listMyCustomers(req: Request, res: Response) {
    const matchmakerId = req.matchmakerId!;
    const customers = await Customer.find({ assignedMatchmaker: matchmakerId })
        .select(
            'firstName lastName gender dateOfBirth city maritalStatus journeyStatus'
        )
        .sort({ createdAt: -1 });

    // `age` virtual is only populated on full docs (toJSON with virtuals:true).
    // For the stub we compute age manually from dateOfBirth.
    const shaped = customers.map((c) => {
        const age = Math.floor(
            (Date.now() - c.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        return {
            id: c._id,
            firstName: c.firstName,
            lastName: c.lastName,
            gender: c.gender,
            age,
            city: c.city,
            maritalStatus: c.maritalStatus,
            journeyStatus: c.journeyStatus,
        };
    });

    return res.json({ customers: shaped });
}