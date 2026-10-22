# AuHealth: pendientes de la propuesta

Lo que quedó sin implementar de [propuesta-producto-auhealth.md](propuesta-producto-auhealth.md). Todo necesita una cuenta, un trámite o una decisión del consultorio antes de programarlo. Actualizado el 22/10/2026.

| Pendiente | Qué hace falta para avanzar | Qué ya está preparado |
|---|---|---|
| **Receta electrónica** (Ley 27.553) | Elegir una plataforma de recetas habilitada y obtener su acceso de integración (API) | Datos del profesional (matrícula, firma), diagnóstico CIE-10 y documentos clínicos. Las recetas quedaron fuera de los documentos a propósito |
| **Recordatorios automáticos por WhatsApp** | Cuenta de WhatsApp Business API (Meta o un proveedor) y una función programada en Base44 | Recordatorio manual por WhatsApp (link) y por email, con registro de cuándo se envió |
| **Confirmar o cancelar el turno desde un link** | Página pública sin login y la decisión de exponerla | Estados del turno y campo de recordatorio |
| **Facturación electrónica ARCA** (web service WSFE) | Certificado digital del CUIT del consultorio y el alta del servicio en ARCA. Se programa como función backend | CUIT y condición de IVA del consultorio, marca de "facturado" y número de comprobante en cada cobro |
| **Cobro online con Mercado Pago** | Cuenta de Mercado Pago y sus credenciales | Cobros con medios de pago y estado |
| **Turnos online / portal del paciente** | Decidir cómo entran los pacientes: hoy la app es solo por invitación | Agenda por profesional con horarios y bloqueos (base para mostrar huecos libres) |
| **Teleconsulta** | Elegir un servicio de videollamadas | Historia clínica vinculada al turno |
| **Doble factor de autenticación** | Ver qué ofrece Base44 en su configuración de login, o sumar un proveedor | Cierre de sesión por inactividad |
| **Catálogo CIE-10 completo** | Cargar el catálogo oficial (~14.000 códigos) como entidad | Buscador con ~80 códigos frecuentes y carga manual de cualquier código |
| **Fusión de fichas duplicadas** | Definir reglas de qué ficha se conserva | Aviso de DNI repetido al crear o editar |
| **Odontograma y curvas de crecimiento** | Confirmar que hay especialidades que lo usen | Plantillas de odontología y pediatría |

## Otros pendientes técnicos

- **Verificar después de publicar:** que la regla `{"data.roles": "medico"}` de Base44 reconozca el rol dentro del array `roles`. Para probarlo, un médico tiene que ver los historiales y una recepcionista no.
- La auditoría y el control de ficha duplicada se escriben desde el navegador. Para que no se puedan saltear conviene moverlos a funciones backend.
- Limpiar dependencias sin uso del `package.json` (three, leaflet, stripe, quill, moment, etc.).
