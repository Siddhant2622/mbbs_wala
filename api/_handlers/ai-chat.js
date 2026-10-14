/**
 * /api/ai-chat — AI Assistant Chat Endpoint
 *
 * Routes conversational chat to Gemini with multi-key and model failovers,
 * strict Gemini role alternating formatting, and graceful local fallbacks.
 */
import supabase from './db-client.js';

const SYSTEM_PROMPT = `You are the expert NEET-UG & AYUSH Medical College Admissions Advisor for MBBSWALA.
You are chatting directly with students who need guidance on medical colleges, cutoffs, counseling, and the admission process.
Your goal is to provide accurate, helpful, and concise answers based on your extensive knowledge of Indian medical admissions (MBBS, BDS, BAMS, BHMS, etc.).

Rules:
1. Always be polite, encouraging, and professional.
2. If the user asks for college recommendations based on their rank, but their student profile context says their rank is "Not provided", explicitly tell them: "I don't see your NEET rank in your profile yet! You can either tell me your rank right now, or go to the Profile page to update your details."
3. When asked about cutoffs for specific colleges or states, provide your best accurate estimate based on historical NEET UG data (2023/2024 trends).
4. If the user asks about predicting their chances, recommend they also use the "College Predictor" tool on the MBBSWALA platform for real-time personalized data.
5. If they ask about saving colleges, mention they can "Star" colleges in the College Finder.
6. Keep your answers relatively concise and easy to read (use bullet points if needed).
7. Do not use overly complex markdown, but bolding and simple lists are fine.
`;

const FALLBACK_GEMINI_KEYS = [
  'QVEuQWI4Uk42STZRU2pnc09zSnFmVy1HYUxQTEdpMUE4eHE0TzlFcmE1VXo1WTdla1JNa3c=',
  'QUl6YVN5REM2M2hzQjZhc00wRDRUM3d1X2gyNEM3VnA4WXNBVEpz',
  'QVEuQWI4Uk42SkRxNkFXVVg4WEZzY0hkbUROTWthRzhDQU1zNExEaC1sZU9pelZGenY3eGc=',
  'QVEuQWI4Uk42S1RWYWQtaDBXUU9uQWZ3YXE1dU5yTEE5aE9DYjZIUkp2NDVVYzhTUXpjaGc=',
  'QVEuQWI4Uk42SjhvTjdQdG5tamUxZzNZTmwyQ0ZuVXRkNGxJZWJIeWJ1RnNHSEFLcmUtWFE=',
  'QVEuQWI4Uk42SVRsWEtINXk3cnFvbFI3clVBcXpOXzJoU3htSC1BdzVWRG1sMzhTbTEwQlE=',
  'QVEuQWI4Uk42THZFSmsxV0pjMVJDcWFDbW03NWpiVXZ3d1dEQnpVeHBDZ2hTOHdTYU1uNHc='
].map(b => (typeof Buffer !== 'undefined' ? Buffer.from(b, 'base64').toString('utf8') : atob(b)));

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];

function getProviderOrder() {
  const envOrder = process.env.AI_PROVIDER_ORDER;
  if (envOrder) {
    return envOrder.split(',').map((s) => s.trim().toLowerCase());
  }
  // Only 3 priority keys — each gets maximum retry time
  return [
    'gemini',
    'gemini_2', // Standard AIza key first for high reliability
    'gemini_1',
    'groq'
  ];
}

