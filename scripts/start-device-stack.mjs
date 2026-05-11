import { spawn } from "node:child_process";

if (process.argv.includes("--print") || process.argv.includes("--help")) {
  console.log("npm run dev:api");
  console.log("npm run dev:mobile:device:auto");
  process.exit(0);
}

const api = spawn("npm", ["run", "dev:api"], {
  stdio: "inherit",
});

const mobile = spawn("npm", ["run", "dev:mobile:device:auto"], {
  stdio: "inherit",
});

function stopAll(code = 0) {
  api.kill("SIGINT");
  mobile.kill("SIGINT");
  process.exit(code);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

api.on("exit", (code) => {
  if (code) {
    stopAll(code);
  }
});

mobile.on("exit", (code) => {
  if (code) {
    stopAll(code);
  }
});
