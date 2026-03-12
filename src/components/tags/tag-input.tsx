'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';

type BadgeColor = 'blue' | 'green' | 'purple' | 'gray' | 'red' | 'yellow' | 'orange' | 'pink';

interface TagItem {
  id: string;
  name: string;
  color: string;
}

interface TagInputProps {
  selectedTags: TagItem[];
  onTagsChange: (tags: TagItem[]) => void;
  className?: string;
}

export function TagInput({ selectedTags, onTagsChange, className = '' }: TagInputProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults } = trpc.tag.search.useQuery(
    { query },
    { enabled: query.length > 0 },
  );

  const createTag = trpc.tag.create.useMutation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = (searchResults ?? []).filter(
    (tag) => !selectedTags.some((t) => t.id === tag.id),
  );

  const addTag = (tag: TagItem) => {
    onTagsChange([...selectedTags, tag]);
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!query.trim()) return;

    const tag = await createTag.mutateAsync({
      name: query.trim(),
      color: 'gray',
    });

    addTag({ id: tag.id, name: tag.name, color: tag.color });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && query === '' && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1].id);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        addTag(suggestions[0]);
      } else if (query.trim()) {
        handleCreateTag();
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {selectedTags.map((tag) => (
          <Badge key={tag.id} color={(tag.color || 'gray') as BadgeColor}>
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="ml-1 hover:text-white"
            >
              x
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[100px] bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none"
          placeholder={selectedTags.length === 0 ? 'Add tags...' : ''}
        />
      </div>

      {showSuggestions && query.length > 0 && (
        <div className="absolute z-10 top-full mt-1 w-full bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
          {suggestions.length > 0 ? (
            suggestions.slice(0, 8).map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                onClick={() => addTag(tag)}
              >
                <Badge color={(tag.color || 'gray') as BadgeColor}>{tag.name}</Badge>
              </button>
            ))
          ) : (
            <button
              type="button"
              className="w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors text-left"
              onClick={handleCreateTag}
            >
              Create tag &quot;{query}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
