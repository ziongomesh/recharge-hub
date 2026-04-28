import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronRight, Globe2, Grid2X2, Headphones, Lock, Moon, Search, MessageSquare, Send, ShieldCheck, Smartphone, Sun, Wallet } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { smsApi, esimApi, type SmsService, type EsimProduto } from "@/lib/api";
import moneyBag from "@/assets/money-bag.webp";
import PublicHeader from "@/components/PublicHeader";
import opClaro from "@/assets/op-claro.png";
import opTim from "@/assets/op-tim.png";
import opVivo from "@/assets/op-vivo.png";

const BRAZIL_COUNTRY_ID = 73; // Padrão SMS-Activate para Brasil

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

type Tab = "sms" | "recargas" | "esim";
type Language = "pt" | "en" | "es" | "pt-PT" | "ru" | "uk" | "de" | "tr" | "az" | "uz" | "zh" | "hi" | "bn";
type Theme = "light" | "dark";

type LangOption = { code: Language; native: string; localized: string; flag: string; iso: string };
type LangGroup = { region: string; items: LangOption[] };

const languageGroups: LangGroup[] = [
  {
    region: "Recomendados",
    items: [
      { code: "pt", native: "Português", localized: "Português (Brasil)", flag: "🇧🇷", iso: "br" },
      { code: "en", native: "English", localized: "Inglês", flag: "🇬🇧", iso: "gb" },
    ],
  },
  {
    region: "Europa",
    items: [
      { code: "ru", native: "Русский", localized: "Russo", flag: "🇷🇺", iso: "ru" },
      { code: "uk", native: "Українська", localized: "Ucraniano", flag: "🇺🇦", iso: "ua" },
      { code: "de", native: "Deutsch", localized: "Alemão", flag: "🇩🇪", iso: "de" },
      { code: "es", native: "Español", localized: "Espanhol", flag: "🇪🇸", iso: "es" },
      { code: "pt-PT", native: "Português", localized: "Português (Portugal)", flag: "🇵🇹", iso: "pt" },
    ],
  },
  {
    region: "Oriente Médio",
    items: [{ code: "tr", native: "Türkçe", localized: "Turco", flag: "🇹🇷", iso: "tr" }],
  },
  {
    region: "Ásia Central",
    items: [
      { code: "az", native: "Azərbaycan", localized: "Azerbaijano", flag: "🇦🇿", iso: "az" },
      { code: "uz", native: "Oʻzbekcha", localized: "Uzbeque", flag: "🇺🇿", iso: "uz" },
    ],
  },
  {
    region: "Ásia",
    items: [{ code: "zh", native: "简体中文", localized: "Chinês (simplificado)", flag: "🇨🇳", iso: "cn" }],
  },
  {
    region: "Ásia do Sul",
    items: [
      { code: "hi", native: "हिन्दी", localized: "Hindi", flag: "🇮🇳", iso: "in" },
      { code: "bn", native: "বাংলা", localized: "Bengali", flag: "🇧🇩", iso: "bd" },
    ],
  },
];

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
    heroTitle: "Recarregue seu número e compre chips virtuais de todo o Brasil",
    heroText: "Recargas rápidas para Claro, TIM e Vivo, e eSIMs prontos para ativar em segundos.",
    buyNumber: "Recarregar agora",
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
    heroTitle: "Top up your number and get virtual SIMs across Brazil",
    heroText: "Fast top-ups for Claro, TIM and Vivo, plus eSIMs ready to activate in seconds.",
    buyNumber: "Top up now",
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
    heroTitle: "Recarga tu número y compra chips virtuales en todo Brasil",
    heroText: "Recargas rápidas para Claro, TIM y Vivo, y eSIMs listos para activar en segundos.",
    buyNumber: "Recargar ahora",
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
  { app: "Claro", text: "Recarga de R$ 20,00 confirmada para (11) ••••-1234" },
  { app: "Vivo", text: "Recarga de R$ 50,00 confirmada para (21) ••••-5678" },
  { app: "TIM", text: "Recarga de R$ 30,00 confirmada para (31) ••••-9012" },
  { app: "Claro", text: "Recarga de R$ 15,00 confirmada para (47) ••••-3344" },
  { app: "Vivo", text: "Recarga de R$ 100,00 confirmada para (51) ••••-7788" },
  { app: "TIM", text: "Recarga de R$ 25,00 confirmada para (85) ••••-2211" },
];

