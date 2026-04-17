import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground grid md:grid-cols-2 noise">
      {/* Left — editorial */}
      <aside className="hidden md:flex flex-col justify-between p-10 border-r border-border bg-paper-2">
        <Link to="/" className="font-display text-3xl">Cometa<em className="italic">sms</em>.</Link>

        <div>
          <div className="label-eyebrow">Capítulo 01</div>
          <h2 className="font-display text-[clamp(3rem,5vw,5rem)] leading-[0.95] mt-3">
            Bem-vindo de <em className="italic">volta</em>.
          </h2>
          <p className="mt-6 text-ink-soft max-w-sm">
            Continue de onde parou. Seu saldo, suas recargas, seu histórico — tudo
            exatamente onde você deixou.
          </p>
        </div>

        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          <span>São Paulo · Brasil</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex flex-col justify-center px-6 md:px-16 py-12 max-w-xl mx-auto w-full">
        <div className="label-eyebrow">Acesso · 01/02</div>
        <h1 className="font-display text-5xl md:text-6xl leading-none mt-3">Entrar.</h1>
        <p className="text-ink-soft mt-3 text-sm">Use seu e-mail e senha cadastrados.</p>

        <form onSubmit={submit} className="mt-10 space-y-7">
          <div>
            <label className="label-eyebrow block mb-2">E-mail</label>
            <input className="field" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="voce@dominio.com" />
          </div>
          <div>
            <div className="flex items-end justify-between mb-2">
              <label className="label-eyebrow">Senha</label>
              <Link to="/login" className="text-[11px] underline underline-offset-2 text-muted-foreground hover:text-foreground">esqueci</Link>
            </div>
            <input className="field" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading}
            className="group inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm disabled:opacity-50">
            {loading ? "Autenticando…" : "Entrar"}
            <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </form>

        <div className="mt-12 pt-6 border-t border-border text-sm flex items-center justify-between">
          <span className="text-ink-soft">Ainda não tem conta?</span>
          <Link to="/register" className="underline underline-offset-4 hover:text-foreground/70">Criar uma →</Link>
        </div>
      </main>
    </div>
  );
}
