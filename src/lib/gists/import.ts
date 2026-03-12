export interface GistPreview {
  id: string;
  description: string | null;
  files: Array<{
    filename: string;
    language: string | null;
    size: number;
    raw_url: string;
  }>;
  createdAt: string;
  updatedAt: string;
  public: boolean;
}

interface GitHubGistFile {
  filename: string;
  language: string | null;
  size: number;
  raw_url: string;
  content?: string;
}

interface GitHubGist {
  id: string;
  description: string | null;
  files: Record<string, GitHubGistFile>;
  created_at: string;
  updated_at: string;
  public: boolean;
}

/**
 * Fetch all gists for a user via GitHub API using a personal access token.
 */
export async function fetchGists(token: string): Promise<GistPreview[]> {
  const allGists: GistPreview[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/gists?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid GitHub token. Please check your personal access token.');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const gists: GitHubGist[] = await response.json();

    if (gists.length === 0) break;

    for (const gist of gists) {
      allGists.push({
        id: gist.id,
        description: gist.description,
        files: Object.values(gist.files).map((f) => ({
          filename: f.filename,
          language: f.language?.toLowerCase() ?? null,
          size: f.size,
          raw_url: f.raw_url,
        })),
        createdAt: gist.created_at,
        updatedAt: gist.updated_at,
        public: gist.public,
      });
    }

    if (gists.length < perPage) break;
    page++;
  }

  return allGists;
}

/**
 * Fetch the raw content of a single gist file.
 */
export async function fetchGistFileContent(rawUrl: string, token: string): Promise<string> {
  const response = await fetch(rawUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3.raw',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch gist file: ${response.status}`);
  }

  return response.text();
}
