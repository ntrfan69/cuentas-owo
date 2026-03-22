# Configuración de Seguridad - Panel de Cuentas

Este documento explica cómo configurar la seguridad del panel de administración.

## Sistema de Autenticación Implementado

El panel ahora está completamente protegido con autenticación de Supabase y Row Level Security (RLS).

### Características de Seguridad

✅ **Autenticación obligatoria** - Solo usuarios autenticados pueden acceder
✅ **Middleware de protección** - Verifica la sesión en cada request
✅ **Row Level Security (RLS)** - Protección a nivel de base de datos
✅ **Redirecciones automáticas** - Usuarios no autenticados van al login
✅ **Sesiones seguras** - Manejo de cookies y tokens encriptados

## Pasos para Configurar

### 1. Ejecutar el Script de Seguridad

Ejecuta el script SQL para habilitar Row Level Security:

\`\`\`bash
scripts/005_add_row_level_security.sql
\`\`\`

Este script:
- Habilita RLS en todas las tablas
- Crea políticas que solo permiten acceso a usuarios autenticados
- Protege todos los datos contra acceso no autorizado

### 2. Configurar Confirmación de Email en Supabase

Tienes dos opciones según tus necesidades:

#### Opción A: Deshabilitar Confirmación de Email (Recomendado para uso interno)

Para acceso inmediato sin necesidad de confirmar emails:

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. En el menú lateral, haz clic en **Authentication** → **Providers** → **Email**
3. Desactiva la opción **"Confirm email"**
4. Guarda los cambios

Con esto, los usuarios pueden acceder inmediatamente después de registrarse.

#### Opción B: Mantener Confirmación de Email (Más seguro)

Si prefieres que los usuarios confirmen su email:

1. Mantén la configuración por defecto en Supabase
2. Los usuarios recibirán un email de confirmación
3. Deben hacer clic en el enlace antes de poder acceder

### 3. Crear tu Usuario Administrador

#### Método 1: Desde la Aplicación (Más fácil)

1. Ve a `/auth/register` en tu aplicación
2. Ingresa tu email y contraseña (mínimo 6 caracteres)
3. Si deshabilitaste la confirmación de email, podrás acceder inmediatamente
4. Si no, revisa tu email y confirma la cuenta

#### Método 2: Desde Supabase Dashboard

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. En el menú lateral, haz clic en **Authentication** → **Users**
3. Haz clic en **Add user** → **Create new user**
4. Ingresa:
   - Email: tu correo de administrador
   - Password: una contraseña segura (mínimo 6 caracteres)
5. **IMPORTANTE**: Marca la opción **Auto Confirm User** para que no necesite confirmar el email
6. Haz clic en **Create user**

### 4. Iniciar Sesión

1. Ve a tu aplicación desplegada
2. Serás redirigido automáticamente a `/auth/login`
3. Ingresa tu email y contraseña
4. Accederás al panel completo

### 5. Cerrar Sesión

Haz clic en el botón **"Cerrar sesión"** en la esquina superior derecha del panel.

## Seguridad Implementada

### Middleware de Protección

El archivo `middleware.ts` protege todas las rutas automáticamente:

- Verifica la sesión en cada request
- Redirige a `/auth/login` si no hay usuario autenticado
- Redirige a `/` si el usuario ya está autenticado e intenta acceder al login
- Maneja cookies y tokens de forma segura

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas que:

- Solo permiten acceso a usuarios con `auth.role() = 'authenticated'`
- Protegen contra acceso directo a la base de datos
- Previenen inyección SQL y acceso no autorizado
- Funcionan incluso si alguien obtiene las credenciales de la base de datos

### Protección de Rutas

- **Rutas públicas**: Solo `/auth/login`
- **Rutas protegidas**: Todo lo demás requiere autenticación
- **Verificación en servidor**: Cada página verifica la sesión antes de renderizar

## Mejores Prácticas

### Contraseñas Seguras

- Mínimo 6 caracteres
- Combina mayúsculas, minúsculas, números y símbolos
- No uses contraseñas comunes o fáciles de adivinar

### Gestión de Usuarios

- Crea usuarios solo para personas de confianza
- Usa emails únicos para cada usuario
- Revisa regularmente los usuarios activos en Supabase Dashboard

### Monitoreo

Puedes ver los intentos de login en:
1. Supabase Dashboard → Authentication → Users
2. Revisa la columna "Last Sign In" para ver actividad

## Solución de Problemas

### No puedo iniciar sesión

1. Verifica que el usuario existe en Supabase Dashboard
2. Confirma que el usuario está marcado como "Confirmed"
3. Verifica que las variables de entorno estén configuradas correctamente
4. Revisa la consola del navegador para errores

### Error "Invalid login credentials"

- Verifica que el email y contraseña sean correctos
- Asegúrate de que el usuario esté confirmado en Supabase

### No puedo ver datos después de login

1. Verifica que ejecutaste el script `005_add_row_level_security.sql`
2. Confirma que estás autenticado (deberías ver el botón "Cerrar sesión")
3. Revisa la consola del navegador para errores de permisos

## Próximos Pasos

Una vez configurada la seguridad:

1. ✅ Ejecuta el script de RLS
2. ✅ Crea tu usuario administrador
3. ✅ Inicia sesión
4. ✅ Publica la aplicación con confianza

Tu panel ahora está completamente protegido y listo para producción.
