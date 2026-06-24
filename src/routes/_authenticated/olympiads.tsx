import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Trophy, Plus, Trash2, ExternalLink, X } from "lucide-react";
import { olympiadStore, type OlympiadItem, type OlympiadResource } from "@/stores";
import { uid } from "@/lib/local-store";
import { PaidGate } from "@/components/PaidGate";

export const Route = createFileRoute("/_authenticated/olympiads")({
  ssr: false,
  head: () => ({ meta: [{ title: "SkillNests" }] }),
  component: OlympiadsPage,
});

function OlympiadsPage() {
  const { isAdmin } = useAuth();
  const items = olympiadStore.use();

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-rose-gold">olympiads</p>
          <h1 className="font-serif text-4xl mt-1">For depth. Not medals.</h1>
        </div>

        <>
          {isAdmin && <AdminForm />}
          <Grid items={items} isAdmin={isAdmin} />
        </>
      </div>
    </main>
  );
}

function AdminForm() {
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");
  const [examDate, setExamDate] = useState("");
  const [blurb, setBlurb] = useState("");
  const [resources, setResources] = useState<OlympiadResource[]>([]);
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl] = useState("");

  function addResource() {
    if (!resTitle.trim() || !resUrl.trim()) return;
    setResources((r) => [...r, { title: resTitle.trim(), url: resUrl.trim() }]);
    setResTitle(""); setResUrl("");
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    olympiadStore.update((prev) => [...prev, {
      id: uid(),
      subject: subject.trim(),
      topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
      examDate: examDate || undefined,
      resources: resources.length ? resources : undefined,
      blurb: blurb.trim() || undefined,
    }]);
    setSubject(""); setTopics(""); setExamDate(""); setBlurb(""); setResources([]);
  }

  return (
    <form onSubmit={add} className="glass-strong rounded-2xl p-4 mb-6 space-y-3">
      <div className="text-xs font-mono uppercase tracking-widest text-rose-gold">Add olympiad</div>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g. Mathematics)" className="w-full glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
      <input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Topics (comma separated, optional)" className="w-full glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
      <div className="grid sm:grid-cols-2 gap-3">
        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
        <input value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="Short description (optional)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
      </div>
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Resources (optional)</div>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={resTitle} onChange={(e) => setResTitle(e.target.value)} placeholder="Resource title" className="glass rounded-lg px-3 py-2 text-xs bg-transparent outline-none" />
          <input value={resUrl} onChange={(e) => setResUrl(e.target.value)} placeholder="URL" className="glass rounded-lg px-3 py-2 text-xs bg-transparent outline-none" />
          <button type="button" onClick={addResource} className="btn-ghost-gold rounded-full px-3 py-1.5 text-xs">+ Add</button>
        </div>
        {resources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resources.map((r, i) => (
              <span key={i} className="text-[11px] glass rounded-full px-2.5 py-0.5 flex items-center gap-1.5">{r.title}<button type="button" onClick={() => setResources((rr) => rr.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button></span>
            ))}
          </div>
        )}
      </div>
      <button className="btn-phoenix rounded-full px-5 py-2.5 text-sm w-full flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add olympiad</button>
    </form>
  );
}

function Grid({ items, isAdmin }: { items: OlympiadItem[]; isAdmin: boolean }) {
  if (items.length === 0) return <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No olympiads listed yet. {isAdmin ? "Add one above." : "Check back soon."}</div>;
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {items.map((o) => (
        <div key={o.id} className="glass rounded-2xl p-6 relative">
          {isAdmin && <button onClick={() => olympiadStore.update((p) => p.filter((x) => x.id !== o.id))} className="absolute top-3 right-3 text-muted-foreground hover:text-crimson p-1.5"><Trash2 className="w-4 h-4" /></button>}
          <Trophy className="w-7 h-7 text-rose-gold mb-3" strokeWidth={1.2} />
          <div className="font-serif text-2xl mb-2">{o.subject}</div>
          {o.blurb && <p className="text-sm text-muted-foreground mb-4">{o.blurb}</p>}
          {o.topics.length > 0 && (
            <>
              <div className="text-[10px] font-mono uppercase tracking-widest text-rose-gold mb-2">Topics</div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {o.topics.map((s) => <span key={s} className="text-[11px] glass rounded-full px-2.5 py-0.5">{s}</span>)}
              </div>
            </>
          )}
          {o.examDate && <div className="text-xs text-muted-foreground mb-3"><span className="font-mono uppercase tracking-widest text-rose-gold mr-2">Exam</span>{new Date(o.examDate).toLocaleDateString()}</div>}
          {o.resources && o.resources.length > 0 && (
            <>
              <div className="text-[10px] font-mono uppercase tracking-widest text-rose-gold mb-2">Resources</div>
              <ul className="text-xs space-y-1">
                {o.resources.map((r, i) => (
                  <li key={i}>
                    {i === 0 ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-rose-gold hover:underline inline-flex items-center gap-1">{r.title} <ExternalLink className="w-3 h-3" /></a>
                    ) : (
                      <PaidGate label="Locked" className="inline-block">
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-rose-gold hover:underline inline-flex items-center gap-1">{r.title} <ExternalLink className="w-3 h-3" /></a>
                      </PaidGate>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
