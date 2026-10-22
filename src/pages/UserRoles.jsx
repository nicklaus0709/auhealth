import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Shield, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import CreateUserModal from "@/components/users/CreateUserModal";
import AssignRoleCard from "@/components/users/AssignRoleCard";
import UsersTable from "@/components/users/UsersTable";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { ROL_LABEL } from "@/lib/roles";
import { auditar } from "@/lib/log";

export default function UserRoles() {
  const { toast } = useToast();
  const { esAdmin, nombre } = useSesion();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [asignando, setAsignando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const lista = await base44.entities.User.list();
      setUsuarios(lista.items ?? lista);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (esAdmin) cargar();
  }, [esAdmin]);

  if (!esAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState
          icon={ShieldAlert}
          titulo="No tenés permisos para ver esta sección"
          descripcion="Sólo los administradores pueden gestionar usuarios y roles."
        />
      </div>
    );
  }

  const crearUsuario = async ({ nombre_completo, email, rol, invitar }) => {
    setCreando(true);
    try {
      await base44.users.inviteUser(email, rol === "admin" ? "admin" : "user");
      try {
        const lista = await base44.entities.User.list();
        const todos = lista.items ?? lista;
        const creado = todos.find((u) => (u.email || "").toLowerCase() === email);
        if (creado) {
          await base44.entities.User.update(creado.id, { nombre_completo, roles: [rol] });
        }
      } catch (error) {
        // el rol se puede asignar luego desde "Asignar Rol"
      }
      toast({
        title: invitar ? "Invitación enviada" : "Usuario creado",
        description: `${nombre_completo} · ${ROL_LABEL[rol]}`,
      });
      setModalAbierto(false);
      await cargar();
    } catch (error) {
      const mensaje = String(error?.message || "");
      toast({
        variant: "destructive",
        title: /exist|already/i.test(mensaje) ? "Ya existe un usuario con ese email" : "No pudimos crear el usuario",
        description: /exist|already/i.test(mensaje) ? undefined : mensaje,
      });
    } finally {
      setCreando(false);
    }
  };

  const asignarRol = async (usuarioId, rol) => {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    if (!usuario) return;
    const actuales = Array.isArray(usuario.roles) ? usuario.roles : [];
    if (actuales.includes(rol) || (rol === "admin" && usuario.role === "admin")) {
      toast({ title: "El usuario ya tiene ese rol asignado" });
      return;
    }
    setAsignando(true);
    try {
      await base44.entities.User.update(usuarioId, {
        roles: [...actuales, rol],
        ...(rol === "admin" ? { role: "admin" } : {}),
      });
      auditar("rol_asignado", "User", { registro: usuarioId, detalle: rol, usuario_nombre: nombre });
      toast({ title: `Rol ${ROL_LABEL[rol]} asignado` });
      await cargar();
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos asignar el rol" });
    } finally {
      setAsignando(false);
    }
  };

  const quitarRol = async (usuario, rol) => {
    const actuales = Array.isArray(usuario.roles) ? usuario.roles : [];
    try {
      await base44.entities.User.update(usuario.id, {
        roles: actuales.filter((r) => r !== rol),
        ...(rol === "admin" ? { role: "user" } : {}),
      });
      auditar("rol_quitado", "User", { registro: usuario.id, detalle: rol, usuario_nombre: nombre });
      toast({ title: `Rol ${ROL_LABEL[rol]} quitado` });
      await cargar();
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos quitar el rol" });
    }
  };

  return (
    <div>
      <PageHeader
        icon={Shield}
        titulo="Gestión de Usuarios y Roles"
        subtitulo="Administra los roles de acceso del sistema"
        accion={
          <Button className="btn-gradient" onClick={() => setModalAbierto(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo usuario
          </Button>
        }
      />

      <AssignRoleCard usuarios={usuarios} onAsignar={asignarRol} asignando={asignando} />

      <section className="mt-6">
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Usuarios del Sistema</h2>
        {cargando ? (
          <div className="flex justify-center py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card shadow-soft">
            <EmptyState icon={Shield} titulo="Todavía no hay usuarios registrados" />
          </div>
        ) : (
          <UsersTable usuarios={usuarios} onQuitarRol={quitarRol} />
        )}
      </section>

      <CreateUserModal
        abierto={modalAbierto}
        onOpenChange={setModalAbierto}
        usuarios={usuarios}
        onCrear={crearUsuario}
        creando={creando}
      />
    </div>
  );
}