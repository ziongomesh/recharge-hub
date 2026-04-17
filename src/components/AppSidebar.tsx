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
      {/* Brand — minimal */}
      <div className="px-6 pt-7 pb-5">
        <Link to="/" className="font-display text-base tracking-tight">CometaSMS</Link>
        <div className="text-xs text-muted-foreground mt-0.5">Recargas via PIX</div>
      </div>

      <div className="rule mx-6" />

      {/* User block */}
      <div className="px-6 py-4">
        <div className="text-xs text-muted-foreground">Conta</div>
        <div className="font-medium text-sm mt-1 truncate">{user?.username || "—"}</div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Saldo</span>
          <span className="font-mono-x tabular text-sm font-medium">R$ {(user?.balance ?? 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="rule mx-6" />

      {/* Nav */}
      <nav className="flex-1 px-6 py-5 overflow-y-auto">
        <div className="text-xs text-muted-foreground mb-2">Menu</div>
        <ul className="space-y-0.5">
          {userLinks.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`block py-2 px-3 -mx-3 text-sm rounded transition-colors ${
                  pathname === l.to
                    ? "bg-foreground text-background font-medium"
                    : "text-ink-soft hover:bg-paper-2 hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <div className="text-xs text-muted-foreground mt-6 mb-2">Administração</div>
            <ul className="space-y-0.5">
              {adminLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={`block py-2 px-3 -mx-3 text-sm rounded transition-colors ${
                      pathname === l.to
                        ? "bg-foreground text-background font-medium"
                        : "text-ink-soft hover:bg-paper-2 hover:text-foreground"
                    }`}
                  >
                    {l.label}
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
        className="px-6 py-4 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Sair
      </button>
    </aside>
  );
}
