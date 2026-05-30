const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const rootNodeModules = path.join(projectRoot, "node_modules");
const tamaguiLegacyColorsCjs = path.join(
  rootNodeModules,
  "@tamagui",
  "colors",
  "dist",
  "cjs",
  "legacy.native.js",
);

function escapeForRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}

function toPathPattern(directoryPath) {
  return escapeForRegExp(directoryPath).replaceAll("/", "[/\\\\]");
}

const blockedNestedDependencyDirs = [
  path.join(
    rootNodeModules,
    "@haroldtran",
    "react-native-thermal-printer",
    "node_modules",
    "react",
  ),
  path.join(
    rootNodeModules,
    "@haroldtran",
    "react-native-thermal-printer",
    "node_modules",
    "react-native",
  ),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.join(rootNodeModules, "react"),
  "react-native": path.join(rootNodeModules, "react-native"),
};

const blockedNestedDependencyPatterns = blockedNestedDependencyDirs.map(
  (directoryPath) => new RegExp(`^${toPathPattern(directoryPath)}[/\\\\].*$`),
);

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  ...blockedNestedDependencyPatterns,
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@tamagui/colors/legacy") {
    return {
      filePath: tamaguiLegacyColorsCjs,
      type: "sourceFile",
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
