# Runbook de producción SICSA

Este documento prepara el despliegue; no autoriza ni ejecuta un despliegue. Nunca guardar secretos, dumps sin cifrar ni certificados privados en Git.

## Requisitos y decisiones previas

- Linux con Docker Engine y Docker Compose actuales, almacenamiento persistente y reloj sincronizado.
- Dominio, DNS, certificado TLS real, VM/firewall y ventana de mantenimiento aprobados.
- `.env.prod` fuera de Git, basado en `.env.prod.example`, con secretos independientes y de alta entropía.
- `DB_SYNCHRONIZE=false`, `SMS_PROVIDER_MODE=n8n` y credenciales n8n/Inalambria/SMTP configuradas manualmente.
- Política institucional de RPO/RTO, retención, cifrado y copia externa de backups.

## Redes, exposición y TLS

`docker-compose.prod.yml` publica únicamente 80/443. Next, Nest, MySQL, FastAPI y n8n usan `expose`, no puertos del host. MySQL, FastAPI y n8n están en la red Docker interna. Nest se une a la red proxy solo para Nginx y a la interna para sus dependencias.

La plantilla HTTP está en `deploy/nginx/templates/default.conf.template`. Antes de salida pública:

1. Obtener certificado Let's Encrypt o institucional para `SERVER_NAME`.
2. Instalar `fullchain.pem` y `privkey.pem` con permisos restrictivos fuera de Git y montarlos en `/etc/nginx/certs`.
3. Completar y activar `deploy/nginx/tls/default.conf.template.example` con las mismas locations/headers de la plantilla HTTP.
4. Validar HTTPS y luego activar redirección HTTP→HTTPS. No habilitar HSTS hasta confirmar renovación y operación estable.

La CSP inicial permite inline/eval por compatibilidad con Next actual y conexiones `ws/wss/http/https`. Debe endurecerse con pruebas de navegador y nonces en una fase específica; `frame-ancestors 'none'` y `X-Frame-Options: DENY` bloquean embedding.

n8n no tiene ruta pública en Nginx. Sus webhooks se consumen desde Nest por red interna. Para administración se recomienda túnel VPN/SSH temporal o una ruta separada protegida por allowlist y autenticación; nunca publicar 5678 directamente.

## Preparación y validación

```powershell
Copy-Item .env.prod.example .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml config
docker compose --env-file .env.prod -f docker-compose.prod.yml build
```

Revisar que `docker compose config` no contenga `ports` en servicios internos. No pegar su salida en tickets porque materializa secretos.

## Backup y migraciones

Orden obligatorio:

1. Confirmar host/base y que no sea Azure ni una base equivocada.
2. Ejecutar `scripts/backup-mysql.ps1`; comprobar tamaño y SHA-256.
3. Cifrar el dump mediante el mecanismo institucional y copiarlo fuera del servidor.
4. Abrir ventana de mantenimiento o detener escrituras.
5. Ejecutar `npm run migration:show` dentro de una tarea backend con el mismo entorno.
6. Ejecutar `npm run migration:run`. Nunca usar `synchronize`.
7. Verificar tablas, índices y migraciones aplicadas.
8. Arrancar servicios y ejecutar smoke tests.

La retención sugerida se configura institucionalmente mediante `BACKUP_RETENTION_DAYS`; el script no elimina backups automáticamente para evitar borrados accidentales.

## Arranque y comprobaciones

```powershell
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail 100
```

Comprobar sin datos personales:

- Nginx `/` responde y carga recursos Next.
- Nginx `/api/health` retorna solo estado/servicio.
- handshake Socket.IO por `/socket.io/` funciona con JWT válido y rechaza uno inválido.
- `docker compose ps` muestra MySQL, Nest, Next, FastAPI y n8n saludables.
- desde backend se resuelven `mysql`, `ai` y `n8n`; desde el host no existen listeners 3000, 3001, 3306, 8000 ni 5678.
- autenticación, MFA, reserva, ownership y auditoría mediante cuentas de prueba autorizadas, sin mensajes reales.

## Rollback

Si falla el build o smoke, mantener escrituras detenidas, recopilar logs sanitizados y volver a la imagen de aplicación previamente aprobada. No revertir una migración destructivamente por reflejo. Si la migración es incompatible, restaurar en una base nueva/temporal, verificar y conmutar siguiendo la ventana aprobada.

## Restore seguro

Probar periódicamente sobre una base temporal aislada:

1. Crear una base temporal sin datos históricos.
2. Apuntar un archivo de entorno temporal únicamente a esa base.
3. Crear un dato marcador no sensible y ejecutar backup.
4. Eliminar/recrear solo la base temporal verificada.
5. Ejecutar `scripts/restore-mysql.ps1 -BackupFile <ruta> -ComposeEnvFile <env-temporal> -AllowProductionDatabase`.
6. Comprobar tablas, migraciones y dato marcador; destruir el entorno temporal de forma controlada.

El nombre del switch obliga a una confirmación consciente, pero no reemplaza la revisión humana del destino.

## Rotación de secretos

- Rotar `JWT_SECRET` invalida tokens existentes; coordinar ventana.
- Rotar `N8N_ENCRYPTION_KEY` requiere el procedimiento oficial de n8n para no perder acceso a credenciales cifradas.
- Rotar `MFA_ENCRYPTION_KEY` exige una estrategia sobre credenciales MFA existentes.
- Rotar DB, OTP y token interno actualizando consumidores de forma coordinada.
- Nunca registrar valores completos ni cuerpos con credenciales.

## Pendientes del hospital

Dominio/DNS, certificado, VM/firewall, secretos y credenciales definitivos, SMTP, Inalambria/n8n productivo, retención de auditoría, backup externo, RPO/RTO, aceptación funcional y parámetros clínicos.
