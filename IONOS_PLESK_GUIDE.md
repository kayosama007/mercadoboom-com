# 🎛️ Guía de Deployment en IONOS usando Plesk

## 📌 Información del Dominio

**Dominio Configurado**: shop.mercadoboom.com

## 🚀 Deployment usando Plesk (Panel de Control IONOS)

### 1. Acceder a Plesk

1. Ir a tu panel de IONOS
2. Encontrar tu servidor/hosting
3. Click en "Abrir Plesk" o "Panel de Control"
4. Inicia sesión con tus credenciales

### 2. Configurar Node.js en Plesk

1. En Plesk, ir a **"Dominios"** → Selecciona `shop.mercadoboom.com`
2. Click en **"Node.js"** (en la sección de desarrollo)
3. Configurar:
   - **Versión de Node.js**: 20.x (la más reciente)
   - **Modo de aplicación**: Producción
   - **Directorio de la aplicación**: `/httpdocs` o `/mercadoboom`
   - **Archivo de inicio**: `dist/index.js`
   - **Puerto**: 5000

### 3. Subir Archivos via Plesk File Manager

**Opción A: File Manager de Plesk**

1. En Plesk, ir a **"Archivos"** → **"File Manager"**
2. Navegar a `/httpdocs/` o crear carpeta `/mercadoboom/`
3. Click en **"Subir archivos"** o arrastrar el ZIP
4. Subir `mercadoboom-deployment-XXXXXXXX.zip`
5. Click derecho en el ZIP → **"Extraer"**
6. Esperar a que se extraiga todo

**Opción B: FTP/SFTP (recomendado para archivos grandes)**

1. En Plesk, ir a **"Acceso FTP"**
2. Crear cuenta FTP o usar credenciales existentes
3. Anotar: 
   - Host FTP: `ftp.shop.mercadoboom.com` o tu servidor IONOS
   - Usuario FTP: (proporcionado por Plesk)
   - Contraseña FTP: (proporcionado por Plesk)
4. Usar FileZilla/WinSCP para conectar
5. Subir todos los archivos del ZIP

### 4. Configurar Base de Datos PostgreSQL en Plesk

1. En Plesk, ir a **"Bases de Datos"**
2. Click en **"Agregar Base de Datos"**
3. Configurar:
   - **Tipo**: PostgreSQL
   - **Nombre de BD**: `mercadoboom`
   - **Usuario**: `mercadoboom_user`
   - **Contraseña**: (genera una segura)
4. Click en **"Aceptar"**
5. Anotar las credenciales (las necesitarás para .env)

### 5. Configurar Variables de Entorno en Plesk

1. En la sección de **"Node.js"** del dominio
2. Buscar **"Variables de Entorno"** o **"Environment Variables"**
3. Agregar cada variable (ver `.env.example`):

```
DATABASE_URL=postgresql://mercadoboom_user:TU_CONTRASEÑA@localhost:5432/mercadoboom
SESSION_SECRET=GENERA_UNA_CLAVE_SEGURA_AQUI
MERCADOPAGO_ACCESS_TOKEN=TU_TOKEN_MERCADOPAGO
TWILIO_ACCOUNT_SID=TU_TWILIO_SID
TWILIO_AUTH_TOKEN=TU_TWILIO_TOKEN
TWILIO_MESSAGING_SERVICE_SID=TU_MESSAGING_SERVICE
TWILIO_PHONE_NUMBER=TU_NUMERO_TWILIO
SENDGRID_API_KEY=TU_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@mercadoboom.com
NODE_ENV=production
PORT=5000
```

**Alternativamente**, puedes crear archivo `.env` via File Manager:

1. File Manager → Navegar a directorio de la app
2. Click **"Nuevo archivo"** → Nombrar `.env`
3. Pegar el contenido de `.env.example` y completar valores
4. Guardar

### 6. Instalar Dependencias via SSH

1. En Plesk, ir a **"Acceso SSH"** y habilitarlo
2. Anotar credenciales SSH
3. Desde terminal local:

```bash
ssh tu_usuario@tu_servidor_ionos.com
cd /var/www/vhosts/shop.mercadoboom.com/httpdocs/
npm ci --production=false
```

