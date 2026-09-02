# SICSA

## 1. Descripción general

SICSA es el **Sistema Integrado de Citas en Salud** desarrollado para apoyar la operación de un hospital: registro y autenticación, pacientes, agenda, citas, lista de espera, atención médica, historia clínica y reportes administrativos.

Roles:

- **Paciente:** registro, verificación, perfil, citas y recuperación de cuenta.
- **Médico:** agenda propia, historial y reporte clínico.
- **Administrador:** pacientes, citas, verificaciones, usuarios y reportes.

La entrega principal es la aplicación web responsive. Existe un proyecto móvil Flutter, pero no es bloqueador de la primera salida productiva.

## 2. Estado actual

| Nivel | Estado | Alcance |
|---|---|---|
| Demo | Lista | Flujos web principales operativos |
| Piloto controlado | Casi listo | Requiere cierre de rendimiento/integraciones y operación controlada |
| Release candidate | En preparación | Fases 1–3 de cierre productivo terminadas; faltan Fases 4–5 |
| Production-ready | Pendiente | Requiere cierre técnico restante e infraestructura hospitalaria |

Cerrado: autenticación, MFA, OTP/SMS, citas concurrentes, múltiples médicos, lista de espera, integridad relacional, Socket.IO autenticado y auditoría persistente mínima.

## 3. Arquitectura

- Frontend: Next.js, React, TypeScript y Tailwind CSS.
- Backend: NestJS, TypeScript y TypeORM.
- Base de datos: MySQL 8.
- Integraciones: FastAPI, n8n, Socket.IO e Inalambria Express mediante n8n.
- Operación: Docker Compose.
- Mobile: Flutter, posterior a la primera entrega web.

```text
Paciente / Médico / Administrador
                 |
              Next.js
                 |
              NestJS
       +---------+----------+-----------+
       |                    |           |
     MySQL               FastAPI       n8n ---- Gmail/Inalambria
       |
   Socket.IO autenticado (rooms por identidad)
```

## 4. Estructura de carpetas

- `sicsa-frontend/`: aplicación web Next.js.
- `sicsa-backend/`: API NestJS, gateways, entidades, migraciones y pruebas.
- `sicsa-ai/`: servicio FastAPI de apoyo administrativo.
- `sicsa-mobile/`: cliente Flutter, de alcance posterior.
- `n8n/`: configuración de la instancia de automatización.
- `sicsa-backend/src/database/migrations/`: migraciones TypeORM incrementales.
- `sicsa-backend/test/` y archivos `*.spec.ts`: pruebas E2E, unitarias, integración y MySQL.

## 5. Autenticación y seguridad

Paciente:

- Puede iniciar registro por correo o por celular.
- Todo paciente conserva correo y celular obligatorios. El canal elegido define la verificación inicial, no la existencia del otro canal.
- `telefono` es contacto; solo `verifiedPhoneE164` puede ser credencial telefónica.
- Login con correo o celular colombiano previamente verificado.
- Recuperación cruzada por correo verificado o celular verificado.

Médico y administrador:

- Login exclusivamente con correo y contraseña.
- MFA TOTP obligatorio según la política privilegiada.
- Challenge de corta vida antes del JWT definitivo.
- Recovery codes de un solo uso almacenados mediante hash.

General:

- Contraseñas con bcrypt.
- JWT firmado, expiración parametrizada y `tokenVersion` para revocar sesiones.
- Roles, guards y ownership en backend.
- Rate limiting por IP e identificador normalizado.
- OTP de seis dígitos generado criptográficamente, HMAC SHA-256, expiración, intentos, cooldown, límites y protección contra replay.
- CORS mediante lista explícita; no se usa wildcard.
- Secretos exclusivamente mediante entorno.

JWT Bearer se conserva por compatibilidad. Migrar a cookies HttpOnly implicaría cambios amplios de contratos, CSRF y sesión; no se decidió hacerlo antes de la entrega sin una fase específica.

## 6. SMS e Inalambria

