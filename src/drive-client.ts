import { drive as createDrive, type drive_v3 } from '@googleapis/drive';
import type { OAuth2Client } from 'google-auth-library';

type DriveAPI = drive_v3.Drive;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: string;
  webViewLink: string;
  parents: string[];
}

export interface UploadOptions {
  parentId?: string;
  mimeType?: string;
}

export function createDriveClient(auth: OAuth2Client) {
  const drive = createDrive({ version: 'v3', auth });

  return {
    listFiles: (query?: string, pageSize?: number) => listFiles(drive, query, pageSize),
    getFile: (fileId: string) => getFile(drive, fileId),
    createFolder: (name: string, parentId?: string) => createFolder(drive, name, parentId),
    uploadTextFile: (name: string, content: string, options?: UploadOptions) =>
      uploadTextFile(drive, name, content, options),
    updateTextFile: (fileId: string, content: string, mimeType?: string) =>
      updateTextFile(drive, fileId, content, mimeType),
    downloadTextFile: (fileId: string) => downloadTextFile(drive, fileId),
    deleteFile: (fileId: string) => deleteFile(drive, fileId),
  };
}

async function listFiles(
  drive: DriveAPI,
  query?: string,
  pageSize = 25,
): Promise<DriveFile[]> {
  const res = await drive.files.list({
    q: query,
    pageSize,
    fields:
      'files(id,name,mimeType,modifiedTime,size,webViewLink,parents)',
    orderBy: 'modifiedTime desc',
  });

  return (res.data.files ?? []).map(mapFile);
}

async function getFile(drive: DriveAPI, fileId: string): Promise<DriveFile> {
  const res = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,modifiedTime,size,webViewLink,parents',
  });
  return mapFile(res.data);
}

async function createFolder(
  drive: DriveAPI,
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id,name,mimeType,modifiedTime,size,webViewLink,parents',
  });

  return mapFile(res.data);
}

async function uploadTextFile(
  drive: DriveAPI,
  name: string,
  content: string,
  options?: UploadOptions,
): Promise<DriveFile> {
  const res = await drive.files.create({
    requestBody: {
      name,
      parents: options?.parentId ? [options.parentId] : undefined,
    },
    media: {
      mimeType: options?.mimeType ?? 'text/plain',
      body: content,
    },
    fields: 'id,name,mimeType,modifiedTime,size,webViewLink,parents',
  });

  return mapFile(res.data);
}

async function updateTextFile(
  drive: DriveAPI,
  fileId: string,
  content: string,
  mimeType = 'text/plain',
): Promise<DriveFile> {
  const res = await drive.files.update({
    fileId,
    media: { mimeType, body: content },
    fields: 'id,name,mimeType,modifiedTime,size,webViewLink,parents',
  });

  return mapFile(res.data);
}

async function downloadTextFile(drive: DriveAPI, fileId: string): Promise<string> {
  const res = await drive.files.get({ fileId, alt: 'media' });
  const data = res.data as unknown;

  if (typeof data === 'string') return data;
  if (Buffer.isBuffer(data)) return data.toString('utf8');
  return JSON.stringify(data);
}

async function deleteFile(drive: DriveAPI, fileId: string): Promise<void> {
  await drive.files.delete({ fileId });
}

function mapFile(file: drive_v3.Schema$File): DriveFile {
  return {
    id: file.id ?? '',
    name: file.name ?? '',
    mimeType: file.mimeType ?? '',
    modifiedTime: file.modifiedTime ?? '',
    size: file.size ?? '0',
    webViewLink: file.webViewLink ?? '',
    parents: file.parents ?? [],
  };
}
