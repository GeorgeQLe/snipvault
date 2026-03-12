'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { SearchBar } from '@/components/search/search-bar';
import { SearchResults } from '@/components/search/search-results';
import { Select } from '@/components/ui/select';
import { getSupportedLanguages } from '@/lib/language-detection';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState('');
  const [collectionId, setCollectionId] = useState('');

  const { data, isLoading, isFetching } = trpc.search.search.useQuery(
    {
      query,
      language: language || undefined,
      collectionId: collectionId || undefined,
    },
    {
      enabled: query.length > 0,
    },
  );

  const { data: collections } = trpc.collection.list.useQuery();
  const languages = getSupportedLanguages();

  const collectionOptions = (collections ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Search</h1>
        <p className="text-gray-500 mt-1">
          AI-powered semantic search across all your snippets.
        </p>
      </div>

      <SearchBar
        defaultValue={query}
        onSearch={setQuery}
        placeholder="Search by description, code, or concept..."
        showShortcut={false}
        className="w-full"
      />

      <div className="flex flex-wrap items-center gap-3">
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
        {data?.results && (
          <span className="text-sm text-gray-500 ml-auto">
            {data.results.length} result{data.results.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {(isLoading || isFetching) && query ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : query && data?.results ? (
        <SearchResults results={data.results} query={query} />
      ) : !query ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            className="w-16 h-16 text-gray-800 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-gray-500 text-lg">Search your snippets</p>
          <p className="text-gray-600 text-sm mt-1">
            Use natural language to find code by description, concept, or content.
          </p>
        </div>
      ) : null}
    </div>
  );
}
