import mongoose, { Schema, model } from 'mongoose';

export interface IMatchRevocation extends mongoose.Document {
    matchActionId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    candidateId: mongoose.Types.ObjectId;
    matchmakerId: mongoose.Types.ObjectId;
    revokeNote?: string;
    clientMessage?: string;
    createdAt: Date;
}

const MatchRevocationSchema = new Schema<IMatchRevocation>(
    {
        matchActionId: { type: Schema.Types.ObjectId, required: true, index: true },
        customerId: { type: Schema.Types.ObjectId, required: true, index: true },
        candidateId: { type: Schema.Types.ObjectId, required: true },
        matchmakerId: { type: Schema.Types.ObjectId, required: true, index: true },
        revokeNote: { type: String, trim: true, maxlength: 2000 },
        clientMessage: { type: String, trim: true, maxlength: 2000 },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const MatchRevocation = model<IMatchRevocation>(
    'MatchRevocation',
    MatchRevocationSchema
);
