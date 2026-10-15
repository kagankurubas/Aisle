import test from "node:test";
import assert from "node:assert/strict";
import { fromCloud, toCloud, normalizeOrders } from "../src/shoppingState.ts";
test("cloud data is normalized without trusting arbitrary ids or quantities", () => {
  assert.deepEqual(
    fromCloud({
      cart: { "100": 500, "999": 1, "101": -1 },
      favorites: [100, 100, 999, "101"],
    }),
    { cart: [{ id: 100, quantity: 24 }], favorites: [100] },
  );
  assert.deepEqual(fromCloud(null), { cart: [], favorites: [] });
  assert.deepEqual(
    toCloud(
      [
        { id: 101, quantity: 1 },
        { id: 100, quantity: 2 },
      ],
      [101, 100, 101],
    ),
    { cart: { "100": 2, "101": 1 }, favorites: [100, 101] },
  );
});
test("only structurally valid demo orders are restored; paid claims and invalid dates are rejected", () => {
  const order = {
    id: "DEMO-1234ABCD",
    date: "2026-10-15T00:00:00.000Z",
    lines: [{ id: 100, quantity: 1 }],
    shipping: 0,
    total: 12900,
    status: "Confirmed",
  };
  assert.equal(
    normalizeOrders([
      order,
      { ...order, id: "PAID-1234" },
      { ...order, status: "Paid" },
      { ...order, date: "bad" },
      { ...order, total: -1 },
      null,
    ]).length,
    1,
  );
});
