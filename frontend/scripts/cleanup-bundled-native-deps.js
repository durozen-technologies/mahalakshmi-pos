const fs = require("fs");
const path = require("path");

const bundledDependencyRoot = path.join(
  __dirname,
  "..",
  "node_modules",
  "@haroldtran",
  "react-native-thermal-printer",
  "node_modules",
);

for (const packageName of ["react", "react-native"]) {
  const packagePath = path.join(bundledDependencyRoot, packageName);

  if (!fs.existsSync(packagePath)) {
    continue;
  }

  fs.rmSync(packagePath, { recursive: true, force: true });
  console.log(`Removed bundled duplicate dependency: ${packageName}`);
}
