import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';

interface Cache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Persist across Vercel serverless invocations
const globalAny = global as unknown as { _mongoCache?: Cache };
const cached: Cache = globalAny._mongoCache ?? { conn: null, promise: null };
globalAny._mongoCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;

    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not defined');

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 8000,
            maxPoolSize: 10,
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}