import { Git } from "./git";

class CLI {
  private git: Git;

  constructor() {
    this.git = new Git(process.cwd());
  }

  parseArgs(args: string[]): void {
    const command = args[2];

    switch (command) {
      case "init":
        this.init();

        break;
      case "commit":
        this.commit(args.slice(3));

        break;
      default:
        this.showHelp();
        break;
    }
  }

  private init(): void {
    this.git.init();
  }

  private commit(args: string[]): void {
    const commitMessage = args.join(" ");

    if (!commitMessage) {
      console.log("Please provide a message for the committee.");
      process.exit(1);
    }

    this.git.commit(commitMessage);
  }

  private showHelp(): void {
    console.log(
      "Unknown command. Use “init” to initialize the repository or “commit” to create a commit."
    );
  }
}

const cli = new CLI();
cli.parseArgs(process.argv);
