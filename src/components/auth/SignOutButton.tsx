'use client';
export function SignOutButton() {
  async function signOut() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login';
  }
  return (
    <button onClick={signOut} className="btn btn-outline btn-block" style={{ marginTop: 16 }}>
      Sign out
    </button>
  );
}
