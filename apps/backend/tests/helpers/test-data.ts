let phoneCounter = 0;

export function generateUniquePhone(): string {
  // Use a more compact but still unique approach
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const counter = (++phoneCounter).toString().padStart(4, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `+1${timestamp}${counter}${random}`.substring(0, 15); // Ensure it fits in 15 chars
}

export function getNextPhone(): string {
  return generateUniquePhone();
}

export function generateUniqueEmail(prefix: string = 'test'): string {
  // Use timestamp + random number to ensure uniqueness across parallel tests
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}@example.com`;
}

export function getNextEmail(prefix: string = 'test'): string {
  return generateUniqueEmail(prefix);
}

// These functions are now no-ops since we use timestamps
export function resetPhoneCounter(): void {
  // No-op
}

export function resetEmailCounter(): void {
  // No-op
}

export function resetAllCounters(): void {
  // No-op
}