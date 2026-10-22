// Tipos de documento clínico con su texto base. El profesional lo edita antes de emitir.
// La receta de medicamentos NO está acá a propósito: en Argentina tiene que ser receta electrónica
// emitida por una plataforma habilitada (Ley 27.553); ver docs/propuesta-producto-auhealth.md.
export const TIPOS_DOCUMENTO = {
  orden_estudio: {
    label: "Orden de estudios",
    titulo: "Orden de estudios",
    plantilla: "Solicito:\n- \n- \n\nDiagnóstico presuntivo: ",
  },
  derivacion: {
    label: "Derivación / interconsulta",
    titulo: "Derivación",
    plantilla: "Derivo al paciente a: \nMotivo: \nResumen clínico: \nEstudios adjuntos: ",
  },
  certificado: {
    label: "Certificado",
    titulo: "Certificado médico",
    plantilla:
      "Certifico que el/la paciente fue asistido/a en el día de la fecha.\n\nSe indica reposo por __ días a partir del __/__/____.\n\nSe extiende el presente a pedido del interesado para ser presentado ante quien corresponda.",
  },
  apto_fisico: {
    label: "Apto físico",
    tipo: "certificado",
    titulo: "Certificado de aptitud física",
    plantilla:
      "Certifico que el/la paciente fue evaluado/a clínicamente y no presenta, al momento del examen, contraindicaciones para la realización de actividad física.\n\nValidez: 12 meses.",
  },
  asistencia: {
    label: "Constancia de asistencia",
    tipo: "certificado",
    titulo: "Constancia de asistencia",
    plantilla: "Dejo constancia de que el/la paciente concurrió a consulta en el día de la fecha, de __:__ a __:__ hs.",
  },
  indicaciones: {
    label: "Indicaciones al paciente",
    titulo: "Indicaciones",
    plantilla: "Indicaciones:\n- \n- \n\nPautas de alarma: consultar ante \n\nPróximo control: ",
  },
  consentimiento: {
    label: "Consentimiento informado",
    titulo: "Consentimiento informado",
    plantilla:
      "Yo, el/la paciente abajo firmante, declaro haber sido informado/a en forma clara sobre:\n- La práctica a realizar: \n- Sus beneficios esperados: \n- Sus riesgos y posibles complicaciones: \n- Las alternativas disponibles: \n\nHabiendo podido hacer todas las preguntas, presto mi consentimiento para su realización (Ley 26.529, art. 5).\n\nFirma del paciente: ______________________   Aclaración: ______________________   DNI: __________",
  },
};

/** Opciones del selector: cada una sabe a qué `tipo` de la entidad corresponde. */
export const OPCIONES_DOCUMENTO = Object.entries(TIPOS_DOCUMENTO).map(([clave, t]) => ({
  clave,
  tipo: t.tipo || clave,
  label: t.label,
}));

export const etiquetaTipo = (tipo) => TIPOS_DOCUMENTO[tipo]?.label || tipo;
