import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const userLinks = [
  { to: "/recargas",       label: "Recargas",       num: "01" },
  { to: "/historico",      label: "Histórico",      num: "02" },
  { to: "/pagamentos",     label: "Pagamentos",     num: "03" },
  { to: "/configuracoes",  label: "Conta",          num: "04" },
];

const adminLinks = [
  { to: "/admin/operadoras", label: "Operadoras", num: "A1" },
  { to: "/admin/noticias",   label: "Notícias",   num: "A2" },
  { to: "/admin/usuarios",   label: "Usuários",   num: "A3" },
  { to: "/admin/recargas",   label: "Recargas",   num: "A4" },
  { to: "/admin/logs",       label: "Logs",       num: "A5" },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col bg-paper border-r border-border"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Brand */}
      <Link to="/" className="px-6 pt-7 pb-6 block">
        <div className="font-display text-3xl leading-none">Cometa<span className="italic text-foreground/70">sms</span></div>
        <div className="label-eyebrow mt-2">Est. 2026 — Recargas</div>
      </Link>

      <div className="rule mx-6" />

      {/* User block */}
      <div className="px-6 py-4">
        <div className="label-eyebrow">Conectado</div>
        <div className="font-display text-xl leading-tight mt-1 truncate">{user?.username || "—"}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="label-eyebrow">Saldo</span>
          <span className="font-mono-x tabular text-sm">R$ {(user?.balance ?? 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="rule mx-6" />

      {/* Nav */}
      <nav className="flex-1 px-6 py-5 overflow-y-auto">
        <div className="label-eyebrow mb-3">Índice</div>
        <ul className="border-l border-border">
          {userLinks.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className={`nav-link ${pathname === l.to ? "active" : ""}`}>
                <span>{l.label}</span>
                <span className="num">{l.num}</span>
              </Link>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <div className="label-eyebrow mt-7 mb-3 flex items-center gap-2">
              <span>Administração</span>
              <span className="flex-1 border-t border-border" />
            </div>
            <ul className="border-l border-border">
              {adminLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={`nav-link ${pathname === l.to ? "active" : ""}`}>
                    <span>{l.label}</span>
                    <span className="num">{l.num}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="rule mx-6" />
      <button
        onClick={logout}
        className="px-6 py-4 text-left text-[12px] font-mono-x uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        ↳ Encerrar sessão
      </button>
    </aside>
  );
}
