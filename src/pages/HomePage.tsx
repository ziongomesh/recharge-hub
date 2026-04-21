import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, MessageSquare, Smartphone, Wallet } from "lucide-react";
import { smsApi, type SmsService } from "@/lib/api";

const BRAZIL_COUNTRY_ID = 73; // Padrão Poeki/SMS-Activate para Brasil

type Tab = "sms" | "recargas";

export default function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("sms");
  const [services, setServices] = useState<SmsService[]>([]);
  const [search, setSearch] = useState("");

  // Tema padrão branco; usuário escolhe escuro manualmente.

  // Carrega serviços de SMS do Brasil
  useEffect(() => {
    smsApi
      .services(BRAZIL_COUNTRY_ID)
      .then((r) => setServices(r.services))
      .catch(() => setServices([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? services.filter(
          (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
        )
      : services;
    return list.slice(0, 7);
  }, [services, search]);

  const requireLogin = () => navigate("/login");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar superior fina */}
      <div className="border-b border-border/50 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-muted-foreground">
          <div className="flex items-center gap-5">
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <a href="#api" className="hover:text-foreground">API</a>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="hover:text-foreground">Suporte</Link>
            <span>Português (Brasil)</span>
            <span className="text-primary">● Escuro</span>
          </div>
        </div>
      </div>

      {/* Header com logo + nav */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2" aria-label="cometa sms">
            {/* Logo estilo sms.online: bold em duas linhas */}
            <div className="leading-none">
              <div className="font-display text-3xl text-primary tracking-tight">cometa</div>
              <div className="font-mono-x text-[11px] text-primary tracking-[0.45em] -mt-0.5 text-center">
                sms
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <button onClick={requireLogin} className="hover:text-primary transition-colors">SMS</button>
            <button onClick={requireLogin} className="hover:text-primary transition-colors">Recargas</button>
            <button onClick={requireLogin} className="hover:text-primary transition-colors">Lista de preços</button>
            <button onClick={requireLogin} className="hover:text-primary transition-colors">Ajuda ▾</button>
          </nav>

          <button
            onClick={requireLogin}
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-primary transition-colors"
            aria-label="Entrar"
          >
            <Smartphone size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Coluna esquerda — abas + serviços */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="rounded-full bg-card p-1.5 border border-border/60 grid grid-cols-2 gap-1">
              <button
                onClick={() => setTab("sms")}
                className={`rounded-full py-2.5 text-sm font-semibold transition-colors ${
                  tab === "sms" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                SMS
              </button>
              <button
                onClick={() => setTab("recargas")}
                className={`rounded-full py-2.5 text-sm font-semibold transition-colors ${
                  tab === "recargas" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Recargas
              </button>
            </div>

            {/* Card de serviços */}
            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <div className="text-sm font-semibold mb-3">Selecione o serviço</div>
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar"
                  className="w-full rounded-xl bg-secondary/60 border border-border/40 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                {tab === "sms" && filtered.length === 0 && (
                  <div className="text-xs text-muted-foreground py-6 text-center">
                    Carregando serviços…
                  </div>
                )}
                {tab === "sms" &&
                  filtered.map((s) => (
                    <button
                      key={s.code}
                      onClick={requireLogin}
                      className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {s.icon_url ? (
                          <img src={s.icon_url} alt="" className="h-5 w-5 object-contain" />
                        ) : (
                          <MessageSquare size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.stock.toLocaleString("pt-BR")} número{s.stock === 1 ? "" : "s"}
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/15 text-primary text-[11px] font-semibold px-3 py-1 whitespace-nowrap">
                        a partir de R$ {s.price.toFixed(2).replace(".", ",")}
                      </span>
                    </button>
                  ))}

                {tab === "recargas" && (
                  <div className="space-y-1.5">
                    {["Claro", "TIM", "Vivo"].map((op) => (
                      <button
                        key={op}
                        onClick={requireLogin}
                        className="w-full flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <Smartphone size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 text-sm font-medium">{op}</div>
                        <span className="rounded-full bg-primary/15 text-primary text-[11px] font-semibold px-3 py-1">
                          recarregar
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={requireLogin}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-3 mt-2 border-t border-border/40"
                >
                  Mostrar todos {tab === "sms" ? services.length : 3}
                </button>
              </div>
            </div>

            {/* Card país — somente Brasil */}
            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <div className="text-sm font-semibold mb-3">Selecione o país</div>
              <div className="flex items-center gap-3 rounded-xl px-2 py-2 bg-secondary/40">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-lg">
                  🇧🇷
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Brasil</div>
                  <div className="text-[11px] text-muted-foreground">
                    {services.reduce((acc, s) => acc + s.stock, 0).toLocaleString("pt-BR")} números disponíveis
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita — hero + bônus */}
          <div className="space-y-6">
            <section className="rounded-3xl bg-card border border-border/60 p-10 sm:p-12 relative overflow-hidden min-h-[420px] flex flex-col justify-center">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
                <div>
                  <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight">
                    Receba SMS rapidamente em números virtuais em todo o mundo
                  </h1>
                  <p className="mt-5 text-ink-soft max-w-md">
                    Compre um número virtual e receba SMS sem limites. Para qualquer site ou aplicativo.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button onClick={requireLogin} className="btn-pill">
                      Comprar número <ArrowRight size={16} />
                    </button>
                    <button onClick={requireLogin} className="btn-pill-outline">
                      Recarregar
                    </button>
                  </div>
                </div>

                {/* Mock de SMS recebidos */}
                <div className="space-y-3">
                  {[
                    { app: "Amazon", time: "há 36 seg.", text: "Amazon code: 1234567890" },
                    { app: "Twitter", time: "há 1 min.", text: "191919 is your Twitter code" },
                    { app: "Instagram", time: "há 1 min.", text: "Use 191919 to verify your Instagram account" },
                  ].map((m) => (
                    <div key={m.app} className="rounded-2xl bg-secondary/60 border border-border/40 p-4">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                          {m.app}
                        </div>
                        <span className="text-muted-foreground">{m.time}</span>
                      </div>
                      <div className="mt-2 text-sm">{m.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Bônus */}
            <section className="rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-10 sm:p-12 relative overflow-hidden">
              <div className="max-w-xl relative z-10">
                <h2 className="font-display text-3xl sm:text-4xl leading-tight">
                  15% de bônus no primeiro depósito
                </h2>
                <p className="mt-4 text-sm opacity-90 max-w-lg">
                  Bônus de 15% no primeiro depósito (creditado uma vez após a confirmação do pagamento) — válido para
                  valores de R$ 10 a R$ 500; ao depositar acima de R$ 500, o bônus permanece em R$ 75.
                </p>
                <button
                  onClick={requireLogin}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:bg-background/90"
                >
                  <Wallet size={16} /> Recarregar
                </button>
              </div>
              <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-primary-foreground/10 blur-3xl" />
            </section>

            <section>
              <h3 className="font-display text-2xl sm:text-3xl tracking-tight">
                Compre um número virtual para registro e recebimento de SMS
              </h3>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 mt-10 py-8">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} CometaSMS</div>
          <Link to="/termos" className="hover:text-foreground">Termos</Link>
        </div>
      </footer>
    </div>
  );
}
