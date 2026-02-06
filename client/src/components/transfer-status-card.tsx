import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { OrderWithDetails } from "@shared/schema";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Copy,
  AlertTriangle,
  Banknote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransferStatusCardProps {
  order: OrderWithDetails;
}

export function TransferStatusCard({ order }: TransferStatusCardProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  };

  const getStatusInfo = () => {
    switch (order.paymentStatus) {
      case "pending":
        return {
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          badge: (
            <Badge className="bg-yellow-100 text-yellow-800">
              Esperando Transferencia
            </Badge>
          ),
          title: "Datos para Transferencia",
          description: "Realiza tu transferencia con los siguientes datos:",
        };
      case "pending_verification":
        return {
          icon: <FileText className="w-5 h-5 text-blue-600" />,
          badge: (
            <Badge className="bg-blue-100 text-blue-800">
              En Verificación
            </Badge>
          ),
          title: "Comprobante Recibido",
          description: "Tu comprobante está siendo verificado. Te notificaremos pronto.",
        };
      case "verified":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
          badge: (
            <Badge className="bg-green-100 text-green-800">
              Pago Verificado
            </Badge>
          ),
          title: "¡Pago Confirmado!",
          description: "Tu transferencia ha sido verificada exitosamente.",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          badge: (
            <Badge variant="destructive">
              Pago Rechazado
            </Badge>
          ),
          title: "Transferencia Rechazada",
          description: "Hubo un problema con tu transferencia. Contacta soporte.",
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-gray-600" />,
          badge: <Badge variant="outline">Estado Desconocido</Badge>,
          title: "Estado Desconocido",
          description: "El estado del pago no está definido.",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const bankData = {
    clabe: "012180004799747847",
    bank: "BBVA México",
    holder: "MercadoBoom SA de CV",
    reference: order.orderNumber,
    amount: order.totalAmount,
  };

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.title}
          </CardTitle>
          {statusInfo.badge}
        </div>
        <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {(order.paymentStatus === "pending" || order.paymentStatus === "pending_verification") && (
          <>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Datos Bancarios BBVA
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-green-700">CLABE:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{bankData.clabe}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(bankData.clabe, "CLABE")}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-green-700">Banco:</span>
                  <span className="font-medium">{bankData.bank}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-green-700">Beneficiario:</span>
                  <span className="font-medium">{bankData.holder}</span>
                </div>
                
                <Separator className="bg-green-200" />
                
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Referencia:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-green-800">
                      {bankData.reference}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(bankData.reference, "Referencia")}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Monto a transferir:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-green-800">
                      ${parseFloat(bankData.amount).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })} MXN
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(bankData.amount, "Monto")}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Instrucciones:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Realiza la transferencia usando la CLABE interbancaria</li>
                <li>• Usa exactamente la referencia: <strong>{bankData.reference}</strong></li>
                <li>• Transfiere el monto exacto: <strong>${parseFloat(bankData.amount).toLocaleString("es-MX")} MXN</strong></li>
                <li>• Envía el comprobante por WhatsApp: <strong>+52 55 1256 2704</strong></li>
                <li>• O envía por email: <strong>ventas@mercadoboom.com</strong></li>
              </ul>
            </div>
          </>
        )}

        {order.paymentStatus === "verified" && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">✅ Pago Confirmado</h4>
            <p className="text-sm text-green-700">
              Tu transferencia ha sido verificada exitosamente. 
              Tu pedido será procesado y enviado en las próximas 24-48 horas.
            </p>
            {order.transferNotes && (
              <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-600">
                <strong>Nota del administrador:</strong> {order.transferNotes}
              </div>
            )}
          </div>
        )}

        {order.paymentStatus === "rejected" && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">❌ Transferencia Rechazada</h4>
            <p className="text-sm text-red-700">
              No pudimos verificar tu transferencia. Por favor contacta a ventas@mercadoboom.com 
              o WhatsApp +52 55 1256 2704 para resolver este problema.
            </p>
            {order.transferNotes && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-600">
                <strong>Motivo del rechazo:</strong> {order.transferNotes}
              </div>
            )}
          </div>
        )}

        {order.discountApplied && parseFloat(order.discountApplied) > 0 && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p><strong>💰 Ahorro obtenido:</strong> ${parseFloat(order.discountApplied).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })} MXN</p>
            <p>Gracias por elegir transferencia directa y evitar comisiones.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}