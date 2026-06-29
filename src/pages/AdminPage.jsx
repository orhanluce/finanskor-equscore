import React, { useEffect, useState, useCallback } from 'react';
import { Crown, Loader2, Check, X, Users, ShieldCheck } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import {
  isAdmin, getMemberships, reviewMembership, getVerifications, reviewVerification,
} from '@/lib/db.js';
import { cn } from '@/lib/utils.js';

export default function AdminPage() {
  const { user, openAuth } = useAuth();
  const [tab, setTab] = useState('memberships');
  const [members, setMembers] = useState([]);
  const [verifs, setVerifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const admin = isAdmin(user);

  const load = useCallback(() => {
    if (!admin) return;
    setLoading(true);
    Promise.all([getMemberships('pending'), getVerifications('pending')])
      .then(([m, v]) => { setMembers(m); setVerifs(v); })
      .finally(() => setLoading(false));
  }, [admin]);

  useEffect(load, [load]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Crown className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-3xl font-bold">Admin</h1>
        <p className="mt-2 text-muted-foreground">Sign in with an admin account.</p>
        <Button variant="accent" className="mt-5" onClick={openAuth}>Sign in</Button>
      </div>
    );
  }
  if (!admin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Crown className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-3xl font-bold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">This area is restricted.</p>
      </div>
    );
  }

  const actMember = async (id, status) => { await reviewMembership(id, status); load(); };
  const actVerif = async (id, status) => { await reviewVerification(id, status); load(); };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><Crown className="h-3.5 w-3.5" /> Admin</Badge>
      <h1 className="font-serif text-4xl font-bold">Review queue</h1>
      <p className="mt-2 text-muted-foreground">Approve or reject pending membership and verification requests.</p>

      <div className="mt-6 flex gap-2">
        {[['memberships', 'Memberships', members.length, Users], ['verifications', 'Verifications', verifs.length, ShieldCheck]].map(([id, label, n, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              tab === id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            <Icon className="h-4 w-4" /> {label} <span className="rounded-full bg-background/20 px-1.5 text-xs">{n}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tab === 'memberships' ? (
        <div className="mt-6 space-y-3">
          {members.length === 0 && <Empty label="No pending membership requests." />}
          {members.map((m) => (
            <Card key={m.user_id}><CardContent className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{m.full_name || '(no name)'}</div>
                <div className="text-xs text-muted-foreground">{m.email}{m.linkedin && <> · <a href={m.linkedin} target="_blank" rel="noreferrer" className="text-primary">LinkedIn</a></>}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="accent" className="h-9 px-3 text-sm" onClick={() => actMember(m.user_id, 'approved')}><Check className="h-4 w-4" /> Approve</Button>
                <Button variant="outline" className="h-9 px-3 text-sm" onClick={() => actMember(m.user_id, 'rejected')}><X className="h-4 w-4" /> Reject</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {verifs.length === 0 && <Empty label="No pending verification requests." />}
          {verifs.map((v) => (
            <Card key={v.user_id}><CardContent className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{v.display_name} {v.handle && <span className="text-xs font-normal text-muted-foreground">· {v.handle}</span>}</div>
                {v.statement && <div className="text-xs text-muted-foreground">{v.statement}</div>}
              </div>
              <div className="flex gap-2">
                <Button variant="accent" className="h-9 px-3 text-sm" onClick={() => actVerif(v.user_id, 'approved')}><Check className="h-4 w-4" /> Verify</Button>
                <Button variant="outline" className="h-9 px-3 text-sm" onClick={() => actVerif(v.user_id, 'rejected')}><X className="h-4 w-4" /> Reject</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ label }) {
  return <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">{label}</div>;
}
