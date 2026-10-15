import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ShoppingBag, Scale } from "lucide-react";
import { getFirebase, type SessionUser } from "./auth";
import { productById, imageFor, money, type Product } from "./catalog";
type Advice = { answer: string; products: { id: number; reason: string }[] };
type Turn = { question: string; advice: Advice };
export default function Pip({
  user,
  onSignIn,
  onView,
  onAdd,
  onCompare,
}: {
  user: SessionUser | null;
  onSignIn: () => void;
  onView: (p: Product) => void;
  onAdd: (p: Product) => void;
  onCompare: (p: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  const latest = useRef<HTMLDivElement>(null);
  useEffect(() => {
    pending.current?.abort();
    pending.current = null;
    setTurns([]);
    setQuery("");
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
    if (pending.current || !text.trim() || !user?.emailVerified) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setQuery(text);
    try {
      const { auth } = await getFirebase();
      const owner = auth.currentUser;
      if (!owner || owner.uid !== user.uid)
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
      setTurns((previous) => [
        ...previous.slice(-4),
        { question: text.trim(), advice: data },
      ]);
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
  const ready = Boolean(user?.emailVerified);
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
            setError("");
            setQuery("");
          }}
        >
          Start fresh
        </button>
      )}
      <p className="small muted">
        Your question and up to two previous exchanges are sent to Google
        Gemini’s free service. Google may use this content to improve its
        products. Please don’t share personal or payment details. Chats aren’t
        saved by Aisle and clear when you close Pip. AI can make mistakes; check
        the product details. Demo prices are USD.
      </p>
    </div>
  );
}
