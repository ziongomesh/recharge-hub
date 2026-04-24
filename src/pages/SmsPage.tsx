import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { smsApi, type SmsService, type SmsCountry, type SmsActivation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Search, Phone, Copy, X, Check, RefreshCw, Pin, PinOff, ChevronDown, Boxes } from "lucide-react";

const PIN_KEY = "sms:pinned"; // { [countryId]: string[] }
const MAX_PINS = 3;

function loadPins(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) || "{}"); } catch { return {}; }
}
function savePins(p: Record<string, string[]>) {
  localStorage.setItem(PIN_KEY, JSON.stringify(p));
}

// Mapa nome (EN/PT) → ISO-2 — fallback quando o backend não retorna iso
const COUNTRY_ISO: Record<string, string> = {
  brasil: "br", brazil: "br", afghanistan: "af", afeganistao: "af",
  "aland islands": "ax", albania: "al", algeria: "dz", argelia: "dz",
  "american samoa": "as", andorra: "ad", angola: "ao", anguilla: "ai",
  antarctica: "aq", "antigua and barbuda": "ag", argentina: "ar",
  armenia: "am", aruba: "aw", australia: "au", austria: "at",
  azerbaijan: "az", bahamas: "bs", bahrain: "bh", bangladesh: "bd",
  barbados: "bb", belarus: "by", belgium: "be", belgica: "be", belize: "bz",
  benin: "bj", bermuda: "bm", bhutan: "bt", bolivia: "bo",
  "bosnia and herzegovina": "ba", botswana: "bw", "bouvet island": "bv",
  "british indian ocean territory": "io", "british virgin islands": "vg",
  brunei: "bn", "brunei darussalam": "bn", bulgaria: "bg",
  "burkina faso": "bf", burundi: "bi", "cabo verde": "cv", cambodia: "kh",
  cameroon: "cm", canada: "ca", "cape verde": "cv",
  "caribbean netherlands": "bq", "cayman islands": "ky",
  "central african republic": "cf", chad: "td", chile: "cl", china: "cn",
  "christmas island": "cx", "cocos islands": "cc", "cocos (keeling) islands": "cc",
  colombia: "co", comoros: "km", congo: "cg",
  "congo (kinshasa)": "cd", "democratic republic of the congo": "cd",
  "congo democratic republic": "cd", "cook islands": "ck",
  "costa rica": "cr", "cote d'ivoire": "ci", "côte d'ivoire": "ci",
  croatia: "hr", cuba: "cu", curacao: "cw", "curaçao": "cw", cyprus: "cy",
  "czech republic": "cz", czechia: "cz", denmark: "dk", djibouti: "dj",
  dominica: "dm", "dominican republic": "do", "east timor": "tl",
  "timor-leste": "tl", ecuador: "ec", egypt: "eg", "el salvador": "sv",
  england: "gb", "equatorial guinea": "gq", eritrea: "er", estonia: "ee",
  eswatini: "sz", swaziland: "sz", ethiopia: "et",
  "falkland islands": "fk", "faroe islands": "fo", "faeroe islands": "fo",
  fiji: "fj", finland: "fi", france: "fr", franca: "fr",
  "french guiana": "gf", "guiana francesa": "gf", "french polynesia": "pf",
  "french southern territories": "tf", gabon: "ga", gambia: "gm",
  georgia: "ge", germany: "de", alemanha: "de", ghana: "gh",
  gibraltar: "gi", greece: "gr", greenland: "gl", grenada: "gd",
  guadeloupe: "gp", guam: "gu", guatemala: "gt", guernsey: "gg",
  guinea: "gn", "guinea-bissau": "gw", "guinea bissau": "gw", guyana: "gy",
  haiti: "ht", "heard island": "hm", honduras: "hn", "hong kong": "hk",
  hungary: "hu", iceland: "is", india: "in", indonesia: "id", iran: "ir",
  iraq: "iq", ireland: "ie", "isle of man": "im", israel: "il",
  italy: "it", italia: "it", "ivory coast": "ci", jamaica: "jm",
  japan: "jp", japao: "jp", jersey: "je", jordan: "jo",
  kazakhstan: "kz", kenya: "ke", kiribati: "ki", kosovo: "xk",
  kuwait: "kw", kyrgyzstan: "kg", laos: "la",
  "lao people's democratic republic": "la", latvia: "lv", lebanon: "lb",
  lesotho: "ls", liberia: "lr", libya: "ly", liechtenstein: "li",
  lithuania: "lt", luxembourg: "lu", macau: "mo", macao: "mo",
  macedonia: "mk", "north macedonia": "mk", madagascar: "mg",
  malawi: "mw", malaysia: "my", maldives: "mv", mali: "ml", malta: "mt",
  "marshall islands": "mh", martinique: "mq", mauritania: "mr",
  mauritius: "mu", mayotte: "yt", mexico: "mx", "micronesia": "fm",
  moldova: "md", monaco: "mc", mongolia: "mn", montenegro: "me",
  montserrat: "ms", morocco: "ma", marrocos: "ma",
  mozambique: "mz", mocambique: "mz", myanmar: "mm", burma: "mm",
  namibia: "na", nauru: "nr", nepal: "np", netherlands: "nl", holanda: "nl",
  "new caledonia": "nc", "new zealand": "nz", nicaragua: "ni",
  niger: "ne", nigeria: "ng", niue: "nu", "norfolk island": "nf",
  "north korea": "kp", "northern mariana islands": "mp", norway: "no",
  oman: "om", pakistan: "pk", palau: "pw", palestine: "ps",
  "palestinian territory": "ps", panama: "pa", "papua new guinea": "pg",
  paraguay: "py", peru: "pe", philippines: "ph", filipinas: "ph",
  pitcairn: "pn", poland: "pl", portugal: "pt", "puerto rico": "pr",
  qatar: "qa", reunion: "re", "réunion": "re", romania: "ro",
  russia: "ru", "russian federation": "ru", russia2: "ru", rwanda: "rw",
  "saint barthelemy": "bl", "saint helena": "sh", "saint kitts and nevis": "kn",
  "saint lucia": "lc", "saint martin": "mf",
  "saint pierre and miquelon": "pm", "saint vincent": "vc",
  "saint vincent and the grenadines": "vc", samoa: "ws", "san marino": "sm",
  "sao tome and principe": "st", "são tomé and príncipe": "st",
  "saudi arabia": "sa", senegal: "sn", serbia: "rs", seychelles: "sc",
  "sierra leone": "sl", singapore: "sg", "sint maarten": "sx",
  slovakia: "sk", slovenia: "si", "solomon islands": "sb", somalia: "so",
  "south africa": "za", "south georgia": "gs", "south korea": "kr",
  "south sudan": "ss", spain: "es", espanha: "es", "sri lanka": "lk",
  sudan: "sd", suriname: "sr", svalbard: "sj", sweden: "se",
  switzerland: "ch", syria: "sy", "syrian arab republic": "sy",
  taiwan: "tw", tajikistan: "tj", tanzania: "tz", thailand: "th",
  togo: "tg", tokelau: "tk", tonga: "to", "trinidad and tobago": "tt",
  tunisia: "tn", turkey: "tr", turquia: "tr", "türkiye": "tr",
  turkmenistan: "tm", "turks and caicos islands": "tc", tuvalu: "tv",
  uganda: "ug", ukraine: "ua", "united arab emirates": "ae",
  "united kingdom": "gb", uk: "gb", "great britain": "gb",
  "united states": "us", "united states of america": "us", usa: "us",
  "estados unidos": "us", "us virgin islands": "vi", uruguay: "uy",
  uzbekistan: "uz", vanuatu: "vu", vatican: "va", "vatican city": "va",
  "holy see": "va", venezuela: "ve", vietnam: "vn", "viet nam": "vn",
  "wallis and futuna": "wf", "western sahara": "eh", yemen: "ye",
  zambia: "zm", zimbabwe: "zw",
};

