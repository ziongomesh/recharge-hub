import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Globe2, Grid2X2, Headphones, Lock, Moon, Search, MessageSquare, Send, ShieldCheck, Smartphone, Sun, Wallet } from "lucide-react";
import { smsApi, type SmsService } from "@/lib/api";
import moneyBag from "@/assets/money-bag.webp";

const BRAZIL_COUNTRY_ID = 73; // Padrão Poeki/SMS-Activate para Brasil

const fallbackSmsServices: SmsService[] = [
  { code: "wa", name: "WhatsApp", icon_url: null, stock: 1248, price: 3.9 },
  { code: "tg", name: "Telegram", icon_url: null, stock: 986, price: 2.8 },
  { code: "ig", name: "Instagram", icon_url: null, stock: 812, price: 3.5 },
  { code: "fb", name: "Facebook", icon_url: null, stock: 754, price: 3.2 },
  { code: "go", name: "Google", icon_url: null, stock: 690, price: 4.5 },
  { code: "am", name: "Amazon", icon_url: null, stock: 531, price: 3.7 },
  { code: "if", name: "iFood", icon_url: null, stock: 426, price: 2.9 },
  { code: "ub", name: "Uber", icon_url: null, stock: 389, price: 3.4 },
];

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
    login: "Área do cliente",
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
    login: "Client area",
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
    login: "Área de cliente",
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
  "99app": "99app.com", "99": "99app.com", adobe: "adobe.com", agibank: "agibank.com.br",
  aliexpress: "aliexpress.com", aliexpresscom: "aliexpress.com", ahlan: "ahlan.live",
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
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  const domain = serviceIconDomains[normalized] || serviceIconDomains[compact] || serviceIconDomains[normalized.split(/[\s,/+|·•\-—–]/)[0]];
  if (!domain && compact.length >= 2 && compact.length <= 24) return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(compact + ".com")}&sz=128`;
  return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : null;
}

function serviceHasIcon(service: SmsService) {
  return Boolean(service.icon_url || iconFromServiceName(service.name));
}

function HomeSmsServiceIcon({ service }: { service: SmsService }) {
  const [url, setUrl] = useState<string | null>(service.icon_url || iconFromServiceName(service.name));
  const [fallbackTried, setFallbackTried] = useState(false);

  useEffect(() => {
    setUrl(service.icon_url || iconFromServiceName(service.name));
    setFallbackTried(false);
  }, [service.icon_url, service.name]);

  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-secondary flex items-center justify-center">
      {url ? (
        <img
          src={url}
          alt=""
          className="h-5 w-5 object-contain"
          loading="lazy"
          onError={() => {
            const derived = iconFromServiceName(service.name);
            if (!fallbackTried && derived && derived !== url) {
              setFallbackTried(true);
              setUrl(derived);
              return;
            }
            setUrl(null);
          }}
        />
      ) : (
        <span className="text-xs font-bold text-primary">{service.name[0]?.toUpperCase() || "S"}</span>
      )}
    </div>
  );
}

function BrazilFlagIcon() {
  return (
    <svg viewBox="0 0 36 24" className="h-5 w-7 overflow-hidden rounded-sm shadow-sm" aria-hidden="true">
      <rect width="36" height="24" rx="2" fill="#229E45" />
      <path d="M18 3 32 12 18 21 4 12 18 3Z" fill="#F8E034" />
      <circle cx="18" cy="12" r="5.1" fill="#2B49A3" />
      <path d="M13.2 10.9c3.5-.6 6.7.1 9.7 2" stroke="#fff" strokeWidth="1.1" fill="none" />
    </svg>
  );
}

const operatorLogos: Record<string, string> = {
  claro: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Claro_Logo.svg/512px-Claro_Logo.svg.png",
  tim: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/TIM_logo_2016.svg/512px-TIM_logo_2016.svg.png",
  vivo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Logo_Vivo.svg/512px-Logo_Vivo.svg.png",
};

function OperatorIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  const logo = operatorLogos[normalized];
  if (logo) {
    return (
      <img src={logo} alt={name} className="h-6 w-auto max-w-[44px] object-contain" loading="lazy" />
    );
  }
  return (
    <div className={`operator-icon operator-${normalized}`} aria-hidden="true">
      {normalized === "claro" ? "claro" : normalized === "tim" ? "TIM" : "Vivo"}
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
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);
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
      .then((r) => { setServices(r.services); setServicesError(false); })
      .catch(() => { setServices(fallbackSmsServices); setServicesError(false); })
      .finally(() => setServicesLoading(false));
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
    const withIcons = services.filter(serviceHasIcon);
    const list = q
      ? withIcons.filter(
          (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
        )
      : withIcons;
    return list;
  }, [services, search]);

  const requireLogin = () => navigate("/login");
  const totalSmsNumbers = services.reduce((acc, s) => acc + s.stock, 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Blobs decorativos de fundo (efeito translúcido) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-[hsl(320_80%_75%)]/25 blur-3xl" />
        <div className="absolute top-[55%] left-1/4 h-[360px] w-[360px] rounded-full bg-[hsl(280_85%_70%)]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-[hsl(340_85%_80%)]/20 blur-3xl" />
      </div>
      {/* Topbar superior fina */}
      <div className="relative z-10 text-[11px] sm:text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-end px-3 sm:px-6 py-2 text-muted-foreground gap-4 sm:gap-6">
            <a href="https://t.me/cometasms_support" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Send size={13} className="text-primary" />
              <span>Telegram</span>
            </a>
            <a href="https://t.me/cometasms_support" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Headphones size={13} className="text-primary" />
              <span>{t.support}</span>
            </a>
            <div className="inline-flex items-center gap-1.5">
              <Globe2 size={13} className="text-primary" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                className="bg-transparent text-muted-foreground hover:text-primary focus:outline-none cursor-pointer"
                aria-label="Idioma"
              >
                <option value="pt">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div className="inline-flex items-center gap-1.5">
              {theme === "light" ? (
                <button onClick={() => setTheme("dark")} className="inline-flex items-center gap-1.5 text-primary hover:opacity-80 transition" aria-label={t.dark}>
                  <Sun size={13} />
                  <span>{t.light}</span>
                </button>
              ) : (
                <button onClick={() => setTheme("light")} className="inline-flex items-center gap-1.5 text-primary hover:opacity-80 transition" aria-label={t.light}>
                  <Moon size={13} />
                  <span>{t.dark}</span>
                </button>
              )}
            </div>
        </div>
      </div>

      {/* Header com logo + nav */}
      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="cometa sms">
            <div className="leading-none">
              <div className="font-display text-xl sm:text-2xl text-primary tracking-tight">cometa</div>
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
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/35 bg-card px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.08),0_12px_28px_-14px_hsl(var(--primary))] transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
            aria-label={t.login}
          >
            <Smartphone size={14} className="sm:hidden" />
            <Smartphone size={16} className="hidden sm:block" />
            <span className="hidden xs:inline sm:hidden">Entrar</span>
            <span className="hidden sm:inline">{t.login}</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 py-5 sm:py-8">
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
              <div className="text-sm font-semibold mb-3">{tab === "recargas" ? "Operadoras" : t.selectService}</div>
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
                    {servicesLoading ? t.loading : servicesError ? "Não foi possível carregar da API" : "Nenhum serviço ativo"}
                  </div>
                )}
                {tab === "sms" && filtered.length > 0 && (
                  <div className="max-h-[430px] space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary)/0.45)_transparent]">
                    {filtered.map((s) => (
                    <button
                      key={s.code}
                      onClick={requireLogin}
                      className="w-full flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-secondary/50 transition-colors text-left"
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
                  </div>
                )}

                {tab === "recargas" && (
                  <div className="space-y-1.5">
                    {["Claro", "TIM", "Vivo"].map((op) => (
                      <button
                        key={op}
                        onClick={requireLogin}
                        className="w-full flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className="h-9 w-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <OperatorIcon name={op} />
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
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                  <BrazilFlagIcon />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{t.brazil}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {servicesLoading ? t.loading : servicesError ? "API indisponível" : `${totalSmsNumbers.toLocaleString("pt-BR")} ${t.available}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita — bônus */}
          <div className="space-y-6">
            {/* Bônus */}
            <section className="sms-bonus-panel rounded-xl text-primary-foreground p-6 sm:p-12 relative overflow-hidden min-h-[220px] sm:min-h-[280px] flex items-center">
              <img
                src={moneyBag}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 bottom-2 z-0 w-36 sm:right-8 sm:w-56 lg:right-12 lg:w-64 drop-shadow-2xl"
              />
              <div className="max-w-xl relative z-10">
                <h2 className="font-display text-2xl sm:text-4xl leading-tight">
                  {t.bonusTitle}
                </h2>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm opacity-90 max-w-lg">
                  {t.bonusText}
                </p>
                <button
                  onClick={requireLogin}
                  className="mt-5 sm:mt-6 inline-flex items-center gap-2 rounded-full bg-background text-foreground px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-background/90"
                >
                  <Wallet size={16} /> {t.recharge}
                </button>
              </div>
            </section>


            <section id="contatos" className="rounded-xl border border-border/60 bg-card p-7">
              <h2 className="font-display text-3xl tracking-tight">Contatos</h2>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <a href="mailto:suporte@cometasms.com" className="hover:text-primary">suporte@cometasms.com</a>
                <a href="https://t.me/cometasms_support" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Telegram</a>
                <span>Atendimento todos os dias</span>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Por que escolher — stats */}
      <section className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 mt-12 sm:mt-16">
        <h2 className="font-display text-2xl sm:text-4xl text-foreground tracking-tight">
          Por que escolher o CometaSMS
        </h2>
        <div className="mt-6 grid gap-6 rounded-2xl border border-border/60 bg-card/70 backdrop-blur p-8 sm:p-12 sm:grid-cols-3">
          {[
            { num: "180+", label: "suporte a mais de 180 países" },
            { num: "1500+", label: "serviços e aplicativos do mundo todo" },
            { num: "35%", label: "até 35% de desconto para usuários frequentes" },
          ].map((s) => (
            <div key={s.num}>
              <div className="font-display text-4xl sm:text-5xl text-primary tracking-tight">{s.num}</div>
              <p className="mt-2 text-sm text-muted-foreground max-w-[220px]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pague com criptomoeda */}
      <section className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 mt-10 sm:mt-14">
        <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(280 85% 55%) 100%)" }}>
          <div className="relative z-10 max-w-xl">
            <h2 className="font-display text-3xl sm:text-5xl leading-tight">Pague com criptomoeda.</h2>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <button onClick={requireLogin} className="rounded-full bg-background text-foreground px-5 py-2.5 text-sm font-semibold hover:bg-background/90">
                Recarregar saldo
              </button>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#26A17B] text-white text-xs font-black">₮</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F7931A] text-white text-sm font-black">₿</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#627EEA] text-white text-sm font-black">◆</span>
            </div>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-6 sm:right-6 sm:bottom-2 opacity-90">
            <svg viewBox="0 0 200 220" className="w-40 sm:w-56 drop-shadow-2xl">
              <defs>
                <linearGradient id="shieldG" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f5f7fa" />
                  <stop offset="100%" stopColor="#c3cdd9" />
                </linearGradient>
              </defs>
              <path d="M100 10 L180 40 V110 C180 160 140 200 100 210 C60 200 20 160 20 110 V40 Z" fill="url(#shieldG)" stroke="#94a3b8" strokeWidth="3" />
              <circle cx="100" cy="105" r="42" fill="#F7931A" />
              <text x="100" y="125" textAnchor="middle" fontSize="60" fontWeight="900" fill="#fff" fontFamily="system-ui">₿</text>
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 mt-12 sm:mt-16">
        <h2 className="font-display text-2xl sm:text-4xl text-foreground tracking-tight">
          Respostas para perguntas frequentes
        </h2>
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 backdrop-blur divide-y divide-border/60 overflow-hidden">
          {faqItems.map((item, i) => (
            <details key={i} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 text-sm sm:text-base font-medium text-foreground hover:bg-secondary/40 transition">
                <span>{item.question}</span>
                <ChevronRight size={18} className="text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-6 pb-5 text-sm text-muted-foreground">{item.answer}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Guia */}
      <section className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 mt-12 sm:mt-16 mb-8">
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur p-8 sm:p-12">
          <h2 className="font-display text-2xl sm:text-4xl text-foreground tracking-tight">
            Guia do CometaSMS e seus serviços
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-3xl">
            CometaSMS é um serviço conveniente para usuários que precisam de um número de telefone virtual para receber SMS online. Você pode obter números descartáveis e de longo prazo, projetados para confirmações via SMS — adequados para registro em mensageiros, redes sociais e plataformas de comércio.
          </p>

          <h3 className="font-display text-lg sm:text-xl text-foreground mt-8">Como adquirir um número virtual para receber SMS</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {[
              ["Escolha o serviço:", "selecione o serviço desejado na lista da página inicial."],
              ["Configuração:", "indique o país e a quantidade de números virtuais ou descartáveis."],
              ["Compra do número:", "clique em comprar para confirmar e pagar pelo número."],
              ["Ativação:", "use o número virtual recebido no campo necessário para registro."],
              ["Recebendo SMS:", "o código de verificação aparecerá ao lado do seu número."],
            ].map(([k, v], i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><span className="font-semibold text-foreground">{k}</span> {v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="relative z-10 mt-10 border-t border-border/50 bg-background/90 py-8 sm:py-10 text-foreground backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-8 px-3 sm:px-6 text-sm sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
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
        <div className="mx-auto mt-8 sm:mt-10 flex max-w-7xl flex-wrap items-center justify-center gap-3 px-3 sm:px-6">
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
