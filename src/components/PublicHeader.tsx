import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Headphones, Moon, Send, Smartphone, Sun } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const currentLang = { code: "pt", localized: "Português (Brasil)", iso: "br" };

type Theme = "light" | "dark";

export default function PublicHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "light");

  const handleSupport = () => {
    if (user) {
      window.dispatchEvent(new CustomEvent("open-support"));
    } else {
      toast.info("Faça login para acessar o chat de suporte");
      navigate("/login");
    }
  };

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
          <button onClick={handleSupport} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors" aria-label="Suporte">
            <Headphones size={13} className="text-primary" />
            <span>Suporte</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground" aria-label="Idioma">
            <img src={`https://flagcdn.com/24x18/${currentLang.iso}.png`} alt={currentLang.iso} className="w-5 h-auto rounded-[2px]" />
            <span>{currentLang.localized}</span>
          </span>
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
