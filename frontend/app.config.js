const appJson = require("./app.json");
const fs = require("fs");
const path = require("path");

function readEnvFileValue(key) {
  try {
    const envPath = path.join(__dirname, ".env");
    const file = fs.readFileSync(envPath, "utf-8");
    const line = file
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));

    if (!line) {
      return "";
    }

    return line.slice(key.length + 1).trim().replace(/^['"]|['"]$/g, "");
  } catch {
    return "";
  }
}

const expoPublicApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  readEnvFileValue("EXPO_PUBLIC_API_BASE_URL");

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      expoPublicApiBaseUrl,
    },
  },
});
