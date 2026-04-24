import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Zap, MessageSquare, Smartphone, History, Wallet, UserRound, LogOut, ShieldCheck, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const primaryLinks = [
  { to: "/recargas", label: "Recargas", icon: Zap },
  { to: "/sms",      label: "SMS",      icon: MessageSquare },
  { to: "/esim",     label: "eSIM",     icon: Smartphone },
];

const secondaryLinks = [
  { to: "/historico",     label: "Histórico",  icon: History },
  { to: "/pagamentos",    label: "Carteira",   icon: Wallet },
  { to: "/configuracoes", label: "Conta",      icon: UserRound },
];

export default function AppTopNav() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "mod";
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const balance = (user?.balance ?? 0).toFixed(2);

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 h-16 flex items-center gap-3">
          {/* Logo */}
          <Link to="/recargas" className="flex items-baseline gap-1.5 leading-none mr-2">
            <span className="font-display text-2xl gradient-text tracking-tight">cometa</span>
            <span className="font-mono-x text-[9px] text-primary tracking-[0.4em]">sms</span>
          </Link>

          {/* Primary nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {primaryLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={({isActive}) => `topnav-link ${isActive ? "active" : ""}`}>
                <l.icon size={15} /> {l.label}
              </NavLink>
            ))}
            <span className="mx-2 h-5 w-px bg-border/70" />
            {secondaryLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={({isActive}) => `topnav-link ${isActive ? "active" : ""}`}>
                <l.icon size={15} /> {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/pagamentos"
              className="hidden sm:flex items-center gap-2 rounded-full pl-3 pr-1 py-1 bg-card/80 border border-border hover:border-primary/50 transition-colors"
              title="Saldo · clique para depositar"
            >
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Saldo</span>
              <span className="font-mono-x tabular text-sm font-semibold">R$ {balance}</span>
              <span className="ml-1 inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <Plus size={14} />
              </span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:border-primary/50 hover:text-foreground text-muted-foreground transition"
              >
                <ShieldCheck size={13} /> Admin
              </Link>
            )}

            <button
              onClick={logout}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-destructive transition"
              title="Sair"
            >
              <LogOut size={13} /> Sair
            </button>

            <button
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-card/60"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[88vw] max-w-sm glass-card !rounded-none !rounded-l-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-2xl gradient-text">cometa</span>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-card/60"><X size={20} /></button>
            </div>

            <Link to="/pagamentos" onClick={() => setOpen(false)} className="block mb-5 rounded-2xl p-4 bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 border border-primary/30">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Seu saldo</div>
              <div className="font-display text-3xl mt-1 tabular gradient-text">R$ {balance}</div>
              <div className="text-xs mt-2 text-muted-foreground">Toque para depositar →</div>
            </Link>

            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Serviços</div>
            <nav className="flex flex-col gap-1 mb-4">
              {primaryLinks.map((l) => (
                <NavLink key={l.to} to={l.to} className={({isActive}) => `topnav-link justify-start ${isActive ? "active" : ""}`}>
                  <l.icon size={16} /> {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Perfil</div>
            <nav className="flex flex-col gap-1">
              {secondaryLinks.map((l) => (
                <NavLink key={l.to} to={l.to} className={({isActive}) => `topnav-link justify-start ${isActive ? "active" : ""}`}>
                  <l.icon size={16} /> {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-border/60 flex items-center justify-between">
              {isAdmin && (
                <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Admin
                </Link>
              )}
              <button onClick={logout} className="ml-auto text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1.5">
                <LogOut size={13} /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
