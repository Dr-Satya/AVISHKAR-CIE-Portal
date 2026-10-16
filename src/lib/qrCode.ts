import QRCode from "qrcode";

export interface QrCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a PNG Data URL for a given URL (e.g., Google Form responder link)
 */
export async function generateQrCodeDataUrl(
  text: string,
  options?: QrCodeOptions
): Promise<string> {
  if (!text || !text.trim()) {
    throw new Error("Cannot generate QR code: target URL is empty.");
  }

  return QRCode.toDataURL(text.trim(), {
    width: options?.width || 360,
    margin: options?.margin !== undefined ? options?.margin : 2,
    color: {
      dark: options?.color?.dark || "#0F172A", // Slate 900
      light: options?.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generates an SVG string representation of the QR code
 */
export async function generateQrCodeSvg(
  text: string,
  options?: QrCodeOptions
): Promise<string> {
  if (!text || !text.trim()) {
    throw new Error("Cannot generate QR code: target URL is empty.");
  }

  return QRCode.toString(text.trim(), {
    type: "svg",
    width: options?.width || 360,
    margin: options?.margin !== undefined ? options?.margin : 2,
    color: {
      dark: options?.color?.dark || "#0F172A",
      light: options?.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}
