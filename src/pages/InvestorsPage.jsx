import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2, UserCheck } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { getVerifiedInvestors } from '@/lib/db.js';
import { t } from '@/i18n.js';

export default function InvestorsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getVerifiedInvestors().then(setRows).finally(() => setLoading(false)); }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="success" className="mb-3"><ShieldCheck className="h-3.5 w-3.5" /> VerifOK</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Verified Investors')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Real, identity-checked investors — a deliberate counter to anonymous pump accounts.')}
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="mt-8"><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <UserCheck className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t('No verified investors yet — be the first.')}</p>
          <Button as={Link} to="/verify" variant="accent">{t('Get verified')}</Button>
        </CardContent></Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {rows.map((r, i) => (
            <Card key={i}><CardContent>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-serif text-lg font-bold">{r.display_name}</div>
                  {r.handle && <div className="text-xs text-muted-foreground">{r.handle}</div>}
                </div>
                <Badge variant="success" className="ml-auto">{t('Verified')}</Badge>
              </div>
              {r.statement && <p className="mt-3 text-sm text-muted-foreground">{r.statement}</p>}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
