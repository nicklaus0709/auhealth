export default function PageHeader({ titulo, subtitulo, icon: Icon, accion }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-teal/10 text-brand-teal-700">
            <Icon className="h-5 w-5" strokeWidth={2.1} />
          </span>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">{titulo}</h1>
          {subtitulo && <p className="mt-0.5 text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
      </div>
      {accion && <div className="flex shrink-0 flex-wrap gap-2">{accion}</div>}
    </div>
  );
}