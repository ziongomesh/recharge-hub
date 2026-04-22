function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    // Em localhost mantém localhost; em qualquer outro host usa o mesmo IP/domínio na porta 4000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000/api";
    }
    return `${protocol}//${hostname}:4000/api`;
  }
  return "http://localhost:4000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function removeToken() {
  localStorage.removeItem("token");
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeUser(user: User): User {
  return {
    ...user,
    balance: toNumber(user.balance),
  };
}

function normalizePlano(plano: Plano): Plano {
  return {
    ...plano,
    amount: toNumber(plano.amount),
    cost: toNumber(plano.cost),
  };
}

function normalizePagamento(pagamento: Pagamento): Pagamento {
  return {
    ...pagamento,
    amount: toNumber(pagamento.amount),
  };
}

function normalizeRecarga(recarga: Recarga): Recarga {
  return {
    ...recarga,
    amount: toNumber(recarga.amount),
    cost: toNumber(recarga.cost),
  };
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseText = await res.text();
  const contentType = res.headers.get("content-type") || "";
  const looksLikeJson = contentType.includes("application/json");
  let responseData: unknown = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      if (looksLikeJson) {
        throw new Error("Resposta inválida da API");
      }

      if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
        throw new Error("API respondeu HTML em vez de JSON. Verifique o backend e o VITE_API_BASE_URL.");
      }

      throw new Error(responseText.slice(0, 120));
    }
  }

  if (!res.ok) {
    const errorMessage =
      (responseData && typeof responseData === "object" && "message" in responseData && typeof responseData.message === "string" && responseData.message) ||
      responseText ||
      `Erro ${res.status}`;
    throw new Error(errorMessage);
  }

  return responseData as T;
}

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api<{ token: string; user: User }>("/auth/login", { method: "POST", body: data }).then((response) => ({
      ...response,
      user: normalizeUser(response.user),
    })),
  register: (data: { username: string; email: string; password: string; phone: string; cpf: string }) =>
    api<{ token: string; user: User }>("/auth/register", { method: "POST", body: data }).then((response) => ({
      ...response,
      user: normalizeUser(response.user),
    })),
  me: () =>
    api<{ user: User; adminVerified?: boolean }>("/auth/me").then((response) => ({
      user: normalizeUser(response.user),
      adminVerified: !!response.adminVerified,
    })),
  verifyPin: (pin: string) =>
    api<{ token: string; user: User }>("/auth/verify-pin", { method: "POST", body: { pin } }).then((r) => ({
      ...r,
      user: normalizeUser(r.user),
    })),
  setupPin: (pin: string, confirmPin: string) =>
    api<{ token: string; user: User }>("/auth/setup-pin", { method: "POST", body: { pin, confirmPin } }).then((r) => ({
      ...r,
      user: normalizeUser(r.user),
    })),
  changePin: (newPin: string) =>
    api<{ message: string }>("/auth/change-pin", { method: "POST", body: { newPin } }),
};

// Operadoras
export const operadorasApi = {
  list: () => api<{ operadoras: Operadora[] }>("/operadoras"),
  sync: () => api<{ message: string; operadoras: Operadora[] }>("/operadoras/sync", { method: "POST" }),
  poekiStatus: () => api<{ poeki: { operator: string; enabled: boolean }[]; key_tail: string }>("/operadoras/poeki-status"),
  update: (id: number, data: Partial<Operadora>) =>
    api<Operadora>(`/operadoras/${id}`, { method: "PUT", body: data }),
};

