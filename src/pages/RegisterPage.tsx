import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

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
  const [form, setForm] = useState({ username: "", email: "", password: "", phone: "", cpf: "" });
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
    setLoading(true);
    try { await register({ ...form, cpf, phone }); }
    catch (err: any) { toast.error(err.message || "Erro ao registrar"); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors";
  const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-[2rem] overflow-hidden border border-border/60 shadow-xl">
        <aside className="hero-gradient hidden md:flex flex-col justify-between p-12">
          <Link to="/" className="font-display text-2xl tracking-tight">
            cometa<span className="text-primary">sms</span>
          </Link>
          <div>
            <h2 className="font-display text-5xl leading-[0.95] tracking-tight">
              Abra sua conta.
            </h2>
            <p className="mt-5 text-ink-soft max-w-sm">
              Leva menos de 90 segundos. Pague o primeiro depósito via PIX e comece a recarregar imediatamente.
            </p>
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Sem taxa de cadastro · Sem mensalidade
          </div>
        </aside>

        <main className="flex flex-col justify-center p-8 sm:p-12 bg-card">
          <h1 className="font-display text-4xl sm:text-5xl leading-none tracking-tight">Nova conta</h1>
          <p className="text-muted-foreground mt-3 text-sm">Preencha seus dados para começar.</p>

          <form onSubmit={submit} className="mt-8 grid grid-cols-2 gap-x-4 gap-y-5">
            <div className="col-span-2">
              <label className={labelCls}>Usuário</label>
              <input className={inputCls} required value={form.username} onChange={upd("username")} placeholder="seu_usuario" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>E-mail</label>
              <input className={inputCls} type="email" required value={form.email} onChange={upd("email")} placeholder="voce@dominio.com" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>Telefone</label>
              <input className={`${inputCls} font-mono`} required value={form.phone} onChange={upd("phone")} placeholder="11 99999-9999" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>CPF</label>
              <input className={`${inputCls} font-mono`} required value={form.cpf} onChange={upd("cpf")} placeholder="000.000.000-00" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Senha</label>
              <input className={inputCls} type="password" required value={form.password} onChange={upd("password")} placeholder="••••••••" />
            </div>

            <div className="col-span-2 text-xs text-muted-foreground">
              Ao criar a conta, você concorda com nossos{" "}
              <Link to="/termos" target="_blank" className="underline hover:text-primary">Termos de Uso</Link>.
            </div>

            <div className="col-span-2 mt-2">
              <button type="submit" disabled={loading} className="btn-pill w-full justify-center disabled:opacity-50">
                {loading ? "Criando…" : "Criar conta"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Já é cadastrado?</span>
            <Link to="/login" className="font-semibold text-primary hover:underline">Entrar →</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
