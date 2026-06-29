import React from 'react';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { STORIES } from '@/data/extras.js';
import { t } from '@/i18n.js';

const TAG_VARIANT = {
  Guide: 'primary', Sharia: 'sharia', Behaviour: 'muted',
  Signals: 'success', Research: 'muted', Macro: 'primary',
};

export default function StoriesPage() {
  const [featured, ...rest] = STORIES;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3">{t('Investor education')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Stories')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Plain-English explainers on how to read EquScore and invest thoughtfully on Tadawul.')}
      </p>

      <Card className="mt-8 overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-primary/60" />
          </div>
          <CardContent className="flex flex-col justify-center">
            <Badge variant={TAG_VARIANT[featured.tag] || 'muted'} className="w-fit">{featured.tag}</Badge>
            <h2 className="mt-3 font-serif text-2xl font-bold">{featured.title}</h2>
            <p className="mt-2 text-muted-foreground">{featured.excerpt}</p>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {featured.minutes} {t('min read')}</span>
              <span className="inline-flex items-center gap-1 font-medium text-primary">{t('Read')} <ArrowRight className="h-4 w-4" /></span>
            </div>
          </CardContent>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((st) => (
          <Card key={st.slug} className="group h-full transition-shadow hover:shadow-md">
            <CardContent className="flex h-full flex-col">
              <Badge variant={TAG_VARIANT[st.tag] || 'muted'} className="w-fit">{st.tag}</Badge>
              <h3 className="mt-3 font-serif text-lg font-bold group-hover:text-primary">{st.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{st.excerpt}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {st.minutes} min</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{t('Educational content, not investment advice.')}</p>
    </div>
  );
}
