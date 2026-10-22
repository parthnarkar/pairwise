import mongoose, { Schema, model } from 'mongoose';

export type Gender = 'Male' | 'Female' | 'Other';
export type TriState = 'Yes' | 'No' | 'Maybe';
export type MaritalStatus = 'Never Married' | 'Divorced' | 'Widowed';
export type JourneyStatus =
    | 'Onboarding'
    | 'Active Search'
    | 'Matching'
    | 'Dates Planned'
    | 'Paused'
    | 'Success';
export type LifestyleHabit = 'Never' | 'Socially' | 'Regularly';
export type Diet = 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';

export interface INote {
    author: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
}

export interface ICustomer extends mongoose.Document {
    firstName: string;
    lastName: string;
    gender: Gender;
    dateOfBirth: Date;
    country: string;
    city: string;
    height: number; // cm
    email: string;
    phone: string;
    education: {
        undergraduateCollege: string;
        degree: string;
    };
    profession: {
        currentCompany: string;
        designation: string;
        income: number; // annual INR
    };
    maritalStatus: MaritalStatus;
    languagesKnown: string[];
    siblings: number;
    background: {
        religion?: string;
        caste?: string;
    };
    lifestyle: {
        drinking: LifestyleHabit;
        smoking: LifestyleHabit;
        diet: Diet;
    };
    preferences: {
        wantKids: TriState;
        openToRelocate: TriState;
        openToPets: TriState;
        minAge?: number;
        maxAge?: number;
        preferredReligions?: string[];
    };
    journeyStatus: JourneyStatus;
    assignedMatchmaker?: mongoose.Types.ObjectId | null;
    notes: INote[];
    age?: number; // virtual
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
    {
        author: { type: Schema.Types.ObjectId, ref: 'Matchmaker', required: true },
        text: { type: String, required: true, trim: true, maxlength: 4000 },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true,
            index: true,
        },
        dateOfBirth: { type: Date, required: true },
        country: { type: String, required: true, default: 'India', trim: true },
        city: { type: String, required: true, trim: true, index: true },
        height: { type: Number, required: true, min: 100, max: 220 }, // cm
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, required: true, trim: true },

        education: {
            undergraduateCollege: { type: String, required: true, trim: true },
            degree: { type: String, required: true, trim: true },
        },
        profession: {
            currentCompany: { type: String, required: true, trim: true },
            designation: { type: String, required: true, trim: true },
            income: { type: Number, required: true, min: 0 }, // annual INR
        },
        maritalStatus: {
            type: String,
            enum: ['Never Married', 'Divorced', 'Widowed'],
            required: true,
        },
        languagesKnown: [{ type: String, trim: true }],
        siblings: { type: Number, default: 0, min: 0, max: 20 },

        background: {
            religion: { type: String, trim: true },
            caste: { type: String, trim: true },
        },
        lifestyle: {
            drinking: {
                type: String,
                enum: ['Never', 'Socially', 'Regularly'],
                default: 'Never',
            },
            smoking: {
                type: String,
                enum: ['Never', 'Socially', 'Regularly'],
                default: 'Never',
            },
            diet: {
                type: String,
                enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'],
                default: 'Vegetarian',
            },
        },
        preferences: {
            wantKids: { type: String, enum: ['Yes', 'No', 'Maybe'], required: true },
            openToRelocate: {
                type: String,
                enum: ['Yes', 'No', 'Maybe'],
                required: true,
            },
            openToPets: { type: String, enum: ['Yes', 'No', 'Maybe'], required: true },
            minAge: { type: Number, min: 18, max: 100 },
            maxAge: { type: Number, min: 18, max: 100 },
            preferredReligions: [{ type: String, trim: true }],
        },
        journeyStatus: {
            type: String,
            enum: [
                'Onboarding',
                'Active Search',
                'Matching',
                'Dates Planned',
                'Paused',
                'Success',
            ],
            default: 'Onboarding',
            index: true,
        },
        assignedMatchmaker: {
            type: Schema.Types.ObjectId,
            ref: 'Matchmaker',
            default: null,
            index: true,
        },
        notes: { type: [NoteSchema], default: [] },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Derived age — computed fresh from DOB on every serialization
CustomerSchema.virtual('age').get(function (this: ICustomer) {
    if (!this.dateOfBirth) return undefined;
    const ms = Date.now() - this.dateOfBirth.getTime();
    return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
});

// Compound index that serves the matching hard-filter (gender + city + DOB)
CustomerSchema.index({ gender: 1, city: 1, dateOfBirth: 1 });

export const Customer = model<ICustomer>('Customer', CustomerSchema);