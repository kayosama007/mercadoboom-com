import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBannerSchema, type Banner, type InsertBanner } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function AdminBanners() {
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<"internal" | "external">("internal");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const internalRoutes = [
    { value: "/ofertas", label: "Ver Ofertas" },
    { value: "/explorar", label: "Explorar Productos" },
    { value: "/auth", label: "Iniciar Sesión" },
    { value: "/dashboard", label: "Mi Cuenta" },
    { value: "/", label: "Página Principal" },
  ];

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["/api/admin/banners"],
  });

  const form = useForm<InsertBanner>({
    resolver: zodResolver(insertBannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      imageUrl: "",
      buttonText: "",
      buttonLink: "",
      backgroundColor: "#ff4444",
      textColor: "#ffffff",
      isTransparent: false,
      isActive: true,
      displayOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertBanner) => apiRequest("POST", "/api/admin/banners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({
        title: "Banner creado",
        description: "El banner se ha creado exitosamente.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el banner.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertBanner> }) =>
      apiRequest("PUT", `/api/admin/banners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({
        title: "Banner actualizado",
        description: "El banner se ha actualizado exitosamente.",
      });
      setIsDialogOpen(false);
      setEditingBanner(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el banner.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({
        title: "Banner eliminado",
        description: "El banner se ha eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el banner.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    form.reset({
      title: banner.title,
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      buttonText: banner.buttonText || "",
      buttonLink: banner.buttonLink || "",
      backgroundColor: banner.backgroundColor || "#ff4444",
      textColor: banner.textColor || "#ffffff",
      isTransparent: banner.isTransparent || false,
      isActive: banner.isActive || false,
      displayOrder: banner.displayOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este banner?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: InsertBanner) => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageUpload = async () => {
    try {
      const response = await fetch("/api/objects/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL || "";
      
      if (imageUrl) {
        try {
          // Normalize the URL to a permanent path
          const res = await apiRequest("POST", "/api/objects/normalize", { path: imageUrl });
          const data = await res.json() as { path: string };
          form.setValue("imageUrl", data.path);
          toast({
            title: "Imagen subida",
            description: "La imagen se ha subido exitosamente.",
          });
        } catch (error) {
          console.error('Error normalizing URL:', error);
          toast({
            title: "Error",
            description: "Error al procesar la imagen",
            variant: "destructive",
          });
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando banners...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8" data-testid="admin-banners-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
            Gestión de Banners
          </h1>
          <p className="text-gray-600 mt-2">
            Administra los banners principales de la página de inicio
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingBanner(null);
                form.reset();
              }}
              data-testid="button-create-banner"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Banner
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingBanner ? "Editar Banner" : "Crear Nuevo Banner"}
              </DialogTitle>
              <DialogDescription>
                Configura el banner que aparecerá en la página principal
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="¡COMPRA BOOM!" 
                          {...field} 
                          data-testid="input-banner-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtítulo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Los mejores productos electrónicos al mayoreo..."
                          {...field} 
                          data-testid="input-banner-subtitle"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagen del Banner</FormLabel>
                      <div className="space-y-2">
                        <FormControl>
                          <Input 
                            placeholder="URL de la imagen o sube una nueva"
                            {...field} 
                            data-testid="input-banner-image"
                          />
                        </FormControl>
                        <ObjectUploader
                          onGetUploadParameters={handleImageUpload}
                          onComplete={handleUploadComplete}
                          buttonClassName="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Nueva Imagen
                        </ObjectUploader>
                      </div>
                      <FormDescription>
                        Sube una imagen o proporciona una URL. Tamaño recomendado: 1200x400px
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color de Fondo</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="color" 
                              {...field} 
                              className="w-16 h-10"
                              data-testid="input-banner-bg-color"
                            />
                            <Input 
                              placeholder="#ff4444" 
                              {...field}
                              className="flex-1"
                              data-testid="input-banner-bg-text"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="textColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color de Texto</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="color" 
                              {...field} 
                              className="w-16 h-10"
                              data-testid="input-banner-text-color"
                            />
                            <Input 
                              placeholder="#ffffff" 
                              {...field}
                              className="flex-1"
                              data-testid="input-banner-text-hex"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isTransparent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Fondo Transparente</FormLabel>
                        <FormDescription>
                          Usar fondo transparente para mostrar solo la imagen sin color de fondo
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-banner-transparent"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buttonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto del Botón (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ver Ofertas" 
                          {...field} 
                          data-testid="input-banner-button-text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div>
                    <FormLabel>Enlace del Botón (Opcional)</FormLabel>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        type="button"
                        variant={linkType === "internal" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLinkType("internal")}
                        data-testid="button-link-internal"
                      >
                        Ruta Interna
                      </Button>
                      <Button
                        type="button"
                        variant={linkType === "external" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLinkType("external")}
                        data-testid="button-link-external"
                      >
                        Enlace Externo
                      </Button>
                    </div>
                  </div>

                  {linkType === "internal" ? (
                    <FormField
                      control={form.control}
                      name="buttonLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-internal-route">
                                <SelectValue placeholder="Selecciona una página" />
                              </SelectTrigger>
                              <SelectContent>
                                {internalRoutes.map((route) => (
                                  <SelectItem key={route.value} value={route.value}>
                                    {route.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Selecciona la página a la que llevará el botón
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="buttonLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="https://ejemplo.com" 
                              {...field} 
                              data-testid="input-external-link"
                            />
                          </FormControl>
                          <FormDescription>
                            Ingresa la URL completa (debe empezar con http:// o https://)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orden de Visualización</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-banner-order"
                          />
                        </FormControl>
                        <FormDescription>
                          Menor número aparece primero
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Banner Activo</FormLabel>
                          <FormDescription>
                            El banner aparecerá en la página principal
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-banner-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingBanner(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-banner"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-banner"
                  >
                    {editingBanner ? "Actualizar" : "Crear"} Banner
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner: Banner) => (
          <Card key={banner.id} className="overflow-hidden" data-testid={`card-banner-${banner.id}`}>
            <div 
              className="h-32 relative"
              style={{ 
                backgroundColor: banner.backgroundColor || "#ff4444",
                color: banner.textColor || "#ffffff"
              }}
            >
              {banner.imageUrl ? (
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  data-testid={`img-banner-${banner.id}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="text-center p-4">
                  <h3 className="font-bold text-lg" data-testid={`text-banner-title-${banner.id}`}>
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-sm opacity-90 mt-1" data-testid={`text-banner-subtitle-${banner.id}`}>
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg" data-testid={`text-banner-card-title-${banner.id}`}>
                    {banner.title}
                  </CardTitle>
                  <CardDescription data-testid={`text-banner-order-${banner.id}`}>
                    Orden: {banner.displayOrder || 0}
                  </CardDescription>
                </div>
                <Badge 
                  variant={banner.isActive ? "default" : "secondary"}
                  data-testid={`badge-banner-status-${banner.id}`}
                >
                  {banner.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(banner)}
                  data-testid={`button-edit-banner-${banner.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(banner.id)}
                  className="text-red-600 hover:text-red-700"
                  data-testid={`button-delete-banner-${banner.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <Card className="text-center py-12" data-testid="card-no-banners">
          <CardContent>
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay banners creados
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primer banner para mostrar promociones en la página principal
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-banner">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Banner
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}