# @kazibee/google-drive

Google Drive tool for kazibee. List files, read metadata, create folders, create native Google Docs, move files between folders, and upload/update text files.

## Install

In the Kazibee desktop app, open **Settings → Tools → Add Extension → Install** and enter
`github:kazibee/google-drive`. The app clones the latest commit and records its SHA; use
**Update** on the extension to move to a newer commit.

## Login

Open **Settings → Tools → google-drive → Commands** and run `login`. It needs a Google OAuth
app's `CLIENT_ID` and `CLIENT_SECRET`: set them in the extension's **Environment** tab, or pass
them as the command's arguments (`CLIENT_ID CLIENT_SECRET`).

Opens your browser to authorize with Google. Credentials are stored automatically.

## API

- `listFiles(query?, pageSize?)`
- `getFile(fileId)`
- `createFolder(name, parentId?)`
- `createGoogleDoc(name, parentId?)`
- `uploadTextFile(name, content, options?)`
- `updateTextFile(fileId, content, mimeType?)`
- `moveFile(fileId, targetParentId, options?)`
- `downloadTextFile(fileId)`
- `deleteFile(fileId)`

## Usage

```javascript
const files = await tools["google-drive"].listFiles("trashed=false", 20);

const folder = await tools["google-drive"].createFolder("Ops Docs");

const doc = await tools["google-drive"].createGoogleDoc("Content Plan", folder.id);

const uploaded = await tools["google-drive"].uploadTextFile(
  "notes.txt",
  "Project notes",
  { parentId: folder.id, mimeType: "text/plain" }
);

const moved = await tools["google-drive"].moveFile(uploaded.id, folder.id);

const content = await tools["google-drive"].downloadTextFile(uploaded.id);
```
