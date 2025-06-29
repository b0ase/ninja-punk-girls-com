'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Simple Loading Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
      <p className="text-white text-lg">Processing HandCash login...</p>
    </div>
  </div>
);

export default function HandCashCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [debugInfo, setDebugInfo] = useState<string>('');

  const supabase = createClientComponentClient();

  useEffect(() => {
    console.log('[HandCashCallback] Page component mounted');
    setStatus('Page loaded, checking for auth token...');
    
    const handcashAuthToken = searchParams.get('authToken');
    const redirectUrl = searchParams.get('redirectUrl');

    setDebugInfo(`Token: ${handcashAuthToken ? 'Present' : 'Missing'}, Redirect: ${redirectUrl || 'None'}`);

    if (!handcashAuthToken) {
      setStatus('Error: No HandCash auth token found in URL.');
      setError('HandCash authentication token is missing.');
      console.error('[HandCashCallback] No auth token found in URL');
      return;
    }

    setStatus('Auth token found, processing authentication...');

    const processHandCashLogin = async () => {
      try {
        setStatus('Sending token to authentication API...');
        console.log('[HandCashCallback] Sending POST to /api/auth/handcash/callback');
        
        const response = await fetch('/api/auth/handcash/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ handcashAuthToken }),
        });

        console.log('[HandCashCallback] API response status:', response.status);
        const result = await response.json();
        console.log('[HandCashCallback] API response:', result);

        if (!response.ok || result.error || !result.success) {
          throw new Error(result.error || `API route failed with status ${response.status}`);
        }

        setStatus('Authentication successful! Redirecting to mint page...');
        console.log('[HandCashCallback] Authentication successful, redirecting to /mint');
        
        // Add a small delay to show the success message
        setTimeout(() => {
          router.push('/mint');
        }, 1000);

      } catch (err: any) {
        console.error('[HandCashCallback] Authentication error:', err);
        setError(`Authentication failed: ${err.message}`);
        setStatus('Authentication failed.');
      }
    };

    // Add a small delay to ensure the page is fully rendered
    setTimeout(() => {
      processHandCashLogin();
    }, 100);

  }, [searchParams, router, supabase]);

  // Always render something visible
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">HandCash Authentication</h1>
        
        {error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Authentication Error</h2>
            <p className="text-gray-300 mb-2">Status: {status}</p>
            <p className="text-red-400 mb-4">Error: {error}</p>
            <div className="bg-gray-800 p-3 rounded text-sm text-gray-400">
              <p>Debug Info: {debugInfo}</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-lg">{status}</p>
            </div>
            
            <div className="bg-gray-700 p-3 rounded text-sm text-gray-400">
              <p>Debug Info: {debugInfo}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 