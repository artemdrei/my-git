import * as path from "path";
import { createHash } from "../utils/createHash";
import type { FileService } from "../services/file-Service";

export abstract class GitObject {
  constructor(protected fileService: FileService) {}

  abstract serialize(): Buffer;
  abstract save(): string;
}

export class Blob extends GitObject {
  constructor(
    fileService: FileService,
    private content: Buffer,
    private filePath: string
  ) {
    super(fileService);
  }

  serialize(): Buffer {
    const header = Buffer.from(`blob ${this.content.length}\0`);
    return Buffer.concat([header, this.content]);
  }

  save(): string {
    const serialized = this.serialize();
    const hash = createHash(serialized);
    const objectsDir = ".my-git/objects";
    const subdir = path.join(objectsDir, hash.slice(0, 2));

    this.fileService.createDirectory(subdir);

    const objectPath = path.join(subdir, hash.slice(2));
    if (!this.fileService.fileExists(objectPath)) {
      this.fileService.writeFile(objectPath, serialized);
    }

    return hash;
  }

  getFilePath(): string {
    return this.filePath;
  }
}

export class Tree extends GitObject {
  private entries: Buffer[] = [];

  addBlob(blob: Blob, relativePath: string, hash: string): void {
    const entryHeader = Buffer.from(`100644 ${relativePath}\0`);
    const hashBuffer = Buffer.from(hash, "hex");
    const entry = Buffer.concat([entryHeader, hashBuffer]);
    this.entries.push(entry);
  }

  serialize(): Buffer {
    // Sort entries by their UTF-8 string representation
    const sortedEntries = [...this.entries].sort((a, b) =>
      a.toString("utf8").localeCompare(b.toString("utf8"))
    );

    const treeContent = Buffer.concat(sortedEntries);
    const header = Buffer.from(`tree ${treeContent.length}\0`);
    return Buffer.concat([header, treeContent]);
  }

  save(): string {
    const serialized = this.serialize();
    const hash = createHash(serialized);
    const objectsDir = ".my-git/objects";
    const subdir = path.join(objectsDir, hash.slice(0, 2));

    this.fileService.createDirectory(subdir);

    const objectPath = path.join(subdir, hash.slice(2));

    if (!this.fileService.fileExists(objectPath)) {
      this.fileService.writeFile(objectPath, serialized);
    }

    return hash;
  }
}

export class Commit extends GitObject {
  constructor(
    fileService: FileService,
    private treeHash: string,
    private message: string,
    private parentHash = ""
  ) {
    super(fileService);
  }

  serialize(): Buffer {
    const timestamp = Math.floor(Date.now() / 1000);
    const timezone = "+0000";
    const authorInfo = "Author Name <author@example.com>";
    const committerInfo = authorInfo;

    const parentLine = this.parentHash ? `parent ${this.parentHash}\n` : "";
    const content = `tree ${this.treeHash}\n${parentLine}author ${authorInfo} 
                    ${timestamp} ${timezone}\ncommitter ${committerInfo} ${timestamp} 
                    ${timezone}\n\n${this.message}\n`;
    const contentLength = Buffer.byteLength(content, "utf8");

    return Buffer.from(`commit ${contentLength}\0${content}`, "utf8");
  }

  save(): string {
    const serialized = this.serialize();
    const hash = createHash(serialized);
    const objectsDir = ".my-git/objects";
    const subdir = path.join(objectsDir, hash.slice(0, 2));

    this.fileService.createDirectory(subdir);

    const objectPath = path.join(subdir, hash.slice(2));

    if (!this.fileService.fileExists(objectPath)) {
      this.fileService.writeFile(objectPath, serialized);
    }

    return hash;
  }
}
