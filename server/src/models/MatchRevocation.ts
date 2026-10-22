import mongoose, { Schema, model } from 'mongoose';

export interface IMatchRevocation extends mongoose.Document {
    matchActionId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    candidateId: mongoose.Types.ObjectId;
    matchmakerId: mongoose.Types.ObjectId;
    compatibilityScore: number;
    matchRationale: string;
    personalizedIntro?: string;
    sentAt?: Date;
    revokeNote?: string;
    clientMessage?: string;
    createdAt: Date;
}

const MatchRevocationSchema = new Schema<IMatchRevocation>(
    {
        matchActionId: { type: Schema.Types.ObjectId, required: true, index: true },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
            index: true,
        },
        candidateId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        matchmakerId: {
            type: Schema.Types.ObjectId,
            ref: 'Matchmaker',
            required: true,
            index: true,
        },
        compatibilityScore: { type: Number, required: true, min: 0, max: 100 },
        matchRationale: { type: String, required: true },
        personalizedIntro: { type: String, trim: true },
        sentAt: { type: Date },
        revokeNote: { type: String, trim: true, maxlength: 2000 },
        clientMessage: { type: String, trim: true, maxlength: 2000 },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const MatchRevocation = model<IMatchRevocation>(
    'MatchRevocation',
    MatchRevocationSchema
);
