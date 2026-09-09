export const MAX_SLIP_BYTES = 4_500_000;
export function detectSlipType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: "image/jpeg", extension: "jpg" };
  if ([137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)) return { type: "image/png", extension: "png" };
  return null;
}
