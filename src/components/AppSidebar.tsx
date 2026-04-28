import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const menuLinks = [
  { to: "/recargas",   label: "Recargas" },
  { to: "/sms",        label: "SMS", soon: true },
  { to: "/esim",       label: "eSIM" },
];

const perfilLinks = [
  { to: "/historico",      label: "Histórico" },
  { to: "/pagamentos",     label: "Pagamentos" },
  { to: "/configuracoes",  label: "Conta" },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const [open, setOpen] = useState(false);

  // Fecha drawer ao trocar de rota
  useEffect(() => { setOpen(false); }, [pathname]);

  // Bloqueia scroll do body quando drawer está aberto
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const linkClass = (to: string) =>
    `block py-2 px-3 -mx-3 text-sm rounded transition-colors ${
      pathname === to
        ? "bg-primary text-primary-foreground font-semibold"
        : "text-ink-soft hover:bg-secondary/60 hover:text-foreground"
    }`;

  const sidebarContent = (
    <>
      <div className="px-6 pt-7 pb-5">
        <Link to="/" className="block leading-none" aria-label="cometa sms">
          <div className="font-display text-2xl text-primary tracking-tight">cometa</div>
          <div className="font-mono-x text-[10px] text-primary tracking-[0.4em] -mt-0.5">sms</div>
        </Link>
        <div className="text-xs text-muted-foreground mt-2">Recargas via PIX</div>
      </div>

      <div className="rule mx-6" />

      <div className="px-6 py-4">
        <div className="text-xs text-muted-foreground">Conta</div>
        <div className="font-medium text-sm mt-1 truncate">{user?.username || "—"}</div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Saldo</span>
          <span className="font-mono-x tabular text-sm font-medium">R$ {(user?.balance ?? 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="rule mx-6" />

      <nav className="flex-1 px-6 py-5 overflow-y-auto">
        <div className="text-xs text-muted-foreground mb-2">Menu</div>
        <ul className="space-y-0.5">
          {menuLinks.map((l) => (
            <li key={l.to}>
              {l.soon ? (
                <span
                  className="flex items-center justify-between py-2 px-3 -mx-3 text-sm rounded text-muted-foreground/60 cursor-not-allowed"
                  title="Em breve"
                >
                  <span>{l.label}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">em breve</span>
                </span>
              ) : (
                <Link to={l.to} className={linkClass(l.to)}>{l.label}</Link>
              )}
            </li>
          ))}
        </ul>

        <div className="text-xs text-muted-foreground mt-6 mb-2">Perfil</div>
        <ul className="space-y-0.5">
          {perfilLinks.map((l) => (
            <li key={l.to}><Link to={l.to} className={linkClass(l.to)}>{l.label}</Link></li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <div className="rule my-4" />
            <Link
              to="/admin"
              className="block py-2 px-3 -mx-3 text-sm rounded-full text-ink-soft hover:bg-secondary/60 hover:text-foreground transition-colors"
            >
              → Painel administrativo
            </Link>
          </>
        )}
      </nav>

      <div className="rule mx-6" />
      <button
        onClick={logout}
        className="px-6 py-4 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Sair
      </button>
    </>
  );

  return (
    <>
      {/* Topbar mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-card/90 backdrop-blur border-b border-border/60 flex items-center justify-between px-4">
        <Link to="/" className="flex items-baseline gap-1.5 leading-none">
          <span className="font-display text-xl text-primary tracking-tight">cometa</span>
          <span className="font-mono-x text-[9px] text-primary tracking-[0.4em]">sms</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="p-2 -mr-2 rounded-lg hover:bg-secondary/60 transition"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Backdrop mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in"
        />
      )}

      {/* Sidebar (desktop fixed / mobile drawer) */}
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col bg-card border-r border-border/60 z-50 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: "var(--sidebar-width)", maxWidth: "85vw" }}
      >
        {/* Botão fechar mobile */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary/60 transition"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
