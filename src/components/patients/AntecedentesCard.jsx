import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { auditar, log } from "@/lib/log";

export const CAMPOS_ANTECEDENTES = [
  { campo: "alergias", label: "Alergias", placeholder: "Penicilina, AINEs, látex..." },
  { campo: "medicacion_habitual", label: "Medicación habitual", placeholder: "Enalapril 10 mg/día..." },
  { campo: "enfermedades_cronicas", label: "Enfermedades crónicas", placeholder: "HTA, DBT tipo 2..." },
  { campo: "antecedentes_quirurgicos", label: "Antecedentes quirúrgicos", placeholder: "Apendicectomía (2015)..." },
  { campo: "antecedentes_familiares", label: "Antecedentes familiares", placeholder: "Padre con IAM a los 60..." },
  { campo: "habitos", label: "Hábitos", placeholder: "Tabaquismo, alcohol, actividad física..." },
];

const GRUPOS = ["0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const SIN_GRUPO = "__sin__";

/** Antecedentes fijos del paciente (uno por paciente). Sólo médicos y admin: lo exige también el RLS. */
export default function AntecedentesCard({ paciente, antecedentes, onGuardado }) {
  const { toast } = useToast();
  const { nombre, user } = useSesion();
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setDatos(antecedentes || {});
  }, [antecedentes]);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const campos = Object.fromEntries(CAMPOS_ANTECEDENTES.map(({ campo }) => [campo, datos[campo] || ""]));
    const payload = {
      ...campos,
      grupo_sanguineo: datos.grupo_sanguineo || "",
      actualizado_por: user?.id || "",
      actualizado_por_nombre: nombre,
    };
    try {
      if (antecedentes?.id) await base44.entities.Antecedentes.update(antecedentes.id, payload);
      else await base44.entities.Antecedentes.create({ paciente: paciente.id, ...payload });
      auditar("editar", "Antecedentes", { registro: antecedentes?.id || "", paciente: paciente.id, usuario_nombre: nombre });
      toast({ title: "Antecedentes guardados" });
      setEditando(false);
      onGuardado?.();
    } catch (error) {
      log.error("No se pudieron guardar los antecedentes", error, { componente: "AntecedentesCard" });
      toast({ variant: "destructive", title: "No pudimos guardar los antecedentes", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  if (!editando) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">Antecedentes</h2>
          <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {antecedentes ? "Editar" : "Cargar"}
          </Button>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {CAMPOS_ANTECEDENTES.map(({ campo, label }) => (
            <div key={campo}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className={`mt-1 whitespace-pre-wrap text-sm ${campo === "alergias" && antecedentes?.alergias ? "font-semibold text-brand-danger-700" : "text-foreground"}`}>
                {antecedentes?.[campo] || "—"}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grupo sanguíneo</dt>
            <dd className="mt-1 text-sm text-foreground">{antecedentes?.grupo_sanguineo || "—"}</dd>
          </div>
        </dl>
        {antecedentes?.actualizado_por_nombre && (
          <p className="mt-4 text-xs text-muted-foreground">Última actualización: {antecedentes.actualizado_por_nombre}</p>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={guardar} className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="font-heading text-base font-semibold text-foreground">Antecedentes</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {CAMPOS_ANTECEDENTES.map(({ campo, label, placeholder }) => (
          <div key={campo} className="space-y-2">
            <Label htmlFor={`ant-${campo}`}>{label}</Label>
            <Textarea
              id={`ant-${campo}`}
              rows={2}
              value={datos[campo] || ""}
              onChange={(e) => setDatos((p) => ({ ...p, [campo]: e.target.value }))}
              placeholder={placeholder}
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="ant-grupo">Grupo sanguíneo</Label>
          <Select
            value={datos.grupo_sanguineo || SIN_GRUPO}
            onValueChange={(v) => setDatos((p) => ({ ...p, grupo_sanguineo: v === SIN_GRUPO ? "" : v }))}
          >
            <SelectTrigger id="ant-grupo" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_GRUPO}>Sin dato</SelectItem>
              {GRUPOS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setEditando(false)} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" className="btn-gradient" disabled={guardando}>
          {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar antecedentes
        </Button>
      </div>
    </form>
  );
}
