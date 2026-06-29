import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui.jsx';
import { t } from '@/i18n.js';

export default function AuthModal({ open, onClose }) {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (mode === 'signup') {
        const { needsConfirm } = await signUp(email, password, username || email.split('@')[0]);
        if (needsConfirm) { setMsg(t('Account created — check your email to confirm, then sign in.')); setMode('signin'); }
        else { onClose(); }
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (e2) {
      setErr(e2.message || t('Something went wrong'));
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold">{mode === 'signup' ? t('Create account') : t('Sign in')}</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'signup' ? t('Join the contest and start your decision journal.') : t('Welcome back to EquScore.')}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'signup' && (
            <input type="text" placeholder={t('Username')} value={username} onChange={(e) => setUsername(e.target.value)} className="w-full" />
          )}
          <input type="email" required placeholder={t('Email')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
          <input type="password" required minLength={6} placeholder={t('Password (min 6)')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" />
          {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
          {msg && <div className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{msg}</div>}
          <Button type="submit" variant="accent" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signup' ? t('Create account') : t('Sign in')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'signup' ? t('Already have an account?') : t("Don't have an account?")}{' '}
          <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setErr(null); setMsg(null); }}
            className="font-medium text-primary hover:underline">
            {mode === 'signup' ? t('Sign in') : t('Sign up')}
          </button>
        </div>
      </div>
    </div>
  );
}
