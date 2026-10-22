# AuHealth: propuesta de diseño y funcionalidades

Complementa a [auditoria-auhealth.md](auditoria-auhealth.md), que cubre seguridad y errores. Este documento propone **hacia dónde llevar el producto**: mejoras de diseño y las funciones que se esperan de un sistema de gestión para consultorios en Argentina.

Base: repo `nicklaus0709/auhealth`, commit `755852f`, 22/10/2026.

---

## 1. Diseño

### 1.1 Lo que ya funciona bien
- La paleta verde azulado (teal) es adecuada para salud, transmite calma y confianza.
- La tipografía (Inter) es legible y usa números tabulares en importes.
- La estructura es clara: sidebar oscuro, tarjetas blancas, estados con color y estados vacíos bien resueltos.
- La app es responsive, con menú lateral en celular y tablas que pasan a tarjetas.

### 1.2 Contraste (accesibilidad WCAG AA)
Medí el contraste de los colores de marca. AA pide **4.5:1** para texto normal.

| Uso actual | Contraste | ¿Cumple? |
|---|---|---|
| Texto blanco sobre botón teal (`btn-gradient`, `#259D91`) | 3.33 | ✗ |
| Texto teal sobre blanco (links, "Hoy", N° de ficha) | 3.33 | ✗ |
| Texto emerald `#2BAB6F` sobre blanco | 2.93 | ✗ |
| Texto azul `#0DA2E7` sobre blanco (adjuntos) | 2.86 | ✗ |
| Texto secundario (`--muted-foreground`) sobre el fondo | 4.07 | ✗ (por poco) |
| `teal-deep` `#1E8076` sobre blanco | 4.77 | ✓ |

**Propuesta:** mantener el teal actual para fondos suaves, íconos y bordes, y usar un tono más oscuro para texto y botones. Es el mismo color, apenas más profundo:

```js
// tailwind.config.js → theme.extend.colors.brand
teal: {
  50:  '#EEF8F7',
  100: '#D4EEEB',
  200: '#A9DDD7',
  400: '#3FB3A6',
  500: '#259D91', // actual: íconos, bordes, fondos /10
  600: '#1E8076', // texto y botones (4.77:1)
  700: '#186A62', // hover de botones
  800: '#13534D',
},
```

```css
/* src/index.css */
:root {
  --primary: 174 62% 31%;          /* ≈ #1E8076, botones y anillos de foco */
  --muted-foreground: 215 16% 44%; /* ≈ 5:1 sobre el fondo */
}
.btn-gradient { background-image: linear-gradient(90deg, #1E8076 0%, #186A62 100%); }
```

Para los textos de estado (emerald, azul, ámbar) ya se usan tonos oscuros como `#1E8552` y `#B87400`. Conviene unificarlos como tokens (`brand-emerald-700`, etc.) en vez de valores hex sueltos en `StatusBadge.jsx` y `StatCard.jsx`.

### 1.3 Estados: que no dependan solo del color
Pendiente, confirmado, atendido y cancelado hoy se distinguen solo por color. Para daltonismo y pantallas con poco brillo, conviene sumar un ícono por estado (reloj, check, check doble, cruz) en `StatusBadge` y en el borde de la agenda semanal.

### 1.4 Agenda
- **Vista día con grilla horaria** (por ejemplo de 8 a 20 en bloques de 15 o 30 min) en vez de una lista: se ven los huecos libres y se puede **hacer clic en un hueco para crear el turno**.
- **Una columna por profesional** cuando haya varios.
- La vista semanal tiene `min-w-[760px]` y en celular obliga a scrollear de costado. En celular conviene mostrar 3 días o la lista del día.
- Arrastrar para reprogramar (`@hello-pangea/dnd` ya está instalado).

### 1.5 Navegación y productividad
- **Buscador global de pacientes** en el encabezado, con atajo `Ctrl+K` (`cmdk` y `ui/command.jsx` ya están instalados): escribir nombre, DNI o ficha y saltar a la ficha.
- **Ficha única del paciente** (`/patients/:id`) con encabezado fijo (nombre, edad, DNI, obra social, **alergias destacadas en rojo**) y pestañas: Resumen · Historia clínica · Turnos · Cobros · Archivos. Hoy la misma información está repartida en tres pantallas, cada una con su propio selector.
- **Acciones encadenadas:** desde un turno "atendido", ofrecer "Registrar atención" y luego "Registrar cobro" con el paciente ya cargado.

