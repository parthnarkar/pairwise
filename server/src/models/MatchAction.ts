import mongoose, { Schema, model } from 'mongoose';

export type MatchStatus = 'Suggested' | 'Sent' | 'Accepted' | 'Rejected';

export interface IMatchAction extends mongoose.Document {
    customerId: mongoose.Types.ObjectId;
    candidateId: mongoose.Types.ObjectId;
    matchmakerId: mongoose.Types.ObjectId;
    compatibilityScore: number;
    matchRationale: string;
    personalizedIntro?: string;
    status: MatchStatus;
    sentAt?: Date;
    revokeNote?: string;
    clientMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MatchActionSchema = new Schema<IMatchAction>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
            index: true,
        },
        candidateId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
            index: true,
        },
        matchmakerId: {
            type: Schema.Types.ObjectId,
            ref: 'Matchmaker',
            required: true,
            index: true,
        },
        compatibilityScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        matchRationale: { type: String, required: true, trim: true },
        personalizedIntro: { type: String, trim: true },
        status: {
            type: String,
            enum: ['Suggested', 'Sent', 'Accepted', 'Rejected'],
            default: 'Sent',
            index: true,
        },
        sentAt: { type: Date },
        revokeNote: { type: String, trim: true, maxlength: 2000 },
        clientMessage: { type: String, trim: true, maxlength: 2000 },
    },
    { timestamps: true }
);

// Prevent duplicate actions for the same (customer, candidate) pair — belt-and-suspenders
// guard for the duplicate-check in the Send Match workflow (Phase 5).
MatchActionSchema.index({ customerId: 1, candidateId: 1 }, { unique: true });

export const MatchAction = model<IMatchAction>(
    'MatchAction',
    MatchActionSchema
);