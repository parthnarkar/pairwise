import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Matchmaker } from '../models';
import { signToken } from '../services/tokenService';

const loginSchema = z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
        return res
            .status(400)
            .json({ error: 'Invalid input', details: parse.error.flatten() });
    }

    const { email, password } = parse.data;

    // `+passwordHash` because schema has select:false
    const matchmaker = await Matchmaker.findOne({ email }).select(
        '+passwordHash'
    );

    // Generic error for both missing user and bad password
    if (!matchmaker) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, matchmaker.passwordHash);
    if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(matchmaker._id.toString());

    return res.json({
        token,
        matchmaker: {
            id: matchmaker._id,
            name: matchmaker.name,
            email: matchmaker.email,
            assignedRegion: matchmaker.assignedRegion,
        },
    });
}