Flujo productivo seleccionado:

```text
NestJS -> SmsService -> N8nSmsProvider -> n8n -> Inalambria Express -> SMS
```

- La integración real fue validada manualmente; las pruebas automáticas nunca deben consumir saldo.
- `FakeSmsProvider` se usa en desarrollo/pruebas.
- `N8nSmsProvider` es la ruta recomendada para producción.
- `InalambriaProvider` directo permanece como adaptador alternativo probado.
- La API key de Inalambria vive en credenciales seguras de n8n, nunca en Git.
- Variables principales: `SMS_PROVIDER_MODE`, `N8N_SMS_WEBHOOK_URL`, `N8N_INTERNAL_TOKEN`, `SMS_TIMEOUT_MS`.

## 7. n8n

SICSA usa la misma instancia de n8n para:

- códigos de verificación por correo;
- recuperación de contraseña por correo;
- cita creada;
- promoción desde lista de espera;
- recordatorios;
- SMS.

Los endpoints internos reutilizan `N8N_INTERNAL_TOKEN`. La instancia y credenciales no deben exportarse con secretos.

Workflow SMS conceptual:

```text
Webhook -> validar token interno -> HTTP Request -> Respond to Webhook
```

Body funcional confirmado para el nodo HTTP Request:

```json
{
  "content": "{{ $json.body.message }}",
  "recipients": ["{{ $json.body.phone }}"],
  "async": false
}
```

Respuesta mínima ideal:

```json
{
  "ok": true,
  "providerMessageId": "{{ $json.consumptionId }}"
}
```

No usar la variante anterior con `={{ ... }}` en esta instalación.

## 8. Registro del paciente

Correo:

```text
correo + contraseña -> datos personales y celular obligatorio
-> código por correo -> verificación -> cuenta habilitada
```

Celular:

```text
celular + contraseña -> datos personales y correo obligatorio
-> pending_phone_registration -> OTP SMS -> confirmación
-> User + Patient + verifiedPhoneE164
```

El correo sigue obligatorio porque usuarios, notificaciones y recuperación existentes dependen de una identidad de correo válida; no se inventan correos ficticios ni se vuelve nullable.

## 9. Login

- Paciente: correo o `verifiedPhoneE164` + contraseña.
- Médico/admin: correo + contraseña + TOTP/recovery code.
- `Patient.telefono` nunca se utiliza para autenticar.
- El JWT privilegiado definitivo solo se emite después del segundo factor.

## 10. Recuperación

- Paciente: correo verificado o celular verificado; no se pueden añadir canales nuevos durante recuperación.
- Médico/admin: recuperación por correo; MFA no se desactiva mediante un simple correo.
- El restablecimiento incrementa la versión de sesión cuando corresponde para invalidar tokens anteriores.

## 11. Citas

Incluye creación, EPS automática, especialidad, clase de cita, agenda, cancelación futura, lista de espera, prioridades e historia.

Estrategia cerrada:

- médicos activos de la especialidad ordenados por `id`;
- primer médico disponible;
- disponibilidad individual por `doctorId`;
- solapamiento mediante intervalos, no igualdad simple de hora;
- validación de jornada y hora pasada en `America/Bogota`;
- transacción MySQL y `pessimistic_write` para hacer atómica la comprobación/reserva;
- lista de espera compatible con especialidad, médico, duración e intervalo;
- promoción atómica y eventos posteriores al commit.

Se eligió “primer médico disponible” por ser determinista, simple y seguro. Round-robin o selección manual pueden evaluarse después si el hospital los solicita.

## 12. Estados de cita

Estados observados/soportados por la lógica actual incluyen `confirmada`, `lista_espera`, `cancelada`, `atendida` y `no asistida`. Los estados que bloquean horario están centralizados actualmente como:

- `confirmada`
- `aprobada`
- `pendiente`
- `atendida`

No añadir ni normalizar estados históricos sin una migración y revisión funcional explícitas.

## 13. Historia clínica

