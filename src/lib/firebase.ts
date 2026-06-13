import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _configPromise: Promise<any> | null = null;

async function loadConfig() {
  if (!_configPromise) {
    _configPromise = fetch("/api/firebase-config").then((r) => {
      if (!r.ok) throw new Error("Firebase config unavailable");
      return r.json();
    });
  }
  return _configPromise;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (_auth) return _auth;
  const config = await loadConfig();
  if (getApps().length === 0) {
    _app = initializeApp(config);
  } else {
    _app = getApp();
  }
  _auth = getAuth(_app);
  return _auth;
}

let _recaptcha: RecaptchaVerifier | null = null;

export function clearRecaptcha() {
  if (_recaptcha) {
    try { _recaptcha.clear(); } catch { /* ignore */ }
    _recaptcha = null;
  }
}

export async function sendPhoneOtp(
  phone: string,
  containerId: string
): Promise<ConfirmationResult> {
  const auth = await getFirebaseAuth();
  clearRecaptcha();
  _recaptcha = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  const formatted = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
  return signInWithPhoneNumber(auth, formatted, _recaptcha);
}

export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<string> {
  const cred = await confirmationResult.confirm(code);
  return cred.user.getIdToken();
}
