const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

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

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(error.message || `Erro ${res.status}`);
  }

  return res.json();
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
  me: () => api<{ user: User }>("/auth/me").then((response) => ({ user: normalizeUser(response.user) })),
};

// Operadoras
export const operadorasApi = {
  list: () => api<{ operadoras: Operadora[] }>("/operadoras"),
  update: (id: number, data: Partial<Operadora>) =>
    api<Operadora>(`/operadoras/${id}`, { method: "PUT", body: data }),
};

// Planos
export const planosApi = {
  listByOperadora: (operadoraId: number) =>
    api<{ planos: Plano[] }>(`/planos?operadora_id=${operadoraId}`).then((response) => ({
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
    api<{ operator: string; enabled: boolean }>("/recargas/detect", { method: "POST", body: { phone } }),
  checkPhone: (phoneNumber: string, carrierName?: string) =>
    api<{ status: string; message: string; isCooldown: boolean; isBlacklisted: boolean }>(
      "/recargas/check-phone", { method: "POST", body: { phoneNumber, carrierName } }
    ),
  create: (data: { operadora_id: number; phone: string; plano_id: number }) =>
    api<{ recarga: Recarga }>("/recargas", { method: "POST", body: data }).then((response) => ({
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
};

// Pagamentos
export const pagamentosApi = {
  deposit: (amount: number) =>
    api<{ pagamento: Pagamento; qrCode: string; qrCodeBase64: string; pixCopiaECola: string }>(
      "/pagamentos/deposit", { method: "POST", body: { amount } }
    ).then((response) => ({
      ...response,
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
};

// Noticias
export const noticiasApi = {
  list: () => api<{ noticias: Noticia[] }>("/noticias"),
  create: (data: { title: string; content: string; pinned?: boolean }) =>
    api<Noticia>("/noticias", { method: "POST", body: data }),
  update: (id: number, data: Partial<Noticia>) =>
    api<Noticia>(`/noticias/${id}`, { method: "PUT", body: data }),
  delete: (id: number) => api(`/noticias/${id}`, { method: "DELETE" }),
};

// Admin
export const adminApi = {
  users: {
    list: () => api<{ users: User[] }>("/admin/users").then((response) => ({ users: response.users.map(normalizeUser) })),
    update: (id: number, data: Partial<User>) =>
      api<User>(`/admin/users/${id}`, { method: "PUT", body: data }).then((user) => normalizeUser(user)),
    delete: (id: number) => api(`/admin/users/${id}`, { method: "DELETE" }),
  },
  logs: (params?: string) => api<{ logs: ActivityLog[]; total: number }>(`/admin/logs${params ? `?${params}` : ""}`),
};

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  cpf: string;
  role: "user" | "admin";
  balance: number;
  created_at: string;
}

export interface Operadora {
  id: number;
  name: string;
  enabled: boolean;
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
  status: "pendente" | "andamento" | "feita" | "cancelada" | "expirada";
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
