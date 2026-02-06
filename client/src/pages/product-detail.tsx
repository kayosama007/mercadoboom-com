import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { ArrowLeft, ShoppingCart, Bolt, Clock, Package, ExternalLink } from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductDetailPage() {
  const [, params] = useRoute("/producto/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", params?.id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${params?.id}`);
      if (!response.ok) throw new Error("Producto no encontrado");
      return response.json();
    },
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
          <Button onClick={() => setLocation("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean);

  const handleBuyClick = () => {
    if (product.isAffiliate && product.affiliateUrl) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: "Redirigiendo...",
        description: `Te hemos enviado a ${product.affiliateStore || 'la tienda externa'}`,
      });
      return;
    }

    if (!user) {
      toast({
        title: "Inicia Sesión",
        description: "Debes iniciar sesión para realizar una compra",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    setShowCheckout(true);
  };

  const handleAddToCart = () => {
    if (product.isAffiliate && product.affiliateUrl) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: "Redirigiendo...",
        description: `Te hemos enviado a ${product.affiliateStore || 'la tienda externa'}`,
      });
      return;
    }

    addToCart(product, 1);
    toast({
      title: "¡Producto agregado!",
      description: `${product.name} se agregó al carrito`,
    });
  };

  const formatPrice = (price: string | number) => {
    return `$${Number(price).toLocaleString()}`;
  };

  const getStatusBadge = () => {
    if (!product.stock && !product.isAffiliate) {
      return <Badge className="bg-gray-500 text-white">AGOTADO</Badge>;
    } else if (product.isAffiliate) {
      return <Badge className="bg-blue-600 text-white">EXTERNO</Badge>;
    } else if (product.isImported) {
      return <Badge className="bg-amber-600 text-white">IMPORTACIÓN</Badge>;
    } else if (product.promotionType) {
      const promotionConfig = {
        BOOM: { text: "Promoción BOOM", className: "bg-boom-red text-white" },
        OFERTA: { text: "En Oferta", className: "bg-orange-500 text-white" },
        RELAMPAGO: { text: "Promoción Relámpago", className: "bg-purple-600 text-white" },
        NUEVO: { text: "Nuevo", className: "bg-green-600 text-white" },
      };
      const config = promotionConfig[product.promotionType as keyof typeof promotionConfig];
      if (config) {
        return <Badge className={config.className}>{config.text}</Badge>;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <img
                src={images[selectedImage] || "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-96 object-cover"
                data-testid="img-product-main"
              />
            </Card>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <Card
                    key={index}
                    className={`overflow-hidden cursor-pointer transition-all ${
                      selectedImage === index ? 'ring-2 ring-boom-red' : 'opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedImage(index)}
                    data-testid={`img-thumbnail-${index}`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - imagen ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {getStatusBadge()}
                {product.promotionType === 'BOOM' && (
                  <div className="flex items-center text-boom-red">
                    <Bolt className="w-4 h-4 mr-1" />
                    <span className="text-sm font-bold">BOOM DEAL</span>
                  </div>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-product-name">
                {product.name}
              </h1>
              
              <p className="text-4xl font-bold text-green-600 mb-4" data-testid="text-product-price">
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Import Information */}
            {product.isImported && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Producto de Importación</span>
                  </div>
                  <p className="text-sm text-amber-600">
                    {product.importDescription || "Este producto se importa especialmente para ti"}
                  </p>
                  <p className="text-sm text-amber-700 font-medium mt-2">
                    Entrega estimada: {product.importDeliveryDays || 15} días hábiles
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Affiliate Information */}
            {product.isAffiliate && product.affiliateStore && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-medium">Producto Externo</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    Disponible en: {product.affiliateStore}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h2>
              <p className="text-gray-600 leading-relaxed" data-testid="text-product-description">
                {product.description}
              </p>
            </div>

            {/* Stock Status */}
            {!product.isAffiliate && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Disponibilidad</h3>
                <p className={`text-sm font-medium ${product.stock ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock ? '✓ En stock' : '✗ Agotado'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleBuyClick}
                disabled={!product.stock && !product.isAffiliate}
                className="w-full bg-boom-red hover:bg-red-700 text-white py-6 text-lg"
                data-testid="button-buy-now"
              >
                {product.isAffiliate ? (
                  <>
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Comprar en {product.affiliateStore}
                  </>
                ) : (
                  <>Comprar Ahora</>
                )}
              </Button>
              
              {!product.isAffiliate && product.stock && (
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="w-full py-6 text-lg"
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Agregar al Carrito
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Checkout Dialog */}
      {showCheckout && (
        <CheckoutDialog
          product={product}
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