function resolveIso(c: { iso?: string | null; name: string }): string | null {
  if (c.iso) return c.iso.toLowerCase();
  const raw = (c.name || "").toLowerCase().trim();
  // tenta exato, depois sem parênteses, depois sem pontuação
  if (COUNTRY_ISO[raw]) return COUNTRY_ISO[raw];
  const noParen = raw.replace(/\s*\(.+?\)\s*/g, "").trim();
  if (COUNTRY_ISO[noParen]) return COUNTRY_ISO[noParen];
  const clean = raw.replace(/[.,'`’]/g, "").replace(/\s+/g, " ").trim();
  return COUNTRY_ISO[clean] || null;
}

function flagUrl(iso?: string | null) {
  if (!iso) return null;
  return `https://flagcdn.com/24x18/${iso.toLowerCase()}.png`;
}

// Bandeira em emoji a partir do ISO-2 (renderiza nativamente, sem depender de CDN)
function isoToEmoji(iso?: string | null): string | null {
  if (!iso || iso.length !== 2) return null;
  const cps = iso.toUpperCase().split("").map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...cps);
}

function Flag({ iso, size = 20 }: { iso?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const emoji = isoToEmoji(iso);
  if (!iso) {
    return <span className="inline-block bg-muted rounded-sm" style={{ width: size, height: size * 0.7 }} />;
  }
  if (failed && emoji) {
    return <span style={{ fontSize: size }} className="leading-none">{emoji}</span>;
  }
  if (failed) {
    return (
      <span className="inline-flex items-center justify-center bg-muted text-[9px] font-mono uppercase rounded-sm" style={{ width: size, height: size * 0.7 }}>
        {iso}
      </span>
    );
  }
  return (
    <img
      src={flagUrl(iso)!}
      alt={iso}
      style={{ width: size, height: "auto" }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

// Detecta serviços "genéricos" (Any other, Outros, Other, etc.)
function isGenericService(name: string): boolean {
  const n = (name || "").toLowerCase().trim();
  return /^(any\s*other|other|others|outro|outros|any|gen[ée]rico|generic)$/.test(n);
}

// Mapa nome (normalizado) → domínio oficial — corrige casos onde a derivação falha
const NAME_DOMAIN: Record<string, string> = {
  "burger king": "burgerking.com",
  "c6 bank": "c6bank.com.br", "c6": "c6bank.com.br",
  "caixa": "caixa.gov.br", "caixa econômica": "caixa.gov.br",
  "banco do brasil": "bb.com.br", "bb": "bb.com.br",
  "santander": "santander.com.br",
  "itau": "itau.com.br", "itaú": "itau.com.br",
  "bradesco": "bradesco.com.br", "nubank": "nubank.com.br",
  "inter": "bancointer.com.br", "banco inter": "bancointer.com.br",
  "picpay": "picpay.com", "mercado pago": "mercadopago.com",
  "mercado livre": "mercadolivre.com.br", "mercadolivre": "mercadolivre.com.br",
  "magazine luiza": "magazineluiza.com.br", "magalu": "magazineluiza.com.br",
  "americanas": "americanas.com.br", "casas bahia": "casasbahia.com.br",
  "ponto frio": "pontofrio.com.br", "submarino": "submarino.com.br",
  "shopee": "shopee.com.br", "shein": "shein.com",
  "ifood": "ifood.com.br", "rappi": "rappi.com.br",
  "uber": "uber.com", "uber eats": "ubereats.com",
  "99": "99app.com", "99app": "99app.com",
  "bigo live": "bigo.tv", "bigo": "bigo.tv",
  "tinder": "tinder.com", "happn": "happn.com", "bumble": "bumble.com",
  "any other": "", // ignorado (cai no genérico)
  "google": "google.com", "gmail": "google.com", "youtube": "youtube.com",
  "facebook": "facebook.com", "instagram": "instagram.com",
  "whatsapp": "whatsapp.com", "telegram": "telegram.org",
  "discord": "discord.com", "twitter": "twitter.com", "x": "x.com",
  "tiktok": "tiktok.com", "snapchat": "snapchat.com",
  "amazon": "amazon.com", "apple": "apple.com", "microsoft": "microsoft.com",
  "netflix": "netflix.com", "spotify": "spotify.com",
  "openai": "openai.com", "chatgpt": "openai.com",
  "claude": "claude.ai", "anthropic": "anthropic.com",
  "paypal": "paypal.com", "binance": "binance.com",
  "coinbase": "coinbase.com", "bybit": "bybit.com", "bunq": "bunq.com",
  "revolut": "revolut.com", "wise": "wise.com",
  "airbnb": "airbnb.com", "booking": "booking.com",
  "linkedin": "linkedin.com", "twitch": "twitch.tv", "reddit": "reddit.com",
  "pinterest": "pinterest.com", "ebay": "ebay.com",
  "blizzard": "blizzard.com", "steam": "steampowered.com",
  "epic games": "epicgames.com", "roblox": "roblox.com",
  "baidu": "baidu.com", "yandex": "yandex.com", "yahoo": "yahoo.com",
  // Adicionados (vistos nas listas hero-sms)
  "etoro": "etoro.com", "fawry": "fawry.com", "feeld": "feeld.co",
  "firebase": "firebase.google.com", "fiverr": "fiverr.com",
  "d4": "d4dj.com", "daki": "daki.com.br", "datanyze": "datanyze.com",
  "dealshare": "dealshare.in", "deliveroo": "deliveroo.co.uk",
  "didi": "didiglobal.com", "didi food": "didi-food.com",
  "dil mil": "dilmil.co", "instagram+threads": "threads.net",
  "threads": "threads.net", "iqos": "iqos.com", "irctc": "irctc.co.in",
  "jdcom": "jd.com", "jd": "jd.com", "joyride": "joyrideapp.com",
  "justdating": "justdating.com", "kaito": "kaito.ai",
  "hepsiburada": "hepsiburada.com", "hepsiburadacom": "hepsiburada.com",
  "hinge": "hinge.co", "hostinger": "hostinger.com",
  "hot51": "hot51.live", "immutable play": "immutable.com",
  "imo": "imo.im", "googlevoice": "voice.google.com",
  "google voice": "voice.google.com", "govbr": "gov.br", "gov br": "gov.br",
  "grab": "grab.com", "grindr": "grindr.com", "gringo": "gringo.com.vc",
  "grupo madero": "grupomadero.com.br", "guiche web": "guicheweb.com.br",
  "immutable": "immutable.com",
  "kakao": "kakao.com", "kakaotalk": "kakao.com",
  "line": "line.me", "viber": "viber.com", "wechat": "wechat.com",
  "skype": "skype.com", "signal": "signal.org",
  "ozon": "ozon.ru", "wildberries": "wildberries.ru", "vk": "vk.com",
  "ok": "ok.ru", "weibo": "weibo.com", "bilibili": "bilibili.com",
  "qq": "qq.com", "naver": "naver.com",
  "lazada": "lazada.com", "tokopedia": "tokopedia.com",
  "trendyol": "trendyol.com", "temu": "temu.com",
  "alibaba": "alibaba.com", "aliexpress": "aliexpress.com", "alipay": "alipay.com",
  "vinted": "vinted.com", "mercari": "mercari.com",
  "olx": "olx.com", "olx br": "olx.com.br",
  "pagseguro": "pagseguro.uol.com.br", "stone": "stone.com.br",
  "agibank": "agibank.com.br", "neon": "neon.com.br",
  "next": "next.me", "will bank": "willbank.com.br",
  "recargapay": "recargapay.com.br", "ame digital": "amedigital.com",
  "ame": "amedigital.com", "pix": "bcb.gov.br",
  "natura": "natura.com.br", "boticario": "boticario.com.br",
  "o boticario": "boticario.com.br",
  "kfc": "kfc.com", "mcdonalds": "mcdonalds.com",
  "starbucks": "starbucks.com", "wolt": "wolt.com",
  "doordash": "doordash.com", "gojek": "gojek.com",
  "lyft": "lyft.com", "bolt": "bolt.eu", "indrive": "indrive.com",
  "blablacar": "blablacar.com", "cabify": "cabify.com",
  "kwai": "kwai.com", "vidio": "vidio.com",
  "yango": "yango.com",
  "betano": "betano.com", "bet365": "bet365.com",
  "pokerstars": "pokerstars.com", "ubisoft": "ubisoft.com",
  "razer": "razer.com", "supercell": "supercell.com",
  "vercel": "vercel.com", "shopify": "shopify.com",
  "twilio": "twilio.com", "zoho": "zoho.com",
  "proton": "proton.me", "protonmail": "proton.me",
  "okx": "okx.com", "mexc": "mexc.com", "kraken": "kraken.com",
  "kucoin": "kucoin.com", "gemini": "gemini.com",
  "moonpay": "moonpay.com", "metamask": "metamask.io",
  "trust wallet": "trustwallet.com", "trust": "trustwallet.com",
  "phantom": "phantom.app", "exodus": "exodus.com",
  "skrill": "skrill.com", "neteller": "neteller.com",
  "klarna": "klarna.com", "afterpay": "afterpay.com",
  "monzo": "monzo.com", "n26": "n26.com",
  "westernunion": "westernunion.com", "western union": "westernunion.com",
  "remitly": "remitly.com", "moneygram": "moneygram.com",
  "cashapp": "cash.app", "cash app": "cash.app", "venmo": "venmo.com",
  "zelle": "zellepay.com",
  // Mais marcas vistas em /sms
  "ultragaz": "ultragaz.com.br", "uol host": "uolhost.uol.com.br", "uolhost": "uolhost.uol.com.br",
  "valora": "valora.com.br", "vesseo": "vesseo.com",
  "vfs global": "vfsglobal.com", "vfsglobal": "vfsglobal.com", "vfs": "vfsglobal.com",
  "vk.com": "vk.com", "vonage": "vonage.com", "voov meeting": "voovmeeting.com",
  "voov": "voovmeeting.com", "ukrnet": "ukr.net", "ukr.net": "ukr.net",
};

// Deriva favicon oficial a partir do nome do serviço
function deriveIconUrl(name: string): string | null {
  if (!name || isGenericService(name)) return null;
  const norm = String(name).toLowerCase().trim().replace(/\s+/g, " ");
  // 1) match exato no mapa
  if (NAME_DOMAIN[norm]) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(NAME_DOMAIN[norm])}&sz=128`;
  }
  // 2) tenta nome inteiro como domínio .com (ex: "burger king" → "burgerking.com")
  const joined = norm.replace(/[^\w]/g, "");
  if (joined.length >= 3 && joined.length <= 24) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(joined + ".com")}&sz=128`;
  }
  // 3) fallback: 1ª palavra
  const first = norm.split(/[\s,/+|·•\-—–]/)[0].replace(/[^\w]/g, "");
  if (!first || first.length < 2) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(first + ".com")}&sz=128`;
}

function ServiceIcon({ src, name }: { src?: string | null; name: string }) {
  const generic = isGenericService(name);
  const initial = generic ? null : (src || deriveIconUrl(name));
  const [url, setUrl] = useState<string | null>(initial);
  const [stage, setStage] = useState<0 | 1>(0);
  useEffect(() => {
    setUrl(initial);
    setStage(0);
  }, [initial]);

  if (generic) {
    return (
      <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-muted-foreground">
        <Boxes size={14} />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-medium">
        {name[0]?.toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="w-7 h-7 rounded object-cover bg-muted"
      onError={() => {
        if (stage === 0) {
          // tenta fallback derivado do nome
          const fb = deriveIconUrl(name);
          if (fb && fb !== url) {
            setUrl(fb);
            setStage(1);
            return;
          }
        }
        setUrl(null);
      }}
    />
  );
}

export default function SmsPage() {
  const [countries, setCountries] = useState<SmsCountry[]>([]);
  const [country, setCountry] = useState<number | null>(null);
  const [services, setServices] = useState<SmsService[]>([]);
  const [search, setSearch] = useState("");
  const [loadingC, setLoadingC] = useState(true);
  const [loadingS, setLoadingS] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [active, setActive] = useState<SmsActivation | null>(null);
  const [pins, setPins] = useState<Record<string, string[]>>(() => loadPins());
  const [openCountry, setOpenCountry] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const pollRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, a] = await Promise.all([smsApi.countries(), smsApi.active()]);
        // Enriquece com iso resolvido + Brasil sempre no topo
        const enriched = c.countries.map((x) => ({ ...x, iso: resolveIso(x) }));
        const sorted = [...enriched].sort((a, b) => {
          const aBR = a.iso === "br" ? -1 : 0;
          const bBR = b.iso === "br" ? -1 : 0;
          if (aBR !== bBR) return aBR - bBR;
          return a.name.localeCompare(b.name);
        });
        setCountries(sorted);
        const br = sorted.find((x) => x.iso === "br");
        setCountry(br?.id ?? sorted[0]?.id ?? null);
        if (a.activations[0]) setActive(a.activations[0]);
      } catch (e: any) {
        toast.error(e.message || "Erro ao carregar");
      } finally {
        setLoadingC(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (country == null) return;
    setLoadingS(true);
    smsApi
      .services(country)
      .then((r) => setServices(r.services))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingS(false));
  }, [country]);

  // Polling status
  useEffect(() => {
    if (!active || (active.status !== "waiting" && active.status !== "received")) return;
    const tick = async () => {
      try {
        const r = await smsApi.status(active.id);
        setActive(r.activation);
        if (r.activation.status !== "waiting") {
          if (r.activation.status === "received") toast.success("SMS recebido!");
        }
      } catch {}
    };
    pollRef.current = window.setInterval(tick, 4000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [active?.id, active?.status]);

  // Fechar dropdown clicando fora
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenCountry(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const currentPins = pins[String(country ?? "")] || [];

  const togglePin = (code: string) => {
    if (country == null) return;
    const key = String(country);
    const list = pins[key] || [];
    let next: string[];
    if (list.includes(code)) {
      next = list.filter((c) => c !== code);
    } else {
      if (list.length >= MAX_PINS) {
        toast.error(`Máximo de ${MAX_PINS} fixados`);
        return;
      }
      next = [...list, code];
    }
    const updated = { ...pins, [key]: next };
    setPins(updated);
    savePins(updated);
  };

  const { pinned, others } = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = q
      ? services.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      : services;
    const pinSet = new Set(currentPins);
    const pinned = currentPins
      .map((code) => base.find((s) => s.code === code))
      .filter((s): s is SmsService => !!s);
    const others = base.filter((s) => !pinSet.has(s.code));
    return { pinned, others };
  }, [services, search, currentPins]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.iso?.toLowerCase().includes(q));
  }, [countries, countrySearch]);

  const currentCountry = countries.find((c) => c.id === country);

  const buy = async (s: SmsService) => {
    if ((user?.balance ?? 0) < s.price) {
      toast.error("Saldo insuficiente");
      navigate("/pagamentos");
      return;
    }
    if (country == null) return;
    setBuying(s.code);
    try {
      const r = await smsApi.buy(s.code, country);
      setActive(r.activation);
      await refreshUser?.();
      toast.success(`Número comprado: ${r.activation.phone}`);
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setBuying(null);
    }
  };

  const cancel = async () => {
    if (!active) return;
    try {
      await smsApi.cancel(active.id);
      toast.success("Cancelado");
      setActive(null);
      refreshUser?.();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const finish = async () => {
    if (!active) return;
    try {
      await smsApi.finish(active.id);
      toast.success("Finalizado");
      setActive(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const renderItem = (s: SmsService, isPinned: boolean) => (
    <li key={s.code} className="group/item">
      <div className="flex items-center rounded-xl hover:bg-paper-2 transition-colors">
        <button
          onClick={() => buy(s)}
          disabled={!!buying || s.stock === 0}
          className="flex-1 px-2.5 py-2 flex items-center gap-2.5 disabled:opacity-50 text-left"
        >
          <ServiceIcon src={s.icon_url} name={s.name} />
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{s.name}</div>
            <div className="text-[10px] text-muted-foreground">estoque {s.stock}</div>
          </div>
          <div className="text-[11px] tabular font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
            {buying === s.code ? <Loader2 className="animate-spin" size={12} /> : `R$ ${s.price.toFixed(2)}`}
          </div>
        </button>
        <button
          onClick={() => togglePin(s.code)}
          title={isPinned ? "Desfixar" : "Fixar"}
          className={`p-2 mr-1 rounded-lg transition ${
            isPinned ? "text-primary" : "text-muted-foreground/40 opacity-0 group-hover/item:opacity-100 hover:text-primary"
          }`}
        >
          {isPinned ? <Pin size={13} className="fill-current" /> : <Pin size={13} />}
        </button>
      </div>
    </li>
  );

  // Módulo em manutenção quando não há nenhum país habilitado no backend
  if (!loadingC && countries.length === 0) {
    return (
      <div className="max-w-6xl">
        <div className="label-eyebrow">Recebimento</div>
        <h1 className="font-display text-5xl mt-2 mb-8">SMS.</h1>
        <div className="border border-border bg-card p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
          <div className="w-14 h-14 rounded-full bg-paper-2 border border-border flex items-center justify-center mb-4">
            <Phone size={22} className="text-muted-foreground" />
          </div>
          <div className="label-eyebrow mb-2">Indisponível</div>
          <h2 className="font-display text-3xl mb-2">Em manutenção.</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            O módulo SMS está temporariamente indisponível. Volte em instantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="label-eyebrow">Recebimento</div>
      <h1 className="font-display text-5xl mt-2 mb-8">SMS.</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        {/* Sidebar — serviço + país (cards arredondados, estilo sms.online) */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 p-2 bg-card rounded-2xl shadow-sm ring-1 ring-border">
            <button className="flex-1 py-2 text-sm rounded-xl bg-primary text-primary-foreground font-medium">
              Ativação
            </button>
            <button
              disabled
              className="flex-1 py-2 text-sm rounded-xl text-muted-foreground hover:bg-muted/60 transition cursor-not-allowed opacity-60"
              title="Em breve"
            >
              Aluguel
            </button>
          </div>

          {/* Selecione o serviço */}
          <div className="bg-card rounded-2xl shadow-sm ring-1 ring-border p-3 flex flex-col">
            <div className="text-sm font-medium px-1 pt-1 pb-2">Selecione o serviço</div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar"
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper-2 border border-transparent rounded-xl outline-none focus:border-primary focus:bg-card transition"
              />
            </div>
            <div className="h-[calc(100vh-360px)] min-h-[520px] overflow-y-auto -mx-1 px-1">
              {loadingS ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="animate-spin inline" size={14} /> Carregando…
                </div>
              ) : pinned.length === 0 && others.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Nenhum serviço.</div>
              ) : (
                <>
                  {pinned.length > 0 && (
                    <ul className="space-y-1 mb-1">
                      {pinned.map((s) => renderItem(s, true))}
                    </ul>
                  )}
                  <ul className="space-y-1">
                    {others.map((s) => renderItem(s, false))}
                  </ul>
                </>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 px-1 pt-2 mt-2 border-t border-border">
              <Pin size={9} /> Fixe até {MAX_PINS} favoritos por país.
            </div>
          </div>

          {/* Selecione o país */}
          <div className="bg-card rounded-2xl shadow-sm ring-1 ring-border p-3">
            <div className="text-sm font-medium px-1 pt-1 pb-2">Selecione o país</div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpenCountry((v) => !v)}
                className="w-full px-3 py-2 text-sm bg-paper-2 border border-transparent rounded-xl outline-none flex items-center gap-2 hover:border-primary transition"
              >
                {currentCountry?.iso ? (
                  <Flag iso={currentCountry.iso} size={20} />
                ) : (
                  <div className="w-5 h-3.5 bg-muted rounded-sm" />
                )}
                <span className="flex-1 text-left truncate">{currentCountry?.name || "Selecionar país"}</span>
                <ChevronDown size={14} className={`transition ${openCountry ? "rotate-180" : ""}`} />
              </button>

              {openCountry && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-72 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <input
                      autoFocus
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Buscar país…"
                      className="w-full px-2 py-1.5 text-xs bg-paper-2 border border-transparent rounded-lg outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setCountry(c.id); setOpenCountry(false); setCountrySearch(""); }}
                        className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-paper-2 text-left ${
                          c.id === country ? "bg-paper-2 font-medium" : ""
                        }`}
                      >
                        {c.iso ? (
                          <Flag iso={c.iso} size={20} />
                        ) : (
                          <div className="w-5 h-3.5 bg-muted rounded-sm" />
                        )}
                        <span className="flex-1 truncate">{c.name}</span>
                        {c.iso && <span className="text-[10px] font-mono-x text-muted-foreground uppercase">{c.iso}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel principal */}
        <div className="space-y-6">
          {!active ? (
            <div className="rounded-2xl bg-card ring-1 ring-border p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Selecione um serviço à esquerda para comprar um número. O SMS chega em segundos.
                Cancele em até 2 min sem cobrança e receba estorno automático se nada chegar.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card ring-1 ring-border p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="label-eyebrow">{active.country_name}</div>
                  <div className="font-display text-2xl mt-1">{active.service_name}</div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    active.status === "waiting"
                      ? "bg-warning/15 text-warning"
                      : active.status === "received"
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {active.status === "waiting" ? "aguardando SMS" : active.status}
                </span>
              </div>

              <div className="rounded-xl p-4 bg-paper-2">
                <div className="text-xs text-muted-foreground mb-1">Número</div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl tabular">+{active.phone}</span>
                  <button
                    className="p-2 hover:bg-card rounded-lg"
                    onClick={() => { navigator.clipboard.writeText(active.phone); toast.success("Copiado"); }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="rounded-xl p-4 bg-paper-2 min-h-[100px]">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                  Código / SMS
                  {active.status === "waiting" && <Loader2 size={12} className="animate-spin" />}
                </div>
                {active.sms_code ? (
                  <div className="flex items-center gap-2">
                    <span className="font-display text-3xl tabular">{active.sms_code}</span>
                    <button
                      className="p-2 hover:bg-card rounded-lg"
                      onClick={() => { navigator.clipboard.writeText(active.sms_code || ""); toast.success("Copiado"); }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Aguardando SMS chegar…</div>
                )}
                {active.sms_text && active.sms_text !== active.sms_code && (
                  <div className="text-xs text-muted-foreground mt-2 break-all">{active.sms_text}</div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={cancel}
                  className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-paper-2 flex items-center gap-2"
                >
                  <X size={14} /> Cancelar / Estornar
                </button>
                {active.status === "received" && (
                  <button
                    onClick={finish}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl flex items-center gap-2 hover:opacity-90"
                  >
                    <Check size={14} /> Concluir
                  </button>
                )}
                <button
                  onClick={() => smsApi.status(active.id).then((r) => setActive(r.activation))}
                  className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-paper-2 flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Atualizar
                </button>
              </div>

              <div className="text-xs text-muted-foreground">
                Pago: R$ {Number(active.sale_price).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
