import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Video,
  Calendar,
  Compass,
  Trophy,
  Gavel,
  Users,
  Code2,
  MessageCircle,
  User as UserIcon,
  Shield,
  ExternalLink,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { auth as fbAuth } from "@/lib/firebase";
import { meetingsStore, noticeStore, type Notice } from "@/stores";
import { uid } from "@/lib/local-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "SkillNests" }] }),
  component: Dashboard,
});

type FeaturePath =
  | "/pyq"
  | "/notes"
  | "/meetings"
  | "/schedule"
  | "/career-guidance"
  | "/olympiads"
  | "/mun"
  | "/skill-share"
  | "/founder";

type PersonalPath = "/chat" | "/schedule" | "/founder" | "/admin";

const features: Array<{ to: FeaturePath; icon: LucideIcon; title: string; desc: string }> = [
  {
    to: "/pyq",
    icon: BookOpen,
    title: "Academic Excellence",
    desc: "Subject → class → year drill-down for past-year papers.",
  },
  {
    to: "/notes",
    icon: FileText,
    title: "Study Notes",
    desc: "Chapter-wise notes you can actually read.",
  },
  {
    to: "/meetings",
    icon: Video,
    title: "Meeting Hub",
    desc: "Global meets + peer-hosted study rooms.",
  },
  {
    to: "/schedule",
    icon: Calendar,
    title: "Schedule",
    desc: "What's coming up — academic and otherwise.",
  },
  {
    to: "/career-guidance",
    icon: Compass,
    title: "Career Guidance",
    desc: "Live class links + career deep-dives.",
  },
  { to: "/olympiads", icon: Trophy, title: "Olympiads", desc: "For depth, not medals." },
  { to: "/mun", icon: Gavel, title: "MUN & Debate", desc: "Voice an opinion. Defend it gently." },
  {
    to: "/skill-share",
    icon: Users,
    title: "Skill Share",
    desc: "Teach a skill, or join a live coding workshop.",
  },

  {
    to: "/founder",
    icon: UserIcon,
    title: "The Team",
    desc: "Read the bio. Send a direct message.",
  },
];

