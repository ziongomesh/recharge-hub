import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", phone: "", cpf: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === "cpf") value = formatCPF(value);
    if (field === "phone") value = formatPhone(value);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfDigits = form.cpf.replace(/\D/g, "");
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (cpfDigits.length !== 11) { toast.error("CPF deve ter 11 dígitos"); return; }
    if (phoneDigits.length < 10 || phoneDigits.length > 11) { toast.error("Telefone inválido"); return; }
    setLoading(true);
    try {
      await register({ ...form, cpf: cpfDigits, phone: phoneDigits });
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">CometaSMS</CardTitle>
          <p className="text-sm text-muted-foreground">Crie sua conta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Input value={form.username} onChange={update("username")} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={update("email")} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={update("phone")} placeholder="11 99999-9999" required />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={update("cpf")} placeholder="000.000.000-00" required />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={form.password} onChange={update("password")} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
