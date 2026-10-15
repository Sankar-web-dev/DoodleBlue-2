import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP mailer for transactional email (account invites, temp passwords).
 *
 * Configure via env:
 *   MAIL_HOST / MAIL_PORT / MAIL_USER / MAIL_PASS / MAIL_FROM
 * (Gmail: host smtp.gmail.com, port 465, and an App Password as MAIL_PASS.)
 *
 * The transporter is created lazily — dotenv.config() runs after this module's
 * imports are evaluated, so env vars are not safe to read at module top level.
 */

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS
  );
}

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  transporter = isMailConfigured()
    ? nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT ?? 465),
        secure: Number(process.env.MAIL_PORT ?? 465) === 465,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      })
    : null;

  if (transporter) {
    transporter
      .verify()
      .then(() => console.log("[mail] SMTP connection verified"))
      .catch((error: unknown) =>
        console.warn(
          "[mail] SMTP verify failed:",
          error instanceof Error ? error.message : error
        )
      );
  } else {
    console.warn(
      "[mail] SMTP not configured — set MAIL_HOST/MAIL_USER/MAIL_PASS in .env"
    );
  }

  return transporter;
}

/**
 * Sends a newly provisioned account's temporary password.
 * Returns false (without throwing) when SMTP is not configured or send fails.
 */
export async function sendTempPasswordEmail(opts: {
  to: string;
  name: string;
  password: string;
}): Promise<boolean> {
  const tx = getTransporter();
  if (!tx) {
    console.warn(
      `[mail] SMTP not configured — could not send credentials to ${opts.to}`
    );
    return false;
  }

  const loginUrl = `${process.env.CLIENT_URL ?? "http://localhost:3000"}/login`;

  try {
    await tx.sendMail({
      from:
        process.env.MAIL_FROM ?? `CampusLMS <${process.env.MAIL_USER}>`,
      to: opts.to,
      subject: "Your CampusLMS account is ready",
      html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Welcome to CampusLMS, ${opts.name}</h2>
        <p style="color:#555">An account has been created for you. Sign in with these credentials:</p>
        <div style="background:#f5f5f7;border:1px solid #e2e2e8;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Email:</strong> ${opts.to}</p>
          <p style="margin:0"><strong>Temporary password:</strong>
            <code style="background:#ececf1;padding:2px 8px;border-radius:6px;font-size:15px">${opts.password}</code>
          </p>
        </div>
        <a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:600">Log in to CampusLMS</a>
        <p style="color:#555;font-size:13px;margin-top:16px">
          For security, you will be required to set a new password the first time you log in.
        </p>
      </div>
    `,
    });
    return true;
  } catch (error) {
    console.error(
      `[mail] Failed to send credentials to ${opts.to}:`,
      error
    );
    return false;
  }
}
