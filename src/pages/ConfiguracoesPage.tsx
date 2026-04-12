import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
            <span className="font-medium">{user?.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CPF</span>
            <span className="font-medium">{user?.cpf}</span>
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
