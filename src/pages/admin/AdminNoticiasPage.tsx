import { useEffect, useState } from "react";
import { noticiasApi, type Noticia } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Pin } from "lucide-react";

export default function AdminNoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [form, setForm] = useState({ title: "", content: "", pinned: false });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    noticiasApi.list().then((r) => setNoticias(r.noticias)).catch(() => {});
  };

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    try {
      await noticiasApi.create(form);
      setForm({ title: "", content: "", pinned: false });
      setDialogOpen(false);
      load();
      toast.success("Notícia publicada");
    } catch { toast.error("Erro ao criar"); }
  };

  const handleDelete = async (id: number) => {
    try {
      await noticiasApi.delete(id);
      setNoticias((prev) => prev.filter((n) => n.id !== id));
      toast.success("Removida");
    } catch { toast.error("Erro"); }
  };

  const togglePin = async (n: Noticia) => {
    try {
      await noticiasApi.update(n.id, { pinned: !n.pinned });
      load();
    } catch { toast.error("Erro"); }
  };

  const sorted = [...noticias].sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Notícias</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={14} className="mr-1" /> Nova</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova notícia</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.pinned} onCheckedChange={(v) => setForm((f) => ({ ...f, pinned: v }))} />
                <Label>Fixar no topo</Label>
              </div>
              <Button onClick={handleCreate} className="w-full">Publicar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {sorted.map((n) => (
          <Card key={n.id}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {n.pinned && <Pin size={12} className="text-primary" />}
                  <h3 className="font-semibold text-sm">{n.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.content}</p>
                <span className="text-xs text-muted-foreground">{n.author} · {new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => togglePin(n)} className="text-muted-foreground hover:text-primary"><Pin size={14} /></button>
                <button onClick={() => handleDelete(n.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
