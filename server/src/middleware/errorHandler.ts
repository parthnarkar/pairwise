import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    logger.error(`${_req.method} ${_req.originalUrl} -> ${status}`, err);
    res.status(status).json({ error: message });
}