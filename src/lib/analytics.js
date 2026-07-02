// Product analytics — PostHog, env-gated. If VITE_POSTHOG_KEY is unset the whole
// module is a no-op and posthog-js is never even downloaded (dynamic import), so
// there is zero bundle/runtime cost until a key is provided.
const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

let ph = null;          // loaded posthog instance
let ready = false;
let queue = [];         // events fired before init resolves

export function initAnalytics() {
  if (!KEY || ready) return;
  ready = true;
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: false,       // we send SPA pageviews manually
        persistence: 'localStorage',
        autocapture: true,
      });
      ph = posthog;
      queue.forEach(([n, p]) => ph.capture(n, p));
      queue = [];
    })
    .catch(() => { /* analytics must never break the app */ });
}

export function track(name, props = {}) {
  if (!KEY) return;
  if (ph) ph.capture(name, props);
  else queue.push([name, props]);        // buffer until init resolves
}

export function trackPageview(path) {
  track('$pageview', { $current_url: path });
}

export function identify(id, traits = {}) {
  if (!KEY) return;
  if (ph) ph.identify(id, traits);
}
