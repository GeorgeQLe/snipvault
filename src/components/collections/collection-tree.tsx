'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
  snippetCount: number;
}

interface CollectionTreeProps {
  collections: TreeNode[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function CollectionTree({
  collections,
  activeId,
  onSelect,
  className = '',
}: CollectionTreeProps) {
  return (
    <div className={`space-y-0.5 ${className}`}>
      {collections.map((collection) => (
        <CollectionNode
          key={collection.id}
          node={collection}
          activeId={activeId}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}

interface CollectionNodeProps {
  node: TreeNode;
  activeId?: string;
  onSelect?: (id: string) => void;
  depth: number;
}

function CollectionNode({ node, activeId, onSelect, depth }: CollectionNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = activeId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${
          isActive
            ? 'bg-gray-800 text-white'
            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect?.(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center shrink-0"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <svg className="w-4 h-4 shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="text-sm truncate flex-1">{node.name}</span>
        {node.snippetCount > 0 && (
          <span className="text-xs text-gray-600 shrink-0">{node.snippetCount}</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <CollectionNode
              key={child.id}
              node={child}
              activeId={activeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
