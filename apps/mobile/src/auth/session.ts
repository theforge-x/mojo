import * as SecureStore from 'expo-secure-store';
import type { ContractUser } from '@mojo/shared/api-contract';

const TOKEN_KEY = 'mojo.auth.token';
const USER_KEY = 'mojo.auth.user';

export interface StoredSession {
  readonly token: string;
  readonly user: ContractUser;
}

export async function loadSession(): Promise<StoredSession | null> {
  const [token, rawUser] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);
  if (token === null || rawUser === null) {
    return null;
  }
  try {
    return { token, user: JSON.parse(rawUser) as ContractUser };
  } catch {
    await clearSession();
    return null;
  }
}

export async function saveSession(token: string, user: ContractUser): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearSession(): Promise<void> {
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
}
