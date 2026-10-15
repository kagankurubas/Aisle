import { useState } from "react";
import {
  ArrowRight,
  Check,
  FlaskConical,
  Package,
  ShieldCheck,
} from "lucide-react";
import SandboxPayment from "./SandboxPayment";
import { money, productById } from "./catalog";
import { normalizeCart, totals, type CartLine, type DemoOrder } from "./shop";

export default function DemoTools({
  cart,
  onComplete,
  onOrders,
}: {
  cart: CartLine[];
  onComplete: (order: DemoOrder) => void;
  onOrders: () => void;
}) {
  const [tool, setTool] = useState<"provider" | "offline">("provider");
  const [decline, setDecline] = useState(false);
  const [error, setError] = useState("");
  const lines = normalizeCart(cart);
  const sum = totals(lines);
  function simulate() {
    setError("");
    if (decline) {
      setError(
        "Simulated payment declined. Your bag is unchanged. Select the successful scenario to try again.",
      );
      return;
    }
    onComplete({
      id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      date: new Date().toISOString(),
      lines: lines.map((l) => ({ ...l })),
      total: sum.total,
      shipping: sum.shipping,
      status: "Confirmed",
    });
  }
  return (
    <div className="demo-tools">
      <div className="demo-tools-intro">
        <span className="demo-tools-icon">
          <FlaskConical size={27} />
        </span>
        <div>
          <span className="eyebrow">A LITTLE ROOM TO EXPERIMENT</span>
          <h3>Try the edges. Keep your finds.</h3>
          <p>
            Tools for exploring payment failures and browser-only orders. These
            are separate from checkout and never change your bag.
          </p>
        </div>
      </div>
      <div className="demo-tool-nav" aria-label="Choose a demo tool">
        <button
          className={tool === "provider" ? "active" : ""}
          aria-pressed={tool === "provider"}
          onClick={() => setTool("provider")}
        >
          <ShieldCheck size={18} />
          <span>
            Provider diagnostic<small>1 TL · iyzico Sandbox</small>
          </span>
        </button>
        <button
          className={tool === "offline" ? "active" : ""}
          aria-pressed={tool === "offline"}
          onClick={() => setTool("offline")}
        >
          <Package size={18} />
          <span>
            Offline simulation<small>No payment provider</small>
          </span>
        </button>
      </div>
      {tool === "provider" ? (
        <SandboxPayment
          mode="error-test"
          cart={[]}
          express={false}
          onVerified={() => {}}
        />
      ) : (
        <section className="offline-demo">
          <span className="eyebrow">BROWSER-ONLY ORDER SIMULATION</span>
          <h3>A practice run, without a payment.</h3>
          <p className="muted">
            Creates a demo order from a copy of your current bag. It is not a
            verified payment. Your bag stays unchanged.
          </p>
          {!lines.length ? (
            <p className="demo-notice">
              Add something to your bag first, then return here to simulate an
              order.
            </p>
          ) : (
            <>
              <div className="demo-order-preview">
                {lines.map((line) => (
                  <div key={line.id}>
                    <span>
                      {productById(line.id)!.name}{" "}
                      <small>× {line.quantity}</small>
                    </span>
                    <strong>
                      {money(productById(line.id)!.price * line.quantity)}
                    </strong>
                  </div>
                ))}
                <div>
                  <span>Total including standard demo delivery</span>
                  <strong>{money(sum.total)}</strong>
                </div>
              </div>
              <label className="radio-option">
                <input
                  type="radio"
                  name="offline-scenario"
                  checked={!decline}
                  onChange={() => {
                    setDecline(false);
                    setError("");
                  }}
                />
                <Check size={18} />
                <span>
                  Successful simulation
                  <small>Explore local order history and cancellation</small>
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="offline-scenario"
                  checked={decline}
                  onChange={() => {
                    setDecline(true);
                    setError("");
                  }}
                />
                <span>
                  Declined simulation
                  <small>
                    Try a recoverable error without contacting iyzico
                  </small>
                </span>
              </label>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button className="primary" onClick={simulate}>
                Run offline simulation <ArrowRight size={17} />
              </button>
            </>
          )}
          <button className="text-button" onClick={onOrders}>
            View browser-only demo orders <ArrowRight size={16} />
          </button>
        </section>
      )}
    </div>
  );
}
