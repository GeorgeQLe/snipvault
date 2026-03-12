// ── Extension → Language mapping ───────────────────────────────────────────────

const extensionMap: Record<string, string> = {
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.tsx': 'tsx',
  '.py': 'python',
  '.pyw': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cxx': 'cpp',
  '.cc': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.sql': 'sql',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'scss',
  '.less': 'less',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.fish': 'bash',
  '.dockerfile': 'dockerfile',
  '.xml': 'xml',
  '.svg': 'xml',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.lua': 'lua',
  '.r': 'r',
  '.R': 'r',
  '.dart': 'dart',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.erl': 'erlang',
  '.hs': 'haskell',
  '.scala': 'scala',
  '.clj': 'clojure',
  '.pl': 'perl',
  '.tf': 'hcl',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.proto': 'protobuf',
  '.zig': 'zig',
};

// ── Shebang → Language mapping ────────────────────────────────────────────────

const shebangMap: Record<string, string> = {
  node: 'javascript',
  deno: 'typescript',
  python: 'python',
  python3: 'python',
  ruby: 'ruby',
  bash: 'bash',
  sh: 'bash',
  zsh: 'bash',
  perl: 'perl',
  php: 'php',
};

// ── Content heuristic patterns ────────────────────────────────────────────────

interface ContentPattern {
  language: string;
  patterns: RegExp[];
  weight: number;
}

