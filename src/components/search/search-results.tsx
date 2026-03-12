'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CodePreview } from '@/components/editor/code-preview';

interface SearchResult {
  snippetId: string;
  title: string;
  description: string | null;
  language: string | null;
  isFavorite: boolean;
  content: string;
  filename: string;
  combinedScore: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-gray-500 text-sm">
          No results found for &quot;{query}&quot;
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Try a different search term or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <Link
          key={result.snippetId}
          href={`/snippets/${result.snippetId}`}
          className="block bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-white flex-1">
                <HighlightMatch text={result.title} query={query} />
              </h3>
              {result.isFavorite && (
                <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              <span className="text-xs text-gray-600">
                {(result.combinedScore * 100).toFixed(0)}% match
              </span>
            </div>
            {result.description && (
              <p className="text-xs text-gray-500 mb-2">{result.description}</p>
            )}
            <div className="flex items-center gap-2 mb-3">
              {result.language && (
                <Badge color="blue">{result.language}</Badge>
              )}
              <span className="text-xs text-gray-600">{result.filename}</span>
            </div>
          </div>
          <div className="border-t border-gray-800">
            <CodePreview code={result.content} language={result.language} maxLines={4} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
