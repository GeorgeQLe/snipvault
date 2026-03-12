'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { SnippetGrid } from '@/components/snippets/snippet-grid';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: snippetsData, isLoading: snippetsLoading } = trpc.snippet.list.useQuery({
    limit: 10,
    sortBy: 'created',
    sortOrder: 'desc',
  });

  const { data: favoritesData } = trpc.snippet.list.useQuery({
    limit: 1,
    isFavorite: true,
  });

  const { data: collections } = trpc.collection.list.useQuery();

  const totalSnippets = snippetsData?.items.length ?? 0;
  const totalFavorites = favoritesData?.items.length ?? 0;
  const totalCollections = collections?.length ?? 0;

  const stats = [
    {
      label: 'Total Snippets',
      value: totalSnippets,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'Favorites',
      value: totalFavorites,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      color: 'text-yellow-400 bg-yellow-500/10',
    },
    {
      label: 'Collections',
      value: totalCollections,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      color: 'text-green-400 bg-green-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back. Here is an overview of your snippets.</p>
        </div>
        <Link href="/snippets/new">
          <Button>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Snippet
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Snippets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Snippets</h2>
          <Link href="/library" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            View all
          </Link>
        </div>

        {snippetsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : snippetsData?.items ? (
          <SnippetGrid snippets={snippetsData.items as never} />
        ) : null}
      </div>
    </div>
  );
}
