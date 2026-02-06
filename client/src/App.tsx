import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductDetailPage from "@/pages/product-detail";
import UserDashboard from "@/pages/user-dashboard";
import AdminPanel from "@/pages/admin-panel";
import SupportPage from "@/pages/support";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentFailurePage from "@/pages/payment-failure";
import OfertasPage from "@/pages/ofertas-page";
import ExplorarPage from "@/pages/explorar-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/producto/:id" component={ProductDetailPage} />
      <Route path="/ofertas" component={OfertasPage} />
      <Route path="/explorar" component={ExplorarPage} />
      <Route path="/payment/success" component={PaymentSuccessPage} />
      <Route path="/payment/failure" component={PaymentFailurePage} />
      <ProtectedRoute path="/dashboard" component={UserDashboard} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <ProtectedRoute path="/support" component={SupportPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
