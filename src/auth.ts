import type { User } from "firebase/auth";
export type SessionUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
};
const env = import.meta.env;
export const authConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_AUTH_DOMAIN &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_APP_ID,
);
export const authAvailable =
  authConfigured && ["http:", "https:"].includes(window.location.protocol);
let initialization: ReturnType<typeof initialize> | undefined;
async function initialize() {
  const [appSDK, authSDK] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);
  const app = appSDK.getApps().length
    ? appSDK.getApp()
    : appSDK.initializeApp({
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID,
      });
  const auth = authSDK.getAuth(app);
  await authSDK.setPersistence(auth, authSDK.browserSessionPersistence);
  return { app, auth, authSDK };
}
export async function getFirebase() {
  if (!authAvailable) throw new Error("auth/unavailable");
  if (!initialization)
    initialization = initialize().catch((error) => {
      initialization = undefined;
      throw error;
    });
  return initialization;
}
export async function getCloud() {
  const client = await getFirebase();
  const storeSDK = await import("firebase/firestore/lite");
  return { ...client, db: storeSDK.getFirestore(client.app), storeSDK };
}
export function sessionUser(user: User | null): SessionUser | null {
  return user
    ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified }
    : null;
}
export async function subscribeAuth(
  callback: (user: SessionUser | null) => void,
) {
  if (!authAvailable) {
    callback(null);
    return () => {};
  }
  const { auth, authSDK } = await getFirebase();
  return authSDK.onAuthStateChanged(auth, (user) =>
    callback(sessionUser(user)),
  );
}
export function authMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  )
    return "Sign-in was closed. You can try again whenever you’re ready.";
  if (code === "auth/popup-blocked")
    return "Allow the sign-in popup in your browser, then try again.";
  if (code === "auth/unauthorized-domain")
    return "Sign-in is not enabled at this address yet. Please use the published store.";
  if (code === "auth/too-many-requests")
    return "Too many attempts. Please wait a little and try again.";
  if (
    code === "auth/weak-password" ||
    code === "auth/password-does-not-meet-requirements"
  )
    return "Choose a stronger password with at least 12 characters.";
  if (code === "auth/network-request-failed")
    return "We couldn’t connect. Check your connection and try again.";
  if (code === "auth/account-exists-with-different-credential")
    return "Try your original sign-in method, or reset your password.";
  return "We couldn’t complete that request. Check your details, or try signing in or resetting your password.";
}
