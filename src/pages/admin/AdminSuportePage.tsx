import { useEffect, useRef, useState } from "react";
import { supportApi, type SupportSession } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { generateKeyPair, exportPublicKey, deriveSharedKey, encrypt, decrypt } from "@/lib/e2e";
import { useAuth } from "@/contexts/AuthContext";
import { Headphones, Send, Shield, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface ChatMsg { id: number | string; role: "user" | "agent"; text: string; time: string; }

export default function AdminSuportePage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<SupportSession[]>([]);
  const [active, setActive] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [userTyping, setUserTyping] = useState(false);
  const keyPairRef = useRef<CryptoKeyPair | null>(null);
  const sharedRef = useRef<CryptoKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadQueue = async () => {
    try { const { sessions } = await supportApi.queue(); setQueue(sessions); }
    catch {}
  };

  useEffect(() => {
    loadQueue();
    const sock = getSocket();
    sock.on("queue_update", loadQueue);
    return () => { sock.off("queue_update", loadQueue); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, userTyping]);

  const take = async (s: SupportSession) => {
    setActive(null);
    setMessages([]);
    sharedRef.current = null;
    const kp = await generateKeyPair();
    keyPairRef.current = kp;
    const pub = await exportPublicKey(kp.publicKey);

    const sock = getSocket();
    sock.emit("join_session", s.id, async (ack: any) => {
      if (!ack?.ok) { toast.error(ack?.error || "Falha ao entrar"); return; }
    });

    // listeners únicos por sessão
    sock.off("peer_pubkey");
    sock.off("new_message");
    sock.off("session_state");
    sock.off("typing");

    sock.on("peer_pubkey", async ({ pubkey, role }) => {
      if (role !== "user" || !keyPairRef.current) return;
      sharedRef.current = await deriveSharedKey(keyPairRef.current.privateKey, pubkey);
      // Recarrega histórico decifrando
      try {
        const { messages: enc } = await supportApi.messages(s.id);
        const dec: ChatMsg[] = [];
        for (const m of enc) {
          try {
            const text = await decrypt(sharedRef.current, m.ciphertext, m.iv);
            dec.push({ id: m.id, role: m.sender_role, text, time: m.created_at });
          } catch {}
        }
        setMessages(dec);
      } catch {}
    });
    sock.on("new_message", async (m: any) => {
      if (!sharedRef.current) return;
      try {
        const text = await decrypt(sharedRef.current, m.ciphertext, m.iv);
        setMessages((prev) => [...prev, { id: m.id, role: m.sender_role, text, time: m.created_at }]);
      } catch {}
    });
    sock.on("session_state", (st: any) => { if (st.status === "closed") { toast.info("Sessão encerrada"); setActive(null); loadQueue(); }});
    sock.on("typing", ({ isTyping, role }) => { if (role === "user") setUserTyping(isTyping); });

    // Pega o atendimento — entrega pubkey ao usuário
    sock.emit("agent_take", s.id, pub, (ack: any) => {
      if (!ack?.ok) { toast.error(ack?.error || "Não foi possível pegar"); return; }
      setActive(s);
      loadQueue();
    });
  };

  const send = async () => {
    if (!input.trim() || !active || !sharedRef.current) return;
    const text = input.trim();
    setInput("");
    const { ciphertext, iv } = await encrypt(sharedRef.current, text);
    const sock = getSocket();
    sock.emit("send_message", { sessionId: active.id, ciphertext, iv });
  };

  const closeSession = () => {
    if (!active) return;
    const sock = getSocket();
    sock.emit("close_session", active.id, () => {
      setActive(null);
      setMessages([]);
      loadQueue();
    });
  };

  const waiting = queue.filter((q) => q.status === "waiting");
  const myActive = queue.filter((q) => q.status === "active" && q.agent_id === user?.id);

  return (
    <div className="space-y-4">
      <div>
        <div className="label-eyebrow">Atendimento</div>
        <h1 className="font-display text-4xl mt-1">Suporte ao vivo.</h1>
        <p className="text-sm text-muted-foreground mt-1">Mensagens com criptografia ponta a ponta. Nem o servidor vê o conteúdo.</p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* fila */}
        <div className="col-span-4 border border-border rounded-lg overflow-hidden flex flex-col bg-background">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm font-medium">
            <Users size={14} /> Fila ({waiting.length}) · Atendendo ({myActive.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {waiting.length === 0 && myActive.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">Sem atendimentos no momento.</div>
            )}
            {waiting.map((s) => (
              <div key={s.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.user_username}</div>
                    <div className="text-[10px] text-muted-foreground font-mono-x">aguardando · {new Date(s.created_at).toLocaleTimeString("pt-BR")}</div>
                  </div>
                  <button onClick={() => take(s)} className="text-xs px-2 py-1 bg-foreground text-background rounded hover:opacity-90">Atender</button>
                </div>
              </div>
            ))}
            {myActive.map((s) => (
              <div key={s.id} className="p-3 bg-paper-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.user_username}</div>
                    <div className="text-[10px] text-success font-mono-x">● ativo</div>
                  </div>
                  <button onClick={() => take(s)} className="text-xs px-2 py-1 border border-border rounded hover:bg-background">Abrir</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* chat */}
        <div className="col-span-8 border border-border rounded-lg overflow-hidden flex flex-col bg-paper">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <Headphones className="mx-auto mb-3 opacity-40" size={36} />
                <div className="font-display text-lg">Selecione um atendimento</div>
                <div className="text-xs mt-1">Clique em "Atender" para iniciar uma sessão criptografada.</div>
              </div>
            </div>
          ) : (
            <>
              <header className="px-4 py-3 border-b border-border flex items-center justify-between bg-background">
                <div>
                  <div className="font-medium text-sm">{active.user_username}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Shield size={9} /> E2E ECDH+AES-GCM · sessão #{active.id}
                  </div>
                </div>
                <button onClick={closeSession} className="text-xs text-destructive hover:underline">Encerrar</button>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
                {!sharedRef.current && <div className="text-center text-xs text-muted-foreground"><Loader2 className="inline animate-spin mr-1" size={12} /> Estabelecendo chave compartilhada…</div>}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "agent" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                      m.role === "agent" ? "bg-foreground text-background" : "bg-background border border-border"
                    }`}>
                      <div className="whitespace-pre-wrap break-words">{m.text}</div>
                      <div className={`text-[9px] mt-0.5 ${m.role === "agent" ? "text-background/60" : "text-muted-foreground"}`}>
                        {new Date(m.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                {userTyping && <div className="text-xs text-muted-foreground italic">{active.user_username} está digitando…</div>}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border p-2 flex gap-2 bg-background">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Sua resposta…"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-foreground"
                />
                <button type="submit" disabled={!input.trim()} className="px-3 py-2 bg-foreground text-background rounded disabled:opacity-30 hover:opacity-90">
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
