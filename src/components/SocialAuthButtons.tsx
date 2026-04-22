const socialMethods = [
  {
    name: "Google",
    className: "social-google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 social-auth-icon" aria-hidden="true">
        <path fill="currentColor" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.43Z" />
        <path fill="currentColor" d="M12 22c2.7 0 4.96-.9 6.62-2.34l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22Z" opacity="0.82" />
        <path fill="currentColor" d="M6.41 13.98A6 6 0 0 1 6.1 12c0-.69.11-1.35.31-1.98v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.58l3.34-2.6Z" opacity="0.72" />
        <path fill="currentColor" d="M12 5.9c1.47 0 2.78.5 3.82 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.93 5.42l3.34 2.6C7.2 7.66 9.4 5.9 12 5.9Z" opacity="0.9" />
      </svg>
    ),
  },
  { name: "X", className: "social-x", icon: <span className="social-auth-icon text-sm font-black leading-none">𝕏</span> },
  {
    name: "Discord",
    className: "social-discord",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 social-auth-icon" aria-hidden="true">
        <path fill="currentColor" d="M19.55 5.06A18.7 18.7 0 0 0 14.86 3.6l-.23.46c1.69.4 2.48.97 2.48.97a15.6 15.6 0 0 0-10.2 0s.8-.57 2.49-.97l-.23-.46c-1.65.3-3.22.8-4.69 1.46C1.53 9.45.73 13.73 1.13 17.94a18.9 18.9 0 0 0 5.75 2.89l.7-.96a12 12 0 0 1-1.1-.52l.26-.2c2.12 1 4.42 1 5.27 1s3.15 0 5.27-1l.26.2c-.35.2-.72.37-1.1.52l.7.96a18.86 18.86 0 0 0 5.75-2.9c.47-4.86-.8-9.1-3.34-12.87ZM8.45 15.38c-1.12 0-2.04-1.03-2.04-2.3 0-1.26.9-2.29 2.04-2.29 1.15 0 2.06 1.04 2.04 2.3 0 1.26-.9 2.29-2.04 2.29Zm7.1 0c-1.12 0-2.04-1.03-2.04-2.3 0-1.26.9-2.29 2.04-2.29 1.15 0 2.06 1.04 2.04 2.3 0 1.26-.9 2.29-2.04 2.29Z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    className: "social-github",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 social-auth-icon" aria-hidden="true">
        <path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.18-3.37-1.18-.45-1.15-1.1-1.46-1.1-1.46-.91-.62.06-.61.06-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.54 9.54 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    ),
  },
];

type SocialAuthButtonsProps = {
  labelPrefix: "Login" | "Cadastro";
};

export function SocialAuthButtons({ labelPrefix }: SocialAuthButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {socialMethods.map((method) => (
        <button
          key={method.name}
          type="button"
          className={`${method.className} inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/35 px-2 text-xs font-semibold text-muted-foreground backdrop-blur transition-colors hover:border-primary/60 hover:text-primary`}
          aria-label={`${labelPrefix} com ${method.name} indisponível`}
        >
          {method.icon}
          <span>{method.name}</span>
        </button>
      ))}
    </div>
  );
}