import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    throw new Error('JWT_SECRET is not defined in environment');
}

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface TokenPayload {
    sub: string; // matchmaker _id
}

export function signToken(matchmakerId: string): string {
    return jwt.sign({ sub: matchmakerId }, SECRET as string, {
        expiresIn: EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
}

export function verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, SECRET as string);
    if (typeof decoded === 'string' || !decoded.sub) {
        throw new Error('Invalid token payload');
    }
    return { sub: String(decoded.sub) };
}