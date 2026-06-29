import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient.js';
import { t } from '@/i18n.js';

function useTicker() {
  const { pathname } = useLocation();
  const m = pathname.match(/^\/stock\/([A-Za-z0-9]+)/);
  return m ? m[1].toUpperCase() : null;
}

async function askAI({ question, ticker = null, history = [] }) {
  const { data, error } = await supabase.functions.invoke('ai-ask', {
    body: { question, ticker, history },
  });
  if (error) {
    let msg = 'AI service unavailable. Please try again shortly.';
    try { const ctx = await error.context?.json?.(); if (ctx?.error) msg = ctx.error; } catch { /* ignore */ }
    return { error: msg };
  }
  return data || { error: 'Empty response.' };
}

export default function AiAsk() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const ticker = useTicker();
  const scrollRef = useRef(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('ai-ask-open', handler);
    return () => window.removeEventListener('ai-ask-open', handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  // Reset conversation when ticker changes
  useEffect(() => { setMessages([]); }, [ticker]);

  const send = async (e) => {
    e?.preventDefault?.();
    const q = input.trim();
    if (!q || busy) return;
    setInput('');
    const updated = [...messages, { role: 'user', content: q }];
    setMessages(updated);
    setBusy(true);
    const history = updated.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-6);
    const res = await askAI({ question: q, ticker, history });
    setMessages((prev) => [
      ...prev,
      res.error ? { role: 'error', content: res.error } : { role: 'assistant', content: res.answer },
    ]);
    setBusy(false);
  };

  const suggestions = ticker
    ? [
        `${t('What kind of company is')} ${ticker}?`,
        `${ticker} ${t('— cheap or expensive right now?')}`,
        `${t('What does the money flow tell us about')} ${ticker}?`,
      ]
    : [
        t('What is P/E ratio?'),
        t('How do I read the Equity Star score?'),
        t('What does Sharia-compliant mean for a stock?'),
      ];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-40 bottom-5 right-5 inline-flex items-center gap-2 bg-foreground text-background px-4 py-3 rounded-full shadow-lg hover:bg-foreground/90 transition-colors"
          aria-label="Ask AI"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-medium text-sm hidden sm:inline">{t('Ask AI')}</span>
        </button>
      )}

      {open && (
        <div className="fixed z-50 bottom-5 right-5 left-5 sm:left-auto sm:w-[380px] max-h-[70vh] flex flex-col bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground leading-tight">EquScore AI</div>
                <div className="text-[11px] text-muted-foreground leading-tight">
                  {ticker ? `${t('Context:')} ${ticker}` : t('Plain-English answers')}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-foreground/40 hover:text-foreground p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">
                <p className="mb-3">
                  {t('Hi 👋 I answer questions about EquScore data in plain English.')}{' '}
                  {ticker ? `${t("You're viewing")} ${ticker} — ${t('ask anything about it.')}` : t('Open a stock page or ask about a term.')}
                </p>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-left text-xs bg-muted hover:bg-muted/70 rounded-lg px-3 py-2 text-foreground/70">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-foreground text-background'
                  : m.role === 'error' ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-foreground'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-foreground/50" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
                rows={1}
                placeholder={t('Ask something…')}
                className="flex-1 resize-none bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary max-h-24"
              />
              <button type="submit" disabled={busy || !input.trim()}
                className="shrink-0 bg-foreground text-background w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-foreground/90">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-foreground/40 mt-2 leading-snug">
              {t('Generated from EquScore data. Not investment advice. Always verify independently.')}
            </p>
          </form>
        </div>
      )}
    </>
  );
}
