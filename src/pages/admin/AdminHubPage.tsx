import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Smartphone, MessageSquare, ArrowRight, Headphones, Users, ShieldCheck, ScrollText } from "lucide-react";

const modules = [
  {
    to: "/admin/recargas",
    title: "Recargas",
    desc: "Recargas de celular, depósitos, operadoras e métricas financeiras.",
    icon: Zap,
    items: ["Dashboard", "Depósitos", "Recargas", "Operadoras"],
    adminOnly: true,
  },
  {
    to: "/admin/esim",
    title: "eSIM",
    desc: "Catálogo, estoque de QR codes e produtos eSIM.",
    icon: Smartphone,
    items: ["Produtos", "Estoque QR", "Vendas"],
    adminOnly: true,
  },
  {
    to: "/admin/sms",
    title: "SMS",
    desc: "Serviços, países, ativações e configuração da Hero-SMS.",
    icon: MessageSquare,
    items: ["Serviços", "Países", "Ativações", "Config"],
    adminOnly: true,
  },
];

const common = [
  { to: "/admin/suporte", title: "Atendimento", icon: Headphones },
  { to: "/admin/usuarios", title: "Usuários", icon: Users },
  { to: "/admin/staff", title: "Equipe", icon: ShieldCheck, adminOnly: true },
  { to: "/admin/logs", title: "Logs", icon: ScrollText, adminOnly: true },
  { to: "/admin/noticias", title: "Notícias", icon: MessageSquare, adminOnly: true },
];

export default function AdminHubPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-10">
      <div>
        <div className="label-eyebrow">Painel admin</div>
        <h1 className="font-display text-4xl mt-1">Módulos.</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Cada módulo gerencia seu próprio fluxo, configurações e métricas. Escolha por onde começar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.filter((m) => !m.adminOnly || isAdmin).map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.to}
              to={m.to}
              className="group border border-border bg-paper p-6 flex flex-col gap-4 hover:border-foreground transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition" />
              </div>
              <div>
                <div className="font-display text-xl">{m.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </div>
              <div className="rule" />
              <ul className="text-xs text-muted-foreground space-y-1">
                {m.items.map((it) => (
                  <li key={it}>· {it}</li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="label-eyebrow mb-3">Comum a todos os módulos</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {common.filter((c) => !c.adminOnly || isAdmin).map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.to}
                to={c.to}
                className="border border-border bg-paper p-4 flex items-center gap-2 text-sm hover:border-foreground hover:bg-paper-2 transition"
              >
                <Icon size={14} />
                {c.title}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
