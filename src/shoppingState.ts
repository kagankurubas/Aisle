import { productById } from "./catalog.ts";
import { normalizeCart, type CartLine, type DemoOrder } from "./shop.ts";
export function normalizeFavorites(value: unknown): number[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is number => typeof id === "number" && !!productById(id),
          ),
        ),
      ].sort((a, b) => a - b)
    : [];
}
export function normalizeOrders(value: unknown): DemoOrder[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (o): o is DemoOrder =>
        !!o &&
        typeof o === "object" &&
        typeof o.id === "string" &&
        /^DEMO-[A-Z0-9-]{1,40}$/.test(o.id) &&
        Number.isFinite(o.total) &&
        o.total >= 0 &&
        Number.isFinite(o.shipping) &&
        o.shipping >= 0 &&
        ["Confirmed", "Cancelled"].includes(o.status) &&
        typeof o.date === "string" &&
        !Number.isNaN(Date.parse(o.date)) &&
        Array.isArray(o.lines),
    )
    .slice(0, 50)
    .map((o) => ({ ...o, lines: normalizeCart(o.lines) }));
}
export function fromCloud(value: unknown) {
  const data =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const rawCart =
    data.cart && typeof data.cart === "object" && !Array.isArray(data.cart)
      ? (data.cart as Record<string, unknown>)
      : {};
  return {
    cart: normalizeCart(
      Object.entries(rawCart).map(([id, quantity]) => ({
        id: Number(id),
        quantity,
      })),
    ),
    favorites: normalizeFavorites(data.favorites),
  };
}
export function toCloud(cart: CartLine[], favorites: number[]) {
  return {
    cart: Object.fromEntries(
      normalizeCart(cart)
        .sort((a, b) => a.id - b.id)
        .map((l) => [String(l.id), l.quantity]),
    ),
    favorites: normalizeFavorites(favorites),
  };
}
