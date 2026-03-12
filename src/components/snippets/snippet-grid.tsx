'use client';

import { SnippetCard } from './snippet-card';
import type { Snippet, SnippetFile, Tag, SnippetTag, Collection } from '@/lib/db/schema';

interface SnippetWithRelations extends Snippet {
  files: SnippetFile[];
  snippetTags: (SnippetTag & { tag: Tag })[];
  collection: Collection | null;
}

interface SnippetGridProps {
  snippets: SnippetWithRelations[];
  view?: 'grid' | 'list';
}

export function SnippetGrid({ snippets, view = 'grid' }: SnippetGridProps) {
  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="w-12 h-12 text-gray-700 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2v6h6" />
        </svg>
        <p className="text-gray-500 text-sm">No snippets found</p>
        <p className="text-gray-600 text-xs mt-1">
          Create your first snippet to get started.
        </p>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="space-y-2">
        {snippets.map((snippet) => (
          <SnippetCard key={snippet.id} snippet={snippet} view="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} view="grid" />
      ))}
    </div>
  );
}
