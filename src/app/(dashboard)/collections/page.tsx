'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { CollectionTree } from '@/components/collections/collection-tree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function CollectionsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: tree, isLoading } = trpc.collection.tree.useQuery();
  const { data: flatList } = trpc.collection.list.useQuery();

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');

  const createCollection = trpc.collection.create.useMutation({
    onSuccess: () => {
      utils.collection.tree.invalidate();
      utils.collection.list.invalidate();
      setShowCreate(false);
      resetForm();
    },
  });

  const updateCollection = trpc.collection.update.useMutation({
    onSuccess: () => {
      utils.collection.tree.invalidate();
      utils.collection.list.invalidate();
      setEditId(null);
      resetForm();
    },
  });

  const deleteCollection = trpc.collection.delete.useMutation({
    onSuccess: () => {
      utils.collection.tree.invalidate();
      utils.collection.list.invalidate();
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setParentId('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCollection.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      parentId: parentId || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    updateCollection.mutate({
      id: editId,
      name: name.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  const startEdit = (id: string) => {
    const collection = flatList?.find((c) => c.id === id);
    if (collection) {
      setEditId(id);
      setName(collection.name);
      setDescription(collection.description ?? '');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this collection? Snippets will be unlinked, not deleted.')) {
      deleteCollection.mutate({ id });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Collections</h1>
          <p className="text-gray-500 mt-1">Organize your snippets into collections.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Collection
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : tree && tree.length > 0 ? (
        <Card>
          <CardContent>
            <CollectionTree
              collections={tree}
              onSelect={(id) => router.push(`/library?collection=${id}`)}
            />
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
              {flatList?.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-300">{c.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(c.id)}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id)}
                    >
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16">
          <svg
            className="w-12 h-12 text-gray-700 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-gray-500">No collections yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first collection to organize snippets.</p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }}>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <h2 className="text-lg font-semibold text-white">New Collection</h2>
          </DialogHeader>
          <DialogContent className="space-y-4">
            <Input
              id="name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collection name"
              required
            />
            <Textarea
              id="description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => { setShowCreate(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCollection.isPending || !name.trim()}>
              {createCollection.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onClose={() => { setEditId(null); resetForm(); }}>
        <form onSubmit={handleUpdate}>
          <DialogHeader>
            <h2 className="text-lg font-semibold text-white">Edit Collection</h2>
          </DialogHeader>
          <DialogContent className="space-y-4">
            <Input
              id="edit-name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collection name"
              required
            />
            <Textarea
              id="edit-description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </DialogContent>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => { setEditId(null); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCollection.isPending || !name.trim()}>
              {updateCollection.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
