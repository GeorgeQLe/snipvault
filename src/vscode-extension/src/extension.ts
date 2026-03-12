import * as vscode from 'vscode';
import { authenticate, isAuthenticated } from './auth';
import { saveSnippet } from './commands/save-snippet';
import { searchSnippets } from './commands/search';

export function activate(context: vscode.ExtensionContext) {
  console.log('SnipVault extension is now active');

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('snipvault.authenticate', () =>
      authenticate(context),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('snipvault.saveSnippet', async () => {
      if (!(await isAuthenticated(context))) {
        const action = await vscode.window.showWarningMessage(
          'You need to sign in to SnipVault first.',
          'Sign In',
        );
        if (action === 'Sign In') {
          await authenticate(context);
        }
        return;
      }
      await saveSnippet(context);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('snipvault.searchSnippets', async () => {
      if (!(await isAuthenticated(context))) {
        const action = await vscode.window.showWarningMessage(
          'You need to sign in to SnipVault first.',
          'Sign In',
        );
        if (action === 'Sign In') {
          await authenticate(context);
        }
        return;
      }
      await searchSnippets(context);
    }),
  );

  // Show status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.text = '$(code) SnipVault';
  statusBarItem.command = 'snipvault.searchSnippets';
  statusBarItem.tooltip = 'Search SnipVault snippets';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {
  // Cleanup
}
