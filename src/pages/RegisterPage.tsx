import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import PublicHeader from "@/components/PublicHeader";

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", phone: "", cpf: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const upd = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (f === "cpf") v = formatCPF(v);
    if (f === "phone") v = formatPhone(v);
    setForm((s) => ({ ...s, [f]: v }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpf = form.cpf.replace(/\D/g, "");
    const phone = form.phone.replace(/\D/g, "");
    if (cpf.length !== 11) return toast.error("CPF deve ter 11 dígitos");
    if (phone.length < 10) return toast.error("Telefone inválido");
    if (form.password !== confirmPassword) return toast.error("As senhas não conferem");
    setLoading(true);
    try { await register({ ...form, cpf, phone }); }
    catch (err: any) { toast.error(err.message || "Erro ao registrar"); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full rounded-xl border border-border/60 bg-background/35 px-4 py-2.5 text-sm backdrop-blur focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/35 to-background text-foreground">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-4xl leading-none tracking-tight">Cadastro</h1>
        <p className="mt-4 text-sm text-muted-foreground">Digite seu e-mail e senha para se registrar.</p>

        <section className="mt-7 grid max-w-4xl gap-6 rounded-3xl border border-primary/15 bg-gradient-to-br from-card via-card to-secondary/60 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl md:grid-cols-[1fr_1.25fr]">
          <form onSubmit={submit} className="space-y-4 md:border-r md:border-border/60 md:pr-6">
            <SocialAuthButtons labelPrefix="Cadastro" />

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Seu email</label>
              <input className={inputCls} type="email" required value={form.email} onChange={upd("email")} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Seu nome de usuário</label>
              <input className={inputCls} required value={form.username} onChange={upd("username")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Telefone</label>
                <input className={`${inputCls} font-mono`} required value={form.phone} onChange={upd("phone")} placeholder="11 99999-9999" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">CPF</label>
                <input className={`${inputCls} font-mono`} required value={form.cpf} onChange={upd("cpf")} placeholder="000.000.000-00" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Sua senha</label>
              <div className="relative">
                <input className={`${inputCls} pr-10`} type="password" required value={form.password} onChange={upd("password")} />
                <Eye size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Confirmar senha</label>
              <div className="relative">
                <input className={`${inputCls} pr-10`} type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <Eye size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>


            <button type="submit" disabled={loading} className="btn-pill w-full justify-center disabled:opacity-50">
              {loading ? "Registrando…" : "Registrar"}
            </button>

            <p className="text-[11px] text-muted-foreground">
              Ao enviar dados, você concorda com a <Link to="/termos" className="font-semibold text-foreground hover:text-primary">política de privacidade</Link>.
            </p>
          </form>

          <div className="grid content-start gap-3">
            <Link to="/login" className="rounded-2xl border border-primary/15 bg-background/50 p-4 shadow-sm shadow-primary/5 backdrop-blur hover:border-primary/50 hover:text-primary transition-colors">
              <div className="font-semibold">Login</div>
              <div className="text-sm text-muted-foreground">acessar o sistema</div>
            </Link>
            <Link to="/login" className="rounded-2xl border border-primary/15 bg-background/50 p-4 shadow-sm shadow-primary/5 backdrop-blur hover:border-primary/50 hover:text-primary transition-colors">
              <div className="font-semibold">Redefinir senha</div>
              <div className="text-sm text-muted-foreground">redefinir sua senha</div>
            </Link>
          </div>
        </section>

        <button onClick={() => navigate("/")} className="btn-pill mt-7 w-full justify-center">
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
