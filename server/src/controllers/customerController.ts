import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Customer, Matchmaker } from '../models';

// ---------- helpers ------------------------------------------------------

function ageFromDOB(dob: Date): number {
    return Math.floor(
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
}

const JOURNEY_STATUSES = [
    'Onboarding',
    'Active Search',
    'Matching',
    'Dates Planned',
    'Paused',
    'Success',
] as const;

const GENDERS = ['Male', 'Female', 'Other'] as const;

// ---------- GET /api/customers ------------------------------------------

const listQuerySchema = z.object({
    q: z.string().trim().max(100).optional(),
    status: z.enum(JOURNEY_STATUSES).optional(),
    gender: z.enum(GENDERS).optional(),
    city: z.string().trim().max(60).optional(),
    sort: z
        .enum(['recent', 'name', 'age_asc', 'age_desc'])
        .optional()
        .default('recent'),
});

export async function listMyCustomers(req: Request, res: Response) {
    const matchmakerId = req.matchmakerId!;

    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid query params', details: parsed.error.flatten() });
    }
    const { q, status, gender, city, sort } = parsed.data;

    // Base scope: only this matchmaker's assigned customers
    const filter: Record<string, unknown> = { assignedMatchmaker: matchmakerId };

    if (status) filter.journeyStatus = status;
    if (gender) filter.gender = gender;
    if (city) filter.city = city;

    if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ firstName: rx }, { lastName: rx }];
    }

    let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'name') sortSpec = { firstName: 1, lastName: 1 };
    else if (sort === 'age_asc') sortSpec = { dateOfBirth: -1 }; // older DOB = higher age
    else if (sort === 'age_desc') sortSpec = { dateOfBirth: 1 }; // younger DOB = lower age

    const docs = await Customer.find(filter)
        .select(
            'firstName lastName gender dateOfBirth city maritalStatus journeyStatus updatedAt'
        )
        .sort(sortSpec)
        .lean();

    const customers = docs.map((c: any) => ({
        id: c._id,
        firstName: c.firstName,
        lastName: c.lastName,
        gender: c.gender,
        age: ageFromDOB(c.dateOfBirth),
        city: c.city,
        maritalStatus: c.maritalStatus,
        journeyStatus: c.journeyStatus,
        updatedAt: c.updatedAt,
    }));

    return res.json({ customers });
}

// ---------- GET /api/customers/:id --------------------------------------

export async function getCustomerDetail(req: Request, res: Response) {
    const { id } = req.params;
    const matchmakerId = req.matchmakerId!;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await Customer.findOne({
        _id: id,
        assignedMatchmaker: matchmakerId, // isolation guard
    })
        .populate({ path: 'notes.author', select: 'name email' })
        .lean();

    if (!customer) {
        // 404 not 403 — never leak that another matchmaker owns this record
        return res.status(404).json({ error: 'Customer not found' });
    }

    const shaped = {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        gender: customer.gender,
        age: ageFromDOB(customer.dateOfBirth),
        dateOfBirth: customer.dateOfBirth,
        country: customer.country,
        city: customer.city,
        height: customer.height,
        email: customer.email,
        phone: customer.phone,
        education: customer.education,
        profession: customer.profession,
        maritalStatus: customer.maritalStatus,
        languagesKnown: customer.languagesKnown,
        siblings: customer.siblings,
        background: customer.background,
        lifestyle: customer.lifestyle,
        preferences: customer.preferences,
        journeyStatus: customer.journeyStatus,
        notes: (customer.notes || []).map((n: any) => ({
            author: n.author
                ? { id: n.author._id, name: n.author.name, email: n.author.email }
                : { id: null, name: 'Unknown', email: '' },
            text: n.text,
            createdAt: n.createdAt,
        })),
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };

    return res.json({ customer: shaped });
}

// ---------- PATCH /api/customers/:id/status -----------------------------

const patchStatusSchema = z.object({
    journeyStatus: z.enum(JOURNEY_STATUSES),
});

export async function updateJourneyStatus(req: Request, res: Response) {
    const { id } = req.params;
    const matchmakerId = req.matchmakerId!;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    const parsed = patchStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid status', details: parsed.error.flatten() });
    }

    const updated = await Customer.findOneAndUpdate(
        { _id: id, assignedMatchmaker: matchmakerId },
        { $set: { journeyStatus: parsed.data.journeyStatus } },
        { new: true, projection: 'journeyStatus' }
    );

    if (!updated) return res.status(404).json({ error: 'Customer not found' });

    return res.json({ journeyStatus: updated.journeyStatus });
}

// ---------- POST /api/customers/:id/notes -------------------------------

const addNoteSchema = z.object({
    text: z.string().trim().min(1).max(4000),
});

export async function addNote(req: Request, res: Response) {
    const { id } = req.params;
    const matchmakerId = req.matchmakerId!;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    const parsed = addNoteSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid note', details: parsed.error.flatten() });
    }

    const note = {
        author: new mongoose.Types.ObjectId(matchmakerId),
        text: parsed.data.text,
        createdAt: new Date(),
    };

    const updated = await Customer.findOneAndUpdate(
        { _id: id, assignedMatchmaker: matchmakerId },
        { $push: { notes: note } },
        { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Customer not found' });

    // Resolve author name for the response
    const author = await Matchmaker.findById(matchmakerId).select('name email');

    return res.status(201).json({
        note: {
            author: {
                id: author?._id,
                name: author?.name || 'Unknown',
                email: author?.email || '',
            },
            text: note.text,
            createdAt: note.createdAt,
        },
    });
}

// ---------- GET /api/customers/meta/cities ------------------------------

export async function listMyCities(req: Request, res: Response) {
    const matchmakerId = req.matchmakerId!;
    const cities = await Customer.distinct('city', {
        assignedMatchmaker: matchmakerId,
    });
    return res.json({ cities: (cities as string[]).sort() });
}