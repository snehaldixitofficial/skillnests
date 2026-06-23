import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { ArrowLeft, BookOpen, Plus, Trash2, FileDown, Eye } from "lucide-react";
import { pyqStore, type PYQSubject, type PYQClass, type PYQPaper, type PYQStream } from "@/stores";
import { uid } from "@/lib/local-store";
import { toast } from "sonner";
import { PaidPageGate, PaidGate } from "@/components/PaidGate";
import { DrivePdfViewer } from "@/components/DrivePdfViewer";
import { isDriveUrl } from "@/lib/drive";

export const Route = createFileRoute("/_authenticated/pyq")({
  ssr: false,
  head: () => ({ meta: [{ title: "SkillNests" }] }),
  component: PYQPage,
});

const STREAM_SUBJECTS: Record<PYQStream, PYQSubject[]> = {
  boards: ["English", "Mathematics", "Physics", "Chemistry", "Biology"],
  jee: ["Mathematics", "Physics", "Chemistry"],
  neet: ["Physics", "Chemistry", "Biology"],
};

const STREAM_LABEL: Record<PYQStream, string> = { boards: "Boards", jee: "JEE", neet: "NEET" };

function PYQPage() {
  const { isAdmin } = useAuth();
  const papers = pyqStore.use();
  const [stream, setStream] = useState<PYQStream | null>(null);
  const [subject, setSubject] = useState<PYQSubject | null>(null);
  const [klass, setKlass] = useState<PYQClass | null>(null);
  const [year, setYear] = useState<number | null>(null);

  // treat legacy rows (no stream) as "boards"
  const filteredByStream = stream ? papers.filter((p) => (p.stream ?? "boards") === stream) : [];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <Breadcrumb stream={stream} subject={subject} klass={klass} year={year} onStream={setStream} onSubject={setSubject} onClass={setKlass} onYear={setYear} />

        <PaidPageGate peek={!stream ? <StreamPickerPeek /> : undefined}>
          {!stream && <StreamPicker onPick={setStream} />}
          {stream && !subject && <SubjectGrid stream={stream} onPick={setSubject} />}
          {stream && subject && !klass && <ClassPicker stream={stream} subject={subject} onPick={setKlass} />}
          {stream && subject && klass && year === null && <YearGrid stream={stream} subject={subject} klass={klass} papers={filteredByStream} isAdmin={isAdmin} onPick={setYear} />}
          {stream && subject && klass && year !== null && (
            <PapersList
              stream={stream}
              subject={subject}
              klass={klass}
              year={year}
              papers={filteredByStream.filter((p) => p.subject === subject && p.klass === klass && p.year === year)}
              isAdmin={isAdmin}
            />
          )}
        </PaidPageGate>
      </div>
    </main>
  );
}

function Breadcrumb({ stream, subject, klass, year, onStream, onSubject, onClass, onYear }: {
  stream: PYQStream | null; subject: PYQSubject | null; klass: PYQClass | null; year: number | null;
  onStream: (s: null) => void; onSubject: (s: null) => void; onClass: (k: null) => void; onYear: (y: null) => void;
}) {
  return (
    <div className="mb-8">
      <p className="text-xs font-mono uppercase tracking-widest text-rose-gold">academic excellence</p>
      <h1 className="font-serif text-4xl mt-1">Past Year Questions.</h1>
      {stream && (
        <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
          <button onClick={() => { onStream(null); onSubject(null); onClass(null); onYear(null); }} className="text-muted-foreground hover:text-rose-gold flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> All streams</button>
          <span className="text-muted-foreground">/</span>
          <button onClick={() => { onSubject(null); onClass(null); onYear(null); }} className="text-rose-gold">{STREAM_LABEL[stream]}</button>
          {subject && (<><span className="text-muted-foreground">/</span><button onClick={() => { onClass(null); onYear(null); }} className="text-rose-gold">{subject}</button></>)}
          {klass && (<><span className="text-muted-foreground">/</span><button onClick={() => onYear(null)} className="text-rose-gold">{klass === "Others" ? "Others" : `${klass}th`}</button></>)}
          {year !== null && (<><span className="text-muted-foreground">/</span><span className="text-rose-gold">{year}</span></>)}
        </div>
      )}
    </div>
  );
}

function StreamPickerPeek() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(["boards", "jee", "neet"] as PYQStream[]).map((s) => (
        <div key={s} className="glass rounded-2xl p-6">
          <div className="font-serif text-2xl">{STREAM_LABEL[s]}</div>
        </div>
      ))}
    </div>
  );
}

function StreamPicker({ onPick }: { onPick: (s: PYQStream) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(["boards", "jee", "neet"] as PYQStream[]).map((s) => (
        <button key={s} onClick={() => onPick(s)} className="glass-strong rounded-2xl p-8 text-left hover:border-rose-gold/40 transition">
          <BookOpen className="w-7 h-7 text-rose-gold mb-3" strokeWidth={1.2} />
          <div className="font-serif text-3xl">{STREAM_LABEL[s]}</div>
          <div className="text-xs text-muted-foreground mt-2">{s === "boards" ? "Class 11 & 12 board exams" : s === "jee" ? "JEE Mains & Advanced" : "NEET-UG"}</div>
        </button>
      ))}
    </div>
  );
}

