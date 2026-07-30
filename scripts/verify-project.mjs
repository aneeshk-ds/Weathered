import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const ignoredDirectories = new Set([
  ".git",
  ".expo",
  ".codex-web-check",
  "node_modules",
  "dist",
  "dist-web",
  "build",
  "coverage",
]);

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function walkFiles(relativeDirectory = ".") {
  const directory = path.join(root, relativeDirectory);
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const relativePath = path.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? walkFiles(relativePath) : [relativePath];
  });
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const rootPackage = readJson("package.json");
const lockfile = readJson("package-lock.json");
const appConfig = readJson("apps/mobile/app.json");
const easConfig = readJson("apps/mobile/eas.json");
const deployWorkflow = readText(".github/workflows/deploy-web.yml");
const androidWorkflow = readText(".github/workflows/android-build.yml");
const iosWorkflow = readText(".github/workflows/ios-build.yml");
const readme = readText("README.md");
const securityPolicy = readText("SECURITY.md");
const releaseGuide = readText("docs/release.md");
const gitignore = readText(".gitignore");
const backupModule = readText("apps/mobile/src/lib/backup.ts");
const backupValidationModule = readText("apps/mobile/src/lib/backupValidation.ts");
const diagnosticsModule = readText("apps/mobile/src/lib/diagnostics.ts");
const weatherModule = readText("apps/mobile/src/lib/weather.ts");
const storageModule = readText("apps/mobile/src/lib/storage.ts");
const appModule = readText("apps/mobile/App.tsx");
const historyScreen = readText("apps/mobile/src/screens/HistoryScreen.tsx");
const supabaseModule = readText("apps/mobile/src/lib/supabase.ts");
const settingsScreen = readText("apps/mobile/src/screens/SettingsScreen.tsx");

const workspacePackages = Object.keys(lockfile.packages).filter(
  (key) => key.startsWith("apps/") || key.startsWith("packages/"),
);

check(
  rootPackage.scripts?.typecheck ===
    "npm --workspace packages/shared run build && npm --workspace apps/mobile run typecheck",
  "Root typecheck script should check shared and mobile.",
);
check(
  rootPackage.scripts?.["verify:project"] === "node scripts/verify-project.mjs",
  "Root verify:project script is missing.",
);
check(rootPackage.scripts?.validate?.includes("npm run verify:project"), "Validate should run repository checks.");
check(rootPackage.scripts?.validate?.includes("npm run lint"), "Validate should run lint.");
check(rootPackage.scripts?.validate?.includes("npm run format:check"), "Validate should run formatting checks.");
check(rootPackage.scripts?.validate?.includes("npm run typecheck"), "Validate should run TypeScript checks.");
check(rootPackage.scripts?.validate?.includes("npm run test:core"), "Validate should run core tests.");
check(rootPackage.scripts?.validate?.includes("npm run test:data"), "Validate should run data stress tests.");
check(rootPackage.scripts?.validate?.includes("npm run test:behavior"), "Validate should run behavior tests.");
check(
  rootPackage.scripts?.["build:android:apk"]?.includes("--profile preview-apk"),
  "Root APK script should use the preview-apk profile.",
);
check(
  rootPackage.scripts?.["build:android:production"]?.includes("--profile production"),
  "Root production Android script is missing.",
);
check(
  rootPackage.scripts?.["build:ios:preview"]?.includes("--platform ios") &&
    rootPackage.scripts?.["build:ios:preview"]?.includes("--profile preview-ios"),
  "Root preview iOS script is missing.",
);
check(
  rootPackage.scripts?.["build:ios:production"]?.includes("--platform ios") &&
    rootPackage.scripts?.["build:ios:production"]?.includes("--profile production"),
  "Root production iOS script is missing.",
);
check(workspacePackages.includes("apps/mobile"), "Lockfile should include apps/mobile.");
check(workspacePackages.includes("packages/shared"), "Lockfile should include packages/shared.");
check(
  workspacePackages.every((workspace) => exists(`${workspace}/package.json`)),
  "Every lockfile workspace should exist.",
);