type LiveNotification = (typeof liveMessages)[number] & { id: string };


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
  claro: opClaro,
  tim: opTim,
  vivo: opVivo,
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
    name: "PIX",
    className: "payment-pix",
    icon: (
      <span className="inline-flex items-center gap-1.5">
        <svg viewBox="0 0 512 512" className="h-5 w-5" aria-hidden="true">
          <path fill="currentColor" d="M112.57 391.19c11.43 0 22.18-4.45 30.26-12.53l59.62-59.62c3.06-3.06 8.41-3.07 11.48 0l59.84 59.84c8.07 8.08 18.82 12.53 30.25 12.53h11.74l-75.51 75.51c-23.56 23.56-61.76 23.56-85.32 0l-75.72-75.73h13.36zM304.02 120.81c-11.43 0-22.18 4.45-30.25 12.53l-59.84 59.84c-3.16 3.17-8.32 3.17-11.48 0l-59.62-59.62c-8.08-8.08-18.83-12.53-30.26-12.53H99.21l75.72-75.72c23.56-23.56 61.76-23.56 85.32 0l75.51 75.51h-11.74zM46.07 213.34l45.45-45.45h21.05c7.89 0 15.62 3.2 21.19 8.78l59.62 59.62c8.16 8.16 18.87 12.24 29.59 12.24s21.43-4.08 29.59-12.23l59.84-59.84c5.57-5.57 13.3-8.77 21.19-8.77h24.93l45.66 45.66c23.56 23.56 23.56 61.76 0 85.32L358.51 344.1h-24.93c-7.89 0-15.62-3.2-21.19-8.78l-59.84-59.83c-15.8-15.8-43.39-15.79-59.18-.01l-59.62 59.62c-5.57 5.58-13.3 8.78-21.19 8.78H91.51l-45.45-45.45c-23.55-23.56-23.55-61.76.01-85.09z" />
        </svg>
        <span className="text-[10px] font-bold tracking-wide">PIX</span>
      </span>
    ),
  },
  {
    name: "Bitcoin",
    className: "payment-bitcoin",
    soon: true,
    icon: (
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F7931A] text-[11px] font-black text-white">₿</span>
        <span className="text-[10px] font-bold tracking-wide">BTC</span>
      </span>
    ),
  },
  {
    name: "Ethereum",
    className: "payment-ethereum",
    soon: true,
    icon: (
      <span className="inline-flex items-center gap-1.5">
        <svg viewBox="0 0 256 417" className="h-5 w-3" aria-hidden="true">
          <path fill="#343434" d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
          <path fill="#8C8C8C" d="M127.962 0 0 212.32l127.962 75.639V154.158z" />
          <path fill="#3C3C3B" d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z" />
          <path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z" />
          <path fill="#141414" d="m127.961 287.958 127.96-75.637-127.96-58.162z" />
          <path fill="#393939" d="m0 212.32 127.96 75.638v-133.8z" />
        </svg>
        <span className="text-[10px] font-bold tracking-wide">ETH</span>
      </span>
    ),
  },
];


