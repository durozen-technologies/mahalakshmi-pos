import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";

import {
  connectPrinterDevice,
  getPrinterSupportState,
  loadBluetoothPrinters,
  loadUsbPrinters,
  printTestReceipt,
} from "@/services/printer-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import { useShopTranslation } from "@/hooks/use-shop-translation";
import { PrinterSetupScreenProps } from "@/navigation/types";
import { usePrinterStore } from "@/store/printer-store";
import { PrinterDevice } from "@/types/printer";

type DeviceSectionProps = {
  title: string;
  description: string;
  devices: PrinterDevice[];
  selectedId?: string | null;
  connectingId?: string | null;
  emptyTitle: string;
  emptyDescription: string;
  selectedLabel: string;
  availableLabel: string;
  connectLabel: string;
  reconnectLabel: string;
  onConnect: (device: PrinterDevice) => void;
};

function DeviceSection({
  title,
  description,
  devices,
  selectedId,
  connectingId,
  emptyTitle,
  emptyDescription,
  selectedLabel,
  availableLabel,
  connectLabel,
  reconnectLabel,
  onConnect,
}: DeviceSectionProps) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-sm font-semibold text-ink">{title}</Text>
        <Text className="text-xs leading-5 text-muted">{description}</Text>
      </View>
      {devices.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        devices.map((device) => {
          const isSelected = selectedId === device.id;
          const isConnecting = connectingId === device.id;
          const detail = device.transport === "bluetooth"
            ? device.address
            : `${device.vendorId ?? "?"}/${device.productId ?? "?"}`;

          return (
            <View key={device.id} className="gap-3 rounded-[24px] bg-surface p-4">
              <View className="flex-row flex-wrap items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-ink">{device.name}</Text>
                  <Text className="text-xs text-muted">{detail}</Text>
                  {device.transport === "usb" && device.manufacturerName ? (
                    <Text className="text-xs text-muted">{device.manufacturerName}</Text>
                  ) : null}
                </View>
                {isSelected ? <StatusPill label={selectedLabel} tone="success" /> : <StatusPill label={availableLabel} tone="neutral" />}
              </View>
              <Button
                label={isSelected ? reconnectLabel : connectLabel}
                onPress={() => onConnect(device)}
                loading={isConnecting}
                className="self-start min-w-[170px]"
              />
            </View>
          );
        })
      )}
    </View>
  );
}

