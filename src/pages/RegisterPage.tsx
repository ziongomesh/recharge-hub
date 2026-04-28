import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import PublicHeader from "@/components/PublicHeader";

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 7)}-${d.slice(7)}`;
}

function getPasswordStrength(pwd: string): { score: 0 | 1 | 2 | 3; label: string; color: string; barColor: string } {
  if (!pwd) return { score: 0, label: "", color: "", barColor: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score: 1, label: "Senha fraca", color: "text-red-500", barColor: "bg-red-500" };
  if (score <= 3) return { score: 2, label: "Senha média", color: "text-amber-500", barColor: "bg-amber-500" };
  return { score: 3, label: "Senha forte", color: "text-emerald-500", barColor: "bg-emerald-500" };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", phone: "", cpf: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (!isValidCPF(cpf)) return toast.error("CPF inválido. Verifique os dígitos.");
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
                <p className="mt-1.5 text-[11px] text-amber-500/90">⚠ Use seu CPF real — será validado ao gerar PIX.</p>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Sua senha</label>
              <div className="relative">
                <input className={`${inputCls} pr-10`} type={showPassword ? "text" : "password"} required value={form.password} onChange={upd("password")} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (() => {
                const s = getPasswordStrength(form.password);
                return (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= s.score ? s.barColor : "bg-border/60"}`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-medium ${s.color}`}>{s.label}</p>
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Confirmar senha</label>
              <div className="relative">
                <input className={`${inputCls} pr-10`} type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
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
