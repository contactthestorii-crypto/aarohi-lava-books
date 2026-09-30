import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { renderOrderEmail } from "@/lib/email/templates";
import { rejectCrossSite } from "@/lib/http";
import { bookFormToObject, bookSchema, slugify } from "@/lib/validation/admin";
import { safeNext } from "@/lib/validation/auth";
import { checkoutSchema } from "@/lib/validation/checkout";
import { phoneField, pincodeField } from "@/lib/validation/common";

describe("phone and pincode", () => {
  it.each(["9876543210", "+91 98765 43210", "09876543210", "98765-43210"])("accepts %s", (input) => {
    expect(phoneField.parse(input)).toBe("9876543210");
  });
  it.each(["12345", "5876543210", "98765432101", "abcdefghij"])("rejects %s", (input) => {
    expect(phoneField.safeParse(input).success).toBe(false);
  });
  it("validates Indian pincodes", () => {
    expect(pincodeField.safeParse("500001").success).toBe(true);
    expect(pincodeField.safeParse("050001").success).toBe(false);
    expect(pincodeField.safeParse("5000").success).toBe(false);
  });
});

describe("checkout payload", () => {
  const valid = {
    idempotencyKey: "0b8f3f7e-6a1e-4d7e-9c2f-1f2a3b4c5d6e",
    contact: { fullName: "Ravi Kumar", email: "Ravi@Example.com", phone: "9876543210" },
    address: { fullName: "Ravi Kumar", phone: "9876543210", line1: "12-3-45, Main Road", city: "Warangal", state: "Telangana", pincode: "506002" },
    paymentMethod: "online",
  };

  it("accepts a valid payload and normalises email", () => {
    const parsed = checkoutSchema.parse(valid);
    expect(parsed.contact.email).toBe("ravi@example.com");
    expect(parsed.shippingMethod).toBe("standard");
  });

  it("ignores any price fields a client might send", () => {
    const parsed = checkoutSchema.parse({ ...valid, totalPaise: 1, discountPaise: 99999 });
    expect(parsed).not.toHaveProperty("totalPaise");
    expect(parsed).not.toHaveProperty("discountPaise");
  });

  it("rejects unknown states and payment methods", () => {
    expect(checkoutSchema.safeParse({ ...valid, address: { ...valid.address, state: "Atlantis" } }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: "crypto" }).success).toBe(false);
  });
});

describe("safeNext (open redirect guard)", () => {
  it("allows relative paths only", () => {
    expect(safeNext("/account/orders")).toBe("/account/orders");
    expect(safeNext("//evil.example")).toBe("/account");
    expect(safeNext("https://evil.example")).toBe("/account");
    expect(safeNext("/\\evil.example")).toBe("/account");
    expect(safeNext(undefined)).toBe("/account");
  });
});

describe("admin book schema", () => {
  const form = (entries: Record<string, string>) => {
    const data = new FormData();
    for (const [key, value] of Object.entries(entries)) data.set(key, value);
    return bookFormToObject(data);
  };

  it("keeps unknown facts as null and converts rupees to paise", () => {
    const parsed = bookSchema.parse(form({ title: "Target Police", price: "450", mrp: "499.50", status: "draft" }));
    expect(parsed.slug).toBe("target-police");
    expect(parsed.pricePaise).toBe(45000);
    expect(parsed.mrpPaise).toBe(49950);
    expect(parsed.isbn).toBeNull();
    expect(parsed.pages).toBeNull();
  });

  it("rejects a selling price above MRP", () => {
    const result = bookSchema.safeParse(form({ title: "X", price: "600", mrp: "500", status: "draft" }));
    expect(result.success).toBe(false);
  });

  it("rejects putting stock on sale without a price", () => {
    const result = bookSchema.safeParse(form({ title: "X", status: "published", quantity: "10" }));
    expect(result.success).toBe(false);
  });

  it("splits line lists", () => {
    const parsed = bookSchema.parse(form({ title: "X", status: "draft", exams: "TSLPRB\n\n TGPSC \n" }));
    expect(parsed.exams).toEqual(["TSLPRB", "TGPSC"]);
  });

  it("slugifies titles", () => {
    expect(slugify("Target Police: 360° General Studies (2026)")).toBe("target-police-360-general-studies-2026");
  });
});

describe("order email", () => {
  it("escapes customer-provided values in HTML", () => {
    const email = renderOrderEmail("order_placed", {
      storeName: "Store",
      supportEmail: "",
      orderNumber: "AL260930-ABCDE",
      customerName: "<script>alert(1)</script>",
      totalPaise: 45000,
      paymentMethod: "cod",
      items: [{ title: "Book <b>", quantity: 1, lineTotalPaise: 45000 }],
      orderUrl: "https://example.com/o",
      trackUrl: "https://example.com/t",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.subject).toBe("Order AL260930-ABCDE received");
  });
});

describe("rejectCrossSite", () => {
  const post = (origin?: string) =>
    new NextRequest("http://localhost:3000/api/checkout/place", { method: "POST", headers: origin ? { origin } : {} });

  it("allows same-origin and origin-less requests", () => {
    expect(rejectCrossSite(post("http://localhost:3000"))).toBeNull();
    expect(rejectCrossSite(post())).toBeNull();
  });

  it("blocks other origins", () => {
    expect(rejectCrossSite(post("https://evil.example"))?.status).toBe(403);
  });
});
