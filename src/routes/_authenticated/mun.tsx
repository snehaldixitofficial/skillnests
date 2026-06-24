import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Gavel, Brain, Plus, Trash2, FileText } from "lucide-react";
import { munStore, type MunItem } from "@/stores";
import { uid } from "@/lib/local-store";
import { PaidGate } from "@/components/PaidGate";

export const Route = createFileRoute("/_authenticated/mun")({
  ssr: false,
  head: () => ({ meta: [{ title: "SkillNests" }] }),
  component: MunPage,
});

function MunPage() {
  const { isAdmin } = useAuth();
  const items = munStore.use();

  // seed example once
  useEffect(() => {
    if (items.length === 0 && isAdmin) {
      // no auto-seed; admin adds themselves. (Empty state handles UX.)
    }
  }, [items.length, isAdmin]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-rose-gold">mun & debate</p>
          <h1 className="font-serif text-4xl mt-1">Voice. Listen. Defend gently.</h1>
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
  const [draft, setDraft] = useState({ committee: "", title: "", agenda: "", blocs: "", side: "crimson" as "crimson" | "azure", documentUrl: "" });
  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.committee || !draft.title || !draft.agenda) return;
    munStore.update((prev) => [...prev, {
      id: uid(),
      committee: draft.committee.trim(),
      title: draft.title.trim(),
      agenda: draft.agenda.trim(),
      blocs: draft.blocs.split(",").map((b) => b.trim()).filter(Boolean),
      side: draft.side,
      documentUrl: draft.documentUrl.trim() || undefined,
    }]);
    setDraft({ committee: "", title: "", agenda: "", blocs: "", side: "crimson", documentUrl: "" });
  }
  return (
    <form onSubmit={add} className="glass-strong rounded-2xl p-4 mb-6 grid sm:grid-cols-2 gap-3">
      <input value={draft.committee} onChange={(e) => setDraft({ ...draft, committee: e.target.value })} placeholder="Committee (e.g. UNHRC)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
      <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
      <textarea value={draft.agenda} onChange={(e) => setDraft({ ...draft, agenda: e.target.value })} placeholder="Agenda" rows={2} className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none sm:col-span-2 resize-none" />
      <input value={draft.blocs} onChange={(e) => setDraft({ ...draft, blocs: e.target.value })} placeholder="Blocs (comma separated)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
      <select value={draft.side} onChange={(e) => setDraft({ ...draft, side: e.target.value as "crimson" | "azure" })} className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none">
        <option value="crimson">Crimson side</option>
        <option value="azure">Azure side</option>
      </select>
      <input value={draft.documentUrl} onChange={(e) => setDraft({ ...draft, documentUrl: e.target.value })} placeholder="Document URL (optional)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none sm:col-span-2" />
      <button className="btn-phoenix rounded-full px-5 py-2.5 text-sm sm:col-span-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add MUN topic</button>
    </form>
  );
}

function Grid({ items, isAdmin }: { items: MunItem[]; isAdmin: boolean }) {
  if (items.length === 0) return <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No MUN topics yet. {isAdmin ? "Add one above." : "Check back soon."}</div>;
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {items.map((t, i) => (
        <div key={t.id} className="glass rounded-2xl p-7 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: t.side === "azure" ? "linear-gradient(90deg, transparent, rgba(90,110,170,0.7), transparent)" : "linear-gradient(90deg, transparent, rgba(220,80,80,0.7), transparent)" }} />
          {isAdmin && <button onClick={() => munStore.update((p) => p.filter((x) => x.id !== t.id))} className="absolute top-3 right-3 text-muted-foreground hover:text-crimson p-1.5"><Trash2 className="w-4 h-4" /></button>}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full grid place-items-center shrink-0" style={{ background: t.side === "azure" ? "rgba(90,110,170,0.12)" : "rgba(220,80,80,0.12)", border: `1px solid ${t.side === "azure" ? "rgba(90,110,170,0.35)" : "rgba(220,80,80,0.35)"}` }}>
              {t.side === "azure" ? <Brain className="w-5 h-5 text-[#9bb0e0]" strokeWidth={1.2} /> : <Gavel className="w-5 h-5 text-[#dc8585]" strokeWidth={1.2} />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] font-mono mb-2" style={{ color: t.side === "azure" ? "#9bb0e0" : "#dc8585" }}>{t.committee}</div>
              <div className="font-serif text-2xl mb-2">{t.title}</div>
              <p className="text-sm text-muted-foreground mb-3">{t.agenda}</p>
              {t.blocs.length > 0 && (
                <>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-rose-gold mb-1">Blocs</div>
                  <div className="text-xs text-muted-foreground">{t.blocs.join(" · ")}</div>
                </>
              )}
              {t.documentUrl && (
                i === 0 ? (
                  <a href={t.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs text-rose-gold hover:underline">
                    <FileText className="w-3.5 h-3.5" /> View document
                  </a>
                ) : (
                  <PaidGate label="Locked" className="inline-block mt-3">
                    <a href={t.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-rose-gold hover:underline">
                      <FileText className="w-3.5 h-3.5" /> View document
                    </a>
                  </PaidGate>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
