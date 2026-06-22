import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Zap, XCircle } from "lucide-react";
import { paymentRequestsStore } from "@/stores";
import { uid as makeId } from "@/lib/local-store";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  createRazorpaySubscription,
  verifyRazorpaySubscription,
  cancelRazorpaySubscription,
  getLatestPaidInvoice,
  getSubscriptionStatus,
} from "@/lib/razorpay.functions";
import { extendPaidMonth, setSubscriptionMeta, reconcileSubscriptionForUser } from "@/lib/admin-users";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/_authenticated/upgrade")({
  ssr: false,
  head: () => ({ meta: [{ title: "Unlock — skillnests.in" }] }),
  component: UpgradePage,
});

const PRICE = 49;

declare global {
  interface Window { Razorpay?: any }
}

function UpgradePage() {
  const { user, isPaid } = useAuth();
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);

  const createSub = useServerFn(createRazorpaySubscription);
  const verifySub = useServerFn(verifyRazorpaySubscription);
  const cancelSub = useServerFn(cancelRazorpaySubscription);
  const fetchLatest = useServerFn(getLatestPaidInvoice);
  const fetchStatus = useServerFn(getSubscriptionStatus);

  // Load subscription metadata + reconcile recurring charges on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.data() || {};
        const subId: string | undefined = typeof d.subscriptionId === "string" ? d.subscriptionId : undefined;
        if (!subId || cancelled) return;
        setSubscriptionId(subId);
        // Reconcile: if Razorpay has a newer paid invoice than we've recorded, extend.
        const r = await reconcileSubscriptionForUser(user.uid, async (id) => {
          const inv = await fetchLatest({ data: { subscriptionId: id } });
          return { paymentId: inv.paymentId, paidAt: inv.paidAt };
        });
        if (r.extended) toast.success("Membership renewed automatically.");
        // Pull latest status for UI
        const st = await fetchStatus({ data: { subscriptionId: subId } });
        if (!cancelled) setSubStatus(st.status);
        await setSubscriptionMeta(user.uid, { subscriptionStatus: st.status });
      } catch (e) {
        console.warn("[upgrade] reconcile failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [user, fetchLatest, fetchStatus]);

  async function subscribeWithRazorpay() {
    if (!user) return;
    if (!window.Razorpay) return toast.error("Payment SDK still loading. Try again in a moment.");
    setPaying(true);
    try {
      const sub = await createSub({ data: { uid: user.uid, email: user.email } });
      // Save subscription id immediately so we can reconcile even if checkout closes.
      await setSubscriptionMeta(user.uid, { subscriptionId: sub.subscriptionId, subscriptionStatus: "created" });
      setSubscriptionId(sub.subscriptionId);
      const rzp = new window.Razorpay({
        key: sub.keyId,
        subscription_id: sub.subscriptionId,
        name: "skillnests.in",
        description: `Monthly membership — ₹${PRICE}/month, auto-renews`,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#c8a27a" },
        handler: async (resp: { razorpay_subscription_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifySub({ data: { subscriptionId: resp.razorpay_subscription_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature } });
            await extendPaidMonth(user.uid, { subscriptionId: resp.razorpay_subscription_id, lastInvoiceId: resp.razorpay_payment_id, lastPaidAt: Math.floor(Date.now() / 1000) });
            await setSubscriptionMeta(user.uid, { subscriptionStatus: "active" });
            paymentRequestsStore.update((prev) => [
              ...prev,
              { id: makeId(), uid: user.uid, email: user.email, name: user.name, utr: resp.razorpay_payment_id, note: `Razorpay subscription ${resp.razorpay_subscription_id}`, status: "verified", at: new Date().toISOString() },
            ]);
            toast.success("Subscription active — you're unlocked!");
            setPaying(false);
          } catch (e: any) {
            toast.error(e?.message || "Verification failed. Contact support with payment ID " + resp.razorpay_payment_id);
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed.");
        setPaying(false);
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e?.message || "Could not start subscription.");
      setPaying(false);
    }
  }

  async function cancelSubscription() {
    if (!user || !subscriptionId) return;
    if (!confirm("Cancel auto-renewal? You'll keep access until your current cycle ends.")) return;
    setCancelling(true);
    try {
      const r = await cancelSub({ data: { subscriptionId, atCycleEnd: true } });
      await setSubscriptionMeta(user.uid, { subscriptionStatus: r.status });
      setSubStatus(r.status);
      toast.success("Auto-renewal cancelled. Access remains until your cycle ends.");
    } catch (e: any) {
      toast.error(e?.message || "Could not cancel subscription.");
    } finally {
      setCancelling(false);
    }
  }

  const recurringActive = subStatus === "active" || subStatus === "authenticated";

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="text-center mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-rose-gold">membership</p>
          <h1 className="font-serif text-4xl mt-2">₹{PRICE} / month</h1>
          <p className="text-sm text-muted-foreground mt-3">Auto-renews every month. Cancel anytime — you keep access until the cycle ends.</p>
        </div>

        {isPaid ? (
          <div className="glass-strong rounded-3xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-rose-gold mx-auto mb-3" strokeWidth={1.2} />
            <h2 className="font-serif text-2xl mb-1">You're a member.</h2>
            <p className="text-sm text-muted-foreground">
              {user?.paidUntil ? `Active until ${new Date(user.paidUntil).toLocaleDateString()}.` : "Everything is unlocked."}
              {recurringActive ? " Auto-renews monthly." : subStatus === "cancelled" || subStatus === "halted" ? " Auto-renewal off." : ""}
            </p>
            {subscriptionId && recurringActive && (
              <button onClick={cancelSubscription} disabled={cancelling} className="rounded-full px-5 py-2.5 text-sm mt-5 mx-auto inline-flex items-center gap-2 border border-white/10 hover:bg-white/5 disabled:opacity-60">
                {cancelling ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling…</> : <><XCircle className="w-4 h-4" /> Cancel auto-renewal</>}
              </button>
            )}
            {!subscriptionId && (
              <button onClick={subscribeWithRazorpay} disabled={paying} className="btn-phoenix rounded-full px-6 py-3 text-sm mt-5 flex items-center gap-2 mx-auto disabled:opacity-60">
                {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…</> : <>Start auto-renewing ₹{PRICE}/month</>}
              </button>
            )}
          </div>
        ) : (
          <div className="glass-strong rounded-3xl p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
              <h2 className="font-serif text-2xl">Subscribe — auto-unlock</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Authorize once and Razorpay auto-debits ₹{PRICE} every 30 days (UPI, cards, netbanking, wallets). Your account unlocks instantly and stays unlocked while the subscription is active. Cancel anytime.
            </p>
            <button onClick={subscribeWithRazorpay} disabled={paying} className="btn-phoenix rounded-full px-6 py-3 text-sm w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…</> : <>Subscribe — ₹{PRICE}/month, auto-renew</>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
