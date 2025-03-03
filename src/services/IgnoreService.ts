import * as path from "path";
import * as fs from "fs";
import { minimatch } from "minimatch";

export class IgnoreService {
  private patterns: string[] = [];

  constructor(private basePath: string) {
    this.loadIgnoreFile();
  }

  private loadIgnoreFile(): void {
    const ignorePath = path.join(this.basePath, ".gitignore");

    if (fs.existsSync(ignorePath)) {
      const content = fs.readFileSync(ignorePath, "utf8");

      this.patterns = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
    }
  }

  shouldIgnore(filePath: string): boolean {
    // Always ignore .my-git directory
    if (filePath.includes(".my-git")) {
      return true;
    }

    // Get the relative path from the base directory
    const relativePath = path.relative(this.basePath, filePath);

    // Check if the file matches any ignore pattern
    return this.patterns.some((pattern) => {
      // Handle directory patterns (ending with /)
      if (pattern.endsWith("/")) {
        const dirPattern = pattern.slice(0, -1);

        return (
          minimatch(relativePath, dirPattern) ||
          minimatch(relativePath, `${dirPattern}/**`)
        );
      }

      return (
        minimatch(relativePath, pattern) ||
        minimatch(relativePath, `${pattern}/**`)
      );
    });
  }
}
