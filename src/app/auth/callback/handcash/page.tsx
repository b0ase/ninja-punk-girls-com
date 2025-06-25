'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Simple Loading Component (Optional: You can style this better)
const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div style={{ border: '4px solid rgba(255, 255, 255, 0.3)', borderRadius: '50%', borderTop: '4px solid #fff', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default function HandCashCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Processing HandCash login...'); // Still useful for debugging/state

  const supabase = createClientComponentClient();

  useEffect(() => {
    const handcashAuthToken = searchParams.get('authToken');

    if (!handcashAuthToken) {
      setStatus('Error: No HandCash auth token found in URL.');
      setError('HandCash authentication token is missing.');
      // Optionally redirect to login with error after a delay
      // setTimeout(() => router.push('/login?error=handcash_token_missing'), 3000);
      return;
    }

    const processHandCashLogin = async () => {
      setStatus('Verifying HandCash token and fetching user profile...'); // Keep for state tracking
      try {
        console.log('[HandCashCallback Page] Attempting to POST to /api/auth/handcash/callback');
        const response = await fetch('/api/auth/handcash/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ handcashAuthToken }),
        });

        const result = await response.json();

        if (!response.ok || result.error || !result.success) {
          throw new Error(result.error || `API route failed with status ${response.status}`);
        }

        setStatus('Successfully authenticated! Redirecting...');
        // <<< CHANGE: Redirect to /mint instead of / >>>
        router.push('/mint'); 

      } catch (err: any) {
        console.error('HandCash callback error:', err);
        setError(`Authentication failed: ${err.message}`);
        setStatus('Authentication failed.');
        // Optionally redirect to login with error after a delay
        // setTimeout(() => router.push(`/login?error=${encodeURIComponent(err.message)}`), 3000);
      }
    };

    processHandCashLogin();

  }, [searchParams, router, supabase]);

  // Render loading spinner or error message
  return (
    <div style={{ backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      {error ? (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
           <h1>Authentication Error</h1>
           <p>Status: {status}</p>
           <p style={{ color: '#f56565' }}>Error: {error}</p>
           {/* Optional: Add a button to retry or go back */}
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
} 