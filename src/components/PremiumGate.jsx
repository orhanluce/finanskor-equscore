import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { t } from '@/i18n.js';

// Wraps premium content. Signed-in users pass; otherwise content is blurred with an upsell.
// (Demo policy: "premium" = signed in. Swap for a real entitlement check when billing lands.)
export default function PremiumGate({ children, title, blur = true }) {
  const heading = title || t('Premium feature');
  const { user, openAuth } = useAuth();
  if (user) return children;

  return (
    <div className="relative">
      {blur && <div className="pointer-events-none select-none blur-sm opacity-50" aria-hidden>{children}</div>}
      <div className={blur ? 'absolute inset-0 flex items-center justify-center' : 'flex items-center justify-center py-10'}>
        <div className="max-w-sm rounded-2xl border border-primary/30 bg-card/95 p-6 text-center shadow-lg backdrop-blur">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <h3 className="mt-3 font-serif text-lg font-bold">{heading}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('Sign in to unlock this — free during the preview.')}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="accent" onClick={openAuth}>{t('Sign in')}</Button>
            <Button as={Link} to="/premium" variant="ghost" className="text-sm">
              <Sparkles className="h-4 w-4" /> {t('See premium')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
