import { z } from "zod";

// Shared field validators (docs/SECURITY.md input validation).

const trimmed = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`);

export const nameField = trimmed(120).min(2, "Enter your full name");

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email("Enter a valid email address"));

/** Indian mobile: 10 digits starting 6-9. Accepts +91 / 0 prefixes and spaces. */
export const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=[6-9]\d{9}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

export const pincodeField = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode");

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .transform((value) => (value ? value : null));

export const uuidField = z.uuid("Invalid id");

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const stateField = z.enum(INDIAN_STATES, { error: "Select your state" });

export const addressSchema = z.object({
  fullName: nameField,
  phone: phoneField,
  line1: trimmed(200).min(3, "Enter your house / flat and street"),
  line2: optionalText(200),
  area: optionalText(120),
  city: trimmed(80).min(2, "Enter your city"),
  state: stateField,
  pincode: pincodeField,
  landmark: optionalText(120),
});
export type AddressInput = z.infer<typeof addressSchema>;

/** Reads a FormData into a plain object of strings (checkboxes as "on"). */
export function formToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}
