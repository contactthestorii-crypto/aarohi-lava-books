"use server";

import { z } from "zod";
import { failure, invalid, type ActionResult } from "@/lib/action-result";
import { sendEmail } from "@/lib/email";
import { emailConfig } from "@/lib/env";
import { checkRateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { getAdminSupabase, isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { emailField, nameField, phoneField } from "@/lib/validation/common";

const schema = z.object({
  name: nameField,
  email: emailField,
  phone: z.union([z.literal(""), phoneField]).transform((v) => v || null),
  subject: z.string().trim().max(160).transform((v) => v || null),
  message: z.string().trim().min(5, "Write a short message").max(4000),
  // Honeypot: real visitors never fill this hidden field.
  website: z.string().max(0).optional(),
});

export async function sendContactMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "Thanks. We will reply by email." };
    return invalid(parsed.error);
  }
  if (!isAdminClientConfigured()) return failure("The contact form is not available yet. Please email us directly.");
  if (!(await checkRateLimit("contact"))) return failure(RATE_LIMITED_MESSAGE);

  const { name, email, phone, subject, message } = parsed.data;
  const { error } = await getAdminSupabase().from("contact_messages").insert({ name, email, phone, subject, message });
  if (error) {
    log.error("contact.save", error);
    return failure("We could not send your message. Please try again.");
  }
  const { adminEmail } = emailConfig();
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      replyTo: email,
      subject: `Contact form: ${subject ?? "New message"} (${name})`,
      text: `${name} <${email}>${phone ? `, ${phone}` : ""}\n\n${message}`,
      html: `<p><b>${name.replace(/</g, "&lt;")}</b> &lt;${email}&gt;${phone ? `, ${phone}` : ""}</p><p style="white-space:pre-line">${message.replace(/</g, "&lt;")}</p>`,
    });
  }
  return { ok: true, message: "Thanks for writing to us. We will reply by email." };
}
