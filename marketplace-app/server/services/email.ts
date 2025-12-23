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
    connectionTimeout: 30000, // 30 seconds for initial connection
    socketTimeout: 30000,     // 30 seconds for socket operations
    greetingTimeout: 10000,   // 10 seconds to wait for SMTP greeting
    pool: {
      maxConnections: 3,
      maxMessages: 50,
      rateDelta: 1000,
      rateLimit: 3,
    },
  });
  console.log(`✅ SMTP configured (${smtpHost}:${smtpPort}) with 30s timeout for sending emails`);
} else if (gmailSender && gmailAppPassword && enableEmail) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: gmailSender,
      pass: gmailAppPassword,
    },
    connectionTimeout: 30000, // 30 seconds for initial connection
    socketTimeout: 30000,     // 30 seconds for socket operations
    greetingTimeout: 10000,   // 10 seconds to wait for SMTP greeting
    pool: {
      maxConnections: 3,
      maxMessages: 50,
      rateDelta: 1000,
      rateLimit: 3,
    },
  });
  console.log("✅ Gmail configured as fallback (30s timeout) for sending emails");
} else {
  if (enableEmail) console.warn("⚠️  No SMTP configuration found - email sending will be disabled");
}

// Helper to get the From address
function getFromAddress() {
  return smtpFrom || gmailSender;
}

// Helper function to retry email sends with backoff
async function sendEmailWithRetry(
  transporter: nodemailer.Transporter,
  mailOptions: any,
  maxRetries: number = 3
): Promise<void> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Email] Attempt ${attempt}/${maxRetries} to send to ${mailOptions.to}`);
      await transporter.sendMail(mailOptions);
      console.log(`[Email] ✅ Successfully sent email to ${mailOptions.to}`);
      return; // Success, exit retry loop
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || error?.code || String(error);
      console.warn(`[Email] ⚠️  Attempt ${attempt}/${maxRetries} failed: ${errorMsg}`);
      if (attempt < maxRetries) {
        const delayMs = Math.min(2000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff: 2s, 4s, 8s
        console.log(`[Email] Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  // All retries failed
  throw new Error(`Email sending failed after ${maxRetries} attempts: ${lastError?.message || lastError}`);
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
    await sendEmailWithRetry(transporter, {
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
    await sendEmailWithRetry(transporter, {
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
    await sendEmailWithRetry(transporter, {
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