`MedicalReport` pertenece a una cita. El backend aplica ownership médico, validaciones técnicas, creación/actualización y descarga PDF. No deben enviarse contenidos clínicos completos por Socket.IO ni auditoría.

Los rangos clínicos y criterios médicos no se inventan en código: deben ser definidos o aprobados por personal clínico del hospital.

## 14. Reportes

El módulo administrativo incluye métricas, filtros, exportación Excel/CSV/PDF e impresión. La pantalla usa paginación visual; la paginación backend y optimización de conjuntos grandes pertenecen a la Fase 4.

## 15. IA / FastAPI

La IA apoya la prioridad administrativa de citas; no diagnostica ni toma decisiones clínicas autónomas. NestJS consume `AI_SERVICE_URL` con timeout, validación de respuesta y fallback seguro. La revisión humana sigue siendo obligatoria.

## 16. Socket.IO

Fase 3 cerrada:

- JWT enviado en `handshake.auth.token`.
- Validación de firma, expiración, usuario, rol y `tokenVersion`.
- `doctorId` se resuelve en base de datos, no desde el cliente.
- Rooms: `patient:{userId}`, `doctor:{doctorId}` y `admins`.
- El cliente no elige rooms.
- No quedan emisiones globales `server.emit()` para eventos privados.
- Eventos de cita usan payload mínimo: evento, appointmentId, estado, fecha, hora, doctorId y specialtyId.
- Eventos de verificación usan verificationId y estado.
- Documento, correo, teléfono, EPS, motivo y datos clínicos no se emiten.
- CORS reutiliza `CORS_ORIGINS` sin wildcard.

## 17. Auditoría

`AuditService.record()` persiste en `audit_event` de forma best-effort. Se registran eventos sensibles de autenticación, MFA, citas, promoción de espera, reportes clínicos, verificaciones y cambios administrativos seleccionados.

Campos: actor opcional, rol, acción, tipo/id de recurso, resultado, fecha, correlación opcional, fingerprint IP opcional y metadata mínima.

No se guardan passwords, JWT, OTP/TOTP, recovery codes, secretos, API keys, teléfono completo, historia clínica completa ni bodies completos. La metadata rechaza claves sensibles y limita cantidad/tamaño. Si la persistencia falla, la operación principal continúa y se genera solo un error técnico sin contenido sensible.

No se auditan lecturas triviales de cada pantalla para evitar ruido. Retención y depuración dependen de la política institucional; no existe borrado automático.

## 18. Base de datos

Entidades principales:

- User, Patient, Doctor, Specialty.
- Appointment, Eps, AppointmentClass.
- MedicalReport y Verification.
- EmailVerificationCode y PasswordResetCode.
- OtpChallenge y PendingPhoneRegistration.
- MfaCredential, MfaChallenge y MfaRecoveryCode.
- AuditEvent.

Decisión semántica importante: `Appointment.patientId` contiene el identificador de usuario del paciente y referencia `Patient.userId`, no `Patient.id`. Los servicios resuelven el perfil por `Patient.userId`. No cambiar esta relación sin migración explícita y adaptación completa.

## 19. Migraciones

Orden actual:

1. `BaselineSicsaSchema1787700000000`: baseline del esquema histórico.
2. `AddVerifiedPatientPhone1787800000000`: teléfono verificado.
3. `AddOtpChallenge1787900000000`: challenges OTP.
4. `AddPendingPhoneRegistration1788000000000`: registro telefónico pendiente.
5. `AddPrivilegedMfa1788100000000`: MFA y tokenVersion privilegiado.
6. `AddRelationalIntegrityAndIndexes1788200000000`: FKs, uniques e índices operacionales.
7. `AddPersistentAudit1788300000000`: tabla e índices de auditoría.

`DB_SYNCHRONIZE=false` es obligatorio para producción. No editar migraciones históricas ni usar synchronize para evolucionar el esquema; crear siempre una migración incremental y probar `up/down/up` localmente.

## 20. Índices y constraints

Principales garantías:

