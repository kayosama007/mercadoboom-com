import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AdminBanners from "@/pages/admin-banners";
import AdminSpecialOffers from "@/pages/admin-special-offers";
import AdminTransferDiscountPage from "@/pages/admin-transfer-discount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Product, OrderWithDetails, Category, InsertProduct, SupportTicket, TicketMessage } from "@shared/schema";
import {
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Banknote,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Calendar,
  Hash,
  CreditCard,
  Package2,
  RefreshCw,
  Save,
  MessageCircle,
  Upload,
  Key,
  Ban,
  Unlock,
} from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import OrderTimeline from "@/components/order-timeline";
import { TransferVerificationPanel } from "@/components/transfer-verification-panel";
import { PaymentConfigPanel } from "@/components/payment-config-panel";

// Product form schema
const productFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  originalPrice: z.string().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).optional().default([]),
  stock: z.number().min(0, "El stock no puede ser negativo").optional(),
  rating: z.string().optional(),
  reviewCount: z.number().min(0).optional(),
  promotionType: z.enum(["BOOM", "OFERTA", "RELAMPAGO", "NUEVO", "none"]).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isAffiliate: z.boolean().default(false),
  affiliateUrl: z.string().optional().or(z.literal("")),
  affiliateStore: z.string().optional(),
  shippingMethod: z.string().default("Envío Estándar"),
  deliveryTime: z.string().default("3-5 días hábiles"),
  freeShipping: z.boolean().default(false),
  freeShippingMinAmount: z.string().default("999"),
  isImported: z.boolean().default(false),
  importDeliveryDays: z.number().min(1, "Los días de entrega deben ser mayor a 0").default(15),
  importDescription: z.string().default("Producto de importación"),
});

