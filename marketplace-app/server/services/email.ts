import nodemailer from "nodemailer";

// Prefer generic SMTP env vars so services like Brevo work.
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = parseInt(process.env.SMTP_PORT || "0", 10) || undefined;
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const smtpFrom = process.env.SMTP_FROM || process.env.GMAIL_SENDER_EMAIL || "kycmarketplace.noreply@gmail.com";
const enableEmail = (process.env.ENABLE_EMAIL || "true").toLowerCase() !== "false";

// Fallback Gmail config
const gmailSender = process.env.GMAIL_SENDER_EMAIL || "kycmarketplace.noreply@gmail.com";
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || "";

let transporter: nodemailer.Transporter | null = null;

// Initialize transporter with SMTP or Gmail fallback
if (smtpHost && smtpPort && smtpUser && smtpPass && enableEmail) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // Use STARTTLS
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  console.log(`✅ SMTP configured (${smtpHost}:${smtpPort}) for sending emails`);
} else if (gmailSender && gmailAppPassword && enableEmail) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: gmailSender,
      pass: gmailAppPassword,
    },
  });
  console.log("✅ Gmail configured as fallback for sending emails");
} else {
  if (enableEmail) console.warn("⚠️  No SMTP configuration found - email sending will be disabled");
}

// Helper to get the From address
function getFromAddress() {
  return smtpFrom || gmailSender;
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️  Email service not configured. Verification code:", code);
    return false;
  }

  try {
    console.log(`Sending verification email to ${email}...`);
    await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: "Verify Your Email Address - KYC Marketplace",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification Required</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Email sending failed for ${email}:`, error?.message || error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️  Email service not configured. Reset code:", code);
    return false;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: "Reset Your Password - KYC Marketplace",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Your password reset code is:</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error("❌ Email sending failed:", error?.message || error);
    return false;
  }
}

export async function send2FAResetEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️  Email service not configured. 2FA reset code:", code);
    return false;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: "Reset Two-Factor Authentication - KYC Marketplace",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Two-Factor Authentication Reset</h2>
          <p>Your 2FA reset code is:</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this action, please ignore this email.</p>
        </div>
      `,
    });
    console.log(`✅ 2FA reset email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error("❌ Email sending failed:", error?.message || error);
    return false;
  }
}
