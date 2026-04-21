import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await login(email, password); }
    catch (err: any) { toast.error(err.message || "Erro ao fazer login"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-[2rem] overflow-hidden border border-border/60 shadow-xl">
        {/* Left — hero gradient */}
        <aside className="hero-gradient hidden md:flex flex-col justify-between p-12 relative">
          <Link to="/" className="font-display text-2xl tracking-tight">
            cometa<span className="text-primary">sms</span>
          </Link>

          <div>
            <h2 className="font-display text-5xl leading-[0.95] tracking-tight">
              Bem-vindo de volta.
            </h2>
            <p className="mt-5 text-ink-soft max-w-sm">
              Continue de onde parou. Saldo, recargas e histórico exatamente onde você deixou.
            </p>
          </div>

          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            São Paulo · Brasil
          </div>
        </aside>

        {/* Right — form */}
        <main className="flex flex-col justify-center p-8 sm:p-12 bg-card">
          <h1 className="font-display text-4xl sm:text-5xl leading-none tracking-tight">Entrar</h1>
          <p className="text-muted-foreground mt-3 text-sm">Use seu e-mail e senha cadastrados.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">E-mail</label>
              <input
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="voce@dominio.com"
              />
            </div>
            <div>
              <div className="flex items-end justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Senha</label>
                <Link to="/login" className="text-[11px] text-muted-foreground hover:text-primary">esqueci</Link>
              </div>
              <input
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-pill w-full justify-center disabled:opacity-50">
              {loading ? "Autenticando…" : "Entrar"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Ainda não tem conta?</span>
            <Link to="/register" className="font-semibold text-primary hover:underline">Criar uma →</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
