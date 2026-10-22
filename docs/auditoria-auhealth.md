# Auditoría técnica: AuHealth

| | |
|---|---|
| **Repositorio** | `nicklaus0709/auhealth`, rama `main`, commit `755852f` ("Update base44 packages") |
| **Fecha** | 22/10/2026 |
| **Alcance** | Código del front (`src/`) y esquemas de entidades con sus reglas de acceso (`base44/entities/`) |
| **Fuera de alcance** | Configuración del dashboard de Base44 (salvo lo que confirmó el dueño), datos de producción, pruebas con usuarios reales |
| **Método** | Lectura completa del código, `npm run lint` y `npm run build` sobre `main` |

Las referencias `archivo:línea` corresponden al commit `755852f`. Los hallazgos marcados **[verificar]** dependen de cómo se comporte Base44 y hay que confirmarlos con una prueba.

## Resumen

La base de código está ordenada y es fácil de leer. Los componentes son chicos, la UI está en español y es consistente, los adjuntos se suben como archivos privados y se sirven con URL firmada, y `src/lib/authReturnTo.js` protege bien el `returnTo` contra open redirects.

El problema principal es de **autorización**. Los roles de negocio (`medico`, `recepcionista`) solo se aplican en la UI. Las reglas de acceso del servidor solo distinguen el rol de plataforma `admin` / `user`. Con datos de salud esto es lo primero a resolver.

| Severidad | Cantidad |
|---|---|
| Crítica | 1 |
| Alta | 4 |
| Media | 9 |
| Baja | 8 |

---

## Hallazgos

### C-1 · Crítica · Los roles médico y recepcionista no se aplican en el servidor

**Evidencia**
- `base44/entities/HistorialClinico.jsonc:65-92`: `read` y `create` permiten `user_condition: { role: "admin" }` **o** `{ role: "user" }`, o sea, a cualquier usuario autenticado.
- Pasa lo mismo en `Paciente.jsonc:50-92` y `Turno.jsonc:49-91`.
- Los roles de negocio viven en `User.roles` (`base44/entities/User.jsonc`) y solo se consultan en el front. Ver `src/lib/roles.js:29` (`esMedico`) y el chequeo de `src/pages/MedicalRecords.jsx:65`, que solo muestra un toast.

**Impacto:** un usuario con rol recepcionista (rol de plataforma `user`) puede **leer todas las historias clínicas y crear atenciones** llamando al SDK o a la API directamente, por ejemplo `base44.entities.HistorialClinico.list()` desde la consola del navegador. El menú y los botones lo ocultan, pero el servidor lo permite.

**Recomendación:** llevar el rol al RLS. Base44 admite `user_condition` sobre campos propios del usuario (`data.*`). Propuesta:

```jsonc
"rls": {
  "read":   { "$or": [ { "user_condition": { "role": "admin" } }, { "user_condition": { "data.roles": "medico" } } ] },
  "create": { "$or": [ { "user_condition": { "role": "admin" } }, { "user_condition": { "data.roles": "medico" } } ] },
  "update": { "$or": [ { "user_condition": { "role": "admin" } },
                       { "$and": [ { "created_by_id": "{{user.id}}" }, { "user_condition": { "data.roles": "medico" } } ] } ] },
  "delete": false
}
```

**[verificar]** La documentación de Base44 no aclara si `{"data.roles": "medico"}` matchea cuando `roles` es un array. Si no matchea, hay dos alternativas: guardar un campo escalar (por ejemplo `es_medico: true`) o mover las operaciones sobre historiales a funciones backend que validen el rol y usen `asServiceRole`.

**Cómo verificar:** con un usuario recepcionista logueado, correr en la consola `await base44.entities.HistorialClinico.list()`. Hoy devuelve registros; después del arreglo tiene que devolver `[]`.

---

### A-1 · Alta · Un usuario podría asignarse roles a sí mismo [verificar]

**Evidencia:** `User.roles` no tiene reglas de escritura a nivel de campo (`base44/entities/User.jsonc`), y el SDK expone `base44.auth.updateMe()` para editar campos propios (se usa en `src/hooks/useSesion.js:16`).

