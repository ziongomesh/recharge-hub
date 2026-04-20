import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Smartphone, MessageSquare, ArrowRight, Headphones, Users, ShieldCheck, ScrollText, AlertTriangle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { statusApi, settingsApi } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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

const moduleKeys = ["recargas", "sms", "esim"] as const;
type ModuleKey = (typeof moduleKeys)[number];

export default function AdminHubPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [maint, setMaint] = useState<Record<ModuleKey, boolean>>({
    recargas: false,
    sms: false,
    esim: false,
  });
  const [busy, setBusy] = useState<ModuleKey | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    statusApi.adminList()
      .then((r) => {
        const next = { recargas: false, sms: false, esim: false };
        r.modules.forEach((m) => {
          if (moduleKeys.includes(m.module as ModuleKey)) next[m.module as ModuleKey] = m.maintenance;
        });
        setMaint(next);
      })
      .catch(() => {});
  }, [isAdmin]);

  const toggle = async (mod: ModuleKey, value: boolean) => {
    setBusy(mod);
    try {
      await statusApi.adminToggle(mod, value);
      setMaint((p) => ({ ...p, [mod]: value }));
      toast.success(`${mod} ${value ? "em manutenção" : "ativado"}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao atualizar");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <div className="label-eyebrow">Painel admin</div>
        <h1 className="font-display text-4xl mt-1">Módulos.</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Cada módulo gerencia seu próprio fluxo, configurações e métricas. Escolha por onde começar.
        </p>
      </div>

      {isAdmin && (
        <div className="border-2 border-foreground bg-paper-2 p-6">
          <div className="flex items-center gap-2 label-eyebrow mb-4">
            <AlertTriangle size={12} />
            Manutenção dos módulos
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Quando ligado, o módulo aparece OFFLINE pros usuários e bloqueia novas operações.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moduleKeys.map((mod) => (
              <div
                key={mod}
                className={`border p-4 flex items-center justify-between ${
                  maint[mod] ? "border-destructive bg-destructive/5" : "border-border bg-paper"
                }`}
              >
                <div>
                  <div className="font-display text-lg capitalize">{mod}</div>
                  <div className={`text-xs mt-0.5 ${maint[mod] ? "text-destructive" : "text-muted-foreground"}`}>
                    {maint[mod] ? "EM MANUTENÇÃO" : "ativo"}
                  </div>
                </div>
                <Switch
                  checked={maint[mod]}
                  disabled={busy === mod}
                  onCheckedChange={(v) => toggle(mod, v)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
