import { useEffect, useRef, useState } from "react";
import { API_BASE_URL, esimApi, type EsimProduto, type EsimEstoqueItem } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Package, X, Pencil } from "lucide-react";

function EstoqueThumb({ id, onRemove }: { id: number; onRemove: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/esim/admin/estoque/${id}/image`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((b) => { url = URL.createObjectURL(b); setSrc(url); })
      .catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [id]);
  return (
    <div className="relative border border-border bg-white aspect-square group">
      {src ? <img src={src} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full animate-pulse bg-paper-2" />}
      <button onClick={onRemove} className="absolute top-1 right-1 bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition">
        <Trash2 size={12} />
      </button>
    </div>
  );
}

const OPERADORAS = ["Vivo", "Claro", "TIM", "Outras"];

interface FormState {
  id?: number;
  name: string;
  operadora: string;
  amount: string;
  observacao: string;
  enabled: boolean;
}
const empty: FormState = { name: "", operadora: "Vivo", amount: "", observacao: "", enabled: true };

export default function AdminEsimPage() {
  const [produtos, setProdutos] = useState<EsimProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [estoqueOf, setEstoqueOf] = useState<EsimProduto | null>(null);
  const [estoque, setEstoque] = useState<EsimEstoqueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await esimApi.adminProdutos();
      setProdutos(r.produtos);
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form) return;
    if (!form.name || !form.amount) { toast.error("Preencha nome e valor"); return; }
    const payload = {
      name: form.name,
      operadora: form.operadora,
      amount: parseFloat(form.amount),
      observacao: form.observacao,
      enabled: form.enabled,
    };
    try {
      if (form.id) await esimApi.adminUpdate(form.id, payload);
      else await esimApi.adminCreate(payload);
      toast.success("Salvo");
      setForm(null);
      load();
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };

  const remove = async (p: EsimProduto) => {
    if (!confirm(`Excluir "${p.name}"? Todas as imagens em estoque serão apagadas.`)) return;
    try { await esimApi.adminDelete(p.id); toast.success("Excluído"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const openEstoque = async (p: EsimProduto) => {
    setEstoqueOf(p);
    try { const r = await esimApi.adminEstoque(p.id); setEstoque(r.estoque); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !estoqueOf) return;
    setUploading(true);
    try {
      const r = await esimApi.adminUploadEstoque(estoqueOf.id, Array.from(files));
      toast.success(`${r.added} eSIM(s) adicionado(s)`);
      const e2 = await esimApi.adminEstoque(estoqueOf.id);
      setEstoque(e2.estoque);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const removeUnit = async (id: number) => {
    if (!confirm("Excluir este eSIM do estoque?")) return;
    try {
      await esimApi.adminDeleteEstoque(id);
      setEstoque((s) => s.filter((x) => x.id !== id));
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="label-eyebrow">Catálogo</div>
          <h1 className="font-display text-4xl mt-2">eSIM</h1>
        </div>
        <button onClick={() => setForm({ ...empty })} className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm">
          <Plus size={14} /> Novo produto
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="animate-spin" size={14} /> Carregando…
        </div>
      ) : (
        <div className="border border-border">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-normal label-eyebrow">Nome</th>
                <th className="text-left px-4 py-3 font-normal label-eyebrow">Operadora</th>
                <th className="text-right px-4 py-3 font-normal label-eyebrow">Valor</th>
                <th className="text-right px-4 py-3 font-normal label-eyebrow">Estoque</th>
                <th className="text-center px-4 py-3 font-normal label-eyebrow">Ativo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {produtos.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum produto.</td></tr>
              )}
              {produtos.map((p) => (
                <tr key={p.id} className="hover:bg-paper-2">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.operadora}</td>
                  <td className="px-4 py-3 text-right font-mono tabular">R$ {p.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular">{p.stock}</td>
                  <td className="px-4 py-3 text-center">{p.enabled ? "✓" : "✗"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEstoque(p)} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs">
                        <Package size={13} /> Estoque
                      </button>
                      <button onClick={() => setForm({
                        id: p.id, name: p.name, operadora: p.operadora,
                        amount: String(p.amount), observacao: p.observacao || "", enabled: p.enabled !== false,
                      })} className="text-muted-foreground hover:text-foreground">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(p)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setForm(null)}>
          <div className="bg-paper border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-display text-2xl">{form.id ? "Editar" : "Novo"} eSIM</div>
              <button onClick={() => setForm(null)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label-eyebrow block mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 text-sm" placeholder="ex: eSIM Vivo Pag Menos" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-eyebrow block mb-1">Operadora</label>
                  <select value={form.operadora} onChange={(e) => setForm({ ...form, operadora: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 text-sm">
                    {OPERADORAS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-eyebrow block mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="label-eyebrow block mb-1">Observação (mostrada após compra)</label>
                <textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  rows={4} className="w-full border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                Ativo (visível para clientes)
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setForm(null)} className="flex-1 border border-border py-2 text-sm">Cancelar</button>
              <button onClick={save} className="flex-1 bg-foreground text-background py-2 text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Estoque modal */}
      {estoqueOf && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setEstoqueOf(null)}>
          <div className="bg-paper border border-border max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <div className="label-eyebrow">Estoque</div>
                <div className="font-display text-xl">{estoqueOf.name}</div>
                <div className="text-xs text-muted-foreground">{estoque.length} unidade(s)</div>
              </div>
              <button onClick={() => setEstoqueOf(null)}><X size={18} /></button>
            </div>

            <div className="p-6 border-b border-border">
              <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleUpload(e.target.files)} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-border py-6 text-sm hover:bg-paper-2 disabled:opacity-50">
                {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                Enviar imagens de QR Code (selecione múltiplas)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {estoque.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-10">Sem unidades. Faça upload acima.</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {estoque.map((u) => (
                    <EstoqueThumb key={u.id} id={u.id} onRemove={() => removeUnit(u.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
