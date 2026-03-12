'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function DeviceAuthPage() {
  const { user, isLoaded } = useUser();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/auth/device-code/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to confirm code');
      }

      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full border border-gray-800">
          <h1 className="text-xl font-semibold text-white mb-4">Sign in required</h1>
          <p className="text-gray-400">
            Please sign in to your SnipVault account to authorize your VS Code extension.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full border border-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Authorize Device</h1>
          <p className="text-gray-400 mt-2">
            Enter the code shown in your VS Code extension to connect it to your account.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="text-green-400 text-lg font-medium mb-2">
              Device authorized successfully!
            </div>
            <p className="text-gray-400">
              You can close this page and return to VS Code.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Device Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest font-mono placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || code.length < 8}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
            >
              {status === 'loading' ? 'Authorizing...' : 'Authorize'}
            </button>

            <p className="text-gray-500 text-xs text-center">
              Signed in as {user.emailAddresses[0]?.emailAddress}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
