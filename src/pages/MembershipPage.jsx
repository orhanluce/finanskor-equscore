import React, { useEffect, useState } from 'react';
import { Crown, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getMembership, requestMembership } from '@/lib/db.js';

const STATUS = {
  approved: { icon: CheckCircle2, color: 'text-success', label: 'Approved', note: 'You have full preview access. Welcome aboard.' },
  pending: { icon: Clock, color: 'text-medal-bronze', label: 'Pending review', note: 'We are reviewing your request — you will get access once approved.' },
  rejected: { icon: XCircle, color: 'text-destructive', label: 'Not approved', note: 'Your request was not approved. You can update your details and re-apply.' },
};

export default function MembershipPage() {
  const { user, openAuth } = useAuth();
  const [member, setMember] = useState(null);
  const [fullName, setFullName] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getMembership(user.id).then(setMember).finally(() => setLoading(false));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (!fullName.trim()) throw new Error('Please enter your full name.');
      await requestMembership({ user, fullName: fullName.trim(), linkedin: linkedin.trim() });
      setMember(await getMembership(user.id));
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><Crown className="h-3.5 w-3.5" /> Membership</Badge>
      <h1 className="font-serif text-4xl font-bold">Request access</h1>
      <p className="mt-2 text-muted-foreground">
        The full preview is opened to approved members. Tell us who you are — we keep the community real.
      </p>

      {!user ? (
        <Card className="mt-6"><CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-muted-foreground">Sign in first, then request access.</p>
          <Button variant="accent" onClick={openAuth}>Sign in</Button>
        </CardContent></Card>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : member ? (
        (() => {
          const st = STATUS[member.status]; const Icon = st.icon;
          return (
            <Card className="mt-6"><CardContent className="py-8 text-center">
              <Icon className={`mx-auto h-10 w-10 ${st.color}`} />
              <h2 className="mt-3 font-serif text-2xl font-bold">{st.label}</h2>
              <p className="mt-2 text-muted-foreground">{st.note}</p>
              {member.status === 'rejected' && (
                <Button variant="accent" className="mt-4" onClick={() => setMember(null)}>Re-apply</Button>
              )}
            </CardContent></Card>
          );
        })()
      ) : (
        <Card className="mt-6"><CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Full name *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="mt-1 w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">LinkedIn (optional)</label>
              <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" className="mt-1 w-full" />
            </div>
            {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
            <Button type="submit" variant="accent" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request access'}
            </Button>
          </form>
        </CardContent></Card>
      )}
    </div>
  );
}
