import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, Zap, Smartphone, CreditCard, Globe } from "lucide-react";
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
      {/* Top bar */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="font-display text-2xl tracking-tight">
              cometa<span className="text-primary">sms</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#recargas" className="hover:text-primary transition-colors">Recargas</a>
            <a href="#operadoras" className="hover:text-primary transition-colors">Operadoras</a>
            <a href="#vantagens" className="hover:text-primary transition-colors">Vantagens</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate("/recargas")} className="btn-pill">
                Abrir painel <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                  Entrar
                </Link>
                <Link to="/register" className="btn-pill">
                  Criar conta <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pt-10 pb-16">
          <div className="hero-gradient rounded-[2rem] p-10 sm:p-16 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                Recarregue seu celular em segundos.
              </h1>
              <p className="mt-6 text-lg text-ink-soft max-w-xl leading-relaxed">
                Pague no PIX, escolha sua operadora e receba o crédito instantaneamente. Simples, rápido e sem complicação.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to={user ? "/recargas" : "/register"} className="btn-pill">
                  {user ? "Nova recarga" : "Começar agora"} <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="btn-pill-outline">
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Operadoras */}
        <section id="operadoras" className="mx-auto max-w-7xl px-6 pb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-3xl sm:text-4xl tracking-tight">Operadoras disponíveis</h2>
            <span className="text-sm text-muted-foreground">{activeOperadoras.length} ativas</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {activeOperadoras.map((op) => (
              <button
                key={op.id}
                onClick={() => (user ? navigate(`/recargas?operadora=${op.id}`) : navigate("/login"))}
                className="rounded-3xl border border-border/60 bg-card p-6 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-2xl">{op.name}</div>
                  <ArrowRight className="text-primary" size={20} />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Recarga instantânea via PIX.</div>
              </button>
            ))}
          </div>
        </section>

        {/* Bonus card — sms.online style */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="rounded-[2rem] bg-primary text-primary-foreground p-10 sm:p-14 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="text-sm font-mono uppercase tracking-widest opacity-80">Promoção</div>
              <h3 className="mt-2 font-display text-4xl sm:text-5xl leading-tight">
                10% de bônus no primeiro depósito
              </h3>
              <p className="mt-4 text-base opacity-90 max-w-lg">
                Crie sua conta, faça seu primeiro PIX e ganhe crédito extra para usar como quiser.
              </p>
              <Link to={user ? "/pagamentos" : "/register"} className="mt-6 inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:bg-background/90">
                Depositar agora <ArrowRight size={16} />
              </Link>
            </div>
            <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-primary-foreground/10 blur-3xl" />
            <div className="absolute right-20 top-10 w-40 h-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          </div>
        </section>

        {/* Vantagens */}
        <section id="vantagens" className="mx-auto max-w-7xl px-6 pb-20">
          <div className="mb-8">
            <div className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Por que cometa</div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl tracking-tight max-w-2xl">
              Tudo que você precisa, sem fricção.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Zap, title: "Instantâneo", text: "Crédito liberado em segundos após confirmação do PIX." },
              { icon: ShieldCheck, title: "Seguro", text: "Pagamentos via PIX com confirmação automática e histórico completo." },
              { icon: Smartphone, title: "Todas operadoras", text: "Claro, TIM, Vivo e mais. Recarregue qualquer número do Brasil." },
              { icon: CreditCard, title: "Sem taxas escondidas", text: "Você paga só o valor da recarga. Transparente do início ao fim." },
              { icon: Globe, title: "24/7", text: "Faça recargas a qualquer hora, em qualquer dia da semana." },
              { icon: Check, title: "Suporte direto", text: "Time disponível pelo chat para resolver qualquer questão." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-border/60 bg-card p-6 hover:border-primary/30 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon size={22} />
                </div>
                <h3 className="mt-4 font-display text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} CometaSMS</div>
          <Link to="/termos" className="hover:text-foreground">Termos</Link>
        </div>
      </footer>
    </div>
  );
}