**Impacto:** si Base44 deja que cada usuario edite sus propios campos personalizados, alguien puede hacer `updateMe({ roles: ["medico"] })`. Hoy eso solo cambia la UI, pero en cuanto se arregle C-1 le daría acceso a las historias clínicas.

**Recomendación:** seguridad a nivel de campo sobre `roles`: `"rls": { "write": { "user_condition": { "role": "admin" } } }`. Hay que hacerlo **junto con C-1**.

**Cómo verificar:** con un usuario no admin, correr `await base44.auth.updateMe({ roles: ["medico"] })` y después `await base44.auth.me()`.

### A-2 · Alta · La historia clínica se puede sobrescribir y borrar

**Evidencia**
- `src/pages/MedicalRecords.jsx:101`: editar una atención pisa `motivo_consulta`, `diagnostico`, `tratamiento` y `notas`, sin guardar versión.
- `HistorialClinico.jsonc:106-117`: `delete` permitido al creador y al admin.

**Impacto:** la Ley 26.529 exige que la historia clínica sea íntegra e inalterable, y que las correcciones queden como agregados fechados y firmados. Hoy se puede perder información clínica sin dejar rastro.

**Recomendación:** `delete: false`. Reemplazar la edición por **addendas** (una entidad `HistorialAddenda`, o un array de correcciones con fecha y autor), o guardar cada versión anterior.

### A-3 · Alta · Borrar un paciente deja historiales, turnos y cobros huérfanos

**Evidencia:** `src/pages/Patients.jsx:86` llama a `Paciente.delete`, y `Paciente.jsonc:93` lo permite para admin. Ya existe el campo `activo`.

**Recomendación:** baja lógica (`activo: false`) y `delete: false` en el RLS.

### A-4 · Alta · No hay registro de auditoría de accesos ni de cambios

**Evidencia:** no hay ninguna entidad ni función que registre quién vio, creó o modificó un registro clínico.

**Impacto:** con datos sensibles (Ley 25.326) no se puede responder "¿quién vio o cambió esta ficha?".

**Recomendación:** una entidad `Auditoria` (`usuario_id`, `accion`, `entidad`, `registro_id`, `fecha`) con `create` acotado y `update`/`delete` en `false`. Para que no se pueda saltear, la escritura debería ir en funciones backend o en automatizaciones de Base44 sobre las entidades.

---

### M-1 · Media · Número de ficha con condición de carrera
`src/pages/Patients.jsx:49-55`: calcula "último + 1" en el cliente. Dos altas simultáneas obtienen el mismo `numero_ficha`. → Generarlo en una función backend o validar que sea único antes de crear.

### M-2 · Media · DNI sin control de duplicados
El DNI no se valida contra pacientes existentes antes de crear. → Buscar por DNI y avisar.

### M-3 · Media · Los cobros solo los ve quien los creó
`base44/entities/Pago.jsonc:85-86`: `read: { created_by_id: "{{user.id}}" }`. El admin no ve los cobros de otros profesionales. Ya hay soporte preparado sin usar: `exportarXlsx(pagos, false, …)` y `exportarPdf(pagos, false, …)` en `src/pages/Earnings.jsx:114-115`. → Hay que decidir con el negocio si el admin debe ver todo. Si es así, sumar `role: admin` al `read` y una vista con filtro por profesional.

### M-4 · Media · Los turnos no tienen profesional
`Turno.jsonc` no tiene campo de profesional, así que la agenda no sirve para un consultorio con varios médicos. → Agregar `profesional` y filtrar por él.

### M-5 · Media · Turnos superpuestos y validación incompleta
`src/components/appointments/AppointmentFormModal.jsx:39` solo valida que fin > inicio. No hay control de superposición, el fin puede caer otro día y el paciente no es obligatorio (no hay validación de `datos.paciente`, a diferencia de `PaymentFormModal`).

### M-6 · Media · Los turnos no se pueden editar
`src/pages/Appointments.jsx` solo permite crear (`:87`), cambiar el estado y borrar (`:76`). Para reprogramar hay que borrar y volver a crear, y borrar solo lo puede hacer el admin.

### M-7 · Media · Las fallas de subida de adjuntos se ignoran
`src/pages/MedicalRecords.jsx:88-89`: un `catch` vacío descarta el archivo y la atención se guarda igual, sin avisar. → Informar qué archivos fallaron.

