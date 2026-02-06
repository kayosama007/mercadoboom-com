import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Smartphone, Mail, AlertTriangle, CheckCircle, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface SecurityVerificationProps {
  onVerificationComplete?: () => void;
  action?: string;
  required?: boolean;
}

export function SecurityVerification({ 
  onVerificationComplete, 
  action = "security_check",
  required = false 
}: SecurityVerificationProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { toast } = useToast();

  const sendVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      const response = await apiRequest("POST", "/api/security/send-code", { action });

      if (response.ok) {
        const data = await response.json();
        setCodeSent(true);
        toast({
          title: "Código Enviado",
          description: data.message,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al enviar código de verificación",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Error",
        description: "Ingresa el código de verificación",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiRequest("POST", "/api/security/verify-code", { 
        code: verificationCode.trim(), 
        action 
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Verificación Exitosa",
          description: data.message,
        });
        onVerificationComplete?.();
      } else {
        const error = await response.json();
        toast({
          title: "Código Incorrecto",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al verificar código",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <Shield className="h-6 w-6 text-yellow-600" />
        </div>
        <CardTitle>Verificación de Seguridad</CardTitle>
        <CardDescription>
          {required 
            ? "Esta acción requiere verificación adicional por seguridad"
            : "Verificación de seguridad solicitada"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!codeSent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Se enviará un código de verificación a tu método de contacto configurado
            </p>
            <Button 
              onClick={sendVerificationCode}
              disabled={isSendingCode}
              className="w-full"
            >
              {isSendingCode ? "Enviando..." : "Enviar Código de Verificación"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Código de Verificación</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Ingresa el código de 6 dígitos"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                data-testid="input-verification-code"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={verifyCode}
                disabled={isVerifying}
                className="w-full"
                data-testid="button-verify-code"
              >
                {isVerifying ? "Verificando..." : "Verificar Código"}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => {
                  setCodeSent(false);
                  setVerificationCode("");
                }}
                className="w-full text-sm"
              >
                Enviar nuevo código
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SecuritySettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "sms" | "whatsapp" | "email_sms" | "email_whatsapp" | "sms_whatsapp" | "all">("email");
  const { toast } = useToast();

  const updateTwoFactorSettings = async (enabled: boolean, method?: "email" | "sms" | "whatsapp" | "email_sms" | "email_whatsapp" | "sms_whatsapp" | "all") => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/security/update-2fa", { enabled, method });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(enabled);
        if (method) setTwoFactorMethod(method);
        
        toast({
          title: "Configuración Actualizada",
          description: data.message,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar configuración de seguridad",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configuración de Seguridad
        </CardTitle>
        <CardDescription>
          Gestiona la verificación en dos pasos para mayor seguridad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two-Factor Authentication Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base">Verificación en Dos Pasos</Label>
            <p className="text-sm text-gray-600">
              Requiere un código adicional para acciones importantes
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={(checked) => updateTwoFactorSettings(checked, twoFactorMethod)}
            disabled={isLoading}
            data-testid="switch-2fa"
          />
        </div>

        {/* Method Selection */}
        {twoFactorEnabled && (
          <div className="space-y-3">
            <Label>Método de Verificación</Label>
            <Select
              value={twoFactorMethod}
              onValueChange={(value: "email" | "sms" | "whatsapp" | "email_sms" | "email_whatsapp" | "sms_whatsapp" | "all") => {
                setTwoFactorMethod(value);
                updateTwoFactorSettings(true, value);
              }}
              disabled={isLoading}
            >
              <SelectTrigger data-testid="select-2fa-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Solo Email
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Solo SMS
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Solo WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="email_sms">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Smartphone className="h-4 w-4" />
                    Email y SMS
                  </div>
                </SelectItem>
                <SelectItem value="email_whatsapp">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <MessageCircle className="h-4 w-4" />
                    Email y WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="sms_whatsapp">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <MessageCircle className="h-4 w-4" />
                    SMS y WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Smartphone className="h-4 w-4" />
                    <MessageCircle className="h-4 w-4" />
                    Todos los canales
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Contact Verification Status */}
        <div className="space-y-3">
          <Label>Estado de Verificación de Contactos</Label>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Email: {user?.email}</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            </div>
            
            {user?.phone && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Teléfono: {user.phone}</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              </div>
            )}

            {user?.phone && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">WhatsApp: {user.phone}</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Disponible
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Security Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-blue-900">
                ¿Cuándo se solicita verificación?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Acceso al panel de administrador</li>
                <li>• Pedidos de gran valor</li>
                <li>• Cambios de perfil importantes</li>
                <li>• Modificación de métodos de pago</li>
                <li>• Verificación por WhatsApp disponible</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}