import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Search, ShoppingCart } from "lucide-react";
import { smsApi, type SmsCountry, type SmsService } from "@/lib/api";

const fmt = (n: number) =>
  `R$ ${Number(n || 0).toFixed(3).replace(".", ",")}`;
const fmtInt = (n: number) => Number(n || 0).toLocaleString("pt-BR");

// Bandeira via API pública pelo nome do país (fallback emoji)
function flagFor(country: SmsCountry) {
  const iso = (country.iso || "").toLowerCase();
  if (iso && iso.length === 2) return `https://flagcdn.com/w40/${iso}.png`;
  return null;
}

export default function PrecosPage() {
  const navigate = useNavigate();
  const [countries, setCountries] = useState<SmsCountry[]>([]);
  const [services, setServices] = useState<SmsService[]>([]);
  const [serviceCode, setServiceCode] = useState<string>("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [rows, setRows] = useState<{ country: SmsCountry; price: number; stock: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [openServiceList, setOpenServiceList] = useState(false);

  // Carrega países + serviços (do Brasil pra ter um catálogo inicial)
  useEffect(() => {
    smsApi.countries().then((r) => setCountries(r.countries)).catch(() => {});
    smsApi.services(73).then((r) => {
      setServices(r.services);
      if (r.services[0]) setServiceCode(r.services[0].code);
    }).catch(() => {});
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s.code === serviceCode) || null,
    [services, serviceCode]
  );

  // Busca preços do serviço selecionado em vários países
  useEffect(() => {
    if (!serviceCode || countries.length === 0) return;
    setLoading(true);
    const enabled = countries.filter((c) => c.enabled !== false).slice(0, 60);
    Promise.allSettled(
      enabled.map((c) =>
        smsApi.services(c.id).then((r) => {
          const found = r.services.find((s) => s.code === serviceCode);
          return found ? { country: c, price: found.price, stock: found.stock } : null;
        })
      )
    ).then((res) => {
      const list = res
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((x): x is { country: SmsCountry; price: number; stock: number } => !!x && x.stock > 0);
      list.sort((a, b) => a.price - b.price);
      setRows(list);
      setLoading(false);
    });
  }, [serviceCode, countries]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => r.country.name.toLowerCase().includes(q));
  }, [rows, countryQuery]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.toLowerCase().trim();
    if (!q) return services;
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [services, serviceQuery]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Blobs de fundo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-[hsl(320_80%_75%)]/25 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 py-4">
          <Link to="/" className="leading-none">
            <div className="font-display text-2xl text-primary tracking-tight">cometa</div>
            <div className="font-mono-x text-[10px] text-primary tracking-[0.42em] -mt-0.5 text-center">sms</div>
          </Link>
          <button
            onClick={() => navigate("/login")}
            className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90"
          >
            Área do cliente
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
          <Link to="/" className="hover:text-primary">CometaSMS</Link>
          <ChevronRight size={12} />
          <span>Ajuda</span>
          <ChevronRight size={12} />
          <span className="text-foreground">Lista de preços</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-5xl tracking-tight text-foreground">
          Preços de números virtuais temporários para receber SMS
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha o serviço ou país desejado na tabela abaixo
        </p>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,260px)_1fr_auto]">
            {/* Seletor de serviço */}
            <div className="relative">
              <button
                onClick={() => setOpenServiceList((v) => !v)}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm hover:border-primary/40"
              >
                <span className="flex items-center gap-2 truncate">
                  {selectedService?.icon_url && (
                    <img src={selectedService.icon_url} alt="" className="h-4 w-4 object-contain" />
                  )}
                  <span className="truncate">{selectedService?.name || "Selecione o serviço"}</span>
                </span>
                <ChevronRight size={14} className={`transition-transform ${openServiceList ? "rotate-90" : ""}`} />
              </button>
              {openServiceList && (
                <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-popover shadow-lg">
                  <div className="p-2 sticky top-0 bg-popover border-b border-border/60">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        autoFocus
                        value={serviceQuery}
                        onChange={(e) => setServiceQuery(e.target.value)}
                        placeholder="Buscar serviço"
                        className="w-full rounded-lg bg-secondary/50 pl-8 pr-2 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  {filteredServices.map((s) => (
                    <button
                      key={s.code}
                      onClick={() => { setServiceCode(s.code); setOpenServiceList(false); setServiceQuery(""); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 text-left ${s.code === serviceCode ? "bg-secondary/40" : ""}`}
                    >
                      {s.icon_url && <img src={s.icon_url} alt="" className="h-4 w-4 object-contain" />}
                      <span className="flex-1 truncate">{s.name}</span>
                    </button>
                  ))}
                  {filteredServices.length === 0 && (
                    <div className="px-3 py-4 text-xs text-muted-foreground text-center">Nada encontrado</div>
                  )}
                </div>
              )}
            </div>

            {/* Busca país */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
                placeholder="Buscar país"
                className="w-full rounded-xl border border-border/60 bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary/40"
              />
            </div>

            <button
              onClick={() => navigate("/login")}
              className="rounded-xl border border-primary/40 bg-primary/10 text-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary/15"
            >
              Buscar por serviço
            </button>
          </div>

          {/* Tabela */}
          <div className="mt-5 overflow-hidden rounded-xl border border-border/60">
            <div className="grid grid-cols-[1fr_120px_120px] px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
              <div>País</div>
              <div className="text-right">Preço</div>
              <div className="text-right">Quantidade</div>
            </div>
            <div className="max-h-[560px] overflow-y-auto divide-y divide-border/50">
              {loading && (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">Carregando preços…</div>
              )}
              {!loading && filteredCountries.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum país disponível para este serviço.
                </div>
              )}
              {!loading && filteredCountries.map(({ country, price, stock }) => {
                const flag = flagFor(country);
                return (
                  <div key={country.id} className="grid grid-cols-[1fr_120px_120px] items-center px-4 py-3 text-sm hover:bg-secondary/30 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex h-7 w-9 items-center justify-center overflow-hidden rounded-md bg-secondary shrink-0">
                        {flag ? (
                          <img src={flag} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-xs">🏳️</span>
                        )}
                      </span>
                      <span className="truncate text-foreground">{country.name}</span>
                    </div>
                    <div className="text-right font-medium text-foreground">{fmt(price)}</div>
                    <div className="text-right text-muted-foreground">{fmtInt(stock)} un.</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 mt-6 flex justify-center">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-lg hover:bg-primary/90"
          >
            <ShoppingCart size={16} />
            Comprar número
          </button>
        </div>
      </main>
    </div>
  );
}
