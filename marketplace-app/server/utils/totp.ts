import speakeasy from "speakeasy";
import QRCode from "qrcode";

export interface TotpSecret {
  secret: string;
  qrCode: string;
}

export async function generateTotpSecret(username: string): Promise<TotpSecret> {
  const secret = speakeasy.generateSecret({
    name: `P2P Marketplace (${username})`,
    length: 32,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
  };
}

export function verifyTotp(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2,
  });
}

export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}
