/**
 * EMVCo PromptPay QR Code Payload Generator (CRC16-CCITT)
 * Reference: Bank of Thailand PromptPay Standard Specification
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function f(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/**
 * Formats a raw PromptPay ID into standard EMVCo sub-tag 01 or 02 format
 * - Phone number: 0812345678 -> 0066812345678 (13 digits)
 * - National ID / Tax ID: 13 digits
 * - e-Wallet ID: 15 digits
 */
export function formatPromptPayTarget(target: string): string {
  const cleaned = target.replace(/[^0-9]/g, "");
  if (cleaned.length >= 9 && cleaned.length <= 10 && cleaned.startsWith("0")) {
    // Phone number: replace leading 0 with 0066
    return "0066" + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Formats PromptPay ID for user-friendly display:
 * - 10-digit mobile: 063-090-7500
 * - 9-digit landline: 02-xxx-xxxx
 * - 13-digit National ID: 1-2345-67890-12-3
 */
export function formatPromptPayDisplay(target: string): string {
  const cleaned = target.replace(/[^0-9]/g, "");
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`;
  }
  return target;
}

/**
 * Generates an EMVCo PromptPay QR payload string.
 * @param target Phone number (08xxxxxxxx) or 13-digit National ID / Tax ID
 * @param amount Optional payment amount (e.g. 14900.00)
 */
export function generatePromptPayPayload(target: string, amount?: number | null): string {
  const formattedTarget = formatPromptPayTarget(target);
  const isPhone = formattedTarget.startsWith("0066");

  // Tag 29: Merchant Account Information (PromptPay AID: A000000677010111)
  const targetTag = isPhone ? "01" : "02";
  const subTag00 = f("00", "A000000677010111");
  const subTagTarget = f(targetTag, formattedTarget);
  const tag29 = f("29", `${subTag00}${subTagTarget}`);

  let payload = [
    f("00", "01"), // Payload Format Indicator
    f("01", amount && amount > 0 ? "12" : "11"), // 11 = Static QR (any amount), 12 = Dynamic QR (specific amount)
    tag29,
    f("53", "764"), // Transaction Currency: THB (764)
    f("58", "TH"),  // Country Code: TH
  ].join("");

  if (amount !== undefined && amount !== null && amount > 0) {
    payload += f("54", amount.toFixed(2));
  }

  // Tag 63: CRC placeholder
  const rawWithTag63 = payload + "6304";
  const checksum = crc16(rawWithTag63);

  return `${rawWithTag63}${checksum}`;
}
