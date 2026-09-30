import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./db";

const ALICE = "00000000-0000-4000-8000-00000000000a";
const BOB = "00000000-0000-4000-8000-00000000000b";
const ADMIN = "00000000-0000-4000-8000-0000000000ad";

let db: PGlite;
let productId: string;

async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db.query<T>(sql, params)).rows;
}

function orderPayload(overrides: Record<string, unknown> = {}) {
  return {
    user_id: ALICE,
    payment_method: "online",
    customer_name: "Alice Rao",
    customer_email: "alice@example.com",
    customer_phone: "9876543210",
    shipping_address: { line1: "1-2-3 Main Road", city: "Hyderabad", state: "Telangana", pincode: "500001" },
    shipping_pincode: "500001",
    subtotal_paise: 50000,
    total_paise: 50000,
    ...overrides,
  };
}

async function placeOrder(order: Record<string, unknown>, quantity = 1) {
  const [result] = await rows<{ place_order: { id: string; order_number: string; created: boolean } }>(
    "select public.place_order($1::jsonb, $2::jsonb)",
    [JSON.stringify(order), JSON.stringify([{ product_id: productId, quantity, unit_price_paise: 50000 }])],
  );
  return result.place_order;
}

async function inventory() {
  const [row] = await rows<{ quantity: number; reserved: number }>(
    "select quantity, reserved from public.inventory where product_id = $1",
    [productId],
  );
  return row;
}

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, ALICE, "alice@example.com");
  await createUser(db, BOB, "bob@example.com");
  await createUser(db, ADMIN, "admin@example.com", "admin");

  const [product] = await rows<{ id: string }>(
    "select id from public.products where slug = 'target-police-general-studies-tslprb-tgpsc'",
  );
  productId = product.id;
  // Test fixture values (not store data): give the seeded book a price and stock.
  await db.query("update public.products set price_paise = 50000, mrp_paise = 60000 where id = $1", [productId]);
  await db.query("update public.inventory set quantity = 5 where product_id = $1", [productId]);
});

describe("migrations and seed", () => {
  it("creates profiles for new auth users with the customer role", async () => {
    const profiles = await rows<{ id: string; role: string }>("select id, role from public.profiles order by email");
    expect(profiles).toHaveLength(3);
    expect(profiles.find((p) => p.id === ALICE)?.role).toBe("customer");
  });

  it("seeds the cover product without inventing price or stock", async () => {
    const [seeded] = await rows<{ isbn: string | null; pages: number | null; author: string }>(
      "select isbn, pages, author from public.products where id = $1",
      [productId],
    );
    expect(seeded.isbn).toBeNull();
    expect(seeded.pages).toBeNull();
    expect(seeded.author).toBe("Swathylava Neralla");
  });
});

describe("catalog RLS", () => {
  it("anon can read published products but not drafts", async () => {
    await db.query("insert into public.products (slug, title, status) values ('draft-book', 'Draft', 'draft')");
    const visible = await as(db, "anon", null, () => rows<{ slug: string }>("select slug from public.products"));
    expect(visible.map((p) => p.slug)).toContain("target-police-general-studies-tslprb-tgpsc");
    expect(visible.map((p) => p.slug)).not.toContain("draft-book");
  });

  it("customers cannot change product prices", async () => {
    await as(db, "authenticated", ALICE, () =>
      db.query("update public.products set price_paise = 1 where id = $1", [productId]),
    );
    const [product] = await rows<{ price_paise: number }>("select price_paise from public.products where id = $1", [productId]);
    expect(product.price_paise).toBe(50000);
  });

  it("customers cannot change inventory", async () => {
    await as(db, "authenticated", ALICE, () =>
      db.query("update public.inventory set quantity = 999 where product_id = $1", [productId]),
    );
    expect((await inventory()).quantity).toBe(5);
  });

  it("admins can manage products and categories", async () => {
    await as(db, "authenticated", ADMIN, async () => {
      await db.query("update public.products set is_bestseller = true where id = $1", [productId]);
      await db.query("insert into public.categories (slug, name) values ('admin-made', 'Admin Made')");
    });
    const [product] = await rows<{ is_bestseller: boolean }>("select is_bestseller from public.products where id = $1", [productId]);
    expect(product.is_bestseller).toBe(true);
    expect(await rows("select 1 from public.categories where slug = 'admin-made'")).toHaveLength(1);
  });

  it("anon cannot read coupons", async () => {
    await db.query("insert into public.coupons (code, type, value) values ('SECRET10', 'percent', 10)");
    await expect(as(db, "anon", null, () => rows("select * from public.coupons"))).rejects.toThrow(/permission denied/);
  });
});

