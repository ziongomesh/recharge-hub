import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Globe2, Grid2X2, Headphones, Lock, Moon, Search, MessageSquare, ShieldCheck, Smartphone, Sun, Wallet } from "lucide-react";
import { smsApi, type SmsService } from "@/lib/api";
import cometaBackground from "@/assets/cometa-background.png";

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
    bonusTitle: "Ganhe 15% de bônus no primeiro depósito",
    bonusText: "Faça seu primeiro depósito e receba 15% de bônus automaticamente após a confirmação do pagamento.",
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
    bonusTitle: "Get a 15% bonus on your first deposit",
    bonusText: "Make your first deposit and receive a 15% bonus automatically after payment confirmation.",
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
    bonusTitle: "Gana 15% de bono en tu primer depósito",
    bonusText: "Haz tu primer depósito y recibe 15% de bono automáticamente después de confirmar el pago.",
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

type LiveNotification = (typeof liveMessages)[number] & { id: string };
type FaqItem = { question: string; answer: string };

const serviceIconDomains: Record<string, string> = {
  google: "google.com", gmail: "google.com", youtube: "youtube.com",
  whatsapp: "whatsapp.com", telegram: "telegram.org", instagram: "instagram.com",
  facebook: "facebook.com", twitter: "x.com", x: "x.com", discord: "discord.com",
  tiktok: "tiktok.com", amazon: "amazon.com", apple: "apple.com", microsoft: "microsoft.com",
  netflix: "netflix.com", spotify: "spotify.com", uber: "uber.com", ifood: "ifood.com.br",
  shopee: "shopee.com.br", nubank: "nubank.com.br", picpay: "picpay.com", binance: "binance.com",
  mercado: "mercadolivre.com.br", "mercado livre": "mercadolivre.com.br", "mercado pago": "mercadopago.com",
};

