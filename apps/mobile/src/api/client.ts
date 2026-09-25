import {
  type ApiResponse,
  contract,
  type DevicesResponse,
  type InitializePaymentRequest,
  type LabTokenResponse,
  type LoginRequest,
  type LoginResponse,
  type LogoutResponse,
  type MySessionsResponse,
  type PreferencesResponse,
  type SignupRequest,
  type SignupResponse,
  type VerifyPaymentResponse,
} from '@mojo/shared/api-contract';
import Constants from 'expo-constants';

/**
 * Derives the hub URL for a dev phone: Expo Go serves the bundle from the
 * dev machine's LAN IP (`hostUri`), and hub runs on :3003 next to it.
 */
export function defaultHubUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.split(':')[0] ?? '';
    if (host !== '') {
      return `http://${host}:3003`;
    }
  }
  return 'http://127.0.0.1:3003';
}

/** Typed fetch wrapper over the hub REST contract (Bearer token auth). */
export class HubClient {
  constructor(
    private readonly hubUrl: string,
    private readonly getToken: () => string | null,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const response = await fetch(`${this.hubUrl}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(token !== null ? { authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    return (await response.json()) as ApiResponse<T>;
  }

  login(body: LoginRequest): Promise<LoginResponse> {
    return this.request(contract.login, { method: 'POST', body: JSON.stringify(body) });
  }

  signup(body: SignupRequest): Promise<SignupResponse> {
    return this.request(contract.signup, { method: 'POST', body: JSON.stringify(body) });
  }

  logout(): Promise<LogoutResponse> {
    return this.request(contract.logout, { method: 'POST' });
  }

  mySessions(): Promise<MySessionsResponse> {
    return this.request(contract.mySessions);
  }

  labToken(sessionId: string): Promise<LabTokenResponse> {
    return this.request(contract.labToken(sessionId), { method: 'POST' });
  }

  devices(): Promise<DevicesResponse> {
    return this.request(contract.devices);
  }

  registerDevice(
    token: string,
    platform: 'ios' | 'android',
  ): Promise<ApiResponse<Record<string, never>>> {
    return this.request(contract.devices, {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }

  unregisterDevice(token: string): Promise<ApiResponse<Record<string, never>>> {
    return this.request(contract.devices, {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  }

  preferences(): Promise<PreferencesResponse> {
    return this.request(contract.preferences);
  }

  initializePayment(body: InitializePaymentRequest): Promise<
    ApiResponse<{
      readonly session: unknown;
      readonly charge: unknown;
      readonly authorizationUrl: string;
    }>
  > {
    return this.request(contract.paymentsInitialize, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    return this.request(contract.paymentsVerify(reference));
  }
}