function formatGeminiContents(messages) {
  const contents = [];
  for (const msg of messages) {
    if (!msg || typeof msg.text !== 'string' || !msg.text.trim()) continue;
    const role = msg.role === 'assistant' ? 'model' : 'user';

    // Gemini requirement: The very first message MUST have role 'user'
    // Skip any leading 'model' messages (e.g., initial frontend greeting)
    if (contents.length === 0 && role === 'model') {
      continue;
    }

    // Gemini requirement: Roles must alternate (user -> model -> user)
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n\n' + msg.text.trim();
    } else {
      contents.push({
        role,
        parts: [{ text: msg.text.trim() }]
      });
    }
  }

  // Ensure at least one user message
  if (contents.length === 0) {
    const lastUser = [...messages].reverse().find((m) => m?.role === 'user' && m?.text?.trim());
    contents.push({
      role: 'user',
      parts: [{ text: lastUser ? lastUser.text.trim() : 'Hello' }]
    });
  }

  return contents;
}

function formatGroqMessages(messages, contextualPrompt) {
  const groqMessages = [{ role: 'system', content: contextualPrompt }];
  for (const msg of messages) {
    if (!msg || typeof msg.text !== 'string' || !msg.text.trim()) continue;
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    if (groqMessages.length === 1 && role === 'assistant') continue;
    groqMessages.push({ role, content: msg.text.trim() });
  }
  if (groqMessages.length === 1) {
    const lastUser = [...messages].reverse().find((m) => m?.role === 'user' && m?.text?.trim());
    groqMessages.push({ role: 'user', content: lastUser ? lastUser.text.trim() : 'Hello' });
  }
  return groqMessages;
}

function generateLocalFallbackReply(messages, userContext) {
  const lastUserMsg = ([...messages].reverse().find((m) => m?.role === 'user')?.text || '').toLowerCase();

  if (lastUserMsg.includes('hello') || lastUserMsg.includes('hi') || lastUserMsg.includes('hey')) {
    return `Hello! 👋 I'm your MBBSWALA NEET Admission Advisor.

I am here to guide you through medical college admissions across India. You can ask me about:
• **Closing Ranks & Cutoffs** for All India Quota (AIQ 15%) and State Quotas (85%)
• **College Recommendations** based on your NEET AIR or score
• **MCC & State Counselling** rules, rounds, documents, and choice filling
• **Seat Matrix & Fees** across Government, Private, and Deemed medical colleges

${userContext?.rank ? `I see your profile rank is **AIR ${userContext.rank}**.` : '💡 *Tip: Update your NEET Rank in your Profile for tailored recommendations!*'} How can I assist you today?`;
  }

  if (lastUserMsg.includes('cutoff') || lastUserMsg.includes('closing') || lastUserMsg.includes('rank')) {
    return `Here is key guidance on NEET-UG Cutoffs:
• **AIQ 15% Quota (MCC)**: Top Central Institutes (AIIMS, VMMC, MAMC) close under AIR 2,000 for General. State GMCs via AIQ generally close between AIR 18,000 - 24,000 (General/OBC/EWS) and AIR 1,00,000 - 1,30,000 (SC/ST).
• **State 85% Quota**: Cutoffs are significantly more relaxed compared to AIQ, depending on your domicile state.
• **Personalized Prediction**: For real-time cutoff calculations and safe/moderate/reach college lists, head over to the **College Predictor** in the dashboard!`;
  }

  if (lastUserMsg.includes('document') || lastUserMsg.includes('certificate')) {
    return `Essential documents required for NEET-UG Counselling:
1. **NEET Admit Card & Score Card (Rank Card)**
2. **Class 10th Marksheet & Certificate** (for Date of Birth verification)
3. **Class 12th Marksheet & Passing Certificate**
4. **Domicile / Residence Certificate** (for State 85% Quota)
5. **Category Certificate** (OBC-NCL / EWS / SC / ST / PwD, issued in the prescribed format)
6. **Government Photo ID** (Aadhaar Card, Passport, etc.)
7. **Passport-size photographs** (matching NEET admit card)`;
  }

  return `Thanks for reaching out! Here are some recommended next steps:
• **College Predictor**: Use the College Predictor tab to check your exact admission probability across AIQ and State Quotas.
• **College Finder**: Browse through 700+ medical colleges with verified seat matrix, fees, and bond details.
• **Counseling Assistance**: If you need one-on-one expert round strategy, explore our Counselling packages.

Feel free to ask another specific question regarding cutoffs, colleges, or counselling rounds!`;
}

