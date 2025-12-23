export function generateOtp(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export interface OtpStore {
  [key: string]: { otp: string; expiresAt: number };
}

export const otpStore: OtpStore = {};

export function storeOtp(userId: string, otp: string, expiryMinutes: number = 10): void {
  otpStore[userId] = {
    otp,
    expiresAt: Date.now() + expiryMinutes * 60 * 1000,
  };
}

export function verifyOtp(userId: string, otp: string): boolean {
  const stored = otpStore[userId];
  if (!stored) return false;
  
  if (Date.now() > stored.expiresAt) {
    delete otpStore[userId];
    return false;
  }

  if (stored.otp === otp) {
    delete otpStore[userId];
    return true;
  }

  return false;
}
