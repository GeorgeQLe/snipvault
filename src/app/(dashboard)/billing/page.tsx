'use client';

import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const { data: plan, isLoading } = trpc.billing.currentPlan.useQuery();

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const createPortal = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="h-64 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your plan and subscription.</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-sm text-green-400">
            Successfully upgraded to Pro! All features are now available.
          </p>
        </div>
      )}

      {canceled && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            Checkout was canceled. You can upgrade anytime.
          </p>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Current Plan</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              plan?.plan === 'pro'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-gray-700 text-gray-300'
            }`}>
              {plan?.name}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ul className="space-y-2">
              {plan?.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {plan?.plan === 'free' ? (
              <Button
                className="mt-4"
                onClick={() => createCheckout.mutate()}
                disabled={createCheckout.isPending}
              >
                {createCheckout.isPending ? 'Loading...' : 'Upgrade to Pro — $8/mo'}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => createPortal.mutate()}
                disabled={createPortal.isPending}
              >
                {createPortal.isPending ? 'Loading...' : 'Manage Subscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={plan?.plan === 'free' ? 'ring-1 ring-gray-700' : ''}>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-white mb-1">Free</h3>
            <p className="text-3xl font-bold text-white mb-4">$0<span className="text-sm text-gray-500 font-normal">/mo</span></p>
            <ul className="space-y-2">
              {['100 snippets', 'Keyword search', 'Basic organization', 'Manual tagging'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-gray-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className={plan?.plan === 'pro' ? 'ring-1 ring-blue-500' : ''}>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-white mb-1">Pro</h3>
            <p className="text-3xl font-bold text-white mb-4">$8<span className="text-sm text-gray-500 font-normal">/mo</span></p>
            <ul className="space-y-2">
              {[
                'Unlimited snippets',
                'AI auto-tagging',
                'Semantic search',
                'VS Code extension',
                'GitHub Gist import',
                'Priority support',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
