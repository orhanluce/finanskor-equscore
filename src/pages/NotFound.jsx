import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui.jsx';
import { t } from '@/i18n.js';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-32 text-center">
      <div className="font-serif text-6xl font-bold text-primary">404</div>
      <h1 className="mt-3 font-serif text-2xl font-bold">{t('Page not found')}</h1>
      <p className="mt-2 text-muted-foreground">{t("The page you're looking for doesn't exist.")}</p>
      <Button as={Link} to="/" variant="primary" className="mt-6">{t('Back home')}</Button>
    </div>
  );
}
