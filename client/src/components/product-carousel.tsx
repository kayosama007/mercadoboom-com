import { useQuery } from "@tanstack/react-query";
import ProductCard from "./product-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";
import { Package } from "lucide-react";

interface ProductCarouselProps {
  categoryId?: string | null;
}

export default function ProductCarousel({ categoryId }: ProductCarouselProps) {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: categoryId ? ["/api/products", "category", categoryId] : ["/api/products", "featured"],
    queryFn: async () => {
      const url = categoryId 
        ? `/api/products?category=${categoryId}` 
        : '/api/products?featured=true';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay productos disponibles
          </h3>
          <p className="text-gray-500">
            {categoryId ? "No se encontraron productos en esta categoría" : "No hay productos destacados"}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
