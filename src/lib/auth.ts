// Firebase-backed auth. Same hook surface as before so existing imports keep working.
import { useSyncExternalStore } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth as fbAuth, db, googleProvider } from "./firebase";

if (typeof window !== "undefined") {
  getRedirectResult(fbAuth).catch((e) => console.warn("[auth] redirect result", e));
}

export const ADMIN_EMAIL = "founders@skillnests.in";
export const ADMIN_EMAILS = [ADMIN_EMAIL];
export const MAX_DEVICES = 2;
// Comp accounts — always treated as paid (lifetime, no charge).
export const FREE_EMAILS: string[] = [
  "adilsukumar24@gmail.com",
  "snehaldixit237@gmail.com",
];

export type AuthUser = {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "student";
  paid: boolean;          // current membership active?
  paidUntil?: string;     // ISO date — when current monthly cycle ends
  isAuthenticated: true;
};

let currentUser: AuthUser | null = null;
let authReady = false;
let deviceBlocked = false;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("sn-device-id");
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    localStorage.setItem("sn-device-id", id);
  }
  return id;
}

type DeviceEntry = { id: string; lastSeen: number; ua?: string };

async function reconcileDevices(uid: string, role: "admin" | "student"): Promise<boolean> {
  if (role === "admin") return true;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const existing: DeviceEntry[] = Array.isArray(data.devices) ? data.devices : [];
  const myId = getDeviceId();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : "";
  const now = Date.now();
  if (existing.find((d) => d.id === myId)) {
    const next = existing.map((d) => d.id === myId ? { ...d, lastSeen: now, ua } : d);
    await setDoc(ref, { devices: next }, { merge: true });
    return true;
  }
  if (existing.length >= MAX_DEVICES) return false;
  await setDoc(ref, { devices: [...existing, { id: myId, lastSeen: now, ua }] }, { merge: true });
  return true;
}

async function ensureProfile(u: User): Promise<AuthUser> {
  const email = (u.email || "").toLowerCase();
  const role: "admin" | "student" = ADMIN_EMAILS.includes(email) ? "admin" : "student";
  const isFree = FREE_EMAILS.includes(email);
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const name = u.displayName || data?.displayName || (ADMIN_EMAILS.includes(email) ? "Founders" : email.split("@")[0]) || "Friend";
  if (!snap.exists()) {
    await setDoc(ref, { email, displayName: name, role, paid: role === "admin" || isFree, devices: [], createdAt: serverTimestamp() });
  } else if (data?.role !== role) {
    await setDoc(ref, { role }, { merge: true });
  }
  // Comp accounts are always paid — keep Firestore in sync if it drifted.
  if (isFree && !data?.paid) {
    await setDoc(ref, { paid: true }, { merge: true });
  }
  const paidUntil: string | undefined = typeof data?.paidUntil === "string" ? data.paidUntil : undefined;
  const cycleActive = paidUntil ? new Date(paidUntil).getTime() > Date.now() : false;
  const paid = role === "admin" || isFree || cycleActive || !!data?.paid;
  return { uid: u.uid, email, name, role, paid, paidUntil, isAuthenticated: true };
}

let userUnsub: (() => void) | null = null;

if (typeof window !== "undefined") {
  onAuthStateChanged(fbAuth, async (u) => {
    if (userUnsub) { userUnsub(); userUnsub = null; }
    if (u) {
      try {
        const profile = await ensureProfile(u);
        const allowed = await reconcileDevices(profile.uid, profile.role);
        if (!allowed) {
          deviceBlocked = true;
          currentUser = null;
          await fbSignOut(fbAuth).catch(() => {});
        } else {
          deviceBlocked = false;
          currentUser = profile;
          
          userUnsub = onSnapshot(doc(db, "users", u.uid), (snap) => {
            if (snap.exists() && currentUser) {
              const data = snap.data();
              const paidUntil: string | undefined = typeof data?.paidUntil === "string" ? data.paidUntil : undefined;
              const cycleActive = paidUntil ? new Date(paidUntil).getTime() > Date.now() : false;
              const isFree = FREE_EMAILS.includes((u.email || "").toLowerCase());
              const role = data.role || currentUser.role;
              const paid = role === "admin" || isFree || cycleActive || !!data?.paid;
              currentUser = { ...currentUser, role, paid, paidUntil };
              emit();
            }
          });
        }
      } catch {
        currentUser = { uid: u.uid, email: (u.email || "").toLowerCase(), name: u.displayName || "Friend", role: ADMIN_EMAILS.includes((u.email || "").toLowerCase()) ? "admin" : "student", paid: ADMIN_EMAILS.includes((u.email || "").toLowerCase()), isAuthenticated: true };
      }
    } else {
      currentUser = null;
    }
    authReady = true;
    emit();
  });
}

export const authApi = {
  current: () => currentUser,
  ready: () => authReady,

  async signIn(email: string, password: string): Promise<AuthUser> {
    const cred = await signInWithEmailAndPassword(fbAuth, email.trim(), password);
    return ensureProfile(cred.user);
  },

  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    const cred = await createUserWithEmailAndPassword(fbAuth, email.trim(), password);
    if (name) await updateProfile(cred.user, { displayName: name });
    return ensureProfile(cred.user);
  },

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const cred = await signInWithPopup(fbAuth, googleProvider);
      return ensureProfile(cred.user);
    } catch (err: any) {
      const code = err?.code || "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(fbAuth, googleProvider);
        return new Promise<AuthUser>(() => {});
      }
      if (code === "auth/unauthorized-domain") {
        throw new Error(
          "This domain isn't authorized in Firebase. Add it under Authentication → Settings → Authorized domains."
        );
      }
      throw err;
    }
  },

  async signOut() {
    // Remove this device from the user's device list before signing out.
    const u = currentUser;
    if (u && u.role !== "admin") {
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        const data = snap.data() || {};
        const existing: DeviceEntry[] = Array.isArray(data.devices) ? data.devices : [];
        const myId = getDeviceId();
        const next = existing.filter((d) => d.id !== myId);
        await setDoc(ref, { devices: next }, { merge: true });
      } catch { /* ignore */ }
    }
    await fbSignOut(fbAuth);
  },

  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
};

export const auth = authApi;

export function useAuth() {
  const user = useSyncExternalStore(
    authApi.subscribe,
    () => currentUser,
    () => null,
  );
  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isPaid: !!user?.paid || user?.role === "admin",
    role: user?.role,
    ready: authReady,
    deviceBlocked,
    signIn: authApi.signIn,
    signUp: authApi.signUp,
    signInWithGoogle: authApi.signInWithGoogle,
    signOut: authApi.signOut,
  };
}

export function isAuthenticatedClient(): boolean { return !!currentUser; }
export function isDeviceBlocked(): boolean { return deviceBlocked; }
