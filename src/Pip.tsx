import { canUseAccount } from "./accountAccess";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ShoppingBag, Scale } from "lucide-react";
import { getFirebase, type SessionUser } from "./auth";
import { productById, imageFor, money, type Product } from "./catalog";
import {
  readPipHistory,
  readActivePipChat,
  saveActivePipChat,
  savePipHistory,
  type PipChat,
  type Turn,
} from "./pipHistory";
export default function Pip({
  user,
  onSignIn,
  onView,
  onAdd,
  onCompare,
  initialProduct = null,
  onCompareRecommendations,
}: {
  initialProduct?: Product | null;
  onCompareRecommendations?: (ids: number[]) => void;
  user: SessionUser | null;
  onSignIn: () => void;
  onView: (p: Product) => void;
  onAdd: (p: Product) => void;
  onCompare: (p: Product) => void;
}) {
  const [contextId, setContextId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [chats, setChats] = useState<PipChat[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  const latest = useRef<HTMLDivElement>(null);
  useEffect(() => {
    pending.current?.abort();
    pending.current = null;
    const saved = user?.uid ? readPipHistory(user.uid) : [];
    const activeId = user?.uid ? readActivePipChat(user.uid) : null;
    const active = saved.find((c) => c.id === activeId) ?? saved[0];
    setChats(saved);
    setChatId(active?.id ?? null);
    setBudget(active?.budget ?? "");
    setTurns(active?.turns ?? []);
    setContextId(initialProduct?.id ?? active?.productId ?? null);
    setShowHistory(false);
    setHistoryError("");
    setQuery(
      initialProduct
        ? `What should I know about the ${initialProduct.name}?`
        : "",
    );
    setError("");
    setBusy(false);
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [user?.uid]);
  useEffect(() => {
    if (turns.length)
      latest.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns.length]);
  async function ask(text: string) {
    if (pending.current || !text.trim() || !canUseAccount(user)) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setQuery(text);
    try {
      const { auth } = await getFirebase();
      const owner = auth.currentUser;
      if (!owner || owner.uid !== user!.uid)
        throw new Error("Please sign in again.");
      const token = await owner.getIdToken();
      if (controller.signal.aborted) return;
      const messages = turns.slice(-2).flatMap((t) => [
        { role: "user", content: t.question },
        {
          role: "assistant",
          content: (
            t.advice.answer +
            " Recommended: " +
            t.advice.products.map((p) => productById(p.id)?.name).join(", ")
          ).slice(0, 1500),
        },
      ]);
      messages.push({ role: "user", content: text.trim() });
      const response = await fetch("https://aisle-roan.vercel.app/api/guide", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          productId: contextId,
          budget: budget === "" ? null : Math.round(Number(budget) * 100),
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Pip couldn’t connect. Please try again.",
        );
      if (
        typeof data.answer !== "string" ||
        !Array.isArray(data.products) ||
        data.products.length > 3 ||
        data.products.some(
          (p: { id: number; reason: string }) =>
            !productById(p.id) || typeof p.reason !== "string",
        )
      )
        throw new Error("Pip couldn’t prepare that answer. Please try again.");
      if (auth.currentUser?.uid !== owner.uid || controller.signal.aborted)
        return;
      const nextTurns = [
        ...turns.slice(-9),
        { question: text.trim(), advice: data },
      ];
      const id = chatId ?? crypto.randomUUID();
      const nextChats = [
        {
          id,
          updatedAt: Date.now(),
          budget,
          turns: nextTurns,
          ...(contextId !== null ? { productId: contextId } : {}),
        },
        ...chats.filter((c) => c.id !== id),
      ].slice(0, 10);
      setTurns(nextTurns);
      setChats(nextChats);
      setChatId(id);
      saveActivePipChat(owner.uid, id);
      if (!savePipHistory(owner.uid, nextChats))
        setHistoryError(
          "This browser couldn’t save chat history. Keep this window open to continue.",
        );
      setQuery("");
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "Pip couldn’t connect. Please try again.",
        );
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  function clearProductContext() {
    const current = contextId !== null ? productById(contextId) : undefined;
    setContextId(null);
    if (current && query === `What should I know about the ${current.name}?`)
      setQuery("");
    if (user && chatId) {
      const next = chats.map((c) => {
        if (c.id !== chatId) return c;
        const { productId, ...rest } = c;
        return rest;
      });
      setChats(next);
      if (!savePipHistory(user.uid, next))
        setHistoryError("This browser couldn’t update saved chat context.");
    }
  }
  const ready = canUseAccount(user);
  return (
    <div className="guide-content pip-assistant">
      <div className="guide-welcome">
        <span className="pip">
          <i />
          <i />
        </span>
        <div>
          <h3>Your little shopping companion.</h3>
          <p>Tell me what matters. We’ll find your kind of good.</p>
          <small>AI assistance · grounded in Aisle’s sample catalog</small>
        </div>
      </div>
      {ready && (
        <div className="pip-history-toolbar">
          <button
            className="secondary"
            disabled={busy}
            aria-expanded={showHistory}
            aria-controls="pip-history"
            onClick={() => setShowHistory((v) => !v)}
          >
            Recent chats ({chats.length})
          </button>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setTurns([]);
              setChatId(null);
              setContextId(null);
              if (user) saveActivePipChat(user.uid, null);
              setQuery("");
              setError("");
              setShowHistory(false);
            }}
          >
            New chat
          </button>
        </div>
      )}
      {ready && showHistory && (
        <section id="pip-history" className="pip-history">
          <h3>Your recent chats</h3>
          <p className="small muted">
            Saved in this tab for your account. Not synced to other devices.
          </p>
          {!chats.length ? (
            <p>No conversations yet. Ask Pip your first question below.</p>
          ) : (
            chats.map((c) => (
              <div className="pip-history-row" key={c.id}>
                <button
                  disabled={busy}
                  aria-pressed={chatId === c.id}
                  onClick={() => {
                    setChatId(c.id);
                    setContextId(c.productId ?? null);
                    if (user) saveActivePipChat(user.uid, c.id);
                    setTurns(c.turns);
                    setBudget(c.budget);
                    setQuery("");
                    setError("");
                    setShowHistory(false);
                  }}
                >
                  <strong>{c.turns[0].question}</strong>
                  <small>
                    {new Date(c.updatedAt).toLocaleString()} · {c.turns.length}{" "}
                    exchanges
                  </small>
                </button>
                <button
                  className="text-button"
                  disabled={busy}
                  aria-label={`Delete chat: ${c.turns[0].question}`}
                  onClick={() => {
                    const remaining = chats.filter((x) => x.id !== c.id);
                    setChats(remaining);
                    if (user && !savePipHistory(user.uid, remaining))
                      setHistoryError(
                        "This browser couldn’t update saved chat history.",
                      );
                    if (chatId === c.id) {
                      setChatId(null);
                      setContextId(null);
                      if (user) saveActivePipChat(user.uid, null);
                      setTurns([]);
                      setQuery("");
                      setError("");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </section>
      )}
      {historyError && (
        <p role="status" className="pip-error">
          {historyError}
        </p>
      )}
      {!ready && (
        <div className="demo-notice">
          <p>
            {user
              ? "Verify your email in your account before asking Pip."
              : "Sign in to ask Pip for personal shopping advice."}
          </p>
          <button className="secondary" onClick={onSignIn}>
            {user ? "Open account" : "Sign in"}
          </button>
        </div>
      )}
      {!turns.length && (
        <div className="guide-suggestions">
          {[
            "Headphones under $150 for my commute",
            "Compare AirPods and Beats Flex",
            "A laptop for creative work",
          ].map((s) => (
            <button
              className="chip"
              key={s}
              disabled={!ready || busy}
              onClick={() => ask(s)}
            >
              {s}
              <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      )}
      <div className="pip-conversation" aria-busy={busy}>
        {turns.map((t, i) => (
          <section
            className="pip-turn"
            key={i}
            ref={i === turns.length - 1 ? latest : null}
          >
            <p className="pip-question">{t.question}</p>
            <div className="pip-answer">
              <span className="eyebrow">Pip · AI advice</span>
              <p>{t.advice.answer}</p>
            </div>
            {t.advice.products.length >= 2 &&
              t.advice.products.every(
                (item) =>
                  productById(item.id)?.kind ===
                  productById(t.advice.products[0].id)?.kind,
              ) &&
              onCompareRecommendations && (
                <button
                  className="secondary pip-compare-recommendations"
                  onClick={() =>
                    onCompareRecommendations(
                      t.advice.products.map((item) => item.id),
                    )
                  }
                >
                  <Scale size={16} />
                  Compare these finds
                </button>
              )}
            {t.advice.products.map((item) => {
              const p = productById(item.id)!;
              return (
                <article className="guide-result" key={p.id}>
                  <button
                    className="image-link"
                    aria-label={`View ${p.name}`}
                    onClick={() => onView(p)}
                  >
                    <img src={imageFor(p)} alt={p.name} />
                  </button>
                  <div>
                    <button
                      className="pip-product-name"
                      onClick={() => onView(p)}
                    >
                      {p.name}
                    </button>
                    <strong>{money(p.price)}</strong>
                    <p>{item.reason}</p>
                    <div className="pip-product-actions">
                      <button
                        className="text-button"
                        onClick={() => onCompare(p)}
                      >
                        <Scale size={15} />
                        Compare
                      </button>
                      <button className="text-button" onClick={() => onAdd(p)}>
                        <ShoppingBag size={15} />
                        Add to bag
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </div>
      {busy && (
        <p role="status" className="pip-thinking">
          Pip is checking the shelves…
        </p>
      )}
      {error && (
        <p role="alert" className="pip-error">
          {error}
        </p>
      )}
      {contextId !== null && productById(contextId) && (
        <section
          className="pip-product-context"
          aria-label="Current product context"
        >
          <div>
            <img src={imageFor(productById(contextId)!)} alt="" />
            <div>
              <small>WE’RE LOOKING AT</small>
              <strong>{productById(contextId)!.name}</strong>
            </div>
          </div>
          <p>
            Pip will use this product’s catalog details when you send your
            question.
          </p>
          <div className="pip-context-actions">
            <button
              className="text-button"
              onClick={() => onView(productById(contextId)!)}
            >
              Open product page
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={clearProductContext}
            >
              Clear product context
            </button>
          </div>
        </section>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(query);
        }}
        className="pip-composer"
      >
        <label htmlFor="pip-query">
          {turns.length ? "Ask a follow-up" : "What are you looking for?"}
        </label>
        <textarea
          id="pip-query"
          value={query}
          maxLength={600}
          rows={3}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!ready || busy}
          placeholder="Tell me about your budget, your day, or two products you’re choosing between."
          required
        />
        <div className="pip-composer-bottom">
          <label htmlFor="pip-budget">
            Max per item (USD)
            <input
              id="pip-budget"
              type="number"
              min="0"
              max="10000"
              step="0.01"
              placeholder="Optional"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={busy || !ready}
            />
          </label>
          <button
            className="primary"
            disabled={!ready || busy || !query.trim()}
          >
            Ask Pip
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
      {turns.length > 0 && (
        <button
          className="text-button"
          disabled={busy}
          onClick={() => {
            setTurns([]);
            setChatId(null);
            setContextId(null);
            if (user) saveActivePipChat(user.uid, null);
            setError("");
            setQuery("");
          }}
        >
          Start fresh
        </button>
      )}
      <p className="small muted">
        Demo allowance: up to 20 questions per account per UTC day. Shared site
        and free-provider limits also apply.
      </p>
      <p className="small muted">
        Your question and up to two previous exchanges are sent to Google
        Gemini’s free service. Google may use this content to improve its
        products. Please don’t share personal or payment details. Up to 10 chats
        are saved for your account in this browser tab, including across
        refreshes. They aren’t synced to the cloud. Delete them in Recent chats.
        Only this chat’s latest two exchanges are sent with your question. AI
        can make mistakes; check the product details. Demo prices are USD.
      </p>
    </div>
  );
}
