import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: false,
  // Strict Enterprise Security: scrub any sensitive credentials before sending
  beforeSend(event) {
    if (event.request?.data && typeof event.request.data === "object") {
      const data = event.request.data as Record<string, unknown>;
      for (const key of Object.keys(data)) {
        if (/password|pin|token|secret|auth|cookie|key/i.test(key)) {
          data[key] = "[FILTERED]";
        }
      }
    }
    if (event.extra && typeof event.extra === "object") {
      const extra = event.extra as Record<string, unknown>;
      for (const key of Object.keys(extra)) {
        if (/password|pin|token|secret|auth|cookie|key/i.test(key)) {
          extra[key] = "[FILTERED]";
        }
      }
    }
    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.data && typeof breadcrumb.data === "object") {
      const data = breadcrumb.data as Record<string, unknown>;
      for (const key of Object.keys(data)) {
        if (/password|pin|token|secret|auth|cookie|key/i.test(key)) {
          data[key] = "[FILTERED]";
        }
      }
    }
    return breadcrumb;
  },
});
