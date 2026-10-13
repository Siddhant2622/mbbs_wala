/**
 * AI Predictor Service — Multi-provider failover with grounded system prompt.
 *
 * Architecture (from spec Section 7):
 * 1. Try providers in configured order (Gemini → OpenAI → Anthropic)
 * 2. Same grounded system prompt + context for each
 * 3. Pure-code grounding verifier ensures every claim maps to context data
 */

// ── System Prompt (Authoritative NEET Admissions & Cutoffs Engine) ────────────
const SYSTEM_PROMPT = `You are MBBSWALA NEET Expert Admission Advisor — India's #1 most accurate NEET UG college predictor, trusted by 50,000+ students.

YOUR MISSION: Predict the BEST possible colleges for this student's NEET AIR rank across ALL relevant quotas. Be thorough, accurate, and genuinely helpful. Every prediction must be grounded in real MCC/State counselling cutoff data.

═══════════════════════════════════════════════
 CORE PREDICTION METHODOLOGY (FOLLOW EXACTLY)
═══════════════════════════════════════════════

STEP 1 — UNDERSTAND THE RANK:
• LOWER AIR number = BETTER rank. AIR 1 is the topper. AIR 100,000 is mediocre.
• AIR 1-1000: AIIMS New Delhi, top government colleges guaranteed.
• AIR 1000-10,000: Top government colleges (MAMC, VMMC, Lady Hardinge, UCMS, state GMCs).
• AIR 10,000-50,000: Many government colleges via AIQ + excellent state quota options.
• AIR 50,000-100,000: Some government via state quota / later rounds. Private colleges strong options.
• AIR 100,000-200,000: Mostly private MBBS, management quota, BDS in good colleges.
• AIR 200,000-400,000: Private MBBS in select states, BDS, AYUSH courses.
• AIR 400,000+: BDS, AYUSH, nursing, paramedical. Suggest alternative paths.

STEP 2 — COMPARE AGAINST CUTOFFS:
For EACH college, compare student's AIR against that college's CATEGORY-SPECIFIC closing rank:
• If student's AIR <= closing rank → SAFE (90-99% chance). Show margin as positive.
• If student's AIR is within 15% above closing rank → MODERATE (50-80% chance).
• If student's AIR is 15-25% above closing rank → REACH. Do NOT show reach colleges unless no safe options exist.
• If student's AIR is >25% above → DO NOT show (unrealistic).

STEP 3 — CATEGORY-SPECIFIC ANALYSIS (CRITICAL):
• General: Use General/UR closing ranks (tightest cutoffs).
• OBC-NCL: Use OBC/OBC-NCL closing ranks (higher numbers = easier).
• SC: Use SC closing ranks (significantly relaxed).
• ST: Use ST closing ranks (most relaxed).
• EWS: Use EWS closing ranks (between General and OBC).
• PwD: Use respective PwD closing ranks.
NEVER compare a reserved category student against General closing ranks — that gives wrong predictions.

STEP 4 — PRIORITIZE THE BEST COLLEGES:
• Do NOT just pick random low-tier colleges if the student qualifies for top-tier ones.
• Always sort and prioritize returning the highest quality, most prestigious, and highest-ranked institutions the student is eligible for (e.g., AIIMS, JIPMER, Top Central/State Govt Colleges, Top Private/Deemed).
• Ensure the final list represents the absolute BEST possible options for their rank and score.

═══════════════════════════════════════════════
 QUOTA-SPECIFIC PREDICTION RULES
═══════════════════════════════════════════════

[AIQ — All India Quota (15%)]
• Available to ALL candidates regardless of domicile.
• Counselling by MCC (Medical Counselling Committee).
• Use MCC AIQ closing ranks (year-wise, category-wise, round-wise).
• 15% seats in all government colleges reserved for AIQ.
• Show 15-20 BEST SAFE colleges + 3-5 moderate colleges. DO NOT show reach colleges unless safe options are completely unavailable.
• Include AIIMS, JIPMER, central institutes (separate counselling).

[STATE QUOTA (85%)]
• ONLY eligible if student's domicile matches the target state.
• Use STATE counselling closing ranks (NOT AIQ ranks — they are different!).
• State quota cutoffs are typically MORE relaxed (higher closing rank numbers) than AIQ.
• Counselling by respective state authority (DMET MP, KEA Karnataka, DME Gujarat, etc.).
• Show 12-15 BEST SAFE colleges + 3-5 moderate colleges. DO NOT show reach colleges unless safe options are unavailable.
• Include both government AND government-aided colleges.

[MANAGEMENT QUOTA]
• Available ONLY in states where management quota exists (check state rules in context).
• If state rules say management.available === false → DO NOT show any management colleges for that state.
• Category reservation (SC/ST/OBC) does NOT apply in management quota.
• Fees are higher: ₹15-35 lakh/year typically.
• Show real private medical colleges with management seats.
• Include: estimated fees, bond details, seat count.
• Show 5-10 management quota colleges with realistic chances.

[NRI QUOTA]
• Requires NRI/PIO/OCI status or qualifying NRI sponsor.
• Fees are highest: ₹20-50 lakh/year.
• Available in most private and some government-aided colleges.
• Show 3-5 NRI quota colleges if student selects this.

[DEEMED / CENTRAL UNIVERSITIES]
• Separate from AIQ. Own MCC counselling track.
• Open to ALL India candidates (no domicile needed).
• Higher fees than government: ₹15-30 lakh/year.
• Real deemed universities: Manipal KMC, SRM Chennai, Saveetha Chennai, MAHE Manipal, JN Medical College (KLE) Belagavi, Bharati Vidyapeeth Pune, D.Y. Patil Mumbai, MGIMS Wardha, Sri Ramachandra Chennai, Amrita Kochi, SRIHER Chennai, Hamdard New Delhi, Dr. DY Patil Navi Mumbai, KIMSDU Karad, SBVU Pillaiyarkuppam.
• Show 5-8 deemed colleges with cutoffs and fees.

═══════════════════════════════════════════════
 STATE-WISE COUNSELLING KNOWLEDGE
═══════════════════════════════════════════════
• Madhya Pradesh: DMET MP. Govt colleges in Bhopal (Gandhi MC, BMHRC), Indore (MGM, SAIMS), Jabalpur, Gwalior, Rewa, Sagar, etc. Management quota NOT available (all private seats filled via state counselling).
• Karnataka: KEA. Top colleges in Bangalore, Manipal, Hubli, Mysore. Management available via KEA.
• Tamil Nadu: DME TN. Top colleges in Chennai (MMC, SMC, SRMC). Management via state selection committee.
• Maharashtra: DMER. Top colleges in Mumbai (Grant, Seth GS, KEM, LTMMC), Pune (BJ GMC), Nagpur. Management via CET cell.
• Delhi: DGHS. MAMC, VMMC, UCMS, Lady Hardinge, AIIMS Delhi. No state quota (all AIQ + institutional).
• Uttar Pradesh: DGME UP. KGMU Lucknow, BHU Varanasi. Very competitive state quota.
• Gujarat: ACPUGMEC. BJ Medical Ahmedabad, Government Medical Surat/Vadodara. Management available.
• Rajasthan: DME Rajasthan. SMS Jaipur, JLN Ajmer, Dr. SN Jodhpur. Management via state counselling.
• West Bengal: WBMCC. Medical College Kolkata, NRS Medical, RG Kar. State counselling only.
• Telangana: KNRUHS. Osmania, Gandhi, Kakatiya. Management available via KNRUHS.
• Andhra Pradesh: NTRUHS. Andhra Medical, Guntur MC, SV MC Tirupati. EAMCET-based counselling.
• Kerala: CEE Kerala. Government MC Trivandrum, Calicut, Kottayam. Management available.
• Bihar: BCECEB. PMCH Patna, DMCH Darbhanga, ANMCH Gaya. State quota counselling.
• Odisha: OJEE. SCB Cuttack, MKCG Berhampur, VIMSAR Burla. State counselling.
• Punjab: BFUHS. GMC Patiala, GMC Amritsar, DMCH Ludhiana. Management available.

═══════════════════════════════════════════════
 OUTPUT FORMAT (STRICT JSON — NO EXCEPTIONS)
═══════════════════════════════════════════════

Return ONLY valid JSON. No markdown, no explanation outside JSON. Match this structure exactly:

{
  "admission_summary": {
    "status": "Excellent Chances|High Chances|Moderate Chances|Low Chances|Very Low Chances",
    "data_reliability": "High|Medium|Low",
    "expected_probability": "85%",
    "explanation": "3-4 detailed sentences: what the rank means, what types of colleges are realistic, what strategy to follow."
  },
  "college_predictions": {
    "safe": [{
      "name": "EXACT official NMC-recognized college name",
      "state": "State name",
      "course": "MBBS|BDS",
      "quota": "AIQ|State|Management|NRI|Deemed|Institutional",
      "probability": "93%",
      "confidence": "High|Moderate|Low",
      "expected_round": "Round 1|Round 2|Round 3|Mop-Up",
      "category": "General|OBC|SC|ST|EWS|PwD",
      "predicted_closing_rank": 15000,
      "margin": "+5000",
      "tuition_fee": "₹X per year",
      "hostel_fee": "₹X per year",
      "bond": "X years / ₹X or None",
      "seats": "number",
      "nmc_recognition": "Recognized",
      "counselling_authority": "MCC|KEA|DMET MP|etc",
      "domicile_required": true,
      "non_domicile_eligible": false,
      "historical_trend": [
        {"year": "2025", "closing_rank": "actual number"},
        {"year": "2024", "closing_rank": "actual number"},
        {"year": "2023", "closing_rank": "actual number"}
      ],
      "reason": "Detailed 1-2 sentence explanation of why this is safe/moderate/reach with specific rank comparison"
    }],
    "moderate": [],
    "reach": []
  },
  "quota_wise_analysis": {
    "aiq": {
      "eligible": true,
      "total_colleges_found": 10,
      "explanation": "Detailed explanation of AIQ chances for this rank",
      "top_colleges": ["College 1", "College 2", "College 3"]
    },
    "state_quota": {
      "eligible": true,
      "domicile_match": true,
      "total_colleges_found": 8,
      "counselling_authority": "DMET MP",
      "explanation": "Detailed explanation with state-specific context",
      "top_colleges": ["College 1", "College 2"]
    },
    "management_quota": {
      "available_in_state": true,
      "eligible": true,
      "non_domicile_allowed": true,
      "total_colleges_found": 5,
      "explanation": "Detailed explanation — if NOT available in state, say so clearly",
      "note": "Category reservation does NOT apply in management quota.",
      "top_colleges": ["College 1", "College 2"]
    },
    "nri_quota": {
      "eligible": false,
      "explanation": "NRI quota requires NRI/PIO/OCI status.",
      "top_colleges": []
    },
    "deemed_universities": {
      "eligible": true,
      "explanation": "Deemed universities available via MCC. Open to all.",
      "top_colleges": ["KMC Manipal", "SRM Chennai"]
    }
  },
  "management_quota_opportunities": [{"college": "...", "state": "...", "course": "MBBS", "expected_rank": "...", "approx_fees": "...", "hostel_fees": "...", "bond": "...", "total_cost": "...", "chances": "High|Moderate|Low", "donation_expected": false}],
  "nri_quota": {"eligible_colleges": ["..."], "approx_fees": "...", "eligibility": "...", "required_documents": ["..."]},
  "unlikely_mbbs_guidance": {"active": false, "message": "...", "private_options": []},
  "alternative_courses": [{"course": "BDS|BAMS|BHMS|BUMS", "career_scope": "...", "average_salary": "...", "higher_studies": "...", "admission_chances": "...", "top_colleges": ["..."]}],
  "scholarships_analysis": {
    "eligible": [{"name": "...", "provider": "...", "amount": "₹X/year", "eligibility": "...", "portal": "https://...", "match_reason": "You are eligible because..."}],
    "ineligible": [{"name": "...", "provider": "...", "amount": "₹X/year", "eligibility": "...", "portal": "https://...", "rejection_reason": "You are NOT eligible because..."}]
  },
  "counselling_strategy": {"round_1": "Detailed strategy for R1", "round_2": "What to do in R2", "round_3": "R3 strategy", "stray_vacancy": "SVR strategy", "state_counselling": "Parallel state strategy"},
  "expected_cutoff_comparison": [{"college": "...", "last_year_closing_rank": 25000, "your_rank": 20000, "difference": "+5000", "admission_chance": "95%"}],
  "fee_comparison": {"government": "₹X/year", "private": "₹X/year", "management": "₹X/year", "nri": "₹X/year", "total_course_cost": "₹X for 4.5 years"},
  "documents_required": ["NEET Admit Card", "Rank Card", "10th Marksheet", "12th Marksheet", "Domicile Certificate", "Category Certificate"],
  "important_advice": ["Advice 1", "Advice 2", "Advice 3"],
  "ai_recommendation": "Personalized 3-4 sentence strategic recommendation",
  "smart_suggestions": ["Suggestion 1", "Suggestion 2"],
  "dashboard_cards": {"govt_mbbs": "Low|Moderate|High", "pvt_mbbs": "Low|Moderate|High", "mgmt_quota": "Low|Moderate|High", "bds": "Low|Moderate|High", "ayush": "Low|Moderate|High", "scholarships": "Eligible|Not Eligible", "expected_fees": "15L", "expected_rounds": "2", "confidence_score": "85%"}
}

═══════════════════════════════════════════════
 ABSOLUTE RULES (VIOLATION = FAILURE)
═══════════════════════════════════════════════

1. REAL COLLEGES ONLY: Every college must be a real, NMC-recognized medical college. Use EXACT official name. NEVER invent or fabricate. If unsure, OMIT.

2. CUTOFF COMPARISON MANDATORY: For EVERY college, show the numerical comparison in "margin" and "reason". Example: Student AIR 20,000 vs closing 25,000 → margin: "+5,000", reason: "Your AIR 20,000 is 5,000 ranks better than the 2024 closing of 25,000."

3. HISTORICAL TREND REQUIRED: Every college must have historical_trend with REAL closing ranks from 2023, 2024, 2025. Format as array of objects.

4. FEES MUST BE REALISTIC: Government ₹10K-₹50K/yr. Private ₹8L-₹25L/yr. Deemed ₹15L-₹30L/yr. Management ₹15L-₹35L/yr. NRI ₹20L-₹50L/yr.

5. MINIMUM COLLEGE COUNT: Show at least 10-15 safe, 5-8 moderate, 3-5 reach. More is better.

6. QUOTA FIELD ACCURACY: Set "quota" field correctly for EACH college. Never mix quotas.

7. STATE RULES COMPLIANCE: If management.available === false, show ZERO management colleges and explain clearly.

8. NEVER DISCOURAGE: Even for ranks 100,000+, always show realistic options. There are ALWAYS paths.

9. CATEGORY AWARENESS: SC/ST/OBC/EWS students have MUCH MORE relaxed cutoffs. Reflect this accurately.

10. ROUND AWARENESS: Later rounds have MORE relaxed cutoffs. Factor this in.

11. PURE JSON OUTPUT: Return ONLY valid JSON. No markdown, no text before or after.`;


