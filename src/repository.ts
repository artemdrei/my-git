// src/repository.ts
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export class Repository {
  constructor(private repoPath: string) {}

  init() {
    const myGitDir = path.join(this.repoPath, ".my-git");
    if (!fs.existsSync(myGitDir)) {
      fs.mkdirSync(myGitDir);
      // Запис базової конфігурації
      fs.writeFileSync(
        path.join(myGitDir, "config"),
        "[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n"
      );
      // Створення директорії для об’єктів
      fs.mkdirSync(path.join(myGitDir, "objects"));
      // Ініціалізація HEAD
      fs.writeFileSync(path.join(myGitDir, "HEAD"), "");
      console.log("Репозиторій успішно ініціалізовано у", myGitDir);
    } else {
      console.log("Репозиторій вже існує.");
    }
  }

  // Допоміжна функція для запису об’єктів у .my-git/objects
  private writeObject(hash: string, objectData: Buffer) {
    const objectsDir = path.join(this.repoPath, ".my-git", "objects");
    const subdir = path.join(objectsDir, hash.slice(0, 2));

    if (!fs.existsSync(subdir)) {
      fs.mkdirSync(subdir);
    }

    const objectPath = path.join(subdir, hash.slice(2));
    if (!fs.existsSync(objectPath)) {
      fs.writeFileSync(objectPath, objectData);
    }
  }

  // Рекурсивний обхід директорії для отримання всіх файлів (за винятком .my-git)
  private getFilesRecursively(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat && stat.isDirectory()) {
        if (file === ".my-git") return; // пропускаємо директорію репозиторію
        results = results.concat(this.getFilesRecursively(filePath));
      } else {
        results.push(filePath);
      }
    });

    return results;
  }

  // Генерація динамічного tree-об’єкта на основі файлів у робочій директорії
  generateTree(): string {
    const files = this.getFilesRecursively(this.repoPath);
    // Виключаємо файли, що знаходяться в .my-git
    const filteredFiles = files.filter((file) => {
      return !file.includes(path.join(this.repoPath, ".my-git"));
    });

    const treeEntries: Buffer[] = [];

    for (const file of filteredFiles) {
      // Отримуємо відносний шлях до файлу
      const relativePath = path.relative(this.repoPath, file);
      const stat = fs.statSync(file);
      if (!stat.isFile()) continue;
      const fileContent = fs.readFileSync(file);
      // Формуємо blob-об’єкт: "blob <size>\0<content>"
      const blobHeader = Buffer.from(`blob ${fileContent.length}\0`);
      const blobObject = Buffer.concat([blobHeader, fileContent]);
      const blobHashBuffer = crypto
        .createHash("sha1")
        .update(blobObject)
        .digest();
      const blobHashHex = blobHashBuffer.toString("hex");
      // Зберігаємо blob-об’єкт
      this.writeObject(blobHashHex, blobObject);
      // Створюємо запис для tree-об’єкта: "100644 <relative_path>\0" + blob hash (у двійковому вигляді)
      const entryHeader = Buffer.from(`100644 ${relativePath}\0`);
      const entry = Buffer.concat([entryHeader, blobHashBuffer]);
      treeEntries.push(entry);
    }

    // Сортуємо записи за відносним шляхом
    treeEntries.sort((a, b) => {
      const aStr = a.toString("utf8");
      const bStr = b.toString("utf8");
      return aStr.localeCompare(bStr);
    });

    // Об’єднуємо всі записи в один буфер
    const treeContent = Buffer.concat(treeEntries);
    const treeHeader = Buffer.from(`tree ${treeContent.length}\0`);
    const treeObject = Buffer.concat([treeHeader, treeContent]);
    const treeHash = crypto.createHash("sha1").update(treeObject).digest("hex");
    // Зберігаємо tree-об’єкт
    this.writeObject(treeHash, treeObject);
    return treeHash;
  }

  commit(message: string) {
    const myGitDir = path.join(this.repoPath, ".my-git");
    if (!fs.existsSync(myGitDir)) {
      console.log("Репозиторій не ініціалізовано. Виконайте 'init' спершу.");
      return;
    }

    // Генеруємо динамічний treeHash з поточного стану робочої директорії
    const treeHash = this.generateTree();

    // Отримуємо parent-коміт з файлу HEAD (якщо існує)
    let parentHash = "";
    const headPath = path.join(myGitDir, "HEAD");
    if (fs.existsSync(headPath)) {
      parentHash = fs.readFileSync(headPath, "utf8").trim();
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const timezone = "+0000";
    const authorInfo = "Author Name <author@example.com>";
    const committerInfo = authorInfo;

    let commitContent = `tree ${treeHash}\n`;
    if (parentHash) {
      commitContent += `parent ${parentHash}\n`;
    }
    commitContent += `author ${authorInfo} ${timestamp} ${timezone}\n`;
    commitContent += `committer ${committerInfo} ${timestamp} ${timezone}\n\n`;
    commitContent += `${message}\n`;

    const contentLength = Buffer.byteLength(commitContent, "utf8");
    const fullCommit = `commit ${contentLength}\0${commitContent}`;
    const commitHash = crypto
      .createHash("sha1")
      .update(fullCommit)
      .digest("hex");

    // Зберігаємо об’єкт коміту
    this.writeObject(commitHash, Buffer.from(fullCommit, "utf8"));
    console.log("Коміт збережено. Хеш коміту:", commitHash);

    // Оновлюємо HEAD новим хешем коміту
    fs.writeFileSync(headPath, commitHash);
  }
}
