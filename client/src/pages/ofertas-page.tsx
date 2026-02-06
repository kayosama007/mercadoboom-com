import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Tag, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product, SpecialOffer } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import ProductCard from "@/components/product-card";

export default function OfertasPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: specialOffers = [], isLoading: offersLoading } = useQuery<SpecialOffer[]>({
    queryKey: ["/api/special-offers"],
  });

  const activeOffers = specialOffers.filter((offer) => offer.isActive);
  const featuredProducts = products.filter((product) => 
    product.promotionType === "OFERTA" || product.promotionType === "BOOM"
  );

  if (productsLoading || offersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boom-red mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ofertas especiales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver al inicio</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ofertas Especiales</h1>
                <p className="text-gray-600">Los mejores descuentos y promociones</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-boom-red" />
              <span className="text-boom-red font-semibold">
                {activeOffers.length + featuredProducts.length} ofertas activas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de ofertas especiales */}
      <div className="bg-gradient-to-r from-boom-red to-boom-light-red text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">¡OFERTAS BOOM!</h2>
          <p className="text-lg md:text-xl mb-6">
            Descuentos increíbles por tiempo limitado
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm md:text-base">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Ofertas limitadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Productos de calidad</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ofertas especiales destacadas */}
        {activeOffers.length > 0 && (
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Tag className="h-6 w-6 mr-2 text-boom-red" />
              Ofertas Especiales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="destructive" className="bg-boom-red">
                        {offer.discountPercentage ? `${offer.discountPercentage}% OFF` : 'OFERTA ESPECIAL'}
                      </Badge>
                      <Badge variant="outline" className="border-boom-red text-boom-red">
                        {offer.offerType || 'BOOM'}
                      </Badge>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{offer.title}</h4>
                    <p className="text-gray-600 mb-4">{offer.description}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      {offer.originalPrice && offer.offerPrice && (
                        <div className="flex items-center space-x-2">
                          <span className="line-through text-gray-400">${offer.originalPrice}</span>
                          <span className="font-bold text-boom-red">${offer.offerPrice}</span>
                        </div>
                      )}
                      {offer.endDate && (
                        <p>Válido hasta: {new Date(offer.endDate).toLocaleDateString('es-MX')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Productos en oferta */}
        {featuredProducts.length > 0 && (
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Productos en Oferta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </section>
        )}

        {/* Mensaje cuando no hay ofertas */}
        {activeOffers.length === 0 && featuredProducts.length === 0 && (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay ofertas especiales activas
            </h3>
            <p className="text-gray-600 mb-6">
              Vuelve pronto para ver nuestras próximas promociones
            </p>
            <Link href="/">
              <Button className="bg-boom-red hover:bg-boom-light-red">
                Ver todos los productos
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}