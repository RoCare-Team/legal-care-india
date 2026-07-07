'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * LogoutButton — clears the session cookie via the API and returns home.
 */
export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Even if the request fails, send the user to login.
    }
    window.location.href = '/login';
  };

  return (
    <Button
      type="button"
      onClick={onLogout}
      disabled={loading}
      variant="ghost"
      size="sm"
      leftIcon={<LogOut className="h-4 w-4" />}
    >
      {loading ? 'Logging out…' : 'Log out'}
    </Button>
  );
}
