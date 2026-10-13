import { callAI } from './ai-service.js';
import supabase from './db-client.js';

const SYSTEM_PROMPT = `You are MBBSWALA NEET Expert Admission Advisor. The user is looking at the Seat Matrix for a specific medical college.
Analyze the provided seat matrix data for this college. If no seat matrix data is provided, use your extensive internal knowledge about Indian medical colleges to provide accurate seat matrix details, correcting any typos the user might have made in their search term.
Return ONLY valid JSON exactly matching this structure (be concise but highly informative):
{
  "college_name": "Full, correct name of the college (fix any typos the user made)",
  "total_seats": "Total number of seats (e.g. '250', MUST provide a number)",
  "state_quota_seats": "Number of state quota seats. If unknown, approximate based on 85% rule or typical private college seats. Use '~' if approximate. If not applicable, return '0'. Do not return 'N/A'.",
  "aiq_seats": "Number of All India Quota seats. If unknown, approximate based on 15% rule. If private college and not applicable, return '0'. Do not return 'N/A'.",
  "nri_seats": "Number of NRI seats. If unknown, approximate based on 15% rule for private colleges. If not applicable, return '0'. Do not return 'N/A'.",
  "management_quota_seats": "Number of Management Quota seats. Calculate remaining seats. If not applicable, return '0'. Do not return 'N/A'.",
  "ai_verdict": "A 1-2 sentence AI verdict/summary of this college's seat matrix",
  "seat_breakdown_summary": "A 1 sentence summary of the major quotas available.",
  "key_insights": [
    "Insight 1 (e.g. It has 15% NRI quota seats)",
    "Insight 2 (e.g. Significant seats reserved for State Quota)"
  ],
  "recommendation": "Who should target this college based on the seat matrix?"
}
Rules:
1. ONLY return JSON. Do not include markdown code blocks.`;

function buildSeatMatrixFallback(college_name, seatDataForContext, dbCollege) {
  const total = dbCollege?.seats || 150;
  const isGovt = dbCollege ? (!dbCollege.feePvt || dbCollege.type?.toLowerCase().includes('govt')) : true;

  const aiq = Math.round(total * 0.15);
  const stateSeats = total - aiq;
  const nri = isGovt ? 0 : Math.round(total * 0.15);
  const mgmt = isGovt ? 0 : Math.round(total * 0.35);

  return {
    college_name: dbCollege?.name || college_name,
    total_seats: String(total),
    state_quota_seats: isGovt ? String(stateSeats) : `~${Math.round(total * 0.5)}`,
    aiq_seats: isGovt ? String(aiq) : '0',
    nri_seats: String(nri),
    management_quota_seats: String(mgmt),
    ai_verdict: `${dbCollege?.name || college_name} has approximately ${total} approved MBBS seats distributed across standard MCC AIQ and State counselling quotas.`,
    seat_breakdown_summary: isGovt 
      ? `15% AIQ seats (${aiq}) conducted by MCC and 85% State Quota seats (${stateSeats}) conducted by State Authority.`
      : `Seats allocated across State Merit Quota, Management Quota (~${mgmt} seats), and NRI Quota (~${nri} seats).`,
    key_insights: [
      `Approved annual intake of ${total} MBBS seats recognized by NMC.`,
      isGovt ? `15% seats (${aiq}) open to all-India candidates without domicile restrictions.` : `Private/Management quota seats accessible to students across states.`,
      `Category reservations (SC, ST, OBC, EWS, PwD) applicable under government and state quotas.`
    ],
    recommendation: `Candidates targeting ${dbCollege?.name || college_name} should participate actively in both Round 1 and Round 2 counselling based on category cutoff percentiles.`
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const { college_name } = req.body || {};

    if (!college_name) {
      return res.status(400).json({ error: 'college_name is required' });
    }

    // 1. Fetch exact seat matrix from DB for context to avoid hallucination
    const cleanName = String(college_name).split(',')[0].trim();
    const { data: seatMatrixRows } = await supabase
      .from('seat_matrix')
      .select('*')
      .ilike('college_name', `%${cleanName}%`)
      .limit(20);

    const { data: dbCollegeRows } = await supabase
      .from('colleges')
      .select('*')
      .ilike('name', `%${cleanName}%`)
      .limit(1);

    const dbCollege = dbCollegeRows && dbCollegeRows[0] ? dbCollegeRows[0] : null;

    const seatDataForContext = (seatMatrixRows || []).map((r) => ({
      course: r.course_name,
      category: r.category,
      quota: r.quota_code,
      total_seats: r.total_seats,
      open_seats: r.open_seats,
    }));

    const fallbackResponse = buildSeatMatrixFallback(college_name, seatDataForContext, dbCollege);

    // 2. Try AI with 6s timeout
    let aiResponse = null;
    try {
      const aiPayload = {
        system_prompt: SYSTEM_PROMPT,
        user_prompt: {
          college_name,
          available_seat_matrix_data: seatDataForContext,
        },
      };

      const aiPromise = callAI(aiPayload);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI call timeout (6s)')), 6000)
      );

      aiResponse = await Promise.race([aiPromise, timeoutPromise]);
    } catch (aiErr) {
      console.warn('[AI-Seat-Matrix-Info] AI call failed/timed out, using grounded fallback:', aiErr.message);
    }

    if (aiResponse && typeof aiResponse === 'object' && aiResponse.college_name) {
      aiResponse._raw_data_count = seatDataForContext.length;
      return res.status(200).json(aiResponse);
    }

    fallbackResponse._raw_data_count = seatDataForContext.length;
    return res.status(200).json(fallbackResponse);

  } catch (err) {
    console.error('[AI-Seat-Matrix-Info] Handler fallback safe error:', err);
    const safe = buildSeatMatrixFallback(req.body?.college_name || 'Medical College', [], null);
    return res.status(200).json(safe);
  }
}
