import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Calendar, Code2, Compass, FileText, Inbox, Trophy, Users, Video, IndianRupee, CheckCircle2, XCircle, Smartphone, Search } from "lucide-react";
import { pyqStore, notesStore, meetingsStore, scheduleStore, skillStore, codingStore, founderInboxStore, careerVideoStore, careerLiveStore, paymentRequestsStore, munStore, olympiadStore } from "@/stores";
import { findUserByEmail, setUserPaid, resetUserDevices, getUser, subscribePaidStats, type AdminUserRow, type PaidStats } from "@/lib/admin-users";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — skillnests.in" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!isAdmin) navigate({ to: "/dashboard" }); }, [isAdmin, navigate]);

  const pyqCount = pyqStore.use().length;
  const notesCount = notesStore.use().length;
  const meetingsCount = meetingsStore.use().length;
  const scheduleCount = scheduleStore.use().length;
  const skillCount = skillStore.use().length;
  const codingCount = codingStore.use().length;
  const careerVidCount = careerVideoStore.use().length;
  const careerLiveCount = careerLiveStore.use().length;
  const munCount = munStore.use().length;
  const olympiadCount = olympiadStore.use().length;

  if (!isAdmin) return null;

  const tiles = [
    { to: "/pyq", icon: BookOpen, title: "PYQs", count: pyqCount, desc: "Boards · JEE · NEET." },
    { to: "/notes", icon: FileText, title: "Notes", count: notesCount, desc: "Chapter-wise notes." },
    { to: "/meetings", icon: Video, title: "Meetings", count: meetingsCount, desc: "Schedule global meets." },
    { to: "/schedule", icon: Calendar, title: "Events", count: scheduleCount, desc: "Calendar entries." },
    { to: "/career-guidance", icon: Compass, title: "Career", count: careerVidCount + careerLiveCount, desc: `${careerLiveCount} live · ${careerVidCount} videos` },
    { to: "/skill-share", icon: Users, title: "Skill Share", count: skillCount, desc: "User submissions." },
    { to: "/coding-campus", icon: Code2, title: "Coding", count: codingCount, desc: "Workshops." },
    { to: "/mun", icon: BarChart3, title: "MUN", count: munCount, desc: "Topics & blocs." },
    { to: "/olympiads", icon: Trophy, title: "Olympiads", count: olympiadCount, desc: "Subjects & resources." },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-rose-gold">admin</p>
          <h1 className="font-serif text-4xl mt-1">Mission control.</h1>
          <p className="text-sm text-muted-foreground mt-2">Every section has its own admin tools inline. Tap a tile to manage.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {tiles.map((t) => (
            <Link key={t.to} to={t.to as any} className="glass-strong rounded-2xl p-5 hover:border-rose-gold/40 transition group">
              <div className="flex items-center justify-between mb-3">
                <t.icon className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
                <span className="text-2xl font-serif">{t.count}</span>
              </div>
              <div className="font-serif text-lg">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </Link>
          ))}
        </div>

        <PaidStatsSection />
        <PaymentRequestsSection />
        <MembersSection />
        <FounderInboxSection />
      </div>
    </main>
  );
}

