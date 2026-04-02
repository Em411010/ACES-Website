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

/**
 * Send a membership acceptance email when an officer approves a registration.
 * @param {string} to            - member's email
 * @param {string} memberName    - member's full name
 * @param {string} approverName  - officer's full name
 * @param {string} approverRole  - officer's role / position title
 */
async function sendWelcomeEmail(to, memberName, approverName, approverRole) {
  const transporter = buildTransporter();

  if (!transporter) {
    console.log("\n┌────────────────────────────────────────────┐");
    console.log("│         [DEV] WELCOME EMAIL                 │");
    console.log(`│  To      : ${to.substring(0, 31).padEnd(31)} │`);
    console.log(`│  Member  : ${memberName.substring(0, 31).padEnd(31)} │`);
    console.log(`│  Approver: ${approverName.substring(0, 31).padEnd(31)} │`);
    console.log("└────────────────────────────────────────────┘\n");
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"ACES Platform" <noreply@aces.bcp.edu.ph>',
    to,
    subject: "Welcome to ACES — Your Membership Has Been Approved!",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A1120;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1120;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#0F1B2D;border-radius:16px;border:1px solid rgba(0,188,212,0.2);overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d2137 0%,#0a2a3a 100%);padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(0,188,212,0.15)">
            <div style="display:inline-block;background:rgba(0,188,212,0.1);border:1px solid rgba(0,188,212,0.3);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;margin-bottom:16px">🎓</div>
            <h1 style="margin:0 0 4px;color:#D4A017;font-size:22px;letter-spacing:2px">A.C.E.S.</h1>
            <p style="margin:0;color:#94a3b8;font-size:12px">Association of Computer Engineering Students</p>
            <p style="margin:4px 0 0;color:#64748b;font-size:11px">Bestlink College of the Philippines · ICPEP.SE NCR Chapter</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;color:#94a3b8;font-size:14px">Dear <strong style="color:#e2e8f0">${memberName}</strong>,</p>
            <p style="margin:0 0 20px;color:#94a3b8;font-size:14px;line-height:1.7">
              We are pleased to inform you that your membership application to the
              <strong style="color:#e2e8f0">Association of Computer Engineering Students (ACES)</strong>
              has been reviewed and officially <strong style="color:#00BCD4">approved</strong>.
            </p>

            <!-- Status badge -->
            <div style="text-align:center;margin:24px 0">
              <div style="display:inline-block;background:rgba(0,188,212,0.1);border:1px solid rgba(0,188,212,0.3);border-radius:50px;padding:12px 32px">
                <span style="color:#00BCD4;font-size:13px;font-weight:bold;letter-spacing:1px">✓ MEMBERSHIP APPROVED</span>
              </div>
            </div>

            <p style="margin:0 0 20px;color:#94a3b8;font-size:14px;line-height:1.7">
              You can now log in to the ACES platform to access all member features including
              announcements, task board, document vault, events, and more.
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin:28px 0">
              <a href="${process.env.CLIENT_URL || "https://aces-platform.onrender.com"}/login"
                 style="display:inline-block;background:#D4A017;color:#0A1120;font-weight:bold;font-size:14px;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.5px">
                Log In to ACES Platform →
              </a>
            </div>

            <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6">
              If you have any questions or concerns, feel free to reach out to any of our officers.
              We look forward to your active participation in the organization.
            </p>
          </td>
        </tr>

        <!-- Footer / Approver -->
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid rgba(255,255,255,0.06)">
            <p style="margin:0 0 2px;color:#94a3b8;font-size:12px">Approved by:</p>
            <p style="margin:0;color:#e2e8f0;font-size:14px;font-weight:bold">${approverName}</p>
            <p style="margin:2px 0 0;color:#00BCD4;font-size:12px">${approverRole}</p>
            <p style="margin:16px 0 0;color:#3d5166;font-size:11px">
              ACES · Bestlink College of the Philippines, ICPEP.SE NCR Chapter<br>
              This is an automated email — please do not reply directly.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}

module.exports = { sendOtpEmail, sendWelcomeEmail };
