import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { operadorasApi, noticiasApi, type Operadora, type Noticia } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, MessageSquare, CreditCard } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    operadorasApi.list().then((r) => setOperadoras(r.operadoras.filter((o) => o.enabled))).catch(() => {
      setOperadoras([
        { id: 1, name: "Claro", enabled: true },
        { id: 2, name: "TIM", enabled: true },
        { id: 3, name: "Vivo", enabled: true },
      ]);
    });
    noticiasApi.list().then((r) => setNoticias(r.noticias)).catch(() => {
      setNoticias([
        { id: 1, title: "Bem-vindo ao CometaSMS", content: "Plataforma de recargas online. Pague via PIX e recarregue qualquer operadora.", pinned: false, author: "admin", created_at: new Date().toISOString() },
      ]);
    });
  }, []);

  const modules = [
    {
      id: "recargas",
      title: "Recargas de Créditos",
      description: "Recarregue celular de qualquer operadora via PIX",
      icon: RefreshCw,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      iconBg: "bg-emerald-100",
      route: "/recargas",
    },
    {
      id: "sms",
      title: "SMS",
      description: "Envie e receba SMS com números virtuais",
      icon: MessageSquare,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      iconBg: "bg-blue-100",
      route: "/sms",
      soon: true,
    },
    {
      id: "esim",
      title: "eSIM",
      description: "Compre chips virtuais eSIM para qualquer operadora",
      icon: CreditCard,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      iconBg: "bg-purple-100",
      route: "/esim",
      soon: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Saldo */}
      <div>
        <span className="section-label">Saldo Disponível</span>
        <div className="balance-display mt-1">R$ {(user?.balance ?? 0).toFixed(2)}</div>
      </div>

      {/* Módulos */}
      <div>
        <span className="section-label">Módulos</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          {modules.map((mod) => (
            <Card
              key={mod.id}
              className={`border cursor-pointer transition-all hover:shadow-md ${mod.color} ${mod.soon ? "opacity-70" : ""}`}
              onClick={() => !mod.soon && navigate(mod.route)}
            >
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mod.iconBg}`}>
                  <mod.icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{mod.title}</h3>
                  <p className="text-xs mt-1 opacity-80">{mod.description}</p>
                </div>
                {mod.soon && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-full">
                    Em breve
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Operadoras rápidas */}
      <div>
        <span className="section-label">Recarga rápida</span>
        <div className="flex gap-4 mt-3">
          {operadoras.map((op) => (
            <div
              key={op.id}
              className="operator-card min-w-[120px]"
              onClick={() => navigate(`/recargas?operadora=${op.id}`)}
            >
              <span className="font-semibold text-foreground">{op.name}</span>
              <span className="text-xs text-muted-foreground">Recarregar</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avisos */}
      <div>
        <span className="section-label">Avisos</span>
        <div className="mt-3 space-y-3">
          {noticias.map((n) => (
            <div key={n.id} className="border-l-2 border-primary pl-4 py-2">
              <h3 className="font-semibold text-sm text-foreground">{n.title}</h3>
              <p className="text-sm text-muted-foreground">{n.content}</p>
              <span className="text-xs text-muted-foreground">
                {n.author} · {new Date(n.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
