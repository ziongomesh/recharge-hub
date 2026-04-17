import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Delete, Check, Loader2 } from "lucide-react";

export default function AdminPinPage() {
  const { user, verifyPin, logout, adminVerified } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/recargas"); return; }
    if (adminVerified) { navigate("/admin"); return; }
  }, [user, adminVerified, navigate]);

  const submit = async (value: string) => {
    setLoading(true);
    try {
      await verifyPin(value);
      toast.success("Acesso liberado");
    } catch (e: any) {
      const msg = e?.message || "PIN incorreto";
      const friendly = msg.includes("Failed to fetch") || msg.includes("HTML em vez de JSON")
        ? "Backend offline. Inicie o servidor Node (backend/) na porta 4000."
        : msg;
      toast.error(friendly);
      setShake(true); setTimeout(() => setShake(false), 400);
      setPin("");
    } finally { setLoading(false); }
  };

  const press = (d: string) => {
    if (loading || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) submit(next);
  };

  const back = () => { if (!loading) setPin((p) => p.slice(0, -1)); };

  // teclado físico
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pin, loading]);

  const keys = ["1","2","3","4","5","6","7","8","9"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-6 py-10">
      <div ref={containerRef} className={`w-full max-w-sm ${shake ? "animate-[shake_0.4s]" : ""}`}>
        <div className="text-center mb-8">
          <div className="label-eyebrow mb-2">Painel administrativo</div>
          <h1 className="font-display text-4xl mb-1">PIN de acesso</h1>
          <p className="text-sm text-muted-foreground">Digite os 4 dígitos para entrar.</p>
          {user && <p className="text-xs text-muted-foreground mt-1 font-mono-x">{user.username}</p>}
        </div>

        {/* dots */}
        <div className="flex justify-center gap-3 mb-10">
          {[0,1,2,3].map((i) => (
            <div
              key={i}
              className={`w-12 h-14 border-2 rounded flex items-center justify-center font-display text-2xl transition-all ${
                pin.length > i ? "border-foreground bg-foreground text-background" : "border-foreground/25"
              }`}
            >
              {pin.length > i ? "•" : ""}
            </div>
          ))}
        </div>

        {/* keypad */}
        <div className="grid grid-cols-3 gap-3">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              disabled={loading}
              className="h-16 border border-border rounded font-display text-2xl bg-background hover:bg-paper-2 active:scale-95 transition disabled:opacity-50"
            >
              {k}
            </button>
          ))}
          <button
            onClick={back}
            disabled={loading || pin.length === 0}
            className="h-16 border border-border rounded flex items-center justify-center bg-background hover:bg-paper-2 active:scale-95 transition disabled:opacity-30"
          >
            <Delete size={20} />
          </button>
          <button
            onClick={() => press("0")}
            disabled={loading}
            className="h-16 border border-border rounded font-display text-2xl bg-background hover:bg-paper-2 active:scale-95 transition disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={() => pin.length === 4 && submit(pin)}
            disabled={loading || pin.length !== 4}
            className="h-16 rounded flex items-center justify-center bg-foreground text-background hover:opacity-90 active:scale-95 transition disabled:opacity-30"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
          </button>
        </div>

        <button
          onClick={logout}
          className="mt-8 w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
        >
          Sair / Voltar ao login
        </button>
      </div>
    </div>
  );
}