const contentPatterns: ContentPattern[] = [
  {
    language: 'typescript',
    patterns: [
      /^import\s+(?:type\s+)?\{[^}]+\}\s+from\s+['"][^'"]+['"]/m,
      /:\s*(?:string|number|boolean|void|any|unknown|never)\b/,
      /interface\s+\w+\s*\{/,
      /type\s+\w+\s*=\s*/,
      /as\s+(?:string|number|boolean|const)\b/,
      /<\w+(?:\s+extends\s+\w+)?>/,
    ],
    weight: 3,
  },
  {
    language: 'tsx',
    patterns: [
      /:\s*(?:React\.)?(?:FC|ReactNode|JSX\.Element)/,
      /export\s+(?:default\s+)?function\s+\w+\s*\([^)]*:\s*\w+/,
      /useState<\w+>/,
      /return\s*\(\s*</m,
    ],
    weight: 4,
  },
  {
    language: 'javascript',
    patterns: [
      /^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]/m,
      /^const\s+\w+\s*=\s*require\(/m,
      /module\.exports\s*=/,
      /export\s+(?:default|const|function|class)\s/,
      /=>\s*\{/,
    ],
    weight: 2,
  },
  {
    language: 'jsx',
    patterns: [
      /import\s+React/,
      /React\.createElement/,
      /return\s*\(\s*</m,
      /className=/,
    ],
    weight: 3,
  },
  {
    language: 'python',
    patterns: [
      /^(?:from|import)\s+\w+/m,
      /def\s+\w+\s*\([^)]*\)\s*(?:->|:)/,
      /class\s+\w+(?:\([^)]*\))?\s*:/,
      /if\s+__name__\s*==\s*['"]__main__['"]\s*:/,
      /print\s*\(/,
      /self\.\w+/,
    ],
    weight: 3,
  },
  {
    language: 'go',
    patterns: [
      /^package\s+\w+/m,
      /func\s+(?:\(\w+\s+\*?\w+\)\s+)?\w+\s*\(/,
      /import\s+\(/,
      /fmt\.(?:Print|Sprintf|Errorf)/,
      /:=\s/,
    ],
    weight: 3,
  },
  {
    language: 'rust',
    patterns: [
      /^use\s+(?:std|crate|super)::/m,
      /fn\s+\w+\s*(?:<[^>]+>)?\s*\(/,
      /let\s+(?:mut\s+)?\w+/,
      /impl\s+(?:<[^>]+>\s+)?\w+/,
      /println!\s*\(/,
      /(?:pub\s+)?(?:struct|enum|trait)\s+\w+/,
    ],
    weight: 3,
  },
  {
    language: 'java',
    patterns: [
      /^package\s+[\w.]+;/m,
      /public\s+(?:static\s+)?(?:void|class|interface)\s+/,
      /System\.out\.println/,
      /import\s+java\.\w+/,
      /new\s+\w+\s*\(/,
    ],
    weight: 3,
  },
  {
    language: 'c',
    patterns: [
      /^#include\s*<\w+\.h>/m,
      /int\s+main\s*\(/,
      /printf\s*\(/,
      /malloc\s*\(/,
      /typedef\s+(?:struct|enum|union)/,
    ],
    weight: 2,
  },
  {
    language: 'cpp',
    patterns: [
      /^#include\s*<(?:iostream|vector|string|map|algorithm)>/m,
      /std::\w+/,
      /cout\s*<</,
      /namespace\s+\w+/,
      /template\s*<\w+/,
      /class\s+\w+\s*(?::\s*public)?/,
    ],
    weight: 3,
  },
  {
    language: 'csharp',
    patterns: [
      /^using\s+System/m,
      /namespace\s+[\w.]+/,
      /(?:public|private|protected)\s+(?:static\s+)?(?:async\s+)?(?:void|Task|string|int|bool)\s+\w+/,
      /Console\.(?:Write|Read)/,
      /\[(?:HttpGet|HttpPost|Authorize)\]/,
    ],
    weight: 3,
  },
  {
    language: 'ruby',
    patterns: [
      /^require\s+['"][^'"]+['"]/m,
      /def\s+\w+(?:\s*\()?/,
      /class\s+\w+\s*(?:<\s*\w+)?/,
      /puts\s+/,
      /end\s*$/m,
      /\|\w+\|/,
    ],
    weight: 2,
  },
  {
    language: 'php',
    patterns: [
      /^<\?php/m,
      /\$\w+\s*=/,
      /function\s+\w+\s*\(/,
      /echo\s+/,
      /->\w+\s*\(/,
    ],
    weight: 3,
  },
  {
    language: 'swift',
    patterns: [
      /^import\s+(?:Foundation|UIKit|SwiftUI)/m,
      /func\s+\w+\s*\([^)]*\)\s*(?:->\s*\w+)?\s*\{/,
      /var\s+\w+\s*:\s*\w+/,
      /let\s+\w+\s*=\s*/,
      /guard\s+let\s+/,
      /struct\s+\w+\s*:\s*\w+/,
    ],
    weight: 3,
  },
  {
    language: 'kotlin',
    patterns: [
      /^package\s+[\w.]+/m,
      /fun\s+\w+\s*\(/,
      /val\s+\w+\s*[=:]/,
      /var\s+\w+\s*[=:]/,
      /data\s+class\s+\w+/,
      /println\s*\(/,
    ],
    weight: 3,
  },
  {
    language: 'sql',
    patterns: [
      /^(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/im,
      /FROM\s+\w+/i,
      /WHERE\s+\w+/i,
      /JOIN\s+\w+/i,
      /GROUP\s+BY/i,
    ],
    weight: 3,
  },
  {
    language: 'html',
    patterns: [
      /^<!DOCTYPE\s+html/im,
      /<html[\s>]/i,
      /<(?:head|body|div|span|p|h[1-6])[\s>]/i,
    ],
    weight: 4,
  },
  {
    language: 'css',
    patterns: [
      /^[\w.#\[\]:,\s]+\{[\s\S]*?[\w-]+\s*:\s*[^;]+;/m,
      /@media\s+/,
      /@keyframes\s+/,
      /(?:margin|padding|display|color|background|font-size)\s*:/,
    ],
    weight: 2,
  },
  {
    language: 'scss',
    patterns: [
      /\$\w+\s*:/,
      /@mixin\s+\w+/,
      /@include\s+\w+/,
      /&\.\w+/,
      /&:(?:hover|focus)/,
    ],
    weight: 3,
  },
  {
    language: 'json',
    patterns: [/^\s*\{[\s\S]*"[^"]+"\s*:/m, /^\s*\[[\s\S]*\{/m],
    weight: 1,
  },
  {
    language: 'yaml',
    patterns: [
      /^\w+:\s*$/m,
      /^\s+-\s+\w+/m,
      /^\w+:\s+\w+/m,
    ],
    weight: 1,
  },
  {
    language: 'toml',
    patterns: [
      /^\[\w+\]/m,
      /^\w+\s*=\s*"[^"]*"/m,
      /^\[\[?\w+(?:\.\w+)*\]?\]/m,
    ],
    weight: 2,
  },
  {
    language: 'markdown',
    patterns: [
      /^#{1,6}\s+\w/m,
      /^\*{3,}$/m,
      /\[.+\]\(.+\)/,
      /```\w+/,
    ],
    weight: 1,
  },
  {
    language: 'bash',
    patterns: [
      /^#!/m,
      /^\s*(?:if|then|else|fi|for|do|done|while|case|esac)\s/m,
      /\$\{\w+\}/,
      /\becho\s+/,
      /\|\s*(?:grep|awk|sed|sort|cut)\b/,
    ],
    weight: 2,
  },
  {
    language: 'dockerfile',
    patterns: [
      /^FROM\s+\w+/m,
      /^RUN\s+/m,
      /^COPY\s+/m,
      /^EXPOSE\s+/m,
      /^ENTRYPOINT\s+/m,
      /^CMD\s+/m,
    ],
    weight: 4,
  },
];

// ── Language display names ────────────────────────────────────────────────────

export const languageDisplayNames: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  less: 'Less',
  json: 'JSON',
  yaml: 'YAML',
  toml: 'TOML',
  markdown: 'Markdown',
  bash: 'Bash',
  dockerfile: 'Dockerfile',
  xml: 'XML',
  vue: 'Vue',
  svelte: 'Svelte',
  lua: 'Lua',
  r: 'R',
  dart: 'Dart',
  elixir: 'Elixir',
  erlang: 'Erlang',
  haskell: 'Haskell',
  scala: 'Scala',
  clojure: 'Clojure',
  perl: 'Perl',
  hcl: 'HCL',
  graphql: 'GraphQL',
  protobuf: 'Protocol Buffers',
  zig: 'Zig',
};

// ── Detection functions ───────────────────────────────────────────────────────

/**
 * Detect language definitively from a file extension.
 */
export function detectFromExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    // Handle special filenames
    const lower = filename.toLowerCase();
    if (lower === 'dockerfile') return 'dockerfile';
    if (lower === 'makefile') return 'makefile';
    if (lower === 'rakefile' || lower === 'gemfile') return 'ruby';
    return null;
  }
  const ext = filename.slice(lastDot).toLowerCase();
  return extensionMap[ext] ?? null;
}

/**
 * Detect language from content heuristics (shebang + pattern matching).
 */
export function detectFromContent(content: string): string | null {
  if (!content || content.trim().length === 0) return null;

  // Check shebang line first
  const firstLine = content.split('\n')[0];
  if (firstLine.startsWith('#!')) {
    for (const [interpreter, language] of Object.entries(shebangMap)) {
      if (firstLine.includes(interpreter)) {
        return language;
      }
    }
  }

  // Score each language by pattern matches
  const scores: Record<string, number> = {};
  for (const { language, patterns, weight } of contentPatterns) {
    let matchCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      scores[language] = (scores[language] ?? 0) + matchCount * weight;
    }
  }

  // Return highest scoring language
  let bestLanguage: string | null = null;
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLanguage = lang;
    }
  }

  // Require a minimum score threshold
  return bestScore >= 3 ? bestLanguage : null;
}

/**
 * Detect language using all available signals.
 * Priority: extension (definitive) > content heuristics > null
 */
export function detectLanguage(
  content: string,
  filename?: string,
): string | null {
  if (filename) {
    const extLang = detectFromExtension(filename);
    if (extLang) return extLang;
  }

  return detectFromContent(content);
}

/**
 * Get supported languages for UI dropdowns.
 */
export function getSupportedLanguages(): Array<{ value: string; label: string }> {
  return Object.entries(languageDisplayNames)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
