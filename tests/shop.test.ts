import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../src/catalog.ts";
import {
  normalizeCart,
  totals,
  searchCatalog,
  comparable,
  differences,
} from "../src/shop.ts";
test("stored cart rejects malformed input and caps duplicate quantities to stock", () => {
  assert.deepEqual(
    normalizeCart([
      { id: 101, quantity: 8 },
      { id: 101, quantity: 9 },
      { id: 999, quantity: 1 },
      { id: 100, quantity: -4 },
      { id: 107, quantity: 1.5 },
      null,
    ]),
    [{ id: 101, quantity: 12 }],
  );
  assert.deepEqual(normalizeCart({}), []);
});
test("money uses cents and free shipping threshold is consistent", () => {
  assert.deepEqual(totals([{ id: 107, quantity: 1 }]), {
    subtotal: 4999,
    shipping: 599,
    total: 5598,
  });
  assert.equal(totals([{ id: 107, quantity: 2 }]).shipping, 0);
  assert.equal(totals([], true).total, 0);
  assert.equal(totals([{ id: 101, quantity: 1 }], true).total, 46199);
});
test("search combines filters, token matching and price sorting without mutating catalog", () => {
  assert.deepEqual(
    searchCatalog("headphones", "Audio", 15000, "low").map((p) => p.id),
    [107, 100],
  );
  assert.equal(searchCatalog("not-in-catalog").length, 0);
  assert.deepEqual(
    searchCatalog("", "All", 200000, "featured", [108]).map((p) => p.id),
    [108],
  );
  assert.equal(products[0].id, 101);
});
test("comparison refuses unrelated products and a fourth product", () => {
  assert.equal(comparable([products[0]], products[1]), true);
  assert.equal(comparable([products[0]], products[4]), false);
  assert.equal(comparable(products.slice(0, 3), products[1]), false);
  assert.ok(!differences(products.slice(0, 3), true).includes("Connection"));
  assert.ok(differences(products.slice(0, 3), true).includes("Battery"));
});
