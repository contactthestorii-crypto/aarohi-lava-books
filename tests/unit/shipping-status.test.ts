import { describe, expect, it } from "vitest";
import { mapShiprocketStatus, normaliseProviderStatus, shouldAdvanceStatus } from "@/lib/shipping/status-map";

describe("mapShiprocketStatus", () => {
  it.each([
    ["PICKUP SCHEDULED", "PACKED"],
    ["Picked Up", "SHIPPED"],
    ["IN_TRANSIT", "SHIPPED"],
    ["in-transit", "SHIPPED"],
    ["OUT FOR DELIVERY", "OUT_FOR_DELIVERY"],
    ["Delivered", "DELIVERED"],
    ["RTO INITIATED", "RETURN_REQUESTED"],
    ["RTO DELIVERED", "RETURNED"],
  ])("maps %s to %s", (input, expected) => {
    expect(mapShiprocketStatus(input)).toBe(expected);
  });

  it("returns null for unknown or empty statuses", () => {
    expect(mapShiprocketStatus("UNDELIVERED")).toBeNull();
    expect(mapShiprocketStatus("LOST")).toBeNull();
    expect(mapShiprocketStatus("CANCELED")).toBeNull();
    expect(mapShiprocketStatus("")).toBeNull();
    expect(mapShiprocketStatus(null)).toBeNull();
  });

  it("normalises spacing and separators", () => {
    expect(normaliseProviderStatus("  out_for   delivery ")).toBe("OUT FOR DELIVERY");
  });
});

describe("shouldAdvanceStatus", () => {
  it("moves forward only", () => {
    expect(shouldAdvanceStatus("PAID", "SHIPPED")).toBe(true);
    expect(shouldAdvanceStatus("SHIPPED", "OUT_FOR_DELIVERY")).toBe(true);
    expect(shouldAdvanceStatus("DELIVERED", "SHIPPED")).toBe(false);
    expect(shouldAdvanceStatus("SHIPPED", "SHIPPED")).toBe(false);
  });

  it("never touches cancelled, refunded or unpaid orders", () => {
    expect(shouldAdvanceStatus("CANCELLED", "SHIPPED")).toBe(false);
    expect(shouldAdvanceStatus("REFUNDED", "DELIVERED")).toBe(false);
    expect(shouldAdvanceStatus("PENDING_PAYMENT", "PACKED")).toBe(false);
  });

  it("ignores null targets", () => {
    expect(shouldAdvanceStatus("PAID", null)).toBe(false);
  });
});
