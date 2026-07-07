'use client';

/**
 * global-error.js catches errors in the root layout itself.
 * It must render its own <html>/<body> because the layout has failed.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          color: '#0f172a',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: '0.75rem', color: '#475569' }}>
            A critical error occurred. Please refresh the page to continue.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.6rem 1.25rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: '#0f766e',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
