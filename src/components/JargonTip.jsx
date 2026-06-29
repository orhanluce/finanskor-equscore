import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

export const GLOSSARY = {
  'P/E': 'Price-to-Earnings — how many years of current profit the market is paying for. A lower P/E may mean "cheaper", but always compare within the same sector.',
  'P/B': 'Price-to-Book — market price divided by book (net asset) value per share. Below 1 means trading under book value.',
  'EV/EBITDA': 'Enterprise Value divided by EBITDA — the most inflation-resistant valuation multiple. Includes debt; useful for comparing across capital structures.',
  'EBITDA': 'Earnings Before Interest, Tax, Depreciation & Amortisation — a proxy for operating cash profit before accounting adjustments.',
  'ROE': 'Return on Equity — how much profit the company generates for every riyal of shareholders\' capital. Higher = more efficient use of owner funds.',
  'ROA': 'Return on Assets — how much profit the company squeezes from all its assets, not just equity. Useful for asset-heavy businesses.',
  'Gross margin': 'Percentage of revenue left after direct production/sales costs. Higher = stronger pricing power.',
  'Net margin': 'Percentage of revenue that survives all expenses (including tax & interest) to become profit.',
  'MFI': 'Money Flow Index — combines price and volume to measure buy/sell pressure on a 0–100 scale. Above 80 = overbought; below 20 = oversold.',
  'Interest coverage': 'How many times over the company\'s operating profit covers its annual interest bill. High = comfortable; below 1.5x = warning.',
  'Debt/equity': 'Total debt divided by shareholders\' equity. Lower = less leveraged, more resilient balance sheet.',
  'EPS': 'Earnings Per Share — net profit attributable to each share outstanding.',
  'Dividend yield': 'Annual dividend divided by share price (%). Shows income return irrespective of price appreciation.',
  'Fair value': 'Our calculated intrinsic value using sector-relative multiples. Price below fair value = potential discount; above = premium.',
  'Discount': 'How far below fair value the current price is trading. Positive = potentially undervalued.',
  'Free float': 'The proportion of shares actually available to trade on the market. Low free float = less liquidity, wider bid-ask spreads.',
  'Market cap': 'Total market value of all shares (price × shares outstanding).',
  'Net debt': 'Total financial debt minus cash on hand — the real debt burden after netting liquid assets.',
  'Enterprise value': 'Market cap plus net debt — the theoretical takeover price including all financial obligations.',
  'AAOIFI': 'Accounting & Auditing Organisation for Islamic Financial Institutions — sets the Sharia screening standards we use (Standard No. 21).',
  'NOMU': 'Tadawul\'s parallel market for smaller companies, with lighter listing requirements. Higher risk, lower liquidity.',
  'MAX score': 'Measures the biggest single-day volatility jump in sigma (σ) units — a lottery-seeking signal specific to Tadawul retail behaviour.',
  'Value trap': 'A stock that looks cheap on metrics but keeps falling because its business is structurally declining.',
  'Momentum': 'The persistence of a price trend. Strong momentum = trend likely to continue short-term.',
  'Drawdown': 'Maximum peak-to-trough loss — the worst percentage decline an investor would have experienced.',
  'Sentiment': 'The overall mood of news and social chatter — positive, neutral, or negative tone.',
  'Analyst consensus': 'The aggregated buy/hold/sell recommendations from sell-side analysts covering the stock.',
  'Upside': 'Percentage gain from current price to the analyst median target price.',
  'PEAD': 'Post-Earnings Announcement Drift — the observed tendency for stocks to keep moving in the direction of an earnings surprise for weeks after the announcement.',
  'Rumor thermometer': 'Volume and tone of social discussion. Highly discussed stocks often fade — high chatter alone is not a buy signal.',
  'Purification': 'The portion of dividend income a Muslim investor should donate to charity to cleanse any impermissible income (per AAOIFI Sharia Standard 21).',
  'Sharia compliant': 'Passes all AAOIFI Standard No. 21 financial ratio screens: interest-bearing debt < 30% of market cap, impermissible income < 5%, etc.',
  'Doubtful': 'One or more AAOIFI ratios is borderline. Consult a qualified Shariah board before investing.',
  'Non-compliant': 'Fails AAOIFI Standard No. 21 — the business model or balance sheet has a significant impermissible component.',
  'Equity Star': 'EquScore\'s composite 5-axis rating: Value, Growth, Track Record, Financial Health, Dividends — scored on 42 points.',
  'Intelligence Cube': 'Three premium signals stacked on top of Equity Star: Analyst Consensus, Money Flow, and Sentiment (news + social).',
  'SAHMK': 'Tadawul\'s official licensed market data provider — the source of our real net money-flow figures.',
  'Foreign flow': 'Net buying or selling by non-Saudi investors. Foreigners (QFIs) tend to be more analytical; sustained inflows are a quality signal.',
  'Institutional ownership': 'Percentage held by funds, banks, and corporations rather than retail. Higher = more professional investor scrutiny.',
  'z-score': 'How many standard deviations a value sits from its average. ±2 or beyond is statistically unusual.',
  'Volatility': 'How much the price fluctuates. High volatility = higher uncertainty; it measures magnitude of moves, not direction.',
};

