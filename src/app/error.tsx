'use client';
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h1>Something went wrong</h1>
        <p className="muted" style={{ marginTop: 8 }}>This page could not be displayed.</p>
        <button onClick={reset} className="btn btn-primary" style={{ marginTop: 20 }}>Try again</button>
      </div>
    </main>
  );
}
