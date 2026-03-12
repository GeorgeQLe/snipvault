'use client';

import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="h-40 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <p className="text-white font-medium">
                {user?.fullName || user?.firstName || 'User'}
              </p>
              <p className="text-gray-500 text-sm">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Profile is managed through Clerk. Click the avatar in the sidebar to update your profile.
          </p>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Plan & Billing</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-4">
            Manage your subscription and billing details.
          </p>
          <Link href="/billing">
            <Button variant="outline">Manage Billing</Button>
          </Link>
        </CardContent>
      </Card>

      {/* VS Code Extension */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">VS Code Extension</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-400 text-sm">
            Connect VS Code to your SnipVault account to save and search snippets directly from your editor.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/auth/device">
              <Button variant="outline" size="sm">Authorize Device</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Data</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-400 text-sm">
            Import snippets from external sources.
          </p>
          <Link href="/import">
            <Button variant="outline" size="sm">Import from GitHub Gists</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