function Dashboard() {
  const { user, isAdmin, isPaid } = useAuth();
  const meetings = meetingsStore.use();
  const notices = noticeStore.use();

  // Notification pop-up logic
  useEffect(() => {
    if (notices.length === 0) return;
    const latestNotice = [...notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const lastSeen = localStorage.getItem("lastSeenNoticeId");
    
    if (latestNotice.id !== lastSeen) {
      // Create a toast notification
      const t = document.createElement("div");
      t.className = "fixed bottom-4 right-4 z-50 glass-strong p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5";
      t.innerHTML = `
        <div class="h-10 w-10 rounded-full bg-rose-gold/20 flex items-center justify-center text-rose-gold shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </div>
        <div>
          <div class="text-sm font-semibold text-foreground">New Notice</div>
          <div class="text-xs text-muted-foreground mt-0.5">Oh! The Admin added something in the Notice Board, check it out!</div>
        </div>
        <button class="text-muted-foreground hover:text-foreground self-start" onclick="this.parentElement.remove()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      `;
      document.body.appendChild(t);
      localStorage.setItem("lastSeenNoticeId", latestNotice.id);
      
      setTimeout(() => {
        if (document.body.contains(t)) {
          t.style.opacity = "0";
          t.style.transition = "opacity 0.5s ease";
          setTimeout(() => t.remove(), 500);
        }
      }, 8000);
    }
  }, [notices]);

  const now = Date.now();
  const upcoming = meetings
    .filter((m) => {
      if (m.kind !== "global") return false;
      const t = new Date(m.startsAt).getTime();
      return t > now - 60 * 60 * 1000;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(var(--rose-gold)/0.08), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-6xl relative flex flex-col md:flex-row gap-8 justify-between items-start">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-rose-gold mb-4">
              your nest
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl italic tracking-tight leading-[1.05]">
              Hi {user?.name?.split(" ")[0]} — welcome{" "}
              <span className="text-gradient-gold not-italic">home</span>.
            </h1>
            <p className="mt-5 max-w-2xl font-serif italic text-lg sm:text-xl text-foreground/80">
              Education that{" "}
              <span className="not-italic text-rose-gold font-medium">completes</span> — and not
              competes.
            </p>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Pick a corner. Browse PYQs at your pace, sit in on a session, share what you're good
              at, or just message the team. Nothing here is a leaderboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/pyq" className="btn-phoenix px-6 py-3 rounded-full text-sm font-medium">
                Start with PYQs
              </Link>
              <Link
                to="/meetings"
                className="btn-ghost-gold px-6 py-3 rounded-full text-sm font-medium"
              >
                See live meetings
              </Link>
              <Link
                to="/skill-share"
                className="btn-ghost-gold px-6 py-3 rounded-full text-sm font-medium"
              >
                Host a class
              </Link>
              {!isPaid && (
                <Link to="/upgrade" className="btn-ghost-gold px-6 py-3 rounded-full text-sm font-medium border-rose-gold/40 text-rose-gold">
                  Unlock everything · ₹49/month
                </Link>
              )}
            </div>
          </motion.div>

          {/* Notice Board */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full md:w-[320px] lg:w-[380px] shrink-0 glass-strong rounded-3xl p-5 flex flex-col max-h-[350px]"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-gold/20">
              <div>
                <div className="font-serif text-xl text-gradient-gold">Notice Board</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">Announcements & Updates</div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    const title = prompt("Notice Title:");
                    if (!title) return;
                    const body = prompt("Notice Body:");
                    if (!body) return;
                    noticeStore.update(p => [
                      { id: uid(), title, body, authorName: user?.name || "Admin", createdAt: new Date().toISOString() },
                      ...p
                    ]);
                  }}
                  className="p-1.5 rounded-full hover:bg-rose-gold/10 text-rose-gold transition"
                  title="Add Notice"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5v14"/></svg>
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-rose-gold/20">
              {notices.length === 0 ? (
                <div className="text-sm text-muted-foreground italic text-center py-8">No notices right now.</div>
              ) : (
                [...notices].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(n => (
                  <div key={n.id} className="relative group p-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition">
                    {isAdmin && (
                      <button 
                        onClick={() => noticeStore.update(p => p.filter(x => x.id !== n.id))}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-crimson opacity-0 group-hover:opacity-100 transition"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    )}
                    <div className="font-serif text-base text-foreground/90 pr-6">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{n.body}</div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-rose-gold/70 mt-2">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live / upcoming meetings banner */}
      {upcoming.length > 0 && (
        <section className="px-4 sm:px-6 pb-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-rose-gold animate-pulse" strokeWidth={1.5} />
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-rose-gold">
                {upcoming.some((m) => {
                  const t = new Date(m.startsAt).getTime();
                  return t <= now && t > now - 60 * 60 * 1000;
                })
                  ? "live now"
                  : "happening soon"}
              </p>
            </div>
            <div className="space-y-3">
              {upcoming.map((m) => {
                const t = new Date(m.startsAt).getTime();
                const isLive = t <= now;
                return (
                  <div
                    key={m.id}
                    className="glass-strong rounded-2xl p-4 flex items-center gap-4 border-rose-gold/30"
                  >
                    <Video className="w-5 h-5 text-rose-gold shrink-0" strokeWidth={1.2} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg truncate">{m.title}</span>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${isLive ? "bg-rose-gold/20 text-rose-gold" : "bg-foreground/10 text-muted-foreground"}`}
                        >
                          {isLive ? "live" : m.kind}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Hosted by {m.hostName} · {new Date(m.startsAt).toLocaleString()}
                      </div>
                    </div>
                    <a
                      href={m.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" /> Join
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Personal cards: chat / schedule / profile / admin */}
      <section className="px-4 sm:px-6 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PersonalCard
              to="/chat"
              icon={MessageCircle}
              title="Chat"
              desc="Group room + DM the team."
            />
            <PersonalCard
              to="/schedule"
              icon={Calendar}
              title="Schedule"
              desc="Upcoming classes & events."
            />
            <PersonalCard
              to="/founder"
              icon={UserIcon}
              title="Profile"
              desc={user?.email ?? "your account"}
            />
            {isAdmin && (
              <PersonalCard
                to="/admin"
                icon={Shield}
                title="Admin"
                desc="Mission control."
                accent
              />
            )}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-rose-gold mb-3">
            explore the nest
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl mb-8">Pick your corner.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.to}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={f.to}
                  className="block glass rounded-3xl p-7 hover:border-rose-gold/40 transition group h-full"
                >
                  <f.icon
                    className="w-7 h-7 text-rose-gold mb-4 group-hover:scale-110 transition"
                    strokeWidth={1.2}
                  />
                  <div className="font-serif text-2xl mb-1">{f.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function PersonalCard({
  to,
  icon: Icon,
  title,
  desc,
  accent,
}: {
  to: PersonalPath;
  icon: LucideIcon;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`glass-strong rounded-2xl p-5 block hover:border-rose-gold/50 transition group ${accent ? "border-rose-gold/30" : ""}`}
    >
      <Icon
        className={`w-5 h-5 mb-3 ${accent ? "text-rose-gold" : "text-foreground/80"} group-hover:text-rose-gold transition`}
        strokeWidth={1.2}
      />
      <div className="font-serif text-lg">{title}</div>
      <p className="text-xs text-muted-foreground truncate">{desc}</p>
    </Link>
  );
}
