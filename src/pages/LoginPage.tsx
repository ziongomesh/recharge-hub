import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Smartphone, Mail, Lock, Search, Star } from "lucide-react";
import { operadorasApi, planosApi, type Operadora } from "@/lib/api";

function SmsSidebarInline() {
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<{ operadora: Operadora; minCost: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { operadoras } = await operadorasApi.list();
        const enabled = operadoras.filter((o) => o.enabled);
        const items = [];
        for (const op of enabled) {
          try {
            const { planos } = await planosApi.listByOperadora(op.id);
            const minCost = planos.length > 0 ? Math.min(...planos.map((p) => p.cost)) : 0;
            items.push({ operadora: op, minCost });
          } catch {
            items.push({ operadora: op, minCost: 0 });
          }
        }
        setServices(items);
      } catch {
        setServices([
          { operadora: { id: 1, name: "Claro", enabled: true }, minCost: 0.50 },
          { operadora: { id: 2, name: "TIM", enabled: true }, minCost: 0.50 },
          { operadora: { id: 3, name: "Vivo", enabled: true }, minCost: 0.50 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = services.filter((s) =>
    s.operadora.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="bg-primary px-4 py-3">
        <h2 className="text-sm font-semibold text-primary-foreground">Lista de serviços</h2>
      </div>
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Nenhum serviço</div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.operadora.id}
              className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{s.operadora.name}</span>
                <Star size={12} className="text-muted-foreground" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                R$ {s.minCost.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full bg-card border-b border-border px-6 py-3 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">CometaSMS</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/register" className="text-muted-foreground hover:text-foreground transition-colors">
            Registrar
          </Link>
          <Link to="/login" className="text-foreground font-medium">
            Login
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* SMS Sidebar */}
        <div className="w-[240px] flex-shrink-0 border-r border-border bg-card flex flex-col">
          <SmsSidebarInline />
        </div>

        {/* Main */}
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border-border">
            <div className="bg-accent rounded-t-lg px-6 py-5">
              <h1 className="text-lg font-semibold text-accent-foreground">
                Bem vindo ao CometaSMS!
              </h1>
              <p className="text-sm text-accent-foreground/70 mt-1">
                Faça o login para continuar.
              </p>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="Insira seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Login"}
                </Button>
              </form>

              <div className="mt-5 text-center space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Esqueceu sua senha? <Link to="/login" className="text-primary hover:underline">Recupere</Link>
                </p>
                <p className="text-muted-foreground">
                  Não possui cadastro? <Link to="/register" className="text-primary hover:underline">Cadastre-se</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        © 2026 CometaSMS — Todos os direitos reservados.
      </footer>
    </div>
  );
}
