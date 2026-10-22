import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { verifyToken } from '../services/tokenService';
import { Matchmaker } from '../models';

// Augment Express.Request with `matchmakerId`
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            matchmakerId?: string;
        }
    }
}

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or malformed token' });
        }
        const token = header.slice(7);
        const { sub } = verifyToken(token);

        if (!mongoose.isValidObjectId(sub)) {
            return res.status(401).json({ error: 'Invalid token subject' });
        }

        // Confirm the matchmaker still exists
        const exists = await Matchmaker.exists({ _id: sub });
        if (!exists) {
            return res.status(401).json({ error: 'Matchmaker not found' });
        }

        req.matchmakerId = sub;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}