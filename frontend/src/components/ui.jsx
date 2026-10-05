export function Card({ children, className = "", ...props }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    red: "bg-rose-50 text-rose-700 ring-rose-600/10",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
    slate: "bg-slate-100 text-slate-700 ring-slate-600/10",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-600",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-500",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-500",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
