import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  const rows: [string, string][] = [
    ["Usuário",      user?.username ?? "—"],
    ["E-mail",       user?.email ?? "—"],
    ["Telefone",     user?.phone ? fmtPhone(user.phone) : "—"],
    ["CPF",          user?.cpf ? fmtCPF(user.cpf) : "—"],
    ["Função",       user?.role === "admin" ? "Administrador" : "Cliente"],
    ["Membro desde", user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"],
  ];

  return (
    <div className="max-w-3xl grid md:grid-cols-3 gap-10">
      {/* Identidade */}
      <aside className="md:col-span-1">
        <div className="label-eyebrow">Identidade</div>
        <div className="font-display text-6xl leading-none mt-2 break-words">{user?.username?.[0]?.toUpperCase() ?? "?"}</div>
        <div className="font-display text-2xl mt-3 break-words">{user?.username}</div>
        <div className="text-xs font-mono text-muted-foreground mt-1 break-all">{user?.email}</div>
      </aside>

      {/* Dados */}
      <section className="md:col-span-2">
        <div className="label-eyebrow mb-3">Perfil</div>
        <dl className="border-y border-foreground divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between py-4">
              <dt className="label-eyebrow">{k}</dt>
              <dd className="font-mono tabular text-sm text-foreground text-right">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 border border-foreground p-6 flex items-center justify-between gap-6">
          <div>
            <div className="label-eyebrow">Saldo atual</div>
            <div className="font-display text-5xl mt-1 tabular">R$ {(user?.balance ?? 0).toFixed(2)}</div>
          </div>
          <a href="/pagamentos" className="text-sm underline underline-offset-4 hover:text-foreground/70">Depositar →</a>
        </div>
      </section>
    </div>
  );
}
