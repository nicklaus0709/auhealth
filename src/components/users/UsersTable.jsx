import { useState } from "react";
import { X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { ROL_BADGE, ROL_LABEL, rolesDe } from "@/lib/roles";
import { cn } from "@/lib/utils";

const nombreDe = (usuario) => usuario?.nombre_completo || usuario?.full_name || "—";

export default function UsersTable({ usuarios, onQuitarRol }) {
  const [pendiente, setPendiente] = useState(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => {
              const roles = rolesDe(usuario);
              return (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium text-foreground">{nombreDe(usuario)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell>
                    {roles.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Sin roles</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {roles.map((rol) => (
                          <span
                            key={rol}
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                              ROL_BADGE[rol]
                            )}
                          >
                            {ROL_LABEL[rol]}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        roles.map((rol) => (
                          <button
                            key={rol}
                            type="button"
                            onClick={() => setPendiente({ usuario, rol })}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                            Quitar {ROL_LABEL[rol]}
                          </button>
                        ))
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendiente} onOpenChange={(abierto) => !abierto && setPendiente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Quitar el rol {ROL_LABEL[pendiente?.rol] || ""} de {nombreDe(pendiente?.usuario)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El usuario perderá los permisos asociados a ese rol. Podés volver a asignárselo cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onQuitarRol(pendiente.usuario, pendiente.rol);
                setPendiente(null);
              }}
            >
              Quitar rol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}