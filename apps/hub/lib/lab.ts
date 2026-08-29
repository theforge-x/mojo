import type { FileStorageProvider } from '@mojo/lab/domain';
import { SupabaseFileStorageProvider } from '@mojo/lab/infrastructure';

// Demo fallback: files stay in the browser as object URLs (client-only use).
export function fileStorage(): FileStorageProvider {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseFileStorageProvider(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return {
    async upload(input) {
      const url = URL.createObjectURL(input.file);
      return { url, sizeBytes: input.file.size };
    },
  };
}
