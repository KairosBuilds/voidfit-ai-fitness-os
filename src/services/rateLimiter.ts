const MAX_CALLS_PER_WINDOW = 60;
const WINDOW_MS = 60_000;
const COOLDOWN_MS = 120_000;
let callCount = 0;
let windowStart = Date.now();
let cooldownUntil = 0;

export function checkRateLimit(): boolean {
  const now = Date.now();

  if (now < cooldownUntil) return false;

  if (now - windowStart >= WINDOW_MS) {
    callCount = 0;
    windowStart = now;
  }

  if (callCount >= MAX_CALLS_PER_WINDOW) {
    cooldownUntil = now + COOLDOWN_MS;
    return false;
  }

  callCount++;
  return true;
}

export function enforceRateLimit(): void {
  if (!checkRateLimit()) {
    const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
    throw new Error(`Rate limit reached. Please wait ${remaining} seconds before trying again.`);
  }
}

