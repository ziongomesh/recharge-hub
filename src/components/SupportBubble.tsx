import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supportApi, type SupportSession } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { generateKeyPair, exportPublicKey, deriveSharedKey, encrypt, decrypt } from "@/lib/e2e";
import { MessageCircle, X, Send, Shield, Loader2, Headphones, Star } from "lucide-react";
import { toast } from "sonner";

interface ChatMsg { id: number | string; role: "user" | "agent"; text: string; time: string; }

export default function SupportBubble() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [closed, setClosed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const keyPairRef = useRef<CryptoKeyPair | null>(null);
  const sharedRef = useRef<CryptoKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {}, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, agentTyping]);

  if (!user || user.role !== "user") return null;
  const start = async () => {
    if (session) { setOpen(true); return; }
    setConnecting(true);
    try {
      const kp = await generateKeyPair();
      keyPairRef.current = kp;
      const pub = await exportPublicKey(kp.publicKey);
      const { session: s } = await supportApi.openSession(pub);
      setSession(s);
      setOpen(true);
      attach(s);
    } catch (e: any) {
      toast.error(e.message || "Falha ao iniciar suporte");
    } finally {
      setConnecting(false);
    }
  };

  const attach = (s: SupportSession) => {
    const sock = getSocket();
    sock.emit("join_session", s.id, async (ack: any) => {
      if (!ack?.ok) { toast.error("Falha ao entrar na sala"); return; }
    });
    sock.on("peer_pubkey", async ({ pubkey, role }) => {
      if (role !== "agent" || !keyPairRef.current) return;
      sharedRef.current = await deriveSharedKey(keyPairRef.current.privateKey, pubkey);
    });
    sock.on("session_state", (st: any) => {
      if (st.status === "active" && st.agent) {
        setAgentName(st.agent.username);
        toast.success(`${st.agent.username} entrou no atendimento`);
      }
      if (st.status === "closed") toast.info("Atendimento encerrado");
    });
    sock.on("new_message", async (m: any) => {
      if (!sharedRef.current) return;
      try {
        const text = await decrypt(sharedRef.current, m.ciphertext, m.iv);
        setMessages((prev) => [...prev, { id: m.id, role: m.sender_role, text, time: m.created_at }]);
      } catch { /* sem chave ainda */ }
    });
    sock.on("typing", ({ isTyping, role }) => { if (role === "agent") setAgentTyping(isTyping); });
  };

  const send = async () => {
    if (!input.trim() || !session || !sharedRef.current) {
      if (!sharedRef.current) toast.warning("Aguarde o atendente entrar para enviar mensagens");
      return;
    }
    const text = input.trim();
    setInput("");
    const { ciphertext, iv } = await encrypt(sharedRef.current, text);
    const sock = getSocket();
    sock.emit("send_message", { sessionId: session.id, ciphertext, iv });
  };

  if (!open) {
    return (
      <button
        onClick={start}
        disabled={connecting}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full shadow-lg hover:scale-105 transition disabled:opacity-50"
        aria-label="Abrir suporte"
      >
        {connecting ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />}
        <span className="text-sm font-medium">Suporte</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-3rem)] bg-background border-2 border-foreground rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Headphones size={16} />
          <div>
            <div className="font-display text-base leading-tight">Suporte</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Shield size={9} /> Criptografia ponta a ponta
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
          <X size={16} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm bg-paper">
        {!agentName ? (
          <div className="text-center text-muted-foreground py-10">
            <Loader2 className="mx-auto mb-3 animate-spin" size={20} />
            <div className="font-display text-base mb-1">Aguardando atendente</div>
            <div className="text-xs">Você está na fila. Em breve alguém entra no chat.</div>
          </div>
        ) : (
          <div className="text-center text-[11px] text-muted-foreground border-b border-border pb-2">
            <Shield size={10} className="inline mr-1" />
            <strong>{agentName}</strong> está atendendo • mensagens cifradas
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-lg ${
              m.role === "user" ? "bg-foreground text-background" : "bg-background border border-border"
            }`}>
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              <div className={`text-[9px] mt-0.5 ${m.role === "user" ? "text-background/60" : "text-muted-foreground"}`}>
                {new Date(m.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {agentTyping && (
          <div className="text-xs text-muted-foreground italic">{agentName} está digitando…</div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="border-t border-border p-2 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={agentName ? "Digite sua mensagem…" : "Aguarde atendente…"}
          disabled={!agentName}
          className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-foreground disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!agentName || !input.trim()}
          className="px-3 py-2 bg-foreground text-background rounded disabled:opacity-30 hover:opacity-90"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
