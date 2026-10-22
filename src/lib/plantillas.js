// Plantillas de atención por especialidad: completan los campos con una estructura para no empezar en blanco.
// El profesional edita libremente; no reemplazan el criterio clínico.
export const PLANTILLAS = [
  {
    id: "clinica",
    nombre: "Clínica médica - consulta",
    motivo_consulta: "Consulta por: \nTiempo de evolución: \nSíntomas asociados: ",
    diagnostico: "",
    tratamiento: "Indicaciones: \nPautas de alarma: \nControl en: ",
    notas: "Examen físico: \n- Aspecto general: \n- Cardiovascular: \n- Respiratorio: \n- Abdomen: ",
  },
  {
    id: "control",
    nombre: "Control de salud (adulto)",
    motivo_consulta: "Control de salud periódico.",
    diagnostico: "Examen médico general",
    tratamiento: "Laboratorio de rutina: \nVacunas pendientes: \nRastreos según edad: ",
    notas: "Hábitos: \nAntecedentes actualizados: sí / no",
  },
  {
    id: "pediatria",
    nombre: "Pediatría - control de niño sano",
    motivo_consulta: "Control de niño sano.",
    diagnostico: "Control de salud de rutina del niño",
    tratamiento: "Alimentación: \nVacunas según calendario: \nPróximo control: ",
    notas: "Desarrollo madurativo: \nPercentilos: peso __ talla __ PC __\nPautas de crianza conversadas: ",
  },
  {
    id: "kinesiologia",
    nombre: "Kinesiología - sesión",
    motivo_consulta: "Sesión N°: \nDerivación / diagnóstico médico: ",
    diagnostico: "",
    tratamiento: "Técnicas aplicadas: \nEjercicios domiciliarios: ",
    notas: "Dolor (EVA 0-10) al inicio: __ al final: __\nEvolución: ",
  },
  {
    id: "nutricion",
    nombre: "Nutrición - consulta",
    motivo_consulta: "Objetivo de la consulta: ",
    diagnostico: "",
    tratamiento: "Plan alimentario: \nMetas hasta el próximo control: ",
    notas: "Recordatorio de 24 h: \nActividad física: ",
  },
  {
    id: "odontologia",
    nombre: "Odontología - consulta",
    motivo_consulta: "Motivo: \nPieza/s: ",
    diagnostico: "",
    tratamiento: "Práctica realizada: \nPróxima sesión: ",
    notas: "Estado bucal general: ",
  },
];
