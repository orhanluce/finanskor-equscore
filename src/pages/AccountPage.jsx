import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Trophy, BookOpen, Briefcase, ShieldCheck, LogOut, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, Badge, Button, Stat } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getMyPredictions, getMyDecisions, getMembership, getMyVerification, isAdmin } from '@/lib/db.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

const MEMBER_BADGE = {
  approved: { variant: 'success', label: 'Approved member' },
  pending: { variant: 'muted', label: 'Approval pending' },
  rejected: { variant: 'danger', label: 'Not approved' },
};

export default function AccountPage() {
  const { user, openAuth, signOut } = useAuth();
  const [preds, setPreds] = useState([]);
  const [decs, setDecs] = useState([]);
  const [member, setMember] = useState(null);
  const [verif, setVerif] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getMyPredictions(user.id).catch(() => []),
      getMyDecisions(user.id).catch(() => []),
      getMembership(user.id).catch(() => null),
      getMyVerification(user.id).catch(() => null),
    ]).then(([p, d, m, v]) => { setPreds(p); setDecs(d); setMember(m); setVerif(v); }).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <User className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-3xl font-bold">{t('Your account')}</h1>
        <p className="mt-2 text-muted-foreground">{t('Sign in to see your predictions, decisions and portfolio.')}</p>
        <Button variant="accent" className="mt-5" onClick={openAuth}>{t('Sign in')}</Button>
      </div>
    );
  }

  const resolved = preds.filter((p) => p.resolved && p.accuracy_pct != null);
  const hitRate = resolved.length ? Math.round(resolved.reduce((a, p) => a + Number(p.accuracy_pct), 0) / resolved.length) : null;
  const mb = member ? MEMBER_BADGE[member.status] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-bold">{user.username}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {user.email}
              {isAdmin(user) && <Badge variant="primary"><Crown className="h-3 w-3" /> Admin</Badge>}
              {mb && <Badge variant={mb.variant}>{t(mb.label)}</Badge>}
              {verif?.status === 'approved' && <Badge variant="success"><ShieldCheck className="h-3 w-3" /> {t('Verified')}</Badge>}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4" /> {t('Sign out')}</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={preds.length} label={t('Predictions')} />
            <Stat value={hitRate != null ? `${hitRate}%` : '—'} label={t('Hit rate')} accent="text-success" />
            <Stat value={decs.length} label={t('Journal entries')} />
            <Stat value={resolved.length} label={t('Resolved calls')} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <QuickLink to="/predict" icon={Trophy} title={t('My predictions')} desc={`${preds.length} ${t('calls — make another')}`} />
            <QuickLink to="/journal" icon={BookOpen} title={t('Decision journal')} desc={`${decs.length} ${t('entries & your mirror')}`} />
            <QuickLink to="/portfolio" icon={Briefcase} title={t('Virtual portfolio')} desc={t('Track paper positions')} />
            <QuickLink to="/verify" icon={ShieldCheck} title={t('Get verified')} desc={verif ? `${t('Status')}: ${verif.status}` : t('Prove you are a real investor')} />
          </div>

          {!member && (
            <Card className="mt-6 border-primary/30 bg-primary/5"><CardContent className="flex flex-wrap items-center gap-3">
              <Crown className="h-5 w-5 text-primary" />
              <span className="text-sm">{t('Request approved-member access for the full preview.')}</span>
              <Button as={Link} to="/membership" variant="accent" className="ml-auto h-9 px-4 text-sm">{t('Request access')}</Button>
            </CardContent></Card>
          )}

          {isAdmin(user) && (
            <Card className="mt-4"><CardContent className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-medal-bronze" />
              <span className="text-sm">{t('You have admin access.')}</span>
              <Button as={Link} to="/admin" variant="outline" className="ml-auto h-9 px-4 text-sm">{t('Open admin')}</Button>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-shadow hover:shadow-md"><CardContent className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary"><Icon className="h-5 w-5" /></span>
        <div>
          <div className="font-semibold group-hover:text-primary">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </CardContent></Card>
    </Link>
  );
}
