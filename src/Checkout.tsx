import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Truck } from "lucide-react";
import { imageFor, money, productById } from "./catalog";
import { totals, type CartLine, type DemoOrder } from "./shop";
import SandboxPayment, { type SandboxReceipt } from "./SandboxPayment";
export default function Checkout({
  cart,
  complete,
  continueShopping,
}: {
  cart: CartLine[];
  complete: (order: DemoOrder) => void;
  continueShopping: () => void;
}) {
  const [step, setStep] = useState(1);
  const [express, setExpress] = useState(false);
  const [decline, setDecline] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<SandboxReceipt | null>(null);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (receipt) completionHeading.current?.focus();
  }, [receipt]);
  const sum = totals(cart, express);
  async function place() {
    if (busy) return;
    setBusy(true);
    setError("");
    await new Promise((r) => setTimeout(r, 650));
    if (decline) {
      setError(
        "Demo payment declined. Choose the successful scenario to try again. Your bag has been kept.",
      );
      setBusy(false);
      return;
    }
    complete({
      id: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      date: new Date().toISOString(),
      lines: cart.map((l) => ({ ...l })),
      total: sum.total,
      shipping: sum.shipping,
      status: "Confirmed",
    });
  }
  if (receipt) return (
    <div className="checkout">
      <ol className="steps" aria-label="Checkout progress">
        {["Delivery", "Review & pay", "Done"].map(label => (
          <li key={label} className="active" aria-current={label === "Done" ? "step" : undefined}>
            <span><Check size={14} /></span>{label}
          </li>
        ))}
      </ol>
      <div className="success" role="status">
        <span className="success-icon"><Check size={35} /></span>
        <span className="eyebrow">IYZICO SANDBOX · VERIFIED</span>
        <h3 ref={completionHeading} tabIndex={-1}>Your test payment is complete.</h3>
        <p>Confirmed directly with iyzico Sandbox. No real money was charged and nothing will be shipped.</p>
        <div className="confirmation">
          <span>Provider reference</span><strong>{receipt.paymentId}</strong>
          <span>Verified test total</span><strong>{money(receipt.total)}</strong>
        </div>
        <p className="small muted">Your bag is still available. This test receipt is shown for this session and is not a fulfilment order.</p>
        <button type="button" className="primary" onClick={continueShopping}>Continue shopping <ArrowRight size={17}/></button>
      </div>
    </div>
  );
  return (
    <div className="checkout">
      <div className="demo-notice">
        <LockKeyhole size={17} />
        <span>
          <strong>Test checkout.</strong> No charge, no card details, no real
          order.
        </span>
      </div>
      <ol className="steps">
        {["Delivery", "Review & pay", "Done"].map((s, i) => (
          <li key={s} className={step >= i + 1 ? "active" : ""}>
            <span>{step > i + 1 ? <Check size={14} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="checkout-layout">
        <div>
          {step === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <h3>Where shall it go?</h3>
              <p className="muted">
                Use the fictional details below to explore the flow. Nothing
                here is saved.
              </p>
              <label>
                Full name
                <input
                  required
                  maxLength={80}
                  name="name"
                  defaultValue="Demo Shopper"
                  autoComplete="off"
                />
              </label>
              <label>
                Street address
                <input
                  required
                  maxLength={160}
                  name="street"
                  defaultValue="123 Example Street"
                  autoComplete="off"
                />
              </label>
              <div className="form-row">
                <label>
                  City
                  <input
                    required
                    name="city"
                    defaultValue="New York"
                    autoComplete="off"
                  />
                </label>
                <label>
                  ZIP code
                  <input
                    required
                    name="zip"
                    pattern="[0-9]{5}"
                    defaultValue="10001"
                    autoComplete="off"
                  />
                </label>
              </div>
              <h3>Make it your delivery</h3>
              <label className="radio-option">
                <input
                  type="radio"
                  name="shipping"
                  checked={!express}
                  onChange={() => setExpress(false)}
                />
                <Truck size={20} />
                <span>
                  Standard delivery
                  <small>
                    Within 3–5 business days ·{" "}
                    {sum.subtotal >= 7500 ? "Free" : "$5.99"}
                  </small>
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="shipping"
                  checked={express}
                  onChange={() => setExpress(true)}
                />
                <Truck size={20} />
                <span>
                  Express delivery
                  <small>Within 1–2 business days · $12.99</small>
                </span>
              </label>
              <button className="primary" type="submit">
                Review order <ArrowRight size={17} />
              </button>
            </form>
          ) : (
            <div>
              <button className="text-button" onClick={() => setStep(1)}>
                <ArrowLeft size={15} /> Edit delivery
              </button>
              <h3>One last look.</h3>
              <p className="muted">
                Choose a provider sandbox test or an offline demo order below.
                Both use test data and never create a real charge or shipment.
              </p>
              <SandboxPayment cart={cart} express={express} onVerified={setReceipt} />
              <hr />
              <h4>Or explore the offline demo</h4>
              <label className="radio-option">
                <input
                  type="radio"
                  name="payment"
                  checked={!decline}
                  onChange={() => setDecline(false)}
                />
                <span>
                  Successful payment
                  <small>Explore confirmation and order history</small>
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="payment"
                  checked={decline}
                  onChange={() => setDecline(true)}
                />
                <span>
                  Declined payment
                  <small>Explore a recoverable payment error</small>
                </span>
              </label>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button
                className="primary"
                disabled={busy || !cart.length}
                onClick={place}
              >
                {busy
                  ? "Processing demo…"
                  : `Place demo order · ${money(sum.total)}`}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>
        <aside className="order-summary">
          <h3>Your good finds</h3>
          {cart.map((l) => {
            const p = productById(l.id)!;
            return (
              <div className="summary-item" key={p.id}>
                <img src={imageFor(p)} alt="" />
                <span>
                  {p.name}
                  <small>Qty {l.quantity}</small>
                </span>
                <strong>{money(p.price * l.quantity)}</strong>
              </div>
            );
          })}
          <dl className="total-list">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(sum.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{sum.shipping ? money(sum.shipping) : "On us"}</dd>
            </div>
            <div>
              <dt>Demo tax</dt>
              <dd>$0.00</dd>
            </div>
            <div className="grand-total">
              <dt>Total</dt>
              <dd>{money(sum.total)}</dd>
            </div>
          </dl>
          <p className="small muted">
            USD · Demonstration pricing. Sandbox payments only. No real taxes,
            charges or shipment.
          </p>
        </aside>
      </div>
    </div>
  );
}
