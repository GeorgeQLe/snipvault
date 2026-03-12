import * as vscode from 'vscode';
import { SnipVaultApiClient } from '../api-client';

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  content: string;
}

/**
 * Search snippets using a QuickPick interface with search-as-you-type.
 */
export async function searchSnippets(
  context: vscode.ExtensionContext,
): Promise<void> {
  const client = new SnipVaultApiClient(context);

  const quickPick = vscode.window.createQuickPick();
  quickPick.placeholder = 'Search your snippets...';
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let results: SearchResult[] = [];

  quickPick.onDidChangeValue((value) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (value.length < 2) {
      quickPick.items = [];
      return;
    }

    quickPick.busy = true;

    debounceTimer = setTimeout(async () => {
      try {
        const response = await client.searchSnippets(value);
        results = response.results;

        quickPick.items = results.map((result) => ({
          label: result.title,
          description: result.language ?? undefined,
          detail: result.description ?? result.content.slice(0, 100),
          id: result.id,
        }));
      } catch {
        quickPick.items = [
          {
            label: 'Search failed',
            description: 'Please try again',
          },
        ];
      } finally {
        quickPick.busy = false;
      }
    }, 300);
  });

  quickPick.onDidAccept(async () => {
    const selected = quickPick.selectedItems[0];
    if (!selected) return;

    const matchedResult = results.find((r) => r.title === selected.label);
    if (!matchedResult) return;

    quickPick.hide();

    // Ask what to do with the snippet
    const action = await vscode.window.showQuickPick(
      [
        { label: 'Insert at Cursor', description: 'Insert the snippet at the current cursor position' },
        { label: 'Copy to Clipboard', description: 'Copy the snippet to clipboard' },
        { label: 'Open in New Tab', description: 'Open the snippet in a new editor tab' },
      ],
      { placeHolder: 'What would you like to do with this snippet?' },
    );

    if (!action) return;

    const content = matchedResult.content;

    switch (action.label) {
      case 'Insert at Cursor': {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, content);
          });
        }
        break;
      }
      case 'Copy to Clipboard': {
        await vscode.env.clipboard.writeText(content);
        vscode.window.showInformationMessage('Snippet copied to clipboard.');
        break;
      }
      case 'Open in New Tab': {
        const document = await vscode.workspace.openTextDocument({
          content,
          language: matchedResult.language || undefined,
        });
        await vscode.window.showTextDocument(document);
        break;
      }
    }
  });

  quickPick.onDidHide(() => {
    quickPick.dispose();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  quickPick.show();
}
