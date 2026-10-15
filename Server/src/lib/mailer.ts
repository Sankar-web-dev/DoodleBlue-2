import { Resend } from "resend";

/**
 * Resend mailer for transactional email (account invites, temp passwords).
 *
 * Configure via env:
 *   RESEND_API_KEY — API key from https://resend.com
 *   MAIL_FROM      — sender identity (defaults to Resend's test sender)
 *
 * The client is created lazily — dotenv.config() runs after this module's
 * imports are evaluated, so env vars are not safe to read at module top level.
 */

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

let resend: Resend | null | undefined;

function getResend(): Resend | null {
  if (resend !== undefined) return resend;

  resend = isMailConfigured() ? new Resend(process.env.RESEND_API_KEY) : null;

  if (!resend) {
    console.warn("[mail] Resend not configured — set RESEND_API_KEY in .env");
  }

  return resend;
}

/**
 * Sends a newly provisioned account's temporary password.
 * Returns false (without throwing) when Resend is not configured or send fails.
 */
export async function sendTempPasswordEmail(opts: {
  to: string;
  name: string;
  password: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn(
      `[mail] Resend not configured — could not send credentials to ${opts.to}`
    );
    return false;
  }

  const loginUrl = `${process.env.CLIENT_URL ?? "http://localhost:3000"}/login`;

  const { data, error } = await client.emails.send({
    from: process.env.MAIL_FROM ?? "CampusLMS <onboarding@resend.dev>",
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

  if (error) {
    console.error(
      `[mail] Failed to send credentials to ${opts.to}:`,
      error.message
    );
    return false;
  }

  console.log(`[mail] Credentials sent to ${opts.to} (id: ${data.id})`);
  return true;
}