### M-8 · Media · Los selectores de paciente cortan en 300 registros
`MedicalRecords.jsx`, `Appointments.jsx:30` y `Earnings.jsx` cargan `limit: 300` en un `<Select>` sin búsqueda. Pasado ese número, hay pacientes que no se pueden elegir. → Combobox con búsqueda en el servidor (`ui/command.jsx` ya está incluido).

### M-9 · Media · No hay observabilidad
Solo hay `console.error` (`src/lib/AuthContext.jsx:39,70,90`), varios `catch` sin manejo y no hay error boundary. Una falla en producción no deja rastro. → Error boundary global, seguimiento de errores (Sentry o similar) **con limpieza de PII antes de enviar**, un logger único en `src/lib/` y los indicadores operativos de B-6.

---

### B-1 · Baja · El link "Volver al login" lleva a una ruta inexistente
`src/pages/ForgotPassword.jsx:34` (`/login`) y `src/pages/ResetPassword.jsx:29` apuntan a `/login`, que no está en `src/App.jsx:48-62`, así que caen en `PageNotFound`. → Apuntar a `/auth` o agregar la ruta.

### B-2 · Baja · Registro visible con la app en modo "solo por invitación"
`src/pages/Auth.jsx:16-19,60` ofrece la pestaña "Registrarse". El dueño confirmó que la app está por invitación, así que no es un riesgo, pero confunde. También hay código muerto: `src/pages/Login.jsx` y `src/pages/Register.jsx` no se usan en ninguna ruta.

### B-3 · Baja · El lint falla en `main`
`npm run lint` → `src/components/records/NewRecordModal.jsx:6`: `ImageIcon` importado y sin uso.

### B-4 · Baja · Dependencias sin uso y bundle grande
El build avisa de chunks de más de 500 kB. No se importan fuera de `components/ui`: `three`, `react-leaflet`, `@stripe/*`, `react-quill-new`, `moment`, `canvas-confetti`, `html2canvas`, `framer-motion`, `lodash`, `react-markdown`, `@hello-pangea/dnd`. Faltan también `React.lazy` por ruta y paginación (Pacientes corta en 200 en `Patients.jsx:37`).

### B-5 · Baja · React Query instalado pero sin usar
`@tanstack/react-query` está configurado (`src/lib/query-client.js`), pero las páginas usan `useEffect` + `useState`, y cada pantalla vuelve a pedir la lista de pacientes desde cero.

### B-6 · Baja · El Dashboard muestra texto fijo
`src/pages/Dashboard.jsx`: el bloque "Información del Sistema" es texto de presentación. → Reemplazarlo por indicadores (turnos de hoy por estado, ausentismo, cobros pendientes y sin facturar).

### B-7 · Baja · Nombres desnormalizados que se desactualizan
`paciente_nombre` y `paciente_ficha` se copian en `Turno`, `HistorialClinico` y `Pago`, y no se actualizan al editar el paciente.

### B-8 · Baja · Confirmaciones con `window.confirm`
`Patients.jsx`, `Appointments.jsx` y `Earnings.jsx`. Ya existe `ui/alert-dialog.jsx`.

---

## Orden sugerido de trabajo

1. **C-1 + A-1 juntos** (RLS por rol + escritura de `roles` solo para admin), con la verificación descrita.
2. **A-2 y A-3** (sin borrado, addendas, baja lógica).
3. **A-4 + M-9** (auditoría y observabilidad).
4. **M-1 a M-8** (correcciones de datos y agenda).
5. **B-1 a B-8** (limpieza, rendimiento y UX).

## Pruebas manuales recomendadas después de los arreglos

| Usuario | Acción | Resultado esperado |
|---|---|---|
| Recepcionista | `base44.entities.HistorialClinico.list()` en consola | `[]` |
| Recepcionista | `base44.auth.updateMe({ roles: ["medico"] })` | Error o sin efecto |
| Médico | Historiales → elegir paciente | Ve sus atenciones |
| Médico | Editar una atención de otro médico | Rechazado (403) |
| Admin | Borrar un paciente o una atención | No disponible / rechazado |
