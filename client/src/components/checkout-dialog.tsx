import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product, Address } from "@shared/schema";
import type { CartItem } from "@/hooks/use-cart";
import { CreditCard, MapPin, Package, Truck, Banknote, AlertCircle, CheckCircle2 } from "lucide-react";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  initialQuantity?: number;
  cartItems?: CartItem[];
  onSuccess?: () => void;
}

export function CheckoutDialog({
  isOpen,
  onClose,
  product,
  initialQuantity = 1,
  cartItems = [],
  onSuccess,
}: CheckoutDialogProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "direct_transfer">("mercadopago");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user addresses
  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: isOpen,
  });

  // Fetch transfer discount configuration
  const { data: transferDiscountConfig } = useQuery<{
    discountPercentage: string;
    isActive: boolean;
  }>({
    queryKey: ["/api/admin/transfer-discount-config"],
    enabled: isOpen,
    retry: false,
  });

  // Fetch payment config (includes active payment methods)
  const { data: paymentConfig } = useQuery<{
    publicKey: string;
    env: string;
    activePaymentMethods: {
      mercadopago: boolean;
      bank_transfer: boolean;
      conekta: boolean;
    };
  }>({
    queryKey: ["/api/payments/config"],
    enabled: isOpen,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      quantity: number;
      shippingAddressId?: string;
      paymentType: "mercadopago" | "direct_transfer";
    }) => {
      if (data.paymentType === "direct_transfer") {
        return apiRequest("POST", "/api/payments/create-direct-transfer", data);
      } else {
        return apiRequest("POST", "/api/payments/create-preference", data);
      }
    },
    onSuccess: (data: any) => {
      if (paymentMethod === "direct_transfer") {
        toast({
          title: "¡Orden Creada!",
          description: "Tu orden ha sido creada. Revisa los datos de transferencia.",
        });
        onClose();
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      } else if (data.initPoint) {
        // Redirect to MercadoPago checkout
        window.location.href = data.initPoint;
      } else {
        toast({
          title: "Error",
          description: "No se pudo inicializar el pago. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error de Pago",
        description: error.message || "Error al procesar el pago",
        variant: "destructive",
      });
    },
  });

  // Determine if we're working with cart items or a single product
  const isCartCheckout = cartItems.length > 0;
  const currentProduct = isCartCheckout ? cartItems[0]?.product : product;
  
  // Add safety check for product
  if (!currentProduct) {
    return null;
  }

  const handleCheckout = () => {
    if (addresses.length > 0 && !selectedAddressId) {
      toast({
        title: "Dirección Requerida",
        description: "Por favor selecciona una dirección de envío.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "direct_transfer") {
      createPaymentMutation.mutate({
        productId: currentProduct.id,
        quantity: isCartCheckout ? cartItems.reduce((total, item) => total + item.quantity, 0) : quantity,
        shippingAddressId: selectedAddressId || undefined,
        paymentType: paymentMethod,
        originalAmount: basePrice.toString(),
        discountApplied: discountAmount.toString(),
      } as any);
    } else {
      createPaymentMutation.mutate({
        productId: currentProduct.id,
        quantity: isCartCheckout ? cartItems.reduce((total, item) => total + item.quantity, 0) : quantity,
        shippingAddressId: selectedAddressId || undefined,
        paymentType: paymentMethod,
      });
    }
  };

  // Calculate totals based on cart or single product
  const basePrice = isCartCheckout 
    ? cartItems.reduce((total, item) => total + (parseFloat(item.product.price || "0") * item.quantity), 0)
    : parseFloat(currentProduct.price || "0") * quantity;
    
  // Check which payment methods are active based on payment configuration
  const isMercadopagoActive = paymentConfig?.activePaymentMethods?.mercadopago === true;
  const isTransferActive = paymentConfig?.activePaymentMethods?.bank_transfer === true;
  
  // Use dynamic transfer discount configuration
  const transferDiscountPercent = transferDiscountConfig?.isActive 
    ? parseFloat(transferDiscountConfig.discountPercentage)
    : 3.50; // fallback to default
  const allowTransferDiscount = transferDiscountConfig?.isActive !== false && isTransferActive;
  
  // Update default payment method based on what's available
  useEffect(() => {
    if (paymentConfig?.activePaymentMethods) {
      const getDefaultPaymentMethod = () => {
        if (isMercadopagoActive) return "mercadopago";
        if (isTransferActive) return "direct_transfer";
        return "mercadopago"; // fallback
      };
      const defaultMethod = getDefaultPaymentMethod();
      setPaymentMethod(defaultMethod);
    }
  }, [paymentConfig, isMercadopagoActive, isTransferActive]);
  
  // Calculate discount and final prices
  const discountAmount = paymentMethod === "direct_transfer" && allowTransferDiscount 
    ? (basePrice * transferDiscountPercent) / 100 
    : 0;
  const discountedPrice = basePrice - discountAmount;
  const shippingCost = 99; // Fixed shipping cost
  const total = discountedPrice + shippingCost;
  const originalTotal = basePrice + shippingCost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="checkout-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Finalizar Compra
          </DialogTitle>
          <DialogDescription>
            Completa tu pedido {isCartCheckout ? `de ${cartItems.length} producto(s)` : `para ${currentProduct.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {isCartCheckout ? "Productos del Carrito" : "Producto"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCartCheckout ? (
                  // Show cart items
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="flex items-start gap-3">
                        {item.product.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            ${parseFloat(item.product.price).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })} MXN × {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show single product
                  <div className="flex items-start gap-3">
                    {currentProduct.imageUrl && (
                      <img
                        src={currentProduct.imageUrl}
                        alt={currentProduct.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{currentProduct.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${parseFloat(currentProduct.price).toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })} MXN
                      </p>
                    </div>
                  </div>
                )}

                {!isCartCheckout && (
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        data-testid="button-decrease-quantity"
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                        min="1"
                        data-testid="input-quantity"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        data-testid="button-increase-quantity"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {addresses.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dirección de Envío
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedAddressId}
                    onValueChange={setSelectedAddressId}
                  >
                    <SelectTrigger data-testid="select-address">
                      <SelectValue placeholder="Selecciona una dirección" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((address: Address) => (
                        <SelectItem key={address.id} value={address.id}>
                          {address.street}, {address.city}, {address.state} {address.postalCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Payment Method Selection */}
            {(isMercadopagoActive || allowTransferDiscount) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Método de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as "mercadopago" | "direct_transfer")}
                    className="space-y-3"
                  >
                    {/* MercadoPago Option - Only show if active */}
                    {isMercadopagoActive && (
                      <div className="flex items-center space-x-3 border rounded-lg p-3">
                        <RadioGroupItem value="mercadopago" id="mercadopago" />
                        <div className="flex-1">
                          <label htmlFor="mercadopago" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-5 w-5" />
                              <span className="font-medium">MercadoPago</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Tarjetas, OXXO, transferencia
                            </p>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {/* Transfer Option - Only show if active */}
                    {allowTransferDiscount && (
                      <div className="flex items-center space-x-3 border rounded-lg p-3 bg-green-50 border-green-200">
                        <RadioGroupItem value="direct_transfer" id="direct_transfer" />
                        <div className="flex-1">
                          <label htmlFor="direct_transfer" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-5 w-5 text-green-600" />
                              <span className="font-medium">Transferencia Directa</span>
                              {discountAmount > 0 && (
                                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                  ¡Ahorra ${discountAmount.toLocaleString("es-MX", {
                                    minimumFractionDigits: 2,
                                  })} MXN!
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-green-700">
                              {transferDiscountPercent > 0 
                                ? `Descuento del ${transferDiscountPercent}% ${transferDiscountConfig?.discountText || "por evitar comisiones"}`
                                : (transferDiscountConfig?.discountText || "por evitar comisiones")
                              }
                            </p>
                          </label>
                        </div>
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({quantity}x)</span>
                  <span>${basePrice.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })} MXN</span>
                </div>

                {paymentMethod === "direct_transfer" && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {transferDiscountPercent > 0 
                        ? `Descuento por transferencia (${transferDiscountPercent}%) - ${transferDiscountConfig?.discountText || "por evitar comisiones"}`
                        : (transferDiscountConfig?.discountText || "por evitar comisiones")
                      }
                    </span>
                    <span>-${discountAmount.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })} MXN</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Envío
                  </span>
                  <span>${shippingCost.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })} MXN</span>
                </div>

                <Separator />

                {paymentMethod === "direct_transfer" && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-gray-500 line-through">
                    <span>Total sin descuento</span>
                    <span>${originalTotal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })} MXN</span>
                  </div>
                )}

                <div className="flex justify-between font-medium">
                  <span>Total a Pagar</span>
                  <span className={`text-lg ${paymentMethod === "direct_transfer" && discountAmount > 0 ? "text-green-600" : ""}`}>
                    ${total.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })} MXN
                  </span>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handleCheckout}
                    disabled={createPaymentMutation.isPending}
                    className={`w-full ${
                      paymentMethod === "direct_transfer" 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    data-testid="button-checkout"
                  >
                    {createPaymentMutation.isPending ? (
                      "Procesando..."
                    ) : paymentMethod === "direct_transfer" ? (
                      "Procesar con Transferencia Directa"
                    ) : (
                      "Pagar con MercadoPago"
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    {paymentMethod === "direct_transfer" ? (
                      "Recibirás los datos bancarios para realizar la transferencia"
                    ) : (
                      "Serás redirigido a MercadoPago para completar tu pago de forma segura"
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Info */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">
                  {paymentMethod === "direct_transfer" ? (
                    <>
                      <p className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Transferencia Directa:
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li>• Recibirás los datos bancarios por email</li>
                        <li>• Tienes 24 horas para realizar la transferencia</li>
                        <li>• Envía comprobante para agilizar el proceso</li>
                        <li>• Tu pedido se enviará una vez confirmado el pago</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="font-medium mb-2">Métodos de pago MercadoPago:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Tarjetas de crédito y débito</li>
                        <li>• OXXO y tiendas de conveniencia</li>
                        <li>• Transferencias bancarias</li>
                        <li>• Meses sin intereses disponibles</li>
                      </ul>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}