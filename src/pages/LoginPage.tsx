import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Smartphone, Mail, Lock } from "lucide-react";

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
      <header className="w-full bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">CometaSMS</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/register" className="text-muted-foreground hover:text-primary transition-colors">
            Registrar
          </Link>
          <Link to="/login" className="text-primary font-medium">
            Login
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-border">
          {/* Banner */}
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
                  <Input
                    id="email"
                    type="email"
                    placeholder="Insira seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Login"}
              </Button>
            </form>

            <div className="mt-5 text-center space-y-1 text-sm">
              <p className="text-muted-foreground">
                Esqueceu sua senha?{" "}
                <Link to="/login" className="text-primary hover:underline">Recupere</Link>
              </p>
              <p className="text-muted-foreground">
                Não possui cadastro?{" "}
                <Link to="/register" className="text-primary hover:underline">Cadastre-se</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        © 2026 CometaSMS — Todos os direitos reservados.
      </footer>
    </div>
  );
}