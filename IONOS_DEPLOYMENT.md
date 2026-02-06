# 🚀 Guía de Deployment MercadoBoom en IONOS

## 📋 Requisitos Previos en IONOS

1. **Servidor VPS o Cloud Server** con:
   - Node.js 20.x o superior
   - PostgreSQL 14 o superior
   - Mínimo 2GB RAM
   - 20GB de espacio en disco

2. **Acceso SSH** al servidor
3. **Dominio configurado**: shop.mercadoboom.com

## 📦 Archivos Incluidos en el Paquete

```
mercadoboom-deployment.zip
├── package.json              # Dependencias del proyecto
├── package-lock.json         # Versiones exactas de dependencias
├── tsconfig.json            # Configuración TypeScript
├── drizzle.config.ts        # Configuración Drizzle ORM
├── vite.config.ts           # Configuración Vite
├── tailwind.config.ts       # Configuración Tailwind
├── postcss.config.js        # Configuración PostCSS
├── ecosystem.config.js      # Configuración PM2 (gestor de procesos)
├── .env.example             # Variables de entorno (RENOMBRAR a .env)
├── IONOS_DEPLOYMENT.md      # Esta guía completa
├── IONOS_PLESK_GUIDE.md     # Guía específica para Plesk
├── README_DEPLOYMENT.md     # Inicio rápido
├── dist/                    # Código compilado (frontend y backend)
├── server/                  # Código fuente del servidor
├── client/                  # Código fuente del cliente
├── shared/                  # Código compartido
├── attached_assets/         # Assets estáticos
└── logs/                    # Directorio para logs (vacío)
```

## 🔧 Pasos de Instalación en IONOS

### 1. Conectar por SSH a tu servidor IONOS

```bash
ssh tu_usuario@tu_servidor_ionos.com
```

### 2. Instalar Node.js 20.x (si no está instalado)

```bash
# Para Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version
```

### 3. Instalar PostgreSQL (si no está instalado)

```bash
# Para Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Crear Base de Datos PostgreSQL

```bash
# Entrar a PostgreSQL
sudo -u postgres psql

# Ejecutar estos comandos en PostgreSQL:
CREATE DATABASE mercadoboom;
CREATE USER mercadoboom_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE mercadoboom TO mercadoboom_user;
\q
```

### 5. Subir los archivos a IONOS

**Opción A: Via SCP (desde tu computadora local)**
```bash
scp mercadoboom-deployment.zip tu_usuario@tu_servidor:/var/www/
```

**Opción B: Via FTP/SFTP**
- Usa FileZilla o WinSCP
- Conecta a tu servidor IONOS
- Sube el archivo `mercadoboom-deployment.zip` a `/var/www/`

### 6. Descomprimir y configurar en el servidor

```bash
# Ir al directorio web
cd /var/www/

# Descomprimir
unzip mercadoboom-deployment.zip -d mercadoboom

# Entrar al directorio
cd mercadoboom

# Copiar y configurar variables de entorno
cp .env.example .env
nano .env
```

### 7. Configurar Variables de Entorno (.env)

Edita el archivo `.env` con tus credenciales:

```env
# Base de Datos
DATABASE_URL=postgresql://mercadoboom_user:tu_contraseña_segura@localhost:5432/mercadoboom

# Sesión (genera una clave secreta aleatoria)
SESSION_SECRET=genera_una_clave_segura_aleatoria_aqui

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_token_de_mercadopago

# Twilio (SMS)
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_MESSAGING_SERVICE_SID=tu_messaging_service_sid
TWILIO_PHONE_NUMBER=tu_numero_twilio

# SendGrid (Email)
SENDGRID_API_KEY=tu_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@mercadoboom.com

# Entorno
NODE_ENV=production
PORT=5000
```

### 8. Instalar Dependencias

```bash
# Instalar dependencias de producción
npm ci --production=false
```

### 9. Compilar el Proyecto

```bash
# Compilar frontend y backend
npm run build
```

### 10. Ejecutar Migraciones de Base de Datos

```bash
# Aplicar el schema a la base de datos
npm run db:push
```

### 11. Instalar PM2 (Gestor de Procesos)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar la aplicación con PM2
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar automáticamente
pm2 startup
pm2 save
```

### 12. Configurar Nginx como Proxy Reverso

```bash
# Instalar Nginx
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/mercadoboom
```

Pega esta configuración:

```nginx
server {
    listen 80;
    server_name shop.mercadoboom.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/mercadoboom /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 13. Configurar SSL con Let's Encrypt (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d shop.mercadoboom.com

# Renovación automática
sudo systemctl enable certbot.timer
```

## 🎯 Verificar que Todo Funciona

1. **Verificar PM2**: `pm2 status`
2. **Ver logs**: `pm2 logs mercadoboom`
3. **Abrir en navegador**: https://shop.mercadoboom.com

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
pm2 logs mercadoboom

# Reiniciar aplicación
pm2 restart mercadoboom

# Detener aplicación
pm2 stop mercadoboom

# Ver estado
pm2 status

# Monitorear recursos
pm2 monit
```

## 🔄 Actualizar la Aplicación

```bash
# Detener aplicación
pm2 stop mercadoboom

# Actualizar archivos (sube nuevos archivos via SCP/FTP)

# Instalar nuevas dependencias (si hay)
npm ci --production=false

# Recompilar
npm run build

# Aplicar migraciones (si hay cambios en BD)
npm run db:push

# Reiniciar
pm2 restart mercadoboom
```

## 🆘 Solución de Problemas

### La aplicación no inicia
```bash
# Ver logs de error
pm2 logs mercadoboom --err

# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión a BD
psql -U mercadoboom_user -d mercadoboom -h localhost
```

### Error de conexión a base de datos
- Verifica que DATABASE_URL en `.env` sea correcto
- Verifica que el usuario tenga permisos
- Verifica que PostgreSQL esté escuchando en localhost:5432

### Nginx no redirige correctamente
```bash
# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar configuración
sudo nginx -t
```

## 📊 Crear Usuario Admin Inicial

Una vez que la aplicación esté corriendo, accede a PostgreSQL:

```bash
psql -U mercadoboom_user -d mercadoboom -h localhost
```

Ejecuta este comando para crear el usuario admin:

```sql
INSERT INTO users (username, password_hash, email, is_admin)
VALUES ('admin', 'scrypt_hash_aqui', 'admin@mercadoboom.com', true);
```

O usa la funcionalidad de registro en la web y luego actualiza:

```sql
UPDATE users SET is_admin = true WHERE username = 'admin';
```

## ✅ Checklist de Deployment

- [ ] Node.js 20.x instalado
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos creada
- [ ] Archivos subidos y descomprimidos
- [ ] Variables de entorno configuradas (.env)
- [ ] Dependencias instaladas
- [ ] Proyecto compilado (npm run build)
- [ ] Migraciones aplicadas (npm run db:push)
- [ ] PM2 instalado e iniciado
- [ ] Nginx configurado
- [ ] SSL certificado instalado
- [ ] Dominio apuntando al servidor
- [ ] Usuario admin creado
- [ ] Aplicación accesible en https://shop.mercadoboom.com

## 🎉 ¡Listo!

Tu aplicación MercadoBoom ya está corriendo en producción en IONOS.

Para soporte: admin@mercadoboom.com
