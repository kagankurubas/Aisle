import { canUseAccount } from "./accountAccess";
import { useEffect, useRef, useState } from "react";
import { getCloud, type SessionUser } from "./auth";
import { productById } from "./catalog";
export type ShoppingList = { id: string; name: string; products: number[] };
export default function useLists(user: SessionUser | null) {
  const owner = canUseAccount(user) ? user!.uid : null;
  const [data, setData] = useState<{
    owner: string | null;
    lists: ShoppingList[];
  }>({ owner: null, lists: [] });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const generation = useRef(0);
  const locked = useRef(false);
  useEffect(() => {
    const epoch = ++generation.current;
    locked.current = false;
    setData({ owner: null, lists: [] });
    setError("");
    if (!owner) {
      setStatus("signed-out");
      return;
    }
    setStatus("loading");
    (async () => {
      const { db, storeSDK } = await getCloud();
      const snapshot = await storeSDK.getDocs(
        storeSDK.collection(db, "users", owner, "lists"),
      );
      if (epoch !== generation.current) return;
      const lists = snapshot.docs.map((doc) => {
        const value = doc.data();
        return {
          id: doc.id,
          name:
            typeof value.name === "string"
              ? value.name.slice(0, 60)
              : "Untitled",
          products: Array.isArray(value.products)
            ? value.products
                .filter(
                  (id: unknown) => typeof id === "number" && productById(id),
                )
                .slice(0, 12)
            : [],
        } as ShoppingList;
      });
      setData({ owner, lists });
      setStatus("ready");
    })().catch(() => {
      if (epoch === generation.current) {
        setStatus("error");
        setError(
          "Lists could not load. Check your connection and list access rules.",
        );
      }
    });
    return () => {
      if (epoch === generation.current) generation.current++;
    };
  }, [owner, tick]);
  const lists = data.owner === owner ? data.lists : [];
  async function write(
    id: string,
    value: { name: string; products: number[] } | null,
  ) {
    if (!owner || data.owner !== owner || status !== "ready" || locked.current)
      return false;
    const epoch = generation.current;
    locked.current = true;
    setStatus("saving");
    setError("");
    try {
      const { auth, db, storeSDK } = await getCloud();
      if (auth.currentUser?.uid !== owner || epoch !== generation.current)
        return false;
      const ref = storeSDK.doc(db, "users", owner, "lists", id);
      if (value)
        await storeSDK.setDoc(ref, {
          ...value,
          updatedAt: storeSDK.serverTimestamp(),
        });
      else await storeSDK.deleteDoc(ref);
      if (epoch !== generation.current) return false;
      setData((prev) => ({
        owner,
        lists: value
          ? [...prev.lists.filter((l) => l.id !== id), { id, ...value }]
          : prev.lists.filter((l) => l.id !== id),
      }));
      setStatus("ready");
      return true;
    } catch {
      if (epoch === generation.current) {
        setStatus("ready");
        setError(
          "Your list was not saved. Check your connection and try again.",
        );
      }
      return false;
    } finally {
      if (epoch === generation.current) locked.current = false;
    }
  }
  function validName(name: string) {
    return name.trim().replace(/\s+/g, " ").slice(0, 60);
  }
  return {
    lists,
    status,
    error,
    retry: () => setTick((v) => v + 1),
    create: (name: string, productId?: number) => {
      const label = validName(name);
      if (!label) {
        setError("Give your list a name.");
        return Promise.resolve(false);
      }
      return write(crypto.randomUUID(), {
        name: label,
        products: productId && productById(productId) ? [productId] : [],
      });
    },
    rename: (id: string, name: string) => {
      const list = lists.find((l) => l.id === id);
      const label = validName(name);
      return list && label
        ? write(id, { name: label, products: list.products })
        : Promise.resolve(false);
    },
    remove: (id: string) => write(id, null),
    add: (id: string, productId: number) => {
      const list = lists.find((l) => l.id === id);
      return list && productById(productId)
        ? write(id, {
            name: list.name,
            products: [...new Set([...list.products, productId])],
          })
        : Promise.resolve(false);
    },
    removeProduct: (id: string, productId: number) => {
      const list = lists.find((l) => l.id === id);
      return list
        ? write(id, {
            name: list.name,
            products: list.products.filter((p) => p !== productId),
          })
        : Promise.resolve(false);
    },
  };
}
export type ListStore = ReturnType<typeof useLists>;
