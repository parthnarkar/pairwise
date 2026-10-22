import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import morgan from 'morgan';
import chalk from 'chalk';

import authRoutes from './routes/authRoutes';
import matchmakerRoutes from './routes/matchmakerRoutes';
import customerRoutes from './routes/customerRoutes';
import matchRoutes from './routes/matchRoutes';

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_URL?.split(',') ?? '*',
        credentials: true,
    })
);
app.use(express.json({ limit: '1mb' }));

function colorStatus(status: number): string {
    if (status >= 500) return chalk.red.bold(status.toString());
    if (status >= 400) return chalk.yellow.bold(status.toString());
    if (status >= 300) return chalk.cyan(status.toString());
    return chalk.green.bold(status.toString());
}

function colorMethod(method: string): string {
    switch (method) {
        case 'GET': return chalk.blue.bold(method);
        case 'POST': return chalk.green.bold(method);
        case 'PATCH': return chalk.yellow.bold(method);
        case 'PUT': return chalk.magenta.bold(method);
        case 'DELETE': return chalk.red.bold(method);
        default: return chalk.white.bold(method);
    }
}

function colorDuration(ms: number): string {
    if (ms >= 1000) return chalk.red(`${ms}ms`);
    if (ms >= 300) return chalk.yellow(`${ms}ms`);
    if (ms >= 100) return chalk.gray(`${ms}ms`);
    return chalk.green(`${ms}ms`);
}

// Record a matchmakerId at response time (set by requireAuth earlier)
morgan.token('mid', (req: any) => {
    const id: string | undefined = req.matchmakerId;
    if (!id) return chalk.gray('anon');
    return chalk.gray(id.slice(0, 6) + '…');
});

// Record the numeric status so we can color it
morgan.token('statusNum', (_req, res) => String(res.statusCode));

if (process.env.NODE_ENV !== 'production') {
    app.use(
        morgan((tokens, req, res) => {
            const method = colorMethod(tokens.method(req, res) || 'GET');
            const url = chalk.white(tokens.url(req, res) || '');
            const statusNum = Number(tokens.statusNum(req, res) || 0);
            const status = colorStatus(statusNum);
            const durationRaw = tokens['response-time'](req, res) || '0';
            const duration = colorDuration(Number(durationRaw));

            return [
                method,
                url,
                status,
                chalk.gray(`(${duration})`),
            ].join(' ');
        }, {
            skip: (req) => req.url === '/api/health',
        })
    );
} else {
    // Production (Vercel): single-line JSON — parseable by log drains
    app.use(
        morgan('combined', {
            skip: (req) => req.url === '/api/health',
        })
    );
}

// Health check (useful for smoke-testing deployments)
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/matchmakers', matchmakerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/matches', matchRoutes);

// Error handler MUST be last
app.use(errorHandler);

// Vercel serverless handler (also usable as a plain function)
const handler = async (req: any, res: any) => {
    await connectDB();
    return app(req, res);
};

export { app, handler };
export default handler;