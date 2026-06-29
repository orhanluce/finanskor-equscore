import React, { useState } from 'react';
import { Link2, Check, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils.js';

// Lightweight social share row: X/Twitter, WhatsApp, copy-link.
export default function ShareButtons({ title = 'EquScore', text = '', className = '' }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(text || title);
  const shareUrl = encodeURIComponent(url);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  const Btn = ({ href, onClick, label, children }) => {
    const cls = 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground/70 transition-colors hover:text-primary hover:border-primary/40';
    return href
      ? <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={cls}>{children}</a>
      : <button onClick={onClick} aria-label={label} className={cls}>{children}</button>;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground">Share</span>
      <Btn href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} label="Share on X">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
      </Btn>
      <Btn href={`https://wa.me/?text=${shareText}%20${shareUrl}`} label="Share on WhatsApp">
        <MessageCircle className="h-4 w-4" />
      </Btn>
      <Btn onClick={copy} label="Copy link">
        {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
      </Btn>
    </div>
  );
}
