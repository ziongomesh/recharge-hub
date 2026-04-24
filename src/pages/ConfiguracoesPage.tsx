import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Mail, Phone, IdCard, Calendar, User as UserIcon, Wallet, ArrowUpRight, LogOut } from "lucide-react";

const fmtCPF = (c: string) => {
  const d = c.replace(/\D/g, ""); if (d.length !== 11) return c;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};
const fmtPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return p;
};

export default function ConfiguracoesPage() {
  const { user, logout } = useAuth();
  const initial = (user?.username || "?")[0]?.toUpperCase();

  const rows: { icon: any; label: string; value: string }[] = [
    { icon: UserIcon, label: "Usuário", value: user?.username ?? "—" },
    { icon: Mail, label: "E-mail", value: user?.email ?? "—" },
    { icon: Phone, label: "Telefone", value: user?.phone ? fmtPhone(user.phone) : "—" },
    { icon: IdCard, label: "CPF", value: user?.cpf ? fmtCPF(user.cpf) : "—" },
    { icon: Calendar, label: "Membro desde", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—" },
  ];

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      {/* Profile card */}
      <aside className="glass-card p-7 text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-10 w-48 h-48 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="mx-auto h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-display text-4xl shadow-xl shadow-primary/40">
            {initial}
          </div>
          <h2 className="font-display text-2xl mt-4 break-words">{user?.username}</h2>
          <p className="text-xs text-muted-foreground mt-1 break-all">{user?.email}</p>

          <div className="mt-5 inline-flex items-center gap-1.5 stat-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Conta ativa
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl p-5 bg-gradient-to-br from-primary/20 via-accent/15 to-transparent border border-primary/30">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Wallet size={12} /> Saldo atual
          </div>
          <div className="font-display text-4xl mt-1 tabular gradient-text">R$ {(user?.balance ?? 0).toFixed(2)}</div>
          <Link to="/pagamentos" className="neon-button mt-4 w-full !py-2.5">
            Depositar <ArrowUpRight size={14} />
          </Link>
        </div>

        <button onClick={logout} className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition">
          <LogOut size={12} /> Encerrar sessão
        </button>
      </aside>

      {/* Details */}
      <section className="glass-card p-7">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Perfil</div>
        <h2 className="font-display text-3xl mt-1 mb-6">Dados da conta</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-border/70 bg-card/40 p-4 hover:border-primary/40 transition">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <Icon size={12} /> {label}
              </div>
              <div className="font-mono tabular text-base mt-1.5 break-all">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border/70 bg-card/30 p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Suporte</div>
          <p className="text-sm mt-1">
            Precisa de ajuda? Use a bolha de suporte no canto inferior ou abra um ticket pelo chat.
          </p>
        </div>
      </section>
    </div>
  );
}
