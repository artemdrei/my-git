# my-git

This is a test project for a better understanding of how Git works under the hood.

## 📌 Core Concepts

## **Git is an object database**

Everything in Git is stored as objects: files, commits, trees. Each object is addressed using an SHA-1 hash.

## Git structure

Git stores everything inside the `.git` directory. Here’s a breakdown of its key components:

### 🗂️ **Folders**

- **`objects/`** – Stores all Git objects (`blobs`, `trees`, `commits`, `tags`).
- **`refs/`** – Stores references to branches, tags, and remotes.
- **`logs/`** – Keeps a history of changes to branches (`reflog`).
- **`hooks/`** – Contains scripts that run at specific Git events (e.g., pre-commit hooks).
- **`info/`** – Stores local Git settings like ignored files (`exclude`).
- **`pack/`** – Compressed objects to optimize storage.

### 📄 **Files**

- **`HEAD`** – Points to the currently checked-out branch or commit.
- **`index`** – Represents the staging area (files added with `git add`).
- **`config`** – Stores repository-specific Git settings.
- **`description`** – Used in Git web interfaces (not essential).

## **Main types of Git objects:**

- **`blob`** (binary data) — stores file contents.
- **`tree`** (directory) — represents the structure of files (folders).
- **`commit`** — contains metadata about changes (author, date, tree).
- **`tag`** — stores signed versions of commits.

## **How Git stores files**

- When you add a file (`git add`), Git creates a `blob` and stores it in `.git/objects/`.
- Git does **not store file names in blobs**, only their content.
- The **`tree`** object maps file names to blobs, acting like a directory.

## **How Git Tracks Changes**

- Git **does not duplicate unchanged files** in each commit.
- Instead, it creates **a new commit referencing a tree** (directory structure).
- The tree links **unchanged files to existing blobs** and **creates new blobs only for modified files**.

```
Commit 1
│
└── Tree 1
    ├── index.html  (blob A1)
    ├── style.css   (blob B2)
    ├── script.js   (blob C3)

Make changes in index.html (blob A1)

Commit 2
│
└── Tree 2
    ├── index.html  (NEW blob E5)
    ├── style.css   (OLD blob B2)
    ├── script.js   (OLD blob C3)

script.js (OLD blob C3) was removed

Commit 3
│
└── Tree 3
    ├── index.html  (OLD blob E5)
    ├── style.css   (OLD blob B2)
    # script.js is removed
```

### 🔑 Key Takeaways

✔ Git tracks full snapshots, not diffs.  
✔ Unchanged files reuse existing blobs, saving space.  
✔ Deleted files are simply removed from the tree but remain in history.  
✔ Commits are linked, forming a complete project history.

`git log --oneline --graph`

## **Branching in Git**

- A **branch** in Git is just a pointer (reference) to a specific commit.
- When you create a new branch, Git simply creates a new reference without duplicating files.
- **Merging** integrates changes from different branches by creating a new commit.

## **How Git Handles Diffs**

- Unlike traditional VCS that store diffs between versions, Git stores **entire snapshots**.
- When a file is unchanged, Git **reuses the existing blob** instead of storing a new copy.

## **Garbage Collection and Packing**

- Git periodically compresses objects using **packfiles** to save space.
- The command `git gc` (garbage collection) optimizes storage.
- Older loose objects are packed into `.git/objects/pack/`.

## **Reflog: Recovering Lost Commits**

- If a branch is deleted or reset, you can restore it using `git reflog`.
- The reflog records recent movements of `HEAD` (checked-out commits).
- Example: Restore a lost commit:
  ```sh
  git reflog
  git checkout <commit-hash>
  ```

## 🔍 Git commands

```sh
git cat-file -t <hash>  # Determine the type of an object (blob, tree, commit, tag)
git cat-file -p <hash>  # View the content of an object
git cat-file -s <hash>  # View the size of an blob
git reflog # to “rescue” what was lost.
git log --online --graph # for convenient viewing of the history and branch structure.
git bisect # is a tool for finding a commit that “broke” the code

# Garbage collector
git gc # Pack files
find .git/objects -type f # Find packed files after git gc
```