function PaymentRequestsSection() {
  const requests = paymentRequestsStore.use();
  const pending = requests.filter((r) => r.status === "pending");
  const recent = [...requests].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);

  async function verify(id: string, uid: string) {
    try {
      await setUserPaid(uid, true);
      paymentRequestsStore.update((p) => p.map((r) => r.id === id ? { ...r, status: "verified" } : r));
      toast.success("Verified — user unlocked.");
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  }
  function reject(id: string) {
    paymentRequestsStore.update((p) => p.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
    toast.success("Marked as rejected.");
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <IndianRupee className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
        <h2 className="font-serif text-2xl">Payment requests</h2>
        <span className="ml-auto text-xs font-mono text-muted-foreground">{pending.length} pending</span>
      </div>
      <div className="space-y-3">
        {recent.length === 0 && <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">No payment requests yet.</div>}
        {recent.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm font-medium">{r.name} <span className="text-xs text-muted-foreground font-normal">· {r.email}</span></div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">UTR: {r.utr}</div>
              {r.note && <div className="text-xs text-muted-foreground mt-1 italic">"{r.note}"</div>}
              <div className="text-[10px] text-muted-foreground font-mono mt-1">{new Date(r.at).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              {r.status === "pending" && (
                <>
                  <button onClick={() => verify(r.id, r.uid)} className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Verify & unlock</button>
                  <button onClick={() => reject(r.id)} className="btn-ghost-gold rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                </>
              )}
              {r.status === "verified" && <span className="text-xs text-rose-gold font-mono">✓ verified</span>}
              {r.status === "rejected" && <span className="text-xs text-muted-foreground font-mono">rejected</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MembersSection() {
  const [email, setEmail] = useState("");
  const [user, setUserRow] = useState<AdminUserRow | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const u = await findUserByEmail(email);
      if (!u) toast.error("User not found.");
      setUserRow(u);
    } finally { setLoading(false); }
  }

  async function refresh() {
    if (!user) return;
    const u = await getUser(user.uid);
    setUserRow(u);
  }

  async function togglePaid() {
    if (!user) return;
    await setUserPaid(user.uid, !user.paid);
    toast.success(user.paid ? "Marked as unpaid." : "Unlocked.");
    await refresh();
  }

  async function clearDevices() {
    if (!user) return;
    if (!confirm(`Sign ${user.email} out of all devices?`)) return;
    await resetUserDevices(user.uid);
    toast.success("Devices cleared. They can now sign in fresh.");
    await refresh();
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
        <h2 className="font-serif text-2xl">Members & devices</h2>
      </div>
      <form onSubmit={lookup} className="glass-strong rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="glass rounded-full px-4 py-2 text-sm bg-transparent outline-none flex-1 min-w-[220px]" />
        <button disabled={loading} className="btn-phoenix rounded-full px-5 py-2 text-sm flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Look up</button>
      </form>
      {user && (
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="font-serif text-xl">{user.displayName || user.email}</div>
            <span className="text-xs text-muted-foreground">· {user.email}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-gold">{user.role}</span>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${user.paid ? "text-rose-gold" : "text-muted-foreground"}`}>{user.paid ? "paid" : "free"}</span>
            <div className="ml-auto flex gap-2">
              <button onClick={togglePaid} className="btn-ghost-gold rounded-full px-4 py-1.5 text-xs">{user.paid ? "Mark unpaid" : "Unlock manually"}</button>
              <button onClick={clearDevices} className="btn-phoenix rounded-full px-4 py-1.5 text-xs">Reset devices</button>
            </div>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Devices ({(user.devices ?? []).length} / 2)</div>
          <div className="space-y-1.5">
            {(user.devices ?? []).length === 0 && <div className="text-xs text-muted-foreground">No active devices.</div>}
            {(user.devices ?? []).map((d) => (
              <div key={d.id} className="text-xs flex flex-wrap gap-2 glass rounded-xl px-3 py-2">
                <span className="font-mono text-muted-foreground">{d.id}</span>
                <span className="text-muted-foreground truncate max-w-[280px]">{d.ua}</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">last seen {new Date(d.lastSeen).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FounderInboxSection() {
  const inbox = founderInboxStore.use();
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Inbox className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
        <h2 className="font-serif text-2xl">Founder inbox</h2>
        <span className="ml-auto text-xs font-mono text-muted-foreground">{inbox.length} messages</span>
      </div>
      <div className="space-y-3">
        {inbox.length === 0 && <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">No messages yet.</div>}
        {[...inbox].reverse().map((m) => (
          <div key={m.id} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{m.fromName}</span>
              <span className="text-xs text-muted-foreground">· {m.fromEmail}</span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">{new Date(m.at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PaidStatsSection() {
  const [stats, setStats] = useState<PaidStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<"paid" | "free" | null>(null);

  useEffect(() => {
    const unsub = subscribePaidStats((s) => {
      setStats(s);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const paid = stats?.paid ?? 0;
  const total = stats?.total ?? 0;
  const free = Math.max(0, total - paid);
  const conversion = total ? Math.round((paid / total) * 100) : 0;
  const revenue = paid * 49;
  
  const paidUsers = stats?.paidUsers || [];
  const freeUsers = stats?.freeUsers || [];

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <IndianRupee className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
        <h2 className="font-serif text-2xl">Membership stats</h2>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{loading ? "Connecting…" : "Live"}</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setViewing(viewing === "paid" ? null : "paid")}
          className={`glass-strong rounded-2xl p-5 cursor-pointer transition ${viewing === "paid" ? "border-rose-gold" : "hover:border-rose-gold/40"}`}
        >
          <div className="text-xs font-mono uppercase tracking-widest text-rose-gold">paid members</div>
          <div className="font-serif text-4xl mt-2">{paid}</div>
        </div>
        <div 
          onClick={() => setViewing(viewing === "free" ? null : "free")}
          className={`glass-strong rounded-2xl p-5 cursor-pointer transition ${viewing === "free" ? "border-rose-gold" : "hover:border-rose-gold/40"}`}
        >
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">free users</div>
          <div className="font-serif text-4xl mt-2">{free}</div>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">conversion</div>
          <div className="font-serif text-4xl mt-2">{conversion}<span className="text-xl">%</span></div>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">revenue</div>
          <div className="font-serif text-4xl mt-2">₹{revenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {viewing && (
        <div className="mt-4 glass rounded-2xl p-5 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-serif text-xl mb-4">{viewing === "paid" ? "Paid Members" : "Free Users"}</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {(viewing === "paid" ? paidUsers : freeUsers).length === 0 && (
              <div className="text-sm text-muted-foreground">No users in this category.</div>
            )}
            {(viewing === "paid" ? paidUsers : freeUsers).map((u) => (
              <div key={u.email} className="glass-strong rounded-xl p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-medium">{u.name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                {u.paidUntil && new Date(u.paidUntil).getTime() > Date.now() && (
                  <div className="text-xs font-mono text-rose-gold">
                    Active until {new Date(u.paidUntil).toLocaleDateString()}
                  </div>
                )}
                {u.paidUntil && new Date(u.paidUntil).getTime() <= Date.now() && new Date(u.paidUntil).getTime() > 0 && (
                  <div className="text-xs font-mono text-muted-foreground">
                    Expired {new Date(u.paidUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

