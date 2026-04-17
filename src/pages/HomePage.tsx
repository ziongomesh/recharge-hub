import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { operadorasApi, type Operadora } from "@/lib/api";

const fallbackOperadoras: Operadora[] = [
  { id: 1, name: "Claro", enabled: true },
  { id: 2, name: "TIM", enabled: true },
  { id: 3, name: "Vivo", enabled: true },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);

  useEffect(() => {
    operadorasApi
      .list()
      .then((r) => setOperadoras(r.operadoras.filter((o) => o.enabled)))
      .catch(() => setOperadoras(fallbackOperadoras));
  }, []);

  const activeOperadoras = operadoras.length ? operadoras : fallbackOperadoras;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card font-display text-xl">
              C
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">CometaSMS</div>
              <div className="text-xs text-muted-foreground">Recargas via PIX</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#recargas" className="hover:text-foreground transition-colors">Recargas</a>
            <a href="#operadoras" className="hover:text-foreground transition-colors">Operadoras</a>
            <a href="#vantagens" className="hover:text-foreground transition-colors">Vantagens</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate("/recargas")}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background transition-opacity hover:opacity-90"
              >
                Abrir painel
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background transition-opacity hover:opacity-90"
                >
                  Criar conta
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              PIX automático e recarga instantânea
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Recarga de celular com cara de produto moderno.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Escolha a operadora, selecione o valor e pague via PIX. Fluxo direto, visual limpo e confirmação rápida.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={user ? "/recargas" : "/register"}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm text-background transition-opacity hover:opacity-90"
              >
                {user ? "Nova recarga" : "Começar agora"}
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="rounded-md border border-border px-5 py-3 text-sm transition-colors hover:bg-card">
                Já tenho conta
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Confirmação", value: "Em segundos" },
                { label: "Operadoras", value: `${activeOperadoras.length} ativas` },
                { label: "Pagamento", value: "PIX" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-card p-4">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="mt-2 text-lg font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="text-sm font-medium">Fluxo de recarga</div>
                <div className="text-xs text-muted-foreground">Simples e objetivo</div>
              </div>
              <div className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">3 passos</div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                "Digite o número com DDD",
                "Escolha operadora e valor",
                "Pague no PIX e acompanhe o histórico",
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-4 rounded-xl border border-border p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{step}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Sem telas poluídas e sem distrações desnecessárias.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="operadoras" className="border-y border-border bg-card/40">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="mb-5 text-sm font-medium">Operadoras disponíveis</div>
            <div className="grid gap-4 sm:grid-cols-3">
              {activeOperadoras.map((op) => (
                <button
                  key={op.id}
                  onClick={() => (user ? navigate(`/recargas?operadora=${op.id}`) : navigate("/login"))}
                  className="rounded-xl border border-border bg-background p-5 text-left transition-colors hover:bg-card"
                >
                  <div className="text-lg font-semibold">{op.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Recargas rápidas com confirmação automática.</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="vantagens" className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 max-w-2xl">
            <div className="text-sm font-medium text-muted-foreground">Por que usar</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Sem exagero visual, só um front bem resolvido.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Zap, title: "Rápido", text: "Fluxo curto para recarga e depósito sem atrito." },
              { icon: ShieldCheck, title: "Confiável", text: "Histórico, status e confirmação claros para o usuário." },
              { icon: Check, title: "Direto", text: "Interface de app de verdade, sem aparência genérica de IA." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
                <item.icon className="text-foreground" size={20} />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
