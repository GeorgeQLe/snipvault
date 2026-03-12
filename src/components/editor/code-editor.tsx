'use client';

import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

// Map our language IDs to Monaco language IDs
const monacoLanguageMap: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
  sql: 'sql',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  yaml: 'yaml',
  markdown: 'markdown',
  bash: 'shell',
  dockerfile: 'dockerfile',
  xml: 'xml',
};

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = '400px',
  className = '',
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (onChange && val !== undefined) {
        onChange(val);
      }
    },
    [onChange],
  );

  const monacoLang = language ? (monacoLanguageMap[language] || language) : 'plaintext';

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-800 ${className}`}>
      <Editor
        height={height}
        language={monacoLang}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          renderWhitespace: 'selection',
          tabSize: 2,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          contextmenu: false,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
