# Guía de Gestión del Ciclo de Vida de Usuarios

Este sistema gestiona automáticamente el ciclo de vida de los usuarios cuando las cuentas vencen.

## Cómo Funciona

### 1. Cuando una cuenta vence

Automáticamente:
- Todos los usuarios de esa cuenta se marcan como **"inactivos"**
- Se registra la fecha de desactivación
- Se programa la eliminación para **2 meses después**

### 2. Período de gracia (2 meses)

Durante estos 2 meses:
- Los usuarios permanecen en la base de datos como "inactivos"
- Puedes ver todos los usuarios inactivos en el panel
- Si renuevas la cuenta, los usuarios se reactivan automáticamente

### 3. Advertencia de eliminación (7 días antes)

Una semana antes de la eliminación:
- Los usuarios se marcan como **"pendiente de eliminación"**
- Aparecen con una alerta roja en el panel
- Es la última oportunidad para renovar la cuenta

### 4. Eliminación automática

Después de 2 meses:
- Los usuarios se eliminan permanentemente de la base de datos
- Esta acción es irreversible
- Se ejecuta automáticamente con el botón "Ejecutar Limpieza"

## Panel de Usuarios Inactivos

El panel muestra:
- **Nombre del usuario** y servicio al que pertenecía
- **Estado**: Inactivo o Pendiente de eliminación
- **Días restantes** hasta la eliminación
- **Fecha de desactivación**

### Colores de advertencia:
- 🔴 **Rojo**: 7 días o menos (urgente)
- 🟠 **Naranja**: 8-30 días (pronto)
- ⚪ **Gris**: Más de 30 días

## Renovación de Cuentas

Si renuevas una cuenta vencida:
1. Ve a la tabla de cuentas
2. Edita la cuenta y actualiza la fecha de vencimiento
3. Los usuarios inactivos se **reactivan automáticamente**
4. Se cancela la eliminación programada

## Limpieza Manual

Puedes ejecutar la limpieza manualmente:
1. Haz clic en **"Ejecutar Limpieza"** en el panel de usuarios inactivos
2. El sistema:
   - Marca usuarios que están a 7 días de eliminación
   - Elimina usuarios cuyo tiempo ha expirado
3. Verás un resumen de las acciones realizadas

## Automatización (Recomendado)

Para automatizar la limpieza, configura un cron job que llame a:

\`\`\`bash
POST /api/users/cleanup
\`\`\`

### Ejemplo con Vercel Cron:

Crea `vercel.json`:
\`\`\`json
{
  "crons": [{
    "path": "/api/users/cleanup",
    "schedule": "0 2 * * *"
  }]
}
\`\`\`

Esto ejecutará la limpieza diariamente a las 2 AM.

## Consultas SQL Útiles

### Ver todos los usuarios inactivos:
\`\`\`sql
SELECT * FROM user_lifecycle_status;
\`\`\`

### Ejecutar limpieza manualmente:
\`\`\`sql
SELECT * FROM delete_scheduled_users();
\`\`\`

### Marcar usuarios pendientes de eliminación:
\`\`\`sql
SELECT * FROM mark_users_pending_deletion();
\`\`\`

## Preguntas Frecuentes

**¿Qué pasa si renuevo una cuenta después de que venció?**
Los usuarios se reactivan automáticamente y se cancela su eliminación.

**¿Puedo cambiar el período de 2 meses?**
Sí, modifica el script SQL `006_user_lifecycle_management.sql` y cambia `INTERVAL '2 months'` al período deseado.

**¿Los usuarios eliminados se pueden recuperar?**
No, la eliminación es permanente. Asegúrate de renovar las cuentas antes de que se eliminen los usuarios.

**¿Cómo sé cuándo se eliminarán los usuarios?**
El panel muestra los días restantes para cada usuario inactivo.