- Patient: userId único, documento único por tipo+número, teléfono verificado único y FK a User.
- Doctor: userId y registro médico únicos, FK a User/Specialty, índice especialidad+activo+id.
- Appointment: FKs conservadoras a paciente, médico, especialidad, EPS y clase.
- Índices de agenda por doctor/fecha/estado y doctor/fecha/hora.
- Índice de citas por paciente/fecha.
- Índice de lista de espera por especialidad/fecha/estado/prioridad.
- Índices de códigos temporales y auditoría.

No se usan cascades destructivos sobre historia clínica o citas.

## 21. Variables de entorno

Nunca incluir valores reales en Git.

| Variable | Servicio | Obligatoria | Propósito |
|---|---|---:|---|
| NODE_ENV | Backend | Sí | Entorno de ejecución |
| PORT / BACKEND_PORT | Backend/Compose | Sí | Puerto NestJS |
| DB_HOST, DB_PORT | Backend | Sí | Host y puerto MySQL |
| DB_USERNAME, DB_PASSWORD | Backend | Sí | Credenciales MySQL |
| DB_DATABASE | Backend | Sí | Esquema MySQL |
| DB_SYNCHRONIZE | Backend | Sí | Debe ser false en producción |
| JWT_SECRET | Backend | Sí | Firma JWT |
| JWT_EXPIRES_IN | Backend | Sí | Vigencia JWT |
| CORS_ORIGINS | Backend/Socket.IO | Sí | Orígenes permitidos |
| MFA_ENCRYPTION_KEY | Backend | Sí | AES-256-GCM para secreto TOTP |
| OTP_HMAC_SECRET | Backend | Sí | HMAC independiente de OTP |
| AUTH_* | Backend | Sí | Límites de autenticación/códigos |
| SMS_PROVIDER_MODE | Backend | Sí | fake, n8n o adaptador permitido |
| N8N_SMS_WEBHOOK_URL | Backend | Para n8n | Webhook productivo SMS |
| N8N_INTERNAL_TOKEN | Backend/n8n | Sí | Autenticación interna |
| SMS_TIMEOUT_MS | Backend | Sí | Timeout de transporte SMS |
| AI_SERVICE_URL | Backend | Sí | Servicio FastAPI |
| AI_TIMEOUT_MS | Backend | Sí | Timeout IA |
| N8N_EMAIL_WEBHOOK_URL | Backend | Según flujo | Verificación aprobada |
| N8N_VERIFICATION_CODE_WEBHOOK_URL | Backend | Según flujo | Código de correo |
| N8N_PASSWORD_RESET_WEBHOOK_URL | Backend | Según flujo | Recuperación correo |
| N8N_APPOINTMENT_CREATED_WEBHOOK_URL | Backend | Según flujo | Cita creada |
| N8N_WAITLIST_ASSIGNED_WEBHOOK_URL | Backend | Según flujo | Promoción de espera |
| N8N_REMINDER_WEBHOOK_URL | Backend | Según flujo | Recordatorios |
| NEXT_PUBLIC_API_URL | Frontend | Sí | API consumida por Next.js |
| NEXT_PUBLIC_SOCKET_URL | Frontend | Sí | Socket.IO consumido por Next.js |

## 22. Docker

El Compose actual define MySQL, backend, frontend, FastAPI y una única instancia n8n, con volúmenes persistentes y restart policies. Es útil para desarrollo/integración.

La producción futura aún requiere Compose/override productivo, red interna, healthchecks, usuarios non-root, cierre de puertos internos, política de logs y reverse proxy. No cambiar puertos de desarrollo para simular producción.

## 23. URLs actuales de desarrollo

Convención local:

- Frontend: `http://localhost:3001`.
- Backend local: `http://localhost:3000`.
- MySQL Docker suele publicarse en 3307; instalación local puede usar 3306 según entorno.

El frontend puede apuntar a un backend remoto vigente mediante `.env.local`. Ese destino es configuración de entorno, no una constante arquitectónica. No modificarlo sin autorización explícita.

