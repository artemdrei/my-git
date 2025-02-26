import { Repository } from "./repository";

const command = process.argv[2];

if (command === "init") {
  const repo = new Repository(process.cwd());
  repo.init();
} else if (command === "commit") {
  const commitMessage = process.argv.slice(3).join(" ");
  if (!commitMessage) {
    console.log("Будь ласка, надайте повідомлення для коміту.");
    process.exit(1);
  }
  const repo = new Repository(process.cwd());
  repo.commit(commitMessage);
} else {
  console.log(
    'Невідома команда. Використовуйте "init" для ініціалізації репозиторію або "commit" для створення коміту.'
  );
}
