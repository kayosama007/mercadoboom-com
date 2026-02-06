import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OrderWithDetails } from "@shared/schema";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  FileText, 
  AlertTriangle,
  Banknote
} from "lucide-react";

export function TransferVerificationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch pending transfers
  const { data: pendingTransfers = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/admin/pending-transfers"],
  });

  const verifyTransferMutation = useMutation({
    mutationFn: async (data: { orderId: string; verified: boolean; notes?: string }) => {
      return apiRequest("POST", "/api/admin/verify-transfer", data);
    },
    onSuccess: () => {
      toast({
        title: "Verificación Completada",
        description: "El estado del pago ha sido actualizado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setDialogOpen(false);
      setSelectedOrder(null);
      setVerificationNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al verificar la transferencia",
        variant: "destructive",
      });
    },
  });

  const handleVerify = (verified: boolean) => {
    if (selectedOrder) {
      verifyTransferMutation.mutate({
        orderId: selectedOrder.id,
        verified,
        notes: verificationNotes || undefined,
      });
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string | null) => {
    switch (paymentStatus) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Esperando Transferencia
          </Badge>
        );
      case "pending_verification":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <FileText className="w-3 h-3 mr-1" />
            Por Verificar
          </Badge>
        );
      case "verified":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verificado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Estado Desconocido
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })} MXN`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Verificación de Transferencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando transferencias...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Verificación de Transferencias
          {pendingTransfers.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingTransfers.length} pendiente(s)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingTransfers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-gray-600">No hay transferencias pendientes de verificación</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTransfers.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Pedido {order.orderNumber}</h3>
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Cliente:</strong> {order.user.fullName} ({order.user.email})</p>
                        <p><strong>Producto:</strong> {order.product.name}</p>
                        <p><strong>Cantidad:</strong> {order.quantity}x</p>
                        <p><strong>Total:</strong> {formatCurrency(order.totalAmount)}</p>
                        {order.discountApplied && parseFloat(order.discountApplied) > 0 && (
                          <p><strong>Descuento aplicado:</strong> -{formatCurrency(order.discountApplied)}</p>
                        )}
                        <p><strong>Fecha del pedido:</strong> {formatDate(order.createdAt!)}</p>
                      </div>

                      {order.transferReceiptUrl && (
                        <div className="flex items-center gap-2 mt-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <a 
                            href={order.transferReceiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            Ver Comprobante
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <Dialog open={dialogOpen && selectedOrder?.id === order.id} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          data-testid={`button-verify-${order.id}`}
                        >
                          Verificar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Verificar Transferencia</DialogTitle>
                          <DialogDescription>
                            Pedido: {selectedOrder?.orderNumber}
                            <br />
                            Monto: {selectedOrder ? formatCurrency(selectedOrder.totalAmount) : ""}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {selectedOrder?.transferReceiptUrl && (
                            <div>
                              <Label>Comprobante de Pago</Label>
                              <a 
                                href={selectedOrder.transferReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline"
                              >
                                <FileText className="w-4 h-4" />
                                Ver Comprobante
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="verification-notes">Notas (opcional)</Label>
                            <Textarea
                              id="verification-notes"
                              placeholder="Agregar comentarios sobre la verificación..."
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              className="mt-1"
                              data-testid="textarea-verification-notes"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleVerify(true)}
                              disabled={verifyTransferMutation.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              data-testid="button-approve-transfer"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Aprobar
                            </Button>
                            <Button
                              onClick={() => handleVerify(false)}
                              disabled={verifyTransferMutation.isPending}
                              variant="destructive"
                              className="flex-1"
                              data-testid="button-reject-transfer"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}