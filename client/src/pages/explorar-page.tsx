import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Search, Filter, Grid, List, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product, Category } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import ProductCard from "@/components/product-card";

export default function ExplorarPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const activeCategories = categories.filter((cat) => cat.isActive);

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
        return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      case "featured":
      default:
        // Mostrar productos con promoción primero
        const aHasPromo = a.promotionType !== null;
        const bHasPromo = b.promotionType !== null;
        if (aHasPromo && !bHasPromo) return -1;
        if (!aHasPromo && bHasPromo) return 1;
        return 0;
    }
  });

  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boom-red mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <h1 className="text-2xl font-bold text-gray-900">Explorar Productos</h1>
                <p className="text-gray-600">Descubre todo nuestro catálogo</p>
              </div>
            </div>
            <Badge variant="outline" className="border-boom-red text-boom-red">
              {sortedProducts.length} productos encontrados
            </Badge>
          </div>
        </div>
      </div>

      {/* Banner de exploración */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Explora Nuestro Catálogo</h2>
          <p className="text-lg">Encuentra exactamente lo que necesitas</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de filtros y búsqueda */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-products"
                />
              </div>

              {/* Categoría */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {activeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.emoji} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Ordenar por */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Destacados</SelectItem>
                  <SelectItem value="newest">Más nuevos</SelectItem>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                  <SelectItem value="price-low">Precio menor</SelectItem>
                  <SelectItem value="price-high">Precio mayor</SelectItem>
                </SelectContent>
              </Select>

              {/* Vista */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="flex-1"
                  data-testid="button-view-grid"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Cuadrícula
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex-1"
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorías destacadas */}
        {activeCategories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="bg-boom-red hover:bg-boom-light-red"
                data-testid="button-category-all"
              >
                Todas
              </Button>
              {activeCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`button-category-${category.name.toLowerCase()}`}
                >
                  {category.emoji} {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Productos */}
        {sortedProducts.length > 0 ? (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta ajustar tus filtros de búsqueda
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSortBy("featured");
              }}
              className="bg-boom-red hover:bg-boom-light-red"
              data-testid="button-clear-filters"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}