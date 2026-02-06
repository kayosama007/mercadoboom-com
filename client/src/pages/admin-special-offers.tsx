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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSpecialOfferSchema, type SpecialOffer, type InsertSpecialOffer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Tag, Upload, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const offerTypes = [
  { value: "BOOM", label: "BOOM", color: "bg-red-500" },
  { value: "OFERTA", label: "OFERTA", color: "bg-blue-500" },
  { value: "RELAMPAGO", label: "RELÁMPAGO", color: "bg-yellow-500" },
  { value: "ESPECIAL", label: "ESPECIAL", color: "bg-green-500" },
];

export default function AdminSpecialOffers() {
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["/api/admin/special-offers"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<InsertSpecialOffer>({
    resolver: zodResolver(insertSpecialOfferSchema),
    defaultValues: {
      title: "",
      description: "",
      discountPercentage: 0,
      originalPrice: "",
      offerPrice: "",
      imageUrl: "",
      productId: "",
      offerType: "BOOM",
      isActive: true,
      displayOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSpecialOffer) => apiRequest("POST", "/api/admin/special-offers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/special-offers"] });
      toast({
        title: "Oferta creada",
        description: "La oferta especial se ha creado exitosamente.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la oferta especial.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertSpecialOffer> }) =>
      apiRequest("PUT", `/api/admin/special-offers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/special-offers"] });
      toast({
        title: "Oferta actualizada",
        description: "La oferta especial se ha actualizado exitosamente.",
      });
      setIsDialogOpen(false);
      setEditingOffer(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la oferta especial.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/special-offers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/special-offers"] });
      toast({
        title: "Oferta eliminada",
        description: "La oferta especial se ha eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la oferta especial.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (offer: SpecialOffer) => {
    setEditingOffer(offer);
    form.reset({
      title: offer.title,
      description: offer.description || "",
      discountPercentage: offer.discountPercentage || 0,
      originalPrice: offer.originalPrice || "",
      offerPrice: offer.offerPrice || "",
      imageUrl: offer.imageUrl || "",
      productId: offer.productId || "none",
      offerType: offer.offerType || "BOOM",
      isActive: offer.isActive || false,
      displayOrder: offer.displayOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta oferta especial?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: InsertSpecialOffer) => {
    // Convert "none" back to empty string for productId
    const processedData = {
      ...data,
      productId: data.productId === "none" ? "" : data.productId
    };
    
    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
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

  const getOfferTypeColor = (type: string) => {
    const offerType = offerTypes.find(t => t.value === type);
    return offerType?.color || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando ofertas especiales...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8" data-testid="admin-special-offers-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
            Ofertas Especiales
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona las ofertas y promociones especiales con imágenes rotativas
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingOffer(null);
                form.reset();
              }}
              data-testid="button-create-offer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Oferta
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingOffer ? "Editar Oferta Especial" : "Crear Nueva Oferta Especial"}
              </DialogTitle>
              <DialogDescription>
                Configura una oferta especial con imagen y detalles promocionales
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título de la Oferta</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="iPhone 15 Pro Max BOOM!" 
                            {...field} 
                            data-testid="input-offer-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="offerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Oferta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-offer-type">
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {offerTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded ${type.color}`}></div>
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción atractiva de la oferta..."
                          {...field} 
                          data-testid="input-offer-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Producto Relacionado (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-offer-product">
                            <SelectValue placeholder="Selecciona un producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin producto específico</SelectItem>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Original</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="$25,000" 
                            {...field} 
                            data-testid="input-offer-original-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="offerPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Oferta</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="$19,999" 
                            {...field} 
                            data-testid="input-offer-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>% Descuento</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="20"
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-offer-discount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagen de la Oferta</FormLabel>
                      <div className="space-y-2">
                        <FormControl>
                          <Input 
                            placeholder="URL de la imagen o sube una nueva"
                            {...field} 
                            data-testid="input-offer-image"
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
                        Imagen promocional. Tamaño recomendado: 600x400px
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            data-testid="input-offer-order"
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
                          <FormLabel className="text-base">Oferta Activa</FormLabel>
                          <FormDescription>
                            La oferta aparecerá en las promociones
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-offer-active"
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
                      setEditingOffer(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-offer"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-offer"
                  >
                    {editingOffer ? "Actualizar" : "Crear"} Oferta
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer: SpecialOffer) => (
          <Card key={offer.id} className="overflow-hidden" data-testid={`card-offer-${offer.id}`}>
            <div className="h-48 relative bg-gray-100">
              {offer.imageUrl ? (
                <img 
                  src={offer.imageUrl} 
                  alt={offer.title}
                  className="w-full h-full object-cover"
                  data-testid={`img-offer-${offer.id}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Tag className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div className="absolute top-2 left-2">
                <Badge className={`${getOfferTypeColor(offer.offerType || "BOOM")} text-white`}>
                  {offer.offerType}
                </Badge>
              </div>
              
              {offer.discountPercentage && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="flex items-center">
                    <Percent className="w-3 h-3 mr-1" />
                    {offer.discountPercentage}% OFF
                  </Badge>
                </div>
              )}
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2" data-testid={`text-offer-title-${offer.id}`}>
                    {offer.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2" data-testid={`text-offer-description-${offer.id}`}>
                    {offer.description}
                  </CardDescription>
                </div>
                <Badge 
                  variant={offer.isActive ? "default" : "secondary"}
                  data-testid={`badge-offer-status-${offer.id}`}
                >
                  {offer.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {(offer.originalPrice || offer.offerPrice) && (
                <div className="flex items-center space-x-2 mb-4">
                  {offer.originalPrice && (
                    <span className="text-sm text-gray-500 line-through" data-testid={`text-offer-original-${offer.id}`}>
                      {offer.originalPrice}
                    </span>
                  )}
                  {offer.offerPrice && (
                    <span className="text-lg font-bold text-red-600" data-testid={`text-offer-price-${offer.id}`}>
                      {offer.offerPrice}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600" data-testid={`text-offer-order-${offer.id}`}>
                  Orden: {offer.displayOrder || 0}
                </span>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(offer)}
                    data-testid={`button-edit-offer-${offer.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(offer.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-delete-offer-${offer.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {offers.length === 0 && (
        <Card className="text-center py-12" data-testid="card-no-offers">
          <CardContent>
            <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay ofertas especiales
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera oferta especial para mostrar promociones atractivas
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-offer">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Oferta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}