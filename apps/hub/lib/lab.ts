import type { FileStorageProvider } from '@mojo/lab/domain';

/** Only runs in the browser: object URLs keep the demo working with no infra. */

export function createClientFileStorage(): FileStorageProvider {
  return {
    async upload(input) {
      const url = URL.createObjectURL(input.file);
      return { url, sizeBytes: input.file.size };
    },
  };
}
