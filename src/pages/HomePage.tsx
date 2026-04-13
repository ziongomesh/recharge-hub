import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { operadorasApi, noticiasApi, type Operadora, type Noticia } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, MessageSquare, CreditCard } from "lucide-react";
import cometaImg from "@/assets/cometa.png";

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
      route: "/recargas",
      active: true,
    },
    {
      id: "sms",
      title: "SMS",
      description: "Envie e receba SMS com números virtuais",
      icon: MessageSquare,
      route: "/sms",
      active: false,
    },
    {
      id: "esim",
      title: "eSIM",
      description: "Compre chips virtuais eSIM para qualquer operadora",
      icon: CreditCard,
      route: "/esim",
      active: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden star-field" style={{ background: "linear-gradient(135deg, hsl(270 40% 12%), hsl(260 30% 8%))" }}>
        <div className="relative flex items-center justify-between p-8">
          <div className="space-y-3 z-10">
            <p className="text-sm text-muted-foreground">Bem-vindo de volta,</p>
            <h1 className="text-2xl font-bold text-foreground">{user?.username}</h1>
            <div className="mt-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Saldo disponível</span>
              <div className="text-4xl font-bold tracking-tight mt-1" style={{ color: "hsl(var(--primary))" }}>
                R$ {(user?.balance ?? 0).toFixed(2)}
              </div>
            </div>
          </div>
          <img
            src={cometaImg}
            alt="Cometa"
            className="w-32 h-32 animate-float opacity-90 drop-shadow-2xl"
            style={{ filter: "drop-shadow(0 0 20px hsl(270 80% 65% / 0.5))" }}
          />
        </div>
      </div>

      {/* Módulos */}
      <div>
        <span className="section-label">Módulos</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          {modules.map((mod) => (
            <Card
              key={mod.id}
              className={`glow-card border-border/50 cursor-pointer transition-all hover:scale-[1.02] ${
                mod.active ? "animate-pulse-glow" : "opacity-60 hover:opacity-80"
              }`}
              onClick={() => mod.active && navigate(mod.route)}
              style={{ background: "hsl(var(--card))" }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.15)" }}
                >
                  <mod.icon size={26} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{mod.title}</h3>
                  <p className="text-xs mt-1.5 text-muted-foreground leading-relaxed">{mod.description}</p>
                </div>
                {!mod.active && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      background: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                      border: "1px solid hsl(var(--primary) / 0.2)",
                    }}
                  >
                    Em breve
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recarga rápida */}
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
      {noticias.length > 0 && (
        <div>
          <span className="section-label">Avisos</span>
          <div className="mt-3 space-y-3">
            {noticias.map((n) => (
              <div
                key={n.id}
                className="pl-4 py-3 rounded-r-lg"
                style={{
                  borderLeft: "2px solid hsl(var(--primary))",
                  background: "hsl(var(--primary) / 0.05)",
                }}
              >
                <h3 className="font-semibold text-sm text-foreground">{n.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{n.content}</p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {n.author} - {new Date(n.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
