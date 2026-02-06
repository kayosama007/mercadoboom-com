import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Percent, Save, DollarSign, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TransferDiscountConfig {
  id: string;
  discountPercentage: string;
  discountText: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export default function AdminTransferDiscountPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [discountText, setDiscountText] = useState<string>("");

  const { data: config, isLoading } = useQuery<TransferDiscountConfig>({
    queryKey: ["/api/admin/transfer-discount-config"],
  });

  // Update form when data is loaded
  useEffect(() => {
    if (config?.discountPercentage) {
      setDiscountPercentage(config.discountPercentage);
    }
    if (config?.discountText) {
      setDiscountText(config.discountText);
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: async (data: { discountPercentage: string; discountText: string; isActive: boolean }) => {
      await apiRequest("PUT", "/api/admin/transfer-discount-config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-discount-config"] });
      toast({
        title: "Configuración Actualizada",
        description: "El porcentaje de descuento ha sido actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const percentage = parseFloat(discountPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: "Error de Validación",
        description: "El porcentaje debe ser un número entre 0 y 100.",
        variant: "destructive",
      });
      return;
    }

    if (!discountText.trim()) {
      toast({
        title: "Error de Validación",
        description: "El texto del descuento no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      discountPercentage: percentage.toFixed(2),
      discountText: discountText.trim(),
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const currentDiscount = config ? parseFloat(config.discountPercentage) : 3.5;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingDown className="h-8 w-8 text-boom-red" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configuración de Descuento por Transferencia
          </h1>
          <p className="text-gray-600">
            Administra el porcentaje de descuento aplicado a pagos por transferencia directa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuración Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Descuento Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              <div className="text-4xl font-bold text-boom-red mb-2">
                {currentDiscount}%
              </div>
              <p className="text-gray-600">
                {currentDiscount > 0 
                  ? `Descuento del ${currentDiscount}% ${config?.discountText || "por evitar comisiones"}`
                  : (config?.discountText || "por evitar comisiones")
                }
              </p>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Ejemplo:</strong> En una compra de $1,000 MXN, el cliente ahorra $
                  {(1000 * currentDiscount / 100).toFixed(2)} MXN
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Actualización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Actualizar Descuento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="discountPercentage">
                  Nuevo Porcentaje de Descuento (%)
                </Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="Ej: 3.50"
                  className="mt-1"
                  data-testid="input-discount-percentage"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Rango válido: 0% - 100%
                </p>
              </div>
              
              <div>
                <Label htmlFor="discountText">
                  Texto del Descuento
                </Label>
                <Input
                  id="discountText"
                  type="text"
                  value={discountText}
                  onChange={(e) => setDiscountText(e.target.value)}
                  placeholder="por evitar comisiones"
                  className="mt-1"
                  data-testid="input-discount-text"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Si hay descuento: "Descuento del 3.5% {discountText}". Si es 0%: solo "{discountText}"
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Vista Previa del Descuento:</h4>
                {discountPercentage && !isNaN(parseFloat(discountPercentage)) ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Compra de $1,000:</span>
                      <span className="text-green-600">-${(1000 * parseFloat(discountPercentage) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compra de $5,000:</span>
                      <span className="text-green-600">-${(5000 * parseFloat(discountPercentage) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compra de $10,000:</span>
                      <span className="text-green-600">-${(10000 * parseFloat(discountPercentage) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Ingresa un porcentaje válido para ver la vista previa</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-boom-red hover:bg-boom-red/90"
                disabled={updateMutation.isPending || !discountPercentage}
                data-testid="button-save-discount"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información Sobre el Descuento por Transferencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Por qué ofrecer descuento?</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Evitas comisiones de MercadoPago (±3.5%)</li>
                <li>• Recibes el pago directo en tu cuenta BBVA</li>
                <li>• Flujo de efectivo más rápido</li>
                <li>• Menor dependencia de plataformas externas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Consideraciones:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Requiere verificación manual de transferencias</li>
                <li>• Tiempo de procesamiento: 24-48 hrs</li>
                <li>• Mayor trabajo administrativo</li>
                <li>• Adecuado para pedidos de mayor valor</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}