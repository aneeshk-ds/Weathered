import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function walkFiles(relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const rootPackage = readJson("package.json");
const lockfile = readJson("package-lock.json");
const appConfig = readJson("apps/mobile/app.json");
const easConfig = readJson("apps/mobile/eas.json");
const workflow = readText(".github/workflows/deploy-web.yml");
const androidWorkflow = readText(".github/workflows/android-build.yml");
const readme = readText("README.md");
const backupModule = readText("apps/mobile/src/lib/backup.ts");
const backupValidationModule = readText("apps/mobile/src/lib/backupValidation.ts");
const diagnosticsModule = readText("apps/mobile/src/lib/diagnostics.ts");
const settingsScreen = readText("apps/mobile/src/screens/SettingsScreen.tsx");

const workspacePackages = Object.keys(lockfile.packages).filter((key) => key.startsWith("apps/") || key.startsWith("packages/"));

check(rootPackage.scripts?.typecheck === "npm --workspace packages/shared run build && npm --workspace apps/mobile run typecheck", "Root typecheck script should check shared and mobile.");
check(rootPackage.scripts?.["verify:project"] === "node scripts/verify-project.mjs", "Root verify:project script is missing.");
check(rootPackage.scripts?.["test:core"] === "node --no-warnings --experimental-strip-types scripts/test-core.mjs", "Root test:core script is missing.");
check(rootPackage.scripts?.["build:android:apk"]?.includes("--profile preview-apk"), "Root APK build script should use the preview-apk profile.");
check(rootPackage.scripts?.["build:android:production"]?.includes("--profile production"), "Root production Android build script is missing.");
check(workspacePackages.includes("apps/mobile"), "Lockfile should include apps/mobile.");
check(workspacePackages.includes("packages/shared"), "Lockfile should include packages/shared.");
check(!workspacePackages.includes("apps/api"), "Lockfile should not include removed apps/api workspace.");
check(workspacePackages.every((workspace) => exists(`${workspace}/package.json`)), "Every lockfile workspace should exist on disk.");

const typecheckIndex = workflow.indexOf("npm run typecheck");
const exportIndex = workflow.indexOf("npm run export:web");
check(typecheckIndex !== -1, "Deploy workflow should run npm run typecheck.");
check(exportIndex !== -1, "Deploy workflow should run npm run export:web.");
check(typecheckIndex !== -1 && exportIndex !== -1 && typecheckIndex < exportIndex, "Deploy workflow should typecheck before export.");
check(workflow.includes("npm run test:core"), "Deploy workflow should run core smoke tests.");
check(workflow.includes("npm run verify:project"), "Deploy workflow should run project release checks.");

check(androidWorkflow.includes("workflow_dispatch"), "Android build workflow should be manually dispatchable.");
check(androidWorkflow.includes("preview-apk"), "Android build workflow should support preview-apk.");
check(androidWorkflow.includes("production"), "Android build workflow should support production.");
check(androidWorkflow.includes("EXPO_TOKEN"), "Android build workflow should require EXPO_TOKEN.");
check(androidWorkflow.includes("npm run verify:project"), "Android build workflow should run project release checks.");
check(androidWorkflow.includes("npm run typecheck"), "Android build workflow should run typecheck.");
check(androidWorkflow.includes("npm run test:core"), "Android build workflow should run core smoke tests.");
check(androidWorkflow.includes("npx eas-cli@latest build"), "Android build workflow should run EAS build.");

check(backupModule.includes("normalizeBackupPayload"), "Backup restore should call the backup payload validator.");
check(backupValidationModule.includes("function normalizeEntry"), "Backup restore should validate entries before importing.");
check(backupValidationModule.includes("isValidMood"), "Backup restore should validate mood values.");
check(backupValidationModule.includes("isWeatherSnapshot"), "Backup restore should validate weather snapshots.");
check(diagnosticsModule.includes("recordDiagnosticEvent"), "Diagnostics module should record local support events.");
check(diagnosticsModule.includes("summarizeHealth"), "Diagnostics module should summarize app health.");
check(settingsScreen.includes("App health"), "Settings should expose app health status.");
check(settingsScreen.includes("Support:"), "Settings should include a support/debug context prompt.");
check(settingsScreen.includes("Open support page"), "Settings should include a visible support action.");
check(readme.includes("github.com/aneeshk-ds/Weathered/issues"), "README should link the support page.");

check(exists("docs/privacy-policy.md"), "Privacy policy document is missing.");
check(readme.includes("docs/privacy-policy.md"), "README should link the privacy policy.");
check(exists("docs/release-checklist.md"), "Release checklist document is missing.");
check(readme.includes("docs/release-checklist.md"), "README should link the release checklist.");
check(exists("docs/system-design.md"), "System design document is missing.");
check(readme.includes("docs/system-design.md"), "README should link the system design document.");
check(exists("docs/user-validation.md"), "User validation plan is missing.");
check(readme.includes("docs/user-validation.md"), "README should link the user validation plan.");

check(appConfig.expo?.name === "Weathered", "Expo app name should be Weathered.");
check(appConfig.expo?.slug === "weathered", "Expo app slug should be weathered.");
check(appConfig.expo?.icon === "./assets/icon.png", "Expo icon should point to assets/icon.png.");
check(exists("apps/mobile/assets/icon.png"), "App icon asset is missing.");
check(appConfig.expo?.splash?.image === "./assets/splash-icon.png", "Expo splash should point to assets/splash-icon.png.");
check(exists("apps/mobile/assets/splash-icon.png"), "Splash icon asset is missing.");
check(Boolean(appConfig.expo?.android?.package), "Android package name is missing.");
check(Number.isInteger(appConfig.expo?.android?.versionCode), "Android versionCode should be an integer.");
check(appConfig.expo?.android?.adaptiveIcon?.foregroundImage === "./assets/adaptive-icon.png", "Android adaptive icon foreground is missing.");
check(exists("apps/mobile/assets/adaptive-icon.png"), "Android adaptive icon asset is missing.");
check(appConfig.expo?.android?.permissions?.includes("ACCESS_FINE_LOCATION"), "Android fine location permission is missing.");
check(appConfig.expo?.plugins?.some((plugin) => Array.isArray(plugin) && plugin[0] === "expo-location"), "expo-location plugin configuration is missing.");
check(Boolean(appConfig.expo?.extra?.eas?.projectId), "EAS projectId is missing.");

check(easConfig.build?.["preview-apk"]?.android?.buildType === "apk", "preview-apk profile should build an APK.");
check(easConfig.build?.production?.android?.buildType === "app-bundle", "production profile should build an Android app bundle.");

const textFiles = [
  "README.md",
  ...walkFiles("docs"),
  ...walkFiles("apps/mobile/src"),
  ...walkFiles("packages/shared/src"),
].filter((file) => [".html", ".js", ".json", ".md", ".mjs", ".ts", ".tsx", ".yml"].includes(path.extname(file)));

for (const file of textFiles) {
  const text = readText(file);
  check(!/[âÂ�]/.test(text), `${file} contains likely text encoding artifacts.`);
}

if (failures.length) {
  console.error("Project verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Project verification passed.");
