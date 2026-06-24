import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { ArrowLeft, FileText, Plus, Trash2, Eye } from "lucide-react";
import { notesStore, type PYQSubject, type NoteDoc, type PYQStream } from "@/stores";
import { uid } from "@/lib/local-store";
import { toast } from "sonner";
import { PaidGate } from "@/components/PaidGate";
import { DrivePdfViewer } from "@/components/DrivePdfViewer";
import { isDriveUrl } from "@/lib/drive";

export const Route = createFileRoute("/_authenticated/notes")({
  ssr: false,
  head: () => ({ meta: [{ title: "SkillNests" }] }),
  component: NotesPage,
});

const STREAM_SUBJECTS: Record<PYQStream, PYQSubject[]> = {
  boards: ["English", "Mathematics", "Physics", "Chemistry", "Biology"],
  jee: ["Mathematics", "Physics", "Chemistry"],
  neet: ["Physics", "Chemistry", "Biology"],
};
const STREAM_LABEL: Record<PYQStream, string> = { boards: "Boards", jee: "JEE", neet: "NEET" };

function NotesPage() {
  const { isAdmin } = useAuth();
  const docs = notesStore.use();
  const [stream, setStream] = useState<PYQStream | null>(null);
  const [subject, setSubject] = useState<PYQSubject | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [chapterDraft, setChapterDraft] = useState("");
  const [doc, setDoc] = useState<{ title: string; url: string }>({ title: "", url: "" });
  const [viewing, setViewing] = useState<{ url: string; title: string } | null>(null);

  const inStream = stream ? docs.filter((d) => (d.stream ?? "boards") === stream) : [];
  const chapters = subject ? Array.from(new Set(inStream.filter((d) => d.subject === subject).map((d) => d.chapter))) : [];

  function addChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!stream || !subject || !chapterDraft.trim()) return;
    if (chapters.includes(chapterDraft.trim())) return toast.error("Chapter already exists.");
    notesStore.update((prev) => [...prev, { id: uid(), stream, subject, chapter: chapterDraft.trim(), title: "Placeholder note", url: "#", uploadedAt: new Date().toISOString() }]);
    setChapterDraft("");
    toast.success("Chapter added.");
  }

  function addDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!stream || !subject || !chapter || !doc.title.trim()) return;
    notesStore.update((prev) => [...prev, { id: uid(), stream, subject, chapter, title: doc.title.trim(), url: doc.url.trim() || "#", uploadedAt: new Date().toISOString() }]);
    setDoc({ title: "", url: "" });
    toast.success("Note added.");
  }

  function remove(id: string) { notesStore.update((prev) => prev.filter((d) => d.id !== id)); }

  const visible: NoteDoc[] = stream && subject && chapter ? inStream.filter((d) => d.subject === subject && d.chapter === chapter) : [];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-rose-gold">study notes</p>
          <h1 className="font-serif text-4xl mt-1">Notes that read like a friend explaining.</h1>
          {stream && (
            <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => { setStream(null); setSubject(null); setChapter(null); }} className="text-muted-foreground hover:text-rose-gold flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> All streams</button>
              <span className="text-muted-foreground">/</span>
              <button onClick={() => { setSubject(null); setChapter(null); }} className="text-rose-gold">{STREAM_LABEL[stream]}</button>
              {subject && (<><span className="text-muted-foreground">/</span><button onClick={() => setChapter(null)} className="text-rose-gold">{subject}</button></>)}
              {chapter && (<><span className="text-muted-foreground">/</span><span className="text-rose-gold">{chapter}</span></>)}
            </div>
          )}
        </div>

        <>
          {!stream && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["boards", "jee", "neet"] as PYQStream[]).map((s) => (
                <button key={s} onClick={() => setStream(s)} className="glass-strong rounded-2xl p-8 text-left hover:border-rose-gold/40 transition">
                  <FileText className="w-7 h-7 text-rose-gold mb-3" strokeWidth={1.2} />
                  <div className="font-serif text-3xl">{STREAM_LABEL[s]}</div>
                  <div className="text-xs text-muted-foreground mt-2">{s === "boards" ? "Board syllabus notes" : s === "jee" ? "JEE-focused notes" : "NEET-focused notes"}</div>
                </button>
              ))}
            </div>
          )}

          {stream && !subject && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STREAM_SUBJECTS[stream].map((s) => (
                <button key={s} onClick={() => setSubject(s)} className="glass rounded-2xl p-6 text-left hover:border-rose-gold/40 transition">
                  <FileText className="w-6 h-6 text-rose-gold mb-3" strokeWidth={1.2} />
                  <div className="font-serif text-2xl">{s}</div>
                  <div className="text-xs text-muted-foreground mt-1">{inStream.filter((d) => d.subject === s).length} notes</div>
                </button>
              ))}
            </div>
          )}

          {stream && subject && !chapter && (
            <div>
              {isAdmin && (
                <form onSubmit={addChapter} className="glass-strong rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
                  <span className="text-xs font-mono uppercase tracking-widest text-rose-gold">add chapter</span>
                  <input value={chapterDraft} onChange={(e) => setChapterDraft(e.target.value)} placeholder="Chapter name" className="glass rounded-full px-4 py-2 text-sm bg-transparent outline-none flex-1 min-w-[200px]" />
                  <button className="btn-phoenix rounded-full px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</button>
                </form>
              )}
              {chapters.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No chapters yet.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {chapters.map((c) => (
                    <button key={c} onClick={() => setChapter(c)} className="glass rounded-2xl p-5 text-left hover:border-rose-gold/40 transition">
                      <div className="font-serif text-xl">{c}</div>
                      <div className="text-xs text-muted-foreground mt-1">{inStream.filter((d) => d.subject === subject && d.chapter === c).length} docs</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {stream && subject && chapter && (
            <div>
              {isAdmin && (
                <form onSubmit={addDoc} className="glass-strong rounded-2xl p-4 mb-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
                  <input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} placeholder="Note title" className="glass rounded-full px-4 py-2 text-sm bg-transparent outline-none" />
                  <input value={doc.url} onChange={(e) => setDoc({ ...doc, url: e.target.value })} placeholder="Google Drive link" className="glass rounded-full px-4 py-2 text-sm bg-transparent outline-none" />
                  <button className="btn-phoenix rounded-full px-5 py-2 text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add note</button>
                </form>
              )}
              <div className="space-y-3">
                {visible.length === 0 && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No notes yet in this chapter.</div>}
                {visible.map((d, i) => (
                  <div key={d.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                    <FileText className="w-5 h-5 text-rose-gold shrink-0" strokeWidth={1.2} />
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-lg truncate">{d.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">{d.chapter}</div>
                    </div>
                    {i === 0 ? (
                      isDriveUrl(d.url) ? (
                        <button onClick={() => setViewing({ url: d.url, title: d.title })} className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><Eye className="w-3 h-3" /> View</button>
                      ) : (
                        <a href={d.url} target="_blank" rel="noreferrer" className="btn-ghost-gold rounded-full px-4 py-2 text-xs">Open</a>
                      )
                    ) : (
                      <PaidGate label="Locked">
                        {isDriveUrl(d.url) ? (
                          <button onClick={() => setViewing({ url: d.url, title: d.title })} className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><Eye className="w-3 h-3" /> View</button>
                        ) : (
                          <a href={d.url} target="_blank" rel="noreferrer" className="btn-ghost-gold rounded-full px-4 py-2 text-xs">Open</a>
                        )}
                      </PaidGate>
                    )}
                    {isAdmin && <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-crimson p-2"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>

        {viewing && <DrivePdfViewer url={viewing.url} title={viewing.title} onClose={() => setViewing(null)} />}
      </div>
    </main>
  );
}
