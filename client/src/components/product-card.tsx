import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { Bolt, Star, ShoppingCart, Plus, Clock, Eye } from "lucide-react";
import { CheckoutDialog } from "./checkout-dialog";
import { ProductQuickView } from "./product-quick-view";
import { useCart } from "@/hooks/use-cart";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const { addToCart, openCart } = useCart();

  const handleBuyClick = () => {
    // Handle affiliate products - open external link in new tab
    if (product.isAffiliate && product.affiliateUrl) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: "Redirigiendo...",
        description: `Te hemos enviado a ${product.affiliateStore || 'la tienda externa'}`,
      });
      return;
    }

    // Handle internal products - require login
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
    // Handle affiliate products - can't add to cart
    if (product.isAffiliate && product.affiliateUrl) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: "Redirigiendo...",
        description: `Te hemos enviado a ${product.affiliateStore || 'la tienda externa'}`,
      });
      return;
    }

    // Add to cart for internal products
    addToCart(product, 1);
    toast({
      title: "¡Producto agregado!",
      description: `${product.name} se agregó al carrito`,
    });
  };

  const getStatusBadges = () => {
    const badges = [];

    // Priority: AGOTADO > EXTERNO > IMPORTACION > Promociones
    if (!product.stock && !product.isAffiliate) {
      badges.push(
        <Badge key="agotado" className="bg-gray-500 text-white text-xs font-bold">
          AGOTADO
        </Badge>
      );
    } else if (product.isAffiliate) {
      badges.push(
        <Badge key="externo" className="bg-blue-600 text-white text-xs font-bold">
          EXTERNO
        </Badge>
      );
    } else if (product.isImported) {
      badges.push(
        <Badge key="importado" className="bg-amber-600 text-white text-xs font-bold" data-testid="badge-import">
          IMPORTACIÓN
        </Badge>
      );
    } else if (product.promotionType) {
      const promotionConfig = {
        BOOM: { text: "Promoción BOOM", className: "bg-boom-red text-white" },
        OFERTA: { text: "En Oferta", className: "bg-orange-500 text-white" },
        RELAMPAGO: { text: "Promoción Relámpago", className: "bg-purple-600 text-white" },
        NUEVO: { text: "Nuevo", className: "bg-green-600 text-white" },
      };

      const config = promotionConfig[product.promotionType as keyof typeof promotionConfig];
      if (config) {
        badges.push(
          <Badge key="promotion" className={`${config.className} text-xs font-bold`}>
            {config.text}
          </Badge>
        );
      }
    }

    return badges.length > 0 ? (
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {badges}
      </div>
    ) : null;
  };

  const formatPrice = (price: string | number) => {
    return `$${Number(price).toLocaleString()}`;
  };

  // Get first available image from gallery
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ESin imagen%3C/text%3E%3C/svg%3E";
  const displayImage = product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : null) || placeholderImage;

  return (
    <>
      <Card className="product-card-hover bg-white rounded-xl shadow-lg overflow-hidden relative h-full flex flex-col" data-testid={`card-product-${product.id}`}>
        {getStatusBadges()}
        
        <div 
          className="cursor-pointer relative group"
          onClick={() => setShowQuickView(true)}
          data-testid={`link-product-detail-${product.id}`}
        >
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-40 sm:h-48 object-cover transition-transform group-hover:scale-105"
            data-testid={`img-product-${product.id}`}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
              <Eye className="w-5 h-5 text-boom-red" />
            </div>
          </div>
        </div>
        
        <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          
          <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 flex-1" data-testid={`text-product-description-${product.id}`}>
            {product.description}
          </p>
          
          {/* Información de productos de importación */}
          {product.isImported && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3" data-testid="info-import">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium" data-testid="text-import-description">
                  {product.importDescription || "Producto de importación"}
                </span>
              </div>
              <div className="text-xs text-amber-600 mt-1" data-testid="text-import-days">
                Entrega estimada: {product.importDeliveryDays || 15} días hábiles
              </div>
            </div>
          )}
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-lg sm:text-xl font-bold text-green-600" data-testid={`text-product-price-${product.id}`}>
                {formatPrice(product.price)}
              </div>
              
              {product.promotionType === 'BOOM' && (
                <div className="flex items-center text-boom-red">
                  <Bolt className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="text-xs font-bold">BOOM</span>
                </div>
              )}
            </div>
            
            {product.isAffiliate ? (
              <Button
                onClick={handleBuyClick}
                className="w-full bg-boom-red hover:bg-red-700 text-white py-2 px-4 text-sm sm:text-base"
                data-testid={`button-buy-${product.id}`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ver en Tienda Externa
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.stock}
                  variant="outline"
                  className="w-full border-boom-red text-boom-red hover:bg-boom-red hover:text-white py-2 px-4 text-sm sm:text-base"
                  data-testid={`button-add-cart-${product.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {!product.stock ? "Agotado" : "Agregar al Carrito"}
                </Button>
                
                <Button
                  onClick={handleBuyClick}
                  disabled={!product.stock}
                  className="w-full bg-boom-red hover:bg-red-700 text-white py-2 px-4 text-sm sm:text-base"
                  data-testid={`button-buy-${product.id}`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {!product.stock ? "Agotado" : "Comprar Ahora"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Only show checkout dialog for internal products */}
      {!product.isAffiliate && (
        <CheckoutDialog
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          product={product}
        />
      )}

      {/* Product Quick View Modal */}
      <ProductQuickView
        product={product}
        open={showQuickView}
        onOpenChange={setShowQuickView}
      />
    </>
  );
}