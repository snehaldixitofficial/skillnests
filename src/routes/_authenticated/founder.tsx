import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Send } from "lucide-react";
import { founderInboxStore } from "@/stores";
import { uid } from "@/lib/local-store";
import { toast } from "sonner";
import founderPhoto from "@/assets/priyushsomething.jpeg";
import abhinavPhoto from "@/assets/abhinav.jpeg";
import anamPhoto from "@/assets/anam.jpeg";
import sanviPhoto from "@/assets/sanvi.jpeg";
import miskaPhoto from "@/assets/miska rai.jpeg";
import aravPhoto from "@/assets/aravPhoto.jpg";
import anantPhoto from "@/assets/anant.jpeg";

export const Route = createFileRoute("/_authenticated/founder")({
  ssr: false,
  head: () => ({ meta: [{ title: "SkillNests" }] }),
  component: FounderPage,
});

function FounderPage() {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    founderInboxStore.update((prev) => [...prev, { id: uid(), fromName: user.name, fromEmail: user.email, body: body.trim(), at: new Date().toISOString() }]);
    setBody("");
    setSent(true);
    toast.success("Message delivered to the founder's inbox.");
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl">The Team</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-rose-gold mt-2">Behind skillnests.in</p>
          </div>

          {(() => {
            const founders = [
              { name: "Piyush Raj", photo: founderPhoto, bio: "I've always felt a need for change in our education system, so I decided to build SkillNests so students can get access to everything while connecting with their peers.", email: "piyushilu26@gmail.com" },
              { name: "Anam Zia", photo: anamPhoto, bio: "Education that completes and not competes.", email: "ziaanam1522@gmail.com" },
              { name: "Anant Arya", photo: anantPhoto, bio: "Finally it's time that we take a step towards skillnests.in.", email: "bachcha690@gmail.com" },
              { name: "Abhinav Pratap", photo: abhinavPhoto, bio: "Let's come together at skillnests.in and escape the matrix. Let's make education more interactive.", email: "abhinavpratap666@gmail.com" },
            ];
            
            const coreMembers = [
              { name: "Sanvi Kumar", photo: sanviPhoto, bio: "Finally it's time that we take a step towards skillnests.in.", email: "sanvi.kumarstm@gmail.com" },
              { name: "Miska Rai", photo: miskaPhoto, bio: "Finally it's time that we take a step towards skillnests.in.", email: "raimiska.8579@gmail.com" },
              { name: "Arav Raj", photo: aravPhoto, bio: "Building initiatives that create opportunities and positive impact for students and society join us in skillnest", email: "aravrajraj842@gmail.com" },
            ];

            const PersonCard = ({ f, role }: { f: any, role: string }) => (
              <div key={f.email} className="glass-strong rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-2 ring-rose-gold/30 shadow-lg">
                  <img src={f.photo} alt={f.name} className={`w-full h-full object-cover ${f.name === "Abhinav Pratap" ? "object-[center_25%]" : ""}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-2xl">{f.name}</h2>
                  <p className="text-xs font-mono uppercase tracking-widest text-rose-gold mt-1 mb-3">{role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.bio}</p>
                  <div className="mt-4 flex items-center justify-center sm:justify-start gap-2 text-sm text-rose-gold px-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <a href={`mailto:${f.email}`} className="hover:underline break-words">{f.email}</a>
                  </div>
                </div>
              </div>
            );

            return (
              <>
                <div className="flex flex-col gap-6 mb-16">
                  {founders.map((f) => <PersonCard key={f.email} f={f} role="Co-Founder" />)}
                </div>
                
                <div className="text-center mb-10">
                  <h1 className="font-serif text-3xl sm:text-4xl">Core Members</h1>
                  <p className="text-xs font-mono uppercase tracking-widest text-rose-gold mt-2">The Backbone</p>
                </div>
                
                <div className="flex flex-col gap-6 mb-10">
                  {coreMembers.map((f) => <PersonCard key={f.email} f={f} role="Core Member" />)}
                </div>
              </>
            );
          })()}

          <form onSubmit={send} className="glass rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <MessageCircle className="w-5 h-5 text-rose-gold" strokeWidth={1.2} />
              <h2 className="font-serif text-2xl">Direct message the team</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Sent as <span className="text-rose-gold">{user?.name}</span> ({user?.email})</p>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write what's on your mind…" className="w-full glass rounded-2xl px-4 py-3 text-sm bg-transparent outline-none resize-none focus-within:border-rose-gold/40" />
            <div className="mt-4 flex items-center justify-between gap-3">
              {sent ? <span className="text-xs text-rose-gold">Delivered ✓</span> : <span className="text-xs text-muted-foreground">Press send when ready.</span>}
              <button className="btn-phoenix rounded-full px-5 py-2.5 text-sm flex items-center gap-2 ml-auto"><Send className="w-4 h-4" /> Send message</button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              For any Queries, contact{" "}
              <a href="mailto:founders@skillnests.in" className="text-rose-gold hover:underline">founders@skillnests.in</a>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