// Password change form schema
const passwordChangeSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirma la contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Category form schema
const categoryFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  emoji: z.string().min(1, "El emoji es requerido"),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;
type CategoryFormData = z.infer<typeof categoryFormSchema>;

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [ticketResponse, setTicketResponse] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState("");
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState<User | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: orders = [] } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: supportTickets = [] } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    enabled: user?.isAdmin,
  });

  const { data: supportStats } = useQuery<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
  }>({
    queryKey: ["/api/admin/support/stats"],
    enabled: user?.isAdmin,
  });

  const { data: ticketDetails } = useQuery<{
    ticket: SupportTicket;
    messages: TicketMessage[];
  }>({
    queryKey: ["/api/support/tickets", selectedTicket?.id],
    enabled: !!selectedTicket?.id && user?.isAdmin,
  });

  // Category form setup
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      emoji: "",
      isActive: true,
    },
  });

  // Product form setup
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      categoryId: "",
      imageUrl: "",
      images: [],
      stock: 0,
      rating: "0",
      reviewCount: 0,
      isActive: true,
      isFeatured: false,
      isAffiliate: false,
      affiliateUrl: "",
      affiliateStore: "",
      shippingMethod: "Envío Estándar",
      deliveryTime: "3-5 días hábiles",
      freeShipping: false,
      freeShippingMinAmount: "999",
      isImported: false,
      importDeliveryDays: 15,
      importDescription: "Producto de importación",
    },
  });

  // Password change form setup
  const passwordForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Mutations
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      // Invalidate both admin and user order caches
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del pedido ha sido actualizado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData = {
        ...data,
        stock: data.stock || 0,
        reviewCount: data.reviewCount || 0,
        categoryId: data.categoryId || null,
        imageUrl: data.imageUrl || null,
        images: data.images || [],
        originalPrice: data.originalPrice || null,
        description: data.description || null,
        rating: data.rating || null,
        promotionType: data.promotionType === "none" ? null : data.promotionType || null,
        affiliateUrl: data.affiliateUrl || null,
        affiliateStore: data.affiliateStore || null,
        isImported: data.isImported,
        importDeliveryDays: data.importDeliveryDays,
        importDescription: data.importDescription,
      };
      return await apiRequest("POST", "/api/admin/products", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDialogOpen(false);
      productForm.reset();
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el producto",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      const productData = {
        ...data,
        stock: data.stock || 0,
        reviewCount: data.reviewCount || 0,
        categoryId: data.categoryId || null,
        imageUrl: data.imageUrl || null,
        images: data.images || [],
        originalPrice: data.originalPrice || null,
        description: data.description || null,
        rating: data.rating || null,
        promotionType: data.promotionType === "none" ? null : data.promotionType || null,
        affiliateUrl: data.affiliateUrl || null,
        affiliateStore: data.affiliateStore || null,
        isImported: data.isImported,
        importDeliveryDays: data.importDeliveryDays,
        importDescription: data.importDescription,
      };
      return await apiRequest("PATCH", `/api/admin/products/${id}`, productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el producto",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
        variant: "destructive",
      });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return await apiRequest("POST", "/api/admin/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la categoría",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      return await apiRequest("PATCH", `/api/admin/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest("DELETE", `/api/admin/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la categoría",
        variant: "destructive",
      });
    },
  });

  // Support ticket mutations
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status, adminNotes, resolution }: { 
      ticketId: string; 
      status: string; 
      adminNotes?: string; 
      resolution?: string; 
    }) => {
      return await apiRequest("PATCH", `/api/admin/support/tickets/${ticketId}`, { 
        status, 
        adminNotes, 
        resolution 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/stats"] });
      toast({
        title: "Ticket actualizado",
        description: "El ticket ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el ticket",
        variant: "destructive",
      });
    },
  });

  const respondToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      return await apiRequest("POST", `/api/support/tickets/${ticketId}/messages`, {
        message,
        senderType: "ADMIN",
        senderName: user?.fullName || "Administrador",
        senderEmail: user?.email || "admin@mercadoboom.com",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", selectedTicket?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setTicketResponse("");
      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta ha sido enviada al cliente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la respuesta",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}/password`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña del usuario ha sido cambiada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/block`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsBlockDialogOpen(false);
      setBlockReason("");
      toast({
        title: "Usuario bloqueado",
        description: "El usuario ha sido bloqueado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo bloquear el usuario",
        variant: "destructive",
      });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/unblock`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuario desbloqueado",
        description: "El usuario ha sido desbloqueado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo desbloquear el usuario",
        variant: "destructive",
      });
    },
  });

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

  const formatPrice = (price: string | number) => {
    return `$${Number(price).toLocaleString()}`;
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      originalPrice: product.originalPrice || "",
      categoryId: product.categoryId || "",
      imageUrl: product.imageUrl || "",
      images: product.images || [],
      stock: product.stock || 0,
      rating: product.rating || "0",
      reviewCount: product.reviewCount || 0,
      promotionType: product.promotionType as any,
      isActive: product.isActive || false,
      isFeatured: product.isFeatured || false,
      isAffiliate: product.isAffiliate || false,
      affiliateUrl: product.affiliateUrl || "",
      affiliateStore: product.affiliateStore || "",
      shippingMethod: product.shippingMethod || "Envío Estándar",
      deliveryTime: product.deliveryTime || "3-5 días hábiles",
      freeShipping: product.freeShipping || false,
      freeShippingMinAmount: product.freeShippingMinAmount || "999",
      isImported: product.isImported || false,
      importDeliveryDays: product.importDeliveryDays || 15,
      importDescription: product.importDescription || "Producto de importación",
    });
    setIsProductDialogOpen(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    productForm.reset();
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const onSubmitProduct = (data: ProductFormData) => {
    console.log('✅ Submitting product with data:', data);
    console.log('Image URL being sent:', data.imageUrl);
    console.log('Gallery images being sent:', data.images);
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };
  
  const handleProductFormError = (errors: any) => {
    console.log('❌ Form validation errors:', errors);
    toast({
      title: "Error en el formulario",
      description: "Revisa los campos marcados en rojo",
      variant: "destructive",
    });
  };

  const onSubmitCategory = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      emoji: category.emoji || "",
      isActive: category.isActive || false,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset();
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleViewOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.adminNotes || "");
    setResolution(ticket.resolution || "");
    setIsTicketDialogOpen(true);
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: string) => {
    updateTicketStatusMutation.mutate({ ticketId, status: newStatus });
  };

  const handleSaveTicketNotes = () => {
    if (selectedTicket) {
      updateTicketStatusMutation.mutate({
        ticketId: selectedTicket.id,
        status: selectedTicket.status,
        adminNotes,
        resolution,
      });
    }
  };

  const handleSendResponse = () => {
    if (selectedTicket && ticketResponse.trim()) {
      respondToTicketMutation.mutate({
        ticketId: selectedTicket.id,
        message: ticketResponse,
      });
    }
  };

  const handleChangePassword = (user: User) => {
    setSelectedUserForPassword(user);
    passwordForm.reset();
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = (data: z.infer<typeof passwordChangeSchema>) => {
    if (selectedUserForPassword) {
      changePasswordMutation.mutate({
        userId: selectedUserForPassword.id,
        password: data.password,
      });
    }
  };

  const handleBlockUser = (user: User) => {
    setSelectedUserForBlock(user);
    setBlockReason("");
    setIsBlockDialogOpen(true);
  };

  const handleBlockSubmit = () => {
    if (selectedUserForBlock && blockReason.trim()) {
      blockUserMutation.mutate({
        userId: selectedUserForBlock.id,
        reason: blockReason,
      });
    }
  };

  const handleUnblockUser = (user: User) => {
    unblockUserMutation.mutate(user.id);
  };

  const getOrderTimeline = (order: OrderWithDetails) => {
    const statuses = ["PAGADO", "EN_PREPARACION", "RECOGIDO", "ENVIADO", "EN_RUTA", "ENTREGADO"];
    const currentIndex = statuses.indexOf(order.status);
    
    return statuses.map((status, index) => {
      const isCompleted = index <= currentIndex;
      const isCurrent = index === currentIndex;
      
      return {
        status,
        label: getStatusLabel(status),
        icon: getStatusIcon(status),
        completed: isCompleted,
        current: isCurrent,
        timestamp: index <= currentIndex ? order.updatedAt : null,
      };
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      "PAGADO": "Pago Confirmado",
      "EN_PREPARACION": "Preparando Pedido", 
      "RECOGIDO": "Recogido por Paquetería",
      "ENVIADO": "Enviado",
      "EN_RUTA": "En Ruta de Entrega",
      "ENTREGADO": "Entregado"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      "PAGADO": <CreditCard className="w-4 h-4" />,
      "EN_PREPARACION": <Package2 className="w-4 h-4" />,
      "RECOGIDO": <Package className="w-4 h-4" />,
      "ENVIADO": <Truck className="w-4 h-4" />,
      "EN_RUTA": <MapPin className="w-4 h-4" />,
      "ENTREGADO": <CheckCircle2 className="w-4 h-4" />
    };
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Admin Sidebar */}
          <div className="lg:w-1/4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-6 text-boom-red">Panel Admin</h3>
                <nav className="space-y-2">
                  <Button
                    variant={activeSection === "dashboard" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "dashboard"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("dashboard")}
                  >
                    <BarChart3 className="mr-3 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant={activeSection === "products" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "products"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("products")}
                  >
                    <Package className="mr-3 h-4 w-4" />
                    Productos
                  </Button>
                  <Button
                    variant={activeSection === "users" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "users"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("users")}
                  >
                    <Users className="mr-3 h-4 w-4" />
                    Usuarios
                  </Button>
                  <Button
                    variant={activeSection === "orders" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "orders"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("orders")}
                  >
                    <ShoppingCart className="mr-3 h-4 w-4" />
                    Pedidos
                  </Button>
                  
                  <Button
                    variant={activeSection === "transfers" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "transfers"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("transfers")}
                  >
                    <Banknote className="mr-3 h-4 w-4" />
                    Transferencias
                  </Button>
                  
                  <Button
                    variant={activeSection === "payments" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "payments"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("payments")}
                  >
                    <CreditCard className="mr-3 h-4 w-4" />
                    Configurar Pagos
                  </Button>
                  
                  <Button
                    variant={activeSection === "transfer-discount" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "transfer-discount"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("transfer-discount")}
                    data-testid="button-nav-transfer-discount"
                  >
                    <TrendingDown className="mr-3 h-4 w-4" />
                    Descuento Transferencia
                  </Button>
                  
                  <Button
                    variant={activeSection === "categories" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "categories"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("categories")}
                  >
                    <Package className="mr-3 h-4 w-4" />
                    Categorías
                  </Button>
                  
                  <Button
                    variant={activeSection === "banners" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "banners"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("banners")}
                  >
                    <Package2 className="mr-3 h-4 w-4" />
                    Banners
                  </Button>
                  
                  <Button
                    variant={activeSection === "special-offers" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "special-offers"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("special-offers")}
                  >
                    <TrendingUp className="mr-3 h-4 w-4" />
                    Ofertas Especiales
                  </Button>
                  
                  <Button
                    variant={activeSection === "timeline" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeSection === "timeline"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("timeline")}
                  >
                    <Clock className="mr-3 h-4 w-4" />
                    Timeline Usuarios
                  </Button>

                  <Button
                    variant={activeSection === "support" ? "default" : "ghost"}
                    className={`w-full justify-start relative ${
                      activeSection === "support"
                        ? "bg-boom-red text-white hover:bg-boom-red/90"
                        : ""
                    }`}
                    onClick={() => setActiveSection("support")}
                  >
                    <MessageCircle className="mr-3 h-4 w-4" />
                    Tickets de Soporte
                    {supportStats && supportStats.openTickets > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {supportStats.openTickets}
                      </span>
                    )}
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Admin Content */}
          <div className="lg:w-3/4">
            {/* Dashboard Section */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="text-blue-600 text-xl" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{(stats as any)?.activeUsers || 0}</h3>
                      <p className="text-gray-600">Usuarios Activos</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="text-green-600 text-xl" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{(stats as any)?.totalSales || "$0"}</h3>
                      <p className="text-gray-600">Ventas Totales</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="text-yellow-600 text-xl" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{(stats as any)?.totalOrders || 0}</h3>
                      <p className="text-gray-600">Pedidos</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="text-purple-600 text-xl" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{(stats as any)?.conversionRate || "0%"}</h3>
                      <p className="text-gray-600">Conversión</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center">
                            <ShoppingCart className="text-green-600 text-xs" />
                          </div>
                          <div>
                            <p className="font-medium">Nueva venta: {order.product.name}</p>
                            <p className="text-gray-600 text-sm">
                              hace {Math.floor((Date.now() - new Date(order.createdAt || Date.now()).getTime()) / (1000 * 60))} minutos
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Products Management */}
            {activeSection === "products" && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Gestión de Productos</CardTitle>
                    <Button 
                      className="bg-boom-yellow text-black hover:bg-boom-yellow/90"
                      onClick={handleAddProduct}
                      data-testid="button-add-product"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="flex items-center space-x-3">
                            <img
                              src={product.imageUrl || "/placeholder.jpg"}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <span className="font-medium">{product.name}</span>
                          </TableCell>
                          <TableCell>{formatPrice(product.price)}</TableCell>
                          <TableCell>
                            {product.isAffiliate ? (
                              <Badge className="bg-blue-100 text-blue-800">
                                Externo
                              </Badge>
                            ) : (
                              <Badge className={`${
                                (product.stock || 0) > 20
                                  ? "bg-green-100 text-green-800"
                                  : (product.stock || 0) > 10
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {product.stock || 0 > 0 ? product.stock : "Agotado"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {product.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditProduct(product)}
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteProduct(product.id)}
                                data-testid={`button-delete-product-${product.id}`}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Users Management */}
            {activeSection === "users" && (
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-gray-500">@{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-MX") : "N/A"}
                          </TableCell>
                          <TableCell>
                            {user.isBlocked ? (
                              <div>
                                <Badge className="bg-red-100 text-red-800">Bloqueado</Badge>
                                {user.blockReason && (
                                  <p className="text-xs text-gray-500 mt-1">{user.blockReason}</p>
                                )}
                              </div>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Activo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleChangePassword(user)}
                                data-testid={`button-change-password-${user.id}`}
                                title="Cambiar contraseña"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              {user.isBlocked ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleUnblockUser(user)}
                                  data-testid={`button-unblock-user-${user.id}`}
                                  title="Desbloquear usuario"
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleBlockUser(user)}
                                  data-testid={`button-block-user-${user.id}`}
                                  title="Bloquear usuario"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Orders Management */}
            {activeSection === "orders" && (
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.user.fullName}</TableCell>
                          <TableCell>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("es-MX") : "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(order.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                updateOrderStatusMutation.mutate({
                                  orderId: order.id,
                                  status: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PAGADO">💳 Pagado</SelectItem>
                                <SelectItem value="EN_PREPARACION">📦 En Preparación</SelectItem>
                                <SelectItem value="RECOGIDO">📮 Recogido</SelectItem>
                                <SelectItem value="ENVIADO">🚛 Enviado</SelectItem>
                                <SelectItem value="EN_RUTA">🚚 En Ruta</SelectItem>
                                <SelectItem value="ENTREGADO">✅ Entregado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewOrder(order)}
                              data-testid={`button-view-order-${order.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Categories Management */}
            {activeSection === "categories" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Gestión de Categorías</CardTitle>
                    <Button onClick={handleAddCategory} data-testid="button-add-category">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Categoría
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <Card key={category.id} className="border-l-4 border-l-boom-red">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{category.emoji}</span>
                              <div>
                                <h3 className="font-semibold">{category.name}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`inline-block w-2 h-2 rounded-full ${
                                    category.isActive ? 'bg-green-500' : 'bg-gray-400'
                                  }`}></span>
                                  <span className="text-sm text-gray-600">
                                    {category.isActive ? 'Activa' : 'Inactiva'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditCategory(category)}
                                data-testid={`button-edit-category-${category.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteCategory(category.id)}
                                data-testid={`button-delete-category-${category.id}`}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transfer Verification Section */}
            {activeSection === "transfers" && <TransferVerificationPanel />}
            
            {/* Payment Configuration Section */}
            {activeSection === "payments" && <PaymentConfigPanel />}

            {/* Banners Section */}
            {activeSection === "banners" && <AdminBanners />}

            {/* Special Offers Section */}
            {activeSection === "special-offers" && <AdminSpecialOffers />}

            {/* Transfer Discount Configuration Section */}
            {activeSection === "transfer-discount" && <AdminTransferDiscountPage />}

            {/* Timeline Section */}
            {activeSection === "timeline" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-gray-900">Timeline de Pedidos por Usuario</h2>
                </div>

                <div className="grid gap-6">
                  {users.map((user) => {
                    const userOrders = orders.filter(order => order.userId === user.id);
                    
                    if (userOrders.length === 0) return null;

                    return (
                      <Card key={user.id} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-boom-red to-red-600 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl">{user.fullName}</CardTitle>
                              <p className="text-red-100">{user.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-100">Total pedidos: {userOrders.length}</p>
                              <p className="text-red-100">
                                Total gastado: $
                                {userOrders
                                  .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0)
                                  .toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {userOrders
                              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                              .map((order) => {
                                const timeline = getOrderTimeline(order);
                                
                                return (
                                  <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                      <div>
                                        <h4 className="font-semibold text-gray-900">Pedido #{order.id.slice(0, 8)}</h4>
                                        <p className="text-sm text-gray-600">
                                          {new Date(order.createdAt || 0).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-boom-red">
                                          ${parseFloat(order.totalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          order.status === 'ENTREGADO' ? 'bg-green-100 text-green-800' :
                                          order.status === 'EN_RUTA' ? 'bg-blue-100 text-blue-800' :
                                          order.status === 'ENVIADO' ? 'bg-indigo-100 text-indigo-800' :
                                          order.status === 'EN_PREPARACION' ? 'bg-yellow-100 text-yellow-800' :
                                          order.status === 'PAGADO' ? 'bg-teal-100 text-teal-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.status.replace(/_/g, ' ')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Timeline Visual */}
                                    <div className="relative mt-6">
                                      <div className="flex items-center justify-between mb-2">
                                        {timeline.map((step, index) => (
                                          <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                              step.completed ? 'bg-boom-red text-white' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                              {getStatusIcon(step.status)}
                                            </div>
                                            <p className={`text-xs mt-2 text-center ${
                                              step.completed ? 'text-gray-900 font-medium' : 'text-gray-500'
                                            }`}>
                                              {step.label}
                                            </p>
                                            {step.timestamp && (
                                              <p className="text-xs text-gray-400 mt-1">
                                                {new Date(step.timestamp).toLocaleDateString('es-MX')}
                                              </p>
                                            )}
                                            
                                            {/* Connection Line */}
                                            {index < timeline.length - 1 && (
                                              <div 
                                                className={`absolute h-0.5 ${
                                                  step.completed && timeline[index + 1].completed ? 'bg-boom-red' : 'bg-gray-300'
                                                }`}
                                                style={{
                                                  top: '16px',
                                                  left: `${((index + 1) / timeline.length) * 100 - (1 / timeline.length) * 50}%`,
                                                  width: `${(1 / timeline.length) * 100}%`,
                                                }}
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="mt-4 pt-4 border-t">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Producto:</p>
                                      <p className="text-sm text-gray-600">
                                        • {order.product?.name || 'N/A'} (x{order.quantity})
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {users.filter(user => orders.some(order => order.userId === user.id)).length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay pedidos aún</h3>
                      <p className="text-gray-600">
                        Los pedidos de los usuarios aparecerán aquí con su timeline completo.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Support Tickets Section */}
            {activeSection === "support" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Tickets de Soporte</h2>
                </div>

                {/* Support Stats */}
                {supportStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <MessageCircle className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                            <p className="text-2xl font-bold text-gray-900">{supportStats.totalTickets}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <AlertCircle className="h-8 w-8 text-orange-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Abiertos</p>
                            <p className="text-2xl font-bold text-orange-600">{supportStats.openTickets}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Clock className="h-8 w-8 text-yellow-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">En Proceso</p>
                            <p className="text-2xl font-bold text-yellow-600">{supportStats.inProgressTickets}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Resueltos</p>
                            <p className="text-2xl font-bold text-green-600">{supportStats.resolvedTickets}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Tickets List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tickets Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {supportTickets.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tickets</h3>
                        <p className="text-gray-600">Los tickets de soporte aparecerán aquí.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {supportTickets
                          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                          .map((ticket) => (
                            <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-gray-900">
                                      Ticket #{ticket.ticketNumber}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      ticket.priority === 'URGENTE' ? 'bg-red-100 text-red-800' :
                                      ticket.priority === 'ALTO' ? 'bg-orange-100 text-orange-800' :
                                      ticket.priority === 'MEDIO' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {ticket.priority}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      ticket.status === 'ABIERTO' ? 'bg-orange-100 text-orange-800' :
                                      ticket.status === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                                      ticket.status === 'ESPERANDO_CLIENTE' ? 'bg-purple-100 text-purple-800' :
                                      ticket.status === 'RESUELTO' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {ticket.status.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {ticket.category}
                                    </span>
                                  </div>
                                  <h3 className="font-medium text-gray-900 mb-1">{ticket.subject}</h3>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>De: {ticket.name}</span>
                                    <span>•</span>
                                    <span>{ticket.email}</span>
                                    <span>•</span>
                                    <span>
                                      {new Date(ticket.createdAt || 0).toLocaleDateString('es-MX', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Select 
                                    value={ticket.status} 
                                    onValueChange={(newStatus) => handleUpdateTicketStatus(ticket.id, newStatus)}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ABIERTO">Abierto</SelectItem>
                                      <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                                      <SelectItem value="ESPERANDO_CLIENTE">Esperando Cliente</SelectItem>
                                      <SelectItem value="RESUELTO">Resuelto</SelectItem>
                                      <SelectItem value="CERRADO">Cerrado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewTicket(ticket)}
                                    data-testid={`button-view-ticket-${ticket.id}`}
                                  >
                                    Ver Detalles
                                  </Button>
                                </div>
                              </div>
                              
                              {ticket.adminNotes && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                  <p className="text-sm font-medium text-yellow-800">Notas del administrador:</p>
                                  <p className="text-sm text-yellow-700">{ticket.adminNotes}</p>
                                </div>
                              )}
                              
                              {ticket.resolution && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                                  <p className="text-sm font-medium text-green-800">Resolución:</p>
                                  <p className="text-sm text-green-700">{ticket.resolution}</p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Agregar Producto"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onSubmitProduct, handleProductFormError)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-boom-red">Información Básica</h3>
                  
                  <FormField
                    control={productForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Producto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: iPhone 15 Pro Max 256GB" {...field} data-testid="input-product-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción detallada del producto..."
                            className="min-h-[100px]"
                            {...field} 
                            data-testid="textarea-product-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-category">
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.emoji} {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-boom-red">Precios y Stock</h3>
                  
                  <FormField
                    control={productForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Venta * (MXN)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="24999" 
                            {...field} 
                            data-testid="input-product-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Original (MXN)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="29999" 
                            {...field} 
                            data-testid="input-product-original-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Disponible</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="50" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-product-stock"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="promotionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Promoción</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-promotion-type">
                              <SelectValue placeholder="Sin promoción" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin promoción</SelectItem>
                            <SelectItem value="BOOM">💥 BOOM</SelectItem>
                            <SelectItem value="OFERTA">🔥 OFERTA</SelectItem>
                            <SelectItem value="RELAMPAGO">⚡ RELÁMPAGO</SelectItem>
                            <SelectItem value="NUEVO">✨ NUEVO</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Images & Media */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-boom-red">Imagen del Producto</h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={productForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Imagen del Producto</FormLabel>
                          <div className="space-y-3">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={5242880} // 5MB
                              onGetUploadParameters={async () => {
                                const res = await apiRequest("POST", "/api/objects/upload");
                                const response = await res.json() as { uploadURL: string };
                                console.log('Server response:', response);
                                console.log('Upload URL from server:', response.uploadURL);
                                return {
                                  method: "PUT" as const,
                                  url: response.uploadURL || "",
                                };
                              }}
                              onComplete={async (result) => {
                                if (result.successful && result.successful.length > 0) {
                                  const uploadedFile = result.successful[0];
                                  const imageUrl = (uploadedFile as any).uploadURL || (uploadedFile as any).meta?.uploadURL;
                                  console.log('Image URL received:', imageUrl);
                                  
                                  if (imageUrl) {
                                    try {
                                      // Normalize the URL to a permanent path
                                      const res = await apiRequest("POST", "/api/objects/normalize", { path: imageUrl });
                                      const data = await res.json() as { path: string };
                                      field.onChange(data.path);
                                      toast({
                                        title: "Imagen subida",
                                        description: "La imagen se ha subido correctamente",
                                      });
                                    } catch (error) {
                                      console.error('Error normalizing URL:', error);
                                      toast({
                                        title: "Error",
                                        description: "Error al procesar la imagen",
                                        variant: "destructive",
                                      });
                                    }
                                  } else {
                                    console.error('No uploadURL found. Keys:', Object.keys(uploadedFile));
                                    toast({
                                      title: "Error",
                                      description: "No se pudo obtener la URL de la imagen",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              onError={(error: any) => {
                                console.error("Upload error:", error);
                                toast({
                                  title: "Error al subir imagen",
                                  description: error?.message || "No se pudo subir la imagen",
                                  variant: "destructive",
                                });
                              }}
                              buttonClassName="w-full"
                            >
                              <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                <span>Subir Nueva Imagen</span>
                              </div>
                            </ObjectUploader>
                            
                            <FormControl>
                              <Input 
                                placeholder="O ingresa URL directamente" 
                                {...field} 
                                data-testid="input-product-image-url"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {productForm.watch("imageUrl") && (
                      <div className="mt-2">
                        <img 
                          src={productForm.watch("imageUrl")} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Additional Images Gallery */}
                  <div className="space-y-4">
                    <FormField
                      control={productForm.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Galería de Imágenes Adicionales</FormLabel>
                          <FormDescription>
                            Sube hasta 10 imágenes adicionales para mostrar en la galería del producto
                          </FormDescription>
                          <div className="space-y-3">
                            <ObjectUploader
                              maxNumberOfFiles={10}
                              maxFileSize={5242880} // 5MB per file
                              onGetUploadParameters={async () => {
                                const res = await apiRequest("POST", "/api/objects/upload");
                                const response = await res.json() as { uploadURL: string };
                                console.log('Server response:', response);
                                console.log('Upload URL from server:', response.uploadURL);
                                return {
                                  method: "PUT" as const,
                                  url: response.uploadURL || "",
                                };
                              }}
                              onComplete={async (result) => {
                                if (result.successful && result.successful.length > 0) {
                                  // Obtener directamente del formulario para asegurar el valor actual
                                  const currentFormImages = productForm.getValues('images') || [];
                                  const currentImages = Array.isArray(currentFormImages) ? currentFormImages : [];
                                  console.log('Current images before upload:', currentImages);
                                  
                                  const uploadedUrls = result.successful.map(file => 
                                    (file as any).uploadURL || (file as any).meta?.uploadURL
                                  ).filter(url => url);
                                  
                                  if (uploadedUrls.length > 0) {
                                    try {
                                      // Normalize all URLs to permanent paths
                                      const normalizedPaths = await Promise.all(
                                        uploadedUrls.map(async (url) => {
                                          const res = await apiRequest("POST", "/api/objects/normalize", { path: url });
                                          const data = await res.json() as { path: string };
                                          return data.path;
                                        })
                                      );
                                      
                                      const newImages = [...currentImages, ...normalizedPaths];
                                      productForm.setValue('images', newImages);
                                      console.log('Gallery images updated:', newImages);
                                      toast({
                                        title: "Imágenes subidas",
                                        description: `${normalizedPaths.length} imagen(es) agregada(s). Total: ${newImages.length}. PRESIONA "Guardar cambios".`,
                                      });
                                    } catch (error) {
                                      console.error('Error normalizing URLs:', error);
                                      toast({
                                        title: "Error",
                                        description: "Error al procesar las imágenes",
                                        variant: "destructive",
                                      });
                                    }
                                  } else {
                                    toast({
                                      title: "Error",
                                      description: "No se pudieron obtener las URLs de las imágenes",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              onError={(error: any) => {
                                console.error("Upload error:", error);
                                toast({
                                  title: "Error al subir imágenes",
                                  description: error?.message || "No se pudieron subir las imágenes",
                                  variant: "destructive",
                                });
                              }}
                              buttonClassName="w-full"
                            >
                              <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                <span>Agregar Imágenes a la Galería</span>
                              </div>
                            </ObjectUploader>
                          </div>
                          
                          {/* Image Gallery Preview */}
                          {field.value && field.value.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Imágenes en la galería ({field.value.filter(img => img && img.trim()).length}):</p>
                              <div className="grid grid-cols-4 gap-2">
                                {field.value.filter(img => img && img.trim()).map((imageUrl, index) => (
                                  <div key={index} className="relative group">
                                    <img 
                                      src={imageUrl} 
                                      alt={`Galería ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border"
                                      onError={(e) => {
                                        console.error('Error loading image:', imageUrl);
                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EError%3C/text%3E%3C/svg%3E";
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newImages = field.value.filter((_, i) => {
                                          const validImages = field.value.filter(img => img && img.trim());
                                          return validImages[i] !== imageUrl;
                                        });
                                        field.onChange(newImages);
                                      }}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Affiliate Products */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-boom-red">Producto Afiliado</h3>
                  
                  <FormField
                    control={productForm.control}
                    name="isAffiliate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Producto Externo</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Producto vendido en tienda externa (ej: Amazon, MercadoLibre)
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-affiliate"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {productForm.watch("isAffiliate") && (
                    <>
                      <FormField
                        control={productForm.control}
                        name="affiliateUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL de la Tienda Externa</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://amazon.com.mx/producto" 
                                {...field} 
                                data-testid="input-affiliate-url"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="affiliateStore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la Tienda</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Amazon, MercadoLibre, etc." 
                                {...field} 
                                data-testid="input-affiliate-store"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                {/* Product Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-boom-red">Estado del Producto</h3>
                  
                  <FormField
                    control={productForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Producto Activo</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            El producto aparecerá en la tienda
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Producto Destacado</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Aparecerá en la sección de destacados
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-featured"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Reviews & Rating */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-boom-red">Reseñas y Calificación</h3>
                  
                  <FormField
                    control={productForm.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calificación (0-5)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="5"
                            placeholder="4.5" 
                            {...field} 
                            data-testid="input-product-rating"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="reviewCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Reseñas</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="150" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-review-count"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Shipping & Delivery */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-boom-red">Envío y Entrega</h3>
                  
                  <FormField
                    control={productForm.control}
                    name="shippingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Envío</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-shipping-method">
                              <SelectValue placeholder="Seleccionar método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Envío Estándar">📦 Envío Estándar</SelectItem>
                            <SelectItem value="Envío Express">⚡ Envío Express</SelectItem>
                            <SelectItem value="Entrega en Tienda">🏪 Recoger en Tienda</SelectItem>
                            <SelectItem value="Envío Gratis">🆓 Envío Gratis</SelectItem>
                            <SelectItem value="Envío Inmediato">🚀 Envío Inmediato</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="deliveryTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo de Entrega</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-delivery-time">
                              <SelectValue placeholder="Seleccionar tiempo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-2 días hábiles">⚡ 1-2 días hábiles</SelectItem>
                            <SelectItem value="3-5 días hábiles">📦 3-5 días hábiles</SelectItem>
                            <SelectItem value="5-7 días hábiles">🚛 5-7 días hábiles</SelectItem>
                            <SelectItem value="7-10 días hábiles">📮 7-10 días hábiles</SelectItem>
                            <SelectItem value="Inmediato">🚀 Entrega Inmediata</SelectItem>
                            <SelectItem value="Recoger en tienda">🏪 Disponible para recoger</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="freeShipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Envío Gratuito</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            El producto incluye envío sin costo adicional
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-free-shipping"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {!productForm.watch("freeShipping") && (
                    <FormField
                      control={productForm.control}
                      name="freeShippingMinAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto Mínimo para Envío Gratis (MXN)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="999" 
                              {...field}
                              data-testid="input-free-shipping-min"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Productos de Importación */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-boom-red">Productos de Importación</h3>
                  
                  <FormField
                    control={productForm.control}
                    name="isImported"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Producto de Importación</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Producto con entrega diferida que requiere importación
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-imported"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {productForm.watch("isImported") && (
                    <>
                      <FormField
                        control={productForm.control}
                        name="importDeliveryDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Días de Entrega para Importación</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="90"
                                placeholder="15" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 15)}
                                data-testid="input-import-delivery-days"
                              />
                            </FormControl>
                            <div className="text-sm text-muted-foreground">
                              Número de días hábiles para entrega desde la confirmación del pedido
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="importDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción de Importación</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Producto de importación - Entrega en 15-20 días hábiles" 
                                {...field} 
                                data-testid="input-import-description"
                              />
                            </FormControl>
                            <div className="text-sm text-muted-foreground">
                              Mensaje que se mostrará al cliente sobre el tiempo de entrega
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t bg-yellow-100 dark:bg-yellow-900/30 p-6 -m-6 mt-6 rounded-b-lg">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsProductDialogOpen(false)}
                  data-testid="button-cancel-product"
                  className="bg-white dark:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-boom-red hover:bg-boom-red/90 text-white font-bold text-lg px-8 py-6 shadow-xl border-4 border-yellow-400 animate-pulse hover:animate-none"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  data-testid="button-save-product"
                >
                  {createProductMutation.isPending || updateProductMutation.isPending ? (
                    "⏳ Guardando..."
                  ) : editingProduct ? (
                    "💾 GUARDAR CAMBIOS AHORA"
                  ) : (
                    "💾 CREAR PRODUCTO"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoría" : "Agregar Categoría"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Categoría</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ej. Smartphones" 
                        {...field} 
                        data-testid="input-category-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoji</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="📱" 
                        {...field} 
                        data-testid="input-category-emoji"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activa</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        La categoría estará visible en la tienda
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-category-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-category"
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingCategory ? "Actualizar" : "Crear"}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryDialogOpen(false)}
                  data-testid="button-cancel-category"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-boom-red" />
              Detalles del Pedido #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Hash className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Número de Pedido</p>
                        <p className="font-semibold">{selectedOrder.orderNumber}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-semibold text-lg">{formatPrice(selectedOrder.totalAmount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha</p>
                        <p className="font-semibold">
                          {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString("es-MX") : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nombre Completo</p>
                        <p className="font-semibold">{selectedOrder.user.fullName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Mail className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{selectedOrder.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Usuario</p>
                        <p className="font-semibold">@{selectedOrder.user.username}</p>
                      </div>
                    </div>

                    {selectedOrder.shippingAddress && (
                      <div className="border-t pt-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <MapPin className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Dirección de Envío</p>
                            <div className="font-semibold">
                              <p>{selectedOrder.shippingAddress.title}</p>
                              <p>{selectedOrder.shippingAddress.street}</p>
                              <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                              <p>CP: {selectedOrder.shippingAddress.postalCode}</p>
                              <p>{selectedOrder.shippingAddress.country}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Product Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package2 className="w-5 h-5" />
                      Producto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <img
                        src={selectedOrder.product.imageUrl || "/placeholder.jpg"}
                        alt={selectedOrder.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{selectedOrder.product.name}</h4>
                        <p className="text-gray-600 text-sm mb-2">{selectedOrder.product.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Cantidad</p>
                            <p className="font-semibold">{selectedOrder.quantity || 1}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Precio Unitario</p>
                            <p className="font-semibold">{formatPrice(selectedOrder.product.price)}</p>
                          </div>
                        </div>

                        {selectedOrder.product.isAffiliate && (
                          <div className="mt-3 p-2 bg-blue-50 rounded-md">
                            <p className="text-xs text-blue-600 font-medium">
                              Producto Externo - {selectedOrder.product.affiliateStore}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Estado del Pedido y Línea del Tiempo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getOrderTimeline(selectedOrder).map((step, index) => (
                      <div key={step.status} className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          step.completed 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : step.current
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'bg-gray-100 border-gray-300 text-gray-500'
                        }`}>
                          {step.icon}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-semibold ${
                                step.completed ? 'text-green-700' : 
                                step.current ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                {step.label}
                              </p>
                              {step.timestamp && (
                                <p className="text-sm text-gray-600">
                                  {new Date(step.timestamp).toLocaleString("es-MX")}
                                </p>
                              )}
                            </div>
                            
                            {step.current && (
                              <Badge className={getStatusColor(selectedOrder.status)}>
                                {step.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {index < getOrderTimeline(selectedOrder).length - 1 && (
                          <div className={`absolute left-5 top-10 w-0.5 h-8 ${
                            step.completed ? 'bg-green-500' : 'bg-gray-300'
                          }`} style={{ marginLeft: '1.25rem' }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Manual Status Update */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <Label className="font-semibold">Actualizar Estado:</Label>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => {
                          updateOrderStatusMutation.mutate({
                            orderId: selectedOrder.id,
                            status: value,
                          });
                          // Update selected order for UI
                          setSelectedOrder(prev => prev ? {...prev, status: value} : null);
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAGADO">💳 Pago Confirmado</SelectItem>
                          <SelectItem value="EN_PREPARACION">📦 Preparando Pedido</SelectItem>
                          <SelectItem value="RECOGIDO">📮 Recogido por Paquetería</SelectItem>
                          <SelectItem value="ENVIADO">🚛 Enviado</SelectItem>
                          <SelectItem value="EN_RUTA">🚚 En Ruta de Entrega</SelectItem>
                          <SelectItem value="ENTREGADO">✅ Entregado</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder="Número de seguimiento"
                        value={selectedOrder.trackingNumber || ""}
                        onChange={(e) => {
                          // Update tracking number
                          setSelectedOrder(prev => prev ? {...prev, trackingNumber: e.target.value} : null);
                        }}
                        className="w-48"
                        data-testid="input-tracking-number"
                      />

                      <Input
                        placeholder="Servicio de paquetería"
                        value={selectedOrder.courierService || ""}
                        onChange={(e) => {
                          setSelectedOrder(prev => prev ? {...prev, courierService: e.target.value} : null);
                        }}
                        className="w-40"
                        data-testid="input-courier-service"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOrderDialogOpen(false)}
                  data-testid="button-close-order-details"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ticket Details Dialog */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ticket #{selectedTicket?.ticketNumber} - {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-semibold">{selectedTicket.name}</p>
                      <p className="text-sm text-gray-500">{selectedTicket.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <Badge 
                        className={
                          selectedTicket.status === "ABIERTO" ? "bg-blue-100 text-blue-800" :
                          selectedTicket.status === "EN_PROCESO" ? "bg-yellow-100 text-yellow-800" :
                          selectedTicket.status === "ESPERANDO_CLIENTE" ? "bg-orange-100 text-orange-800" :
                          selectedTicket.status === "RESUELTO" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Categoría</p>
                      <p className="font-semibold">
                        {selectedTicket.category === "PEDIDO" ? "📦 Pedido" :
                         selectedTicket.category === "PAGO" ? "💳 Pago" :
                         selectedTicket.category === "TECNICO" ? "⚙️ Técnico" :
                         selectedTicket.category === "DEVOLUCION" ? "↩️ Devolución" :
                         "❓ Otro"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prioridad</p>
                      <Badge 
                        className={
                          selectedTicket.priority === "URGENTE" ? "bg-red-100 text-red-800" :
                          selectedTicket.priority === "ALTO" ? "bg-orange-100 text-orange-800" :
                          selectedTicket.priority === "MEDIO" ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        }
                      >
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Descripción original</p>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedTicket.description}</p>
                  </div>
                  
                  {selectedTicket.orderId && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-800">
                        Relacionado con pedido: {selectedTicket.orderId}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {ticketDetails?.messages && ticketDetails.messages.length > 0 ? (
                      ticketDetails.messages
                        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
                        .map((message) => (
                          <div
                            key={message.id}
                            className={`p-4 rounded-lg ${
                              message.senderType === "ADMIN"
                                ? "bg-blue-50 ml-8"
                                : "bg-gray-50 mr-8"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  message.senderType === "ADMIN" ? "bg-blue-600" : "bg-gray-600"
                                }`}>
                                  {message.senderType === "ADMIN" ? "A" : "C"}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{message.senderName}</p>
                                  <p className="text-xs text-gray-500">{message.senderEmail}</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">
                                {message.createdAt ? new Date(message.createdAt).toLocaleString("es-MX") : ""}
                              </p>
                            </div>
                            <p className="text-gray-800">{message.message}</p>
                          </div>
                        ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No hay mensajes adicionales en este ticket.
                      </p>
                    )}
                  </div>

                  {/* Response Form */}
                  <div className="mt-6 space-y-3">
                    <Label htmlFor="response">Responder al cliente</Label>
                    <Textarea
                      id="response"
                      value={ticketResponse}
                      onChange={(e) => setTicketResponse(e.target.value)}
                      placeholder="Escribe tu respuesta al cliente..."
                      rows={3}
                      data-testid="textarea-ticket-response"
                    />
                    <Button
                      onClick={handleSendResponse}
                      disabled={!ticketResponse.trim() || respondToTicketMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-send-response"
                    >
                      {respondToTicketMutation.isPending ? "Enviando..." : "Enviar Respuesta"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Gestión del Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Estado del Ticket</Label>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(newStatus) => {
                        updateTicketStatusMutation.mutate({
                          ticketId: selectedTicket.id,
                          status: newStatus,
                        });
                        setSelectedTicket({ ...selectedTicket, status: newStatus });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABIERTO">Abierto</SelectItem>
                        <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                        <SelectItem value="ESPERANDO_CLIENTE">Esperando Cliente</SelectItem>
                        <SelectItem value="RESUELTO">Resuelto</SelectItem>
                        <SelectItem value="CERRADO">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="adminNotes">Notas Administrativas (internas)</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Notas internas sobre este ticket..."
                      rows={2}
                      data-testid="textarea-admin-notes"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resolution">Resolución Final</Label>
                    <Textarea
                      id="resolution"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Describe cómo se resolvió este ticket..."
                      rows={2}
                      data-testid="textarea-resolution"
                    />
                  </div>

                  <Button
                    onClick={handleSaveTicketNotes}
                    disabled={updateTicketStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-save-ticket-notes"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateTicketStatusMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña de Usuario</DialogTitle>
          </DialogHeader>
          
          {selectedUserForPassword && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Usuario:</strong> {selectedUserForPassword.fullName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {selectedUserForPassword.email}
                </p>
              </div>

              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Ingresa la nueva contraseña"
                            {...field}
                            data-testid="input-new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirma la nueva contraseña"
                            {...field}
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-yellow-50 p-3 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Nota de seguridad:</strong> El usuario deberá usar esta nueva contraseña para iniciar sesión.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                      data-testid="button-cancel-password-change"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-submit-password-change"
                    >
                      {changePasswordMutation.isPending ? "Cambiando..." : "Cambiar Contraseña"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear Usuario</DialogTitle>
          </DialogHeader>
          
          {selectedUserForBlock && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Usuario:</strong> {selectedUserForBlock.fullName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {selectedUserForBlock.email}
                </p>
              </div>

              <div>
                <Label htmlFor="blockReason">Motivo del Bloqueo</Label>
                <Textarea
                  id="blockReason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Describe el motivo del bloqueo (ej: comportamiento inapropiado, lenguaje ofensivo, etc.)"
                  rows={4}
                  data-testid="textarea-block-reason"
                />
              </div>

              <div className="bg-yellow-50 p-3 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Advertencia:</strong> El usuario no podrá iniciar sesión hasta que sea desbloqueado.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBlockDialogOpen(false)}
                  data-testid="button-cancel-block"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBlockSubmit}
                  disabled={blockUserMutation.isPending || !blockReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-submit-block"
                >
                  {blockUserMutation.isPending ? "Bloqueando..." : "Bloquear Usuario"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
