import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, HelpCircle } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PaymentFailurePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Error en el Pago
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Hubo un problema al procesar tu pago. Por favor, inténtalo de nuevo.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4" />
                  <span>Puedes intentar nuevamente</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <HelpCircle className="w-4 h-4" />
                  <span>Contacta soporte si el problema persiste</span>
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <Button 
                  onClick={() => setLocation("/")}
                  className="w-full bg-boom-red hover:bg-boom-red/90"
                  data-testid="button-try-again"
                >
                  Intentar de Nuevo
                </Button>
                
                <Button 
                  onClick={() => setLocation("/support")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-contact-support"
                >
                  Contactar Soporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}