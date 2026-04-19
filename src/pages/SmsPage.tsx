import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { smsApi, type SmsService, type SmsCountry, type SmsActivation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Search, Phone, Copy, X, Check, RefreshCw } from "lucide-react";

export default function SmsPage() {
  const [countries, setCountries] = useState<SmsCountry[]>([]);
  const [country, setCountry] = useState<number | null>(null);
  const [services, setServices] = useState<SmsService[]>([]);
  const [search, setSearch] = useState("");
  const [loadingC, setLoadingC] = useState(true);
  const [loadingS, setLoadingS] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [active, setActive] = useState<SmsActivation | null>(null);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, a] = await Promise.all([smsApi.countries(), smsApi.active()]);
        setCountries(c.countries);
        const br = c.countries.find((x) => x.iso === "BR" || /brasil/i.test(x.name));
        setCountry(br?.id ?? c.countries[0]?.id ?? null);
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [services, search]);

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
            <select
              value={country ?? ""}
              onChange={(e) => setCountry(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded outline-none"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingS ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Loader2 className="animate-spin inline" size={14} /> Carregando…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum serviço disponível neste país.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((s) => (
                  <li key={s.code}>
                    <button
                      onClick={() => buy(s)}
                      disabled={!!buying || s.stock === 0}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-paper-2 disabled:opacity-50 text-left transition-colors"
                    >
                      {s.icon_url ? (
                        <img src={s.icon_url} alt="" className="w-7 h-7 rounded object-cover bg-muted" />
                      ) : (
                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-medium">
                          {s.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground">estoque {s.stock}</div>
                      </div>
                      <div className="text-sm tabular font-mono-x">
                        {buying === s.code ? <Loader2 className="animate-spin" size={14} /> : `R$ ${s.price.toFixed(2)}`}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
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
