import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { HubClient } from '../api/client';

export type PushRegistration =
  | { readonly registered: true }
  | { readonly registered: false; readonly reason: string };

/**
 * Registers this device's Expo push token with the hub so lesson reminders
 * addressed to the `push` channel reach the phone. Best-effort: emulators
 * and denied permissions resolve to a reason, never a throw.
 */
export async function registerPushToken(client: HubClient): Promise<PushRegistration> {
  if (!Device.isDevice) {
    return { registered: false, reason: 'Push needs a physical device.' };
  }
  const permission = await Notifications.getPermissionsAsync();
  const granted =
    permission.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) {
    return { registered: false, reason: 'Push permission denied.' };
  }
  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch {
    return { registered: false, reason: 'Could not read the Expo push token.' };
  }
  const response = await client.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
  if (!response.ok) {
    return { registered: false, reason: response.error };
  }
  return { registered: true };
}
