import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import PublicHeader from "@/components/PublicHeader";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error("[login] falhou:", err);
      setErrorMsg(err?.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/35 to-background text-foreground">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-4xl leading-none tracking-tight">Login</h1>
        <p className="mt-4 text-sm text-muted-foreground">Digite seu e-mail e senha para acessar o sistema.</p>

        <section className="mt-7 grid max-w-4xl gap-6 rounded-3xl border border-primary/15 bg-gradient-to-br from-card via-card to-secondary/60 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl md:grid-cols-[1fr_1.25fr]">
          <form onSubmit={submit} className="space-y-5 md:border-r md:border-border/60 md:pr-6">
            <SocialAuthButtons labelPrefix="Login" />

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Seu email</label>
              <input
                className="w-full rounded-xl border border-border/60 bg-background/35 px-4 py-2.5 text-sm backdrop-blur focus:outline-none focus:border-primary transition-colors"
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Sua senha</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-border/60 bg-background/35 px-4 py-2.5 pr-10 text-sm backdrop-blur focus:outline-none focus:border-primary transition-colors"
                  type={showPassword ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>


            {errorMsg && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-pill w-full justify-center disabled:opacity-50">
              {loading ? "Entrando…" : "Entrar"}
            </button>

            <p className="text-[11px] text-muted-foreground">
              Ao enviar dados, você concorda com a <Link to="/termos" className="font-semibold text-foreground hover:text-primary">política de privacidade</Link>.
            </p>
          </form>

          <div className="grid content-start gap-3">
            <Link to="/register" className="rounded-2xl border border-primary/15 bg-background/50 p-4 shadow-sm shadow-primary/5 backdrop-blur hover:border-primary/50 hover:text-primary transition-colors">
              <div className="font-semibold">Cadastro</div>
              <div className="text-sm text-muted-foreground">crie uma conta no sistema</div>
            </Link>
            <Link to="/login" className="rounded-2xl border border-primary/15 bg-background/50 p-4 shadow-sm shadow-primary/5 backdrop-blur hover:border-primary/50 hover:text-primary transition-colors">
              <div className="font-semibold">Redefinir senha</div>
              <div className="text-sm text-muted-foreground">redefina sua senha no sistema</div>
            </Link>
          </div>
        </section>

        <button onClick={() => navigate("/")} className="btn-pill mt-7 w-full justify-center">
          Comprar número
        </button>
      </main>

      <footer className="mt-14 border-t border-border/60 bg-card/40 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 text-sm md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="text-muted-foreground">
            <Link to="/" className="block leading-none" aria-label="cometa sms">
              <div className="font-display text-3xl text-primary tracking-tight">cometa</div>
              <div className="font-mono-x text-[11px] text-primary tracking-[0.45em] -mt-0.5">sms</div>
            </Link>
            <p className="mt-5 max-w-sm leading-relaxed">© {new Date().getFullYear()} CometaSMS.<br />Números virtuais e recargas com fluxo rápido e seguro.</p>
          </div>
          <div className="grid gap-3 text-muted-foreground"><Link to="/" className="hover:text-primary">Ativação</Link><Link to="/" className="hover:text-primary">Lista de preços</Link><Link to="/" className="hover:text-primary">Serviços</Link></div>
          <div className="grid gap-3 text-muted-foreground"><Link to="/" className="hover:text-primary">Programa de referência</Link><Link to="/" className="hover:text-primary">Programa de fidelidade</Link><Link to="/" className="hover:text-primary">Regras do projeto</Link><Link to="/termos" className="hover:text-primary">Política e condições</Link></div>
          <div className="grid content-start gap-3 text-muted-foreground"><Link to="/" className="hover:text-primary">Feedback</Link><Link to="/login" className="hover:text-primary">Contatos</Link><Link to="/" className="hover:text-primary">API</Link><Link to="/" className="hover:text-primary">FAQ</Link></div>
        </div>
      </footer>
    </div>
  );
}