## 24. Pruebas

Existen pruebas:

- unitarias y DTOs;
- autorización/ownership y E2E de seguridad;
- MFA, JWT, rate limiting, OTP y registro/recuperación;
- MySQL temporal de migraciones e integridad;
- concurrencia real de citas;
- Socket.IO, rooms y payloads;
- auditoría persistente y best-effort.

Las migraciones críticas se validan con `up -> down -> up`. Las integraciones externas se mockean. Algunas suites scaffold históricas (por ejemplo servicios creados sin sus dependencias Nest) requieren limpieza consciente; no adaptar pruebas para ocultar regresiones.

## 25. Reglas de desarrollo

- Leer este README y `git diff` antes de tocar código.
- No cambiar URLs ni `.env.local` sin autorización.
- No tocar Azure, desplegar, hacer commit o push sin autorización.
- No enviar SMS/correos reales ni llamar Inalambria/n8n real en pruebas.
- Usar mocks, stubs y `FakeSmsProvider`.
- No reescribir autenticación o citas cerradas sin un bug reproducible.
- Mantener `DB_SYNCHRONIZE=false`.
- No editar migraciones históricas; crear incrementales.
- No exponer secretos, identificadores personales ni datos clínicos.

## 26. Cerrado: no reescribir

Solo tocar ante una regresión demostrada:

- registro dual y correo/celular obligatorios;
- login dual de paciente;
- recuperación cruzada;
- MFA TOTP y recovery codes;
- OTP/SMS/n8n;
- JWT, tokenVersion, roles, guards y ownership;
- concurrencia, múltiples médicos y lista de espera;
- integridad relacional e índices;
- Socket.IO autenticado y rooms;
- auditoría persistente mínima.

## 27. Pendientes actuales

Fase 4:

- paginación backend y filtros SQL;
- rendimiento de pacientes, agenda, historia y reportes;
- timeouts, retries e idempotencia n8n;
- aislamiento de FastAPI en red interna;
- revisión final de integraciones.

Fase 5:

- Docker productivo y template Nginx;
- healthchecks y cierre de puertos;
- backups/restore;
- suite completa, smoke tests y release candidate.

## 28. Dependencias del hospital

- dominio, DNS y certificado;
- VM/servidor final y firewall;
- credenciales finales y SMTP;
- cuenta/créditos Inalambria;
- política de backups, RPO/RTO;
- retención de auditoría;
- rangos clínicos y horarios oficiales;
- política futura de asignación de médicos.

## 29. Cómo levantar el proyecto

Usar `.env` locales ignorados basados en los `.env.example`; nunca versionar secretos.

Frontend:

```powershell
cd sicsa-frontend
npm.cmd run dev
npm.cmd run build
```

Backend:

```powershell
cd sicsa-backend
npm.cmd run start:dev
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
```

Migraciones:

```powershell
cd sicsa-backend
npm.cmd run migration:show
npm.cmd run migration:run
npm.cmd run migration:revert
```

Docker:

```powershell
docker compose config
docker compose up -d
```

Antes de `migration:run`, confirmar explícitamente host/base y que no sea Azure salvo autorización. No ejecutar pruebas de integración externa con credenciales reales.

## 30. Contexto para continuar desarrollo

Otro Codex debe:

1. Leer este README completo.
2. Ejecutar `git status`, `git diff` y `git diff --check` antes de editar.
3. Preservar todos los cambios locales: todavía no existe commit de cierre.
4. Continuar con **Fase 4: rendimiento e integraciones**, no reiniciar fases cerradas.
5. Mantener congelados URLs, `.env.local`, Azure, SMS/correo real y despliegues.
6. Proponer cambios pequeños, incrementales, reversibles y acompañados por pruebas.

Decisiones conscientes que no deben “corregirse” automáticamente:

