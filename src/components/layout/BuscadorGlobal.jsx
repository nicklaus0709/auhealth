import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { log } from "@/lib/log";

/** Buscador de pacientes desde cualquier pantalla (Ctrl+K / ⌘K): lleva a la ficha del paciente. */
export default function BuscadorGlobal() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const alPresionar = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto((v) => !v);
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  useEffect(() => {
    const termino = texto.trim();
    if (!abierto || termino.length < 2) {
      setResultados([]);
      return;
    }
    let vivo = true;
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await base44.entities.Paciente.filter(
          {
            $or: [
              { nombre_completo: { $regex: termino, $options: "i" } },
              { dni: { $regex: termino, $options: "i" } },
              { numero_ficha: { $regex: termino, $options: "i" } },
            ],
          },
          { sort: "nombre_completo", limit: 12 }
        );
        if (vivo) setResultados(res.items ?? res);
      } catch (error) {
        log.error("Falló la búsqueda global", error, { componente: "BuscadorGlobal" });
      } finally {
        if (vivo) setBuscando(false);
      }
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [texto, abierto]);

  const ir = (paciente) => {
    setAbierto(false);
    setTexto("");
    navigate(`/patients/${paciente.id}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-brand-teal/40"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar paciente...</span>
        <kbd className="hidden rounded border border-border px-1.5 text-[10px] font-medium sm:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={abierto} onOpenChange={setAbierto} shouldFilter={false}>
        <CommandInput value={texto} onValueChange={setTexto} placeholder="Nombre, DNI o número de ficha..." />
        <CommandList>
          {buscando ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CommandEmpty>{texto.trim().length < 2 ? "Escribí al menos 2 letras" : "No se encontraron pacientes"}</CommandEmpty>
          )}
          {!buscando && resultados.length > 0 && (
            <CommandGroup heading="Pacientes">
              {resultados.map((p) => (
                <CommandItem key={p.id} value={p.id} onSelect={() => ir(p)}>
                  <span className="truncate">{p.nombre_completo}</span>
                  <span className="ml-auto pl-2 text-xs text-muted-foreground">
                    {[p.numero_ficha, p.dni && `DNI ${p.dni}`].filter(Boolean).join(" · ")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
