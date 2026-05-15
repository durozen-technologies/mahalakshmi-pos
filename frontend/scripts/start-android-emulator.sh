#!/usr/bin/env bash
set -euo pipefail

SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
EMULATOR_BIN="$SDK_ROOT/emulator/emulator"
ADB_BIN="$SDK_ROOT/platform-tools/adb"
AVD_NAME="${1:-MeatBillingPOS}"
LOG_FILE="/tmp/${AVD_NAME}-emulator.log"
EMULATOR_STDOUT="/tmp/${AVD_NAME}.stdout"
DEVICE_WAIT_ATTEMPTS="${DEVICE_WAIT_ATTEMPTS:-180}"
BOOT_WAIT_ATTEMPTS="${BOOT_WAIT_ATTEMPTS:-300}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

if [[ ! -x "$EMULATOR_BIN" ]]; then
  echo "Android emulator binary not found at: $EMULATOR_BIN"
  echo "Run: npm run doctor:android"
  exit 1
fi

if [[ ! -x "$ADB_BIN" ]]; then
  echo "adb not found at: $ADB_BIN"
  echo "Run: npm run doctor:android"
  exit 1
fi

if ! "$EMULATOR_BIN" -list-avds | grep -qx "$AVD_NAME"; then
  echo "AVD '$AVD_NAME' was not found."
  echo "Available AVDs:"
  "$EMULATOR_BIN" -list-avds || true
  exit 1
fi

find_running_emulator() {
  while read -r serial state; do
    [[ -z "${serial:-}" ]] && continue
    [[ "$serial" != emulator-* ]] && continue
    [[ "$state" == "offline" ]] && continue

    local detected_name
    detected_name="$("$ADB_BIN" -s "$serial" emu avd name 2>/dev/null | tr -d '\r' | tail -n 1 || true)"
    if [[ "$detected_name" == "$AVD_NAME" ]]; then
      echo "$serial"
      return 0
    fi
  done < <("$ADB_BIN" devices | tail -n +2)

  return 1
}

wait_for_boot_complete() {
  local serial="$1"
  local sys_boot=""
  local dev_boot=""
  local boot_anim=""

  echo "Waiting for Android to finish booting on '$serial'..."
  for ((i = 1; i <= BOOT_WAIT_ATTEMPTS; i++)); do
    sys_boot="$("$ADB_BIN" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
    dev_boot="$("$ADB_BIN" -s "$serial" shell getprop dev.bootcomplete 2>/dev/null | tr -d '\r' || true)"
    boot_anim="$("$ADB_BIN" -s "$serial" shell getprop init.svc.bootanim 2>/dev/null | tr -d '\r' || true)"

    if [[ "$sys_boot" == "1" && ( "$dev_boot" == "1" || "$boot_anim" == "stopped" ) ]]; then
      "$ADB_BIN" -s "$serial" shell input keyevent 82 >/dev/null 2>&1 || true
      echo "Android boot completed on '$serial'."
      return 0
    fi

    if (( i % 15 == 0 )); then
      echo "Still booting '$serial'... (${i}/${BOOT_WAIT_ATTEMPTS})"
    fi
    sleep "$SLEEP_SECONDS"
  done

  echo "Android did not finish booting within the timeout."
  echo "Check logs: $LOG_FILE and $EMULATOR_STDOUT"
  return 1
}

if serial="$(find_running_emulator)"; then
  echo "Emulator '$AVD_NAME' is already running on $serial."
  wait_for_boot_complete "$serial"
  exit 0
fi

EMULATOR_ARGS=(
  "@$AVD_NAME"
  -no-snapshot-load
  -no-boot-anim
  -netdelay none
  -netspeed full
)

if [[ ! -e /dev/kvm ]]; then
  echo "KVM is not available. Starting emulator in software mode; first boot can take several minutes."
  EMULATOR_ARGS+=(-accel off -gpu swiftshader_indirect)
fi

echo "Starting emulator '$AVD_NAME'..."
nohup "$EMULATOR_BIN" "${EMULATOR_ARGS[@]}" >"$EMULATOR_STDOUT" 2>"$LOG_FILE" &

echo "Waiting for adb device..."
for ((i = 1; i <= DEVICE_WAIT_ATTEMPTS; i++)); do
  if serial="$(find_running_emulator)"; then
    echo "Emulator detected on $serial."
    wait_for_boot_complete "$serial"
    exit 0
  fi
  if (( i % 15 == 0 )); then
    echo "Still waiting for emulator to appear... (${i}/${DEVICE_WAIT_ATTEMPTS})"
  fi
  sleep "$SLEEP_SECONDS"
done

echo "Emulator did not appear in adb within the timeout."
echo "Check logs: $LOG_FILE and $EMULATOR_STDOUT"
exit 1
