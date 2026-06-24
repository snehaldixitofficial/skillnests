import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Compass, ExternalLink, Plus, Trash2, Video, FileText, Eye } from "lucide-react";
import { careerLiveStore, careerVideoStore } from "@/stores";
import { uid } from "@/lib/local-store";
import { PaidGate } from "@/components/PaidGate";
import { DrivePdfViewer } from "@/components/DrivePdfViewer";
import { isDriveUrl } from "@/lib/drive";

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const Route = createFileRoute("/_authenticated/career-guidance")({
  ssr: false,
  head: () => ({ meta: [{ title: "SkillNests" }] }),
  component: CareerPage,
});

function CareerPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<"live" | "videos">("live");

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-rose-gold">career & motivation</p>
          <h1 className="font-serif text-4xl mt-1">Pick a direction. Without panic.</h1>
        </div>

        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            <Tab active={tab === "live"} onClick={() => setTab("live")}>Live class & links</Tab>
            <Tab active={tab === "videos"} onClick={() => setTab("videos")}>Explore careers</Tab>
          </div>

          {tab === "live" && <LiveSection isAdmin={isAdmin} />}
          {tab === "videos" && <VideosSection isAdmin={isAdmin} />}
        </>
      </div>
    </main>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm transition ${active ? "glass-strong border-rose-gold/40 text-rose-gold" : "glass text-muted-foreground hover:text-foreground"}`}>{children}</button>;
}

function LiveSection({ isAdmin }: { isAdmin: boolean }) {
  const live = careerLiveStore.use();
  const [draft, setDraft] = useState({ title: "", mentor: "", startsAt: "", meetUrl: "" });

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title || !draft.mentor || !draft.startsAt || !draft.meetUrl) return;
    careerLiveStore.update((prev) => [...prev, { id: uid(), title: draft.title, mentor: draft.mentor, startsAt: new Date(draft.startsAt).toISOString(), meetUrl: draft.meetUrl }]);
    setDraft({ title: "", mentor: "", startsAt: "", meetUrl: "" });
  }

  return (
    <div>
      {isAdmin && (
        <form onSubmit={add} className="glass-strong rounded-2xl p-4 mb-5 grid sm:grid-cols-2 gap-3">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Session title" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <input value={draft.mentor} onChange={(e) => setDraft({ ...draft, mentor: e.target.value })} placeholder="Mentor name" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <input type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <input value={draft.meetUrl} onChange={(e) => setDraft({ ...draft, meetUrl: e.target.value })} placeholder="Live link" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <button className="btn-phoenix rounded-full px-5 py-2.5 text-sm sm:col-span-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add live class</button>
        </form>
      )}
      <div className="space-y-3">
        {live.length === 0 && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No live classes scheduled.</div>}
        {live.map((s, i) => (
          <div key={s.id} className="glass rounded-2xl p-4 flex items-center gap-4">
            <Compass className="w-5 h-5 text-rose-gold shrink-0" strokeWidth={1.2} />
            <div className="flex-1 min-w-0">
              <div className="font-serif text-lg truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.mentor} · {new Date(s.startsAt).toLocaleString()}</div>
            </div>
            {i === 0 ? (
              <a href={normalizeUrl(s.meetUrl)} target="_blank" rel="noreferrer" className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><ExternalLink className="w-3 h-3" /> Join</a>
            ) : (
              <PaidGate label="Locked">
                <a href={normalizeUrl(s.meetUrl)} target="_blank" rel="noreferrer" className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><ExternalLink className="w-3 h-3" /> Join</a>
              </PaidGate>
            )}
            {isAdmin && <button onClick={() => careerLiveStore.update((p) => p.filter((x) => x.id !== s.id))} className="text-muted-foreground hover:text-crimson p-2"><Trash2 className="w-4 h-4" /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function VideosSection({ isAdmin }: { isAdmin: boolean }) {
  const items = careerVideoStore.use();
  const [draft, setDraft] = useState({ title: "", speaker: "", thumb: "", videoUrl: "", documentUrl: "" });
  const [viewing, setViewing] = useState<{ url: string; title: string } | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || (!draft.videoUrl.trim() && !draft.documentUrl.trim())) return;
    const payload = {
      id: uid(),
      title: draft.title.trim(),
      speaker: draft.speaker.trim() || undefined,
      thumb: draft.thumb.trim() || undefined,
      videoUrl: draft.videoUrl.trim() || undefined,
      documentUrl: draft.documentUrl.trim() || undefined,
    };
    careerVideoStore.update((prev: typeof items) => [...prev, payload]);
    setDraft({ title: "", speaker: "", thumb: "", videoUrl: "", documentUrl: "" });
  }

  return (
    <div>
      {isAdmin && (
        <form onSubmit={add} className="glass-strong rounded-2xl p-4 mb-5 grid sm:grid-cols-2 gap-3">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <input value={draft.speaker} onChange={(e) => setDraft({ ...draft, speaker: e.target.value })} placeholder="Speaker (optional)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <input value={draft.videoUrl} onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })} placeholder="Video URL (optional)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <input value={draft.documentUrl} onChange={(e) => setDraft({ ...draft, documentUrl: e.target.value })} placeholder="Document URL (optional)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <input value={draft.thumb} onChange={(e) => setDraft({ ...draft, thumb: e.target.value })} placeholder="Thumbnail URL (optional)" className="glass rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none" />
          <button className="btn-phoenix rounded-full px-5 py-2.5 text-sm sm:col-span-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add career resource</button>
          <p className="text-[11px] text-muted-foreground sm:col-span-2 -mt-1">Add either a video or a document (or both). Drive PDFs must be shared as &quot;Anyone with the link&quot; to embed inline.</p>
        </form>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">No career resources yet.</div>}
        {items.map((item, i) => {
          const isVideo = !!item.videoUrl;
          return (
            <div key={item.id} className="glass rounded-2xl overflow-hidden group hover:border-rose-gold/40 transition block relative">
              {isVideo ? (
                i === 0 ? (
                  <a href={normalizeUrl(item.videoUrl!)} target="_blank" rel="noreferrer" className="block">
                    <div className="aspect-video relative" style={{ background: item.thumb ? `url(${item.thumb}) center/cover` : "linear-gradient(135deg, oklch(0.3 0.08 30), oklch(0.2 0.05 25))" }}>
                      <div className="absolute inset-0 grid place-items-center bg-black/20 group-hover:bg-black/40 transition">
                        <Video className="w-10 h-10 text-rose-gold" strokeWidth={1.2} />
                      </div>
                    </div>
                  </a>
                ) : (
                  <PaidGate label="Locked">
                    <a href={normalizeUrl(item.videoUrl!)} target="_blank" rel="noreferrer" className="block">
                      <div className="aspect-video relative" style={{ background: item.thumb ? `url(${item.thumb}) center/cover` : "linear-gradient(135deg, oklch(0.3 0.08 30), oklch(0.2 0.05 25))" }}>
                        <div className="absolute inset-0 grid place-items-center bg-black/20 group-hover:bg-black/40 transition">
                          <Video className="w-10 h-10 text-rose-gold" strokeWidth={1.2} />
                        </div>
                      </div>
                    </a>
                  </PaidGate>
                )
              ) : (
                <div className="aspect-video relative" style={{ background: "linear-gradient(135deg, oklch(0.3 0.08 30), oklch(0.2 0.05 25))" }}>
                  <div className="absolute inset-0 grid place-items-center bg-black/20">
                    <FileText className="w-10 h-10 text-rose-gold" strokeWidth={1.2} />
                  </div>
                </div>
              )}
              <div className="p-4">
                <div className="font-serif text-lg leading-tight">{item.title}</div>
                {item.speaker && <div className="text-xs text-muted-foreground mt-1">{item.speaker}</div>}
                {item.documentUrl && (
                  <div className="mt-2">
                    {i === 0 ? (
                      isDriveUrl(item.documentUrl) ? (
                        <button onClick={() => setViewing({ url: item.documentUrl!, title: item.title })} className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><Eye className="w-3 h-3" /> View document</button>
                      ) : (
                        <a href={normalizeUrl(item.documentUrl!)} target="_blank" rel="noreferrer" className="btn-ghost-gold rounded-full px-4 py-2 text-xs inline-flex items-center gap-1.5"><FileText className="w-3 h-3" /> Open document</a>
                      )
                    ) : (
                      <PaidGate label="Locked" className="inline-block">
                        {isDriveUrl(item.documentUrl) ? (
                          <button onClick={() => setViewing({ url: item.documentUrl!, title: item.title })} className="btn-phoenix rounded-full px-4 py-2 text-xs flex items-center gap-1.5"><Eye className="w-3 h-3" /> View document</button>
                        ) : (
                          <a href={normalizeUrl(item.documentUrl!)} target="_blank" rel="noreferrer" className="btn-ghost-gold rounded-full px-4 py-2 text-xs inline-flex items-center gap-1.5"><FileText className="w-3 h-3" /> Open document</a>
                        )}
                      </PaidGate>
                    )}
                  </div>
                )}
              </div>
              {isAdmin && <button onClick={() => careerVideoStore.update((p: typeof items) => p.filter((x) => x.id !== item.id))} className="absolute top-2 right-2 glass-strong rounded-full p-1.5 text-muted-foreground hover:text-crimson"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          );
        })}
      </div>
      {viewing && <DrivePdfViewer url={viewing.url} title={viewing.title} onClose={() => setViewing(null)} />}
    </div>
  );
}
