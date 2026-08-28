export interface LabAccess {
  readonly roomName: string;
  readonly serverUrl: string;
  readonly participantToken: string;
  readonly expiresAt: string;
}

export interface LabProvider {
  createAccess(input: { sessionId: string; participantId: string; participantName: string }): Promise<LabAccess>;
}
