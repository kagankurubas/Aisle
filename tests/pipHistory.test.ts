import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePipHistory,
  readPipHistory,
  savePipHistory,
} from "../src/pipHistory.ts";
const chat = {
  id: "chat-1",
  updatedAt: 1000,
  budget: "150",
  turns: [
    {
      question: "commute",
      advice: {
        answer: "Try Beats Flex.",
        products: [{ id: 107, reason: "12 hours battery." }],
      },
    },
  ],
};
test("chat history rejects corrupt data and invented products; bounds saved context", () => {
  assert.deepEqual(normalizePipHistory([chat]), [chat]);
  for (const value of [
    null,
    {},
    [{ ...chat, budget: "oops" }],
    [
      {
        ...chat,
        turns: [
          {
            question: "x",
            advice: { answer: "x", products: [{ id: 999, reason: "fake" }] },
          },
        ],
      },
    ],
    [{ ...chat, turns: Array(11).fill(chat.turns[0]) }],
  ])
    assert.deepEqual(normalizePipHistory(value), []);
  assert.equal(
    normalizePipHistory(
      Array.from({ length: 12 }, (_, i) => ({ ...chat, id: String(i) })),
    ).length,
    10,
  );
  assert.equal(normalizePipHistory([chat, chat]).length, 1);
});
test("history round trips per account in tab storage and fails safely when storage is unavailable", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  try {
    assert.equal(savePipHistory("alice", [chat]), true);
    assert.deepEqual(readPipHistory("alice"), [chat]);
    assert.deepEqual(readPipHistory("bob"), []);
    assert.equal(savePipHistory("alice", []), true);
    assert.deepEqual(readPipHistory("alice"), []);
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    assert.equal(savePipHistory("alice", [chat]), false);
    assert.deepEqual(readPipHistory("alice"), []);
  } finally {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
