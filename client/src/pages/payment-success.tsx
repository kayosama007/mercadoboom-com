import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Receipt } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to user dashboard after 3 seconds
    const timer = setTimeout(() => {
      setLocation("/user-dashboard");
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                ¡Pago Exitoso!
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Tu pago ha sido procesado correctamente.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Package className="w-4 h-4" />
                  <span>Tu pedido está siendo preparado</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Receipt className="w-4 h-4" />
                  <span>Recibirás un correo de confirmación</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={() => setLocation("/user-dashboard")}
                  className="w-full bg-boom-red hover:bg-boom-red/90"
                  data-testid="button-go-dashboard"
                >
                  Ver Mis Pedidos
                </Button>
              </div>
              
              <p className="text-xs text-gray-400">
                Serás redirigido automáticamente en unos segundos...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}