import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ROL_OPTIONS } from "@/lib/roles";

const VACIO = { nombre_completo: "", email: "", rol: "recepcionista", invitar: true };

export default function CreateUserModal({ abierto, onOpenChange, usuarios, onCrear, creando }) {
  const [datos, setDatos] = useState(VACIO);
  const [error, setError] = useState("");

  useEffect(() => {
    if (abierto) {
      setDatos(VACIO);
      setError("");
    }
  }, [abierto]);

  const enviar = (e) => {
    e.preventDefault();
    const email = datos.email.trim().toLowerCase();
    if (!datos.nombre_completo.trim()) {
      setError("Ingresá el nombre completo");
      return;
    }
    if (usuarios.some((u) => (u.email || "").toLowerCase() === email)) {
      setError("Ya existe un usuario con ese email");
      return;
    }
    setError("");
    onCrear({ ...datos, nombre_completo: datos.nombre_completo.trim(), email });
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Nuevo usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nuevo-nombre">Nombre completo</Label>
            <Input
              id="nuevo-nombre"
              required
              value={datos.nombre_completo}
              onChange={(e) => setDatos((p) => ({ ...p, nombre_completo: e.target.value }))}
              placeholder="Dra. Ana Gómez"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevo-email">Email</Label>
            <Input
              id="nuevo-email"
              type="email"
              required
              value={datos.email}
              onChange={(e) => setDatos((p) => ({ ...p, email: e.target.value }))}
              placeholder="ana@consultorio.com"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevo-rol">Rol</Label>
            <Select value={datos.rol} onValueChange={(valor) => setDatos((p) => ({ ...p, rol: valor }))}>
              <SelectTrigger id="nuevo-rol" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROL_OPTIONS.map((rol) => (
                  <SelectItem key={rol.value} value={rol.value}>
                    {rol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="nuevo-invitar" className="text-sm font-medium">
                  Enviar invitación por email
                </Label>
                <p className="text-xs text-muted-foreground">El usuario define su propia contraseña</p>
              </div>
              <Switch
                id="nuevo-invitar"
                checked={datos.invitar}
                onCheckedChange={(v) => setDatos((p) => ({ ...p, invitar: v }))}
              />
            </div>
            {!datos.invitar && (
              <p className="mt-3 text-xs text-muted-foreground">
                La cuenta se crea igual: la persona definirá su contraseña al ingresar con este email.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creando}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-gradient" disabled={creando}>
              {creando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {datos.invitar ? "Enviar invitación" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}