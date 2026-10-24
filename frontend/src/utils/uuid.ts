/**
 * Generates a time-ordered UUIDv7 identifier for client-side entity creation.
 * Conforms to RFC 9562 to guarantee monotonic chronological sorting.
 * Provides a fallback to UUIDv4 when Web Cryptography API getRandomValues is unavailable.
 */

let lastTimestamp = -1;
let sequence = 0;

export function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    let timestamp = Date.now();

    if (timestamp === lastTimestamp) {
      sequence = (sequence + 1) & 0x0fff;
      if (sequence === 0) {
        // Sequence rolled over in the same millisecond; advance timestamp to maintain monotonicity
        timestamp++;
        lastTimestamp = timestamp;
      }
    } else if (timestamp > lastTimestamp) {
      sequence = 0;
      lastTimestamp = timestamp;
    } else {
      // Clock moved backwards; maintain chronological order
      timestamp = lastTimestamp;
      sequence = (sequence + 1) & 0x0fff;
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // 48-bit timestamp (milliseconds since epoch)
    bytes[0] = Math.floor(timestamp / 0x10000000000) & 0xff;
    bytes[1] = Math.floor(timestamp / 0x100000000) & 0xff;
    bytes[2] = Math.floor(timestamp / 0x1000000) & 0xff;
    bytes[3] = Math.floor(timestamp / 0x10000) & 0xff;
    bytes[4] = Math.floor(timestamp / 0x100) & 0xff;
    bytes[5] = timestamp & 0xff;

    // Version 7: 0x70 with 4 bits of sequence
    bytes[6] = 0x70 | ((sequence >> 8) & 0x0f);
    // Low 8 bits of sequence
    bytes[7] = sequence & 0xff;

    // Variant 1: 10xxxxxx
    bytes[8] = 0x80 | (bytes[8] & 0x3f);

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Fallback to UUIDv4 if crypto.getRandomValues is unavailable
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
