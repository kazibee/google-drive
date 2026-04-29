export interface Env {
	CLIENT_ID: string;
	CLIENT_SECRET: string;
	REFRESH_TOKEN: string;
}
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
declare function main(env: Env): {
	listFiles: (query?: string, pageSize?: number) => Promise<DriveFile[]>;
	getFile: (fileId: string) => Promise<DriveFile>;
	createFolder: (name: string, parentId?: string) => Promise<DriveFile>;
	createGoogleDoc: (name: string, parentId?: string) => Promise<DriveFile>;
	uploadTextFile: (name: string, content: string, options?: UploadOptions) => Promise<DriveFile>;
	updateTextFile: (fileId: string, content: string, mimeType?: string) => Promise<DriveFile>;
	moveFile: (fileId: string, targetParentId: string, options?: MoveFileOptions) => Promise<DriveFile>;
	downloadTextFile: (fileId: string) => Promise<string>;
	deleteFile: (fileId: string) => Promise<void>;
};

export {
	main as default,
};

export {};
