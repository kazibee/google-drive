import { createAuthClient, type Env } from './auth';
import { createDriveClient } from './drive-client';

export type { Env } from './auth';
export type {
  DownloadOptions,
  DownloadResult,
  DriveFile,
  MoveFileOptions,
  UploadOptions,
} from './drive-client';

export default function main(env: Env) {
  const auth = createAuthClient(env);
  return createDriveClient(auth);
}
