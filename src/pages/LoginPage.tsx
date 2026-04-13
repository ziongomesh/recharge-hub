import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import cometaImg from "@/assets/cometa.png";

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
    <div className="min-h-screen flex flex-col star-field" style={{ background: "linear-gradient(135deg, hsl(260 20% 6%), hsl(270 25% 10%), hsl(260 20% 6%))" }}>
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-40 relative border-b border-border/30">
        <div className="flex items-center gap-2">
          <img src={cometaImg} alt="CometaSMS" className="w-8 h-8" />
          <span className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>CometaSMS</span>
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

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/30 glow-card" style={{ background: "hsl(var(--card))" }}>
          <div
            className="rounded-t-lg px-6 py-6 text-center"
            style={{ background: "linear-gradient(135deg, hsl(270 40% 15%), hsl(260 30% 12%))" }}
          >
            <img src={cometaImg} alt="Cometa" className="w-16 h-16 mx-auto mb-3 animate-float" style={{ filter: "drop-shadow(0 0 15px hsl(270 80% 65% / 0.5))" }} />
            <h1 className="text-lg font-bold text-foreground">
              Bem vindo ao CometaSMS
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
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
                Esqueceu sua senha? <Link to="/login" className="hover:underline" style={{ color: "hsl(var(--primary))" }}>Recupere</Link>
              </p>
              <p className="text-muted-foreground">
                Não possui cadastro? <Link to="/register" className="hover:underline" style={{ color: "hsl(var(--primary))" }}>Cadastre-se</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border/30">
        CometaSMS © 2026 — Todos os direitos reservados.
      </footer>
    </div>
  );
}
