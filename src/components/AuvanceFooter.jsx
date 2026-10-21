export default function AuvanceFooter() {
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full">
      <div className="bg-[linear-gradient(135deg,#1A2550_0%,#1E2D5E_50%,#1A2550_100%)] px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-lg">
            <span className="font-heading text-xl font-extrabold text-[#1A2550]">A</span>
          </div>
          <p className="text-base font-semibold text-white">Auvance</p>
          <p className="text-sm text-white/80">Automatizamos tu Progreso</p>
        </div>
      </div>
      <div className="border-t border-[#E0E5EB] bg-[#F3F4F6] px-6 py-5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-[#6C7C93]">
            © {anio} AuHealth - Gestiona tu tiempo - Gestiona la atención al paciente.
          </p>
          <p className="mt-1 text-sm font-medium text-[#C9953C]">Auvance - Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  );
}