- email obligatorio mantiene compatibilidad con usuarios/notificaciones;
- `telefono` y `verifiedPhoneE164` tienen niveles de confianza distintos;
- `Appointment.patientId` conserva semántica de User/Patient.userId;
- TOTP protege roles privilegiados sin depender de SMS;
- n8n centraliza transporte SMS/correo y credenciales externas;
- primer médico disponible evita complejidad innecesaria;
- locking pesimista evita doble reserva;
- auditoría best-effort evita tumbar operaciones clínicas por un fallo del logger;
- migraciones reemplazan `synchronize`;
- cookies HttpOnly requieren una fase arquitectónica específica;
- mobile queda posterior porque la web responsive cubre la primera operación.

## 31. Fase 4 cerrada: rendimiento e integraciones

La Fase 4 introdujo paginación backend real sin cambiar rutas ni el diseño visual. El contrato común es:

```json
{
  "data": [],
  "page": 1,
  "limit": 20,
  "total": 100,
  "totalPages": 5
}
```

`page` comienza en 1, `limit` admite de 1 a 100 y los valores inválidos retornan 400. Una colección vacía informa `totalPages: 0`. Quedaron paginados y con filtros SQL según su pantalla:

- `GET /patients`: texto sobre documento, correo, teléfono, nombres, apellido y EPS.
- `GET /appointments/all`: estado, fecha y texto; solo administradores.
- `GET /appointments/my`: paginado y restringido al `sub` del paciente autenticado.
- `GET /appointments/doctor/:id`: estado y fecha, conservando ownership de agenda.
- `GET /appointments/doctor/:id/history`: historial filtrado en SQL por atención/reporte, fecha y paciente.
- `GET /verifications`: estado y texto, solo administradores.
- `GET /users`: rol y correo, solo administradores.
- `GET /reports/no-shows` y `GET /reports/appointments`: detalle paginado; `exportMode=all` queda reservado al consumidor autorizado para exportar el conjunto filtrado completo.

Los catálogos pequeños (`eps`, especialidades y clases de cita) permanecen completos. El dashboard de reportes conserva agregaciones SQL y sus métricas/fórmulas.

### Optimizaciones realizadas

- Los filtros prioritarios se ejecutan antes de `skip/take`; la vista normal ya no necesita traer el conjunto completo para filtrar.
- Los listados de citas reemplazaron el N+1 de `attachPatientData()` por dos búsquedas batch (`IN`): pacientes y existencia de reportes. El método puntual se conserva para creación/cancelación y compatibilidad.
- Verificaciones cargan pacientes por lote en lugar de una consulta por solicitud.
- Historia médica ya no carga toda la agenda ni filtra el estado después del enriquecimiento.
- Los detalles de reportes conservan joins y ahora separan vista paginada de exportación completa.
- Las búsquedas de subcadena mantienen `LIKE '%texto%'` por compatibilidad. Estas condiciones no aprovechan eficientemente un índice B-tree; deben vigilarse con datos reales antes de considerar full-text en una fase futura.

### Integraciones

- Cita creada, promoción de lista de espera y aprobación de verificación usan timeout corto configurable mediante `N8N_TIMEOUT_MS` (5 segundos por defecto), fallo best-effort y claves idempotentes estables por evento.
- Verificación y recuperación por correo usan abort por timeout. El fallo de envío sigue propagándose al flujo sensible para no informar al usuario que un código fue enviado cuando no ocurrió.
- No se añadieron retries Nest automáticos: n8n debe deduplicar por `Idempotency-Key`/`idempotencyKey` y aplicar como máximo reintentos limitados con backoff en transportes seguros. Así se evita duplicar mensajes entre dos capas.
- SMS conserva su proveedor con timeout y errores sanitizados; las pruebas usan dobles y no consumen saldo.
- FastAPI conserva `AI_SERVICE_URL`, `AI_TIMEOUT_MS`, validación estricta y fallback seguro. Puede apuntarse a un hostname de red privada en producción; no se cambió Docker ni el algoritmo de prioridad. La autenticación interna del servicio queda como endurecimiento de infraestructura de Fase 5, junto con el cierre de exposición del puerto.

### Pruebas y compatibilidad

