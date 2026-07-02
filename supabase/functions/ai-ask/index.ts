import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GROQ_KEY = Deno.env.get('GROQ_API_KEY') ?? '';
const COHERE_KEY = Deno.env.get('COHERE_API_KEY') ?? '';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const COHERE_MODEL = 'command-r-plus-08-2024';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_EN = `You are EquScore AI — a concise, plain-English investment analyst assistant for MENA stock markets (Saudi Tadawul, UAE DFM/ADX, Egypt EGX).
You explain EquScore metrics (Equity Star scores, Sharia compliance, Money Flow, MAX score, Fair Value, Efsah Flash news sentiment) in simple, jargon-free English.
Rules:
- Never give a direct buy/sell recommendation. You can explain what data implies.
- Keep answers under 150 words unless a detailed explanation is requested.
- When the user asks about a specific stock, incorporate the context provided.
- If you don't know something with confidence, say so clearly.
- You are not a licensed financial adviser. Remind users briefly when relevant.`;

const SYSTEM_AR = `أنت "EquScore AI" — مساعد تحليل استثماري موجز وواضح لأسواق الأسهم في منطقة الشرق الأوسط وشمال إفريقيا (تداول السعودية، سوق دبي وأبوظبي، البورصة المصرية).
تشرح مقاييس EquScore (نجمة الأسهم، التوافق مع الشريعة، تدفق الأموال، مؤشر MAX، القيمة العادلة، مشاعر أخبار إفصاح فلاش) بلغة عربية بسيطة وخالية من المصطلحات المعقدة.
القواعد:
- لا تقدّم أبداً توصية مباشرة بالشراء أو البيع. يمكنك شرح ما تشير إليه البيانات.
- اجعل الإجابات أقل من 150 كلمة ما لم يُطلب شرح مفصّل.
- عندما يسأل المستخدم عن سهم محدد، ادمج السياق المقدَّم.
- إذا لم تكن متأكداً من شيء، فاذكر ذلك بوضوح.
- أنت لست مستشاراً مالياً مرخصاً. ذكّر المستخدم بذلك باختصار عند الحاجة.`;

const isArabic = (s: string) => /[؀-ۿ]/.test(s);

async function askGroq(messages: unknown[]): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 400, temperature: 0.4 }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

async function askCohere(messages: unknown[]): Promise<string> {
  const res = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${COHERE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: COHERE_MODEL, messages, max_tokens: 500, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`cohere ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const parts = data.message?.content ?? [];
  return parts.map((p: { text?: string }) => p.text ?? '').join('').trim();
}

// Mini-RAG: pick the docs most relevant to the question (Cohere rerank; falls back
// to the first N if the key is missing or the call fails).
async function pickDocs(question: string, docs: string[], topN: number): Promise<string[]> {
  if (docs.length <= topN || !COHERE_KEY) return docs.slice(0, topN);
  try {
    const res = await fetch('https://api.cohere.com/v2/rerank', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${COHERE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'rerank-v3.5', query: question, documents: docs, top_n: topN }),
    });
    if (!res.ok) throw new Error(`rerank ${res.status}`);
    const d = await res.json();
    const picked = (d.results ?? []).map((r: { index: number }) => docs[r.index]).filter(Boolean);
    return picked.length ? picked : docs.slice(0, topN);
  } catch (e) {
    console.error('rerank failed:', e);
    return docs.slice(0, topN);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (!GROQ_KEY && !COHERE_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured.' }), {
        status: 503, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { question, ticker, context = null, docs = [], history = [] } = await req.json();
    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'No question provided.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const ar = isArabic(question);
    const base = ar ? SYSTEM_AR : SYSTEM_EN;
    let systemMsg = ticker
      ? `${base}\n\n${ar ? 'السياق الحالي: المستخدم يشاهد السهم' : 'Current context: the user is viewing stock'} ${ticker}.`
      : base;

    // Grounding block: live EquScore data + the most relevant recent headlines/videos.
    if (context && typeof context === 'object') {
      systemMsg += `\n\nLIVE EQUSCORE DATA for this stock (base every number you state on this; if a value is missing here, say you don't have it — do NOT invent figures):\n${JSON.stringify(context).slice(0, 1800)}`
        + `\nMetric notes: equityStar = 7 dimensions scored 0-6 each (max 42, higher is better). discountPct > 0 means the price is BELOW fair value. maxScore = retail-attention signal (biggest 1-day jump in volatility units; high MAX with weak quality = value-trap risk, NOT analyst opinion). foreignFlow = net foreign/institutional direction. starDims.consensus reflects analyst ratings; analysts.target is the median analyst price target.`;
    }
    const cleanDocs = (Array.isArray(docs) ? docs : [])
      .filter((d: unknown) => typeof d === 'string' && d.trim())
      .map((d: string) => d.trim().slice(0, 160))
      .slice(0, 12);
    if (cleanDocs.length) {
      const picked = await pickDocs(question.trim().slice(0, 300), cleanDocs, 6);
      systemMsg += `\n\nRECENT ITEMS (news / analysis videos / market headlines — cite only if relevant):\n${picked.map((d) => `- ${d}`).join('\n')}`;
    }

    const messages = [
      { role: 'system', content: systemMsg },
      ...history.slice(-6),
      { role: 'user', content: question.trim().slice(0, 500) },
    ];

    // Arabic → Cohere Command R+ (stronger Arabic); English → Groq (fast). Each falls
    // back to the other provider if its key is missing or the call fails.
    const cohereReady = !!COHERE_KEY;
    const groqReady = !!GROQ_KEY;
    const order = ar
      ? [['cohere', cohereReady], ['groq', groqReady]]
      : [['groq', groqReady], ['cohere', cohereReady]];

    let answer = '';
    let used = '';
    let lastErr: unknown = null;
    for (const [provider, ready] of order) {
      if (!ready) continue;
      try {
        answer = provider === 'cohere' ? await askCohere(messages) : await askGroq(messages);
        if (answer) { used = provider as string; break; }
      } catch (e) {
        lastErr = e;
        console.error(`${provider} failed:`, e);
      }
    }

    if (!answer) {
      console.error('all providers failed:', lastErr);
      return new Response(JSON.stringify({ error: 'AI provider error. Try again shortly.' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ answer, provider: used }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-ask error:', e);
    return new Response(JSON.stringify({ error: 'Unexpected error.' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
