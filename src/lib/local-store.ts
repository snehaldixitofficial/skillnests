// Firestore-backed reactive store. Drop-in replacement for the old localStorage store —
// preserves the same .get() / .set() / .update(fn) / .use() API so existing pages keep working.
//
// Each store maps to a Firestore collection. Items must have an `id` field (string).
// onSnapshot keeps an in-memory cache; .update(fn) diffs old vs new and writes the delta.

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  or,
  type Unsubscribe,
  type Query,
} from "firebase/firestore";
import { db } from "./firebase";
import { authApi, type AuthUser } from "./auth";

type WithId = { id: string } & Record<string, unknown>;

export function createLocalStore<T extends WithId[]>(
  collectionName: string, 
  initial: T,
  buildQuery?: (col: ReturnType<typeof collection>, user: AuthUser) => Query,
  notifyName?: string
) {
  let cache: T = initial;
  let started = false;
  let unsub: Unsubscribe | null = null;
  const listeners = new Set<() => void>();

  function start() {
    if (started || typeof window === "undefined") return;
    started = true;

    const begin = () => {
      if (unsub) return;
      try {
        const user = authApi.current();
        if (!user) return;
        const ref = buildQuery ? buildQuery(collection(db, collectionName), user) : collection(db, collectionName);
        let isFirstSnapshot = true;
        unsub = onSnapshot(ref, (snap) => {
          const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as unknown as T;
          
          if (!isFirstSnapshot && notifyName && !user.isAdmin) {
            const added = next.filter((n) => !cache.find((c) => c.id === n.id));
            if (added.length > 0) {
              toast(`Oh! The Admin added something in ${notifyName}, check it out!`, { icon: "✨" });
            }
          }
          isFirstSnapshot = false;

          cache = next;
          listeners.forEach((l) => l());
        }, () => { /* permission errors swallowed; cache stays */ });
      } catch { /* ignore */ }
    };

    if (authApi.current()) begin();
    authApi.subscribe(() => {
      if (authApi.current()) begin();
      else { unsub?.(); unsub = null; cache = initial; listeners.forEach((l) => l()); }
    });
  }

  function read(): T { start(); return cache; }

  async function writeDelta(prev: T, next: T) {
    const prevMap = new Map(prev.map((it) => [it.id, it]));
    const nextMap = new Map(next.map((it) => [it.id, it]));
    const ops: Promise<unknown>[] = [];
    for (const [id, item] of nextMap) {
      const before = prevMap.get(id);
      if (!before || JSON.stringify(before) !== JSON.stringify(item)) {
        const { id: _omit, ...payload } = item as WithId;
        // Firebase SDK crashes if we pass undefined values. Strip them out.
        const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));
        ops.push(setDoc(doc(db, collectionName, id), cleanPayload));
      }
    }
    for (const id of prevMap.keys()) {
      if (!nextMap.has(id)) ops.push(deleteDoc(doc(db, collectionName, id)));
    }
    try { await Promise.all(ops); } catch (e) { console.error(`[${collectionName}] write failed`, e); }
  }

  function set(v: T) {
    const prev = cache;
    cache = v;
    listeners.forEach((l) => l());
    void writeDelta(prev, v);
  }

  function update(fn: (prev: T) => T) { set(fn(read())); }

  function subscribe(cb: () => void) {
    start();
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }

  return {
    get: read,
    set,
    update,
    use: () => useSyncExternalStore(subscribe, read, () => initial),
  };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
