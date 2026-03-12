import * as vscode from 'vscode';
import { SnipVaultApiClient } from '../api-client';

/**
 * Save the currently selected code as a SnipVault snippet.
 */
export async function saveSnippet(
  context: vscode.ExtensionContext,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage('No active editor found.');
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  if (!selectedText.trim()) {
    vscode.window.showWarningMessage(
      'Please select some code first, then run this command.',
    );
    return;
  }

  // Prompt for title
  const title = await vscode.window.showInputBox({
    prompt: 'Enter a title for this snippet',
    placeHolder: 'e.g., React useDebounce hook',
    validateInput: (value) => {
      if (!value.trim()) return 'Title is required';
      return null;
    },
  });

  if (!title) return; // User canceled

  // Get language from document
  const language = editor.document.languageId;
  const filename = editor.document.fileName.split('/').pop() || 'snippet';

  const client = new SnipVaultApiClient(context);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Saving snippet to SnipVault...',
      },
      async () => {
        await client.createSnippet({
          title,
          content: selectedText,
          language: language !== 'plaintext' ? language : undefined,
          filename,
          source: 'vscode',
        });
      },
    );

    const action = await vscode.window.showInformationMessage(
      `Snippet "${title}" saved to SnipVault.`,
      'Open in Browser',
    );

    if (action === 'Open in Browser') {
      const config = vscode.workspace.getConfiguration('snipvault');
      const apiUrl = config.get<string>('apiUrl') || 'https://snipvault.dev';
      vscode.env.openExternal(vscode.Uri.parse(`${apiUrl}/library`));
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to save snippet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
