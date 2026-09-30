import "server-only";
import { emailConfig, emailProviderName, isProductionDeployment } from "@/lib/env";
import { log } from "@/lib/utils/log";

// Email provider abstraction (docs/DECISIONS.md ADR-006). Resend is used over its REST API;
// "console" logs emails for local development and is refused on production deployments.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

const resendProvider: EmailProvider = {
  name: "resend",
  async send(message) {
    const { apiKey, from } = emailConfig();
    if (!apiKey) throw new Error("EMAIL_API_KEY is not set");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Resend failed with ${response.status}: ${await response.text().catch(() => "")}`);
  },
};

const consoleProvider: EmailProvider = {
  name: "console",
  async send(message) {
    log.info("email.console", `To ${message.to}: ${message.subject}`, { text: message.text });
  },
};

function provider(): EmailProvider | null {
  if (emailProviderName() === "resend") return resendProvider;
  if (isProductionDeployment) {
    log.error("email", new Error("EMAIL_PROVIDER=console on a production deployment; emails are not sent"));
    return null;
  }
  return consoleProvider;
}

/**
 * Sends an email and never throws: a notification failure must not break checkout or
 * payment processing. Failures are logged for follow-up.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const active = provider();
  if (!active) return false;
  try {
    await active.send(message);
    return true;
  } catch (error) {
    log.error("email.send", error, { provider: active.name, subject: message.subject });
    return false;
  }
}
