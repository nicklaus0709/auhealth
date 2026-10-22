import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const ConfirmContext = createContext(null);

/**
 * Reemplazo de window.confirm con el diálogo de la app.
 * Uso: const confirmar = useConfirm(); if (!(await confirmar({ titulo, descripcion }))) return;
 */
export function ConfirmProvider({ children }) {
  const [opciones, setOpciones] = useState(null);
  const resolver = useRef(null);

  const confirmar = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setOpciones(opts);
      }),
    []
  );

  const cerrar = (valor) => {
    resolver.current?.(valor);
    resolver.current = null;
    setOpciones(null);
  };

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <AlertDialog open={!!opciones} onOpenChange={(abierto) => !abierto && cerrar(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opciones?.titulo}</AlertDialogTitle>
            {opciones?.descripcion && <AlertDialogDescription>{opciones.descripcion}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => cerrar(false)}>{opciones?.cancelar || "Cancelar"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cerrar(true)}
              className={cn(opciones?.peligro ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "btn-gradient")}
            >
              {opciones?.confirmar || "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const contexto = useContext(ConfirmContext);
  if (!contexto) throw new Error("useConfirm debe usarse dentro de ConfirmProvider");
  return contexto;
}
