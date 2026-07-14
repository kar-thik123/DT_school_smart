export function safeNormalize(value: any): string {
  // Convert any value to a string safely, handling null/undefined, numbers, booleans, etc.
  return String(value ?? "").trim();
}
