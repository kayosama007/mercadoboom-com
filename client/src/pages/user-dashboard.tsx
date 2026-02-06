import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import OrderTimeline from "@/components/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import type { OrderWithDetails, Address } from "@shared/schema";
import { User, Package, MapPin, Store, CheckCircle2, AlertCircle, Clock, Shield, Plus, Edit, Trash2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TransferStatusCard } from "@/components/transfer-status-card";
import { SecuritySettings } from "@/components/security-verification";

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    username: user?.username || "",
    phone: user?.phone || ""
  });
  
  // Address modal states
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    title: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "México",
    isDefault: false
  });

  // Handle payment status from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderId = urlParams.get('order');

    if (paymentStatus && orderId) {
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      switch (paymentStatus) {
        case 'success':
          toast({
            title: "¡Pago Exitoso!",
            description: `Tu pago ha sido procesado correctamente. Pedido: ${orderId}`,
          });
          break;
        case 'failure':
          toast({
            title: "Pago Fallido",
            description: `Hubo un problema con tu pago. Pedido: ${orderId}`,
            variant: "destructive",
          });
          break;
        case 'pending':
          toast({
            title: "Pago Pendiente",
            description: `Tu pago está siendo procesado. Pedido: ${orderId}`,
          });
          break;
      }
    }
  }, [toast]);

  const { data: orders = [] } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
  });

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        email: user.email || "",
        username: user.username || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      return apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados exitosamente."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  });

  // Address mutations
  const createAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      return apiRequest("POST", "/api/addresses", data);
    },
    onSuccess: () => {
      toast({
        title: "Dirección agregada",
        description: "La nueva dirección ha sido guardada."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setIsAddressDialogOpen(false);
      resetAddressForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar la dirección.",
        variant: "destructive"
      });
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof addressForm }) => {
      return apiRequest("PATCH", `/api/addresses/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Dirección actualizada",
        description: "Los cambios han sido guardados."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      resetAddressForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la dirección.",
        variant: "destructive"
      });
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/addresses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Dirección eliminada",
        description: "La dirección ha sido eliminada."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la dirección.",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const resetAddressForm = () => {
    setAddressForm({
      title: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "México",
      isDefault: false
    });
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      title: address.title,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || "México",
      isDefault: address.isDefault || false
    });
    setIsAddressDialogOpen(true);
  };

  const handleDeleteAddress = (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta dirección?")) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleSaveAddress = () => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  const goToStore = () => {
    setLocation("/");
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ENTREGADO":
        return "bg-green-100 text-green-800";
      case "ENVIADO":
        return "bg-blue-100 text-blue-800";
      case "EN_PREPARACION":
        return "bg-yellow-100 text-yellow-800";
      case "PAGADO":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ENTREGADO":
        return "Entregado";
      case "ENVIADO":
        return "En Tránsito";
      case "EN_PREPARACION":
        return "En Preparación";
      case "PAGADO":
        return "Pagado";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarFallback className="bg-boom-yellow text-black text-xl font-semibold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{user.fullName}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <nav className="space-y-2">
                  <Button
                    variant={activeSection === "profile" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "profile"
                        ? "bg-boom-yellow text-black hover:bg-boom-yellow/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("profile")}
                  >
                    <User className="mr-3 h-4 w-4" />
                    Mi Perfil
                  </Button>
                  <Button
                    variant={activeSection === "orders" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "orders"
                        ? "bg-boom-yellow text-black hover:bg-boom-yellow/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("orders")}
                  >
                    <Package className="mr-3 h-4 w-4" />
                    Mis Pedidos
                  </Button>
                  <Button
                    variant={activeSection === "addresses" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "addresses"
                        ? "bg-boom-yellow text-black hover:bg-boom-yellow/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("addresses")}
                  >
                    <MapPin className="mr-3 h-4 w-4" />
                    Direcciones
                  </Button>
                  <Button
                    variant={activeSection === "support" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "support"
                        ? "bg-boom-yellow text-black hover:bg-boom-yellow/90"
                        : ""
                    }`}
                    onClick={() => setLocation("/support")}
                    data-testid="button-support"
                  >
                    <MessageCircle className="mr-3 h-4 w-4" />
                    Centro de Soporte
                  </Button>
                  <Button
                    variant={activeSection === "security" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "security"
                        ? "bg-boom-yellow text-black hover:bg-boom-yellow/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("security")}
                  >
                    <Shield className="mr-3 h-4 w-4" />
                    Seguridad
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Mi Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">Nombre Completo</Label>
                      <Input
                        id="fullName"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm(prev => ({...prev, fullName: e.target.value}))}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                        data-testid="input-fullname"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({...prev, email: e.target.value}))}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Usuario</Label>
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm(prev => ({...prev, username: e.target.value}))}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                        data-testid="input-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({...prev, phone: e.target.value}))}
                        className="focus:ring-boom-yellow focus:border-boom-yellow"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                  <Button 
                    className="mt-6 bg-boom-red text-white hover:bg-boom-red/90"
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Orders Section */}
            {activeSection === "orders" && (
              <Card>
                <CardHeader>
                  <CardTitle>Mis Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No tienes pedidos aún</p>
                      <Button 
                        className="mt-4 bg-boom-yellow text-black hover:bg-boom-yellow/90"
                        onClick={goToStore}
                        data-testid="button-go-to-store"
                      >
                        <Store className="mr-2 h-4 w-4" />
                        Ir a la tienda
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">Pedido {order.orderNumber}</h3>
                              <p className="text-gray-600">
                                Realizado el {order.createdAt ? new Date(order.createdAt).toLocaleDateString("es-MX") : "N/A"}
                              </p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </div>
                          
                          <OrderTimeline status={order.status} />
                          
                          {/* Show transfer status if it's a direct transfer */}
                          {order.paymentType === "direct_transfer" && (
                            <div className="mt-4">
                              <TransferStatusCard order={order} />
                            </div>
                          )}
                          
                          <div className="mt-4 flex items-center space-x-4">
                            <img
                              src={order.product.imageUrl || "/placeholder.jpg"}
                              alt={order.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <h4 className="font-medium">{order.product.name}</h4>
                              <p className="text-gray-600">${order.totalAmount}</p>
                              {order.paymentType === "direct_transfer" && order.discountApplied && parseFloat(order.discountApplied) > 0 && (
                                <p className="text-sm text-green-600">
                                  Ahorro: ${parseFloat(order.discountApplied).toLocaleString("es-MX", {
                                    minimumFractionDigits: 2,
                                  })} MXN
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Security Section */}
            {activeSection === "security" && <SecuritySettings />}

            {/* Addresses Section */}
            {activeSection === "addresses" && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Mis Direcciones</CardTitle>
                    <Button 
                      className="bg-boom-yellow text-black hover:bg-boom-yellow/90"
                      onClick={() => setIsAddressDialogOpen(true)}
                      data-testid="button-add-address"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Dirección
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No tienes direcciones guardadas</p>
                      <Button 
                        className="mt-4 bg-boom-yellow text-black hover:bg-boom-yellow/90"
                        onClick={() => setIsAddressDialogOpen(true)}
                        data-testid="button-add-first-address"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar primera dirección
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <Card key={address.id} className="relative">
                          <CardContent className="p-4">
                            {address.isDefault && (
                              <Badge className="absolute top-2 right-2 bg-boom-red text-white">
                                Principal
                              </Badge>
                            )}
                            <h3 className="font-semibold mb-2">{address.title}</h3>
                            <p className="text-gray-600 text-sm">
                              {address.street}<br />
                              {address.city}, {address.state}<br />
                              C.P. {address.postalCode}<br />
                              {address.country}
                            </p>
                            <div className="mt-4 flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-boom-red hover:text-boom-red"
                                onClick={() => handleEditAddress(address)}
                                data-testid={`button-edit-address-${address.id}`}
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => handleDeleteAddress(address.id)}
                                disabled={deleteAddressMutation.isPending}
                                data-testid={`button-delete-address-${address.id}`}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Eliminar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Editar Dirección" : "Agregar Nueva Dirección"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="title">Nombre de la dirección</Label>
              <Input
                id="title"
                placeholder="Casa, Trabajo, etc."
                value={addressForm.title}
                onChange={(e) => setAddressForm(prev => ({...prev, title: e.target.value}))}
                data-testid="input-address-title"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="street">Calle y número</Label>
              <Textarea
                id="street"
                placeholder="Av. Principal #123, Col. Centro"
                value={addressForm.street}
                onChange={(e) => setAddressForm(prev => ({...prev, street: e.target.value}))}
                data-testid="input-address-street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  placeholder="Ciudad de México"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm(prev => ({...prev, city: e.target.value}))}
                  data-testid="input-address-city"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder="CDMX"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm(prev => ({...prev, state: e.target.value}))}
                  data-testid="input-address-state"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  placeholder="12345"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm(prev => ({...prev, postalCode: e.target.value}))}
                  data-testid="input-address-postal"
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm(prev => ({...prev, country: e.target.value}))}
                  data-testid="input-address-country"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm(prev => ({...prev, isDefault: e.target.checked}))}
                className="rounded border-gray-300"
                data-testid="checkbox-address-default"
              />
              <Label htmlFor="isDefault" className="text-sm">
                Usar como dirección principal
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddressDialogOpen(false);
                setEditingAddress(null);
                resetAddressForm();
              }}
              data-testid="button-cancel-address"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAddress}
              disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
              className="bg-boom-yellow text-black hover:bg-boom-yellow/90"
              data-testid="button-save-address"
            >
              {(createAddressMutation.isPending || updateAddressMutation.isPending) 
                ? "Guardando..." 
                : editingAddress 
                  ? "Actualizar" 
                  : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
