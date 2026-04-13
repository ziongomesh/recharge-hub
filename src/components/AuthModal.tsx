import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, CreditCard, Eye, EyeOff, X, Check } from "lucide-react";

type AuthMode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function AuthModal({ open, onOpenChange, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regForm, setRegForm] = useState({ username: "", email: "", password: "", confirmPassword: "", phone: "", cpf: "" });

  const updateReg = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === "cpf") value = formatCPF(value);
    if (field === "phone") value = formatPhone(value);
    setRegForm((f) => ({ ...f, [field]: value }));
  };

  // Password validation
  const pw = mode === "register" ? regForm.password : "";
  const pwChecks = [
    { label: "Deve conter apenas letras do alfabeto latino", ok: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~ ]*$/.test(pw) && pw.length > 0 },
    { label: "Deve conter pelo menos um símbolo ou número", ok: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw) },
    { label: "Deve conter pelo menos uma letra maiúscula", ok: /[A-Z]/.test(pw) },
    { label: "Mínimo de 8 caracteres", ok: pw.length >= 8 },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) { toast.error("Senhas não conferem"); return; }
    if (!pwChecks.every((c) => c.ok)) { toast.error("Senha não atende os requisitos"); return; }
    const cpfDigits = regForm.cpf.replace(/\D/g, "");
    const phoneDigits = regForm.phone.replace(/\D/g, "");
    if (cpfDigits.length !== 11) { toast.error("CPF deve ter 11 dígitos"); return; }
    if (phoneDigits.length < 10) { toast.error("Telefone inválido"); return; }
    setLoading(true);
    try {
      await register({ username: regForm.username, email: regForm.email, password: regForm.password, phone: phoneDigits, cpf: cpfDigits });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-border/30 bg-card overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-8">
          <h2 className="text-xl font-bold text-center text-foreground mb-6">
            {mode === "login" ? "Acesso à conta" : "Cadastro"}
          </h2>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-secondary/30 border-border/50 text-sm"
                  required
                />
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary/30 border-border/50 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="text-right">
                <button type="button" className="text-xs hover:underline" style={{ color: "hsl(var(--primary))" }}>
                  Esqueceu sua senha?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-sm font-medium rounded-full"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                placeholder="Usuário"
                value={regForm.username}
                onChange={updateReg("username")}
                className="h-12 bg-secondary/30 border-border/50 text-sm"
                required
              />
              <Input
                type="email"
                placeholder="Digite seu e-mail"
                value={regForm.email}
                onChange={updateReg("email")}
                className="h-12 bg-secondary/30 border-border/50 text-sm"
                required
              />
              <Input
                placeholder="Telefone (11 99999-9999)"
                value={regForm.phone}
                onChange={updateReg("phone")}
                className="h-12 bg-secondary/30 border-border/50 text-sm"
                required
              />
              <Input
                placeholder="CPF (000.000.000-00)"
                value={regForm.cpf}
                onChange={updateReg("cpf")}
                className="h-12 bg-secondary/30 border-border/50 text-sm"
                required
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={regForm.password}
                  onChange={updateReg("password")}
                  className="h-12 bg-secondary/30 border-border/50 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password requirements */}
              {regForm.password.length > 0 && (
                <div className="space-y-1.5 pl-1">
                  {pwChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Check size={12} className={check.ok ? "text-emerald-500" : "text-muted-foreground/40"} />
                      <span className={check.ok ? "text-muted-foreground" : "text-muted-foreground/50"}>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <Input
                type="password"
                placeholder="Confirme sua senha"
                value={regForm.confirmPassword}
                onChange={updateReg("confirmPassword")}
                className="h-12 bg-secondary/30 border-border/50 text-sm"
                required
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-sm font-medium rounded-full"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
              >
                {loading ? "Criando..." : "Criar conta"}
              </Button>
            </form>
          )}

          <p className="text-sm text-center text-muted-foreground mt-5">
            {mode === "login" ? (
              <>Ainda não tem uma conta?{" "}
                <button onClick={() => setMode("register")} className="hover:underline" style={{ color: "hsl(var(--primary))" }}>
                  Criar conta
                </button>
              </>
            ) : (
              <>Já tem uma conta?{" "}
                <button onClick={() => setMode("login")} className="hover:underline" style={{ color: "hsl(var(--primary))" }}>
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
