'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setTokens } from '@/lib/api-client';

export default function AuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const requiresApproval = params.get('requires_approval') === 'true';
    const accessRejected = params.get('access_rejected') === 'true';
    const hasTenant = params.get('has_tenant') === 'true';

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
    }

    if (accessRejected) {
      router.replace('/login?error=access_rejected');
    } else if (requiresApproval) {
      router.replace('/auth/pending-approval');
    } else if (!hasTenant) {
      router.replace('/onboarding');
    } else {
      router.replace('/dashboard');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );
}