const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const home = os.homedir();
const env = process.env;
const configuredSdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
const sdkRoot = configuredSdk || path.join(home, "Android", "Sdk");

const checks = [
  ["ANDROID_HOME", env.ANDROID_HOME || "not set", Boolean(env.ANDROID_HOME)],
  ["ANDROID_SDK_ROOT", env.ANDROID_SDK_ROOT || "not set", Boolean(env.ANDROID_SDK_ROOT)],
  ["SDK directory", sdkRoot, fs.existsSync(sdkRoot)],
  ["adb", path.join(sdkRoot, "platform-tools", "adb"), fs.existsSync(path.join(sdkRoot, "platform-tools", "adb"))],
  ["emulator", path.join(sdkRoot, "emulator", "emulator"), fs.existsSync(path.join(sdkRoot, "emulator", "emulator"))],
  [
    "sdkmanager",
    path.join(sdkRoot, "cmdline-tools", "latest", "bin", "sdkmanager"),
    fs.existsSync(path.join(sdkRoot, "cmdline-tools", "latest", "bin", "sdkmanager")),
  ],
];

const kvmPath = "/dev/kvm";
const avdPath = path.join(home, ".android", "avd", "MeatBillingPOS.avd");
const isLinux = process.platform === "linux";
const userGroups = (() => {
  try {
    return execSync("id -nG", { encoding: "utf8" }).trim().split(/\s+/);
  } catch {
    return [];
  }
})();

checks.push(["KVM device", kvmPath, fs.existsSync(kvmPath)]);
checks.push(["kvm group access", userGroups.includes("kvm") ? "yes" : "no", userGroups.includes("kvm")]);
checks.push(["MeatBillingPOS AVD", avdPath, fs.existsSync(avdPath)]);

console.log("Android environment check\n");

for (const [label, detail, ok] of checks) {
  console.log(`${ok ? "[ok]" : "[missing]"} ${label}: ${detail}`);
}

const hasSdk = checks.find(([label]) => label === "SDK directory")?.[2];
const hasAdb = checks.find(([label]) => label === "adb")?.[2];
const hasEmulator = checks.find(([label]) => label === "emulator")?.[2];
const hasAvd = checks.find(([label]) => label === "MeatBillingPOS AVD")?.[2];
const emulatorReady = !isLinux || (fs.existsSync(kvmPath) && userGroups.includes("kvm"));
const ready = hasSdk && hasAdb && hasEmulator && hasAvd && emulatorReady;

if (ready) {
  console.log("\nAndroid tooling looks ready for the emulator and development build.");
  process.exit(0);
}

console.log("\nFix steps:");

if (!hasSdk || !hasAdb || !hasEmulator) {
  console.log("1. Install Android Studio and the Android SDK.");
  console.log("2. Install Android SDK Platform-Tools from the SDK Manager.");
  console.log("3. Add these lines to ~/.bashrc:");
  console.log("");
  console.log('export ANDROID_HOME="$HOME/Android/Sdk"');
  console.log('export ANDROID_SDK_ROOT="$HOME/Android/Sdk"');
  console.log('export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator:$PATH"');
  console.log("");
  console.log("4. Run: source ~/.bashrc");
}

if (!hasAvd) {
  console.log("- Create the MeatBillingPOS Android Virtual Device, or connect a physical Android phone.");
}

if (isLinux && !fs.existsSync(kvmPath)) {
  console.log("- The emulator needs KVM acceleration, but /dev/kvm is not available here.");
  console.log("  Enable virtualization in BIOS/UEFI, install KVM support, or use a physical Android phone.");
}

if (isLinux && fs.existsSync(kvmPath) && !userGroups.includes("kvm")) {
  console.log("- Allow your Linux user to run the Android emulator:");
  console.log(`sudo usermod -aG kvm ${os.userInfo().username}`);
  console.log("  Then fully log out and log back in before running npm run android:dev again.");
}

process.exit(1);
