import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ShoppingCart,
  Bolt,
  Clock,
  Package,
  ExternalLink,
} from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({
  product,
  open,
  onOpenChange,
}: ProductQuickViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const { addToCart, openCart, state: cartState } = useCart();
  const { toast } = useToast();

  if (!product) return null;

  // Combine main image with gallery images
  const allImages = [
    product.imageUrl,
    ...(product.images || [])
  ].filter((img): img is string => Boolean(img));

  // If no images available, use placeholder
  const hasImages = allImages.length > 0;
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ESin imagen%3C/text%3E%3C/svg%3E";
  const displayImages = hasImages ? allImages : [placeholderImage];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    setZoomLevel(1);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 1));
  };

  const handleClose = () => {
    // Don't close quick view if cart is open - user should close cart first
    if (cartState.isOpen) {
      return;
    }
    onOpenChange(false);
    setCurrentImageIndex(0);
    setZoomLevel(1);
  };

  const handleBuyNow = () => {
    setShowCheckout(true);
    // Close the quick view dialog to prevent nested dialog issues  
    onOpenChange(false);
    setCurrentImageIndex(0);
    setZoomLevel(1);
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
    toast({
      title: "Producto agregado",
      description: `${product.name} se agregó a tu carrito`,
    });
    openCart();
  };

  const isAffiliate = product.isAffiliate || product.isImported;
  const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0" data-testid="dialog-product-quickview">
          <div className="sticky top-0 bg-background z-10 px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <DialogTitle className="text-2xl font-bold pr-8" data-testid="text-product-name">
                  {product.name}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="absolute right-4 top-4"
                  data-testid="button-close-quickview"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Galería de Imágenes con Zoom */}
            <div className="space-y-4">
              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden aspect-square">
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden cursor-move"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transition: "transform 0.2s ease",
                  }}
                  data-testid="image-main"
                >
                  <img
                    src={displayImages[currentImageIndex]}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Controles de Navegación */}
                {hasImages && displayImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                      onClick={prevImage}
                      data-testid="button-prev-image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                      onClick={nextImage}
                      data-testid="button-next-image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Controles de Zoom */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full shadow-lg"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    data-testid="button-zoom-out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full shadow-lg"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    data-testid="button-zoom-in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {/* Indicador de Imagen */}
                {hasImages && displayImages.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm" data-testid="text-image-counter">
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                )}
              </div>

              {/* Miniaturas */}
              {hasImages && displayImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {displayImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setZoomLevel(1);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                      }`}
                      data-testid={`button-thumbnail-${index}`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Información del Producto */}
            <div className="space-y-6">
              {/* Precio y Badges */}
              <div className="space-y-3">
                <div className="text-4xl font-bold text-primary" data-testid="text-product-price">
                  ${Number(product.price).toLocaleString("es-MX")}
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.promotionType === "BOOM" && (
                    <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600" data-testid="badge-boom">
                      <Bolt className="w-3 h-3 mr-1" />
                      BOOM
                    </Badge>
                  )}
                  {product.promotionType === "OFERTA" && (
                    <Badge variant="destructive" data-testid="badge-oferta">OFERTA</Badge>
                  )}
                  {product.promotionType === "RELAMPAGO" && (
                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600" data-testid="badge-relampago">
                      <Bolt className="w-3 h-3 mr-1" />
                      RELÁMPAGO
                    </Badge>
                  )}
                  {product.promotionType === "NUEVO" && (
                    <Badge variant="secondary" data-testid="badge-nuevo">NUEVO</Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800" data-testid="badge-agotado">
                      AGOTADO
                    </Badge>
                  )}
                  {product.isImported && (
                    <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400" data-testid="badge-importacion">
                      <Package className="w-3 h-3 mr-1" />
                      IMPORTACIÓN
                    </Badge>
                  )}
                  {product.isAffiliate && (
                    <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400" data-testid="badge-externo">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      EXTERNO
                    </Badge>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Descripción</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-product-description">
                  {product.description}
                </p>
              </div>

              {/* Información de Importación */}
              {product.isImported && product.importDeliveryDays && (
                <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          Producto de Importación
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Entrega estimada: {product.importDeliveryDays} días hábiles
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Información de Afiliado */}
              {product.isAffiliate && product.affiliateUrl && (
                <Card className="border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <ExternalLink className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-purple-900 dark:text-purple-100">
                          Producto Externo
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Serás redirigido al sitio del vendedor
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stock */}
              {product.stock !== undefined && product.stock !== null && product.stock > 0 && (
                <div className="text-sm text-muted-foreground" data-testid="text-stock">
                  Stock disponible: <span className="font-semibold text-foreground">{product.stock}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="space-y-3 pt-4">
                {isAffiliate && product.affiliateUrl ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => product.affiliateUrl && window.open(product.affiliateUrl, "_blank")}
                    data-testid="button-affiliate-link"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Comprar en Sitio Externo
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    data-testid="button-buy-now"
                  >
                    <Bolt className="w-4 h-4 mr-2" />
                    {isOutOfStock ? "Agotado" : "Comprar Ahora"}
                  </Button>
                )}

                {!isAffiliate && (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    data-testid="button-add-cart"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Agregar al Carrito
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      {showCheckout && (
        <CheckoutDialog
          product={product}
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
