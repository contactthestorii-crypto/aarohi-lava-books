import { z } from "zod";
import { addressSchema, emailField, nameField, optionalText, phoneField } from "./common";

// Shared by the checkout form (client-side hints) and the server (authoritative).
// Note what is NOT here: prices, totals, discounts, stock. Those are computed on the server.

export const contactSchema = z.object({
  fullName: nameField,
  email: emailField,
  phone: phoneField,
});

export const checkoutSchema = z.object({
  idempotencyKey: z.uuid(),
  contact: contactSchema,
  address: addressSchema,
  saveAddress: z.boolean().default(false),
  shippingMethod: z.literal("standard").default("standard"),
  paymentMethod: z.enum(["online", "cod"]),
  couponCode: z.string().trim().max(32).nullable().optional(),
  customerNote: optionalText(500),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

export const quoteRequestSchema = z.object({
  paymentMethod: z.enum(["online", "cod"]).default("online"),
  couponCode: z.string().trim().max(32).nullable().optional(),
  email: z.string().trim().max(254).optional(),
  phone: z.string().trim().max(15).optional(),
});

export const orderAccessSchema = z.object({
  orderNumber: z.string().trim().regex(/^AL\d{6}-[0-9A-F]{5}$/i, "Invalid order ID").transform((v) => v.toUpperCase()),
  token: z.uuid(),
});
