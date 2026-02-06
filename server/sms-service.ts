// SMS Service for password recovery using Twilio
import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn("Twilio credentials not found - SMS sending will be simulated");
} else if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
  console.log("✅ Twilio Messaging Service configured:", process.env.TWILIO_MESSAGING_SERVICE_SID);
}

interface SMSParams {
  to: string;
  message: string;
}

export async function sendSMS(params: SMSParams): Promise<boolean> {
  try {
    // Check if Twilio credentials are available
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      // Simulate SMS sending for development
      console.log("📱 SIMULATED SMS SENT:");
      console.log(`To: ${params.to}`);
      console.log(`Message: ${params.message}`);
      console.log("✅ SMS would be sent in production with Twilio credentials");
      return true;
    }

    // Use real Twilio API
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Configure message options - use Messaging Service if available, otherwise use phone number
    const messageOptions: any = {
      body: params.message,
      to: params.to
    };

    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      // Use verified Messaging Service for better delivery
      messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      console.log(`📱 Using Twilio Messaging Service: ${process.env.TWILIO_MESSAGING_SERVICE_SID}`);
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      // Fallback to direct phone number
      messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
      console.log(`📱 Using Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
    } else {
      console.error('📱 No Twilio messaging service or phone number configured');
      return false;
    }
    
    const message = await client.messages.create(messageOptions);
    
    console.log(`📱 SMS sent successfully to ${params.to}`);
    console.log(`📱 Twilio Message SID: ${message.sid}`);
    console.log(`📱 Message Status: ${message.status}`);
    
    return true;
  } catch (error: any) {
    console.error('SMS sending error:', error);
    
    // Log detailed Twilio error information
    if (error.code && error.moreInfo) {
      console.error(`📱 Twilio Error ${error.code}: ${error.message}`);
      console.error(`📱 More info: ${error.moreInfo}`);
    }
    
    return false;
  }
}

export async function sendPasswordResetSMS(phone: string, resetToken: string, username: string): Promise<boolean> {
  const message = `MercadoBoom: Tu token de recuperación es: ${resetToken} para el usuario: ${username}. Expira en 24 horas. Si no solicitaste esto, ignora este mensaje.`;
  
  return sendSMS({
    to: phone,
    message
  });
}