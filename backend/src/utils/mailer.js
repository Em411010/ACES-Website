const nodemailer = require("nodemailer");

/**
 * Build a transporter only when SMTP credentials are in the environment.
 * In development (no SMTP vars), OTPs are printed to the console instead.
 */
function buildTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

/**
 * Send an OTP verification email.
 * Falls back to console output when SMTP is not configured (dev mode).
 */
async function sendOtpEmail(to, otp) {
  const transporter = buildTransporter();

  if (!transporter) {
    console.log("\n┌─────────────────────────────────────┐");
    console.log("│         [DEV] OTP EMAIL              │");
    console.log(`│  To  : ${to.substring(0, 29).padEnd(29)} │`);
    console.log(`│  Code: ${otp.padEnd(29)} │`);
    console.log("└─────────────────────────────────────┘\n");
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"ACES Platform" <noreply@aces.bcp.edu.ph>',
    to,
    subject: "Your ACES Registration Code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;
                  background:#0F1B2D;color:#fff;border-radius:12px;
                  border:1px solid rgba(0,188,212,0.2)">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="color:#D4A017;margin:0 0 4px">A.C.E.S.</h2>
          <p style="color:#94a3b8;margin:0;font-size:13px">
            Association of Computer Engineering Students
          </p>
        </div>
        <p style="color:#e2e8f0;margin-bottom:8px">Your verification code is:</p>
        <div style="text-align:center;background:#1a2d47;padding:28px;border-radius:10px;
                    border:1px solid rgba(0,188,212,0.15);letter-spacing:16px;
                    font-size:40px;font-weight:bold;color:#00BCD4;font-family:monospace">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:12px;margin-top:24px;text-align:center">
          This code expires in <strong style="color:#94a3b8">10 minutes</strong>.<br>
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
