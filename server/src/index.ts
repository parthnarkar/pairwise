import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import matchmakerRoutes from './routes/matchmakerRoutes';
import customerRoutes from './routes/customerRoutes';

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_URL?.split(',') ?? '*',
        credentials: true,
    })
);
app.use(express.json({ limit: '1mb' }));

// Health check (useful for smoke-testing deployments)
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/matchmakers', matchmakerRoutes);
app.use('/api/customers', customerRoutes);

// Error handler MUST be last
app.use(errorHandler);

// Vercel serverless handler (also usable as a plain function)
const handler = async (req: any, res: any) => {
    await connectDB();
    return app(req, res);
};

export { app, handler };
export default handler;