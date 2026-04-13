import { Link, useLocation } from "react-router-dom";
import { Home, RefreshCw, Clock, CreditCard, Settings, Shield, Users, Newspaper, List, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const userLinks = [
  { to: "/", label: "Início", icon: Home },
  { to: "/recargas", label: "Recargas", icon: RefreshCw },
  { to: "/historico", label: "Histórico", icon: Clock },
  { to: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const adminLinks = [
  { to: "/admin/operadoras", label: "Operadoras", icon: Shield },
  { to: "/admin/noticias", label: "Noticias", icon: Newspaper },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/recargas", label: "Recargas", icon: RefreshCw },
  { to: "/admin/logs", label: "Logs", icon: List },
];

export default function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside
      className="fixed top-0 h-screen flex flex-col border-r bg-card"
      style={{ left: "240px", width: "var(--sidebar-width)" }}
    >
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">CometaSMS</h1>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {userLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? "active" : ""}`}
          >
            <link.icon size={18} />
            {link.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-4">
              <span className="section-label">Admin</span>
            </div>
            {adminLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`sidebar-link ${location.pathname === link.to ? "active" : ""}`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-4">
        <div className="text-sm font-medium text-foreground">{user?.username}</div>
        <div className="text-sm text-muted-foreground">
          R$ <span className="font-bold text-foreground">{(user?.balance ?? 0).toFixed(2)}</span>
        </div>
        <button
          onClick={logout}
          className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
        >
          <LogOut size={12} />
          Sair
        </button>
      </div>
    </aside>
  );
}
