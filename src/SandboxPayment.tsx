import { useEffect, useRef, useState } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { getFirebase, subscribeAuth } from "./auth";
import { money } from "./catalog";
import type { CartLine } from "./shop";
import { normalizeCart } from "./shop";

const endpoint = "https://aisle-roan.vercel.app/api/payment";
type Result = {
  status: "success" | "pending" | "declined";
  message: string;
  paymentId?: string;
  total?: number;
  currency?: string;
};
export type SandboxReceipt = {
  paymentId: string;
  total: number;
  lines: CartLine[];
};
export default function SandboxPayment({
  cart,
  express,
  onVerified,
  mode = "bag",
  onSessionChange,
}: {
  cart: CartLine[];
  express: boolean;
  onVerified: (receipt: SandboxReceipt) => void;
  mode?: "bag" | "error-test";
  onSessionChange?: (active: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<{
    ticket: string;
    url: string;
    uid: string;
    mode: "bag" | "error-test";
  } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const request = useRef(false);
  useEffect(() => {
    let disposed = false;
    let unsubscribe = () => {};
    subscribeAuth(() => {
      if (!disposed) {
        setSession(null);
        setResult(null);
        setError("");
      }
    })
      .then((stop) => {
        if (disposed) stop();
        else unsubscribe = stop;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);
  async function call(action: string, body: object, expectedUid?: string) {
    const { auth } = await getFirebase();
    const user = auth.currentUser;
    if (!user?.emailVerified || (expectedUid && user.uid !== expectedUid))
      throw new Error(
        "Sign in with the same verified account to use this payment session.",
      );
    const token = await user.getIdToken();
    const response = await fetch(`${endpoint}?action=${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(28000),
    });
    const data = await response.json();
    if (auth.currentUser?.uid !== user.uid)
      throw new Error("Account changed. Start a new payment test.");
    if (!response.ok)
      throw new Error(data.error || "Sandbox connection failed.");
    return { data, uid: user.uid };
  }
  async function start() {
    if (request.current) return;
    request.current = true;
    setBusy(true);
    setError("");
    setResult(null);
    onSessionChange?.(true);
    // Open from the click gesture; asynchronous popup creation is often blocked.
    const popup = window.open("about:blank", "aisle-sandbox-payment");
    if (popup) {
      popup.opener = null;
      popup.document.title = "Opening iyzico Sandbox…";
    }
    try {
      const { data, uid } = await call("start", {
        lines: cart.map(({ id, quantity }) => ({ id, quantity })),
        express,
        mode,
      });
      const url = new URL(data.url);
      if (
        url.protocol !== "https:" ||
        ![
          "sandbox-cpp.iyzipay.com",
          "sandbox-merchantgw.iyzipay.com",
          "sandbox-consumerapigw.iyzipay.com",
        ].includes(url.hostname)
      )
        throw new Error("Unexpected checkout address.");
      setSession({ ticket: data.ticket, url: url.href, uid, mode });
      if (popup && !popup.closed) popup.location.replace(url.href);
    } catch (e) {
      popup?.close();
      setError(
        e instanceof Error ? e.message : "Could not open sandbox checkout.",
      );
      onSessionChange?.(false);
    } finally {
      request.current = false;
      setBusy(false);
    }
  }
  async function check() {
    if (!session || request.current) return;
    request.current = true;
    setBusy(true);
    setError("");
    try {
      const { data } = await call(
        "status",
        { ticket: session.ticket },
        session.uid,
      );
      if (data.status === "success") {
        if (
          typeof data.paymentId !== "string" ||
          !data.paymentId ||
          !Number.isSafeInteger(data.total) ||
          data.total <= 0
        )
          throw new Error(
            "Incomplete payment confirmation. Please verify again.",
          );
        if (session.mode === "bag") {
          if (data.currency !== "USD" || data.mode !== "bag")
            throw new Error(
              "Unexpected payment mode. Please start a new test.",
            );
          const paidLines = normalizeCart(data.lines);
          if (!paidLines.length)
            throw new Error(
              "This checkout session predates the bag update. Start a new test payment.",
            );
          onVerified({
            paymentId: data.paymentId,
            total: data.total,
            lines: paidLines,
          });
        } else setResult(data);
      } else setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not verify payment.");
    } finally {
      request.current = false;
      setBusy(false);
    }
  }
  const diagnostic = mode === "error-test";
  return (
    <section
      className={`sandbox-payment ${diagnostic ? "diagnostic-payment" : "checkout-payment"}`}
      aria-label={
        diagnostic ? "Separate payment diagnostic" : "Secure test payment"
      }
    >
      <div className="payment-section-title">
        <ShieldCheck size={21} />
        <div>
          <h4>
            {diagnostic ? "A separate 1 TL test" : "A safe way to finish."}
          </h4>
          <span>
            {diagnostic
              ? "IYZICO SANDBOX · TRY 1.00"
              : "SECURED BY IYZICO · TEST MODE"}
          </span>
        </div>
      </div>
      <p className="muted">
        {diagnostic
          ? "A fixed TRY 1.00 sandbox diagnostic. It does not pay for or change your USD bag."
          : "Complete your test payment in iyzico’s secure tab, then return here to confirm. No real money will be charged."}
      </p>
      {!session ? (
        <>
          <button
            type="button"
            className="primary full"
            disabled={busy || (!diagnostic && !cart.length)}
            onClick={start}
          >
            {busy
              ? "Opening secure payment…"
              : diagnostic
                ? "Open 1 TL diagnostic"
                : "Continue to secure payment"}
            <ExternalLink size={17} />
          </button>
          <details className="payment-help">
            <summary>
              {diagnostic
                ? "Cards for this diagnostic"
                : "Test card for this demo"}
            </summary>
            <p>
              {diagnostic
                ? "Insufficient funds: 4111 1111 1111 1129. Retry successfully: 5528 7900 0000 0008."
                : "USD test card: 5400 0100 0000 0004."}
              <br />
              Name: Demo Shopper · Expiry: 12/30 · CVC: 123. Test cards only.
            </p>
          </details>
        </>
      ) : (
        <>
          {result?.status !== "success" && (
            <div className="payment-return">
              <span className="eyebrow">YOUR PAYMENT TAB IS READY</span>
              <h4>Finish there. Confirm here.</h4>
              <p className="muted">
                After completing the iyzico screen, come back to this window.
                Keep this checkout open until your payment is confirmed.
              </p>
              <a
                className="payment-reopen"
                href={session.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Reopen secure payment <ExternalLink size={15} />
              </a>
              <button
                type="button"
                className="primary full"
                disabled={busy}
                onClick={check}
              >
                {busy ? "Confirming with iyzico…" : "Confirm test payment"}
                <ShieldCheck size={17} />
              </button>
            </div>
          )}
          {result && (
            <div
              role="status"
              className={`sandbox-receipt payment-result-${result.status}`}
            >
              <strong>
                {result.status === "success"
                  ? "Diagnostic complete"
                  : result.status === "declined"
                    ? "Payment declined. Let’s try again."
                    : "Not confirmed yet."}
              </strong>
              <p>
                {result.status === "pending"
                  ? "iyzico has not confirmed a completed payment. If its screen shows an error, try another test card there, then confirm again. Your bag has not changed."
                  : result.message}
              </p>
              {result.paymentId && (
                <p>
                  Provider reference: {result.paymentId}
                  <br />
                  Verified test total:{" "}
                  {result.currency === "TRY"
                    ? "TRY " + (result.total! / 100).toFixed(2)
                    : money(result.total!)}
                </p>
              )}
            </div>
          )}
          {(result?.status !== "success" || diagnostic) && (
            <button
              type="button"
              className="text-button payment-restart"
              disabled={busy}
              onClick={() => {
                setSession(null);
                setResult(null);
                setError("");
                onSessionChange?.(false);
              }}
            >
              Start a fresh payment session
            </button>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="error payment-error">
          {error}
        </p>
      )}
      {!diagnostic && (
        <p className="small muted payment-privacy">
          Test checkout only. No real purchase or shipment. Card details stay on
          iyzico’s payment page.
        </p>
      )}
    </section>
  );
}
