import * as path from "path";
import { FileService } from "./services/FileService";
import { Blob, Tree, Commit } from "./models/GitObjects";

export class Git {
  private fileService: FileService;
  private gitDir = ".my-git";

  constructor(private repoPath: string) {
    this.fileService = new FileService(repoPath);
  }

  init(): void {
    if (!this.fileService.fileExists(this.gitDir)) {
      this.fileService.createDirectory(this.gitDir);
      this.fileService.writeFile(
        path.join(this.gitDir, "config"),
        "[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n"
      );
      this.fileService.createDirectory(path.join(this.gitDir, "objects"));
      this.fileService.writeFile(path.join(this.gitDir, "HEAD"), "");
      console.log(
        "The repository was successfully initialized in",
        path.join(this.repoPath, this.gitDir)
      );
    } else {
      console.log("The repository already exists.");
    }
  }

  generateTree(): string {
    // We no longer need to explicitly exclude .my-git as it's handled by the IgnoreService
    const files = this.fileService.getFilesRecursively("");
    const tree = new Tree(this.fileService);

    for (const file of files) {
      const relativePath = path.relative(this.repoPath, file);
      const content = Buffer.from(
        this.fileService.readFile(relativePath, "binary"),
        "binary"
      );

      const blob = new Blob(this.fileService, content, relativePath);
      const blobHash = blob.save();

      tree.addBlob(blob, relativePath, blobHash);
    }

    return tree.save();
  }

  commit(message: string): void {
    if (!this.fileService.fileExists(this.gitDir)) {
      console.log("The repository is not initialized. Run 'init' first.");

      return;
    }

    const treeHash = this.generateTree();

    let parentHash = "";
    const headPath = path.join(this.gitDir, "HEAD");

    if (this.fileService.fileExists(headPath)) {
      parentHash = this.fileService.readFile(headPath).trim();
    }

    const commit = new Commit(this.fileService, treeHash, message, parentHash);
    const commitHash = commit.save();

    this.fileService.writeFile(headPath, commitHash);
    console.log("The commit has been saved. Commit hash:", commitHash);
  }
}
