import 'dotenv/config';
import { app } from './index';
import { connectDB } from './config/db';
import { warmUpAI } from './services/aiService';
import { logger } from './utils/logger';

const PORT = Number(process.env.PORT) || 5000;

connectDB()
    .then(async () => {
        app.listen(PORT, () => {
            logger.info(`Server running: http://localhost:${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/api/health`);
        });
        // Warm the AI model in the background — don't block the listen()
        warmUpAI().catch(() => { });
    })
    .catch((err) => {
        logger.error('DB connection failed', err);
        process.exit(1);
    });