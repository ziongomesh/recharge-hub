import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { smsApi, type SmsService, type SmsCountry, type SmsActivation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Search, Phone, Copy, X, Check, RefreshCw, Pin, PinOff, ChevronDown } from "lucide-react";

const PIN_KEY = "sms:pinned"; // { [countryId]: string[] }
const MAX_PINS = 5;

function loadPins(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) || "{}"); } catch { return {}; }
}
function savePins(p: Record<string, string[]>) {
  localStorage.setItem(PIN_KEY, JSON.stringify(p));
}

function flagUrl(iso?: string | null) {
  if (!iso) return null;
  return `https://flagcdn.com/24x18/${iso.toLowerCase()}.png`;
}

// Deriva favicon oficial a partir do nome do serviço (1ª palavra → .com)
function deriveIconUrl(name: string): string | null {
  if (!name) return null;
  const clean = String(name)
    .trim()
    .replace(/[\u00A0]/g, " ")
    .split(/[\s,/+|·•\-—–]/)[0]
    .replace(/[^\w]/g, "")
    .toLowerCase();
  if (!clean || clean.length < 2) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean + ".com")}&sz=128`;
}

function ServiceIcon({ src, name }: { src?: string | null; name: string }) {
  const initial = src || deriveIconUrl(name);
  const [url, setUrl] = useState<string | null>(initial);
  const [stage, setStage] = useState<0 | 1>(0);
  useEffect(() => {
    setUrl(initial);
    setStage(0);
  }, [initial]);

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
        // Brasil sempre no topo
        const sorted = [...c.countries].sort((a, b) => {
          const aBR = a.iso === "BR" || /brasil/i.test(a.name) ? -1 : 0;
          const bBR = b.iso === "BR" || /brasil/i.test(b.name) ? -1 : 0;
          if (aBR !== bBR) return aBR - bBR;
          return a.name.localeCompare(b.name);
        });
        setCountries(sorted);
        const br = sorted.find((x) => x.iso === "BR" || /brasil/i.test(x.name));
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
      <div className="flex items-center hover:bg-paper-2 transition-colors">
        <button
          onClick={() => buy(s)}
          disabled={!!buying || s.stock === 0}
          className="flex-1 px-3 py-2 flex items-center gap-3 disabled:opacity-50 text-left"
        >
          <ServiceIcon src={s.icon_url} name={s.name} />
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{s.name}</div>
            <div className="text-[10px] text-muted-foreground">estoque {s.stock}</div>
          </div>
          <div className="text-sm tabular font-mono-x">
            {buying === s.code ? <Loader2 className="animate-spin" size={14} /> : `R$ ${s.price.toFixed(2)}`}
          </div>
        </button>
        <button
          onClick={() => togglePin(s.code)}
          title={isPinned ? "Desfixar" : "Fixar"}
          className={`p-2 mr-1 rounded transition ${
            isPinned ? "text-foreground" : "text-muted-foreground/40 opacity-0 group-hover/item:opacity-100 hover:text-foreground"
          }`}
        >
          {isPinned ? <Pin size={13} className="fill-current" /> : <Pin size={13} />}
        </button>
      </div>
    </li>
  );

  return (
    <div className="max-w-6xl">
      <div className="label-eyebrow">Recebimento</div>
      <h1 className="font-display text-5xl mt-2 mb-8">SMS.</h1>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        {/* Sidebar serviços */}
        <div className="border border-border bg-card flex flex-col h-[70vh]">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar serviço…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded outline-none focus:border-foreground"
              />
            </div>

            {/* Country dropdown com bandeira */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpenCountry((v) => !v)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded outline-none flex items-center gap-2 hover:border-foreground transition"
              >
                {currentCountry?.iso && (
                  <img src={flagUrl(currentCountry.iso)!} alt="" className="w-5 h-auto" />
                )}
                <span className="flex-1 text-left truncate">{currentCountry?.name || "Selecionar país"}</span>
                <ChevronDown size={14} className={`transition ${openCountry ? "rotate-180" : ""}`} />
              </button>

              {openCountry && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-background border border-border rounded shadow-lg max-h-72 flex flex-col">
                  <div className="p-2 border-b border-border">
                    <input
                      autoFocus
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Buscar país…"
                      className="w-full px-2 py-1.5 text-xs bg-paper-2 border border-border rounded outline-none focus:border-foreground"
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
                          <img src={flagUrl(c.iso)!} alt="" className="w-5 h-auto" loading="lazy" />
                        ) : (
                          <div className="w-5 h-3.5 bg-muted" />
                        )}
                        <span className="flex-1 truncate">{c.name}</span>
                        {c.iso && <span className="text-[10px] font-mono-x text-muted-foreground">{c.iso}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingS ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Loader2 className="animate-spin inline" size={14} /> Carregando…
              </div>
            ) : pinned.length === 0 && others.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum serviço disponível neste país.
              </div>
            ) : (
              <>
                {pinned.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[10px] font-mono-x uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Pin size={10} className="fill-current" /> Fixados ({pinned.length}/{MAX_PINS})
                    </div>
                    <ul className="divide-y divide-border bg-paper-2/30">
                      {pinned.map((s) => renderItem(s, true))}
                    </ul>
                    <div className="rule mx-3 my-1" />
                  </>
                )}
                <ul className="divide-y divide-border">
                  {others.map((s) => renderItem(s, false))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Painel ativação */}
        <div className="border border-border bg-card p-6">
          {!active ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2">
              <Phone size={36} className="opacity-30" />
              <div>Selecione um serviço à esquerda para comprar um número.</div>
              <ul className="mt-6 text-xs text-left space-y-1 max-w-md">
                <li>› Compre o número e use no serviço escolhido</li>
                <li>› O SMS chega aqui em segundos</li>
                <li>› Cancele em até 2min sem cobrança se nada chegar</li>
                <li>› Estorno automático se não receber</li>
                <li>› Fixe até {MAX_PINS} serviços favoritos por país</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="label-eyebrow">{active.country_name}</div>
                  <div className="font-display text-2xl mt-1">{active.service_name}</div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    active.status === "waiting"
                      ? "bg-amber-500/10 text-amber-600"
                      : active.status === "received"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {active.status === "waiting" ? "aguardando SMS" : active.status}
                </span>
              </div>

              <div className="border border-border rounded p-4 bg-background">
                <div className="text-xs text-muted-foreground mb-1">Número</div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl tabular">+{active.phone}</span>
                  <button
                    className="p-2 hover:bg-paper-2 rounded"
                    onClick={() => { navigator.clipboard.writeText(active.phone); toast.success("Copiado"); }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="border border-border rounded p-4 bg-background min-h-[100px]">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                  Código / SMS
                  {active.status === "waiting" && <Loader2 size={12} className="animate-spin" />}
                </div>
                {active.sms_code ? (
                  <div className="flex items-center gap-2">
                    <span className="font-display text-3xl tabular">{active.sms_code}</span>
                    <button
                      className="p-2 hover:bg-paper-2 rounded"
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
                  className="px-4 py-2 text-sm border border-border rounded hover:bg-paper-2 flex items-center gap-2"
                >
                  <X size={14} /> Cancelar / Estornar
                </button>
                {active.status === "received" && (
                  <button
                    onClick={finish}
                    className="px-4 py-2 text-sm bg-foreground text-background rounded flex items-center gap-2"
                  >
                    <Check size={14} /> Concluir
                  </button>
                )}
                <button
                  onClick={() => smsApi.status(active.id).then((r) => setActive(r.activation))}
                  className="px-4 py-2 text-sm border border-border rounded hover:bg-paper-2 flex items-center gap-2"
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