const deployValidateIndex = deployWorkflow.indexOf("npm run validate");
const deployExportIndex = deployWorkflow.indexOf("npm run export:web");
check(deployValidateIndex !== -1, "Web deployment should validate the project.");
check(deployExportIndex !== -1, "Web deployment should export the app.");
check(deployValidateIndex < deployExportIndex, "Web deployment should validate before export.");
check(
  deployWorkflow.includes("secrets.EXPO_PUBLIC_SUPABASE_URL") &&
    deployWorkflow.includes("secrets.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  "Web deployment should read optional Supabase configuration from repository secrets.",
);

check(androidWorkflow.includes("workflow_dispatch"), "Android workflow should be manually dispatchable.");
check(androidWorkflow.includes("preview-apk"), "Android workflow should support preview APKs.");
check(androidWorkflow.includes("production"), "Android workflow should support production bundles.");
check(androidWorkflow.includes("npm run validate"), "Android workflow should validate the project.");
check(androidWorkflow.includes("expo prebuild"), "Android preview should generate the native project.");
check(androidWorkflow.includes("app:assembleRelease"), "Android preview should build a release APK.");
check(
  androidWorkflow.includes("gh release create latest-apk"),
  "Android preview should publish the stable APK release.",
);
check(
  androidWorkflow.includes("npx eas-cli@latest build --platform android --profile production"),
  "Android production should use the EAS production profile.",
);
check(androidWorkflow.includes("EXPO_TOKEN"), "Android production should require an Expo token.");
check(
  androidWorkflow.includes("secrets.EXPO_PUBLIC_SUPABASE_URL") &&
    androidWorkflow.includes("secrets.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  "Android preview should read optional Supabase configuration from repository secrets.",
);
check(!exists(".github/workflows/android-direct-apk.yml"), "Duplicate Android workflow should be removed.");

check(iosWorkflow.includes("workflow_dispatch"), "iOS workflow should be manually dispatchable.");
check(iosWorkflow.includes("preview-ios"), "iOS workflow should support internal preview builds.");
check(iosWorkflow.includes("production"), "iOS workflow should support production builds.");
check(iosWorkflow.includes("npm run validate"), "iOS workflow should validate the project.");
check(
  iosWorkflow.includes("npx eas-cli@latest build --platform ios --profile ${{ inputs.profile }} --non-interactive"),
  "iOS workflow should use EAS for iOS builds.",
);
check(iosWorkflow.includes("EXPO_TOKEN"), "iOS workflow should require an Expo token.");

check(backupModule.includes("normalizeBackupPayload"), "Backup restore should validate imported data.");
check(backupValidationModule.includes("function normalizeEntry"), "Backup entries should be normalized.");
check(backupValidationModule.includes("isValidMood"), "Backup restore should validate mood values.");
check(backupValidationModule.includes("isWeatherSnapshot"), "Backup restore should validate weather.");
check(storageModule.includes("isStoredEntry"), "Stored entries should be validated.");
check(storageModule.includes("isWeatherSnapshot"), "Stored weather should be validated.");
check(storageModule.includes('AsyncStorage.setItem(STORAGE_KEY, "[]")'), "New installs should start with no entries.");
check(!exists("apps/mobile/src/seed.ts"), "Bundled sample entries should not ship.");
check(!appModule.includes("seedEntries"), "The app should not initialize sample entries.");
check(!historyScreen.includes("Load sample data"), "History should not expose sample-data loading.");
check(diagnosticsModule.includes("recordDiagnosticEvent"), "Diagnostics should record local events.");
check(diagnosticsModule.includes("summarizeHealth"), "Diagnostics should summarize app health.");
check(weatherModule.includes("https://api.open-meteo.com/v1/forecast"), "Live weather should use Open-Meteo.");
check(!/api[_-]?key|apikey|token/i.test(weatherModule), "Weather should not require a key or token.");
check(weatherModule.includes("WEATHER_REQUEST_TIMEOUT_MS"), "Weather should have a timeout.");
check(weatherModule.includes("WEATHER_REQUEST_RETRIES"), "Weather should retry transient failures.");
check(settingsScreen.includes("App health"), "Settings should expose app health.");
check(settingsScreen.includes("Open support page"), "Settings should expose support.");

check(exists("README.md"), "README is missing.");
check(exists("SECURITY.md"), "Security policy is missing.");
check(exists("docs/privacy-policy.md"), "Privacy policy is missing.");
check(exists("docs/release.md"), "Release guide is missing.");
check(readme.includes("docs/privacy-policy.md"), "README should link the privacy policy.");
check(readme.includes("docs/release.md"), "README should link the release guide.");
check(readme.includes("SECURITY.md"), "README should link the security policy.");
check(readme.includes("github.com/aneeshk-ds/Weathered/issues"), "README should link support.");
check(securityPolicy.includes("private vulnerability reporting"), "Security policy should provide private reporting.");
check(releaseGuide.includes("npm run validate"), "Release guide should require full validation.");

check(exists(".env.example"), "Environment template is missing.");
check(gitignore.includes(".env.*"), "Local environment files should be ignored.");
check(gitignore.includes("!.env.example"), "Environment template should remain trackable.");
check(gitignore.includes("apps/mobile/android/"), "Generated Android projects should be ignored.");
check(gitignore.includes("apps/mobile/ios/"), "Generated iOS projects should be ignored.");
check(!exists("apps/mobile/android"), "Generated Android project should not remain in the checkout.");
check(
  supabaseModule.includes("process.env.EXPO_PUBLIC_SUPABASE_URL") &&
    supabaseModule.includes("process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  "Supabase client configuration should come from Expo environment variables.",
);
check(supabaseModule.includes("isSupabaseConfigured"), "Missing Supabase configuration should disable sync.");

check(appConfig.expo?.name === "Weathered", "Expo app name should be Weathered.");
check(appConfig.expo?.slug === "weathered", "Expo app slug should be weathered.");
check(appConfig.expo?.icon === "./assets/icon.png", "Expo icon path is incorrect.");
check(exists("apps/mobile/assets/icon.png"), "App icon is missing.");
check(appConfig.expo?.splash?.image === "./assets/splash-icon.png", "Splash image path is incorrect.");
check(exists("apps/mobile/assets/splash-icon.png"), "Splash image is missing.");
check(Boolean(appConfig.expo?.android?.package), "Android package name is missing.");
check(Number.isInteger(appConfig.expo?.android?.versionCode), "Android versionCode should be an integer.");
check(Boolean(appConfig.expo?.ios?.bundleIdentifier), "iOS bundle identifier is missing.");
check(typeof appConfig.expo?.ios?.buildNumber === "string", "iOS buildNumber should be a string.");
check(
  Boolean(appConfig.expo?.ios?.infoPlist?.NSLocationWhenInUseUsageDescription),
  "iOS location permission text is missing.",
);
check(
  appConfig.expo?.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === false,
  "iOS export compliance flag should be explicit.",
);
check(
  appConfig.expo?.android?.adaptiveIcon?.foregroundImage === "./assets/adaptive-icon.png",
  "Android adaptive icon path is incorrect.",
);
check(exists("apps/mobile/assets/adaptive-icon.png"), "Android adaptive icon is missing.");
check(
  appConfig.expo?.android?.permissions?.includes("ACCESS_FINE_LOCATION"),
  "Android fine location permission is missing.",
);
check(
  appConfig.expo?.plugins?.some((plugin) => Array.isArray(plugin) && plugin[0] === "expo-location"),
  "Expo location plugin configuration is missing.",
);
check(Boolean(appConfig.expo?.extra?.eas?.projectId), "EAS project ID is missing.");
check(easConfig.cli?.appVersionSource === "local", "EAS app version source should be explicit.");
check(easConfig.build?.["preview-apk"]?.android?.buildType === "apk", "Preview profile should build an APK.");
check(
  easConfig.build?.["preview-ios"]?.distribution === "internal" &&
    easConfig.build?.["preview-ios"]?.ios?.simulator === false,
  "Preview iOS profile should build an internal device build.",
);
check(
  easConfig.build?.production?.android?.buildType === "app-bundle",
  "Production profile should build an app bundle.",
);
check(easConfig.build?.production?.ios?.simulator === false, "Production profile should support iOS devices.");

const projectFiles = walkFiles(".");
const textExtensions = new Set([".html", ".js", ".json", ".md", ".mjs", ".ts", ".tsx", ".yml", ".yaml"]);
const textFiles = projectFiles.filter(
  (file) =>
    file === ".env.example" ||
    (textExtensions.has(path.extname(file)) && file.replaceAll("\\", "/") !== "scripts/verify-project.mjs"),
);
const forbiddenSecretPatterns = [
  ["Supabase API key", /\bsb_(?:publishable|secret)_[A-Za-z0-9_-]{16,}\b/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co\b/i],
  ["GitHub token", /\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{30,}\b/i],
  ["OpenAI API key", /\bsk-[A-Za-z0-9_-]{20,}\b/i],
  ["AWS access key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/i],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/],
];

for (const file of textFiles) {
  const text = readText(file);
  check(!/[\u00c2\u00c3\ufffd]/.test(text), `${file} contains likely encoding artifacts.`);
  for (const [label, pattern] of forbiddenSecretPatterns) {
    check(!pattern.test(text), `${file} contains a possible ${label}.`);
  }
}

const prohibitedFiles = projectFiles.filter((file) => {
  const normalized = file.replaceAll("\\", "/");
  if (normalized === ".env.example") return false;
  return (
    /(^|\/)\.env($|\.)/i.test(normalized) ||
    /\.(?:apk|aab|jks|keystore|pem|p12|pfx)$/i.test(normalized) ||
    /(^|\/)(?:credentials|service-account)[^/]*\.json$/i.test(normalized)
  );
});
check(
  prohibitedFiles.length === 0,
  `Repository contains prohibited generated or credential files: ${prohibitedFiles.join(", ")}`,
);

if (failures.length) {
  console.error("Project verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Project verification passed.");
