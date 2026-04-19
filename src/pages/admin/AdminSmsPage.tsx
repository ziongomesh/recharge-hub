import { useEffect, useState } from "react";
import { smsApi, type SmsAdminService, type SmsCountry, type SmsActivation, type SmsCountryPriceItem } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search } from "lucide-react";
import AdminBalanceHero from "@/components/AdminBalanceHero";

type Tab = "services" | "countries" | "brprices" | "activations" | "config";

// Fallback: deriva favicon do nome do serviço quando icon_url não vem do backend
function fallbackIcon(name: string): string {
  const slug = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  if (!slug) return "";
  return `https://www.google.com/s2/favicons?sz=64&domain=${slug}.com`;
}

function ServiceIcon({ url, name }: { url: string | null; name: string }) {
  const src = url || fallbackIcon(name);
  if (!src) return <div className="w-7 h-7 bg-muted rounded" />;
  return (
    <img
      src={src}
      alt=""
      className="w-7 h-7 rounded"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  );
}

export default function AdminSmsPage() {
  const [tab, setTab] = useState<Tab>("services");
  const [services, setServices] = useState<SmsAdminService[]>([]);
  const [countries, setCountries] = useState<SmsCountry[]>([]);
  const [activations, setActivations] = useState<SmsActivation[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [, setBalance] = useState<{ raw: string; balance: number | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [brPrices, setBrPrices] = useState<SmsCountryPriceItem[]>([]);
  const [brRate, setBrRate] = useState<number>(0.06);
  const [brLoading, setBrLoading] = useState(false);
  const [brEdits, setBrEdits] = useState<Record<string, string>>({});
  const [brSaving, setBrSaving] = useState<Record<string, boolean>>({});

  const loadBrPrices = async () => {
    setBrLoading(true);
    try {
      const r = await smsApi.adminCountryPrices(73);
      setBrPrices(r.items);
      setBrRate(r.rate);
      setBrEdits({});
    } catch (e: any) { toast.error(e.message); }
    finally { setBrLoading(false); }
  };

  const saveBrPrice = async (code: string) => {
    const raw = brEdits[code];
    const sale = raw === "" || raw == null ? null : parseFloat(raw.replace(",", "."));
    if (sale != null && (isNaN(sale) || sale < 0)) { toast.error("Preço inválido"); return; }
    setBrSaving((s) => ({ ...s, [code]: true }));
    try {
      await smsApi.adminUpdateCountryPrice(code, 73, { sale_price_brl: sale });
      setBrPrices((arr) => arr.map((x) => x.code === code ? {
        ...x,
        sale_price_brl: sale,
        effective_price_brl: sale != null ? sale : x.computed_price_brl,
      } : x));
      setBrEdits((e) => { const n = { ...e }; delete n[code]; return n; });
      toast.success("Preço salvo");
    } catch (e: any) { toast.error(e.message); }
    finally { setBrSaving((s) => { const n = { ...s }; delete n[code]; return n; }); }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, c, a, cfg, bal] = await Promise.all([
        smsApi.adminServices(),
        smsApi.adminCountries(),
        smsApi.adminActivations(),
        smsApi.adminConfig(),
        smsApi.adminBalance().catch(() => null),
      ]);
      setServices(s.services);
      setCountries(c.countries);
      setActivations(a.activations);
      setConfig(cfg.config);
      if (bal) setBalance(bal);
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await smsApi.adminSyncAll();
      toast.success(`Sincronizado: ${r.services} serviços, ${r.countries} países, ${r.prices} preços`);
      await loadAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const updateService = async (code: string, patch: Partial<SmsAdminService>) => {
    setServices((arr) => arr.map((s) => (s.code === code ? { ...s, ...patch } : s)));
    try { await smsApi.adminUpdateService(code, patch); }
    catch (e: any) { toast.error(e.message); loadAll(); }
  };
  const updateCountry = async (id: number, enabled: boolean) => {
    setCountries((arr) => arr.map((c) => (c.id === id ? { ...c, enabled } : c)));
    try { await smsApi.adminUpdateCountry(id, { enabled }); }
    catch (e: any) { toast.error(e.message); loadAll(); }
  };
  const saveConfig = async () => {
    try { await smsApi.adminUpdateConfig(config); toast.success("Configurações salvas"); }
    catch (e: any) { toast.error(e.message); }
  };

  const filteredServices = services.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCountries = countries.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="label-eyebrow">Módulo</div>
          <h1 className="font-display text-4xl mt-1">SMS.</h1>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="px-3 py-2 text-sm bg-foreground text-background rounded flex items-center gap-2 disabled:opacity-50"
        >
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Sincronizar API
        </button>
      </div>

      {/* Saldo grande da API hero-sms */}
      <div className="mb-6">
        <AdminBalanceHero
          label="Hero-SMS"
          fetcher={async () => {
            const r = await smsApi.adminBalance();
            return {
              balance: r.balance,
              extra: r.balance_rub != null ? `≈ ₽ ${r.balance_rub.toFixed(2)} · taxa 1₽=R$${r.rate.toFixed(4)}` : null,
            };
          }}
        />
      </div>

      <div className="flex gap-1 border-b border-border mb-5 flex-wrap">
        {([
          ["services", `Serviços (${services.length})`],
          ["countries", `Países (${countries.length})`],
          ["brprices", "Preços Brasil"],
          ["activations", `Ativações (${activations.length})`],
          ["config", "Configurações"],
        ] as [Tab, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setTab(k);
              if (k === "brprices" && brPrices.length === 0) loadBrPrices();
            }}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              tab === k ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >{label}</button>
        ))}
      </div>

      {(tab === "services" || tab === "countries" || tab === "brprices") && (
        <div className="relative mb-4 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded outline-none"
          />
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground"><Loader2 className="inline animate-spin" size={14} /> Carregando…</div>
      ) : tab === "services" ? (
        services.length === 0 ? (
          <div className="border border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum serviço sincronizado. Clique em "Sincronizar API".
          </div>
        ) : (
          <div className="border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-2 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3"></th>
                  <th className="text-left p-3">Código</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-center p-3">Ativo</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((s) => (
                  <tr key={s.code} className="border-t border-border">
                    <td className="p-3 w-8">
                      <ServiceIcon url={s.icon_url} name={s.name} />
                    </td>
                    <td className="p-3 font-mono-x text-xs">{s.code}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!s.enabled}
                        onChange={(e) => updateService(s.code, { enabled: e.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === "countries" ? (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={async () => {
                if (!confirm("Ativar SMS apenas para o Brasil (desativa os demais)?")) return;
                try {
                  const r = await smsApi.adminBulkCountries("brazil");
                  toast.success(`Brasil ativado (${r.affected} registro(s))`);
                  loadAll();
                } catch (e: any) { toast.error(e.message); }
              }}
              className="px-3 py-1.5 text-xs bg-foreground text-background rounded"
            >
              Ativar só Brasil
            </button>
            <button
              onClick={async () => {
                if (!confirm("Ativar SMS para TODOS os países?")) return;
                try {
                  const r = await smsApi.adminBulkCountries("all");
                  toast.success(`${r.affected} países ativados`);
                  loadAll();
                } catch (e: any) { toast.error(e.message); }
              }}
              className="px-3 py-1.5 text-xs border border-border rounded hover:bg-paper-2"
            >
              Ativar todos
            </button>
            <button
              onClick={async () => {
                if (!confirm("Desativar TODOS os países?")) return;
                try {
                  const r = await smsApi.adminBulkCountries("none");
                  toast.success(`${r.affected} países desativados`);
                  loadAll();
                } catch (e: any) { toast.error(e.message); }
              }}
              className="px-3 py-1.5 text-xs border border-border rounded hover:bg-paper-2 text-muted-foreground"
            >
              Desativar todos
            </button>
          </div>
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">ISO</th>
                <th className="text-center p-3">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {filteredCountries.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-mono-x text-xs">{c.id}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3 text-xs text-muted-foreground">{c.iso || "—"}</td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!c.enabled}
                      onChange={(e) => updateCountry(c.id, e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : tab === "brprices" ? (
        brLoading ? (
          <div className="text-sm text-muted-foreground"><Loader2 className="inline animate-spin" size={14} /> Carregando preços do Brasil…</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
              <div>
                Taxa atual: <span className="font-mono-x">1 ₽ ≈ R$ {brRate.toFixed(4)}</span> ·
                {" "}{brPrices.filter(p => p.has_price).length} serviços com preço
              </div>
              <button onClick={loadBrPrices} className="px-2 py-1 border border-border rounded hover:bg-paper-2 flex items-center gap-1">
                <RefreshCw size={12} /> Recarregar
              </button>
            </div>
            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper-2 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-3"></th>
                    <th className="text-left p-3">Serviço</th>
                    <th className="text-right p-3">Custo (₽)</th>
                    <th className="text-right p-3">Custo (R$)</th>
                    <th className="text-right p-3">Estoque</th>
                    <th className="text-right p-3">Preço de venda (R$)</th>
                    <th className="text-right p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {brPrices
                    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
                    .map((p) => {
                      const editVal = brEdits[p.code];
                      const currentDisplay = editVal != null
                        ? editVal
                        : (p.sale_price_brl != null ? p.sale_price_brl.toFixed(2) : "");
                      const dirty = editVal != null;
                      return (
                        <tr key={p.code} className={`border-t border-border ${!p.has_price ? "opacity-50" : ""}`}>
                          <td className="p-3 w-8">
                            <ServiceIcon url={p.icon_url} name={p.name} />
                          </td>
                          <td className="p-3">
                            <div>{p.name}</div>
                            <div className="text-xs text-muted-foreground font-mono-x">{p.code}</div>
                          </td>
                          <td className="p-3 text-right tabular text-xs text-muted-foreground">
                            {p.cost_rub != null ? p.cost_rub.toFixed(2) : "—"}
                          </td>
                          <td className="p-3 text-right tabular">
                            {p.cost_brl != null ? p.cost_brl.toFixed(2) : "—"}
                          </td>
                          <td className="p-3 text-right tabular text-xs text-muted-foreground">
                            {p.stock}
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder={p.computed_price_brl != null ? p.computed_price_brl.toFixed(2) : "—"}
                              value={currentDisplay}
                              onChange={(e) => setBrEdits((s) => ({ ...s, [p.code]: e.target.value }))}
                              disabled={!p.has_price}
                              className="w-24 text-right px-2 py-1 bg-background border border-border rounded text-sm font-mono-x"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => saveBrPrice(p.code)}
                              disabled={!dirty || !p.has_price || brSaving[p.code]}
                              className="px-2 py-1 text-xs bg-foreground text-background rounded disabled:opacity-30"
                            >
                              {brSaving[p.code] ? "…" : dirty ? "Salvar" : "—"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Defina manualmente o preço de venda em R$ que será cobrado do usuário. O custo (R$) é a conversão do custo da hero-sms.
            </p>
          </>
        )
      ) : tab === "activations" ? (
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Usuário</th>
                <th className="text-left p-3">Serviço</th>
                <th className="text-left p-3">País</th>
                <th className="text-left p-3">Telefone</th>
                <th className="text-left p-3">Código</th>
                <th className="text-right p-3">R$</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Quando</th>
              </tr>
            </thead>
            <tbody>
              {activations.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3 font-mono-x text-xs">{a.id}</td>
                  <td className="p-3">{a.username}</td>
                  <td className="p-3">{a.service_name}</td>
                  <td className="p-3">{a.country_name}</td>
                  <td className="p-3 font-mono-x text-xs">+{a.phone}</td>
                  <td className="p-3 font-mono-x text-xs">{a.sms_code || "—"}</td>
                  <td className="p-3 text-right tabular">{Number(a.sale_price).toFixed(2)}</td>
                  <td className="p-3 text-xs">{a.status}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-border bg-card p-6 max-w-md space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Taxa RUB → BRL</label>
            <input
              type="number" step="0.0001"
              value={config.rub_to_brl || ""}
              onChange={(e) => setConfig({ ...config, rub_to_brl: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Conversão do custo da hero-sms (em rublos) para BRL.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Os preços de venda são definidos manualmente em <strong>Preços Brasil</strong>.
          </p>
          <button onClick={saveConfig} className="px-4 py-2 bg-foreground text-background rounded text-sm">Salvar</button>
        </div>
      )}
    </div>
  );
}