function SubjectGrid({ stream, onPick }: { stream: PYQStream; onPick: (s: PYQSubject) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {STREAM_SUBJECTS[stream].map((s) => (
        <button key={s} onClick={() => onPick(s)} className="glass rounded-2xl p-6 text-left hover:border-rose-gold/40 transition group">
          <BookOpen className="w-6 h-6 text-rose-gold mb-3" strokeWidth={1.2} />
          <div className="font-serif text-2xl">{s}</div>
          <div className="text-xs text-muted-foreground mt-1">11th & 12th · all years</div>
        </button>
      ))}
    </div>
  );
}

function ClassPicker({ stream, subject, onPick }: { stream: PYQStream; subject: PYQSubject; onPick: (k: PYQClass) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
      {(["11", "12", "Others"] as PYQClass[]).map((k) => (
        <button key={k} onClick={() => onPick(k)} className="glass-strong rounded-2xl p-10 text-center hover:border-rose-gold/40 transition">
          <div className="font-serif text-4xl text-gradient-gold">{k === "Others" ? "Others" : `${k}th`}</div>
          <div className="text-xs text-muted-foreground font-mono mt-2 uppercase tracking-widest">{k === "Others" ? "Additional" : "Standard"}</div>
          <div className="text-xs text-rose-gold mt-3">{STREAM_LABEL[stream]} · {subject}</div>
        </button>
      ))}
    </div>
  );
}

function YearGrid({ stream, subject, klass, papers, isAdmin, onPick }: { stream: PYQStream; subject: PYQSubject; klass: PYQClass; papers: PYQPaper[]; isAdmin: boolean; onPick: (y: number) => void }) {
  const yearsWithPapers = Array.from(new Set(papers.filter((p) => p.subject === subject && p.klass === klass).map((p) => p.year))).sort((a, b) => b - a);
  const [newYear, setNewYear] = useState("");

  function addYear(e: React.FormEvent) {
    e.preventDefault();
    const y = parseInt(newYear);
    if (!y || y < 1990 || y > 2100) return toast.error("Enter a valid year.");
    pyqStore.update((prev) => prev.some((p) => (p.stream ?? "boards") === stream && p.subject === subject && p.klass === klass && p.year === y) ? prev : [...prev, { id: uid(), stream, subject, klass, year: y, title: `Placeholder — add a paper`, url: "#", uploadedAt: new Date().toISOString() }]);
    setNewYear("");
    toast.success(`Year ${y} added.`);
  }

  return (
    <div>
      {isAdmin && (
        <form onSubmit={addYear} className="glass-strong rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-xs font-mono uppercase tracking-widest text-rose-gold">add year</span>
          <input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="e.g. 2024" className="glass rounded-full px-4 py-2 text-sm bg-transparent outline-none w-32" />
          <button className="btn-phoenix rounded-full px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add year</button>
        </form>
      )}
      {yearsWithPapers.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No years added yet for {STREAM_LABEL[stream]} · {subject} · {klass}th. {isAdmin ? "Add a year above." : "Check back soon."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {yearsWithPapers.map((y) => (
            <button key={y} onClick={() => onPick(y)} className="glass rounded-2xl p-5 text-center hover:border-rose-gold/40 transition">
              <div className="font-serif text-3xl">{y}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">{papers.filter((p) => p.subject === subject && p.klass === klass && p.year === y).length} papers</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PapersList({ stream, subject, klass, year, papers, isAdmin }: { stream: PYQStream; subject: PYQSubject; klass: PYQClass; year: number; papers: PYQPaper[]; isAdmin: boolean }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [viewing, setViewing] = useState<{ url: string; title: string } | null>(null);

  function addPaper(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    pyqStore.update((prev) => [...prev, { id: uid(), stream, subject, klass, year, title: title.trim(), url: url.trim() || "#", uploadedAt: new Date().toISOString() }]);
    setTitle(""); setUrl("");
    toast.success("Paper added.");
  }

  function remove(id: string) {
    pyqStore.update((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      {isAdmin && (
        <form onSubmit={addPaper} className="glass-strong rounded-2xl p-4 mb-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paper title" className="glass rounded-full px-4 py-2 text-sm bg-transparent outline-none" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Google Drive PDF link" className="glass rounded-full px-4 py-2 text-sm bg-transparent outline-none" />
          <button className="btn-phoenix rounded-full px-5 py-2 text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Upload</button>
          <p className="text-[11px] text-muted-foreground sm:col-span-3 -mt-1">Drive file must be "Anyone with the link" to embed inline.</p>
        </form>
      )}
      <div className="space-y-3">
        {papers.length === 0 && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No papers yet for {year}.</div>}
        {papers.map((p) => (
          <div key={p.id} className="glass rounded-2xl p-4 flex items-center gap-4">
            <FileDown className="w-5 h-5 text-rose-gold shrink-0" strokeWidth={1.2} />
            <div className="flex-1 min-w-0">
              <div className="font-serif text-lg truncate">{p.title}</div>
              <div className="text-xs text-muted-foreground font-mono">{STREAM_LABEL[stream]} · {subject} · {klass}th · {p.year}</div>
            </div>
            <PaidGate label="Locked">
              {isDriveUrl(p.url) ? (
                <button onClick={() => setViewing({ url: p.url, title: p.title })} className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><Eye className="w-3 h-3" /> View</button>
              ) : (
                <a href={p.url} target="_blank" rel="noreferrer" className="btn-ghost-gold rounded-full px-4 py-2 text-xs">Download</a>
              )}
            </PaidGate>
            {isAdmin && <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-crimson p-2"><Trash2 className="w-4 h-4" /></button>}
          </div>
        ))}
      </div>
      {viewing && <DrivePdfViewer url={viewing.url} title={viewing.title} onClose={() => setViewing(null)} />}
    </div>
  );
}
