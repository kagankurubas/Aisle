import { canUseAccount } from "./accountAccess";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { getCloud, type SessionUser } from "./auth";
import { normalizeCart, type CartLine, type DemoOrder } from "./shop";
import {
  fromCloud,
  normalizeFavorites,
  normalizeOrders,
  toCloud,
} from "./shoppingState";
type Data = {
  owner: string | null;
  ready: boolean;
  cart: CartLine[];
  favorites: number[];
  orders: DemoOrder[];
};
function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
function blank(owner: string | null): Data {
  return { owner, ready: false, cart: [], favorites: [], orders: [] };
}
function orderKey(owner: string) {
  return owner === "demo"
    ? "aisle.demo.orders"
    : `aisle.account-demo-orders.${owner}`;
}
async function deadline<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Account request timed out")),
          12000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
export default function useShoppingData(
  user: SessionUser | null,
  authReady: boolean,
) {
  const owner = authReady ? (user?.uid ?? "demo") : null;
  const verified = canUseAccount(user);
  const [state, setState] = useState<Data>(() => blank(null));
  const [syncStatus, setSyncStatus] = useState("loading");
  const [loadTick, setLoadTick] = useState(0);
  const [saveTick, setSaveTick] = useState(0);
  const epoch = useRef(0);
  const baseline = useRef("");
  const lastScheduled = useRef("");
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    const generation = ++epoch.current;
    setState(blank(owner));
    baseline.current = "";
    lastScheduled.current = "";
    if (!owner) {
      setSyncStatus("loading");
      return;
    }
    if (owner === "demo") {
      setState({
        owner,
        ready: true,
        cart: normalizeCart(read("aisle.demo.bag")),
        favorites: normalizeFavorites(read("aisle.demo.saved")),
        orders: normalizeOrders(read(orderKey(owner))),
      });
      setSyncStatus("local");
      return;
    }
    if (!verified) {
      setSyncStatus("verify");
      return;
    }
    setSyncStatus("loading");
    deadline(
      (async () => {
        const { db, storeSDK } = await getCloud();
        const snapshot = await storeSDK.getDoc(
          storeSDK.doc(db, "users", owner, "shopping", "state"),
        );
        return fromCloud(snapshot.data());
      })(),
    )
      .then((data) => {
        if (generation !== epoch.current) return;
        baseline.current = JSON.stringify(toCloud(data.cart, data.favorites));
        lastScheduled.current = baseline.current;
        setState({
          owner,
          ready: true,
          ...data,
          orders: normalizeOrders(read(orderKey(owner))),
        });
        setSyncStatus("saved");
      })
      .catch(() => {
        if (generation === epoch.current) setSyncStatus("error");
      });
    return () => {
      if (epoch.current === generation) epoch.current++;
    };
  }, [owner, verified, loadTick]);
  useEffect(() => {
    if (!owner || state.owner !== owner || !state.ready) return;
    try {
      localStorage.setItem(orderKey(owner), JSON.stringify(state.orders));
      if (owner === "demo") {
        localStorage.setItem("aisle.demo.bag", JSON.stringify(state.cart));
        localStorage.setItem(
          "aisle.demo.saved",
          JSON.stringify(state.favorites),
        );
      }
    } catch {
      if (owner === "demo") setSyncStatus("local-error");
    }
  }, [owner, state]);
  useEffect(() => {
    if (
      !owner ||
      owner === "demo" ||
      state.owner !== owner ||
      !state.ready ||
      !verified
    )
      return;
    const payload = toCloud(state.cart, state.favorites);
    const signature = JSON.stringify(payload);
    if (signature === baseline.current && signature === lastScheduled.current) {
      setSyncStatus("saved");
      return;
    }
    const generation = epoch.current;
    const timer = setTimeout(() => {
      if (generation !== epoch.current) return;
      setSyncStatus("saving");
      lastScheduled.current = signature;
      queue.current = queue.current
        .catch(() => {})
        .then(async () => {
          if (generation !== epoch.current) return;
          const { auth, db, storeSDK } = await getCloud();
          if (auth.currentUser?.uid !== owner) return;
          await deadline(
            storeSDK.setDoc(
              storeSDK.doc(db, "users", owner, "shopping", "state"),
              { ...payload, updatedAt: storeSDK.serverTimestamp() },
            ),
          );
          if (generation === epoch.current) {
            baseline.current = signature;
            setSyncStatus("saved");
          }
        })
        .catch(() => {
          if (generation === epoch.current) setSyncStatus("error");
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [
    owner,
    state.cart,
    state.favorites,
    state.owner,
    state.ready,
    verified,
    saveTick,
  ]);
  const ready = state.owner === owner && state.ready;
  function update<K extends "cart" | "favorites" | "orders">(
    key: K,
    action: SetStateAction<Data[K]>,
  ) {
    if (ready && owner !== "demo" && key !== "orders") setSyncStatus("saving");
    setState((previous) => {
      if (previous.owner !== owner || !previous.ready) return previous;
      const value =
        typeof action === "function"
          ? (action as (p: Data[K]) => Data[K])(previous[key])
          : action;
      const normalized =
        key === "cart"
          ? normalizeCart(value)
          : key === "favorites"
            ? normalizeFavorites(value)
            : normalizeOrders(value);
      return { ...previous, [key]: normalized };
    });
  }
  return {
    cart: ready ? state.cart : [],
    favorites: ready ? state.favorites : [],
    orders: ready ? state.orders : [],
    setCart: (v: SetStateAction<CartLine[]>) => update("cart", v),
    setFavorites: (v: SetStateAction<number[]>) => update("favorites", v),
    setOrders: (v: SetStateAction<DemoOrder[]>) => update("orders", v),
    ready,
    syncStatus,
    retry: () => {
      if (ready) setSaveTick((v) => v + 1);
      else setLoadTick((v) => v + 1);
    },
  };
}
