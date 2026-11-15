const { execSync } = require("child_process");
const path = require("path");

const arg = process.argv[2];
if (!arg) {
  console.error(
    "Please provide a migration name, e.g.:\n  npm run migration:generate InitialSetup\n  or\n  npm run migration:generate src/migrations/InitialSetup"
  );
  process.exit(1);
}

const migrationPath = arg.startsWith("src/migrations")
  ? arg
  : path.posix.join("src/migrations", arg);

const cmd = `./node_modules/.bin/typeorm-ts-node-commonjs migration:generate "${migrationPath}" -d src/data-source.ts`;
console.log(`Running: ${cmd}`);
execSync(cmd, { stdio: "inherit" });
