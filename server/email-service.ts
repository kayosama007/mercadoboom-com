import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not found - email sending will be simulated");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      // Simulate email sending for development
      console.log("📧 SIMULATED EMAIL SENT:");
      console.log(`To: ${params.to}`);
      console.log(`From: ${params.from}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Text: ${params.text}`);
      console.log("✅ Email would be sent in production with SENDGRID_API_KEY");
      return true;
    }

    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    const response = await mailService.send(emailData);
    console.log(`📧 Email sent successfully to ${params.to}`);
    
    // Log SendGrid response details for debugging
    if (response && response[0]) {
      console.log(`📧 SendGrid Message ID: ${response[0].headers['x-message-id'] || 'N/A'}`);
      console.log(`📧 SendGrid Status Code: ${response[0].statusCode}`);
      console.log(`📧 SendGrid Headers:`, JSON.stringify({
        'x-message-id': response[0].headers['x-message-id'],
        'server': response[0].headers['server'],
        'date': response[0].headers['date']
      }, null, 2));
    }
    
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    
    // Log detailed SendGrid error information
    if (error.response && error.response.body && error.response.body.errors) {
      console.error('SendGrid detailed errors:', JSON.stringify(error.response.body.errors, null, 2));
    }
    
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean> {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/auth?reset=${resetToken}&username=${username}`;
  
  const emailParams: EmailParams = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@mercadoboom.com',
    subject: 'Recuperación de Contraseña - MercadoBoom',
    text: `
Hola,

Has solicitado recuperar tu contraseña en MercadoBoom.

Tu token de recuperación es: ${resetToken}
Usuario: ${username}

También puedes usar este enlace para completar la recuperación:
${resetUrl}

Este token expira en 24 horas por seguridad.

Si no solicitaste esta recuperación, puedes ignorar este correo.

Saludos,
Equipo MercadoBoom
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444, #f59e0b); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">MercadoBoom</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151;">Recuperación de Contraseña</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            Has solicitado recuperar tu contraseña en MercadoBoom.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Token de Recuperación:</h3>
            <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #ef4444; margin: 0;">${resetToken}</p>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">Usuario: <strong>${username}</strong></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Recuperar Contraseña
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
            Este token expira en 24 horas por seguridad.<br>
            Si no solicitaste esta recuperación, puedes ignorar este correo.
          </p>
        </div>
        <div style="background: #374151; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2024 MercadoBoom. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `
  };

  return sendEmail(emailParams);
}