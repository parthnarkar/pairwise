import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
    EngineCustomer,
    ScoreBreakdown,
    MatchLabel,
} from './matchingEngine';
import { getAge } from './matchingEngine';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const RAW_TIMEOUT = Number(process.env.AI_TIMEOUT_MS) || 12000;
const TIMEOUT_MS = Math.max(2000, Math.min(RAW_TIMEOUT, 20000)); // clamp 2s..20s

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI | null {
    if (!API_KEY) return null;
    if (!client) client = new GoogleGenerativeAI(API_KEY);
    return client;
}

export interface AIRationale {
    rationale: string;
    personalizedIntro: string;
}

const SYSTEM_PROMPT = `You are a senior professional matchmaker at The Date Crew, India's premium matrimonial concierge. Write warm, specific, professional rationales that help a matchmaker explain a match to their client. Never use superlatives like "perfect" or "ideal". Never mention caste, community, or religion unless explicitly in "Key strengths". Always reference concrete biodata facts.`;

function summarize(c: EngineCustomer) {
    const age = getAge(c.dateOfBirth);
    const inc = c.profession.income;
    const band =
        inc >= 10000000 ? '1Cr+'
            : inc >= 5000000 ? '50L+'
                : inc >= 2000000 ? '20L+'
                    : inc >= 1000000 ? '10L+'
                        : 'under 10L';

    return {
        name: `${c.firstName} ${c.lastName}`,
        age,
        city: c.city,
        height_cm: c.height,
        marital_status: c.maritalStatus,
        education: `${c.education.degree}, ${c.education.undergraduateCollege}`,
        profession: `${c.profession.designation} at ${c.profession.currentCompany}`,
        income_band_inr: band,
        diet: c.lifestyle.diet,
        drinking: c.lifestyle.drinking,
        smoking: c.lifestyle.smoking,
        want_kids: c.preferences.wantKids,
        open_to_relocate: c.preferences.openToRelocate,
        open_to_pets: c.preferences.openToPets,
    };
}

function breakdownHighlights(b: ScoreBreakdown): string[] {
    const h: string[] = [];
    if (b.age >= 12) h.push('age alignment');
    if (b.height >= 8) h.push('physical compatibility');
    if (b.income >= 15) h.push('socioeconomic alignment');
    if (b.location >= 12) h.push('shared location');
    if (b.kids >= 12) h.push('matching views on children');
    if (b.lifestyle >= 10) h.push('lifestyle compatibility');
    if (b.education >= 8) h.push('educational alignment');
    return h;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('AI_TIMEOUT')), ms)
        ),
    ]);
}

export async function generateRationale(
    customer: EngineCustomer,
    candidate: EngineCustomer,
    score: number,
    label: MatchLabel,
    breakdown: ScoreBreakdown
): Promise<AIRationale | null> {
    const c = getClient();
    if (!c) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[aiService] GEMINI_API_KEY not set — using fallback');
        }
        return null;
    }

    const highlights = breakdownHighlights(breakdown);
    const userPrompt = `Client we are matching for:
${JSON.stringify(summarize(customer), null, 2)}

Suggested candidate:
${JSON.stringify(summarize(candidate), null, 2)}

Compatibility score: ${score}/100 (${label})
Key strengths: ${highlights.join(', ') || 'general compatibility'}

Return STRICT JSON ONLY (no markdown fences, no preamble):
{
  "rationale": "2 sentences explaining why this is a strong match, from the matchmaker's analytical perspective",
  "personalizedIntro": "3 sentences the matchmaker would say to the client introducing this candidate, addressed to the client in second person"
}`;

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

    try {
        const model = c.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 400,
                responseMimeType: 'application/json',
            },
        });

        const result = await withTimeout(model.generateContent(fullPrompt), TIMEOUT_MS);
        const raw = result.response.text().trim();
        // Defensive: strip markdown fences if present
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(cleaned);

        if (
            typeof parsed?.rationale !== 'string' ||
            typeof parsed?.personalizedIntro !== 'string'
        ) {
            return null;
        }

        return {
            rationale: parsed.rationale.slice(0, 600),
            personalizedIntro: parsed.personalizedIntro.slice(0, 1200),
        };
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[aiService] fallback —', (err as Error).message);
        }
        return null;
    }
}

/**
 * Fire-and-forget warm-up. Call once at server boot so the first real
 * Find Matches request doesn't pay the model cold-start cost (~3-6s).
 * Failures are silent.
 */
export async function warmUpAI(): Promise<void> {
    const c = getClient();
    if (!c) return;
    try {
        const model = c.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0,
                maxOutputTokens: 8,
                responseMimeType: 'application/json',
            },
        });
        await model.generateContent('Return {"ok":true}');
        if (process.env.NODE_ENV !== 'production') {
            console.log('[aiService] warmed up');
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[aiService] warm-up failed —', (err as Error).message);
        }
    }
}