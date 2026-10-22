import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { buscarCie10 } from "@/lib/cie10";
import { cn } from "@/lib/utils";

/** Buscador de diagnóstico CIE-10. Al elegir, completa el código y propone la descripción como diagnóstico. */
export default function Cie10Input({ id, codigo, onElegir }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const resultados = useMemo(() => buscarCie10(texto), [texto]);
  const manual = texto.trim().toUpperCase();

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
            !codigo && "text-muted-foreground"
          )}
        >
          <span className="truncate">{codigo || "Buscar código CIE-10 (opcional)"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={texto} onValueChange={setTexto} placeholder="Código o descripción (ej: J06, lumbago)" />
          <CommandList>
            <CommandEmpty>
              {manual ? (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-brand-teal-700 hover:underline"
                  onClick={() => {
                    onElegir({ codigo: manual, descripcion: "" });
                    setAbierto(false);
                  }}
                >
                  Usar el código «{manual}»
                </button>
              ) : (
                "Sin resultados"
              )}
            </CommandEmpty>
            {codigo && (
              <CommandItem
                value="__quitar__"
                onSelect={() => {
                  onElegir({ codigo: "", descripcion: "" });
                  setAbierto(false);
                }}
              >
                <span className="text-muted-foreground">Quitar código</span>
              </CommandItem>
            )}
            {resultados.map((c) => (
              <CommandItem
                key={c.codigo}
                value={c.codigo}
                onSelect={() => {
                  onElegir(c);
                  setAbierto(false);
                  setTexto("");
                }}
              >
                <span className="tabular w-14 shrink-0 font-mono text-xs font-semibold">{c.codigo}</span>
                <span className="truncate">{c.descripcion}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