### 1.6 Dashboard por rol
Hoy muestra conteos generales y un texto fijo. Propuesta:
- **Recepción:** turnos de hoy por estado, próximos turnos, pacientes en sala de espera y turnos sin confirmar.
- **Médico:** su agenda del día, el próximo paciente con acceso directo a su ficha, y atenciones del mes.
- **Admin:** ingresos del mes por medio de pago y por obra social, cobrado sin facturar, ausentismo y pacientes nuevos. `recharts` ya está instalado y `ui/chart.jsx` existe.

### 1.7 Detalles de interfaz
- Reemplazar `window.confirm` por `AlertDialog`.
- Bajar los efectos `glass` / `backdrop-blur`, que en computadoras viejas de recepción hacen lenta la interfaz. Un fondo blanco liso se ve igual de limpio.
- Hay tokens de **modo oscuro** definidos (`.dark` en `index.css`) pero ningún selector para activarlo. Hay que agregar el selector o sacar los tokens.
- Validación y máscaras en los formularios: DNI numérico, teléfono con característica y CUIT.
- Una **vista de impresión** para la ficha y la historia clínica (encabezado del consultorio y del profesional).

---

## 2. Funcionalidades que completan un sistema de gestión médica

Hoy la app cubre: pacientes, historia clínica con adjuntos, agenda con estados, cobros con medios de pago y usuarios con roles. Abajo va lo que falta, agrupado y priorizado.

**Prioridad:** 🔴 esencial para salir a producción en un consultorio real · 🟠 alto valor · 🟢 diferencial.

### 2.1 Agenda y turnos
| | Función | Por qué |
|---|---|---|
| 🔴 | **Agenda por profesional** con horarios de atención configurables (días, franjas, duración del turno) | Base para consultorios con más de un médico |
| 🔴 | **Bloqueos**: vacaciones, feriados, congresos | Evita dar turnos en días sin atención |
| 🔴 | **Reprogramar turnos** y control de superposición | Hoy hay que borrar y crear de nuevo |
| 🟠 | **Recordatorios automáticos** por WhatsApp y/o email 24-48 h antes, con link para confirmar o cancelar | Es lo que más reduce el ausentismo |
| 🟠 | **Tipos de prestación** con duración y precio por defecto | Agiliza la carga y conecta agenda con cobros |
| 🟠 | **Sala de espera / check-in**: "llegó", "en consulta", "atendido", con aviso al médico | Flujo diario de recepción |
| 🟠 | **Sobreturnos y lista de espera** | Cubre cancelaciones |
| 🟢 | **Turnos online** para que el paciente reserve solo en los huecos libres | Menos llamadas a recepción |

### 2.2 Historia clínica
| | Función | Por qué |
|---|---|---|
| 🔴 | **Antecedentes fijos del paciente**: alergias, medicación habitual, enfermedades crónicas, antecedentes quirúrgicos y familiares, grupo sanguíneo | Hoy todo va en texto libre en cada atención |
| 🔴 | **Addendas en vez de edición** y sin borrado (Ley 26.529) | Ver auditoría A-2 |
| 🔴 | **Firma del profesional** en cada registro: nombre, matrícula, fecha y hora | Requisito legal de la historia clínica |
| 🟠 | **Signos vitales y antropometría** (TA, FC, peso, talla, IMC, glucemia) con gráfico de evolución | Seguimiento de crónicos |
| 🟠 | **Diagnósticos codificados** (CIE-10) con buscador | Estadísticas y reportes a obras sociales |
| 🟠 | **Plantillas por especialidad** (clínica, pediatría, kinesiología, odontología, nutrición...) | Carga más rápida y datos ordenados |
| 🟠 | **Consentimiento informado** con modelo, firma y adjunto | Práctica obligatoria según el procedimiento |
| 🟢 | **Odontograma / curvas de crecimiento** según especialidad | Diferencial para especialidades puntuales |

### 2.3 Documentos clínicos
| | Función | Por qué |
|---|---|---|
| 🔴 | **Receta electrónica** (Ley 27.553), integrada con una plataforma de recetas habilitada | En Argentina la receta digital es obligatoria; hecha a mano en papel no sirve |
| 🟠 | **Órdenes de estudios y derivaciones** con el membrete del profesional | Uso diario |
| 🟠 | **Certificados** (reposo, aptitud física, asistencia) con plantillas | Uso diario |
| 🟢 | **Resultados de estudios** cargados por el paciente o el laboratorio | Menos papel |

