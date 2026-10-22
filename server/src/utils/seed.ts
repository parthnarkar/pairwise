import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']); // Google + Cloudflare DNS

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from '../config/db';
import { Matchmaker } from '../models/Matchmaker';
import { Customer } from '../models/Customer';
import { MatchAction } from '../models/MatchAction';

import {
    maleFirstNames,
    femaleFirstNames,
    lastNames,
    cities,
    religions,
    castes,
    languages,
    tier1Colleges,
    tier2Colleges,
    degrees,
    companies,
    maleProfessions,
    femaleProfessions,
} from './seedData';

// ---------- helpers ------------------------------------------------------

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
const pickN = <T>(arr: T[], n: number): T[] => {
    const copy = [...arr];
    const out: T[] = [];
    while (out.length < n && copy.length) {
        out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    }
    return out;
};
const ageToDOB = (age: number): Date => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - age);
    d.setMonth(randInt(0, 11));
    d.setDate(randInt(1, 28));
    return d;
};

// ---------- 10 hand-authored test customers ------------------------------

type SeedCustomer = Record<string, any>;

const makeTestCustomer = (
    overrides: SeedCustomer
): SeedCustomer => {
    const dob = ageToDOB(overrides.age);
    delete overrides.age;
    return {
        country: 'India',
        siblings: 1,
        languagesKnown: ['English', 'Hindi'],
        lifestyle: {
            drinking: 'Socially',
            smoking: 'Never',
            diet: 'Vegetarian',
        },
        journeyStatus: 'Active Search',
        ...overrides,
        dateOfBirth: dob,
        notes: [],
    };
};

