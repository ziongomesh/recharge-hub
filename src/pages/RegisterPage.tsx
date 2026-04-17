import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background text-foreground grid md:grid-cols-2 noise">
      <aside className="hidden md:flex flex-col justify-between p-10 border-r border-border bg-paper-2">
        <Link to="/" className="font-display text-3xl">Cometa<em className="italic">sms</em>.</Link>
        <div>
          <div className="label-eyebrow">Capítulo 02</div>
          <h2 className="font-display text-[clamp(3rem,5vw,5rem)] leading-[0.95] mt-3">
            Abra sua <em className="italic">conta</em>.
          </h2>
          <p className="mt-6 text-ink-soft max-w-sm">
            Leva menos de 90 segundos. Pague o primeiro depósito via PIX e comece a recarregar imediatamente.
          </p>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Sem taxa de cadastro · Sem mensalidade
        </div>
      </aside>

      <main className="flex flex-col justify-center px-6 md:px-16 py-12 max-w-xl mx-auto w-full">
        <div className="label-eyebrow">Cadastro · 02/02</div>
        <h1 className="font-display text-5xl md:text-6xl leading-none mt-3">Nova conta.</h1>

        <form onSubmit={submit} className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6">
          <div className="col-span-2">
            <label className="label-eyebrow block mb-2">Usuário</label>
            <input className="field" required value={form.username} onChange={upd("username")} placeholder="seu_usuario" />
          </div>
          <div className="col-span-2">
            <label className="label-eyebrow block mb-2">E-mail</label>
            <input className="field" type="email" required value={form.email} onChange={upd("email")} placeholder="voce@dominio.com" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label-eyebrow block mb-2">Telefone</label>
            <input className="field font-mono" required value={form.phone} onChange={upd("phone")} placeholder="11 99999-9999" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label-eyebrow block mb-2">CPF</label>
            <input className="field font-mono" required value={form.cpf} onChange={upd("cpf")} placeholder="000.000.000-00" />
            <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
              Pedimos o CPF por conta das recargas — algumas operadoras exigem o documento do titular pra processar.
            </p>
          </div>
          <div className="col-span-2">
            <label className="label-eyebrow block mb-2">Senha</label>
            <input className="field" type="password" required value={form.password} onChange={upd("password")} placeholder="••••••••" />
          </div>

          <div className="col-span-2 mt-2 text-xs text-ink-soft">
            Ao criar a conta, você concorda com nossos{" "}
            <Link to="/termos" target="_blank" className="underline underline-offset-2 hover:text-foreground">
              Termos de Uso
            </Link>
            .
          </div>

          <div className="col-span-2 mt-1">
            <button type="submit" disabled={loading}
              className="group inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm disabled:opacity-50">
              {loading ? "Criando…" : "Criar conta"}
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </form>

        <div className="mt-12 pt-6 border-t border-border text-sm flex items-center justify-between">
          <span className="text-ink-soft">Já é cadastrado?</span>
          <Link to="/login" className="underline underline-offset-4 hover:text-foreground/70">Entrar →</Link>
        </div>
      </main>
    </div>
  );
}