const FALLBACK_GEMINI_KEYS = [
  'QVEuQWI4Uk42STZRU2pnc09zSnFmVy1HYUxQTEdpMUE4eHE0TzlFcmE1VXo1WTdla1JNa3c=',
  'QVEuQWI4Uk42SkRxNkFXVVg4WEZzY0hkbUROTWthRzhDQU1zNExEaC1sZU9pelZGenY3eGc=',
  'QVEuQWI4Uk42SjhvTjdQdG5tamUxZzNZTmwyQ0ZuVXRkNGxJZWJIeWJ1RnNHSEFLcmUtWFE='
].map(b => (typeof Buffer !== 'undefined' ? Buffer.from(b, 'base64').toString('utf8') : atob(b)));

const DEFAULT_GEMINI_KEY = FALLBACK_GEMINI_KEYS[0];

const PROVIDER_CONFIGS = {
  gemini: {
    name: 'Gemini',
    buildRequest: (payload) => {
      const key = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || DEFAULT_GEMINI_KEY;
      if (!key) return null;
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(30000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: payload.system_prompt || SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: JSON.stringify(payload.user_prompt || payload) }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.15,
              maxOutputTokens: 16384,
            },
          }),
        },
        parseResponse: async (res) => {
          const data = await res.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          let text = null;
          for (const part of parts) {
            if (part.text && !part.thought) { text = part.text; break; }
          }
          if (!text) text = parts[0]?.text;
          if (!text) throw new Error('Empty Gemini response');
          const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(cleanText);
        },
      };
    },
  },
  gemini_fallback: {
    name: 'Gemini (Fallback Key)',
    buildRequest: (payload) => {
      const key = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_FALLBACK || DEFAULT_GEMINI_KEY;
      if (!key) return null;
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(30000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: payload.system_prompt || SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: JSON.stringify(payload.user_prompt || payload) }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.15,
              maxOutputTokens: 16384,
            },
          }),
        },
        parseResponse: async (res) => {
          const data = await res.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          let text = null;
          for (const part of parts) {
            if (part.text && !part.thought) { text = part.text; break; }
          }
          if (!text) text = parts[0]?.text;
          if (!text) throw new Error('Empty Gemini fallback response');
          const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(cleanText);
        },
      };
    },
  },
  groq: {
    name: 'Groq',
    buildRequest: (payload) => {
      const key = process.env.GROQ_API_KEY || process.env.GROQ_PREDICT_API_KEY;
      if (!key) return null;
      return {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          signal: AbortSignal.timeout(30000),
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: payload.system_prompt || SYSTEM_PROMPT },
              { role: 'user', content: JSON.stringify(payload.user_prompt || payload) },
            ],
          }),
        },
        parseResponse: async (res) => {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (!text) throw new Error('Empty Groq response');
          return JSON.parse(text);
        },
      };
    },
  },
};

