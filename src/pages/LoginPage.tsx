import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, Grid2X2, Headphones, Moon, Send } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/60 bg-card/95 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-muted-foreground">
          <div className="flex items-center gap-5">
            <Link to="/" className="hover:text-foreground">FAQ</Link>
            <Link to="/" className="hover:text-foreground">API</Link>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-1 sm:inline-flex"><Send size={12} className="text-primary" /> Telegram</span>
            <span className="hidden items-center gap-1 sm:inline-flex"><Headphones size={12} /> Suporte</span>
            <span>🇧🇷 Português (Brasil)</span>
            <span className="inline-flex items-center gap-1"><Moon size={12} /> Claro</span>
          </div>
        </div>
      </div>

      <header className="border-b border-border/60 bg-background/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="leading-none" aria-label="cometa sms">
            <div className="font-display text-2xl text-primary tracking-tight">cometa</div>
            <div className="font-mono-x text-[10px] text-primary tracking-[0.42em] -mt-0.5">sms</div>
          </Link>
          <nav className="hidden items-center gap-9 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/" className="hover:text-primary">Ativação</Link>
            <Link to="/" className="hover:text-primary">Aluguel</Link>
            <Link to="/" className="hover:text-primary">Lista de preços</Link>
            <Link to="/" className="hover:text-primary">Ajuda⌄</Link>
          </nav>
          <Link to="/" className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-primary transition-colors" aria-label="Início">
            <Grid2X2 size={16} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-4xl leading-none tracking-tight">Login</h1>
        <p className="mt-4 text-sm text-muted-foreground">Digite seu e-mail e senha para acessar o sistema.</p>

        <section className="mt-7 grid max-w-4xl gap-6 rounded-xl border border-border/60 bg-card p-6 shadow-xl shadow-primary/5 md:grid-cols-[1fr_1.25fr]">
          <form onSubmit={submit} className="space-y-5 md:border-r md:border-border/60 md:pr-6">
            <div className="grid grid-cols-4 gap-3">
              {['G', 'Я', '𝕏', 'GH'].map((item) => (
                <button key={item} type="button" className="h-9 rounded-xl border border-border bg-background text-sm font-semibold text-muted-foreground" aria-label="Login social indisponível">
                  {item}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Seu email</label>
              <input
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Sua senha</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary transition-colors"
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Eye size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
              Verificando...
            </div>

            <button type="submit" disabled={loading} className="btn-pill w-full justify-center disabled:opacity-50">
              {loading ? "Entrando…" : "Entrar"}
            </button>

            <p className="text-[11px] text-muted-foreground">
              Ao enviar dados, você concorda com a <Link to="/termos" className="font-semibold text-foreground hover:text-primary">política de privacidade</Link>.
            </p>
          </form>

          <div className="grid content-start gap-3">
            <Link to="/register" className="rounded-xl border border-border bg-background p-4 hover:border-primary/60 transition-colors">
              <div className="font-semibold">Cadastro</div>
              <div className="text-sm text-muted-foreground">crie uma conta no sistema</div>
            </Link>
            <Link to="/login" className="rounded-xl border border-border bg-background p-4 hover:border-primary/60 transition-colors">
              <div className="font-semibold">Redefinir senha</div>
              <div className="text-sm text-muted-foreground">redefina sua senha no sistema</div>
            </Link>
          </div>
        </section>

        <button onClick={() => window.location.assign('/')} className="btn-pill mt-7 w-full justify-center">
          <Grid2X2 size={16} /> Comprar número
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
          <div className="grid gap-3 text-muted-foreground"><Link to="/" className="hover:text-primary">Ativação</Link><Link to="/" className="hover:text-primary">Alugar número</Link><Link to="/" className="hover:text-primary">Lista de preços</Link><Link to="/" className="hover:text-primary">Serviços</Link></div>
          <div className="grid gap-3 text-muted-foreground"><Link to="/" className="hover:text-primary">Programa de referência</Link><Link to="/" className="hover:text-primary">Programa de fidelidade</Link><Link to="/" className="hover:text-primary">Regras do projeto</Link><Link to="/termos" className="hover:text-primary">Política e condições</Link></div>
          <div className="grid content-start gap-3 text-muted-foreground"><Link to="/" className="hover:text-primary">Feedback</Link><Link to="/login" className="hover:text-primary">Contatos</Link><Link to="/" className="hover:text-primary">API</Link><Link to="/" className="hover:text-primary">FAQ</Link></div>
        </div>
      </footer>
    </div>
  );
}
