import type { ContractUser, SessionSummary } from '@mojo/shared/api-contract';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Sessions: undefined;
  SessionDetail: { readonly session: SessionSummary };
  LabRoom: { readonly sessionId: string };
  /** `reference` arrives when the app cold-starts from a mojo:// payment callback. */
  Checkout: { readonly reference?: string };
};

export interface AuthState {
  readonly token: string;
  readonly user: ContractUser;
  readonly hubUrl: string;
}