**Si no tienes acceso SSH**, usa la **Terminal Web de Plesk**:

1. En Plesk, buscar **"Terminal Web"** o **"Web Terminal"**
2. Ejecutar:
```bash
cd /var/www/vhosts/shop.mercadoboom.com/httpdocs/
npm ci --production=false
```

### 7. Compilar el Proyecto (si no viene compilado)

```bash
npm run build
```

### 8. Aplicar Migraciones de Base de Datos

```bash
npm run db:push
```

Si hay error de data loss warning:
```bash
npm run db:push -- --force
```

### 9. Iniciar la Aplicación en Plesk

1. Volver a la sección **"Node.js"** en Plesk
2. Verificar que todo esté configurado:
   - Versión: Node 20.x
   - Modo: Producción
   - Archivo: dist/index.js
   - Variables de entorno configuradas
3. Click en **"Habilitar Node.js"** o **"Restart App"**
4. Esperar unos segundos

### 10. Configurar SSL (HTTPS)

1. En Plesk, ir a **"SSL/TLS Certificates"**
2. Para `shop.mercadoboom.com`:
3. Seleccionar **"Let's Encrypt"**
4. Marcar **"shop.mercadoboom.com"** y **"www.shop.mercadoboom.com"**
5. Marcar **"Redirect from HTTP to HTTPS"**
6. Click en **"Install"** o **"Get it free"**
7. Esperar a que se instale (1-2 minutos)

### 11. Configurar Proxy Reverso (si es necesario)

Si Plesk no redirige automáticamente:

1. Ir a **"Apache & Nginx Settings"**
2. En **"Additional Nginx directives"**, agregar:

```nginx
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

3. Click **"Apply"** o **"OK"**

## ✅ Verificar que Todo Funciona

1. Abrir navegador
2. Ir a: `https://shop.mercadoboom.com`
3. Deberías ver la página principal de MercadoBoom

## 📊 Monitoreo en Plesk

### Ver Logs de la Aplicación

1. Ir a **"Node.js"** → **"Logs"**
2. O ir a **"Logs"** → **"Error Log"**

### Reiniciar Aplicación

1. Ir a **"Node.js"**
2. Click en **"Restart App"**

### Detener/Iniciar Aplicación

1. Ir a **"Node.js"**
2. Toggle en **"Enable Node.js"** / **"Disable Node.js"**

## 🔄 Actualizar la Aplicación

1. Subir nuevos archivos (reemplazar existentes)
2. Via SSH o Terminal Web:
```bash
cd /var/www/vhosts/shop.mercadoboom.com/httpdocs/
npm ci --production=false
npm run build
npm run db:push
```
3. En Plesk → Node.js → **"Restart App"**

## 🆘 Solución de Problemas en Plesk

### Error: "Cannot find module"
- Verificar que `npm ci` se ejecutó correctamente
- Revisar que `node_modules` existe

### Error: "Connection refused"
- Verificar que la app esté habilitada en Node.js
- Revisar puerto correcto (5000)
- Revisar logs en Plesk

### Error de Base de Datos
- Verificar credenciales en variables de entorno
- Verificar que PostgreSQL esté activo
- Ir a Bases de Datos en Plesk y verificar que existe

### SSL no funciona
- Verificar que el dominio apunta a tu servidor IONOS
- Verificar DNS propagado: `nslookup shop.mercadoboom.com`
- Reinstalar certificado Let's Encrypt

## 📞 Soporte

- **Soporte IONOS**: https://www.ionos.mx/ayuda
- **Documentación Plesk**: https://docs.plesk.com
- **Chat IONOS**: Disponible en panel de control

## 🎉 Resumen de Pasos Rápidos

1. ✅ Acceder a Plesk
2. ✅ Configurar Node.js 20.x
3. ✅ Subir archivos ZIP y extraer
4. ✅ Crear base de datos PostgreSQL
5. ✅ Configurar variables de entorno
6. ✅ Instalar dependencias (SSH/Terminal)
7. ✅ Compilar proyecto
8. ✅ Aplicar migraciones
9. ✅ Habilitar Node.js
10. ✅ Configurar SSL
11. ✅ Abrir https://shop.mercadoboom.com

¡Tu tienda MercadoBoom está lista! 🚀
