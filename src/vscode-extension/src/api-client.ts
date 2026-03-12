import * as vscode from 'vscode';

interface DeviceCodeResponse {
  code: string;
  expiresAt: string;
}

interface PollResponse {
  status: 'pending' | 'authenticated';
  token?: string;
  userId?: string;
}

interface CreateSnippetRequest {
  title: string;
  content: string;
  language?: string;
  filename?: string;
  source: 'vscode';
}

interface SnippetResult {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  content: string;
}

interface SearchResponse {
  results: SnippetResult[];
}

export class SnipVaultApiClient {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private get baseUrl(): string {
    const config = vscode.workspace.getConfiguration('snipvault');
    return config.get<string>('apiUrl') || 'https://snipvault.dev';
  }

  private async getToken(): Promise<string | undefined> {
    return this.context.secrets.get('snipvault.token');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Generate a device code for authentication.
   */
  async generateDeviceCode(): Promise<DeviceCodeResponse> {
    return this.request<DeviceCodeResponse>('/api/auth/device-code', {
      method: 'POST',
    });
  }

  /**
   * Poll for device code authentication status.
   */
  async pollDeviceCode(code: string): Promise<PollResponse> {
    return this.request<PollResponse>(
      `/api/auth/device-code?code=${encodeURIComponent(code)}`,
    );
  }

  /**
   * Create a new snippet.
   */
  async createSnippet(data: CreateSnippetRequest): Promise<{ id: string }> {
    return this.request<{ id: string }>('/api/trpc/snippet.create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Search snippets.
   */
  async searchSnippets(query: string): Promise<SearchResponse> {
    return this.request<SearchResponse>(
      `/api/trpc/search.search?input=${encodeURIComponent(
        JSON.stringify({ json: { query } }),
      )}`,
    );
  }
}
