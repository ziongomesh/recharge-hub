/**
 * Rótulos exibidos no painel admin para os provedores externos.
 * A lógica/endpoints continuam usando os nomes técnicos internamente —
 * aqui só fica o que o admin vê na tela.
 */
export const PROVIDER_LABELS = {
  recargas: "API de Recargas",
  pix: "Provedor PIX",
  sms: "Provedor SMS",
} as const;