const buildTestCustomers = () => [
    // ----- 5 Male -----
    makeTestCustomer({
        firstName: 'Arjun',
        lastName: 'Mehta',
        gender: 'Male',
        age: 32,
        city: 'Mumbai',
        height: 178,
        email: 'arjun.mehta@example.com',
        phone: '+91 9820011111',
        education: { undergraduateCollege: 'IIT Bombay', degree: 'B.Tech' },
        profession: {
            currentCompany: 'Google India',
            designation: 'Senior Software Engineer',
            income: 4500000,
        },
        maritalStatus: 'Never Married',
        background: { religion: 'Hindu' },
        lifestyle: { drinking: 'Socially', smoking: 'Never', diet: 'Non-Vegetarian' },
        preferences: {
            wantKids: 'Yes',
            openToRelocate: 'Maybe',
            openToPets: 'Yes',
            minAge: 26,
            maxAge: 32,
        },
    }),
    makeTestCustomer({
        firstName: 'Rohan',
        lastName: 'Kapoor',
        gender: 'Male',
        age: 29,
        city: 'Bengaluru',
        height: 174,
        email: 'rohan.kapoor@example.com',
        phone: '+91 9845022222',
        education: { undergraduateCollege: 'BITS Pilani', degree: 'B.E.' },
        profession: {
            currentCompany: 'Flipkart',
            designation: 'Product Manager',
            income: 3200000,
        },
        maritalStatus: 'Never Married',
        background: { religion: 'Hindu' },
        lifestyle: { drinking: 'Socially', smoking: 'Never', diet: 'Vegetarian' },
        preferences: {
            wantKids: 'Maybe',
            openToRelocate: 'Yes',
            openToPets: 'Yes',
            minAge: 25,
            maxAge: 30,
        },
    }),
    makeTestCustomer({
        firstName: 'Vikram',
        lastName: 'Iyer',
        gender: 'Male',
        age: 35,
        city: 'Delhi',
        height: 180,
        email: 'vikram.iyer@example.com',
        phone: '+91 9811033333',
        education: { undergraduateCollege: 'IIM Ahmedabad', degree: 'MBA' },
        profession: {
            currentCompany: 'Goldman Sachs',
            designation: 'Investment Banker',
            income: 8000000,
        },
        maritalStatus: 'Divorced',
        background: { religion: 'Hindu' },
        lifestyle: { drinking: 'Socially', smoking: 'Never', diet: 'Non-Vegetarian' },
        preferences: {
            wantKids: 'Yes',
            openToRelocate: 'Maybe',
            openToPets: 'No',
            minAge: 28,
            maxAge: 36,
        },
    }),
    makeTestCustomer({
        firstName: 'Karan',
        lastName: 'Singh',
        gender: 'Male',
        age: 27,
        city: 'Pune',
        height: 172,
        email: 'karan.singh@example.com',
        phone: '+91 9822044444',
        education: {
            undergraduateCollege: 'Pune University',
            degree: 'B.Tech',
        },
        profession: {
            currentCompany: 'Freelance',
            designation: 'Founder & CEO',
            income: 1800000,
        },
        maritalStatus: 'Never Married',
        background: { religion: 'Sikh' },
        lifestyle: { drinking: 'Never', smoking: 'Never', diet: 'Vegetarian' },
        preferences: {
            wantKids: 'Maybe',
            openToRelocate: 'Yes',
            openToPets: 'Yes',
            minAge: 23,
            maxAge: 29,
        },
    }),
    makeTestCustomer({
        firstName: 'Aditya',
        lastName: 'Reddy',
        gender: 'Male',
        age: 34,
        city: 'Mumbai',
        height: 176,
        email: 'aditya.reddy@example.com',
        phone: '+91 9820055555',
        education: { undergraduateCollege: 'AIIMS Delhi', degree: 'MD' },
        profession: {
            currentCompany: 'Apollo Hospitals',
            designation: 'Doctor',
            income: 6000000,
        },
        maritalStatus: 'Widowed',
        background: { religion: 'Hindu' },
        lifestyle: { drinking: 'Never', smoking: 'Never', diet: 'Vegetarian' },
        preferences: {
            wantKids: 'Yes',
            openToRelocate: 'Maybe',
            openToPets: 'Maybe',
            minAge: 28,
            maxAge: 36,
        },
    }),

    // ----- 5 Female -----
    makeTestCustomer({
        firstName: 'Priya',
        lastName: 'Sharma',
        gender: 'Female',
        age: 28,
        city: 'Mumbai',
        height: 162,
        email: 'priya.sharma@example.com',
        phone: '+91 9820066666',
        education: {
            undergraduateCollege: 'St. Xavier\u2019s Mumbai',
            degree: 'B.Com',
        },
        profession: {
            currentCompany: 'HUL',
            designation: 'Marketing Manager',
            income: 2200000,
        },
        maritalStatus: 'Never Married',
        background: { religion: 'Hindu' },
        lifestyle: { drinking: 'Socially', smoking: 'Never', diet: 'Vegetarian' },
        preferences: {
            wantKids: 'Yes',
            openToRelocate: 'Maybe',
            openToPets: 'Yes',
            minAge: 28,
            maxAge: 35,
        },
    }),
    makeTestCustomer({
        firstName: 'Ananya',
        lastName: 'Nair',
        gender: 'Female',
        age: 31,
        city: 'Bengaluru',
        height: 165,
        email: 'ananya.nair@example.com',
        phone: '+91 9845077777',
        education: { undergraduateCollege: 'NID Ahmedabad', degree: 'B.Des' },
        profession: {
            currentCompany: 'Google India',
            designation: 'UX Designer',
            income: 3500000,
        },
        maritalStatus: 'Never Married',
        background: { religion: 'Hindu' },
        lifestyle: { drinking: 'Socially', smoking: 'Never', diet: 'Non-Vegetarian' },
        preferences: {
            wantKids: 'Maybe',
            openToRelocate: 'Yes',
            openToPets: 'Yes',
            minAge: 29,
            maxAge: 36,
        },
    }),
    makeTestCustomer({
        firstName: 'Sneha',
        lastName: 'Patel',
        gender: 'Female',
        age: 26,
        city: 'Pune',
        height: 158,
        email: 'sneha.patel@example.com',
        phone: '+91 9822088888',
        education: {
            undergraduateCollege: 'Symbiosis Pune',
            degree: 'CA',
        },
        profession: {
            currentCompany: 'Deloitte',
            designation: 'Chartered Accountant',
            income: 1200000,
        },
        maritalStatus: 'Never Married',
        background: { religion: 'Hindu' },
        lifestyle: { drinking: 'Never', smoking: 'Never', diet: 'Vegetarian' },
        preferences: {
            wantKids: 'Yes',
            openToRelocate: 'No',
            openToPets: 'Maybe',
            minAge: 26,
            maxAge: 32,
        },
    }),
    makeTestCustomer({
        firstName: 'Divya',
        lastName: 'Menon',
        gender: 'Female',
        age: 33,
        city: 'Delhi',
        height: 168,
        email: 'divya.menon@example.com',
        phone: '+91 9811099999',
        education: { undergraduateCollege: 'NLU Delhi', degree: 'LLB' },
        profession: {
            currentCompany: 'AZB & Partners',
            designation: 'Corporate Lawyer',
            income: 4500000,
        },
        maritalStatus: 'Divorced',
        background: { religion: 'Christian' },
        lifestyle: { drinking: 'Socially', smoking: 'Never', diet: 'Non-Vegetarian' },
        preferences: {
            wantKids: 'Maybe',
            openToRelocate: 'Maybe',
            openToPets: 'Yes',
            minAge: 30,
            maxAge: 40,
        },
    }),
    makeTestCustomer({
        firstName: 'Riya',
        lastName: 'Kulkarni',
        gender: 'Female',
        age: 30,
        city: 'Mumbai',
        height: 160,
        email: 'riya.kulkarni@example.com',
        phone: '+91 9820010101',
        education: { undergraduateCollege: 'KEM Mumbai', degree: 'MBBS' },
        profession: {
            currentCompany: 'Lilavati Hospital',
            designation: 'Doctor',
            income: 4000000,
        },
        maritalStatus: 'Never Married',
        background: { religion: 'Hindu' },
        lifestyle: { drinking: 'Never', smoking: 'Never', diet: 'Vegetarian' },
        preferences: {
            wantKids: 'Yes',
            openToRelocate: 'Maybe',
            openToPets: 'Yes',
            minAge: 30,
            maxAge: 38,
        },
    }),
];

