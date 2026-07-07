/**
 * Client-side logout: clears the session cookie via the API, then does a full
 * navigation so every server component re-reads the (now empty) session.
 */
export async function logout(redirectTo = '/') {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Even if the request fails, still send the user away.
  }
  window.location.href = redirectTo;
}
