'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GistPreview {
  id: string;
  description: string | null;
  files: Array<{
    filename: string;
    language: string | null;
    size: number;
    raw_url: string;
  }>;
  createdAt: string;
  public: boolean;
}

export default function ImportPage() {
  const [token, setToken] = useState('');
  const [gists, setGists] = useState<GistPreview[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: number;
  } | null>(null);

  const fetchGists = async () => {
    if (!token.trim()) return;

    setLoading(true);
    setError('');
    setGists([]);
    setSelected(new Set());

    try {
      const response = await fetch(`/api/gists?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch gists');
      }

      setGists(data.gists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === gists.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(gists.map((g) => g.id)));
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;

    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const selectedGists = gists
        .filter((g) => selected.has(g.id))
        .map((g) => ({
          id: g.id,
          description: g.description,
          files: g.files.map((f) => ({
            filename: f.filename,
            language: f.language,
            raw_url: f.raw_url,
          })),
        }));

      const response = await fetch('/api/gists/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, gists: selectedGists }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import gists');
      }

      setImportResult({
        imported: data.imported.length,
        errors: data.errors.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Import from GitHub Gists</h1>
        <p className="text-gray-500 mt-1">
          Import your existing GitHub Gists as SnipVault snippets.
        </p>
      </div>

      {/* Token Input */}
      <Card>
        <CardContent className="space-y-4">
          <div>
            <Input
              id="token"
              label="GitHub Personal Access Token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
            />
            <p className="text-xs text-gray-600 mt-1">
              Create a token at github.com/settings/tokens with the &quot;gist&quot; scope.
            </p>
          </div>
          <Button onClick={fetchGists} disabled={loading || !token.trim()}>
            {loading ? 'Fetching gists...' : 'Fetch Gists'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {importResult && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-sm text-green-400">
            Successfully imported {importResult.imported} gist{importResult.imported !== 1 ? 's' : ''}.
            {importResult.errors > 0 && ` ${importResult.errors} failed.`}
          </p>
        </div>
      )}

      {/* Gists List */}
      {gists.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                {selected.size === gists.length ? 'Deselect all' : 'Select all'}
              </button>
              <span className="text-sm text-gray-600">
                {selected.size} of {gists.length} selected
              </span>
            </div>
            <Button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
            >
              {importing
                ? `Importing ${selected.size}...`
                : `Import ${selected.size} gist${selected.size !== 1 ? 's' : ''}`}
            </Button>
          </div>

          <div className="space-y-2">
            {gists.map((gist) => (
              <button
                key={gist.id}
                type="button"
                onClick={() => toggleSelection(gist.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected.has(gist.id)
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    selected.has(gist.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-600'
                  }`}>
                    {selected.has(gist.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {gist.description || gist.files[0]?.filename || `Gist ${gist.id.slice(0, 8)}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {gist.files.map((f) => (
                        <Badge key={f.filename} color="blue">
                          {f.filename}
                        </Badge>
                      ))}
                      <span className="text-xs text-gray-600">
                        {new Date(gist.createdAt).toLocaleDateString()}
                      </span>
                      {gist.public ? (
                        <span className="text-xs text-green-500">public</span>
                      ) : (
                        <span className="text-xs text-gray-500">secret</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
