import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Plus, Trash2, Video, ExternalLink, Code2, Users, MonitorPlay } from "lucide-react";
import { skillStore, codingStore } from "@/stores";
import { uid } from "@/lib/local-store";
import { toast } from "sonner";
import { PaidGate } from "@/components/PaidGate";

export const Route = createFileRoute("/_authenticated/skill-share")({
  ssr: false,
  head: () => ({ meta: [{ title: "SkillNests" }] }),
  component: SkillSharePage,
});

function SkillSharePage() {
  const { user, isAdmin } = useAuth();
  
  // Skill Share State
  const posts = skillStore.use();
  const [draftSkill, setDraftSkill] = useState({ title: "", body: "", videoUrl: "", classUrl: "" });
  const [showSkillForm, setShowSkillForm] = useState(false);

  // Coding Campus State
  const ws = codingStore.use();
  const sortedWs = [...ws].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const [draftCode, setDraftCode] = useState({ title: "", language: "", level: "Beginner" as const, startsAt: "", meetUrl: "", blurb: "" });
  const [showCodeForm, setShowCodeForm] = useState(false);

  function addSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !draftSkill.title.trim() || !draftSkill.body.trim()) return;
    skillStore.update((prev) => [{ id: uid(), authorEmail: user.email, authorName: user.name, title: draftSkill.title.trim(), body: draftSkill.body.trim(), videoUrl: draftSkill.videoUrl.trim() || undefined, classUrl: draftSkill.classUrl.trim() || undefined, createdAt: new Date().toISOString() }, ...prev]);
    setDraftSkill({ title: "", body: "", videoUrl: "", classUrl: "" });
    setShowSkillForm(false);
    toast.success("Posted to skill share.");
  }

  function removeSkill(id: string, authorEmail: string) {
    if (!user) return;
    if (!isAdmin && user.email !== authorEmail) return toast.error("You can only delete your own posts.");
    skillStore.update((prev) => prev.filter((p) => p.id !== id));
  }

  function addCode(e: React.FormEvent) {
    e.preventDefault();
    if (!draftCode.title || !draftCode.startsAt || !draftCode.meetUrl) return;
    codingStore.update((prev) => [...prev, { id: uid(), title: draftCode.title, language: draftCode.language || "Any", level: draftCode.level, startsAt: new Date(draftCode.startsAt).toISOString(), meetUrl: draftCode.meetUrl, blurb: draftCode.blurb }]);
    setDraftCode({ title: "", language: "", level: "Beginner", startsAt: "", meetUrl: "", blurb: "" });
    setShowCodeForm(false);
    toast.success("Coding workshop added.");
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 space-y-16">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-rose-gold">skill share</p>
          <h1 className="font-serif text-4xl mt-1">Learn & Build together.</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">From watercolour and chess to live coding sessions — teach what you love, build with friends.</p>
        </div>

        <>

        {/* CODING WORKSHOPS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
              <h2 className="font-serif text-2xl">Coding Workshops</h2>
            </div>
            {isAdmin && (
              <button onClick={() => setShowCodeForm((v) => !v)} className="btn-ghost-gold rounded-full px-4 py-2 text-xs flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> {showCodeForm ? "Cancel" : "Add Workshop"}
              </button>
            )}
          </div>

          {showCodeForm && isAdmin && (
            <form onSubmit={addCode} className="glass-strong rounded-2xl p-5 mb-6 grid sm:grid-cols-2 gap-3">
              <input value={draftCode.title} onChange={(e) => setDraftCode({ ...draftCode, title: e.target.value })} placeholder="Workshop title" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none sm:col-span-2" />
              <input value={draftCode.language} onChange={(e) => setDraftCode({ ...draftCode, language: e.target.value })} placeholder="Language" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
              <select value={draftCode.level} onChange={(e) => setDraftCode({ ...draftCode, level: e.target.value as any })} className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none">
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
              <input type="datetime-local" value={draftCode.startsAt} onChange={(e) => setDraftCode({ ...draftCode, startsAt: e.target.value })} className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
              <input value={draftCode.meetUrl} onChange={(e) => setDraftCode({ ...draftCode, meetUrl: e.target.value })} placeholder="Google Meet URL" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
              <textarea value={draftCode.blurb} onChange={(e) => setDraftCode({ ...draftCode, blurb: e.target.value })} placeholder="Short description" rows={2} className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none sm:col-span-2 resize-none" />
              <button className="btn-phoenix rounded-full px-5 py-2.5 text-sm sm:col-span-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Schedule Workshop</button>
            </form>
          )}

          <div className="space-y-4">
            {sortedWs.length === 0 && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No upcoming workshops.</div>}
            {sortedWs.map((w, i) => (
              <div key={w.id} className="glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <MonitorPlay className="w-6 h-6 text-rose-gold shrink-0" strokeWidth={1.2} />
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-xl">{w.title}</div>
                  <div className="text-xs text-muted-foreground font-mono">{w.language} · {w.level} · {new Date(w.startsAt).toLocaleString()}</div>
                  {w.blurb && <div className="text-sm text-muted-foreground mt-2">{w.blurb}</div>}
                </div>
                {i === 0 ? (
                  <a href={w.meetUrl} target="_blank" rel="noreferrer" className="btn-phoenix rounded-full px-5 py-2.5 text-sm flex items-center gap-2 shrink-0"><ExternalLink className="w-4 h-4" /> Join via Google Meet</a>
                ) : (
                  <PaidGate label="Locked" className="shrink-0">
                    <a href={w.meetUrl} target="_blank" rel="noreferrer" className="btn-phoenix rounded-full px-5 py-2.5 text-sm flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Join via Google Meet</a>
                  </PaidGate>
                )}
                {isAdmin && <button onClick={() => codingStore.update((p) => p.filter((x) => x.id !== w.id))} className="text-muted-foreground hover:text-crimson p-2"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
        </section>

        {/* COMMUNITY SKILLS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
              <h2 className="font-serif text-2xl">Community Skills</h2>
            </div>
            <button onClick={() => setShowSkillForm((v) => !v)} className="btn-ghost-gold rounded-full px-4 py-2 text-xs flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> {showSkillForm ? "Cancel" : "Upload Skill / Host Class"}
            </button>
          </div>

          {showSkillForm && (
            <form onSubmit={addSkill} className="glass-strong rounded-2xl p-5 mb-6 grid sm:grid-cols-2 gap-3">
              <input value={draftSkill.title} onChange={(e) => setDraftSkill({ ...draftSkill, title: e.target.value })} placeholder="What are you teaching?" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none sm:col-span-2" />
              <textarea value={draftSkill.body} onChange={(e) => setDraftSkill({ ...draftSkill, body: e.target.value })} placeholder="A few sentences about it…" rows={3} className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none sm:col-span-2 resize-none" />
              <input value={draftSkill.videoUrl} onChange={(e) => setDraftSkill({ ...draftSkill, videoUrl: e.target.value })} placeholder="Video URL (optional)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
              <input value={draftSkill.classUrl} onChange={(e) => setDraftSkill({ ...draftSkill, classUrl: e.target.value })} placeholder="Live class URL (optional)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
              <button className="btn-phoenix rounded-full px-5 py-2.5 text-sm sm:col-span-2">Post</button>
            </form>
          )}

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
            {posts.length === 0 && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground break-inside-avoid">Nothing posted yet — be the first.</div>}
            {posts.map((p, i) => (
              <div key={p.id} className="mb-5 break-inside-avoid glass rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-rose-gold mb-2">{p.authorName}</div>
                  <div className="font-serif text-xl leading-snug mb-2">{p.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.body}</p>
                  <div className="flex flex-wrap gap-2">
                    {i === 0 ? (
                      <>
                        {p.videoUrl && <a href={p.videoUrl} target="_blank" rel="noreferrer" className="text-xs btn-ghost-gold rounded-full px-3 py-1.5 flex items-center gap-1.5"><Video className="w-3 h-3" /> Watch</a>}
                        {p.classUrl && <a href={p.classUrl} target="_blank" rel="noreferrer" className="text-xs btn-phoenix rounded-full px-3 py-1.5 flex items-center gap-1.5"><ExternalLink className="w-3 h-3" /> Join class</a>}
                      </>
                    ) : (
                      <PaidGate label="Locked" className="inline-flex gap-2">
                        {p.videoUrl && <a href={p.videoUrl} target="_blank" rel="noreferrer" className="text-xs btn-ghost-gold rounded-full px-3 py-1.5 flex items-center gap-1.5"><Video className="w-3 h-3" /> Watch</a>}
                        {p.classUrl && <a href={p.classUrl} target="_blank" rel="noreferrer" className="text-xs btn-phoenix rounded-full px-3 py-1.5 flex items-center gap-1.5"><ExternalLink className="w-3 h-3" /> Join class</a>}
                      </PaidGate>
                    )}
                    {(isAdmin || user?.email === p.authorEmail) && <button onClick={() => removeSkill(p.id, p.authorEmail)} className="ml-auto text-muted-foreground hover:text-crimson p-1.5"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        </>
      </div>
    </main>
  );
}
