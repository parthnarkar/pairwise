import mongoose, { Schema, model } from 'mongoose';

export interface IMatchmaker extends mongoose.Document {
    name: string;
    email: string;
    passwordHash: string;
    assignedRegion: string;
    createdAt: Date;
    updatedAt: Date;
}

const MatchmakerSchema = new Schema<IMatchmaker>(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: { type: String, required: true, select: false },
        assignedRegion: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

export const Matchmaker = model<IMatchmaker>('Matchmaker', MatchmakerSchema);