'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

interface CodePreviewProps {
  code: string;
  language?: string | null;
  maxLines?: number;
  className?: string;
}

export function CodePreview({
  code,
  language,
  maxLines = 6,
  className = '',
}: CodePreviewProps) {
  const [html, setHtml] = useState<string>('');

  const truncatedCode = code
    .split('\n')
    .slice(0, maxLines)
    .join('\n');

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const highlighted = await codeToHtml(truncatedCode, {
          lang: language || 'text',
          theme: 'github-dark-default',
        });

        if (!cancelled) {
          setHtml(highlighted);
        }
      } catch {
        // Fallback: render as plain text
        if (!cancelled) {
          setHtml('');
        }
      }
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [truncatedCode, language]);

  if (!html) {
    return (
      <pre className={`text-xs text-gray-400 font-mono bg-gray-950 p-3 rounded-lg overflow-hidden ${className}`}>
        <code>{truncatedCode}</code>
      </pre>
    );
  }

  return (
    <div
      className={`text-xs font-mono rounded-lg overflow-hidden [&_pre]:!bg-gray-950 [&_pre]:!p-3 [&_pre]:!m-0 [&_code]:!text-xs ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
