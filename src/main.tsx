import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Tema escuro roxo como padrão do sistema todo
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
