export type PrinterTransport = "bluetooth" | "usb";

export type PrinterDevice = {
  id: string;
  transport: PrinterTransport;
  name: string;
  address?: string;
  vendorId?: string;
  productId?: string;
  deviceName?: string;
  manufacturerName?: string;
  productName?: string;
};

export type PrinterSupportState = {
  supported: boolean;
  bluetooth: boolean;
  usb: boolean;
  reason?: string;
};