export function PrinterSetupScreen({ navigation }: PrinterSetupScreenProps) {
  const { t } = useShopTranslation();
  const preferredPrinter = usePrinterStore((state) => state.preferredPrinter);
  const setPreferredPrinter = usePrinterStore((state) => state.setPreferredPrinter);
  const clearPreferredPrinter = usePrinterStore((state) => state.clearPreferredPrinter);
  const [bluetoothDevices, setBluetoothDevices] = useState<PrinterDevice[]>([]);
  const [usbDevices, setUsbDevices] = useState<PrinterDevice[]>([]);
  const [loadingBluetooth, setLoadingBluetooth] = useState(false);
  const [loadingUsb, setLoadingUsb] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [printingTest, setPrintingTest] = useState(false);
  const [manualBluetoothName, setManualBluetoothName] = useState("Thermal Printer");
  const [manualBluetoothAddress, setManualBluetoothAddress] = useState("");

  const printerSupport = getPrinterSupportState();
  const bluetoothLabel = t("common.bluetooth");
  const usbLabel = t("common.usb");
  const preferredPrinterLabel = preferredPrinter
    ? `${preferredPrinter.transport === "bluetooth" ? bluetoothLabel : usbLabel} - ${preferredPrinter.name}`
    : null;
  const supportedChannels = printerSupport.bluetooth && printerSupport.usb
    ? `${bluetoothLabel} ${t("common.and")} ${usbLabel}`
    : printerSupport.bluetooth
      ? bluetoothLabel
      : usbLabel;

  useEffect(() => {
    if (!printerSupport.supported) {
      return;
    }

    if (printerSupport.bluetooth) {
      setLoadingBluetooth(true);
      void loadBluetoothPrinters()
        .then(setBluetoothDevices)
        .catch((error) => Alert.alert(t("printer.bluetoothAccessFailedTitle"), `${error}`))
        .finally(() => setLoadingBluetooth(false));
    }

    if (printerSupport.usb) {
      setLoadingUsb(true);
      void loadUsbPrinters()
        .then(setUsbDevices)
        .catch((error) => Alert.alert(t("printer.usbAccessFailedTitle"), `${error}`))
        .finally(() => setLoadingUsb(false));
    }
  }, [printerSupport.bluetooth, printerSupport.supported, printerSupport.usb]);

  async function refreshBluetoothPrinters() {
    if (!printerSupport.bluetooth) {
      Alert.alert(
        t("printer.bluetoothModuleUnavailableTitle"),
        printerSupport.reason ?? t("printer.bluetoothModuleUnavailableMessage"),
      );
      return;
    }

    try {
      setLoadingBluetooth(true);
      setBluetoothDevices(await loadBluetoothPrinters());
    } catch (error) {
      Alert.alert(t("printer.bluetoothAccessFailedTitle"), `${error}`);
    } finally {
      setLoadingBluetooth(false);
    }
  }

  async function refreshUsbPrinters() {
    if (!printerSupport.usb) {
      Alert.alert(
        t("printer.usbModuleUnavailableTitle"),
        printerSupport.reason ?? t("printer.usbModuleUnavailableMessage"),
      );
      return;
    }

    try {
      setLoadingUsb(true);
      setUsbDevices(await loadUsbPrinters());
    } catch (error) {
      Alert.alert(t("printer.usbAccessFailedTitle"), `${error}`);
    } finally {
      setLoadingUsb(false);
    }
  }

  function handleManualBluetoothConnect() {
    const address = manualBluetoothAddress.trim().toUpperCase();

    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(address)) {
      Alert.alert(t("printer.enterMacTitle"), t("printer.enterMacMessage"));
      return;
    }

    void handleConnect({
      id: `bluetooth:${address}`,
      transport: "bluetooth",
      name: manualBluetoothName.trim() || "Thermal Printer",
      address,
      deviceName: manualBluetoothName.trim() || "Thermal Printer",
    });
  }

  async function handleConnect(device: PrinterDevice) {
    try {
      setConnectingId(device.id);
      await connectPrinterDevice(device);
      setPreferredPrinter(device);
      Alert.alert(
        t("common.printerReady"),
        t("printer.connectionReadyMessage", {
          deviceName: device.name,
          transport: device.transport === "bluetooth" ? bluetoothLabel : usbLabel,
        }),
      );
    } catch (error) {
      Alert.alert(t("printer.connectionFailedTitle"), `${error}`);
    } finally {
      setConnectingId(null);
    }
  }

  async function handleTestPrint() {
    if (!preferredPrinter) {
      Alert.alert(t("printer.selectPrinterFirstTitle"), t("printer.selectPrinterFirstMessage"));
      return;
    }

    try {
      setPrintingTest(true);
      await printTestReceipt(preferredPrinter);
      Alert.alert(t("printer.testSentTitle"), t("printer.testSentMessage"));
    } catch (error) {
      Alert.alert(t("printer.testFailedTitle"), `${error}`);
    } finally {
      setPrintingTest(false);
    }
  }

  return (
    <Screen>
      <Card className="gap-4">
        <SectionHeading
          eyebrow={t("printer.posPrinter")}
          title={t("printer.setupTitle")}
          subtitle={t("printer.setupSubtitle")}
        />
        <View className="rounded-[24px] bg-surface p-4">
          <View className="mb-3 flex-row flex-wrap items-center justify-between gap-3">
            <Text className="text-sm font-semibold text-ink">{t("common.runtimeSupport")}</Text>
            <StatusPill
              label={printerSupport.supported ? t("common.androidNativeBuild") : t("common.fallbackOnly")}
              tone={printerSupport.supported ? "success" : "warning"}
            />
          </View>
          <Text className="text-sm leading-6 text-muted">
            {printerSupport.supported
              ? t("common.printerChannels", { channels: supportedChannels })
              : printerSupport.reason}
          </Text>
        </View>
        {preferredPrinter ? (
          <View className="gap-3 rounded-[24px] border border-border bg-card p-4">
            <View className="flex-row flex-wrap items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-sm font-semibold text-ink">{t("common.savedPrinter")}</Text>
                <Text className="text-base font-semibold text-ink">{preferredPrinterLabel}</Text>
                <Text className="text-xs text-muted">
                  {preferredPrinter.transport === "bluetooth"
                    ? preferredPrinter.address
                    : `${preferredPrinter.vendorId ?? "?"}/${preferredPrinter.productId ?? "?"}`}
                </Text>
              </View>
              <StatusPill label={t("common.ready")} tone="success" />
            </View>
            <View className="flex-row flex-wrap gap-3">
              <Button
                label={t("action.printTestSlip")}
                onPress={() => void handleTestPrint()}
                loading={printingTest}
                className="min-w-[150px]"
              />
              <Button
                label={t("action.forgetPrinter")}
                onPress={clearPreferredPrinter}
                variant="secondary"
                className="min-w-[150px]"
              />
            </View>
          </View>
        ) : (
          <EmptyState
            title={t("printer.noPrinterSavedYet")}
            description={t("printer.noPrinterSavedDescription")}
          />
        )}
      </Card>

      <Card className="gap-4">
        <SectionHeading
          eyebrow={t("printer.discovery")}
          title={t("printer.discoveryTitle")}
          subtitle={t("printer.discoverySubtitle")}
        />
        <View className="flex-row flex-wrap gap-3">
          <Button
            label={t("action.refreshBluetoothPrinters")}
            onPress={() => void refreshBluetoothPrinters()}
            loading={loadingBluetooth}
            className="min-w-[200px]"
          />
          <Button
            label={t("action.refreshUsbPrinters")}
            onPress={() => void refreshUsbPrinters()}
            loading={loadingUsb}
            variant="secondary"
            className="min-w-[200px]"
          />
        </View>

        {loadingBluetooth && bluetoothDevices.length === 0 ? (
          <View className="items-center justify-center rounded-[24px] bg-surface px-5 py-8">
            <ActivityIndicator color="#244734" />
            <Text className="mt-3 text-sm text-muted">{t("printer.checkingBluetoothPrinters")}</Text>
          </View>
        ) : null}

        <DeviceSection
          title={t("printer.bluetoothPrinters")}
          description={t("printer.bluetoothPrintersDescription")}
          devices={bluetoothDevices}
          selectedId={preferredPrinter?.id}
          connectingId={connectingId}
          emptyTitle={t("printer.noBluetoothPrintersFound")}
          emptyDescription={t("printer.noBluetoothPrintersFoundDescription")}
          selectedLabel={t("common.selected")}
          availableLabel={t("common.available")}
          connectLabel={t("action.connectPrinter")}
          reconnectLabel={t("action.reconnectPrinter")}
          onConnect={(device) => void handleConnect(device)}
        />

        <View className="gap-3 rounded-[24px] border border-border bg-card p-4">
          <View className="gap-1">
            <Text className="text-sm font-semibold text-ink">{t("printer.manualBluetoothConnect")}</Text>
            <Text className="text-xs leading-5 text-muted">
              {t("printer.manualBluetoothConnectDescription")}
            </Text>
          </View>
          <TextInput
            value={manualBluetoothName}
            onChangeText={setManualBluetoothName}
            placeholder={t("printer.printerNamePlaceholder")}
            className="min-h-[52px] rounded-[18px] border border-border bg-surface px-4 text-ink"
            placeholderTextColor="#7F8A80"
          />
          <TextInput
            value={manualBluetoothAddress}
            onChangeText={setManualBluetoothAddress}
            placeholder="AA:BB:CC:DD:EE:FF"
            autoCapitalize="characters"
            autoCorrect={false}
            className="min-h-[52px] rounded-[18px] border border-border bg-surface px-4 text-ink"
            placeholderTextColor="#7F8A80"
          />
          <Button
            label={t("action.connectBluetoothByAddress")}
            onPress={handleManualBluetoothConnect}
            loading={connectingId === `bluetooth:${manualBluetoothAddress.trim().toUpperCase()}`}
            className="self-start min-w-[230px]"
          />
        </View>

        <DeviceSection
          title={t("printer.usbPrinters")}
          description={t("printer.usbPrintersDescription")}
          devices={usbDevices}
          selectedId={preferredPrinter?.id}
          connectingId={connectingId}
          emptyTitle={t("printer.noUsbPrintersFound")}
          emptyDescription={t("printer.noUsbPrintersFoundDescription")}
          selectedLabel={t("common.selected")}
          availableLabel={t("common.available")}
          connectLabel={t("action.connectPrinter")}
          reconnectLabel={t("action.reconnectPrinter")}
          onConnect={(device) => void handleConnect(device)}
        />
      </Card>

      <View className="gap-3">
        <Button label={t("action.backToBilling")} onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}
