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

export interface MoveFileOptions {
  removeParentIds?: string[];
}

export interface DownloadOptions {
  /** Export format for native Google files (Docs/Sheets/Slides/Drawings). Defaults to Office/PNG formats. */
  exportMimeType?: string;
}

export interface DownloadResult {
  outputPath: string;
  sizeBytes: number;
  name: string;
  /** MIME type of the bytes written. */
  mimeType: string;
  /** MIME type of the file in Drive. */
  sourceMimeType: string;
  /** True when a native Google file was exported. */
  exported: boolean;
}

export function createDriveClient(auth: OAuth2Client) {
  const drive = createDrive({ version: 'v3', auth });

  return {
    listFiles: (query?: string, pageSize?: number) =>
      withAuthHint(listFiles(drive, query, pageSize)),
    getFile: (fileId: string) => withAuthHint(getFile(drive, fileId)),
    createFolder: (name: string, parentId?: string) =>
      withAuthHint(createFolder(drive, name, parentId)),
    createGoogleDoc: (name: string, parentId?: string) =>
      withAuthHint(createGoogleDoc(drive, name, parentId)),
    uploadTextFile: (name: string, content: string, options?: UploadOptions) =>
      withAuthHint(uploadTextFile(drive, name, content, options)),
    updateTextFile: (fileId: string, content: string, mimeType?: string) =>
      withAuthHint(updateTextFile(drive, fileId, content, mimeType)),
    moveFile: (fileId: string, targetParentId: string, options?: MoveFileOptions) =>
      withAuthHint(moveFile(drive, fileId, targetParentId, options)),
    downloadTextFile: (fileId: string) => withAuthHint(downloadTextFile(drive, fileId)),
    downloadFile: (fileId: string, outputPath: string, options?: DownloadOptions) =>
      withAuthHint(downloadFile(drive, fileId, outputPath, options)),
    deleteFile: (fileId: string) => withAuthHint(deleteFile(drive, fileId)),
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

async function createGoogleDoc(
  drive: DriveAPI,
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.document',
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
  if (options?.mimeType?.startsWith('application/vnd.google-apps.')) {
    throw new Error(
      `uploadTextFile does not create native Google Workspace files. ` +
        `Use createGoogleDoc for Google Docs, or use the dedicated google-docs/google-sheets/google-slides tool.`,
    );
  }

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

async function moveFile(
  drive: DriveAPI,
  fileId: string,
  targetParentId: string,
  options?: MoveFileOptions,
): Promise<DriveFile> {
  const currentFile = await drive.files.get({
    fileId,
    fields: 'parents',
  });

  const currentParents = currentFile.data.parents ?? [];
  const removeParentIds =
    options?.removeParentIds ?? currentParents.filter((parentId) => parentId !== targetParentId);

  const res = await drive.files.update({
    fileId,
    addParents: targetParentId,
    removeParents: removeParentIds.length > 0 ? removeParentIds.join(',') : undefined,
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

/** Default export formats for native Google Workspace files. */
const DEFAULT_EXPORT_MIME: Record<string, { mimeType: string; extension: string }> = {
  'application/vnd.google-apps.document': {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
  },
  'application/vnd.google-apps.spreadsheet': {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  },
  'application/vnd.google-apps.presentation': {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: '.pptx',
  },
  'application/vnd.google-apps.drawing': { mimeType: 'image/png', extension: '.png' },
  'application/vnd.google-apps.script': {
    mimeType: 'application/vnd.google-apps.script+json',
    extension: '.json',
  },
};

async function downloadFile(
  drive: DriveAPI,
  fileId: string,
  outputPath: string,
  options?: DownloadOptions,
): Promise<DownloadResult> {
  const meta = await drive.files.get({ fileId, fields: 'id,name,mimeType' });
  const sourceMimeType = meta.data.mimeType ?? '';
  const isNative = sourceMimeType.startsWith('application/vnd.google-apps.');

  let bytes: Buffer;
  let mimeType: string;

  if (isNative) {
    if (sourceMimeType === 'application/vnd.google-apps.folder') {
      throw new Error(`File ${fileId} is a folder and cannot be downloaded.`);
    }
    const exportMimeType =
      options?.exportMimeType ?? DEFAULT_EXPORT_MIME[sourceMimeType]?.mimeType;
    if (!exportMimeType) {
      throw new Error(
        `No default export format for ${sourceMimeType}. Pass options.exportMimeType.`,
      );
    }
    const res = await drive.files.export(
      { fileId, mimeType: exportMimeType },
      { responseType: 'arraybuffer' },
    );
    bytes = Buffer.from(res.data as ArrayBuffer);
    mimeType = exportMimeType;
  } else {
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' },
    );
    bytes = Buffer.from(res.data as unknown as ArrayBuffer);
    mimeType = sourceMimeType;
  }

  await Bun.write(outputPath, bytes);
  return {
    outputPath,
    sizeBytes: bytes.length,
    name: meta.data.name ?? '',
    mimeType,
    sourceMimeType,
    exported: isNative,
  };
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

async function withAuthHint<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('invalid_grant')) {
      throw new Error(
        'Google Drive authentication failed (invalid_grant). Ask the user to run login in Settings → Tools → google-drive → Commands to refresh the token.',
      );
    }

    throw error;
  }
}
