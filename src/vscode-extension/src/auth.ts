import * as vscode from 'vscode';
import { SnipVaultApiClient } from './api-client';

const TOKEN_KEY = 'snipvault.token';

/**
 * Check if the user is authenticated.
 */
export async function isAuthenticated(
  context: vscode.ExtensionContext,
): Promise<boolean> {
  const token = await context.secrets.get(TOKEN_KEY);
  return !!token;
}

/**
 * Get the stored auth token.
 */
export async function getToken(
  context: vscode.ExtensionContext,
): Promise<string | undefined> {
  return context.secrets.get(TOKEN_KEY);
}

/**
 * Authenticate using device code flow.
 *
 * 1. Request a device code from the server
 * 2. Open the browser to the auth page
 * 3. Poll for authentication completion
 * 4. Store the token in SecretStorage
 */
export async function authenticate(
  context: vscode.ExtensionContext,
): Promise<boolean> {
  const client = new SnipVaultApiClient(context);

  try {
    // Step 1: Generate device code
    const { code, expiresAt } = await client.generateDeviceCode();

    // Step 2: Show the code and open browser
    const apiUrl = getApiUrl();
    const authUrl = `${apiUrl}/auth/device`;

    const action = await vscode.window.showInformationMessage(
      `Your device code is: ${code}\n\nEnter this code on the SnipVault website to sign in.`,
      'Open Browser',
      'Copy Code',
    );

    if (action === 'Open Browser') {
      vscode.env.openExternal(vscode.Uri.parse(authUrl));
    } else if (action === 'Copy Code') {
      await vscode.env.clipboard.writeText(code);
      vscode.env.openExternal(vscode.Uri.parse(authUrl));
    }

    // Step 3: Poll for authentication
    const expiryTime = new Date(expiresAt).getTime();

    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Waiting for authentication...',
        cancellable: true,
      },
      async (progress, cancellationToken) => {
        while (Date.now() < expiryTime) {
          if (cancellationToken.isCancellationRequested) {
            return false;
          }

          await sleep(3000);

          try {
            const result = await client.pollDeviceCode(code);

            if (result.status === 'authenticated' && result.token) {
              // Step 4: Store token
              await context.secrets.store(TOKEN_KEY, result.token);

              vscode.window.showInformationMessage(
                'Successfully signed in to SnipVault!',
              );
              return true;
            }
          } catch {
            // Continue polling
          }
        }

        vscode.window.showErrorMessage(
          'Authentication timed out. Please try again.',
        );
        return false;
      },
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return false;
  }
}

/**
 * Sign out by removing the stored token.
 */
export async function signOut(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(TOKEN_KEY);
  vscode.window.showInformationMessage('Signed out of SnipVault.');
}

function getApiUrl(): string {
  const config = vscode.workspace.getConfiguration('snipvault');
  return config.get<string>('apiUrl') || 'https://snipvault.dev';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
