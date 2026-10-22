import { useEffect, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useConsultorio } from "@/hooks/useDatos";
import { fechaHora } from "@/lib/format";
import { log } from "@/lib/log";
import { enviarRecordatorioEmail, linkWhatsapp, marcarRecordado, mensajeRecordatorio } from "@/lib/recordatorios";

/** Botones para recordar un turno por WhatsApp (link) o email, y registro de cuándo se recordó. */
export default function RecordatorioBotones({ turno, paciente: pacienteDado = null, compacto = false, onRecordado }) {
  const { toast } = useToast();
  const { data: consultorio } = useConsultorio();
  const [paciente, setPaciente] = useState(pacienteDado);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (pacienteDado || !turno?.paciente) return;
    base44.entities.Paciente.get(turno.paciente)
      .then(setPaciente)
      .catch((error) => log.error("No se pudo leer el contacto del paciente", error, { componente: "RecordatorioBotones" }));
  }, [turno?.paciente, pacienteDado]);

  if (!turno) return null;
  const texto = mensajeRecordatorio(turno, consultorio);
  const wa = linkWhatsapp(paciente?.telefono, texto);

  const registrar = async (medio) => {
    try {
      await marcarRecordado(turno, medio);
      onRecordado?.(turno, medio);
    } catch (error) {
      log.error("No se pudo registrar el recordatorio", error, { componente: "RecordatorioBotones" });
    }
  };

  const porEmail = async () => {
    setEnviando(true);
    try {
      await enviarRecordatorioEmail(turno, paciente, consultorio);
      await registrar("email");
      toast({ title: "Recordatorio enviado por email" });
    } catch (error) {
      log.error("No se pudo enviar el recordatorio por email", error, { componente: "RecordatorioBotones" });
      toast({ variant: "destructive", title: "No pudimos enviar el email", description: "El envío funciona sólo en la app publicada." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={!wa}
        title={wa ? "Abre WhatsApp con el mensaje listo" : "El paciente no tiene un celular cargado"}
        onClick={() => {
          window.open(wa, "_blank", "noopener");
          registrar("whatsapp");
        }}
      >
        <MessageCircle className="mr-1 h-3.5 w-3.5" />
        {compacto ? "WhatsApp" : "Recordar por WhatsApp"}
      </Button>
      <Button size="sm" variant="outline" disabled={!paciente?.email || enviando} title={paciente?.email ? paciente.email : "Sin email cargado"} onClick={porEmail}>
        <Mail className="mr-1 h-3.5 w-3.5" />
        {compacto ? "Email" : "Recordar por email"}
      </Button>
      {turno.recordatorio_enviado && (
        <span className="text-xs text-muted-foreground">
          Recordado {fechaHora(turno.recordatorio_enviado)} ({turno.recordatorio_medio})
        </span>
      )}
    </div>
  );
}