// ---------- synthetic candidate generator -------------------------------

const buildCandidate = (
    gender: 'Male' | 'Female',
    index: number
): SeedCustomer => {
    const firstName = pick(
        gender === 'Male' ? maleFirstNames : femaleFirstNames
    );
    const lastName = pick(lastNames);
    const age = randInt(23, 36);
    const height = gender === 'Male' ? randInt(165, 190) : randInt(150, 175);
    const incomeLPA = gender === 'Male' ? randInt(6, 60) : randInt(4, 40);
    const useTier1 = Math.random() < 0.35;
    const college = useTier1 ? pick(tier1Colleges) : pick(tier2Colleges);
    const degree = pick(degrees);
    const designation = pick(
        gender === 'Male' ? maleProfessions : femaleProfessions
    );
    const religion = pick(religions);
    const maritalStatus = pick([
        'Never Married',
        'Never Married',
        'Never Married',
        'Never Married',
        'Divorced',
    ]) as 'Never Married' | 'Divorced';

    return {
        firstName,
        lastName,
        gender,
        dateOfBirth: ageToDOB(age),
        country: 'India',
        city: pick(cities),
        height,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@example.com`,
        phone: `+91 9${randInt(100000000, 999999999)}`,
        education: { undergraduateCollege: college, degree },
        profession: {
            currentCompany: pick(companies),
            designation,
            income: incomeLPA * 100000,
        },
        maritalStatus,
        languagesKnown: pickN(languages, randInt(2, 4)),
        siblings: randInt(0, 3),
        background: {
            religion,
            ...(Math.random() < 0.3 ? { caste: pick(castes) } : {}),
        },
        lifestyle: {
            drinking: pick(['Never', 'Never', 'Socially', 'Socially', 'Regularly']),
            smoking: pick(['Never', 'Never', 'Never', 'Socially']),
            diet: pick(['Vegetarian', 'Non-Vegetarian', 'Eggetarian']),
        },
        preferences: {
            wantKids: pick(['Yes', 'Yes', 'Maybe', 'No']),
            openToRelocate: pick(['Yes', 'Maybe', 'No']),
            openToPets: pick(['Yes', 'Maybe', 'No']),
            minAge: Math.max(21, age - randInt(2, 5)),
            maxAge: age + randInt(2, 5),
            preferredReligions: Math.random() < 0.5 ? [religion] : [],
        },
        journeyStatus: 'Onboarding',
        // Intentionally no assignedMatchmaker — candidates are a shared pool
        notes: [],
    };
};

// ---------- runner -------------------------------------------------------

async function seed() {
    await connectDB();
    console.log('🔌 Connected to MongoDB');

    console.log('🗑  Clearing existing collections...');
    await Promise.all([
        Matchmaker.deleteMany({}),
        Customer.deleteMany({}),
        MatchAction.deleteMany({}),
    ]);

    // ----- 1 matchmaker -----
    const passwordPlain =
        process.env.SEED_MATCHMAKER_PASSWORD || 'TDC@2026';
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const matchmaker = await Matchmaker.create({
        name: 'Neha Bhatia',
        email: 'matchmaker@thedatecrew.com',
        passwordHash,
        assignedRegion: 'West India (Mumbai / Pune)',
    });
    console.log(
        `👤 Matchmaker: ${matchmaker.email}  |  password: ${passwordPlain}`
    );

    // ----- 10 test customers (assigned to the demo matchmaker) -----
    const testCustomers = buildTestCustomers().map((c) => ({
        ...c,
        assignedMatchmaker: matchmaker._id,
    }));
    await Customer.insertMany(testCustomers);
    console.log(`🧑‍💼 Inserted ${testCustomers.length} assigned test customers`);

    // ----- 120 candidate profiles (60F + 60M, unassigned) -----
    const candidates: SeedCustomer[] = [];
    for (let i = 1; i <= 60; i++) candidates.push(buildCandidate('Female', i));
    for (let i = 1; i <= 60; i++) candidates.push(buildCandidate('Male', i));
    await Customer.insertMany(candidates);
    console.log(`👥 Inserted ${candidates.length} candidate profiles (60F, 60M)`);

    const totalCustomers = await Customer.countDocuments();
    const assigned = await Customer.countDocuments({
        assignedMatchmaker: matchmaker._id,
    });
    const unassigned = totalCustomers - assigned;

    console.log('\n✅ Seed complete');
    console.log('──────────────────────────────────────');
    console.log(`   Matchmakers : 1`);
    console.log(`   Customers   : ${totalCustomers} total`);
    console.log(`                 ${assigned} assigned (dashboard)`);
    console.log(`                 ${unassigned} candidate pool (matching)`);
    console.log('──────────────────────────────────────');
    console.log('\n🔑 Login credentials');
    console.log(`   ${matchmaker.email}  /  ${passwordPlain}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});