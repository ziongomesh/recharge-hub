import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminTopBar from "./AdminTopBar";
import { LayoutDashboard, Users, ArrowDownToLine, Zap, Newspaper, Building2, ScrollText, LogOut, ArrowLeftRight, Headphones, ShieldCheck, Smartphone, MessageSquare, Boxes } from "lucide-react";

type LinkDef = { to: string; label: string; icon: any; end?: boolean; adminOnly?: boolean };

const sections: { title: string; adminOnly?: boolean; links: LinkDef[] }[] = [
  {
    title: "Geral",
    links: [
      { to: "/admin",         label: "Módulos",     icon: Boxes, end: true },
      { to: "/admin/suporte", label: "Atendimento", icon: Headphones },
      { to: "/admin/usuarios", label: "Usuários",   icon: Users },
      { to: "/admin/staff",   label: "Equipe",      icon: ShieldCheck, adminOnly: true },
      { to: "/admin/logs",    label: "Logs",        icon: ScrollText, adminOnly: true },
      { to: "/admin/noticias", label: "Notícias",   icon: Newspaper, adminOnly: true },
    ],
  },
  {
    title: "Recargas",
    adminOnly: true,
    links: [
      { to: "/admin/recargas",   label: "Dashboard",  icon: LayoutDashboard, end: true },
      { to: "/admin/depositos",  label: "Depósitos",  icon: ArrowDownToLine },
      { to: "/admin/recargas/lista", label: "Recargas", icon: Zap },
      { to: "/admin/operadoras", label: "Operadoras", icon: Building2 },
    ],
  },
  {
    title: "eSIM",
    adminOnly: true,
    links: [
      { to: "/admin/esim", label: "Gerenciar eSIM", icon: Smartphone, end: true },
    ],
  },
  {
    title: "SMS",
    adminOnly: true,
    links: [
      { to: "/admin/sms", label: "Gerenciar SMS", icon: MessageSquare, end: true },
    ],
  },
];

export default function AdminLayout() {
  const { user, loading, adminVerified, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-display text-2xl animate-pulse">carregando…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin" && user.role !== "mod") return <Navigate to="/recargas" replace />;
  if (!adminVerified) return <Navigate to="/admin/pin" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 shrink-0 bg-paper border-r border-border flex flex-col fixed left-0 top-0 h-screen">
        <div className="px-6 pt-6 pb-4">
          <div className="label-eyebrow text-foreground">{user.role === "admin" ? "Admin" : "Moderador"}</div>
          <Link to="/admin" className="font-display text-lg block">CometaSMS</Link>
          <div className="text-xs text-muted-foreground mt-0.5">{user.role === "admin" ? "Painel de controle" : "Atendimento"}</div>
        </div>
        <div className="rule mx-6" />
        <div className="px-6 py-3">
          <div className="text-xs text-muted-foreground">Logado como</div>
          <div className="text-sm font-medium truncate">{user.username}</div>
        </div>
        <div className="rule mx-6" />

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {sections.filter((s) => !s.adminOnly || user.role === "admin").map((section) => {
            const visible = section.links.filter((l) => !l.adminOnly || user.role === "admin");
            if (visible.length === 0) return null;
            return (
              <div key={section.title}>
                <div className="px-3 mb-1.5 text-[10px] font-mono-x uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </div>
                <ul className="space-y-0.5">
                  {visible.map((l) => {
                    const Icon = l.icon;
                    return (
                      <li key={l.to}>
                        <NavLink
                          to={l.to}
                          end={l.end}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${
                              isActive ? "bg-foreground text-background font-medium" : "text-ink-soft hover:bg-paper-2 hover:text-foreground"
                            }`
                          }
                        >
                          <Icon size={15} />
                          {l.label}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div className="rule my-4" />

          <Link
            to="/recargas"
            className="flex items-center gap-3 px-3 py-2 text-sm rounded text-ink-soft hover:bg-paper-2 hover:text-foreground transition-colors"
          >
            <ArrowLeftRight size={15} />
            Ir para área de cliente
          </Link>
        </nav>

        <div className="rule mx-6" />
        <button
          onClick={logout}
          className="px-6 py-4 text-left text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2"
        >
          <LogOut size={14} /> Sair
        </button>
      </aside>

      <main className="flex-1 ml-64">
        <AdminTopBar />
        <div className="px-10 py-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
