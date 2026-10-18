const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT = 587,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL = 'noreply@traveloop.com',
  FROM_NAME = 'Traveloop',
} = process.env;

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Send an email with graceful fallback to console logging
 */
async function sendMail({ to, subject, html, text }) {
  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
    html,
  };

  if (!transporter) {
    console.log('\n[Mailer - Local Development Fallback]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html}\n`);
    return { success: true, mode: 'local_fallback', messageId: `local-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Email sent to ${to}: ${info.messageId}`);
    return { success: true, mode: 'smtp', messageId: info.messageId };
  } catch (err) {
    console.warn(`[Mailer Warning] Failed to send email via SMTP to ${to}:`, err.message);
    return { success: false, error: err.message, mode: 'fallback' };
  }
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const subject = 'Reset Your Traveloop Password';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #2563eb; margin-top: 0;">Traveloop Password Reset</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We received a request to reset your password for your Traveloop account. You can complete the reset by clicking the button below:
      </p>
      <div style="margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
        Or paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">
        If you did not make this request, you can safely ignore this message. Your password will remain unchanged.
      </p>
    </div>
  `;
  return sendMail({ to, subject, html, text: `Reset your Traveloop password: ${resetUrl}` });
}

async function sendTripShareEmail({ to, senderName, tripTitle, shareUrl }) {
  const subject = `${senderName || 'A traveler'} shared an itinerary with you on Traveloop`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #2563eb; margin-top: 0;">Trip Shared: ${tripTitle}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        ${senderName || 'Someone'} has invited you to view their curated travel itinerary on Traveloop.
      </p>
      <div style="margin: 28px 0;">
        <a href="${shareUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          View Itinerary
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
        Direct link: <a href="${shareUrl}" style="color: #2563eb; word-break: break-all;">${shareUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">
        Traveloop - Multi-City Itinerary & Budget Planner
      </p>
    </div>
  `;
  return sendMail({ to, subject, html, text: `${senderName || 'A friend'} shared "${tripTitle}": ${shareUrl}` });
}

module.exports = {
  sendMail,
  sendPasswordResetEmail,
  sendTripShareEmail,
};
