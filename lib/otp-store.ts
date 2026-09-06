interface OtpEntry {
  code: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

// Global store to persist across hot reloads in Next.js development
declare global {
  var __tu_otp_store: Map<string, OtpEntry> | undefined;
}

const otpStore: Map<string, OtpEntry> = global.__tu_otp_store || new Map<string, OtpEntry>();
if (process.env.NODE_ENV !== "production") {
  global.__tu_otp_store = otpStore;
}

export function saveOtp(email: string, code: string): { success: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Rate limiting: at least 30 seconds between requests
  if (existing && now - existing.lastSentAt < 30 * 1000) {
    const waitSeconds = Math.ceil((30 * 1000 - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSeconds} seconds before requesting a new code.`,
    };
  }

  // 10 minutes expiry
  otpStore.set(normalizedEmail, {
    code,
    expiresAt: now + 10 * 60 * 1000,
    lastSentAt: now,
    attempts: 0,
  });

  return { success: true };
}

export function verifyOtpCode(
  email: string,
  code: string
): { success: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = otpStore.get(normalizedEmail);

  if (!entry) {
    return {
      success: false,
      error: "No verification code found for this email. Please request a new code.",
    };
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  if (entry.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: "Too many incorrect attempts. Please request a new verification code.",
    };
  }

  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    return {
      success: false,
      error: `Incorrect verification code. ${5 - entry.attempts} attempts remaining.`,
    };
  }

  // Verification succeeded - clear OTP
  otpStore.delete(normalizedEmail);
  return { success: true };
}

export function discardOtp(email: string): void {
  otpStore.delete(email.trim().toLowerCase());
}
