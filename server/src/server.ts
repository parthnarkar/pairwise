import 'dotenv/config';
import { app } from './index';
import { connectDB } from './config/db';

const PORT = Number(process.env.PORT) || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server running: http://localhost:${PORT}`);
            console.log(`   Health check:  http://localhost:${PORT}/api/health`);
        });
    })
    .catch((err) => {
        console.error('❌ DB connection failed:', err);
        process.exit(1);
    });