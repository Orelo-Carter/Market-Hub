import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function createTransporter() {
  const { host, port, user, pass } = env.smtp;

  if (!host || !port || !user || !pass) {
    throw new AppError('SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.', 500);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendManagerInviteEmail({ to, storeName, inviteUrl }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: `You're invited to manage ${storeName} on Markethub`,
    text: [
      `You've been invited to manage ${storeName} on Markethub.`,
      'Set your password using the link below. This invite expires in 48 hours.',
      inviteUrl,
    ].join('\n\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#17181A">
        <h2>You're invited to manage ${storeName}</h2>
        <p>Set your password using the secure link below. This invite expires in 48 hours.</p>
        <p><a href="${inviteUrl}">Set password</a></p>
      </div>
    `,
  });
}
