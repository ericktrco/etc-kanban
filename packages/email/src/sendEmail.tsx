import { render } from "@react-email/render";
import { createLogger } from "@kan/logger";

const log = createLogger("email");

import JoinWorkspaceTemplate from "./templates/join-workspace";
import MagicLinkTemplate from "./templates/magic-link";
import MentionTemplate from "./templates/mention";
import ResetPasswordTemplate from "./templates/reset-password";

type Templates = "MAGIC_LINK" | "JOIN_WORKSPACE" | "RESET_PASSWORD" | "MENTION";

const emailTemplates: Record<Templates, React.ComponentType<any>> = {
  MAGIC_LINK: MagicLinkTemplate,
  JOIN_WORKSPACE: JoinWorkspaceTemplate,
  RESET_PASSWORD: ResetPasswordTemplate,
  MENTION: MentionTemplate,
};

/**
 * Determines the email transport to use based on environment variables.
 * - RESEND_API_KEY → uses Resend HTTP API (works on VPS where SMTP ports are blocked)
 * - SMTP_HOST → uses nodemailer SMTP transport (traditional)
 */
const useResend = !!process.env.RESEND_API_KEY;

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@example.com",
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  return data;
}

async function sendViaSMTP(
  to: string,
  subject: string,
  html: string,
) {
  const nodemailer = await import("nodemailer");

  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure:
      process.env.SMTP_SECURE === undefined
        ? true
        : process.env.SMTP_SECURE?.toLowerCase() === "true",
    tls: {
      rejectUnauthorized:
        process.env.SMTP_REJECT_UNAUTHORIZED === undefined
          ? true
          : process.env.SMTP_REJECT_UNAUTHORIZED?.toLowerCase() === "true",
    },
    // Connection timeouts to prevent indefinite hangs on VPS
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    // Connection pooling to reuse TCP connections
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    ...(process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD && {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      }),
  });

  const response = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (!response.accepted.length) {
    throw new Error(`Failed to send email: ${response.response}`);
  }

  return response;
}

export const sendEmail = async (
  to: string,
  subject: string,
  template: Templates,
  data: Record<string, string>,
) => {
  const transport = useResend ? "resend" : "smtp";
  log.info({ to, subject, template, transport }, "Sending email");
  try {
    const EmailTemplate = emailTemplates[template];

    const html = await render(<EmailTemplate {...data} />, { pretty: true });

    if (useResend) {
      const result = await sendViaResend(to, subject, html);
      log.info({ to, subject, template, id: result?.id }, "Email sent via Resend");
      return result;
    } else {
      const result = await sendViaSMTP(to, subject, html);
      log.info({ to, subject, template, messageId: result.messageId }, "Email sent via SMTP");
      return result;
    }
  } catch (error) {
    log.error({ err: error, to, from: process.env.EMAIL_FROM, subject, template, transport }, "Email sending failed");
    throw error;
  }
};