### 2.4 Facturación y obras sociales
| | Función | Por qué |
|---|---|---|
| 🔴 | **Padrón de obras sociales y prepagas** como entidad (no texto libre), con planes y valores por prestación | Hoy `obra_social` es texto libre: "OSDE", "osde 310" y "Osde" cuentan como tres distintas |
| 🔴 | **Coseguros** y separación entre lo que paga el paciente y lo que se liquida a la obra social | El cobro actual lo mezcla |
| 🟠 | **Liquidación mensual por obra social**: prestaciones del período, exportable en el formato que pide cada una | Es el principal dolor administrativo |
| 🟠 | **Autorizaciones / bonos / órdenes** con número y vencimiento | Requisito de muchas obras sociales |
| 🟠 | **Facturación electrónica ARCA** por web service (WSFE), en vez del link manual actual | Emitir la factura desde el cobro y guardar el CAE |
| 🟠 | **Caja diaria**: apertura, cierre, arqueo por medio de pago y gastos | Control en recepción |
| 🟢 | **Cobro online** (link de Mercado Pago) para señas o teleconsultas | Menos ausentismo, cobro anticipado |

### 2.5 Pacientes y comunicación
| | Función | Por qué |
|---|---|---|
| 🟠 | **Portal del paciente**: sus turnos, recetas, indicaciones y estudios | Valor percibido alto |
| 🟠 | **Consentimiento de tratamiento de datos** (Ley 25.326) y **exportar los datos del paciente** cuando los pida | Derecho de acceso |
| 🟠 | **Detección de duplicados** por DNI y fusión de fichas | Ver auditoría M-2 |
| 🟢 | **Mensajes y campañas**: recordatorio de controles anuales, vacunas, cumpleaños | Fidelización |
| 🟢 | **Teleconsulta** con videollamada y registro en la historia clínica | Diferencial |

### 2.6 Administración y seguridad
| | Función | Por qué |
|---|---|---|
| 🔴 | **Datos del consultorio y de cada profesional**: razón social, CUIT, matrícula, especialidad, firma y logo para documentos | Lo necesitan recetas, órdenes y facturas |
| 🔴 | **Registro de auditoría** de accesos y cambios | Ver auditoría A-4 |
| 🟠 | **Cierre de sesión por inactividad** | En recepción las PCs se comparten |
| 🟠 | **Doble factor de autenticación** para médicos y admin | Datos sensibles |
| 🟠 | **Exportación / copia de seguridad** de toda la información del consultorio | Continuidad y portabilidad |
| 🟢 | **Varias sedes** con agendas y caja por sede | Crecimiento |
| 🟢 | **Stock de insumos** (descartables, vacunas) | Para algunas especialidades |

### 2.7 Reportes
- 🟠 Producción por profesional: atenciones e ingresos.
- 🟠 Ausentismo por período, profesional y obra social.
- 🟠 Ingresos por obra social y medio de pago, y lo pendiente de liquidar.
- 🟢 Diagnósticos más frecuentes (con CIE-10) y pacientes nuevos contra recurrentes.

---

## 3. Hoja de ruta sugerida

| Etapa | Contenido |
|---|---|
| **1. Base segura** | Hallazgos críticos y altos de la auditoría, contraste de colores, datos del consultorio y del profesional |
| **2. Operación diaria** | Ficha única del paciente con antecedentes, agenda por profesional con grilla horaria y bloqueos, reprogramación, sala de espera, buscador global |
| **3. Clínica** | Addendas firmadas, signos vitales, CIE-10, plantillas, receta electrónica, órdenes y certificados |
| **4. Administración** | Padrón de obras sociales, coseguros, liquidaciones, facturación ARCA, caja diaria, dashboard por rol y reportes |
| **5. Diferenciales** | Recordatorios por WhatsApp, turnos online, portal del paciente, teleconsulta |

> Nota: las referencias legales (Leyes 26.529, 25.326 y 27.553) son orientativas. Antes de implementar receta electrónica, firma y conservación de la historia clínica conviene validar los requisitos vigentes con un asesor o con la plataforma de recetas elegida.