export default function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("recargas");
  const [services, setServices] = useState<SmsService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);
  const [esimProdutos, setEsimProdutos] = useState<EsimProduto[]>([]);
  const [esimLoading, setEsimLoading] = useState(true);
  const [search, setSearch] = useState("");
  const messageIndexRef = useRef(2);
  const [visibleMessages, setVisibleMessages] = useState<LiveNotification[]>(
    liveMessages.slice(0, 3).map((message, index) => ({ ...message, id: `${message.app}-${index}` })),
  );
  const [language, setLanguage] = useState<Language>("pt");
  const [theme, setTheme] = useState<Theme>("light");

  const t = copy[language as "pt" | "en" | "es"] ?? copy.pt;

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

  // Carrega produtos eSIM disponíveis
  useEffect(() => {
    esimApi
      .produtosPublicos()
      .then((r) => setEsimProdutos(r.produtos.filter((p) => p.stock > 0)))
      .catch(() => setEsimProdutos([]))
      .finally(() => setEsimLoading(false));
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
      <PublicHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 py-5 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
          {/* Coluna esquerda — abas + serviços */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="rounded-full bg-card p-1.5 border border-border/60 grid grid-cols-3 gap-1">
              <button
                onClick={() => setTab("recargas")}
                className={`rounded-full py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                  tab === "recargas" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Recargas
              </button>
              <button
                onClick={() => setTab("esim")}
                className={`rounded-full py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                  tab === "esim" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                eSIM
              </button>
              <button
                disabled
                aria-disabled="true"
                title="Em breve"
                className="rounded-full py-2.5 text-[11px] sm:text-xs font-semibold text-muted-foreground/70 cursor-not-allowed flex items-center justify-center gap-1"
              >
                SMS
                <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded-full">em breve</span>
              </button>
            </div>

            {/* Card de serviços */}
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
              <div className="text-sm font-semibold mb-3">{tab === "recargas" ? "Operadoras" : tab === "esim" ? "Planos eSIM" : t.selectService}</div>
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

                {tab === "esim" && (
                  esimLoading ? (
                    <div className="text-xs text-muted-foreground py-6 text-center">{t.loading}</div>
                  ) : esimProdutos.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-6 text-center">Nenhum eSIM disponível no momento.</div>
                  ) : (
                    <div className="max-h-[430px] space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary)/0.45)_transparent]">
                      {esimProdutos
                        .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={requireLogin}
                            className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/50 transition-colors text-left"
                          >
                            <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                              <Smartphone size={16} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{p.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {p.stock.toLocaleString("pt-BR")} disponíveis
                              </div>
                            </div>
                            <span className="rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1 whitespace-nowrap">
                              R$ {p.amount.toFixed(2).replace(".", ",")}
                            </span>
                          </button>
                        ))}
                    </div>
                  )
                )}

                <button
                  onClick={requireLogin}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-3 mt-2 border-t border-border/40"
                >
                  {t.showAll} {tab === "sms" ? services.length : tab === "esim" ? esimProdutos.length : 3}
                </button>
              </div>
            </div>

          </div>

          {/* Coluna direita — bônus */}
          <div className="space-y-6">
            {/* Hero — Receba SMS */}
            <section
              className="relative overflow-hidden rounded-2xl p-6 sm:p-10 min-h-[280px] sm:min-h-[340px]"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.18) 0%, hsl(280 85% 70% / 0.18) 60%, hsl(320 85% 75% / 0.22) 100%)" }}
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,280px)] items-center">
                <div className="relative z-10">
                  <h1 className="font-display text-2xl sm:text-4xl leading-tight text-foreground max-w-md">
                    {t.heroTitle}
                  </h1>
                  <p className="mt-4 text-sm text-muted-foreground max-w-md">
                    {t.heroText}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={requireLogin}
                      className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition"
                    >
                      {t.buyNumber}
                    </button>
                  </div>
                </div>

                {/* Notificações ao vivo */}
                <div className="relative z-10 space-y-3">
                  {visibleMessages.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur p-3 shadow-sm animate-in fade-in slide-in-from-right-2 duration-500"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex h-6 items-center justify-center shrink-0">
                          <OperatorIcon name={m.app} />
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">há 1 min.</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>



          </div>
        </div>
      </main>



      <footer className="relative z-10 mt-10 border-t border-border/50 bg-background/90 py-10 text-foreground backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 flex flex-col items-center text-center">
          <Link to="/" className="leading-none" aria-label="cometa sms">
            <div className="font-display text-2xl text-foreground tracking-tight">cometa</div>
            <div className="font-mono-x text-[10px] text-foreground tracking-[0.45em] -mt-0.5">sms</div>
          </Link>

          <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/precos" className="hover:text-primary transition">{t.prices}</Link>
            <Link to="/termos" className="hover:text-primary transition">{t.terms}</Link>
          </nav>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method.name}
                className={`payment-icon ${method.className} relative inline-flex h-9 items-center justify-center px-3 rounded-full ring-1 ring-border bg-card ${method.soon ? "opacity-60" : ""}`}
                aria-label={`Meio de pagamento ${method.name}${method.soon ? " (em breve)" : ""}`}
                title={method.soon ? `${method.name} — em breve` : method.name}
              >
                {method.icon}
                {method.soon && (
                  <span className="ml-1.5 text-[8px] font-semibold uppercase tracking-wider bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                    em breve
                  </span>
                )}
              </span>
            ))}
          </div>

          <p className="mt-6 text-[11px] text-foreground/50">
            © {new Date().getFullYear()} CometaSMS
          </p>
        </div>
      </footer>
    </div>
  );
}