// Planos
export const planosApi = {
  listByOperadora: (operadoraId: number) =>
    api<{ planos: Plano[] }>(`/planos?operadora_id=${operadoraId}`).then((response) => ({
      planos: response.planos.map(normalizePlano),
    })),
  listAll: () =>
    api<{ planos: Plano[] }>(`/planos`).then((response) => ({
      planos: response.planos.map(normalizePlano),
    })),
  sync: () => api<{ message: string; synced: number }>("/planos/sync", { method: "POST" }),
  markup: (data: { operadora_id?: number; percent: number }) =>
    api<{ message: string; affected: number }>("/planos/markup", { method: "POST", body: data }),
  poekiBalance: () => api<{ data?: { balance?: number }; balance?: number } & Record<string, unknown>>("/planos/poeki-balance"),
  create: (data: Omit<Plano, "id">) =>
    api<Plano>("/planos", { method: "POST", body: data }).then((plano) => normalizePlano(plano)),
  update: (id: number, data: Partial<Plano>) =>
    api<Plano>(`/planos/${id}`, { method: "PUT", body: data }).then((plano) => normalizePlano(plano)),
  delete: (id: number) => api(`/planos/${id}`, { method: "DELETE" }),
};

// Recargas
export const recargasApi = {
  detectOperator: (phone: string) =>
    api<{ operator: string | null; enabled?: boolean; message?: string }>("/recargas/detect", { method: "POST", body: { phone } }),
  checkPhone: (phoneNumber: string, carrierName?: string) =>
    api<{ status: string; message: string; isCooldown: boolean; isBlacklisted: boolean }>(
      "/recargas/check-phone", { method: "POST", body: { phoneNumber, carrierName } }
    ),
  create: (data: { operadora_id: number; phone: string; plano_id: number }) =>
    api<{ recarga: Recarga }>("/recargas", { method: "POST", body: data }).then((response) => ({
      recarga: normalizeRecarga(response.recarga),
    })),
  get: (id: number) =>
    api<{ recarga: Recarga }>(`/recargas/${id}`).then((response) => ({
      recarga: normalizeRecarga(response.recarga),
    })),
  sync: (id: number) =>
    api<{ recarga: Recarga; source: string; poekiStatus: string | null; error?: string }>(`/recargas/${id}/sync`).then((response) => ({
      ...response,
      recarga: normalizeRecarga(response.recarga),
    })),
  list: (params?: string) =>
    api<{ recargas: Recarga[]; total: number }>(`/recargas${params ? `?${params}` : ""}`).then((response) => ({
      ...response,
      recargas: response.recargas.map(normalizeRecarga),
    })),
  listAll: (params?: string) =>
    api<{ recargas: Recarga[]; total: number }>(`/admin/recargas${params ? `?${params}` : ""}`).then((response) => ({
      ...response,
      recargas: response.recargas.map(normalizeRecarga),
    })),
  syncAll: (scope: "mine" | "all" = "mine") =>
    api<{ scope: string; total: number; changed: number; errors: number }>(
      "/recargas/sync-all", { method: "POST", body: { scope } }
    ),
};

// Pagamentos
export const pagamentosApi = {
  deposit: (amount: number) =>
    api<{ pagamento: Pagamento; qrCode: string; qrCodeBase64: string; pixCopiaECola: string }>(
      "/pagamentos/deposit", { method: "POST", body: { amount } }
    ).then((response) => ({
      ...response,
      qrCode: response.qrCode || "",
      qrCodeBase64: response.qrCodeBase64 || "",
      pixCopiaECola: response.pixCopiaECola || "",
      pagamento: normalizePagamento(response.pagamento),
    })),
  checkStatus: (txId: string) =>
    api<{ status: string; pagamento: Pagamento }>(`/pagamentos/status/${txId}`).then((response) => ({
      ...response,
      pagamento: normalizePagamento(response.pagamento),
    })),
  list: (params?: string) =>
    api<{ pagamentos: Pagamento[]; total: number }>(`/pagamentos${params ? `?${params}` : ""}`).then((response) => ({
      ...response,
      pagamentos: response.pagamentos.map(normalizePagamento),
    })),
  adminBalance: (module?: "recargas" | "esim" | "sms") =>
    api<{ balance: number; blocked?: number; module?: string | null; usingFallback?: boolean; raw?: unknown }>(
      `/pagamentos/admin/balance${module ? `?module=${module}` : ""}`
    ),
};

