import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Headphones, Moon, Send, Smartphone, Sun } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type LangOption = { code: string; native: string; localized: string; iso: string };
type LangGroup = { region: string; items: LangOption[] };

const languageGroups: LangGroup[] = [
  { region: "Recomendados", items: [
    { code: "pt", native: "Português", localized: "Português (Brasil)", iso: "br" },
    { code: "en", native: "English", localized: "Inglês", iso: "gb" },
  ]},
  { region: "Europa", items: [
    { code: "ru", native: "Русский", localized: "Russo", iso: "ru" },
    { code: "uk", native: "Українська", localized: "Ucraniano", iso: "ua" },
    { code: "de", native: "Deutsch", localized: "Alemão", iso: "de" },
    { code: "es", native: "Español", localized: "Espanhol", iso: "es" },
    { code: "pt-PT", native: "Português", localized: "Português (Portugal)", iso: "pt" },
  ]},
  { region: "Oriente Médio", items: [
    { code: "tr", native: "Türkçe", localized: "Turco", iso: "tr" },
  ]},
  { region: "Ásia Central", items: [
    { code: "az", native: "Azərbaycan", localized: "Azerbaijano", iso: "az" },
    { code: "uz", native: "Oʻzbekcha", localized: "Uzbeque", iso: "uz" },
  ]},
  { region: "Ásia", items: [
    { code: "zh", native: "简体中文", localized: "Chinês (simplificado)", iso: "cn" },
  ]},
  { region: "Ásia do Sul", items: [
    { code: "hi", native: "हिन्दी", localized: "Hindi", iso: "in" },
    { code: "bn", native: "বাংলা", localized: "Bengali", iso: "bd" },
  ]},
];

type Theme = "light" | "dark";

export default function PublicHeader() {
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState<string>(() => localStorage.getItem("lang") || "pt");
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "light");
  const currentLang = languageGroups.flatMap((g) => g.items).find((l) => l.code === language) ?? languageGroups[0].items[0];

  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <>
      {/* Topbar fina */}
      <div className="relative z-10 text-[11px] sm:text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-end px-3 sm:px-6 py-2 text-muted-foreground gap-4 sm:gap-6">
          <a href="https://t.me/cometasms_support" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 hover:text-primary transition-colors">
            <Send size={13} className="text-primary" />
            <span>Telegram</span>
          </a>
          <a href="https://t.me/cometasms_support" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
            <Headphones size={13} className="text-primary" />
            <span>Suporte</span>
          </a>
          <Popover open={langOpen} onOpenChange={setLangOpen}>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" aria-label="Idioma">
                <img src={`https://flagcdn.com/24x18/${currentLang.iso}.png`} alt={currentLang.iso} className="w-5 h-auto rounded-[2px]" />
                <span>{currentLang.localized}</span>
                <ChevronDown size={12} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[640px] max-w-[90vw] max-h-[70vh] overflow-y-auto p-6 rounded-xl">
              <div className="space-y-5">
                {languageGroups.map((group) => (
                  <div key={group.region}>
                    <div className="text-sm font-semibold text-foreground mb-3">{group.region}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
                      {group.items.map((opt) => (
                        <button
                          key={opt.code}
                          onClick={() => { setLanguage(opt.code); setLangOpen(false); }}
                          className={`flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-secondary/60 transition ${language === opt.code ? "bg-secondary/40" : ""}`}
                        >
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary overflow-hidden">
                            <img src={`https://flagcdn.com/48x36/${opt.iso}.png`} alt={opt.iso} className="w-6 h-auto rounded-[2px]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">{opt.native}</span>
                            <span className="block text-xs text-muted-foreground truncate">{opt.localized}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div className="inline-flex items-center gap-1.5">
            {theme === "light" ? (
              <button onClick={() => setTheme("dark")} className="inline-flex items-center gap-1.5 text-primary hover:opacity-80 transition" aria-label="Escuro">
                <Sun size={13} />
                <span>Claro</span>
              </button>
            ) : (
              <button onClick={() => setTheme("light")} className="inline-flex items-center gap-1.5 text-primary hover:opacity-80 transition" aria-label="Claro">
                <Moon size={13} />
                <span>Escuro</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header com logo + nav */}
      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="cometa sms">
            <div className="leading-none">
              <div className="font-display text-xl sm:text-2xl text-primary tracking-tight">cometa</div>
              <div className="font-mono-x text-[10px] text-primary tracking-[0.42em] -mt-0.5 text-center">sms</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-9 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/" className="hover:text-primary transition-colors">Ativação</Link>
            <Link to="/precos" className="hover:text-primary transition-colors">Lista de preços</Link>
            <Link to="/" className="hover:text-primary transition-colors">Ajuda</Link>
          </nav>

          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/35 bg-card px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.08),0_12px_28px_-14px_hsl(var(--primary))] transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
            aria-label="Login"
          >
            <Smartphone size={14} className="sm:hidden" />
            <Smartphone size={16} className="hidden sm:block" />
            <span className="hidden sm:inline">Entrar</span>
            <span className="sm:hidden">Entrar</span>
          </button>
        </div>
      </header>
    </>
  );
}
