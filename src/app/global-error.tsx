'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-black">
            !
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-white">Application Exception</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              An unexpected error occurred. It has been automatically logged and dispatched to our operations telemetry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
          >
            Reload Interface
          </button>
        </div>
      </body>
    </html>
  );
}

