import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoPath from "@assets/LOGO_1754893994411.gif";
import { Search, User, Settings, LogOut, Menu, Shield, ShoppingCart } from "lucide-react";
import { CartSidebar } from "@/components/cart-sidebar";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation, isLoading } = useAuth();
  const { toggleCart, getTotalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
            <button onClick={() => setLocation("/")} className="flex items-center flex-shrink-0">
              <img src={logoPath} alt="MercadoBoom Logo" className="h-8 sm:h-10 w-auto" />
            </button>
            <div className="hidden md:block flex-1 max-w-md lg:max-w-lg">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm focus:ring-boom-yellow focus:border-boom-yellow"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </form>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Cart Button */}
            <Button
              variant="ghost"
              onClick={toggleCart}
              className="relative p-2"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {getTotalItems() > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 bg-boom-red text-white text-xs w-5 h-5 flex items-center justify-center p-0"
                >
                  {getTotalItems()}
                </Badge>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2">
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                      <AvatarFallback className="bg-boom-yellow text-black text-xs sm:text-sm font-semibold">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-gray-700 text-sm">{user.fullName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    Mi Cuenta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Panel Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setLocation("/auth")}
                size="sm"
                className="bg-boom-yellow text-black hover:bg-boom-yellow/90 text-xs sm:text-sm px-2 sm:px-4"
              >
                <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Login</span>
              </Button>
            )}
            
            <Button variant="ghost" className="md:hidden p-1">
              <Menu className="h-5 w-5 text-gray-700" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm focus:ring-boom-yellow focus:border-boom-yellow"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </form>
        </div>
      </div>
      
      {/* Cart Sidebar */}
      <CartSidebar />
    </nav>
  );
}