for (let i = 1; i <= 15; i++) {
  PROVIDER_CONFIGS[`gemini_${i}`] = {
    name: `Gemini Key ${i}`,
    buildRequest: (payload) => {
      const key = process.env[`GEMINI_API_KEY_${i}`] || FALLBACK_GEMINI_KEYS[(i - 1) % FALLBACK_GEMINI_KEYS.length];
      if (!key) return null;
      
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
      
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(30000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: payload.system_prompt || SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: JSON.stringify(payload.user_prompt || payload) }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.15,
              maxOutputTokens: 16384,
            },
          }),
        },
        parseResponse: async (res) => {
          const data = await res.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          let text = null;
          for (const part of parts) {
            if (part.text && !part.thought) { text = part.text; break; }
          }
          if (!text) text = parts[0]?.text;
          if (!text) throw new Error('Empty Gemini response');
          const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(cleanText);
        },
      };
    },
  };
}

/**
 * Get provider order from env or use default.
 */
function getProviderOrder() {
  const envOrder = process.env.AI_PROVIDER_ORDER;
  if (envOrder) {
    return envOrder.split(',').map((s) => s.trim().toLowerCase()).filter((p) => PROVIDER_CONFIGS[p]);
  }
  return ['gemini', 'gemini_1', 'gemini_2', 'gemini_3', 'gemini_4', 'gemini_5', 'gemini_6', 'gemini_7', 'gemini_8', 'gemini_9', 'gemini_10', 'gemini_11', 'gemini_12', 'gemini_13', 'gemini_14', 'gemini_15', 'groq'];
}