function iconFromServiceName(name: string) {
  const normalized = name.toLowerCase().trim().replace(/\s+/g, " ");
  const domain = serviceIconDomains[normalized] || serviceIconDomains[normalized.split(/[\s,/+|·•\-—–]/)[0]];
  const fallback = normalized.replace(/[^a-z0-9]/g, "");
  const target = domain || (fallback.length >= 2 ? `${fallback}.com` : null);
  return target ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(target)}&sz=128` : null;
}

function HomeSmsServiceIcon({ service }: { service: SmsService }) {
  const [url, setUrl] = useState<string | null>(service.icon_url || iconFromServiceName(service.name));

  useEffect(() => {
    setUrl(service.icon_url || iconFromServiceName(service.name));
  }, [service.icon_url, service.name]);

  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-secondary flex items-center justify-center">
      {url ? (
        <img src={url} alt="" className="h-5 w-5 object-contain" loading="lazy" onError={() => setUrl(null)} />
      ) : (
        <MessageSquare size={14} className="text-muted-foreground" />
      )}
    </div>
  );
}

const paymentMethods = [
  {
    name: "Visa",
    className: "payment-visa",
    icon: <span className="text-[9px] font-black italic tracking-tighter">VISA</span>,
  },
  {
    name: "Mastercard",
    className: "payment-mastercard",
    icon: (
      <svg viewBox="0 0 32 20" className="h-5 w-8" aria-hidden="true">
        <circle cx="12" cy="10" r="8" className="mc-red" />
        <circle cx="20" cy="10" r="8" className="mc-yellow" />
      </svg>
    ),
  },
  {
    name: "PIX",
    className: "payment-pix",
    icon: (
      <svg viewBox="0 0 28 28" className="h-5 w-5" aria-hidden="true">
        <path fill="currentColor" d="M14 2.7 25.3 14 14 25.3 2.7 14 14 2.7Zm-4.9 8.6 3.4 3.4a2.1 2.1 0 0 0 3 0l3.4-3.4-1.6-1.6-3.3 3.3-3.3-3.3-1.6 1.6Zm0 5.4 1.6 1.6 3.3-3.3 3.3 3.3 1.6-1.6-3.4-3.4a2.1 2.1 0 0 0-3 0l-3.4 3.4Z" />
      </svg>
    ),
  },
  {
    name: "Crypto",
    className: "payment-crypto",
    icon: <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px] font-black">₿</span>,
  },
  {
    name: "Bitcoin",
    className: "payment-bitcoin",
    icon: <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] font-black text-background">₿</span>,
  },
  {
    name: "Solana",
    className: "payment-solana",
    icon: (
      <svg viewBox="0 0 32 22" className="h-5 w-7" aria-hidden="true">
        <path fill="currentColor" d="M7 2h21l-4 4H3l4-4Zm0 7h21l-4 4H3l4-4Zm0 7h21l-4 4H3l4-4Z" />
      </svg>
    ),
  },
  {
    name: "Ethereum",
    className: "payment-ethereum",
    icon: <span className="text-[18px] leading-none">◆</span>,
  },
];

const faqItems: FaqItem[] = [
  { question: "O que é um número virtual?", answer: "É um número temporário usado para receber SMS de confirmação sem expor seu telefone pessoal." },
  { question: "Como funciona o CometaSMS?", answer: "Você escolhe o serviço, compra um número disponível e acompanha o SMS recebido em tempo real." },
  { question: "A segurança é garantida após o término do aluguel do número?", answer: "Sim. O número é descartável e usado apenas durante o período da ativação." },
  { question: "O que fazer se o SMS não chegar?", answer: "Aguarde alguns minutos, tente outro número disponível ou fale com o suporte pelos contatos públicos." },
  { question: "Onde posso usar o número comprado?", answer: "Em serviços compatíveis com verificação por SMS, conforme disponibilidade do catálogo." },
  { question: "Como pagar por um número virtual?", answer: "Após criar conta, você adiciona saldo e usa para comprar números ou recargas." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("sms");
  const [services, setServices] = useState<SmsService[]>([]);
  const [search, setSearch] = useState("");
  const messageIndexRef = useRef(2);
  const [visibleMessages, setVisibleMessages] = useState<LiveNotification[]>(
    liveMessages.slice(0, 3).map((message, index) => ({ ...message, id: `${message.app}-${index}` })),
  );
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
      messageIndexRef.current = (messageIndexRef.current + 1) % liveMessages.length;
      const next = liveMessages[messageIndexRef.current];
      setVisibleMessages((current) => [
        ...current.slice(1),
        { ...next, id: `${next.app}-${Date.now()}` },
      ]);
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
    return list;
  }, [services, search]);

  const requireLogin = () => navigate("/login");

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-secondary/35 to-background text-foreground dark:[background-image:linear-gradient(90deg,hsl(var(--border)/0.55)_1px,transparent_1px),linear-gradient(180deg,hsl(var(--border)/0.45)_1px,transparent_1px)] dark:[background-size:160px_160px]">
      {/* Topbar superior fina */}
      <div className="relative z-10 border-b border-border/60 bg-background/80 text-xs backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-muted-foreground">
          <div className="flex items-center gap-5">
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <button onClick={requireLogin} className="hover:text-foreground">API</button>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/login" className="hidden hover:text-foreground sm:inline-flex">Telegram</Link>
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
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setTheme("light")}
                className={`inline-flex items-center gap-1 transition-colors ${theme === "light" ? "text-primary" : "hover:text-foreground"}`}
                aria-label={t.light}
              >
                <Sun size={12} />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`inline-flex items-center gap-1 transition-colors ${theme === "dark" ? "text-primary" : "hover:text-foreground"}`}
                aria-label={t.dark}
              >
                <Moon size={12} /> <span>{theme === "dark" ? t.dark : t.light}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header com logo + nav */}
      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2" aria-label="cometa sms">
            {/* Logo estilo sms.online: bold em duas linhas */}
            <div className="leading-none">
              <div className="font-display text-2xl text-primary tracking-tight">cometa</div>
              <div className="font-mono-x text-[10px] text-primary tracking-[0.42em] -mt-0.5 text-center">
                sms
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-9 text-sm font-medium text-muted-foreground md:flex">
            <button onClick={requireLogin} className="hover:text-primary transition-colors">Ativação</button>
            <button onClick={requireLogin} className="hover:text-primary transition-colors">Aluguel</button>
            <button onClick={requireLogin} className="hover:text-primary transition-colors">{t.prices}</button>
            <button onClick={requireLogin} className="hover:text-primary transition-colors">{t.help}</button>
          </nav>

          <button
            onClick={requireLogin}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:opacity-95"
            aria-label={t.login}
          >
            <Smartphone size={16} />
            {t.login}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
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
                      <HomeSmsServiceIcon service={s} />
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
              <img
                src={cometaBackground}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-8 z-0 w-52 rotate-12 opacity-75 sm:-right-10 sm:w-64 lg:right-8 lg:top-8 lg:w-72"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-1/2 bg-gradient-to-l from-background/55 to-transparent" aria-hidden="true" />
              <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
                <div className="relative z-10">
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
                <div className="relative z-10 space-y-3 overflow-hidden">
                  {visibleMessages.map((m, index) => (
                    <div key={m.id} className="rounded-xl bg-secondary/80 border border-border/60 p-4 animate-notification-up shadow-lg shadow-background/10">
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
            </section>

            <section>
              <h3 className="font-display text-2xl sm:text-3xl tracking-tight">
                {t.closing}
              </h3>
            </section>

            <section className="space-y-8 py-8">
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight max-w-xl">
                Como receber SMS em um número virtual CometaSMS?
              </h2>
              <div className="divide-y divide-border/60">
                {[
                  ["01", "Registro", "Crie sua conta na plataforma CometaSMS."],
                  ["02", "Recarregar saldo", "Escolha PIX e confirme o pagamento para liberar o saldo."],
                  ["03", "Compra do número", "Selecione país e serviço, receba a mensagem direto na conta em tempo real."],
                ].map(([num, title, text]) => (
                  <div key={num} className="grid gap-4 py-8 sm:grid-cols-[80px_1fr]">
                    <div className="font-display text-4xl text-primary">{num}</div>
                    <div>
                      <div className="font-semibold">{title}</div>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={requireLogin} className="btn-pill w-full justify-center">
                <Grid2X2 size={16} /> {t.buyNumber}
              </button>
            </section>

            <section className="rounded-xl border border-border/60 bg-card p-8 sm:p-10">
              <h2 className="font-display text-3xl tracking-tight">Guia do site CometaSMS e seus serviços</h2>
              <p className="mt-5 max-w-4xl text-sm leading-7 text-muted-foreground">
                O CometaSMS é um serviço prático para quem precisa de números virtuais para receber SMS online.
                Escolha um serviço, compre um número descartável e acompanhe a mensagem em tempo real com privacidade.
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-card p-7 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Países</h3>
                  <p className="mt-1 text-muted-foreground">Ver a lista completa de países disponíveis</p>
                </div>
                <Globe2 className="text-primary" />
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-7 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Serviços</h3>
                  <p className="mt-1 text-muted-foreground">Todos os serviços com suporte à ativação</p>
                </div>
                <ChevronRight className="text-primary" />
              </div>
            </section>

            <section className="space-y-6 py-8">
              <h2 className="font-display text-3xl tracking-tight">Por que escolher CometaSMS</h2>
              <div className="grid rounded-xl border border-border/60 bg-card md:grid-cols-3">
                {[
                  ["BR", "atendimento somente no Brasil, em todos os estados"],
                  ["1500+", "serviços e aplicativos"],
                  ["35%", "economia para usuários frequentes"],
                ].map(([value, label]) => (
                  <div key={value} className="p-8 border-b border-border/60 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 md:border-border/60">
                    <div className="font-display text-4xl text-primary">{value}</div>
                    <p className="mt-3 text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-3xl tracking-tight">Por que usar um número virtual descartável?</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  [ShieldCheck, "Superando restrições regionais", "Use números virtuais para ativação em serviços compatíveis."],
                  [Lock, "Preservando a privacidade", "Evite expor seu telefone pessoal em cadastros e testes."],
                  [Headphones, "Envios em massa", "Ideal para operações que precisam organizar múltiplas ativações."],
                ].map(([Icon, title, text]) => (
                  <div key={String(title)} className="rounded-xl border border-border/60 bg-card p-7 min-h-[180px]">
                    <Icon className="text-primary" size={28} />
                    <h3 className="mt-7 font-display text-xl">{String(title)}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{String(text)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="feedbacks" className="grid gap-4 py-8 md:grid-cols-3">
              {["Rápido e simples para receber código.", "Consegui ativar sem usar meu número pessoal.", "Suporte respondeu quando precisei trocar o serviço."].map((text, index) => (
                <div key={text} className="rounded-xl border border-border/60 bg-card p-6">
                  <div className="text-primary">★★★★★</div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{text}</p>
                  <div className="mt-5 text-sm font-semibold">Cliente {index + 1}</div>
                </div>
              ))}
            </section>

            <section id="contatos" className="rounded-xl border border-border/60 bg-card p-7">
              <h2 className="font-display text-3xl tracking-tight">Contatos</h2>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <a href="mailto:suporte@cometasms.com" className="hover:text-primary">suporte@cometasms.com</a>
                <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Telegram</a>
                <span>Atendimento todos os dias</span>
              </div>
            </section>

            <section id="faq" className="space-y-6 py-8">
              <h2 className="font-display text-3xl tracking-tight">Respostas para perguntas frequentes</h2>
              <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60">
                {faqItems.map((item) => (
                  <details key={item.question} className="group">
                    <summary className="flex w-full cursor-pointer list-none items-center justify-between px-5 py-4 text-left text-sm font-semibold hover:bg-secondary/50">
                      {item.question}
                      <ChevronRight size={15} className="text-muted-foreground transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="px-5 pb-4 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-10 border-t border-border/50 bg-background/90 py-10 text-foreground backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 text-sm md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="block leading-none" aria-label="cometa sms">
              <div className="font-display text-3xl text-foreground tracking-tight">cometa</div>
              <div className="font-mono-x text-[11px] text-foreground tracking-[0.45em] -mt-0.5">sms</div>
            </Link>
            <p className="mt-5 max-w-sm text-xs leading-relaxed text-foreground/75">
              Trabalhamos com número virtual, recargas e SMS para seu app ou site.<br />
              CometaSMS — ativações rápidas, saldo por PIX e comunicação sem complicação.<br />
              Recebemos pagamentos em PIX; em breve também em crypto.<br />
              © {new Date().getFullYear()} CometaSMS. Seu código chega mais rápido.
            </p>
          </div>

          <div className="grid gap-3 text-foreground">
            <button onClick={requireLogin} className="text-left hover:text-primary">Ativação</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">Alugar número</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">{t.prices}</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">Serviços</button>
          </div>

          <div className="grid gap-3 text-foreground">
            <button onClick={requireLogin} className="text-left hover:text-primary">Programa de referência</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">Programa de fidelidade</button>
            <button onClick={requireLogin} className="text-left hover:text-primary">Regras do projeto</button>
            <Link to="/termos" className="hover:text-primary">{t.terms}</Link>
          </div>

          <div>
            <div className="grid gap-3 text-foreground">
              <a href="#feedbacks" className="hover:text-primary">Feedback</a>
              <a href="#contatos" className="hover:text-primary">Contatos</a>
              <button onClick={requireLogin} className="text-left hover:text-primary">API</button>
              <a href="#faq" className="hover:text-primary">FAQ</a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-center gap-3 px-6">
          {paymentMethods.map((method) => (
            <span
              key={method.name}
              className={`payment-icon ${method.className} inline-flex h-7 min-w-7 items-center justify-center px-1`}
              aria-label={`Meio de pagamento ${method.name}`}
              title={method.name}
            >
              {method.icon}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
