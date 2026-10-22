import { Pencil, UserX } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { fechaCorta, valorODash } from "@/lib/format";

export default function PatientTable({ pacientes, onEditar, onEliminar, esAdmin }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px]">N° Ficha</TableHead>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Obra Social</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pacientes.map((paciente) => (
            <TableRow key={paciente.id}>
              <TableCell className="font-mono text-sm font-medium text-brand-teal">
                {valorODash(paciente.numero_ficha)}
              </TableCell>
              <TableCell>
                <p className="font-medium text-foreground">{paciente.nombre_completo}</p>
                <p className="text-xs text-muted-foreground">Nac. {fechaCorta(paciente.fecha_nacimiento)}</p>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{valorODash(paciente.dni)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{valorODash(paciente.telefono)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{valorODash(paciente.obra_social)}</TableCell>
              <TableCell>
                <StatusBadge estado={paciente.activo === false ? "inactivo" : "activo"} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    aria-label="Editar paciente"
                    onClick={() => onEditar(paciente)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-brand-teal/10 hover:text-brand-teal"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {esAdmin && paciente.activo !== false && (
                    <button
                      type="button"
                      aria-label="Dar de baja paciente"
                      onClick={() => onEliminar(paciente)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}