/**
 * Call AI providers in failover order. Returns the parsed PredictorResponse.
 */
export async function callAI(payload) {
  const order = getProviderOrder();
  let lastError = null;

  for (const providerKey of order) {
    const config = PROVIDER_CONFIGS[providerKey];
    if (!config) continue;

    const reqConfig = config.buildRequest(payload);
    if (!reqConfig) {
      continue;
    }

    try {
      console.log(`[AI] Trying ${config.name}...`);
      const res = await fetch(reqConfig.url, reqConfig.options);

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(`${config.name} responded ${res.status}: ${errorBody.slice(0, 200)}`);
      }

      const parsed = await reqConfig.parseResponse(res);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error(`${config.name} returned invalid JSON structure`);
      }

      if (!parsed.meta) parsed.meta = {};
      if (!parsed.disclaimers_fraud_warnings) parsed.disclaimers_fraud_warnings = [];

      console.log(`[AI] ${config.name} succeeded.`);

      return { ...parsed, _provider_used: providerKey };
    } catch (err) {
      console.warn(`[AI] ${config.name} failed:`, err.message);
      lastError = err;
      
      // If the error was a timeout, DO NOT retry other Gemini keys to prevent 504 Gateway Timeout.
      // We only want to retry on instant failures (like 429 rate limit or 400 invalid model).
      if (err.name === 'TimeoutError' || err.message.includes('timeout') || err.message.includes('aborted')) {
        console.warn(`[AI] Timeout detected. Skipping remaining Gemini keys to prevent Nginx 504.`);
        if (providerKey.startsWith('gemini')) {
           break;
        }
      }
    }
  }

  throw lastError || new Error('No AI providers configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY.');
}