const AUTO_TERMS = [
  'EV/EBITDA', 'Debt/equity', 'Gross margin', 'Net margin', 'Interest coverage',
  'Dividend yield', 'Market cap', 'Net debt', 'Enterprise value', 'Free float',
  'Fair value', 'Equity Star', 'Intelligence Cube', 'Analyst consensus',
  'Institutional ownership', 'Foreign flow', 'Rumor thermometer', 'Value trap',
  'PEAD', 'AAOIFI', 'SAHMK', 'NOMU', 'EBITDA', 'ROE', 'ROA', 'EPS', 'MFI',
  'Momentum', 'Drawdown', 'Sentiment', 'Discount', 'Purification', 'Upside',
  'Volatility', 'P/E', 'P/B',
];

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const AUTO_RE = new RegExp(
  '(?<![\\p{L}\\p{N}])(' + AUTO_TERMS.slice().sort((a, b) => b.length - a.length).map(escapeRe).join('|') + ')(?![\\p{L}\\p{N}])',
  'giu'
);

export function JargonText({ children, className = '' }) {
  if (typeof children !== 'string') return <span className={className}>{children}</span>;
  const parts = children.split(AUTO_RE);
  const seen = new Set();
  return (
    <span className={className}>
      {parts.map((p, idx) => {
        const key = Object.keys(GLOSSARY).find((k) => k.toLowerCase() === p.toLowerCase());
        if (key && !seen.has(key.toLowerCase())) {
          seen.add(key.toLowerCase());
          return <JargonTip key={idx} term={key} inline>{p}</JargonTip>;
        }
        return <React.Fragment key={idx}>{p}</React.Fragment>;
      })}
    </span>
  );
}

function TooltipPortal({ open, text, anchorRef }) {
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) { setPos(null); return; }
    const r = anchorRef.current.getBoundingClientRect();
    const W = Math.min(260, window.innerWidth - 16);
    const cx = r.left + r.width / 2;
    let left = cx - W / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - W - 8));
    const above = r.top < 96;
    setPos({ left, top: above ? r.bottom + 8 : r.top - 8, above, W });
  }, [open, anchorRef]);
  if (!open || !text || !pos) return null;
  return createPortal(
    <span
      style={{ position: 'fixed', left: pos.left, top: pos.top, width: pos.W, zIndex: 9999,
               transform: pos.above ? 'none' : 'translateY(-100%)' }}
      className="bg-foreground text-background text-xs rounded-lg px-3 py-2 shadow-lg leading-snug font-normal text-left pointer-events-none"
    >
      {text}
    </span>,
    document.body,
  );
}

export default function JargonTip({ term, description, children, className = '', inline = false }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const text = description || GLOSSARY[term] || '';

  if (inline) {
    if (!text) return <>{children || term}</>;
    return (
      <span className="relative inline">
        <button
          ref={btnRef}
          type="button"
          aria-label={`What is ${term}?`}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o); }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={`underline decoration-dotted decoration-foreground/40 underline-offset-2 hover:decoration-primary hover:text-primary transition-colors cursor-help ${className}`}
        >
          {children || term}
        </button>
        <TooltipPortal open={open} text={text} anchorRef={btnRef} />
      </span>
    );
  }

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      {children || term}
      {text && (
        <button
          ref={btnRef}
          type="button"
          aria-label={`What is ${term}?`}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o); }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="text-foreground/40 hover:text-primary transition-colors align-middle"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}
      <TooltipPortal open={open} text={text} anchorRef={btnRef} />
    </span>
  );
}
