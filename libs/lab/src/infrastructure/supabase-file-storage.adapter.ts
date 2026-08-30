import type { FileStorageProvider } from '../domain/lab.types';

/**
 * Uploads a shared file to a Supabase Storage bucket scoped per session.
 * Only this adapter and its bucket policy need to change if the storage
 * backend ever moves — LabFilePanel (feature/) only knows FileStorageProvider.
 */
export class SupabaseFileStorageProvider implements FileStorageProvider {
  constructor(
    private readonly supabaseUrl: string,
    private readonly serviceRoleKey: string,
    private readonly bucket = 'lab-shared-files',
  ) {}

  async upload(input: {
    sessionId: string;
    file: Blob;
    fileName: string;
  }): Promise<{ url: string; sizeBytes: number }> {
    const path = `${input.sessionId}/${Date.now()}-${input.fileName}`;

    const response = await fetch(`${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': input.file.type || 'application/octet-stream',
      },
      body: input.file,
    });

    if (!response.ok) {
      throw new Error(`Supabase Storage upload failed with status ${response.status}`);
    }

    return {
      url: `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${path}`,
      sizeBytes: input.file.size,
    };
  }
}