describe("profiles RLS", () => {
  it("customer can update own name but not own role", async () => {
    await as(db, "authenticated", ALICE, () =>
      db.query("update public.profiles set full_name = 'Alice R' where id = $1", [ALICE]),
    );
    await expect(
      as(db, "authenticated", ALICE, () => db.query("update public.profiles set role = 'admin' where id = $1", [ALICE])),
    ).rejects.toThrow(/permission denied/);
    const [profile] = await rows<{ full_name: string; role: string }>("select full_name, role from public.profiles where id = $1", [ALICE]);
    expect(profile).toEqual({ full_name: "Alice R", role: "customer" });
  });

  it("customer cannot read another customer's profile", async () => {
    const visible = await as(db, "authenticated", ALICE, () => rows<{ id: string }>("select id from public.profiles"));
    expect(visible.map((p) => p.id)).toEqual([ALICE]);
  });
});

describe("addresses RLS", () => {
  it("customer manages own addresses and cannot create them for others", async () => {
    await as(db, "authenticated", ALICE, () =>
      db.query(
        "insert into public.addresses (user_id, full_name, phone, line1, city, state, pincode) values ($1, 'Alice', '9876543210', 'Street 1', 'Hyderabad', 'Telangana', '500001')",
        [ALICE],
      ),
    );
    await expect(
      as(db, "authenticated", ALICE, () =>
        db.query(
          "insert into public.addresses (user_id, full_name, phone, line1, city, state, pincode) values ($1, 'Bob', '9876543210', 'Street 2', 'Hyderabad', 'Telangana', '500001')",
          [BOB],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    const bobSees = await as(db, "authenticated", BOB, () => rows("select * from public.addresses"));
    expect(bobSees).toHaveLength(0);
  });
});

describe("orders, payments and inventory", () => {
  let aliceOrder: { id: string; order_number: string };

  it("place_order reserves stock", async () => {
    aliceOrder = await placeOrder({ ...orderPayload(), idempotency_key: "alice-1" }, 2);
    expect(aliceOrder.order_number).toMatch(/^AL\d{6}-[0-9A-F]{5}$/);
    expect(await inventory()).toEqual({ quantity: 5, reserved: 2 });
  });

  it("place_order is idempotent on idempotency_key", async () => {
    const again = await placeOrder({ ...orderPayload(), idempotency_key: "alice-1" }, 2);
    expect(again.id).toBe(aliceOrder.id);
    expect(again.created).toBe(false);
    expect(await inventory()).toEqual({ quantity: 5, reserved: 2 });
  });

  it("place_order rejects a stale price", async () => {
    await expect(
      rows("select public.place_order($1::jsonb, $2::jsonb)", [
        JSON.stringify(orderPayload()),
        JSON.stringify([{ product_id: productId, quantity: 1, unit_price_paise: 100 }]),
      ]),
    ).rejects.toThrow(/PRICE_CHANGED/);
  });

  it("place_order prevents overselling", async () => {
    await expect(placeOrder(orderPayload({ user_id: BOB, customer_email: "bob@example.com" }), 4)).rejects.toThrow(
      /INSUFFICIENT_STOCK/,
    );
    expect(await inventory()).toEqual({ quantity: 5, reserved: 2 });
  });

  it("customers can read only their own orders", async () => {
    const aliceSees = await as(db, "authenticated", ALICE, () => rows<{ id: string }>("select id from public.orders"));
    const bobSees = await as(db, "authenticated", BOB, () => rows<{ id: string }>("select id from public.orders"));
    const anonSees = as(db, "anon", null, () => rows("select id from public.orders"));
    expect(aliceSees.map((o) => o.id)).toEqual([aliceOrder.id]);
    expect(bobSees).toHaveLength(0);
    await expect(anonSees).rejects.toThrow(/permission denied/);
  });

  it("customers cannot insert orders or modify payments", async () => {
    await expect(
      as(db, "authenticated", ALICE, () =>
        db.query("insert into public.orders (order_number, status, payment_method, payment_status, customer_name, customer_email, customer_phone, shipping_address, shipping_pincode, subtotal_paise, total_paise) values ('X', 'PAID', 'online', 'captured', 'A', 'a@b.c', '9876543210', '{}', '500001', 0, 0)"),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, "authenticated", ALICE, () => db.query("update public.payments set status = 'captured'")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, "authenticated", ALICE, () => db.query("update public.orders set status = 'PAID' where id = $1", [aliceOrder.id])),
    ).resolves.toBeDefined();
    const [order] = await rows<{ status: string }>("select status from public.orders where id = $1", [aliceOrder.id]);
    expect(order.status).toBe("PENDING_PAYMENT");
  });

  it("client roles cannot execute privileged functions", async () => {
    await expect(
      as(db, "authenticated", ALICE, () =>
        rows("select public.finalize_paid_order($1, 'razorpay', 'x', 'y', 100000, null)", [aliceOrder.id]),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(as(db, "anon", null, () => rows("select public.expire_pending_orders()"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("finalize_paid_order commits stock once, even when called twice", async () => {
    await db.query("select public.attach_provider_order($1, 'razorpay', 'order_rzp_1')", [aliceOrder.id]);
    const finalize = () =>
      rows<{ finalize_paid_order: { finalized: boolean } }>(
        "select public.finalize_paid_order($1, 'razorpay', 'order_rzp_1', 'pay_1', 100000, null)",
        [aliceOrder.id],
      );
    const [first] = await finalize();
    const [second] = await finalize();
    expect(first.finalize_paid_order.finalized).toBe(true);
    expect(second.finalize_paid_order.finalized).toBe(false);
    expect(await inventory()).toEqual({ quantity: 3, reserved: 0 });
    const [order] = await rows<{ status: string; payment_status: string }>(
      "select status, payment_status from public.orders where id = $1",
      [aliceOrder.id],
    );
    expect(order).toEqual({ status: "PAID", payment_status: "captured" });
    const events = await rows<{ status: string | null }>("select status from public.order_events where order_id = $1 order by id", [aliceOrder.id]);
    expect(events.map((e) => e.status)).toEqual(["PENDING_PAYMENT", "PAID"]);
  });

  it("expired unpaid orders release their reservation", async () => {
    const pending = await placeOrder(orderPayload({ user_id: BOB, customer_email: "bob@example.com" }), 1);
    expect(await inventory()).toEqual({ quantity: 3, reserved: 1 });
    await db.query("update public.orders set expires_at = now() - interval '1 minute' where id = $1", [pending.id]);
    const [{ expire_pending_orders: count }] = await rows<{ expire_pending_orders: number }>("select public.expire_pending_orders()");
    expect(count).toBe(1);
    expect(await inventory()).toEqual({ quantity: 3, reserved: 0 });
    const [order] = await rows<{ status: string; inventory_state: string }>(
      "select status, inventory_state from public.orders where id = $1",
      [pending.id],
    );
    expect(order).toEqual({ status: "CANCELLED", inventory_state: "released" });
  });

  it("a late payment on an expired order still marks it paid and takes stock", async () => {
    const late = await placeOrder(orderPayload({ user_id: BOB, customer_email: "bob@example.com" }), 1);
    await db.query("select public.attach_provider_order($1, 'razorpay', 'order_rzp_late')", [late.id]);
    await db.query("update public.orders set expires_at = now() - interval '1 minute' where id = $1", [late.id]);
    await db.query("select public.expire_pending_orders()");
    await db.query("select public.finalize_paid_order($1, 'razorpay', 'order_rzp_late', 'pay_late', 50000, null)", [late.id]);
    const [order] = await rows<{ status: string; needs_attention: boolean }>(
      "select status, needs_attention from public.orders where id = $1",
      [late.id],
    );
    expect(order).toEqual({ status: "PAID", needs_attention: false });
    expect(await inventory()).toEqual({ quantity: 2, reserved: 0 });
  });

  it("COD orders commit stock immediately and record coupon usage", async () => {
    const [coupon] = await rows<{ id: string }>("select id from public.coupons where code = 'SECRET10'");
    const cod = await placeOrder(
      orderPayload({ payment_method: "cod", coupon_id: coupon.id, coupon_code: "SECRET10", discount_paise: 5000, total_paise: 45000 }),
      1,
    );
    expect(await inventory()).toEqual({ quantity: 1, reserved: 0 });
    const [order] = await rows<{ status: string; payment_status: string }>(
      "select status, payment_status from public.orders where id = $1",
      [cod.id],
    );
    expect(order).toEqual({ status: "PROCESSING", payment_status: "cod_pending" });
    expect(await rows("select 1 from public.coupon_usage where order_id = $1", [cod.id])).toHaveLength(1);
  });

  it("cancelling a paid order restocks it", async () => {
    await db.query("select public.cancel_order($1, 'Customer request', 'admin', true)", [aliceOrder.id]);
    expect(await inventory()).toEqual({ quantity: 3, reserved: 0 });
  });

  it("admins can read every order", async () => {
    const adminSees = await as(db, "authenticated", ADMIN, () => rows("select id from public.orders"));
    expect(adminSees.length).toBeGreaterThanOrEqual(4);
  });
});

describe("reviews", () => {
  it("public sees approved reviews only and ratings follow approvals", async () => {
    await db.query(
      "insert into public.reviews (product_id, user_id, rating, author_name, status) values ($1, $2, 4, 'Alice', 'pending'), ($1, $3, 5, 'Bob', 'approved')",
      [productId, ALICE, BOB],
    );
    const publicReviews = await as(db, "anon", null, () => rows<{ author_name: string }>("select author_name from public.reviews"));
    expect(publicReviews.map((r) => r.author_name)).toEqual(["Bob"]);
    const aliceSees = await as(db, "authenticated", ALICE, () => rows("select * from public.reviews"));
    expect(aliceSees).toHaveLength(2);
    const [product] = await rows<{ rating_avg: string; rating_count: number }>(
      "select rating_avg, rating_count from public.products where id = $1",
      [productId],
    );
    expect(Number(product.rating_avg)).toBe(5);
    expect(product.rating_count).toBe(1);
  });

  it("customers cannot insert reviews directly (server computes verified purchase)", async () => {
    await expect(
      as(db, "authenticated", ALICE, () =>
        db.query("insert into public.reviews (product_id, user_id, rating, author_name, status) values ($1, $2, 5, 'x', 'approved')", [
          productId,
          ALICE,
        ]),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("search and rate limiting", () => {
  it("finds the book by prefix, author and category name", async () => {
    for (const query of ["targ", "neralla", "general studies", "TSLPRB", "police"]) {
      const result = await as(db, "anon", null, () =>
        rows<{ product_id: string }>("select product_id from public.search_product_ids($1, 10, 0)", [query]),
      );
      expect(result.map((r) => r.product_id), query).toContain(productId);
    }
  });

  it("returns nothing for empty or symbol-only queries", async () => {
    const result = await rows("select * from public.search_product_ids($1, 10, 0)", ["%%%"]);
    expect(result).toHaveLength(0);
  });

  it("rate_limit_hit allows up to the limit per window", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const [row] = await rows<{ rate_limit_hit: boolean }>("select public.rate_limit_hit('test:key', 3, 60)");
      results.push(row.rate_limit_hit);
    }
    expect(results).toEqual([true, true, true, false]);
  });
});