- Se añadió cobertura del contrato común: defaults, total de páginas, página vacía, valores inválidos y límite máximo.
- Las suites existentes conservan cobertura de ownership de paciente/médico/admin, timeout/fallback FastAPI y timeout/fallo SMS-n8n. Se añadió una prueba que confirma una sola consulta batch de pacientes y otra de reportes por página; las integraciones externas permanecen mockeadas.
- Backend y frontend se migraron juntos. Las rutas, JWT, roles, guards, ownership, Socket.IO, citas concurrentes y diseño visual permanecen intactos.
- `DB_SYNCHRONIZE=false` continúa obligatorio y no se modificó ninguna migración histórica.

Riesgos residuales: validar planes `EXPLAIN` con volumen hospitalario real; ajustar límites/paginadores visuales según operación; definir retención/exportaciones máximas; configurar deduplicación efectiva en cada workflow n8n; y decidir el secreto interno FastAPI como parte del diseño de red productivo.

## 32. Siguiente fase autorizada: Fase 5

La siguiente fase es exclusivamente operación productiva: Compose/override productivo, red interna y cierre de puertos, Nginx/TLS, healthchecks, usuarios non-root, logs, backups/restore y smoke/release tests. Requiere decisiones y credenciales del hospital. No se realizó deploy, Azure, commit, push ni comunicación externa durante Fase 4.

## 33. Fase 5: preparación de cierre técnico

Se añadió una configuración productiva separada en `docker-compose.prod.yml`; el `docker-compose.yml` de desarrollo conserva sus puertos y comportamiento. La configuración productiva incluye:

- Nginx como único servicio con puertos publicados: 80 y 443.
- Next y Nest en red `proxy`, sin publicar 3001/3000.
- Nest, MySQL, FastAPI y n8n en red `internal`; MySQL y FastAPI no tienen egreso ni puertos publicados.
- n8n tiene una red separada de egreso para proveedores, pero no publica 5678.
- healthchecks para MySQL, Nest, Next, FastAPI y n8n, con `depends_on` por estado saludable.
- volúmenes persistentes separados para MySQL y n8n.
- política `json-file` con tamaño y cantidad de archivos configurables.
- secretos obligatorios mediante interpolación fail-fast, `DB_SYNCHRONIZE=false`, `SMS_PROVIDER_MODE=n8n`, `N8N_SECURE_COOKIE=true` y `N8N_ENCRYPTION_KEY` obligatoria.

Los Dockerfiles propios usan instalación reproducible con lockfile y ejecutan Nest/Next como usuario `node` y FastAPI como usuario dedicado `sicsa`. n8n conserva el usuario de su imagen oficial.

### Nginx, TLS y seguridad perimetral

`deploy/nginx/templates/default.conf.template` enruta `/` a Next, `/api/` a Nest y `/socket.io/` a Nest con Upgrade WebSocket. Incluye forwarded headers, timeouts, límite de body, anti-clickjacking, nosniff, Referrer-Policy, Permissions-Policy y una CSP inicial compatible. Las concesiones `unsafe-inline`, `unsafe-eval` y esquemas amplios de `connect-src` se mantienen por compatibilidad con Next/Socket.IO actuales y deben endurecerse con pruebas de navegador.

TLS se prepara sin certificados ficticios mediante `deploy/nginx/tls/default.conf.template.example` y el volumen `deploy/nginx/certs`. La redirección HTTP→HTTPS y HSTS no se activan hasta instalar y validar un certificado real. `SERVER_NAME` es obligatorio y no se inventa un dominio.

Nest habilita `trust proxy` únicamente en producción y solo para loopback, link-local y redes privadas. Como el backend no publica puerto, Internet no puede inyectar directamente forwarded headers.

### Operación, backup y restore

El runbook maestro está en `docs/DEPLOYMENT.md`. Incluye requisitos, variables, build, redes, TLS, backup previo, migraciones sin synchronize, arranque, healthchecks, smoke, rollback, restore y rotación de secretos.

