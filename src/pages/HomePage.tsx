import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Moon, Search, MessageSquare, Smartphone, Sun, Wallet } from "lucide-react";
import { smsApi, type SmsService } from "@/lib/api";

const BRAZIL_COUNTRY_ID = 73; // Padrão Poeki/SMS-Activate para Brasil

type Tab = "sms" | "recargas";
type Language = "pt" | "en" | "es";
type Theme = "light" | "dark";

const copy = {
  pt: {
    support: "Suporte",
    language: "Português",
    light: "Claro",
    dark: "Escuro",
    prices: "Lista de preços",
    help: "Ajuda ▾",
    login: "Entrar",
    selectService: "Selecione o serviço",
    search: "Buscar",
    loading: "Carregando serviços…",
    numbers: "números",
    from: "a partir de",
    recharge: "Recarregar",
    showAll: "Mostrar todos",
    selectCountry: "Selecione o país",
    brazil: "Brasil",
    available: "números disponíveis",
    heroTitle: "Receba SMS rapidamente em números virtuais em todo o mundo",
    heroText: "Compre um número virtual e receba SMS sem limites. Para qualquer site ou aplicativo.",
    buyNumber: "Comprar número",
    new: "novo",
    ago: "há",
    bonusTitle: "15% de bônus no primeiro depósito",
    bonusText: "Bônus de 15% no primeiro depósito (creditado uma vez após a confirmação do pagamento) — válido para valores de R$ 10 a R$ 500; ao depositar acima de R$ 500, o bônus permanece em R$ 75.",
    closing: "Compre um número virtual para registro e recebimento de SMS",
    footerText: "Números virtuais, recargas e recebimento de SMS com fluxo rápido e seguro.",
    terms: "Termos",
    rights: "Todos os direitos reservados.",
  },
  en: {
    support: "Support",
    language: "English",
    light: "Light",
    dark: "Dark",
    prices: "Price list",
    help: "Help ▾",
    login: "Login",
    selectService: "Select service",
    search: "Search",
    loading: "Loading services…",
    numbers: "numbers",
    from: "from",
    recharge: "Recharge",
    showAll: "Show all",
    selectCountry: "Select country",
    brazil: "Brazil",
    available: "numbers available",
    heroTitle: "Receive SMS fast on virtual numbers worldwide",
    heroText: "Buy a virtual number and receive SMS without limits for any website or app.",
    buyNumber: "Buy number",
    new: "new",
    ago: "min ago",
    bonusTitle: "15% bonus on first deposit",
    bonusText: "15% bonus on the first deposit, credited once payment is confirmed — valid from R$ 10 to R$ 500; above R$ 500, the bonus remains R$ 75.",
    closing: "Buy a virtual number for registration and SMS receiving",
    footerText: "Virtual numbers, mobile recharges and SMS receiving with a fast and secure flow.",
    terms: "Terms",
    rights: "All rights reserved.",
  },
  es: {
    support: "Soporte",
    language: "Español",
    light: "Claro",
    dark: "Oscuro",
    prices: "Lista de precios",
    help: "Ayuda ▾",
    login: "Entrar",
    selectService: "Selecciona el servicio",
    search: "Buscar",
    loading: "Cargando servicios…",
    numbers: "números",
    from: "desde",
    recharge: "Recargar",
    showAll: "Mostrar todos",
    selectCountry: "Selecciona el país",
    brazil: "Brasil",
    available: "números disponibles",
    heroTitle: "Recibe SMS rápido en números virtuales de todo el mundo",
    heroText: "Compra un número virtual y recibe SMS sin límites para cualquier sitio o aplicación.",
    buyNumber: "Comprar número",
    new: "nuevo",
    ago: "hace",
    bonusTitle: "15% de bono en el primer depósito",
    bonusText: "Bono de 15% en el primer depósito, acreditado tras confirmar el pago — válido de R$ 10 a R$ 500; por encima de R$ 500, el bono queda en R$ 75.",
    closing: "Compra un número virtual para registro y recepción de SMS",
    footerText: "Números virtuales, recargas y recepción de SMS con flujo rápido y seguro.",
    terms: "Términos",
    rights: "Todos los derechos reservados.",
  },
};

