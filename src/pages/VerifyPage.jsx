import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getMyVerification, requestVerification } from '@/lib/db.js';
import { t } from '@/i18n.js';

const STATUS = {
  approved: { icon: CheckCircle2, color: 'text-success', label: 'Verified' },
  pending: { icon: Clock, color: 'text-medal-bronze', label: 'Pending review' },
  rejected: { icon: XCircle, color: 'text-destructive', label: 'Not verified' },
};

export default function VerifyPage() {
  const { user, openAuth } = useAuth();
  const [verif, setVerif] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [statement, setStatement] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getMyVerification(user.id).then(setVerif).finally(() => setLoading(false));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (!displayName.trim()) throw new Error(t('Enter a display name.'));
      await requestVerification({ user, displayName: displayName.trim(), handle: handle.trim(), statement: statement.trim() });
      setVerif(await getMyVerification(user.id));
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="success" className="mb-3"><ShieldCheck className="h-3.5 w-3.5" /> VerifOK</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Get verified')}</h1>
      <p className="mt-2 text-muted-foreground">
        {t('Verification curbs fake accounts and pump campaigns. Approved investors appear on the')}{' '}
        <Link to="/investors" className="text-primary">{t('verified investors')}</Link> {t('wall.')}
      </p>

      {!user ? (
        <Card className="mt-6"><CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-muted-foreground">{t('Sign in to request verification.')}</p>
          <Button variant="accent" onClick={openAuth}>{t('Sign in')}</Button>
        </CardContent></Card>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : verif ? (
        (() => { const st = STATUS[verif.status]; const Icon = st.icon; return (
          <Card className="mt-6"><CardContent className="py-8 text-center">
            <Icon className={`mx-auto h-10 w-10 ${st.color}`} />
            <h2 className="mt-3 font-serif text-2xl font-bold">{t(st.label)}</h2>
            <p className="mt-2 text-muted-foreground">
              {verif.status === 'approved' ? t('You are listed on the verified investors wall.')
                : verif.status === 'pending' ? t('Your request is under review.')
                : t('Not approved this time.')}
            </p>
            {verif.status === 'rejected' && <Button variant="accent" className="mt-4" onClick={() => setVerif(null)}>{t('Re-apply')}</Button>}
          </CardContent></Card>
        ); })()
      ) : (
        <Card className="mt-6"><CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{t('Display name')} *</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("How you'll appear")} className="mt-1 w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{t('Public handle (X / LinkedIn)')}</label>
              <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" className="mt-1 w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{t('Short statement')}</label>
              <textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={3} placeholder={t('A line about your investing focus…')} className="mt-1 w-full" />
            </div>
            {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
            <Button type="submit" variant="accent" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Submit for verification')}
            </Button>
          </form>
        </CardContent></Card>
      )}
    </div>
  );
}
