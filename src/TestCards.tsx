import { useState } from "react";
import { Copy, Check, CreditCard } from "lucide-react";
const cards = [
  {
    name: "USD checkout · successful",
    number: "5400 0100 0000 0004",
    mode: "bag",
  },
  {
    name: "TRY 1 diagnostic · insufficient funds",
    number: "4111 1111 1111 1129",
    mode: "diagnostic",
  },
  {
    name: "TRY 1 diagnostic · successful retry",
    number: "5528 7900 0000 0008",
    mode: "diagnostic",
  },
];
export default function TestCards({
  mode = "all",
}: {
  mode?: "bag" | "diagnostic" | "all";
}) {
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");
  async function copy(number: string) {
    try {
      await navigator.clipboard.writeText(number.replaceAll(" ", ""));
      setCopied(number);
      setMessage("Test card number copied.");
    } catch {
      setMessage(
        "Copy is unavailable. Select the visible test number and copy it manually.",
      );
    }
  }
  return (
    <section className="test-cards" aria-label="Sandbox test cards">
      <h4>
        <CreditCard size={18} />
        Test cards · no real charge
      </h4>
      <p>Use these sample cards on the iyzico Sandbox screen.</p>
      {cards
        .filter((c) => mode === "all" || c.mode === mode)
        .map((c) => (
          <div className="test-card" key={c.number}>
            <span>{c.name}</span>
            <div>
              <code>{c.number}</code>
              <button
                type="button"
                className="icon-button"
                aria-label={`Copy ${c.name} card number`}
                onClick={() => copy(c.number)}
              >
                {copied === c.number ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
          </div>
        ))}
      <dl className="test-card-fields">
        <div>
          <dt>Name</dt>
          <dd>Demo Shopper</dd>
        </div>
        <div>
          <dt>Expiry</dt>
          <dd>12/30</dd>
        </div>
        <div>
          <dt>CVC</dt>
          <dd>123</dd>
        </div>
      </dl>
      {mode === "all" && (
        <p className="small muted">
          Use the USD card for the shopping bag. The TRY cards are for the
          separate 1 TL diagnostic.
        </p>
      )}
      <p role="status" className="test-card-feedback">
        {message}
      </p>
    </section>
  );
}
