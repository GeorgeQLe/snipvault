'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { CodeEditor } from '@/components/editor/code-editor';
import { TagInput } from '@/components/tags/tag-input';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getSupportedLanguages } from '@/lib/language-detection';

export default function NewSnippetPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [content, setContent] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [selectedTags, setSelectedTags] = useState<Array<{ id: string; name: string; color: string }>>([]);

  const { data: collections } = trpc.collection.list.useQuery();
  const createSnippet = trpc.snippet.create.useMutation({
    onSuccess: (snippet) => {
      router.push(`/snippets/${snippet.id}`);
    },
  });

  const languages = getSupportedLanguages();
  const collectionOptions = (collections ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createSnippet.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      language: language || undefined,
      content,
      collectionId: collectionId || undefined,
      tagIds: selectedTags.map((t) => t.id),
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Snippet</h1>
        <p className="text-gray-500 mt-1">Create a new code snippet.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., React useDebounce hook"
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
          placeholder="Optional description (AI will auto-generate if left blank)"
          rows={2}
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
          <CodeEditor
            value={content}
            language={language}
            onChange={(val) => setContent(val)}
            height="400px"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="collection"
            label="Collection"
            options={collectionOptions}
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            placeholder="No collection"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
            <TagInput selectedTags={selectedTags} onTagsChange={setSelectedTags} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={createSnippet.isPending || !title.trim() || !content.trim()}>
            {createSnippet.isPending ? 'Creating...' : 'Create Snippet'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {createSnippet.isError && (
          <p className="text-sm text-red-400">
            Failed to create snippet. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