- `scripts/backup-mysql.ps1` crea un dump lógico transaccional con timestamp fuera del contenedor, valida que no esté vacío y calcula SHA-256. No contiene passwords ni elimina backups automáticamente.
- `scripts/restore-mysql.ps1` valida ruta/tamaño y bloquea restores por defecto. Debe utilizarse primero contra una base temporal confirmada.
- La retención, cifrado y copia externa son políticas del hospital; `BACKUP_RETENTION_DAYS` queda documentada y no provoca borrado automático.

### Pruebas de cierre ejecutadas

- Unitarias/históricas: 39 suites y 210 pruebas verdes; 5 suites/11 pruebas MySQL se omiten si no se habilita explícitamente el entorno temporal.
- Seguridad E2E aislada: 3 suites y 28 pruebas verdes, sin servicios externos.
- Backend: build verde.
- Frontend: TypeScript verde; build Next bloqueado en este host porque `next/font/google` no pudo descargar Geist/Geist Mono. No se cambió el diseño ni se vendieron fuentes sin aprobación.
- Compose productivo: `docker compose config --quiet` verde con variables ficticias seguras.
- Scripts PowerShell: análisis sintáctico verde.
- Dependencias backend/frontend: auditoría offline disponible reportó cero vulnerabilidades conocidas. La auditoría online no produjo un informe utilizable por restricciones de red.

### Estado de release candidate

SICSA todavía **no debe etiquetarse como release candidate**. La preparación de software está hecha, pero faltan verificaciones obligatorias en un host con Docker/MySQL temporal:

1. build completo del frontend con acceso controlado a las fuentes actuales o una decisión aprobada de autoalojamiento;
2. build de imágenes y smoke del Compose productivo;
3. verificación efectiva de que solo 80/443 están publicados;
4. suites MySQL de concurrencia, integridad, auditoría y migraciones;
5. ciclo backup → recreación de base temporal → restore → comprobación.

No convertir esos pendientes técnicos en “dependencias del hospital”: deben cerrarse antes de marcar RC. Después de ellos, lo exclusivamente hospitalario será dominio/DNS/certificado, VM/firewall, secretos/credenciales productivos, SMTP/Inalambria/n8n, políticas de retención/auditoría, backup externo, RPO/RTO, aceptación funcional y parámetros clínicos.

## 34. Contexto para el siguiente Codex

No reabrir Fases 1–4. Continuar la validación final de Fase 5 en un host con Docker Engine activo y MySQL temporal. No desplegar ni usar Azure. No cambiar `.env.local`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, IPs, hosts o puertos congelados. Ejecutar primero smoke, suites MySQL y restore temporal; solo si todo queda verde actualizar el estado a release candidate.

## 35. Cierre visual y UX previo a sincronización

El frontend conserva el diseño institucional azul/celeste y unifica especialmente recuperación de contraseña y verificación de códigos con la familia gráfica del login. Los campos OTP existentes mantienen autoavance, retroceso, pegado, foco visible y distribución responsive.

`app/components/SicsaFeedback.tsx` centraliza notificaciones accesibles y diálogos de confirmación/entrada. Las interacciones normales ya no abren ventanas nativas del navegador: éxitos, validaciones y fallos se presentan mediante toast, mientras la cancelación de citas, registro de inasistencia y rechazo de verificaciones usan un diálogo SICSA. El componente filtra mensajes técnicos conocidos antes de mostrarlos.

`app/components/RoleProfileMenu.tsx` reutiliza el bloque de identidad y cierre de sesión en las cabeceras de administración y medicina, tomando el usuario autenticado existente sin nombres hardcodeados. También se retiró el bloque redundante de acceso rápido administrativo y se normalizaron los placeholders y el espaciado de iconos en login y recuperación.

La revisión local cubrió login, registro, recuperación y verificación en escritorio, tableta y móvil, sin desbordamiento horizontal. Este cierre no modificó contratos backend, OTP, MFA, citas, URLs ni archivos de entorno.
