'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { CodeEditor } from '@/components/editor/code-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CodePreview } from '@/components/editor/code-preview';

type BadgeColor = 'blue' | 'green' | 'purple' | 'gray' | 'red' | 'yellow' | 'orange' | 'pink';

export default function SnippetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: snippet, isLoading } = trpc.snippet.getById.useQuery({ id });
  const { data: similar } = trpc.search.similar.useQuery(
    { snippetId: id },
    { enabled: !!snippet },
  );

  const toggleFavorite = trpc.snippet.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.snippet.getById.invalidate({ id });
    },
  });

  const deleteSnippet = trpc.snippet.delete.useMutation({
    onSuccess: () => {
      router.push('/library');
    },
  });

  const handleCopy = async () => {
    const file = snippet?.files[0];
    if (file) {
      await navigator.clipboard.writeText(file.content);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      deleteSnippet.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="h-4 bg-gray-800 rounded w-1/2" />
          <div className="h-96 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-gray-500">Snippet not found.</p>
        <Link href="/library" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
          Back to Library
        </Link>
      </div>
    );
  }

  const file = snippet.files[0];
  const tagList = snippet.snippetTags.map((st) => st.tag);
  const aiTags = snippet.snippetTags.filter((st) => st.source === 'ai').map((st) => st.tag);
  const manualTags = snippet.snippetTags.filter((st) => st.source === 'manual').map((st) => st.tag);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{snippet.title}</h1>
            <button
              onClick={() => toggleFavorite.mutate({ id })}
              className="shrink-0"
            >
              <svg
                className={`w-5 h-5 ${snippet.isFavorite ? 'text-yellow-500' : 'text-gray-600 hover:text-gray-400'}`}
                fill={snippet.isFavorite ? 'currentColor' : 'none'}
                viewBox="0 0 20 20"
                stroke="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>
          {snippet.description && (
            <p className="text-gray-400 text-sm">{snippet.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy
          </Button>
          <Link href={`/snippets/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
          </Link>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {snippet.language && <Badge color="blue">{snippet.language}</Badge>}
        {manualTags.map((tag) => (
          <Badge key={tag.id} color={(tag.color || 'gray') as BadgeColor}>
            {tag.name}
          </Badge>
        ))}
        {aiTags.map((tag) => (
          <Badge key={tag.id} color={(tag.color || 'gray') as BadgeColor}>
            {tag.name}
            <span className="ml-1 opacity-50 text-[10px]">AI</span>
          </Badge>
        ))}
      </div>

      {/* Code Editor */}
      {file && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{file.filename}</span>
          </div>
          <CodeEditor
            value={file.content}
            language={file.language ?? snippet.language ?? undefined}
            readOnly
            height="500px"
          />
        </div>
      )}

      {/* Metadata */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Language</p>
              <p className="text-white">{snippet.language || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-500">Created</p>
              <p className="text-white">
                {new Date(snippet.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Last Accessed</p>
              <p className="text-white">
                {snippet.lastAccessedAt
                  ? new Date(snippet.lastAccessedAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Access Count</p>
              <p className="text-white">{snippet.accessCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Similar Snippets */}
      {similar && similar.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Similar Snippets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {similar.map((s) => (
              <Link
                key={s.snippetId}
                href={`/snippets/${s.snippetId}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-white truncate flex-1">
                    {s.title}
                  </h3>
                  {s.language && <Badge color="blue">{s.language}</Badge>}
                </div>
                <CodePreview code={s.content} language={s.language} maxLines={3} />
                <p className="text-xs text-gray-600 mt-2">
                  {(s.similarityScore * 100).toFixed(0)}% similar
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
