import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { operadorasApi, noticiasApi, type Operadora, type Noticia } from "@/lib/api";

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

  return (
    <div className="space-y-8">
      <div>
        <span className="section-label">Saldo Disponível</span>
        <div className="balance-display mt-1">R$ {(user?.balance ?? 0).toFixed(2)}</div>
      </div>

      <div>
        <span className="section-label">Recargas</span>
        <div className="flex gap-4 mt-3">
          {operadoras.map((op) => (
            <div
              key={op.id}
              className="operator-card min-w-[120px]"
              onClick={() => navigate(`/recargas?operadora=${op.id}`)}
            >
              <span className="font-semibold text-foreground">{op.name}</span>
              <span className="text-xs text-muted-foreground">4 planos</span>
            </div>
          ))}
        </div>
      </div>

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
