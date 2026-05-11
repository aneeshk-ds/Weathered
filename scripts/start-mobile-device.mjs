import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

function findLanIp() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
}

const lanIp = findLanIp();

if (!lanIp) {
  console.error("Could not detect a LAN IP. Use EXPO_PUBLIC_WEATHER_API_URL=http://YOUR_MAC_LAN_IP:4000 npm run dev:mobile:device instead.");
  process.exit(1);
}

const apiUrl = `http://${lanIp}:4000`;
const healthUrl = `${apiUrl}/health`;

if (process.argv.includes("--print") || process.argv.includes("--help")) {
  console.log(`EXPO_PUBLIC_WEATHER_API_URL=${apiUrl}`);
  console.log("npm run dev:mobile:device");
  process.exit(0);
}

if (process.argv.includes("--check")) {
  console.log(`Checking ${healthUrl}`);

  try {
    const response = await fetch(healthUrl);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    console.log("Weathered API is reachable from this Mac LAN URL.");
    process.exit(0);
  } catch (error) {
    console.error(`Weathered API is not reachable at ${healthUrl}. Start it with npm run dev:api first.`);
    process.exit(1);
  }
}

console.log(`Starting Expo with EXPO_PUBLIC_WEATHER_API_URL=${apiUrl}`);

const child = spawn("npm", ["run", "dev:mobile:device"], {
  env: {
    ...process.env,
    EXPO_PUBLIC_WEATHER_API_URL: apiUrl,
  },
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
