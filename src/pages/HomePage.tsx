import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { operadorasApi, type Operadora } from "@/lib/api";
import { ArrowUpRight } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);

  useEffect(() => {
    operadorasApi.list()
      .then((r) => setOperadoras(r.operadoras.filter((o) => o.enabled)))
      .catch(() => setOperadoras([
        { id: 1, name: "Claro", enabled: true },
        { id: 2, name: "TIM",   enabled: true },
        { id: 3, name: "Vivo",  enabled: true },
      ]));
  }, []);

  const today = new Date();
  const issue = `Vol. I · No. ${String(today.getDate()).padStart(2, "0")}`;
  const dateStr = today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground noise">
      {/* Masthead */}
      <header className="border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between text-[11px] font-mono uppercase tracking-widest">
          <span>{issue}</span>
          <span className="hidden sm:block">{dateStr}</span>
          <span>BRL · PIX · 24h</span>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-8 flex items-end justify-between gap-6">
          <Link to="/" className="font-display text-[clamp(3rem,9vw,7rem)] leading-[0.85] tracking-[-0.02em]">
            Cometa<span className="italic">sms</span><span className="text-accent">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm pb-4">
            <a className="hover:underline underline-offset-4" href="#produto">Produto</a>
            <a className="hover:underline underline-offset-4" href="#manifesto">Manifesto</a>
            <a className="hover:underline underline-offset-4" href="#numeros">Números</a>
            <a className="hover:underline underline-offset-4" href="#operadoras">Operadoras</a>
            {user ? (
              <button onClick={() => navigate("/recargas")}
                className="ml-2 inline-flex items-center gap-1 bg-foreground text-background px-4 py-2 hover:bg-foreground/85 transition">
                Painel <ArrowUpRight size={14} />
              </button>
            ) : (
              <>
                <Link to="/login" className="hover:underline underline-offset-4">Entrar</Link>
                <Link to="/register"
                  className="ml-2 inline-flex items-center gap-1 bg-foreground text-background px-4 py-2 hover:bg-foreground/85 transition">
                  Abrir conta <ArrowUpRight size={14} />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HERO — editorial */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-2">
            <div className="label-eyebrow">Edição</div>
            <div className="font-mono text-xs mt-1 tabular">№ 01 / 26</div>
          </div>

          <div className="col-span-12 md:col-span-7">
            <h1 className="font-display text-[clamp(3.25rem,9vw,7.5rem)] leading-[0.92] tracking-[-0.02em]">
              Recargas <em className="italic">na</em><br />
              velocidade <span className="relative">
                de um cometa<span className="absolute -bottom-1 left-0 right-0 h-[6px] bg-accent -z-0" />
              </span>.
            </h1>
            <p className="mt-8 text-lg max-w-xl text-ink-soft leading-relaxed">
              Plataforma profissional para recargas de celular &amp; SMS via PIX.
              Sem app, sem cadastro de cartão, sem espera. Apenas tipografia,
              números e infraestrutura que funciona.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to={user ? "/recargas" : "/register"}
                className="group inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm">
                {user ? "Fazer recarga" : "Começar agora"}
                <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link to="/login" className="text-sm underline underline-offset-4 hover:text-foreground/70">
                já tenho conta →
              </Link>
            </div>
          </div>

          <aside className="col-span-12 md:col-span-3 border-l border-border md:pl-6">
            <div className="label-eyebrow">Resumo</div>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex justify-between border-b border-dotted border-border pb-2">
                <span>Confirmação</span><span className="font-mono tabular">≈ 4s</span>
              </li>
              <li className="flex justify-between border-b border-dotted border-border pb-2">
                <span>Operadoras</span><span className="font-mono tabular">{operadoras.length || 3}</span>
              </li>
              <li className="flex justify-between border-b border-dotted border-border pb-2">
                <span>Disponibilidade</span><span className="font-mono tabular">99,9%</span>
              </li>
              <li className="flex justify-between">
                <span>Taxa</span><span className="font-mono tabular">0,00</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      {/* Marquee */}
      <section className="border-b border-border overflow-hidden">
        <div className="flex marquee-track whitespace-nowrap py-4 font-display text-3xl">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-10 pr-10">
              <span>Claro</span><span className="asterisk">*</span>
              <span>TIM</span><span className="asterisk">*</span>
              <span>Vivo</span><span className="asterisk">*</span>
              <span><em className="italic">PIX instantâneo</em></span><span className="asterisk">*</span>
              <span>API v2</span><span className="asterisk">*</span>
              <span>24h / 7</span><span className="asterisk">*</span>
              <span><em className="italic">sem fricção</em></span><span className="asterisk">*</span>
            </div>
          ))}
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="manifesto" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <div className="label-eyebrow">§ 01</div>
            <div className="font-display text-3xl mt-2">Manifesto</div>
          </div>
          <div className="col-span-12 md:col-span-9">
            <p className="font-display text-3xl md:text-4xl leading-snug">
              Acreditamos que <em className="italic">recarregar um celular</em> deveria
              ser tão silencioso quanto enviar uma mensagem. Sem pop-ups, sem
              promoções, sem fricção — apenas <span className="bg-accent/60 px-1">o número, o valor e a confirmação</span>.
            </p>
            <div className="mt-10 grid sm:grid-cols-3 gap-8 text-sm text-ink-soft">
              <div>
                <div className="label-eyebrow text-foreground">↳ Honesto</div>
                <p className="mt-2">Você paga exatamente o valor exibido. Sem taxa oculta, sem letras miúdas.</p>
              </div>
              <div>
                <div className="label-eyebrow text-foreground">↳ Rápido</div>
                <p className="mt-2">Confirmação via webhook em segundos. Saldo creditado no ato.</p>
              </div>
              <div>
                <div className="label-eyebrow text-foreground">↳ Discreto</div>
                <p className="mt-2">Interface monocromática, sem distrações. Foco total no que importa.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NÚMEROS */}
      <section id="numeros" className="border-b border-border bg-paper-2">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="label-eyebrow">§ 02</div>
              <h2 className="font-display text-5xl mt-2">Em números</h2>
            </div>
            <div className="text-xs font-mono text-muted-foreground">fonte: telemetria interna</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border border-y border-foreground">
            {[
              { k: "Recargas/dia",    v: "12.481", sub: "média móvel 30d" },
              { k: "Latência média",  v: "3.8s",   sub: "PIX → confirmação" },
              { k: "Uptime",          v: "99,94%", sub: "últimos 90 dias" },
              { k: "Operadoras",      v: "03",     sub: "Claro · TIM · Vivo" },
            ].map((s) => (
              <div key={s.k} className="px-6 py-8">
                <div className="label-eyebrow">{s.k}</div>
                <div className="font-display text-5xl md:text-6xl mt-2 tabular">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-2">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPERADORAS */}
      <section id="operadoras" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="label-eyebrow">§ 03</div>
          <h2 className="font-display text-5xl mt-2 mb-10">Operadoras suportadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-foreground">
            {(operadoras.length ? operadoras : [
              { id: 1, name: "Claro", enabled: true },
              { id: 2, name: "TIM",   enabled: true },
              { id: 3, name: "Vivo",  enabled: true },
            ]).map((op, i) => (
              <button key={op.id}
                onClick={() => (user ? navigate(`/recargas?operadora=${op.id}`) : navigate("/login"))}
                className="group text-left p-8 border-b md:border-b-0 md:border-r border-border last:border-r-0 hover:bg-paper-2 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="font-mono text-xs text-muted-foreground">0{i + 1}</div>
                  <ArrowUpRight size={18} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-display text-6xl mt-6">{op.name}</div>
                <div className="mt-4 text-sm text-ink-soft">Recarga de R$ 10 a R$ 100 — confirmação imediata.</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-8">
            <div className="label-eyebrow text-background/60">§ 04 · Próximo passo</div>
            <h2 className="font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95] mt-3">
              Faça sua primeira <em className="italic">recarga</em> em <span className="text-accent">menos de um minuto</span>.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-4 flex md:justify-end">
            <Link to={user ? "/recargas" : "/register"}
              className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-4 text-sm">
              {user ? "Ir ao painel" : "Criar conta grátis"}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-6 text-sm">
          <div className="col-span-12 md:col-span-5">
            <div className="font-display text-3xl">Cometa<em className="italic">sms</em>.</div>
            <p className="text-ink-soft mt-3 max-w-sm">
              Recargas e SMS para o Brasil moderno. Operação em São Paulo, infraestrutura redundante.
            </p>
          </div>
          {[
            { t: "Produto", l: ["Recargas", "API", "Status", "Changelog"] },
            { t: "Empresa", l: ["Sobre", "Manifesto", "Imprensa", "Contato"] },
            { t: "Legal",   l: ["Termos", "Privacidade", "Cookies", "LGPD"] },
          ].map((c) => (
            <div key={c.t} className="col-span-6 md:col-span-2">
              <div className="label-eyebrow mb-3">{c.t}</div>
              <ul className="space-y-1.5">
                {c.l.map((i) => <li key={i}><a className="hover:underline underline-offset-4" href="#">{i}</a></li>)}
              </ul>
            </div>
          ))}
          <div className="col-span-12 mt-8 pt-6 border-t border-border flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span>© MMXXVI — Cometa SMS</span>
            <span>Feito com tipografia em São Paulo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
