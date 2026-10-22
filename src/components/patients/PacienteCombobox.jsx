import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { log } from "@/lib/log";
import { cn } from "@/lib/utils";

const etiqueta = (p) => `${p.nombre_completo} - ${p.numero_ficha || "s/ficha"}`;

/**
 * Selector de paciente con búsqueda en el servidor por nombre, DNI o ficha.
 * Reemplaza a los <Select> que cargaban hasta 300 pacientes y dejaban afuera al resto.
 * `seleccionado` es el paciente elegido (objeto) y `onElegir` recibe el paciente completo.
 */
export default function PacienteCombobox({ id, seleccionado, onElegir, soloActivos = true, className, placeholder = "Seleccioná un paciente" }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const termino = texto.trim();
        const consulta = {
          ...(soloActivos ? { activo: true } : {}),
          ...(termino
            ? {
                $or: [
                  { nombre_completo: { $regex: termino, $options: "i" } },
                  { dni: { $regex: termino, $options: "i" } },
                  { numero_ficha: { $regex: termino, $options: "i" } },
                ],
              }
            : {}),
        };
        const res = await base44.entities.Paciente.filter(consulta, { sort: "nombre_completo", limit: 30 });
        if (vivo) setResultados(res.items ?? res);
      } catch (error) {
        log.error("No se pudo buscar pacientes", error, { componente: "PacienteCombobox" });
      } finally {
        if (vivo) setBuscando(false);
      }
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [texto, abierto, soloActivos]);

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={abierto}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-input bg-card px-3 text-left text-sm",
            !seleccionado && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{seleccionado ? etiqueta(seleccionado) : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={texto} onValueChange={setTexto} placeholder="Buscar por nombre, DNI o ficha..." />
          <CommandList>
            {buscando ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommandEmpty>No se encontraron pacientes</CommandEmpty>
            )}
            {!buscando &&
              resultados.map((paciente) => (
                <CommandItem
                  key={paciente.id}
                  value={paciente.id}
                  onSelect={() => {
                    onElegir(paciente);
                    setAbierto(false);
                    setTexto("");
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", seleccionado?.id === paciente.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{etiqueta(paciente)}</span>
                  {paciente.dni && <span className="ml-auto pl-2 text-xs text-muted-foreground">DNI {paciente.dni}</span>}
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
