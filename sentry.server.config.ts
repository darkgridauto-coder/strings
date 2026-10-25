import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      // Strip auth tokens and cookies from event data
      if (event.request?.headers) {
        delete event.request.headers['cookie'];
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });
}
