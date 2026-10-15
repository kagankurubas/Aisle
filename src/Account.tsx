import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  LogOut,
  Mail,
  Package,
  UserRound,
} from "lucide-react";
import {
  authAvailable,
  authConfigured,
  authMessage,
  getFirebase,
  sessionUser,
  type SessionUser,
} from "./auth";
export default function Account({
  user,
  onUser,
  onDemo,
  onOrders,
  onSaved,
  savedCount,
  syncStatus,
  page = false,
}: {
  user: SessionUser | null;
  onUser: (user: SessionUser | null) => void;
  onDemo: () => void;
  onOrders: () => void;
  onSaved: () => void;
  savedCount: number;
  syncStatus: string;
  page?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastSent, setLastSent] = useState(0);
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(authMessage(e));
    } finally {
      setPassword("");
      setBusy(false);
    }
  }
  async function google() {
    await perform(async () => {
      const { auth, authSDK } = await getFirebase();
      const provider = new authSDK.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await authSDK.signInWithPopup(auth, provider);
    });
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    await perform(async () => {
      const { auth, authSDK } = await getFirebase();
      if (mode === "reset") {
        try {
          await authSDK.sendPasswordResetEmail(auth, email.trim());
        } catch (e) {
          if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
        }
        setMessage(
          "If an account can receive a reset email, instructions are on their way. Check your inbox and spam folder.",
        );
        return;
      }
      if (mode === "signup") {
        const result = await authSDK.createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        try {
          await authSDK.sendEmailVerification(result.user);
          setLastSent(Date.now());
          setMessage(
            "Account created. Check your inbox to verify your email before syncing your finds.",
          );
        } catch {
          setError(
            "Your account was created, but the verification email could not be sent. Use “Send verification email” to try again.",
          );
        }
      } else {
        await authSDK.signInWithEmailAndPassword(auth, email.trim(), password);
      }
    });
  }
  function changeMode(next: typeof mode) {
    setMode(next);
    setPassword("");
    setError("");
    setMessage("");
  }
  return (
    <div className="account-content">
      {!page && (
        <p className="muted">A small space for your saved finds and orders.</p>
      )}
      {user ? (
        <>
          <p className="account-email">
            <Mail size={17} />
            {user.email}
          </p>
          {user.emailVerified ? (
            <p className="stock">
              <Check size={17} /> Email verified ·{" "}
              {syncStatus === "saved"
                ? "Bag and favorites saved to your account"
                : syncStatus === "saving"
                  ? "Saving your finds…"
                  : syncStatus === "loading"
                    ? "Loading your account…"
                    : syncStatus === "error"
                      ? "Your changes have not been saved yet"
                      : "Your personal account"}
            </p>
          ) : (
            <div className="verification-box">
              <strong>Verify your email to save your finds.</strong>
              <p>
                Open the verification link in your inbox, then come back and
                check below.
              </p>
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  perform(async () => {
                    const { auth, authSDK } = await getFirebase();
                    if (!auth.currentUser) return;
                    await authSDK.reload(auth.currentUser);
                    await authSDK.getIdToken(auth.currentUser, true);
                    onUser(sessionUser(auth.currentUser));
                    setMessage(
                      auth.currentUser.emailVerified
                        ? "Your email is verified. You’re ready to go."
                        : "Your email is not verified yet. Check your inbox, then try again.",
                    );
                  })
                }
              >
                I’ve verified my email
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  perform(async () => {
                    if (Date.now() - lastSent < 60000) {
                      setMessage(
                        "Please wait a minute before requesting another verification email.",
                      );
                      return;
                    }
                    const { auth, authSDK } = await getFirebase();
                    if (auth.currentUser) {
                      await authSDK.sendEmailVerification(auth.currentUser);
                      setLastSent(Date.now());
                      setMessage(
                        "Verification email sent. Check your inbox and spam folder.",
                      );
                    }
                  })
                }
              >
                Send verification email
              </button>
            </div>
          )}
          <p className="small muted">
            Email and password are managed by Firebase Authentication. Demo
            orders are separate from verified payments.
          </p>
          <button
            className="secondary"
            disabled={busy || syncStatus === "saving"}
            onClick={() =>
              perform(async () => {
                const { auth, authSDK } = await getFirebase();
                await authSDK.signOut(auth);
                onUser(null);
                setEmail("");
              })
            }
          >
            <LogOut size={17} />{" "}
            {syncStatus === "saving" ? "Saving before sign out…" : "Sign out"}
          </button>
        </>
      ) : (
        <>
          <button
            className="google-button"
            disabled={!authAvailable || busy}
            onClick={google}
          >
            <span className="google-g">G</span>Continue with Google
            <ArrowUpRight size={16} />
          </button>
          {!authAvailable && (
            <p className="integration-note">
              {authConfigured
                ? "Open the published store to sign in. Account access is unavailable from a downloaded file."
                : "Account sign-in is not enabled in this offline demo."}
            </p>
          )}
          <div className="or-divider">
            <span>or use your email</span>
          </div>
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => changeMode("login")}
            >
              Sign in
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => changeMode("signup")}
            >
              Create account
            </button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="auth-email">
              Email address
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </label>
            {mode !== "reset" && (
              <label htmlFor="auth-password">
                Password
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  minLength={mode === "signup" ? 12 : 1}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                {mode === "signup" && (
                  <small>
                    Use at least 12 characters. Never reuse another account’s
                    password.
                  </small>
                )}
              </label>
            )}
            <button
              className="primary full"
              type="submit"
              disabled={!authAvailable || busy}
            >
              {busy
                ? "One moment…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset instructions"
                    : "Sign in with email"}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => changeMode(mode === "reset" ? "login" : "reset")}
            >
              {mode === "reset" ? "Back to sign in" : "Forgot your password?"}
            </button>
          </form>
          <div className="or-divider">
            <span>just exploring?</span>
          </div>
          <button className="secondary full" onClick={onDemo} disabled={busy}>
            <UserRound size={17} /> Try the demo <ArrowRight size={16} />
          </button>
          <p className="small muted centered">
            No account. No personal details. Just a little exploring.
          </p>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="auth-feedback" role="status" aria-live="polite">
        {message}
      </p>
      {!page && (
        <div className="account-links">
          <button onClick={onOrders}>
            <Package size={20} />
            <span>
              Your demo orders
              <small>Confirmation, details, and cancellation</small>
            </span>
            <ArrowRight size={18} />
          </button>
          <button onClick={onSaved}>
            <Heart size={20} />
            <span>
              Your saved finds<small>{savedCount} things to come back to</small>
            </span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
