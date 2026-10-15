import { productById } from "./catalog.ts";
export type Advice = {
  answer: string;
  products: { id: number; reason: string }[];
};
export type Turn = { question: string; advice: Advice };
export type PipChat = {
  id: string;
  updatedAt: number;
  budget: string;
  turns: Turn[];
};
const key = (uid: string) => `aisle:pip-chats:v1:${uid}`;
export function normalizePipHistory(value: unknown): PipChat[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value
    .filter((c): c is PipChat => {
      if (
        !c ||
        typeof c.id !== "string" ||
        c.id.length > 80 ||
        ids.has(c.id) ||
        !Number.isFinite(c.updatedAt) ||
        typeof c.budget !== "string" ||
        c.budget.length > 12 ||
        (c.budget !== "" &&
          (!Number.isFinite(Number(c.budget)) ||
            Number(c.budget) < 0 ||
            Number(c.budget) > 10000)) ||
        !Array.isArray(c.turns) ||
        !c.turns.length ||
        c.turns.length > 10
      )
        return false;
      if (
        !c.turns.every(
          (t: Turn) =>
            t &&
            typeof t.question === "string" &&
            t.question.length <= 600 &&
            t.advice &&
            typeof t.advice.answer === "string" &&
            t.advice.answer.length <= 1800 &&
            Array.isArray(t.advice.products) &&
            t.advice.products.length <= 3 &&
            t.advice.products.every(
              (p) =>
                p &&
                productById(p.id) &&
                typeof p.reason === "string" &&
                p.reason.length <= 500,
            ),
        )
      )
        return false;
      ids.add(c.id);
      return true;
    })
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      updatedAt: c.updatedAt,
      budget: c.budget,
      turns: c.turns.map((t) => ({
        question: t.question,
        advice: {
          answer: t.advice.answer,
          products: t.advice.products.map((p) => ({
            id: p.id,
            reason: p.reason,
          })),
        },
      })),
    }));
}
export function readPipHistory(uid: string): PipChat[] {
  try {
    const raw = sessionStorage.getItem(key(uid));
    return raw && raw.length <= 500000
      ? normalizePipHistory(JSON.parse(raw))
      : [];
  } catch {
    return [];
  }
}
export function savePipHistory(uid: string, chats: PipChat[]): boolean {
  try {
    sessionStorage.setItem(
      key(uid),
      JSON.stringify(normalizePipHistory(chats)),
    );
    return true;
  } catch {
    return false;
  }
}
