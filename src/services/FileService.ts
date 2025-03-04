import * as fs from "fs";
import * as path from "path";
import { IgnoreService } from "./IgnoreService";

export class FileService {
  private ignoreService: IgnoreService;

  constructor(private basePath: string) {
    this.ignoreService = new IgnoreService(basePath);
  }

  createDirectory(dirPath: string): void {
    const fullPath = path.join(this.basePath, dirPath);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  writeFile(filePath: string, content: string | Buffer): void {
    const fullPath = path.join(this.basePath, filePath);
    fs.writeFileSync(fullPath, content);
  }

  readFile(filePath: string, encoding: BufferEncoding = "utf8") {
    const fullPath = path.join(this.basePath, filePath);

    return fs.readFileSync(fullPath, encoding);
  }

  fileExists(filePath: string): boolean {
    const fullPath = path.join(this.basePath, filePath);

    return fs.existsSync(fullPath);
  }

  getFilesRecursively(dir: string, excludeDirs: string[] = []): string[] {
    const fullDir = path.join(this.basePath, dir);
    let results: string[] = [];

    if (!fs.existsSync(fullDir)) {
      return results;
    }

    const list = fs.readdirSync(fullDir);

    list.forEach((file) => {
      const filePath = path.join(fullDir, file);

      // Skip if the file should be ignored
      if (this.ignoreService.shouldIgnore(filePath)) {
        return;
      }

      // Skip if the file is in an excluded directory
      if (excludeDirs.some((excludeDir) => filePath.includes(excludeDir))) {
        return;
      }

      const stat = fs.statSync(filePath);

      if (stat && stat.isDirectory()) {
        results = results.concat(
          this.getFilesRecursively(
            path.relative(this.basePath, filePath),
            excludeDirs
          )
        );
      } else {
        results.push(filePath);
      }
    });

    return results;
  }
}
