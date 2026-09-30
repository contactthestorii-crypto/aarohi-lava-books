import { z } from "zod";
import { emailField, nameField } from "./common";

export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password").max(72),
});

export const registerSchema = z
  .object({
    fullName: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const forgotSchema = z.object({ email: emailField });

export const resetSchema = z
  .object({ password: passwordField, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

/** Only allow same-site relative redirects after login (prevents open redirects). */
export function safeNext(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value.slice(0, 300);
}