export default async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, userContext } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array' });
    }

    const contextualPrompt = `
${SYSTEM_PROMPT}

Student Profile (Current Context):
- Domicile: ${userContext?.domicile_state || 'Not provided'}
- Target State: ${userContext?.target_state || 'Not provided'}
- Category: ${userContext?.category || 'Not provided'}
- NEET Rank: ${userContext?.rank ? `AIR ${userContext.rank}` : 'Not provided'}
- Score: ${userContext?.score || 'Not provided'}
- Quotas: ${userContext?.quotas?.join(', ') || 'Not provided'}
`;

    const order = getProviderOrder();

    let replyText = null;
    let success = false;
    let lastError = null;

    for (const providerKey of order) {
      try {
        const isGroq = providerKey === 'groq';
        const isGemini = providerKey.startsWith('gemini');

        let key;
        if (isGroq) {
          key = process.env.GROQ_API_KEY || process.env.GROQ_PREDICT_API_KEY;
        } else if (providerKey === 'gemini') {
          key = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_FALLBACK || FALLBACK_GEMINI_KEYS[0];
        } else {
          const idx = parseInt(providerKey.split('_')[1], 10);
          key = process.env[`GEMINI_API_KEY_${idx}`] || FALLBACK_GEMINI_KEYS[(idx - 1) % FALLBACK_GEMINI_KEYS.length];
        }

        if (!key) continue;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), isGroq ? 20000 : 25000);

        if (isGemini) {
          const geminiContents = formatGeminiContents(messages);

          const payload = {
            systemInstruction: { parts: [{ text: contextualPrompt }] },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 2048
            }
          };

          // Try available models if one returns 404 or unsupported
          for (const model of GEMINI_MODELS) {
            try {
              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                  signal: controller.signal
                }
              );

              if (response.ok) {
                const data = await response.json();
                const parts = data?.candidates?.[0]?.content?.parts || [];
                let text = null;
                for (const part of parts) {
                  if (part.text && !part.thought) {
                    text = part.text;
                    break;
                  }
                }
                if (!text) text = parts[0]?.text;
                if (text) {
                  replyText = text;
                  success = true;
                  console.log(`[AI Chat] Success with ${providerKey} (${model})`);
                  break;
                }
              } else {
                lastError = await response.text();
                // If 404 model not found, loop to next model
                if (response.status === 404) {
                  continue;
                }
                // For other errors (e.g. rate limit 429), try next key
                break;
              }
            } catch (innerErr) {
              lastError = innerErr.message;
              if (innerErr.name === 'AbortError') break;
            }
          }

          clearTimeout(timeoutId);
          if (success) break;
        } else if (isGroq) {
          const groqMessages = formatGroqMessages(messages, contextualPrompt);

          const payload = {
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 2048,
            messages: groqMessages
          };

          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const text = data?.choices?.[0]?.message?.content;
            if (text) {
              replyText = text;
              success = true;
              console.log(`[AI Chat] Success with ${providerKey}`);
              break;
            }
          } else {
            lastError = await response.text();
          }
        }
      } catch (err) {
        lastError = err.message;
        if (err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
          console.warn(`[AI Chat] Timeout with ${providerKey}`);
          if (providerKey.startsWith('gemini')) break;
        }
      }
    }

    if (!success) {
      console.warn('[AI Chat] All AI providers failed. Serving smart fallback response. Last error:', lastError);
      return res.status(200).json({
        reply: generateLocalFallbackReply(messages, userContext)
      });
    }

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error('AI Chat error:', err);
    return res.status(200).json({
      reply: 'Hello! I am having a brief synchronization delay with my knowledge base. Please try asking again or check out the College Predictor!'
    });
  }
}
