import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Delete, Check, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminPinPage() {
  const { user, verifyPin, setupPin, logout, adminVerified } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin" && user.role !== "mod") { navigate("/recargas"); return; }
    if (adminVerified) { navigate("/admin"); return; }
  }, [user, adminVerified, navigate]);

  const submit = async (value: string) => {
    setLoading(true);
    try {
      if (user?.pin_configured === false) {
        if (!firstPin) {
          setFirstPin(value);
          setPin("");
          toast.info("Confirme o PIN");
          return;
        }
        await setupPin(firstPin, value);
        toast.success("PIN cadastrado e acesso liberado");
      } else {
        await verifyPin(value);
        toast.success("Acesso liberado");
      }
    } catch (e: any) {
      const msg = e?.message || "PIN incorreto";
      const friendly = msg.includes("Failed to fetch") || msg.includes("HTML em vez de JSON")
        ? "Backend offline. Inicie o servidor Node (backend/) na porta 4000."
        : msg;
      toast.error(friendly);
      setShake(true); setTimeout(() => setShake(false), 400);
      setFirstPin("");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div ref={containerRef} className={`grid w-full overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-xl md:grid-cols-[0.9fr_1.1fr] ${shake ? "animate-[shake_0.4s]" : ""}`}>
          <div className="relative hidden overflow-hidden border-r border-border/60 bg-secondary/45 p-8 md:flex md:flex-col md:justify-between">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <ShieldCheck size={22} />
              </div>
              <div className="label-eyebrow mt-6">Painel administrativo</div>
              <h1 className="mt-3 font-display text-4xl leading-tight">Acesso protegido</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Confirme sua identidade para entrar no painel de gestão.</p>
            </div>
            {user && <div className="relative z-10 rounded-xl border border-border/60 bg-background/45 p-4 text-xs text-muted-foreground">Sessão de <span className="font-mono-x text-foreground">{user.username}</span></div>}
          </div>

          <div className="p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary md:hidden"><LockKeyhole size={22} /></div>
          <div className="label-eyebrow mb-2">PIN seguro</div>
          <h2 className="font-display text-4xl mb-1">Digite seu PIN</h2>
          <p className="text-sm text-muted-foreground">
            {user?.pin_configured === false
              ? firstPin ? "Confirme os 4 dígitos do seu PIN." : "Cadastre um PIN de 4 dígitos."
              : "Digite os 4 dígitos para entrar."}
          </p>
          {user && <p className="text-xs text-muted-foreground mt-1 font-mono-x md:hidden">{user.username}</p>}
        </div>

        {/* dots */}
        <div className="flex justify-center gap-3 mb-10">
          {[0,1,2,3].map((i) => (
            <div
              key={i}
              className={`h-4 w-12 rounded-full border transition-all ${
                pin.length > i ? "border-primary bg-primary shadow-lg shadow-primary/25" : "border-border bg-secondary"
              }`}
            >
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
              className="h-16 rounded-2xl border border-border/70 bg-background/70 font-display text-2xl shadow-sm transition hover:border-primary/50 hover:bg-secondary active:scale-95 disabled:opacity-50"
            >
              {k}
            </button>
          ))}
          <button
            onClick={back}
            disabled={loading || pin.length === 0}
            className="h-16 rounded-2xl border border-border/70 bg-background/70 flex items-center justify-center shadow-sm transition hover:border-primary/50 hover:bg-secondary active:scale-95 disabled:opacity-30"
          >
            <Delete size={20} />
          </button>
          <button
            onClick={() => press("0")}
            disabled={loading}
            className="h-16 rounded-2xl border border-border/70 bg-background/70 font-display text-2xl shadow-sm transition hover:border-primary/50 hover:bg-secondary active:scale-95 disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={() => pin.length === 4 && submit(pin)}
            disabled={loading || pin.length !== 4}
            className="h-16 rounded-2xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 active:scale-95 disabled:opacity-30"
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
      </div>
    </div>
  );
}
