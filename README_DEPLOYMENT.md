# MercadoBoom - Deployment en IONOS

## 🚀 Inicio Rápido

1. **Sube estos archivos a tu servidor IONOS** (via SCP/FTP)
2. **Instala dependencias**: `npm ci --production=false`
3. **Configura variables de entorno**: `cp .env.example .env` y edítalo
4. **Aplica migraciones**: `npm run db:push`
5. **Inicia con PM2**: `pm2 start ecosystem.config.js`

## 📖 Documentación Completa

Ver archivo `IONOS_DEPLOYMENT.md` para instrucciones detalladas paso a paso.

## 🔑 Variables de Entorno Requeridas

- DATABASE_URL
- SESSION_SECRET
- MERCADOPAGO_ACCESS_TOKEN
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- SENDGRID_API_KEY

Ver `.env.example` para la lista completa.
