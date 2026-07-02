// Production error tracking — Sentry, env-gated. No VITE_SENTRY_DSN → no-op and
// @sentry/react is never downloaded. Captures uncaught errors + unhandled
// rejections automatically once initialised.
const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initErrorTracking() {
  if (!DSN || import.meta.env.DEV) return;   // skip in local dev
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      });
    })
    .catch(() => { /* error tracking must never break the app */ });
}
