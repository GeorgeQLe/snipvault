'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { CodeEditor } from '@/components/editor/code-editor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getSupportedLanguages } from '@/lib/language-detection';

export default function EditSnippetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: snippet, isLoading } = trpc.snippet.getById.useQuery({ id });
  const { data: collections } = trpc.collection.list.useQuery();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [content, setContent] = useState('');
  const [collectionId, setCollectionId] = useState('');

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setDescription(snippet.description ?? '');
      setLanguage(snippet.language ?? '');
      setContent(snippet.files[0]?.content ?? '');
      setCollectionId(snippet.collectionId ?? '');
    }
  }, [snippet]);

  const updateSnippet = trpc.snippet.update.useMutation({
    onSuccess: () => {
      router.push(`/snippets/${id}`);
    },
  });

  const languages = getSupportedLanguages();
  const collectionOptions = (collections ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateSnippet.mutate({
      id,
      title: title.trim(),
      description: description.trim() || undefined,
      language: language || undefined,
      content,
      collectionId: collectionId || null,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="h-96 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-gray-500">Snippet not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Snippet</h1>
        <p className="text-gray-500 mt-1">Update your code snippet.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Snippet title"
            required
          />
          <Select
            id="language"
            label="Language"
            options={languages}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Auto-detect"
          />
        </div>

        <Textarea
          id="description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
          <CodeEditor
            value={content}
            language={language}
            onChange={(val) => setContent(val)}
            height="500px"
          />
        </div>

        <Select
          id="collection"
          label="Collection"
          options={collectionOptions}
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          placeholder="No collection"
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={updateSnippet.isPending || !title.trim()}>
            {updateSnippet.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {updateSnippet.isError && (
          <p className="text-sm text-red-400">
            Failed to update snippet. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
