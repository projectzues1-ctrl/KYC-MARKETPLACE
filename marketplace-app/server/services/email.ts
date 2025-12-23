import nodemailer from "nodemailer";

/**
 * ENV CONFIG
 */
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT) || undefined;
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const smtpFrom =
  process.env.SMTP_FROM ||
  process.env.GMAIL_SENDER_EMAIL ||
  "kycmarketplace.noreply@gmail.com";

const enableEmail = (process.env.ENABLE_EMAIL || "true").toLowerCase() !== "false";

/**
 * FALLBACK GMAIL CONFIG
 */
const gmailSender = process.env.GMAIL_SENDER_EMAIL || "";
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || "";

let transporter: nodemailer.Transporter | null = null;

/**
 * CREATE TRANSPORTER
 */
if (smtpHost && smtpPort && smtpUser && smtpPass && enableEmail) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // ✅ FIX: correct TLS handling
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    pool: true, // ✅ REQUIRED for pooling options
    maxConnections: 3,
    maxMessages: 50,
    rateDelta: 1000,
    rateLimit: 3,
    connectionTimeout: 5000, // ✅ FAST FAIL
    socketTimeout: 5000,
    greetingTimeout: 5000,
  });

  console.log(`✅ SMTP enabled (${smtpHost}:${smtpPort})`);
} else if (gmailSender && gmailAppPassword && enableEmail) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: gmailSender,
      pass: gmailAppPassword,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    rateDelta: 1000,
    rateLimit: 3,
    connectionTimeout: 5000,
    socketTimeout: 5000,
    greetingTimeout: 5000,
  });

  console.log("✅ Gmail SMTP fallback enabled");
} else {
  if (enableEmail) {
    console.warn("⚠️  Email is ENABLED but no SMTP configuration found");
  }
}

/**
 * SEND EMAIL (NO RETRIES — FAST + SAFE)
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!transporter) throw new Error("Email transporter not configured");

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
  });
}

/**
 * PUBLIC FUNCTIONS — NON-BLOCKING
 */
export function sendVerificationEmail(email: string, code: string): void {
  if (!transporter) {
    console.warn("⚠️  Email disabled. Verification code:", code);
    return;
  }

  sendEmail(
    email,
    "Verify Your Email Address - KYC Marketplace",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background:#f0f0f0;padding:15px;border-radius:5px;
          text-align:center;font-size:24px;font-weight:bold;">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  ).catch(err => {
    console.error("❌ Verification email failed:", err.message || err);
  });
}

export function sendPasswordResetEmail(email: string, code: string): void {
  if (!transporter) {
    console.warn("⚠️  Email disabled. Reset code:", code);
    return;
  }

  sendEmail(
    email,
    "Reset Your Password - KYC Marketplace",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Your reset code is:</p>
        <div style="background:#f0f0f0;padding:15px;border-radius:5px;
          text-align:center;font-size:24px;font-weight:bold;">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  ).catch(err => {
    console.error("❌ Password reset email failed:", err.message || err);
  });
}

export function send2FAResetEmail(email: string, code: string): void {
  if (!transporter) {
    console.warn("⚠️  Email disabled. 2FA reset code:", code);
    return;
  }

  sendEmail(
    email,
    "Reset Two-Factor Authentication - KYC Marketplace",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>2FA Reset</h2>
        <p>Your 2FA reset code is:</p>
        <div style="background:#f0f0f0;padding:15px;border-radius:5px;
          text-align:center;font-size:24px;font-weight:bold;">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  ).catch(err => {
    console.error("❌ 2FA reset email failed:", err.message || err);
  });
}
