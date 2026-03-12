'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CodePreview } from '@/components/editor/code-preview';
import type { Snippet, SnippetFile, Tag, SnippetTag, Collection } from '@/lib/db/schema';

type BadgeColor = 'blue' | 'green' | 'purple' | 'gray' | 'red' | 'yellow' | 'orange' | 'pink';

interface SnippetWithRelations extends Snippet {
  files: SnippetFile[];
  snippetTags: (SnippetTag & { tag: Tag })[];
  collection: Collection | null;
}

interface SnippetCardProps {
  snippet: SnippetWithRelations;
  view?: 'grid' | 'list';
}

export function SnippetCard({ snippet, view = 'grid' }: SnippetCardProps) {
  const file = snippet.files[0];
  const tagList = snippet.snippetTags.map((st) => st.tag);

  if (view === 'list') {
    return (
      <Link
        href={`/snippets/${snippet.id}`}
        className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-white truncate">
              {snippet.title}
            </h3>
            {snippet.isFavorite && (
              <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          {snippet.description && (
            <p className="text-xs text-gray-500 truncate mb-2">{snippet.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {snippet.language && (
              <Badge color="blue">{snippet.language}</Badge>
            )}
            {tagList.slice(0, 3).map((tag) => (
              <Badge key={tag.id} color={(tag.color || 'gray') as BadgeColor}>
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
        {file && (
          <div className="w-64 shrink-0 hidden lg:block">
            <CodePreview code={file.content} language={file.language} maxLines={3} />
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/snippets/${snippet.id}`}
      className="block bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors overflow-hidden"
    >
      {file && (
        <div className="border-b border-gray-800">
          <CodePreview code={file.content} language={file.language} maxLines={6} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-white truncate flex-1">
            {snippet.title}
          </h3>
          {snippet.isFavorite && (
            <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>
        {snippet.description && (
          <p className="text-xs text-gray-500 truncate mb-2">{snippet.description}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          {snippet.language && (
            <Badge color="blue">{snippet.language}</Badge>
          )}
          {tagList.slice(0, 3).map((tag) => (
            <Badge key={tag.id} color={(tag.color || 'gray') as BadgeColor}>
              {tag.name}
            </Badge>
          ))}
          {tagList.length > 3 && (
            <span className="text-xs text-gray-600">+{tagList.length - 3}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
