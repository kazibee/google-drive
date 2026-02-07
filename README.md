# @kazibee/google-drive

Google Drive tool for kazibee. List files, read metadata, create folders, and upload/update text files.

## Install

```bash
kazibee install google-drive github:kazibee/google-drive
```

Install globally with `-g`:

```bash
kazibee install -g google-drive github:kazibee/google-drive
```

## Login

```bash
kazibee google-drive login
```

Opens your browser to authorize with Google. Credentials are stored automatically.

## API

- `listFiles(query?, pageSize?)`
- `getFile(fileId)`
- `createFolder(name, parentId?)`
- `uploadTextFile(name, content, options?)`
- `updateTextFile(fileId, content, mimeType?)`
- `downloadTextFile(fileId)`
- `deleteFile(fileId)`

## Usage

```javascript
const files = await tools["google-drive"].listFiles("trashed=false", 20);

const folder = await tools["google-drive"].createFolder("Ops Docs");

const uploaded = await tools["google-drive"].uploadTextFile(
  "notes.txt",
  "Project notes",
  { parentId: folder.id, mimeType: "text/plain" }
);

const content = await tools["google-drive"].downloadTextFile(uploaded.id);
```
