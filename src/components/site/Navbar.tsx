import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon, Shield, MessageSquare, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoAsset from "@/assets/skillnestslogo.jpeg";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";

const links: { label: string; to: string }[] = [
  { label: "PYQ", to: "/pyq" },
  { label: "Notes", to: "/notes" },
  { label: "Meetings", to: "/meetings" },
  { label: "Schedule", to: "/schedule" },
  { label: "Career", to: "/career-guidance" },
  { label: "Olympiads", to: "/olympiads" },
  { label: "MUN", to: "/mun" },
  { label: "Skill Share", to: "/skill-share" },
  { label: "The Team", to: "/founder" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    navigate({ to: "/auth", replace: true });
  }

  const fullName = user?.name ?? user?.email?.split("@")[0] ?? "";
  const initials = (fullName || "U").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-4"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className={`matte-glass rounded-2xl flex items-center justify-between px-4 sm:px-6 py-2.5 ${scrolled ? "shadow-2xl" : ""}`}>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="relative h-8 w-8 rounded-full overflow-hidden border border-rose-gold/30">
              <img src={logoAsset} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="font-serif text-xl sm:text-2xl italic tracking-tight">
              <span className="text-gradient-gold">skill</span>
              <span className="text-foreground/90">nests</span>
              <span className="text-rose-gold">.in</span>
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-5">
            {links.slice(0, 8).map((l) => (
              <Link
                key={l.to}
                to={l.to as any}
                activeProps={{ className: "text-rose-gold" }}
                className="text-sm text-muted-foreground hover:text-rose-gold transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 glass rounded-full pl-1.5 pr-3 py-1 hover:border-rose-gold/50 transition"
                  aria-label="Profile menu"
                >
                  <span className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-rose-gold/40 to-phoenix/40 grid place-items-center text-[10px] font-semibold text-foreground">
                    {initials}
                  </span>
                  <span className="text-sm max-w-[100px] truncate">{fullName}</span>
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 glass-strong rounded-2xl p-2 shadow-2xl z-50"
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <div className="text-sm font-medium truncate">{fullName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-rose-gold mt-1">{user.role}</div>
                      </div>
                      <MenuItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} onClick={() => setMenuOpen(false)}>Dashboard</MenuItem>
                      <MenuItem to="/chat" icon={<MessageSquare className="w-4 h-4" />} onClick={() => setMenuOpen(false)}>Chat</MenuItem>
                      <MenuItem to="/schedule" icon={<Calendar className="w-4 h-4" />} onClick={() => setMenuOpen(false)}>Schedule</MenuItem>
                      <MenuItem to="/founder" icon={<UserIcon className="w-4 h-4" />} onClick={() => setMenuOpen(false)}>Founder</MenuItem>
                      {isAdmin && (
                        <MenuItem to="/admin" icon={<Shield className="w-4 h-4 text-rose-gold" />} onClick={() => setMenuOpen(false)}>
                          <span className="text-rose-gold">Admin</span>
                        </MenuItem>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-white/5 text-muted-foreground hover:text-foreground transition"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/auth" className="btn-ghost-gold px-4 py-2 rounded-full text-sm font-medium">Log In</Link>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setOpen(!open)} className="text-foreground p-2" aria-label="Menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden glass-strong rounded-2xl mt-2 p-4 grid grid-cols-2 gap-3">
              {links.map((l) => (
                <Link key={l.to} to={l.to as any} onClick={() => setOpen(false)} className="text-foreground/90 py-1 text-sm">{l.label}</Link>
              ))}
              <Link to="/dashboard" onClick={() => setOpen(false)} className="text-foreground/90 py-1 text-sm col-span-2 border-t border-white/10 pt-3">Dashboard</Link>
              {user && (
                <button onClick={handleSignOut} className="text-left text-rose-gold py-1 text-sm col-span-2">Sign out</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function MenuItem({ to, icon, children, onClick }: { to: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link to={to as any} onClick={onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition">
      {icon}
      <span>{children}</span>
    </Link>
  );
}
