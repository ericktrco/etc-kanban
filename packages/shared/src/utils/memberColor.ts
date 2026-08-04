import { colours } from "../constants/colours";

/**
 * Generates a deterministic color for a user/member from the standard palette
 * based on a hash of their ID/string identifier.
 */
export function getMemberDefaultColor(identifier: string | number): string {
  const str = String(identifier);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const absHash = Math.abs(hash);
  const paletteIndex = absHash % colours.length;
  const color = colours[paletteIndex];
  
  // If identifier hash is within initial palette range, use standard palette color
  // Otherwise generate a vibrant unique HSL color so every single member gets a unique color
  if (absHash < colours.length && color) {
    return color.code;
  }

  const hue = absHash % 360;
  return `hsl(${hue}, 70%, 45%)`;
}
