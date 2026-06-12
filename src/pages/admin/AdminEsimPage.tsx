import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, esimApi, esimLogoUrl, type EsimProduto, type EsimEstoqueItem } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Package, X, Pencil, Image as ImageIcon, MapPin, Check } from "lucide-react";

function EstoqueThumb({ item, onRemove, onSaveDdd }: { item: EsimEstoqueItem; onRemove: () => void; onSaveDdd: (ddd: string | null) => Promise<void> }) {
  const [src, setSrc] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.ddd || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/esim/admin/estoque/${item.id}/image`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((b) => { url = URL.createObjectURL(b); setSrc(url); })
      .catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [item.id]);

  const save = async () => {
    setSaving(true);
    try {
      const clean = val.replace(/\D/g, "").slice(0, 2);
      await onSaveDdd(clean || null);
      setEditing(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="relative border border-border bg-white aspect-square group">
      {src ? <img src={src} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full animate-pulse bg-paper-2" />}

      {/* DDD badge */}
      <div className="absolute top-1 left-1">
        {editing ? (
          <div className="flex items-center gap-1 bg-black/85 rounded px-1 py-0.5">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 2))}
              autoFocus
              placeholder="DDD"
              className="w-10 bg-transparent text-white text-[11px] tabular outline-none placeholder:text-white/40"
            />
            <button onClick={save} disabled={saving} className="text-white"><Check size={11} /></button>
          </div>
        ) : (
          <button onClick={() => { setVal(item.ddd || ""); setEditing(true); }} className="bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded tabular inline-flex items-center gap-1">
            <MapPin size={9} /> {item.ddd || "—"}
          </button>
        )}
      </div>

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
  logo_image?: string | null;
}
const empty: FormState = { name: "", operadora: "Vivo", amount: "", observacao: "", enabled: true, logo_image: null };

export default function AdminEsimPage() {
  const [produtos, setProdutos] = useState<EsimProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [estoqueOf, setEstoqueOf] = useState<EsimProduto | null>(null);
  const [estoque, setEstoque] = useState<EsimEstoqueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadDdd, setUploadDdd] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await esimApi.adminProdutos();
      setProdutos(r.produtos);
    } catch (e: any) { toast.error(e.message || "Erro"); }
    finally { setLoading(false); }
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
      if (form.id) {
        await esimApi.adminUpdate(form.id, payload);
      } else {
        const r = await esimApi.adminCreate(payload);
        setForm({ ...form, id: r.id });
        toast.success("Criado. Adicione uma logo se quiser.");
        load();
        return;
      }
      toast.success("Salvo");
      setForm(null);
      load();
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file || !form?.id) return;
    setUploadingLogo(true);
    try {
      const r = await esimApi.adminUploadLogo(form.id, file);
      setForm({ ...form, logo_image: r.logo_image });
      toast.success("Logo enviada");
      load();
    } catch (e: any) { toast.error(e.message || "Erro ao enviar logo"); }
    finally { setUploadingLogo(false); if (logoRef.current) logoRef.current.value = ""; }
  };

  const handleLogoRemove = async () => {
    if (!form?.id) return;
    try {
      await esimApi.adminRemoveLogo(form.id);
      setForm({ ...form, logo_image: null });
      toast.success("Logo removida");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (p: EsimProduto) => {
    if (!confirm(`Excluir "${p.name}"? Todas as imagens em estoque serão apagadas.`)) return;
    try { await esimApi.adminDelete(p.id); toast.success("Excluído"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const openEstoque = async (p: EsimProduto) => {
    setEstoqueOf(p);
    setUploadDdd("");
    try { const r = await esimApi.adminEstoque(p.id); setEstoque(r.estoque); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !estoqueOf) return;
    const dddClean = uploadDdd.replace(/\D/g, "").slice(0, 2) || null;
    setUploading(true);
    try {
      const r = await esimApi.adminUploadEstoque(estoqueOf.id, Array.from(files), dddClean);
      toast.success(`${r.added} eSIM(s) adicionado(s)${dddClean ? ` · DDD ${dddClean}` : ""}`);
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

  const saveDdd = async (id: number, ddd: string | null) => {
    try {
      await esimApi.adminUpdateEstoqueDdd(id, ddd);
      setEstoque((s) => s.map((x) => x.id === id ? { ...x, ddd } : x));
      toast.success(ddd ? `DDD ${ddd} salvo` : "DDD removido");
    } catch (e: any) { toast.error(e.message); }
  };

  const grouped = useMemo(() => {
    const m = new Map<string, EsimEstoqueItem[]>();
    for (const u of estoque) {
      const k = u.ddd || "";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(u);
    }
    return Array.from(m.entries()).sort(([a], [b]) => {
      if (!a) return 1; if (!b) return -1; return a.localeCompare(b);
    });
  }, [estoque]);

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
                        logo_image: p.logo_image ?? null,
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

              <div className="pt-2 border-t border-border">
                <label className="label-eyebrow block mb-2">Logo do plano (opcional)</label>
                {!form.id ? (
                  <div className="text-xs text-muted-foreground border border-dashed border-border p-3">
                    Salve o produto primeiro para enviar uma logo.
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 border border-border bg-paper-2 flex items-center justify-center overflow-hidden shrink-0">
                      {form.logo_image ? (
                        <img src={esimLogoUrl(form.id, form.logo_image) || ""} alt="logo" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)} className="hidden" />
                      <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                        className="inline-flex items-center justify-center gap-2 border border-border py-2 text-xs hover:bg-paper-2 disabled:opacity-50">
                        {uploadingLogo ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                        {form.logo_image ? "Trocar logo" : "Enviar logo"}
                      </button>
                      {form.logo_image && (
                        <button type="button" onClick={handleLogoRemove}
                          className="inline-flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-destructive">
                          <Trash2 size={12} /> Remover
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
          <div className="bg-paper border border-border max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <div className="label-eyebrow">Estoque</div>
                <div className="font-display text-xl">{estoqueOf.name}</div>
                <div className="text-xs text-muted-foreground">{estoque.length} unidade(s) · {grouped.length} grupo(s) de DDD</div>
              </div>
              <button onClick={() => setEstoqueOf(null)}><X size={18} /></button>
            </div>

            <div className="p-6 border-b border-border space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-end">
                <div>
                  <label className="label-eyebrow block mb-1">DDD deste lote</label>
                  <input
                    value={uploadDdd}
                    onChange={(e) => setUploadDdd(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder="ex: 11"
                    className="w-full border border-border bg-background px-3 py-2 text-sm tabular"
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">Vazio = sem DDD (sai como aleatório)</div>
                </div>
                <div>
                  <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleUpload(e.target.files)} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-border py-5 text-sm hover:bg-paper-2 disabled:opacity-50">
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                    Enviar QR Codes{uploadDdd ? ` · DDD ${uploadDdd}` : " · sem DDD"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {estoque.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-10">Sem unidades. Faça upload acima.</div>
              ) : (
                <div className="space-y-6">
                  {grouped.map(([ddd, items]) => (
                    <div key={ddd || "_none"}>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={13} className="text-muted-foreground" />
                        <div className="text-sm font-medium tabular">
                          {ddd ? `DDD ${ddd}` : "Sem DDD (entrega aleatória)"}
                        </div>
                        <div className="text-xs text-muted-foreground">· {items.length} unidade(s)</div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {items.map((u) => (
                          <EstoqueThumb
                            key={u.id}
                            item={u}
                            onRemove={() => removeUnit(u.id)}
                            onSaveDdd={(d) => saveDdd(u.id, d)}
                          />
                        ))}
                      </div>
                    </div>
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