const liveMessages = [
  { app: "Amazon", text: "Amazon code: 1234567890" },
  { app: "Twitter", text: "191919 is your Twitter code" },
  { app: "Instagram", text: "Use 191919 to verify your Instagram account" },
  { app: "WhatsApp", text: "Seu código WhatsApp é 482-910" },
  { app: "Telegram", text: "Telegram code: 73418" },
  { app: "iFood", text: "Código de verificação iFood: 225604" },
  { app: "Uber", text: "Uber code: 6812" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("sms");
  const [services, setServices] = useState<SmsService[]>([]);
  const [search, setSearch] = useState("");
  const [messageStart, setMessageStart] = useState(0);
  const [language, setLanguage] = useState<Language>("pt");
  const [theme, setTheme] = useState<Theme>("light");

  const t = copy[language];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Carrega serviços de SMS do Brasil
  useEffect(() => {
    smsApi
      .services(BRAZIL_COUNTRY_ID)
      .then((r) => setServices(r.services))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageStart((current) => (current + 1) % liveMessages.length);
    }, 2400);

    return () => window.clearInterval(timer);
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

  const visibleMessages = useMemo(
    () => Array.from({ length: 3 }, (_, index) => liveMessages[(messageStart + index) % liveMessages.length]),
    [messageStart],
  );

  const requireLogin = () => navigate("/login");

  return (
    <div className="min-h-screen bg-background text-foreground dark:[background-image:linear-gradient(90deg,hsl(var(--border)/0.55)_1px,transparent_1px),linear-gradient(180deg,hsl(var(--border)/0.45)_1px,transparent_1px)] dark:[background-size:160px_160px]">
      {/* Topbar superior fina */}
      <div className="border-b border-border/50 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-muted-foreground">
          <div className="flex items-center gap-5">
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <button onClick={requireLogin} className="hover:text-foreground">SMS</button>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/login" className="hover:text-foreground">{t.support}</Link>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="bg-transparent text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Idioma"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
            <div className="inline-grid grid-cols-2 rounded-full border border-border/60 bg-card p-0.5">
              <button
                onClick={() => setTheme("light")}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors ${theme === "light" ? "bg-primary text-primary-foreground" : "hover:text-foreground"}`}
              >
                <Sun size={12} /> {t.light}
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors ${theme === "dark" ? "bg-primary text-primary-foreground" : "hover:text-foreground"}`}
              >
                <Moon size={12} /> {t.dark}
              </button>
            </div>
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
            <button onClick={requireLogin} className="hover:text-primary transition-colors">{t.prices}</button>
            <button onClick={requireLogin} className="hover:text-primary transition-colors">{t.help}</button>
          </nav>

          <button
            onClick={requireLogin}
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-primary transition-colors"
            aria-label={t.login}
          >
            <Smartphone size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
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
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
              <div className="text-sm font-semibold mb-3">{t.selectService}</div>
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.search}
                  className="w-full rounded-xl bg-secondary/60 border border-border/40 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                {tab === "sms" && filtered.length === 0 && (
                  <div className="text-xs text-muted-foreground py-6 text-center">
                    {t.loading}
                  </div>
                )}
                {tab === "sms" &&
                  filtered.map((s) => (
                    <button
                      key={s.code}
                      onClick={requireLogin}
                      className="w-full flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {s.icon_url ? (
                          <img src={s.icon_url} alt="" className="h-5 w-5 object-contain" />
                        ) : (
                          <MessageSquare size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.stock.toLocaleString("pt-BR")} {t.numbers}
                        </div>
                      </div>
                      <span className="rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1 whitespace-nowrap">
                        {t.from} R$ {s.price.toFixed(2).replace(".", ",")}
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
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Smartphone size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 text-sm font-medium">{op}</div>
                        <span className="rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1">
                          {t.recharge.toLowerCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={requireLogin}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-3 mt-2 border-t border-border/40"
                >
                  {t.showAll} {tab === "sms" ? services.length : 3}
                </button>
              </div>
            </div>

            {/* Card país — somente Brasil */}
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
              <div className="text-sm font-semibold mb-3">{t.selectCountry}</div>
              <div className="flex items-center gap-3 rounded-xl px-2 py-2 bg-secondary/40">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-lg">
                  🇧🇷
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{t.brazil}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {services.reduce((acc, s) => acc + s.stock, 0).toLocaleString("pt-BR")} {t.available}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita — hero + bônus */}
          <div className="space-y-6">
            <section className="sms-hero-panel rounded-xl border border-border/60 p-10 sm:p-12 relative overflow-hidden min-h-[420px] flex flex-col justify-center shadow-2xl shadow-primary/10">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
                <div>
                  <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight">
                    {t.heroTitle}
                  </h1>
                    <p className="mt-5 text-ink-soft max-w-md text-lg leading-relaxed">
                    {t.heroText}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button onClick={requireLogin} className="btn-pill">
                      {t.buyNumber} <ArrowRight size={16} />
                    </button>
                    <button onClick={requireLogin} className="btn-pill-outline">
                      {t.recharge}
                    </button>
                  </div>
                </div>

                {/* Mock de SMS recebidos */}
                <div className="space-y-3 overflow-hidden">
                  {visibleMessages.map((m, index) => (
                    <div key={`${m.app}-${messageStart}`} className="rounded-xl bg-secondary/80 border border-border/60 p-4 animate-fade-up shadow-lg shadow-background/10">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                          {m.app}
                        </div>
                        <span className="text-muted-foreground">{index === 0 ? t.new : language === "en" ? `${index} ${t.ago}` : `${t.ago} ${index} min.`}</span>
                      </div>
                      <div className="mt-2 text-sm">{m.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Bônus */}
            <section className="sms-bonus-panel rounded-xl text-primary-foreground p-10 sm:p-12 relative overflow-hidden min-h-[280px] flex items-center">
              <div className="max-w-xl relative z-10">
                <h2 className="font-display text-3xl sm:text-4xl leading-tight">
                  {t.bonusTitle}
                </h2>
                <p className="mt-4 text-sm opacity-90 max-w-lg">
                  {t.bonusText}
                </p>
                <button
                  onClick={requireLogin}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:bg-background/90"
                >
                  <Wallet size={16} /> {t.recharge}
                </button>
              </div>
              <div className="absolute right-10 bottom-8 hidden h-36 w-36 items-center justify-center rounded-full bg-background/20 text-7xl shadow-2xl shadow-background/30 lg:flex">
                💰
              </div>
            </section>

            <section>
              <h3 className="font-display text-2xl sm:text-3xl tracking-tight">
                {t.closing}
              </h3>
            </section>
          </div>
        </div>
      </main>

      <footer className="mt-10 border-t border-border/50 bg-ink py-14 text-primary-foreground dark:bg-card dark:text-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 text-sm md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="block leading-none" aria-label="cometa sms">
              <div className="font-display text-3xl text-primary tracking-tight">cometa</div>
              <div className="font-mono-x text-[11px] text-primary tracking-[0.45em] -mt-0.5">sms</div>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70 dark:text-muted-foreground">
              © {new Date().getFullYear()} CometaSMS.<br />
              {t.footerText}
            </p>
          </div>

          <div className="grid gap-3 text-primary-foreground/70 dark:text-muted-foreground">
            <button onClick={requireLogin} className="text-left hover:text-primary">Ativação</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">Alugar número</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">{t.prices}</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">Serviços</button>
          </div>

          <div className="grid gap-3 text-primary-foreground/70 dark:text-muted-foreground">
            <button onClick={requireLogin} className="text-left hover:text-primary">Programa de referência</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">Programa de fidelidade</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">Regras do projeto</button>
            <Link to="/termos" className="hover:text-primary">{t.terms}</Link>
          </div>

          <div>
            <div className="grid gap-3 text-primary-foreground/70 dark:text-muted-foreground">
              <button onClick={requireLogin} className="text-left hover:text-primary">Feedback</button>
              <Link to="/login" className="hover:text-primary">Contatos</Link>
              <a href="#faq" className="hover:text-primary">FAQ</a>
            </div>
            <div className="mt-9 flex flex-wrap gap-2">
              {['₮', '₿', 'Ξ', 'VISA', '●', 'MIR', 'UPI', '▶'].map((item) => (
                <span
                  key={item}
                  className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary-foreground/10 px-2 text-[10px] font-semibold text-primary-foreground/65 dark:bg-secondary dark:text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
