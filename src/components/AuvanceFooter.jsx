export default function AuvanceFooter() {
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-[#0F3D22] px-6 py-8 text-center">
      <p className="text-sm text-white/90">
        © {anio} AuHealth - Plataforma Digital para la Gestión Médica. Todos los derechos reservados.
      </p>

      <div className="mx-auto mt-5 flex max-w-xl items-center gap-4">
        <span className="h-px flex-1 bg-white/20" />
        <span className="text-[11px] font-semibold uppercase tracking-[.3em] text-white/60">Desarrollado por</span>
        <span className="h-px flex-1 bg-white/20" />
      </div>

      <a
        href="https://auvance.com.ar"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Auvance - auvance.com.ar"
        className="mt-5 inline-flex items-center gap-2 text-white transition-opacity hover:opacity-80"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 20 12 4l9 16" />
          <path d="M8 20l4-7 4 7" />
        </svg>
        <span className="font-heading text-lg font-bold tracking-wide">AUVANCE</span>
      </a>
    </footer>
  );
}
