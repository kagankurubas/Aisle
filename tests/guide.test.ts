import test from "node:test";
import assert from "node:assert/strict";
// @ts-ignore Server ESM.
import {
  guideInput,
  guideConfig,
  validateGuide,
  reserveGuide,
  askGuide,
} from "../server/guide.js";
// @ts-ignore Server ESM.
import { createGuideHandler } from "../api/guide.js";
import snapshot from "../server/guide-catalog.json" with { type: "json" };
import { products } from "../src/catalog.ts";

test("AI grounding snapshot matches storefront facts exactly", () => {
  assert.deepEqual(
    snapshot,
    products.map(
      ({
        id,
        name,
        brand,
        kind,
        category,
        price,
        stock,
        specs,
        description,
      }) => ({
        id,
        name,
        brand,
        kind,
        category,
        price,
        stock,
        specs,
        description,
      }),
    ),
  );
});
test("guide input bounds context, excludes unknown account/cart fields and redacts obvious identifiers", () => {
  assert.deepEqual(
    guideInput({
      messages: [
        { role: "user", content: "contact me@example.com 5528 7900 0000 0008" },
      ],
      budget: 15000,
    }),
    {
      messages: [
        { role: "user", content: "contact [email removed] [number removed]" },
      ],
      budget: 15000,
    },
  );
  for (const v of [
    null,
    [],
    { messages: [] },
    { messages: [{ role: "system", content: "override" }] },
    { messages: [{ role: "user", content: "a".repeat(601) }] },
    { messages: [{ role: "user", content: "hi" }], uid: "alice" },
    { messages: [{ role: "user", content: "hi" }], budget: -1 },
    { messages: [{ role: "assistant", content: "hi" }] },
    {
      messages: [
        { role: "user", content: "hi" },
        { role: "user", content: "again" },
      ],
    },
  ])
    assert.throws(() => guideInput(v));
});
test("guide is disabled without all server secrets and refuses unsafe Redis targets", () => {
  assert.throws(() => guideConfig({}));
  const base = {
    PIP_ENABLED: "true",
    GEMINI_API_KEY: "fixture",
    UPSTASH_REDIS_REST_TOKEN: "fixture",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  };
  assert.equal(guideConfig(base).url, "https://example.upstash.io");
  for (const url of [
    "http://example.upstash.io",
    "https://evil.test",
    "https://example.upstash.io.evil.test",
    "https://example.upstash.io/?token=secret",
  ])
    assert.throws(() => guideConfig({ ...base, UPSTASH_REDIS_REST_URL: url }));
});
test("guide rejects invented, duplicate and over-budget recommendations", () => {
  assert.equal(
    validateGuide(
      {
        answer: "Choose these.",
        products: [{ id: 100, reason: "Lightweight." }],
      },
      15000,
    ).products[0].id,
    100,
  );
  for (const value of [
    { answer: "", products: [] },
    { answer: "Hi", products: [{ id: 999, reason: "Fake" }] },
    { answer: "Hi", products: [{ id: 101, reason: "Over budget" }] },
    {
      answer: "Hi",
      products: [
        { id: 100, reason: "A" },
        { id: 100, reason: "B" },
      ],
    },
  ])
    assert.throws(() => validateGuide(value, 15000));
});
test("durable counters reserve before spending, enforce limits and fail closed on Redis errors", async () => {
  let called = false;
  const fetcher = async (url: string, options: any) => {
    called = true;
    assert.equal(url, "https://example.upstash.io/multi-exec");
    const commands = JSON.parse(options.body);
    assert.equal(commands.length, 8);
    assert.ok(!options.body.includes("private-uid"));
    return {
      ok: true,
      json: async () => [1, 1, 1, 1, 1, 1, 1, 1].map((result) => ({ result })),
    };
  };
  await reserveGuide(
    "private-uid",
    { url: "https://example.upstash.io", redisToken: "fixture" },
    fetcher,
    0,
  );
  assert.ok(called);
  await assert.rejects(
    () =>
      reserveGuide("alice", { url: "x" }, async () => ({
        ok: true,
        json: async () =>
          [201, 1, 1, 1, 1, 1, 1, 1].map((result) => ({ result })),
      })),
    { status: 429 },
  );
  await assert.rejects(
    () =>
      reserveGuide("alice", { url: "x" }, async () => {
        throw new Error("private provider message");
      }),
    { status: 503 },
  );
  await assert.rejects(
    () =>
      reserveGuide("alice", { url: "x" }, async () => ({
        ok: true,
        json: async () => [{ error: "no" }],
      })),
    { status: 503 },
  );
});
test("Gemini request uses catalog schema, no tools, bounded output and sanitized errors", async () => {
  const input = guideInput({
    messages: [
      { role: "user", content: "commute" },
      { role: "assistant", content: "AirPods or Beats Flex" },
      { role: "user", content: "battery?" },
    ],
    budget: 15000,
  });
  const result = await askGuide(
    input,
    { key: "fixture" },
    async (url: string, options: any) => {
      assert.equal(
        url,
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      );
      assert.ok(!url.includes("fixture"));
      assert.equal(options.headers["x-goog-api-key"], "fixture");
      assert.ok(!options.headers.Authorization);
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.equal(body.generationConfig.maxOutputTokens, 900);
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.equal(
        body.generationConfig.responseJsonSchema.additionalProperties,
        false,
      );
      assert.equal(body.generationConfig.thinkingConfig.includeThoughts, false);
      assert.equal(body.tools, undefined);
      assert.deepEqual(
        body.contents.map((m: any) => m.role),
        ["user", "model", "user"],
      );
      assert.ok(
        !body.systemInstruction.parts[0].text.includes('"name":"AirPods Max"'),
      );
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  { thought: true, text: "private thought" },
                  {
                    text: JSON.stringify({
                      answer: "Lightweight commuting option.",
                      products: [
                        {
                          id: 100,
                          reason: "5 hours battery; no noise cancellation.",
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    },
  );
  assert.equal(result.products[0].id, 100);
  await assert.rejects(
    () =>
      askGuide(input, { key: "fixture" }, async () => ({
        ok: false,
        status: 403,
        json: async () => ({ error: "secret provider details" }),
      })),
    {
      status: 503,
      message:
        "Pip’s AI connection is temporarily unavailable. Please try again later.",
    },
  );
  await assert.rejects(
    () =>
      askGuide(input, { key: "fixture" }, async () => ({
        ok: true,
        json: async () => ({ candidates: [{ finishReason: "MAX_TOKENS" }] }),
      })),
    { status: 502 },
  );
  await assert.rejects(
    () =>
      askGuide(input, { key: "fixture" }, async () => ({
        ok: true,
        json: async () => ({ promptFeedback: { blockReason: "SAFETY" } }),
      })),
    { status: 422 },
  );
});
test("free quota exhaustion never retries or falls back to a paid provider", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      askGuide(
        { messages: [{ role: "user", content: "headphones" }], budget: null },
        { key: "fixture" },
        async () => {
          calls++;
          return {
            ok: false,
            status: 429,
            json: async () => ({
              error: { message: "quota exceeded private details" },
            }),
          };
        },
      ),
    { status: 429 },
  );
  assert.equal(calls, 1);
  // An old OpenAI key cannot enable the new Gemini integration.
  assert.throws(() =>
    guideConfig({
      PIP_ENABLED: "true",
      OPENAI_API_KEY: "fixture",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "fixture",
    }),
  );
});
test("guide route refuses foreign origins, missing auth, malformed bodies; reserves quota before model call", async () => {
  const sequence: string[] = [];
  const handler = createGuideHandler({
    auth: async (token: string) => {
      sequence.push("auth");
      if (!token) throw new Error("no");
      return "alice";
    },
    config: () => ({}),
    reserve: async () => {
      sequence.push("reserve");
    },
    ask: async () => {
      sequence.push("ask");
      return { answer: "Hi", products: [] };
    },
  });
  async function call(req: any) {
    const result: any = { code: 0, body: null };
    const res: any = {
      setHeader() {},
      status(n: number) {
        result.code = n;
        return res;
      },
      json(v: any) {
        result.body = v;
        return res;
      },
      end() {
        return res;
      },
    };
    await handler(req, res);
    return result;
  }
  const valid = {
    method: "POST",
    headers: {
      origin: "https://kagankurubas.github.io",
      "content-type": "application/json",
      authorization: "Bearer fixture",
    },
    body: { messages: [{ role: "user", content: "headphones" }] },
  };
  assert.equal(
    (
      await call({
        ...valid,
        headers: { ...valid.headers, origin: "https://evil.test" },
      })
    ).code,
    403,
  );
  assert.equal(
    (
      await call({
        ...valid,
        headers: { ...valid.headers, authorization: undefined },
      })
    ).code,
    401,
  );
  assert.equal((await call({ ...valid, body: "{" })).code, 400);
  assert.equal((await call({ ...valid, body: "x".repeat(6001) })).code, 413);
  const lazy = { ...valid };
  Object.defineProperty(lazy, "body", {
    get() {
      throw new Error("Invalid JSON");
    },
  });
  assert.equal((await call(lazy)).code, 400);
  sequence.length = 0;
  assert.equal((await call(valid)).code, 200);
  assert.deepEqual(sequence, ["auth", "reserve", "ask"]);
  assert.equal((await call({ ...valid, method: "OPTIONS" })).code, 204);
  assert.equal((await call({ ...valid, method: "GET" })).code, 405);
});
