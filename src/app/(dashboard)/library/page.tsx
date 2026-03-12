'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { SnippetGrid } from '@/components/snippets/snippet-grid';
import { SearchBar } from '@/components/search/search-bar';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getSupportedLanguages } from '@/lib/language-detection';

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [collectionId, setCollectionId] = useState(searchParams.get('collection') ?? '');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.snippet.list.useInfiniteQuery(
      {
        limit: 20,
        search: search || undefined,
        language: language || undefined,
        isFavorite: favoritesOnly || undefined,
        collectionId: collectionId || undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const { data: collections } = trpc.collection.list.useQuery();

  const allSnippets = data?.pages.flatMap((page) => page.items) ?? [];
  const languages = getSupportedLanguages();

  const collectionOptions = (collections ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="text-gray-500 mt-1">Browse and manage your code snippets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-colors ${
              view === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-colors ${
              view === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          onSearch={setSearch}
          className="flex-1 min-w-[200px]"
          showShortcut={false}
          placeholder="Filter snippets..."
        />
        <Select
          options={languages}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="All languages"
          className="w-40"
        />
        <Select
          options={collectionOptions}
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          placeholder="All collections"
          className="w-44"
        />
        <Button
          variant={favoritesOnly ? 'primary' : 'outline'}
          size="md"
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          <svg className="w-4 h-4" fill={favoritesOnly ? 'currentColor' : 'none'} viewBox="0 0 20 20" stroke="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Favorites
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <SnippetGrid snippets={allSnippets as never} view={view} />

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