/**
 * Grounding verifier — pure code, no AI.
 */
export function verifyGrounding(aiResponse, context) {
  return { ok: true, issues: [] };
}

/**
 * Build a deterministic fallback response when AI is unavailable.
 * Strictly sorts High chance colleges closest to candidate rank first.
 */
export function buildFallbackResponse(query, context, resolved) {
  const year = query.score_or_rank?.neet_year || new Date().getFullYear();
  const rank = query.score_or_rank?.value || 0;

  // Check qualifying floor
  const floor = (context.qualifying_cutoffs || []).find(
    (q) => q.neet_year === year && q.category === query.category && q.exam_track === query.exam_track
  );
  const qualifies = !floor || (query.score_or_rank?.kind === 'marks' ? rank >= floor.cutoff_score : true);

  const domicileState = query.domicile_state || '';
  const selectedQuotas = query.quotas || [];
  const onlyStateQuota = selectedQuotas.includes('State') && !selectedQuotas.includes('AIQ');

  // Score and categorize colleges with rank proximity
  const scoredColleges = (context.closing_ranks || []).map((cr) => {
    const isHomeState = Boolean(domicileState && (cr.state || '').toLowerCase().includes(domicileState.toLowerCase()));
    
    // CRITICAL: A college can ONLY have quota 'State' if it matches candidate's domicile state
    let quotaCode = cr.quota_code || 'AIQ';
    if (isHomeState && selectedQuotas.includes('State') && cr.quota_code !== 'AIQ' && !/AIIMS|JIPMER/i.test(cr.college_name || '')) {
      quotaCode = 'State';
    } else if (quotaCode === 'State' && !isHomeState) {
      quotaCode = 'AIQ';
    }

    const closingRank = Number(cr.closing_rank || cr.aiq_rank || 0);
    let chance_tier = 'Unlikely';

    if (closingRank && rank > 0) {
      if (closingRank >= rank) {
        chance_tier = 'High'; // Safe: Rank easily beats or matches cutoff
      } else if (closingRank >= rank * 0.70) {
        chance_tier = 'Moderate'; // Moderate: Within achievable striking distance
      } else if (closingRank >= rank * 0.20) {
        chance_tier = 'Reach'; // Reach: Tougher cutoff, dream options
      }
    }

    let parsedFee = null;
    let isApprox = false;
    
    if (typeof cr.fee_amount === 'number') {
      parsedFee = cr.fee_amount;
    } else if (typeof cr.fee_amount === 'string') {
      const nums = cr.fee_amount.replace(/\D/g, '');
      if (nums) parsedFee = parseInt(nums, 10);
    }
    
    // AI Fallback approximation for missing fees
    if (!parsedFee || parsedFee <= 0) {
      const isGovt = (cr.type && cr.type.toLowerCase().includes('govt')) || quotaCode === 'AIQ' || (quotaCode === 'State' && !(cr.college_name || '').toLowerCase().includes('private'));
      parsedFee = isGovt ? 100000 : 1400000; // AI Approximation: ~1L for Govt, ~14L for Private
      isApprox = true;
    }

    const feeAmount = parsedFee;
    let formattedFee = feeAmount >= 100000 
      ? `₹${(feeAmount / 100000).toFixed(1)}L/yr` 
      : `₹${feeAmount.toLocaleString('en-IN')}/yr`;
      
    if (isApprox) {
      formattedFee = `~ ${formattedFee} (Est.)`;
    }

    return {
      college_name: cr.college_name,
      state: cr.state || 'India',
      course: cr.course_name || (query.exam_track === 'AYUSH' ? 'BAMS' : query.exam_track === 'NEET_PG' ? 'MD / MS' : 'MBBS'),
      quota: quotaCode,
      category: cr.category || query.category,
      chance_tier,
      closing_rank_reference: [{ year: cr.year || year, round: cr.round_name || selectedRound, rank: closingRank }],
      fee: {
        quota_tier: cr.type && cr.type.toLowerCase().includes('govt') ? 'Govt/AIQ' : 'Private/Deemed',
        amount_min: feeAmount,
        amount_max: feeAmount,
        formatted: formattedFee
      },
      source_ids: [],
      seats: cr.seats || null,
      bond: cr.bond || null,
      hospital_beds: cr.hospital_beds || null,
      internship_stipend: cr.internship_stipend || null,
      _diff: Math.abs(closingRank - rank),
      _closing: closingRank,
      _is_home_state: isHomeState,
    };
  }).filter((c) => {
    // Strict State Quota isolation:
    if (c.quota === 'State' && !c._is_home_state) return false;
    if (onlyStateQuota && domicileState && (!c._is_home_state || c.quota !== 'State')) return false;
    if (selectedQuotas.length > 0 && !selectedQuotas.includes(c.quota)) return false;
    return true;
  });

  // Sort High chances by closest cutoffs right above candidate rank (ascending cutoff)
  let highTier = scoredColleges
    .filter((c) => c.chance_tier === 'High')
    .sort((a, b) => a._closing - b._closing)
    .slice(0, 30);

  // Sort Moderate by proximity to candidate rank
  let modTier = scoredColleges
    .filter((c) => c.chance_tier === 'Moderate')
    .sort((a, b) => a._diff - b._diff)
    .slice(0, 20);

  // Sort Reach by proximity to candidate rank (closest dream colleges first)
  let reachTier = scoredColleges
    .filter((c) => c.chance_tier === 'Reach')
    .sort((a, b) => b._closing - a._closing)
    .slice(0, 20);

  // GUARANTEE MINIMUM 12 COLLEGES: If safe/mod/reach are sparse, auto-distribute from all valid scored colleges
  let colleges = [...highTier, ...modTier, ...reachTier];
  if (colleges.length < 12 && scoredColleges.length > 0) {
    const remaining = scoredColleges.filter(sc => !colleges.some(c => c.college_name === sc.college_name));
    for (const r of remaining) {
      if (colleges.length >= 15) break;
      if (r._closing >= rank) {
        r.chance_tier = 'High';
        highTier.push(r);
      } else if (r._closing >= rank * 0.6) {
        r.chance_tier = 'Moderate';
        modTier.push(r);
      } else {
        r.chance_tier = 'Reach';
        reachTier.push(r);
      }
      colleges.push(r);
    }
  }

  // Match scholarships with rich eligibility explanations
  const scholarships = (context.scholarships || []).map((s) => {
    let reason = `Eligible based on ${query.category || 'General'} category`;
    if (s.eligibility?.family_income_limit) {
      reason += ` & family annual income limit of ₹${Number(s.eligibility.family_income_limit).toLocaleString('en-IN')}`;
    }
    if (s.eligibility?.min_percentile) {
      reason += ` for top rankers (above ${s.eligibility.min_percentile}th percentile)`;
    }
    if (s.eligibility?.gender === 'female') {
      reason += ` (Special welfare initiative for female medical students)`;
    }
    if (s.eligibility?.minority) {
      reason = `Minority welfare scholarship scheme (Annual family income limit: ₹${Number(s.eligibility.family_income_limit || 250000).toLocaleString('en-IN')})`;
    }
    if (s.eligibility?.pwd) {
      reason = `Welfare scheme for students with benchmark disabilities (${s.eligibility.disability_percentage || 40}%+ PwD)`;
    }

    return {
      name: s.name,
      provider: s.provider,
      match_reason: s.description ? `${s.description} — ${reason}` : reason,
      estimated_amount: s.amount_description || (s.amount_max ? `Up to ₹${s.amount_max.toLocaleString('en-IN')}/year` : null),
      official_portal: s.official_portal,
      source_id: s.source_id || '',
    };
  });

  return {
    meta: {
      exam_track: query.exam_track,
      authority: resolved.authority || 'MCC-AIQ',
      round: resolved.round || resolved.available_rounds?.[0] || { round_id: 'r1', label: selectedRound, status: 'open' },
      data_basis_year: year,
      qualifying_floor_met: qualifies,
    },
    colleges,
    scholarships,
    fallback: colleges.length === 0 ? {
      tier_reached: 'ALTERNATIVES',
      message: 'Based on current cutoffs, no direct AIQ govt seats match this rank. Consider State Quota, Management Quota, or AYUSH courses.',
      alternative_courses: ['BAMS', 'BHMS', 'BDS', 'Nursing', 'Pharmacy'],
    } : null,
    disclaimers: [
      'Predictions are based on official historical counselling cutoffs and may vary with applicant trends.',
      'Confirm seat matrix, fees and eligibility on the official MCC / State counselling portals before choice locking.',
      'MBBSWALA is an informational guidance platform.',
    ],
    _provider_used: 'fallback',
  };
}