export const noticiasApi = {
  list: () => api<{ noticias: Noticia[] }>("/noticias"),
  create: (data: { title: string; content: string; pinned?: boolean }) =>
    api<Noticia>("/noticias", { method: "POST", body: data }),
  update: (id: number, data: Partial<Noticia>) =>
    api<Noticia>(`/noticias/${id}`, { method: "PUT", body: data }),
  delete: (id: number) => api(`/noticias/${id}`, { method: "DELETE" }),
};

// eSIM
export interface EsimProduto {
  id: number;
  name: string;
  operadora: string;
  amount: number;
  observacao: string;
  enabled?: boolean;
  stock?: number;
  created_at?: string;
}
export interface EsimVenda {
  id: number;
  produto_name: string;
  operadora: string;
  amount: number;
  observacao: string;
  created_at?: string;
}
export interface EsimEstoqueItem {
  id: number;
  qr_image: string;
  created_at: string;
}
export const esimApi = {
  // user
  produtos: () =>
    api<{ produtos: EsimProduto[] }>("/esim/produtos").then((r) => ({
      produtos: r.produtos.map((p) => ({ ...p, amount: toNumber(p.amount), stock: toNumber(p.stock) })),
    })),
  comprar: (produtoId: number) =>
    api<{ venda: EsimVenda; qr: string | null }>(`/esim/comprar/${produtoId}`, { method: "POST" }).then((r) => ({
      ...r,
      venda: { ...r.venda, amount: toNumber(r.venda.amount) },
    })),
  minhas: () =>
    api<{ vendas: EsimVenda[] }>("/esim/minhas").then((r) => ({
      vendas: r.vendas.map((v) => ({ ...v, amount: toNumber(v.amount) })),
    })),
  // admin
  adminProdutos: () =>
    api<{ produtos: EsimProduto[] }>("/esim/admin/produtos").then((r) => ({
      produtos: r.produtos.map((p) => ({ ...p, amount: toNumber(p.amount), stock: toNumber(p.stock) })),
    })),
  adminCreate: (data: { name: string; operadora: string; amount: number; observacao?: string; enabled?: boolean }) =>
    api<{ id: number }>("/esim/admin/produtos", { method: "POST", body: data }),
  adminUpdate: (id: number, data: Partial<EsimProduto>) =>
    api(`/esim/admin/produtos/${id}`, { method: "PUT", body: data }),
  adminDelete: (id: number) => api(`/esim/admin/produtos/${id}`, { method: "DELETE" }),
  adminEstoque: (id: number) =>
    api<{ estoque: EsimEstoqueItem[] }>(`/esim/admin/produtos/${id}/estoque`),
  adminUploadEstoque: async (id: number, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const token = localStorage.getItem("token");
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
    const res = await fetch(`${base}/esim/admin/produtos/${id}/estoque`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Erro upload");
    return res.json() as Promise<{ added: number }>;
  },
  adminDeleteEstoque: (estoqueId: number) =>
    api(`/esim/admin/estoque/${estoqueId}`, { method: "DELETE" }),
};

// SMS (hero-sms)
export interface SmsService {
  code: string;
  name: string;
  icon_url: string | null;
  stock: number;
  price: number;
}
export interface SmsCountry {
  id: number;
  name: string;
  iso?: string | null;
  enabled?: boolean;
}
export interface SmsActivation {
  id: number;
  hero_id: string;
  service_code: string;
  service_name: string;
  country_id: number;
  country_name: string | null;
  phone: string;
  cost: number;
  sale_price: number;
  status: "waiting" | "received" | "canceled" | "finished" | "expired" | "refunded";
  sms_code: string | null;
  sms_text: string | null;
  created_at: string;
  expires_at?: string | null;
  username?: string;
}
export interface SmsAdminService {
  code: string;
  name: string;
  icon_url: string | null;
  enabled: boolean;
  default_markup_percent: number;
}
export const smsApi = {
  countries: () => api<{ countries: SmsCountry[] }>("/sms/countries"),
  services: (countryId: number) =>
    api<{ services: SmsService[] }>(`/sms/services?country=${countryId}`).then((r) => ({
      services: r.services.map((s) => ({ ...s, price: toNumber(s.price), stock: toNumber(s.stock) })),
    })),
  buy: (service: string, country: number) =>
    api<{ activation: SmsActivation }>("/sms/buy", { method: "POST", body: { service, country } }),
  status: (id: number) => api<{ activation: SmsActivation }>(`/sms/activations/${id}`),
  cancel: (id: number) => api(`/sms/activations/${id}/cancel`, { method: "POST" }),
  finish: (id: number) => api(`/sms/activations/${id}/finish`, { method: "POST" }),
  active: () => api<{ activations: SmsActivation[] }>("/sms/active"),
  history: () => api<{ activations: SmsActivation[] }>("/sms/history"),
  adminBalance: () =>
    api<{ raw: string; balance: number | null; balance_rub: number | null; balance_brl: number | null; rate: number }>(
      "/sms/admin/balance"
    ),
  adminSyncAll: () =>
    api<{ ok: true; services: number; countries: number; prices: number }>("/sms/admin/sync-all", { method: "POST" }),
  adminServices: () => api<{ services: SmsAdminService[] }>("/sms/admin/services"),
  adminUpdateService: (code: string, data: Partial<SmsAdminService>) =>
    api(`/sms/admin/services/${code}`, { method: "PUT", body: data }),
  adminCountries: () => api<{ countries: SmsCountry[] }>("/sms/admin/countries"),
  adminUpdateCountry: (id: number, data: { enabled: boolean }) =>
    api(`/sms/admin/countries/${id}`, { method: "PUT", body: data }),
  adminBulkCountries: (scope: "all" | "brazil" | "none") =>
    api<{ ok: true; affected: number }>("/sms/admin/countries/bulk", { method: "POST", body: { scope } }),
  adminConfig: () => api<{ config: Record<string, string> }>("/sms/admin/config"),
  adminUpdateConfig: (data: Record<string, string>) =>
    api("/sms/admin/config", { method: "PUT", body: data }),
  adminActivations: () => api<{ activations: SmsActivation[] }>("/sms/admin/activations"),
  adminCountryPrices: (countryId = 73) =>
    api<{ country: number; rate: number; items: SmsCountryPriceItem[] }>(
      `/sms/admin/country-prices?country=${countryId}`
    ),
  adminUpdateCountryPrice: (
    code: string,
    countryId: number,
    data: { sale_price_brl: number | null; enabled?: boolean }
  ) =>
    api(`/sms/admin/country-prices/${code}/${countryId}`, { method: "PUT", body: data }),
};

export interface SmsCountryPriceItem {
  code: string;
  name: string;
  icon_url: string | null;
  service_enabled: boolean;
  price_enabled: boolean;
  has_price: boolean;
  cost_rub: number | null;
  cost_brl: number | null;
  stock: number;
  sale_price_brl: number | null;
  computed_price_brl: number | null;
  effective_price_brl: number | null;
}

// Admin
export const adminApi = {
  users: {
    list: (search?: string, role?: string) => {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (role) qs.set("role", role);
      const q = qs.toString();
      return api<{ users: User[] }>(`/admin/users${q ? `?${q}` : ""}`).then((r) => ({
        users: r.users.map(normalizeUser),
      }));
    },
    staff: () =>
      api<{ users: User[] }>(`/admin/staff`).then((r) => ({ users: r.users.map(normalizeUser) })),
    update: (id: number, data: Partial<User>) =>
      api<User>(`/admin/users/${id}`, { method: "PUT", body: data }).then((user) => normalizeUser(user)),
    delete: (id: number) => api(`/admin/users/${id}`, { method: "DELETE" }),
    full: (id: number) =>
      api<{
        user: User;
        stats: { total_recargas: number; total_recarregado: number; total_gasto: number; total_depositos: number; total_depositado: number };
        recargas: Recarga[];
        pagamentos: Pagamento[];
        logs: ActivityLog[];
      }>(`/admin/users/${id}/full`).then((r) => ({
        ...r,
        user: normalizeUser(r.user),
        recargas: r.recargas.map(normalizeRecarga),
        pagamentos: r.pagamentos.map(normalizePagamento),
      })),
  },
  pagamentos: (params?: string) =>
    api<{ pagamentos: (Pagamento & { username?: string })[]; total: number }>(
      `/admin/pagamentos${params ? `?${params}` : ""}`
    ).then((r) => ({ ...r, pagamentos: r.pagamentos.map((p) => ({ ...p, amount: toNumber(p.amount) })) })),
  logs: (params?: string) => api<{ logs: ActivityLog[]; total: number }>(`/admin/logs${params ? `?${params}` : ""}`),
  stats: () =>
    api<{
      totals: Record<string, number>;
      statusBreakdown: { status: string; count: number }[];
      topRecarregadores: { id: number; username: string; qtd: number; total: number }[];
      topPedidos: { id: number; username: string; qtd: number }[];
      latestUsers: { id: number; username: string; email: string; created_at: string }[];
      dailyVolume: { dia: string; qtd: number; volume: number }[];
      byOperadora: { name: string; qtd: number; volume: number }[];
    }>("/admin/stats"),
};

// Status agregado dos módulos
export interface ModuleStatus {
  maintenance: boolean;
  apiOk: boolean;
  paymentOk: boolean;
  online: boolean;
  reason?: string | null;
  operadoras?: string[];
}
export interface StatusResponse {
  recargas: ModuleStatus;
  sms: ModuleStatus;
  esim: ModuleStatus;
  updatedAt: string;
  cached?: boolean;
}
export const statusApi = {
  get: () => api<StatusResponse>("/status"),
  adminList: () =>
    api<{ modules: { module: string; maintenance: boolean; message: string | null; updated_at: string }[] }>(
      "/status/admin/modules"
    ),
  adminToggle: (module: "recargas" | "sms" | "esim", maintenance: boolean, message?: string | null) =>
    api<{ module: string; maintenance: boolean; message: string | null }>(
      `/status/admin/modules/${module}`,
      { method: "POST", body: { maintenance, message } }
    ),
};

export const settingsApi = {
  public: () => api<{ settings: { telegram_handle?: string } }>("/admin/settings/public"),
  get: () => api<{ settings: Record<string, string> }>("/admin/settings"),
  update: (updates: Record<string, string>) =>
    api<{ message: string }>("/admin/settings", { method: "PUT", body: updates }),
};

export interface SupportSession {
  id: number;
  user_id: number;
  agent_id: number | null;
  status: "waiting" | "active" | "closed";
  user_pubkey: string | null;
  agent_pubkey: string | null;
  created_at: string;
  user_username?: string;
  agent_username?: string;
}
export interface SupportMessageEnc {
  id: number;
  sender_role: "user" | "agent";
  ciphertext: string;
  iv: string;
  created_at: string;
}
export const supportApi = {
  openSession: (pubkey: string) =>
    api<{ session: SupportSession }>(`/support/sessions`, { method: "POST", body: { pubkey } }),
  messages: (sessionId: number) =>
    api<{ session: SupportSession; messages: SupportMessageEnc[] }>(`/support/sessions/${sessionId}/messages`),
  queue: () => api<{ sessions: SupportSession[] }>(`/support/queue`),
};
export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  cpf: string;
  role: "user" | "mod" | "admin";
  balance: number;
  pin_configured?: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface Operadora {
  id: number;
  name: string;
  enabled: boolean;
  poeki_allowed?: boolean;
}

export interface Plano {
  id: number;
  operadora_id: number;
  amount: number;
  cost: number;
}

export interface Pagamento {
  id: number;
  user_id: number;
  transaction_id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  used: boolean;
  created_at: string;
}

export interface Recarga {
  id: number;
  user_id: number;
  pagamento_id: number;
  operadora_id: number;
  phone: string;
  amount: number;
  cost: number;
  status: "pendente" | "andamento" | "feita" | "cancelada" | "expirada" | "reembolsado";
  poeki_id: string | null;
  created_at: string;
  operadora_name?: string;
}

export interface Noticia {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  author: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
  username?: string;
}
