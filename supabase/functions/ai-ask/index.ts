import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GROQ_KEY = Deno.env.get('GROQ_API_KEY') ?? '';
const MODEL = 'llama-3.3-70b-versatile';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `You are EquScore AI — a concise, plain-English investment analyst assistant for the Saudi Tadawul stock market.
You explain EquScore metrics (Equity Star scores, Sharia compliance, Money Flow, MAX score, Fair Value, Efsah Flash news sentiment) in simple, jargon-free English.
Rules:
- Never give a direct buy/sell recommendation. You can explain what data implies.
- Keep answers under 150 words unless a detailed explanation is requested.
- When the user asks about a specific stock, incorporate the context provided.
- If you don't know something with confidence, say so clearly.
- You are not a licensed financial adviser. Remind users briefly when relevant.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (!GROQ_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured.' }), {
        status: 503, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { question, ticker, history = [] } = await req.json();
    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'No question provided.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const systemMsg = ticker
      ? `${SYSTEM}\n\nCurrent context: the user is viewing stock ${ticker} on Tadawul (Saudi Arabia).`
      : SYSTEM;

    const messages = [
      { role: 'system', content: systemMsg },
      ...history.slice(-6),
      { role: 'user', content: question.trim().slice(0, 500) },
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 300, temperature: 0.4 }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('Groq error:', err);
      return new Response(JSON.stringify({ error: 'AI provider error. Try again shortly.' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const groqData = await groqRes.json();
    const answer = groqData.choices?.[0]?.message?.content?.trim() ?? '';

    return new Response(JSON.stringify({ answer }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-ask error:', e);
    return new Response(JSON.stringify({ error: 'Unexpected error.' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
