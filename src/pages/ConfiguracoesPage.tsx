import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold mb-6">Configurações</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Meu perfil</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usuário</span>
            <span className="font-medium">{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telefone</span>
            <span className="font-medium">{user?.phone ? formatPhone(user.phone) : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CPF</span>
            <span className="font-medium">{user?.cpf ? formatCPF(user.cpf) : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Saldo</span>
            <span className="font-bold">R$ {(user?.balance ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membro desde</span>
            <span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "-"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
