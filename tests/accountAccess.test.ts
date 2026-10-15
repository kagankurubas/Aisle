import test from "node:test";
import assert from "node:assert/strict";
import { canUseAccount } from "../src/accountAccess.ts";
test("client distinguishes verified, Firebase anonymous demo, unverified and signed-out accounts", () => {
  assert.equal(canUseAccount(null), false);
  assert.equal(canUseAccount(undefined), false);
  assert.equal(canUseAccount({ emailVerified: false }), false);
  assert.equal(canUseAccount({ emailVerified: true }), true);
  assert.equal(
    canUseAccount({ emailVerified: false, isAnonymous: true }),
    true,
  );
  assert.equal(
    canUseAccount({ emailVerified: false, isAnonymous: false }),
    false,
  );
});
