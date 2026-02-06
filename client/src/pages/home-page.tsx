import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductCarousel from "@/components/product-carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Category, Banner, SpecialOffer } from "@shared/schema";
import { Bolt, Shield, Truck, ExternalLink, ArrowRight } from "lucide-react";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
  });

  const { data: specialOffers = [] } = useQuery<SpecialOffer[]>({
    queryKey: ["/api/special-offers"],
  });

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Auto-rotate special offers every 4 seconds
  useEffect(() => {
    if (specialOffers.length > 1) {
      const interval = setInterval(() => {
        setCurrentOfferIndex((prev) => (prev + 1) % specialOffers.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [specialOffers.length]);

  // Filter active banners and sort by display order
  const activeBanners = banners
    .filter(banner => banner.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Filter active special offers and sort by display order
  const activeOffers = specialOffers
    .filter(offer => offer.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const currentBanner = activeBanners[currentBannerIndex];
  const currentOffer = activeOffers[currentOfferIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Dynamic Hero Section with Banners */}
      {currentBanner ? (
        <section 
          className="relative text-white py-8 md:py-12 min-h-[400px] flex items-center overflow-hidden"
          style={{
            background: currentBanner.isTransparent 
              ? 'transparent' 
              : (currentBanner.backgroundColor || 'linear-gradient(to right, #ff4444, #ff6666)'),
            color: currentBanner.textColor || '#ffffff'
          }}
        >
          {/* Background Image */}
          {currentBanner.imageUrl && (
            <div 
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${
                currentBanner.isTransparent ? 'opacity-100' : 'opacity-20'
              }`}
              style={{ backgroundImage: `url(${currentBanner.imageUrl})` }}
            />
          )}
          
          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4">
              {currentBanner.title}
            </h1>
            {currentBanner.subtitle && (
              <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 px-2">
                {currentBanner.subtitle}
              </p>
            )}
            {!user && (
              <p className="text-sm sm:text-base md:text-lg mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto">
                🎯 <strong>Explora nuestros productos</strong> y encuentra las mejores ofertas.<br className="hidden sm:block" />
                <span className="block sm:inline"> Cuando encuentres algo que te guste, ¡haz clic en "Comprar Ahora" para registrarte y completar tu compra!</span>
              </p>
            )}
            {currentBanner.buttonText && currentBanner.buttonLink && (
              <Button
                onClick={() => {
                  if (currentBanner.buttonLink?.startsWith('http')) {
                    window.open(currentBanner.buttonLink, '_blank');
                  } else {
                    setLocation(currentBanner.buttonLink || '/');
                  }
                }}
                className={`font-bold px-6 py-3 text-lg ${
                  currentBanner.isTransparent 
                    ? 'bg-black/70 text-white hover:bg-black/80 backdrop-blur-sm border border-white/20' 
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
                data-testid="button-banner-action"
              >
                {currentBanner.buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
            
            {/* Banner indicators */}
            {activeBanners.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {activeBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentBannerIndex 
                        ? 'bg-white' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        // Fallback hero section when no banners are available
        <section className="bg-gradient-to-r from-boom-red to-boom-light-red text-white py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4">¡COMPRA BOOM!</h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 px-2">
              Los mejores productos electrónicos al mayoreo. ¡Compra rápido y seguro!
            </p>
            {!user && (
              <p className="text-sm sm:text-base md:text-lg mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto">
                🎯 <strong>Explora nuestros productos</strong> y encuentra las mejores ofertas.<br className="hidden sm:block" />
                <span className="block sm:inline"> Cuando encuentres algo que te guste, ¡haz clic en "Comprar Ahora" para registrarte y completar tu compra!</span>
              </p>
            )}
            <div className="boom-explosion w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center">
              <span className="text-black font-black text-sm sm:text-base md:text-lg">BOOM!</span>
            </div>
          </div>
        </section>
      )}

      {/* Product Categories */}
      <section className="py-6 md:py-8 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-2 sm:space-x-3 md:space-x-4 pb-4 scrollbar-hide">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-full text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap ${
                selectedCategory === null 
                  ? "bg-boom-yellow text-black hover:bg-boom-yellow/90" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <span className="hidden sm:inline">Todos los productos</span>
              <span className="sm:hidden">Todos</span>
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                title={category.name}
                className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-full text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? "bg-boom-yellow text-black hover:bg-boom-yellow/90" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <span className="mr-1">{category.emoji}</span>
                <span className="hidden sm:inline">{category.name}</span>
                <span className="sm:hidden inline-block w-[12ch] truncate align-bottom">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>



      {/* Product Carousel */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {selectedCategory ? 'Productos de la Categoría' : 'Productos Destacados'}
            </h2>
          </div>
          <ProductCarousel categoryId={selectedCategory} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="bg-boom-yellow w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bolt className="text-2xl text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Compra Instantánea</h3>
                <p className="text-gray-600">Sin carrito, sin esperas. Compra directamente con un clic.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="bg-boom-red w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Compra Segura</h3>
                <p className="text-gray-600">Pagos protegidos y garantía en todos los productos.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="bg-boom-yellow w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="text-2xl text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Envío Rápido</h3>
                <p className="text-gray-600">Envíos a toda la República desde CDMX en 24-48hrs.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
