const socialMethods = [
  {
    name: "Google",
    bg: "bg-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M21.8 12.23c0-.78-.07-1.53-.2-2.23H12v4.25h5.48a4.68 4.68 0 0 1-2.03 3.07v2.55h3.28c1.92-1.77 3.07-4.37 3.07-7.64Z" />
        <path fill="#34A853" d="M12 22c2.74 0 5.04-.9 6.72-2.44l-3.28-2.55c-.91.61-2.08.97-3.44.97-2.65 0-4.89-1.79-5.69-4.19H2.93v2.63A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.31 13.79A6.01 6.01 0 0 1 6 12c0-.62.11-1.22.31-1.79V7.58H2.93A10 10 0 0 0 2 12c0 1.59.38 3.09.93 4.42l3.38-2.63Z" />
        <path fill="#EA4335" d="M12 6.02c1.49 0 2.83.51 3.88 1.52l2.91-2.91A9.76 9.76 0 0 0 12 2 10 10 0 0 0 2.93 7.58l3.38 2.63C7.11 7.81 9.35 6.02 12 6.02Z" />
      </svg>
    ),
  },
  {
    name: "Yandex",
    bg: "bg-[#FC3F1D]",
    icon: <span className="text-white text-lg font-black leading-none">Я</span>,
  },
  {
    name: "X",
    bg: "bg-black",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#fff" d="M18.9 2h3.25l-7.1 8.12L23.4 22h-6.54l-5.12-6.7L5.88 22H2.62l7.6-8.69L2.2 2h6.7l4.63 6.12L18.9 2Zm-1.14 17.9h1.8L7.92 4H5.98l11.78 15.9Z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    bg: "bg-[#181717]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#fff" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.18-3.37-1.18-.45-1.15-1.1-1.46-1.1-1.46-.91-.62.06-.61.06-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.54 9.54 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    ),
  },
];

type SocialAuthButtonsProps = {
  labelPrefix: "Login" | "Cadastro";
};

export function SocialAuthButtons({ labelPrefix }: SocialAuthButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {socialMethods.map((method) => (
        <button
          key={method.name}
          type="button"
          className={`${method.bg} inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/40 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
          aria-label={`${labelPrefix} com ${method.name} indisponível`}
          title={method.name}
        >
          {method.icon}
        </button>
      ))}
    </div>
  );
}
