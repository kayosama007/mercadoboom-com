import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser, passwordResetRequestSchema, passwordResetConfirmSchema } from "@shared/schema";
import { z } from "zod";
import logoPath from "@assets/LOGO_1754893994411.gif";
import securityImage from "@assets/security (1)_1758762078182.jpg";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, KeyRound, ArrowLeft, CheckCircle, Loader2, Mail, Phone, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const loginSchema = z.object({
  username: z.string().min(1, "Username es requerido"),
  password: z.string().min(1, "Password es requerido"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Enhanced reset schemas with method selection
const resetRequestSchema = passwordResetRequestSchema;

const resetConfirmSchema = passwordResetConfirmSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ResetRequestForm = z.infer<typeof resetRequestSchema>;
type ResetConfirmForm = z.infer<typeof resetConfirmSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetToken, setResetToken] = useState<string>('');
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetMethod, setResetMethod] = useState<'username' | 'email' | 'phone'>('email');
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  const onRegister = (data: RegisterForm) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData as InsertUser, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  const resetRequestForm = useForm<ResetRequestForm>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      identifier: "",
      method: "email",
    },
  });

  const resetConfirmForm = useForm<ResetConfirmForm>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: {
      identifier: "",
      resetToken: "",
      newPassword: "",
      confirmPassword: "",
      method: "email",
    },
  });

  const onResetRequest = async (data: ResetRequestForm) => {
    setIsRequestingReset(true);
    try {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al generar token de recuperación");
      }

      // Update state in a more stable way
      setTimeout(() => {
        setResetIdentifier(data.identifier);
        setResetMethod(data.method);
        resetConfirmForm.setValue('identifier', data.identifier);
        resetConfirmForm.setValue('method', data.method);
        // Don't auto-fill the token - user must enter it manually
        setResetStep('confirm');
        
        toast({
          title: "Token de Recuperación Enviado",
          description: `Revisa tu ${data.method === 'email' ? 'correo electrónico' : data.method === 'phone' ? 'SMS' : 'email asociado al usuario'} para obtener el token de recuperación`,
        });
      }, 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al generar token de recuperación",
        variant: "destructive",
      });
    } finally {
      setIsRequestingReset(false);
    }
  };

  const onResetConfirm = async (data: ResetConfirmForm) => {
    setIsConfirmingReset(true);
    try {
      const response = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar contraseña");
      }

      toast({
        title: "Contraseña Actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente",
      });

      // Reset forms and return to login with stable timing
      setTimeout(() => {
        setShowPasswordReset(false);
        setResetStep('request');
        resetRequestForm.reset();
        resetConfirmForm.reset();
        setResetToken('');
        setResetIdentifier('');
        setResetMethod('email');
      }, 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar contraseña",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingReset(false);
    }
  };

  const goBackToLogin = () => {
    setShowPasswordReset(false);
    setResetStep('request');
    resetRequestForm.reset();
    resetConfirmForm.reset();
    setResetToken('');
    setResetIdentifier('');
  };

  if (showPasswordReset) {
    return (
      <div className="min-h-screen flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goBackToLogin}
              className="mb-4"
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </Button>
            
            <div className="text-center mb-8">
              <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {resetStep === 'request' ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
              </h1>
              <p className="text-gray-600">
                {resetStep === 'request' 
                  ? 'Elige cómo quieres recuperar tu contraseña. Te enviaremos un token de recuperación.'
                  : 'Ingresa tu nueva contraseña usando el token que recibiste'
                }
              </p>
            </div>

            {resetStep === 'request' ? (
              <Card key="reset-request-card">
                <CardContent className="space-y-6 pt-6">
                  <form onSubmit={resetRequestForm.handleSubmit(onResetRequest)} className="space-y-6">
                    {/* Method Selector */}
                    <div>
                      <Label htmlFor="reset-method" className="text-base font-medium">Método de Recuperación</Label>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <Button
                          type="button"
                          variant={resetMethod === 'email' ? 'default' : 'outline'}
                          className={`flex flex-col items-center gap-2 h-auto py-4 ${
                            resetMethod === 'email' 
                              ? 'bg-boom-yellow text-black hover:bg-boom-yellow/90' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setResetMethod('email');
                            resetRequestForm.setValue('method', 'email');
                          }}
                          data-testid="button-method-email"
                        >
                          <Mail className="w-5 h-5" />
                          <span className="text-sm font-medium">Email</span>
                        </Button>
                        
                        <Button
                          type="button"
                          variant={resetMethod === 'phone' ? 'default' : 'outline'}
                          className={`flex flex-col items-center gap-2 h-auto py-4 ${
                            resetMethod === 'phone' 
                              ? 'bg-boom-yellow text-black hover:bg-boom-yellow/90' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setResetMethod('phone');
                            resetRequestForm.setValue('method', 'phone');
                          }}
                          data-testid="button-method-phone"
                        >
                          <Phone className="w-5 h-5" />
                          <span className="text-sm font-medium">SMS</span>
                        </Button>
                        
                        <Button
                          type="button"
                          variant={resetMethod === 'username' ? 'default' : 'outline'}
                          className={`flex flex-col items-center gap-2 h-auto py-4 ${
                            resetMethod === 'username' 
                              ? 'bg-boom-yellow text-black hover:bg-boom-yellow/90' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setResetMethod('username');
                            resetRequestForm.setValue('method', 'username');
                          }}
                          data-testid="button-method-username"
                        >
                          <User className="w-5 h-5" />
                          <span className="text-sm font-medium">Usuario</span>
                        </Button>
                      </div>
                    </div>

                    {/* Input Field */}
                    <div>
                      <Label htmlFor="reset-identifier">
                        {resetMethod === 'email' ? 'Correo Electrónico' : 
                         resetMethod === 'phone' ? 'Número de Teléfono' : 
                         'Nombre de Usuario'}
                      </Label>
                      <Input
                        id="reset-identifier"
                        type={resetMethod === 'email' ? 'email' : resetMethod === 'phone' ? 'tel' : 'text'}
                        {...resetRequestForm.register("identifier")}
                        placeholder={
                          resetMethod === 'email' ? 'tu@email.com' : 
                          resetMethod === 'phone' ? '+52 55 1234 5678' : 
                          'admin'
                        }
                        className="text-base"
                        data-testid="input-reset-identifier"
                      />
                      {resetRequestForm.formState.errors.identifier && (
                        <p className="text-sm text-red-600 mt-1">
                          {resetRequestForm.formState.errors.identifier.message}
                        </p>
                      )}
                    </div>

                    {/* Info Alert */}
                    <Alert key="info-alert" className="bg-blue-50 border-blue-200">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <AlertDescription className="text-blue-700">
                        <strong>
                          {resetMethod === 'email' ? '📧 Te enviaremos un email' : 
                           resetMethod === 'phone' ? '📱 Te enviaremos un SMS' : 
                           '🔑 Generaremos un token'}
                        </strong>
                        <br />
                        {resetMethod === 'email' ? 'Revisa tu bandeja de entrada y spam' : 
                         resetMethod === 'phone' ? 'Asegúrate de que tu teléfono pueda recibir SMS' : 
                         'Te enviaremos un token por email asociado al usuario'}
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-boom-yellow text-black hover:bg-boom-yellow/90" 
                      disabled={isRequestingReset}
                      data-testid="button-request-reset"
                    >
                      {isRequestingReset ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          {resetMethod === 'email' ? <Mail className="mr-2 h-4 w-4" /> : 
                           resetMethod === 'phone' ? <Phone className="mr-2 h-4 w-4" /> : 
                           <KeyRound className="mr-2 h-4 w-4" />}
                          Enviar Token de Recuperación
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div key="reset-confirm-container" className="space-y-6">
                <Alert key="security-info-alert" className="bg-blue-50 border-blue-200">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    <strong>Token de Recuperación:</strong>
                    <br />Revisa tu {resetMethod === 'email' ? 'correo electrónico' : resetMethod === 'phone' ? 'SMS' : 'email asociado al usuario'} para obtener el token de recuperación.
                    <br />El token expira en 24 horas por seguridad.
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const data = { identifier: resetIdentifier, method: resetMethod };
                          setIsRequestingReset(true);
                          try {
                            const response = await fetch("/api/password-reset/request", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify(data),
                            });

                            const result = await response.json();

                            if (!response.ok) {
                              throw new Error(result.error || "Error al reenviar token");
                            }

                            toast({
                              title: "Token Reenviado",
                              description: `Token reenviado a: ${result.sentTo}`,
                            });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Error al reenviar token",
                              variant: "destructive",
                            });
                          } finally {
                            setIsRequestingReset(false);
                          }
                        }}
                        disabled={isRequestingReset}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        data-testid="button-resend-token"
                      >
                        {isRequestingReset ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Reenviando...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-3 w-3" />
                            Reenviar Token
                          </>
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Card key="reset-confirm-card">
                  <CardContent className="space-y-4 pt-6">
                    <form onSubmit={resetConfirmForm.handleSubmit(onResetConfirm)} className="space-y-4">
                      <div>
                        <Label htmlFor="confirm-identifier">
                          {resetMethod === 'email' ? 'Correo Electrónico' : 
                           resetMethod === 'phone' ? 'Número de Teléfono' : 
                           'Nombre de Usuario'}
                        </Label>
                        <Input
                          id="confirm-identifier"
                          type="text"
                          {...resetConfirmForm.register("identifier")}
                          readOnly
                          className="bg-gray-50"
                          data-testid="input-confirm-identifier"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="reset-token">Token de Recuperación</Label>
                        <Input
                          id="reset-token"
                          type="text"
                          {...resetConfirmForm.register("resetToken")}
                          placeholder="Pega aquí el token de recuperación"
                          className="font-mono text-sm"
                          data-testid="input-reset-token"
                        />
                        {resetConfirmForm.formState.errors.resetToken && (
                          <p className="text-sm text-red-600">
                            {resetConfirmForm.formState.errors.resetToken.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <Input
                          id="new-password"
                          type="password"
                          {...resetConfirmForm.register("newPassword")}
                          placeholder="Mínimo 8 caracteres"
                          data-testid="input-new-password"
                        />
                        {resetConfirmForm.formState.errors.newPassword && (
                          <p className="text-sm text-red-600">
                            {resetConfirmForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="confirm-new-password">Confirmar Nueva Contraseña</Label>
                        <Input
                          id="confirm-new-password"
                          type="password"
                          {...resetConfirmForm.register("confirmPassword")}
                          placeholder="Repite la nueva contraseña"
                          data-testid="input-confirm-new-password"
                        />
                        {resetConfirmForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600">
                            {resetConfirmForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-boom-yellow text-black hover:bg-boom-yellow/90" 
                        disabled={isConfirmingReset}
                        data-testid="button-confirm-reset"
                      >
                        {isConfirmingReset ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando Contraseña...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Actualizar Contraseña
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-boom-red to-boom-yellow items-center justify-center p-8">
          <div className="text-center text-white">
            <div className="relative bg-black/30 backdrop-blur-sm rounded-2xl p-6 mb-6 mx-auto w-fit border border-slate-300/30 shadow-2xl">
              <img 
                src={securityImage} 
                alt="Seguridad Digital" 
                className="h-40 w-40 mx-auto rounded-xl object-cover shadow-lg border border-slate-400/60 relative z-10" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-600/20 to-slate-800/20 rounded-2xl"></div>
            </div>
            <h2 className="text-4xl font-bold mb-4">Seguridad Empresarial</h2>
            <p className="text-lg opacity-90 leading-relaxed">
              Protocolos de seguridad avanzados para la recuperación de acceso. 
              <br />Autenticación certificada y encriptación de nivel empresarial.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logoPath} alt="MercadoBoom" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido a MercadoBoom</h1>
            <p className="text-gray-600">Ingresa a tu cuenta o crea una nueva</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Iniciar Sesión</CardTitle>
                  <CardDescription>
                    Ingresa tus credenciales para acceder a tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Usuario</Label>
                      <Input
                        id="login-username"
                        type="text"
                        {...loginForm.register("username")}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="login-password">Contraseña</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-boom-yellow text-black hover:bg-boom-yellow/90"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Iniciando..." : "Iniciar Sesión"}
                    </Button>
                    
                    <div className="text-center mt-4">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setShowPasswordReset(true)}
                        className="text-sm text-boom-red hover:text-boom-red/80"
                        data-testid="button-forgot-password"
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Crear Cuenta</CardTitle>
                  <CardDescription>
                    Crea tu cuenta para comenzar a comprar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div>
                      <Label htmlFor="register-username">Usuario</Label>
                      <Input
                        id="register-username"
                        type="text"
                        {...registerForm.register("username")}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        {...registerForm.register("email")}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-fullName">Nombre Completo</Label>
                      <Input
                        id="register-fullName"
                        type="text"
                        {...registerForm.register("fullName")}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                      />
                      {registerForm.formState.errors.fullName && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-phone">Teléfono</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        {...registerForm.register("phone")}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                      />
                      {registerForm.formState.errors.phone && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-password">Contraseña</Label>
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-confirmPassword">Confirmar Contraseña</Label>
                      <Input
                        id="register-confirmPassword"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-boom-red text-white hover:bg-boom-red/90"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creando cuenta..." : "Crear Cuenta"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-boom-red to-boom-light-red items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="boom-explosion w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <span className="text-black font-black text-2xl">BOOM!</span>
          </div>
          <h2 className="text-4xl font-black mb-4">¡Compras Explosivas!</h2>
          <p className="text-xl mb-6">
            Únete a miles de usuarios que ya disfrutan de la experiencia de compra más rápida de México
          </p>
          <div className="space-y-2 text-lg">
            <p>✨ Productos al mayoreo</p>
            <p>⚡ Compra instantánea</p>
            <p>🚚 Envío en 24-48hrs</p>
            <p>🛡️ Compra segura</p>
          </div>
        </div>
      </div>
    </div>
  );
}
