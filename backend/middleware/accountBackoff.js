// In-memory per-account backoff tracker.
// LIMITATION: resets on server restart and doesn't share state across multiple
// server instances. Fine for a single-process MVP; a real multi-instance
// deployment would move this to Redis or a shared store.
const attempts = new Map(); // normalizedEmail -> { failCount, lockedUntil, lastFailAt }

const BASE_MS = parseInt(process.env.AUTH_BACKOFF_BASE_MS, 10) || 1000;
const MAX_MS = parseInt(process.env.AUTH_BACKOFF_MAX_MS, 10) || 300000;
const RESET_AFTER_MS = parseInt(process.env.AUTH_BACKOFF_RESET_AFTER_MS, 10) || 3600000;

function computeDelay(failCount) {
  // Exponential: base * 2^(failCount-1), capped at MAX_MS
  const delay = BASE_MS * Math.pow(2, failCount - 1);
  return Math.min(delay, MAX_MS);
}

/**
 * Call before attempting a login. Rejects (via thrown error with retryAfterMs)
 * if this account is currently in a backoff window.
 */
export function checkAccountBackoff(email) {
  const entry = attempts.get(email);
  if (!entry) return;

  // Auto-reset if it's been long enough since the last failure
  if (Date.now() - entry.lastFailAt > RESET_AFTER_MS) {
    attempts.delete(email);
    return;
  }

  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const retryAfterMs = entry.lockedUntil - Date.now();
    const err = new Error("Too many failed attempts. Please wait before trying again.");
    err.retryAfterMs = retryAfterMs;
    throw err;
  }
}

/** Call after a failed password check — increases backoff for next attempt. */
export function recordFailedAttempt(email) {
  const entry = attempts.get(email) || { failCount: 0 };
  entry.failCount += 1;
  entry.lastFailAt = Date.now();
  entry.lockedUntil = Date.now() + computeDelay(entry.failCount);
  attempts.set(email, entry);
}

/** Call after a successful login — clears any backoff state for this account. */
export function clearFailedAttempts(email) {
  attempts.delete(email);
}