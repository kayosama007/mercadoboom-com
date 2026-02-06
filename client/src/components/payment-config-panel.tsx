import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PaymentConfig } from "@shared/schema";
import { 
  CreditCard,
  Building2,
  Settings,
  Eye,
  EyeOff,
  Save,
  Plus,
  Edit2,
  Banknote,
  Wallet,
  Shield
} from "lucide-react";

export function PaymentConfigPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConfig, setSelectedConfig] = useState<PaymentConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [configData, setConfigData] = useState("");

  // Fetch payment configurations
  const { data: paymentConfigs = [], isLoading } = useQuery<PaymentConfig[]>({
    queryKey: ["/api/admin/payment-config"],
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedConfig) {
        return apiRequest("PATCH", `/api/admin/payment-config/${selectedConfig.id}`, data);
      } else {
        return apiRequest("POST", "/api/admin/payment-config", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Configuración Guardada",
        description: "La configuración de pagos ha sido actualizada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-config"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar la configuración",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedConfig(null);
    setDisplayName("");
    setIsActive(true);
    setConfigData("");
  };

  const openEditDialog = (config: PaymentConfig) => {
    setSelectedConfig(config);
    setDisplayName(config.displayName);
    setIsActive(config.isActive);
    setConfigData(config.config);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSave = () => {
    try {
      // Validate JSON format
      JSON.parse(configData);
      
      const data: any = {
        displayName,
        isActive,
        config: configData,
      };
      
      if (!selectedConfig) {
        // For new configs, we need the configKey
        const configKey = displayName.toLowerCase().replace(/\s+/g, '_');
        data.configKey = configKey;
      }
      
      saveConfigMutation.mutate(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "La configuración debe ser JSON válido",
        variant: "destructive",
      });
    }
  };

  const toggleSensitiveData = (configId: string) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  const getConfigIcon = (configKey: string) => {
    switch (configKey) {
      case "mercadopago":
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case "bank_transfer":
        return <Building2 className="w-5 h-5 text-green-600" />;
      case "conekta":
        return <Wallet className="w-5 h-5 text-purple-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatSensitiveValue = (value: string, show: boolean) => {
    if (show) return value;
    if (value.length <= 4) return "****";
    return `${value.slice(0, 4)}****${value.slice(-4)}`;
  };

  const parseConfigSafely = (configString: string) => {
    try {
      return JSON.parse(configString);
    } catch {
      return {};
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Pagos
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} size="sm" data-testid="button-add-payment-config">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Pasarela
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedConfig ? "Editar Configuración" : "Agregar Pasarela de Pago"}
                </DialogTitle>
                <DialogDescription>
                  Configura una pasarela de pago para tu tienda
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="display-name">Nombre de la Pasarela</Label>
                  <Input
                    id="display-name"
                    placeholder="ej. MercadoPago, Conekta, Transferencia Bancaria"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    data-testid="input-display-name"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="is-active">Activa</Label>
                </div>

                <div>
                  <Label htmlFor="config-data">Configuración (JSON)</Label>
                  <Textarea
                    id="config-data"
                    placeholder='{"publicKey": "tu_public_key", "secretKey": "tu_secret_key"}'
                    value={configData}
                    onChange={(e) => setConfigData(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    data-testid="textarea-config-data"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa la configuración en formato JSON. Ejemplo para MercadoPago: 
                    {`{"publicKey": "APP_USR-xxx", "accessToken": "APP_USR-xxx"}`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSave}
                    disabled={saveConfigMutation.isPending || !displayName || !configData}
                    className="flex-1"
                    data-testid="button-save-config"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveConfigMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel-config"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {paymentConfigs.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No hay pasarelas de pago configuradas</p>
            <p className="text-sm text-gray-500">Agrega tu primera pasarela para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentConfigs.map((config) => {
              const parsedConfig = parseConfigSafely(config.config);
              const showSensitive = showSensitiveData[config.id];
              
              return (
                <Card key={config.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {getConfigIcon(config.configKey)}
                          <h3 className="font-semibold text-lg">{config.displayName}</h3>
                          {config.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Activa</Badge>
                          ) : (
                            <Badge variant="outline">Inactiva</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p><strong>Tipo:</strong> {config.configKey}</p>
                          <p><strong>Última actualización:</strong> {new Date(config.updatedAt!).toLocaleDateString("es-MX")}</p>
                        </div>

                        {/* Configuration Preview */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">Configuración</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSensitiveData(config.id)}
                              className="h-6 px-2"
                              data-testid={`button-toggle-${config.id}`}
                            >
                              {showSensitive ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                          
                          <div className="text-xs space-y-1 font-mono">
                            {Object.entries(parsedConfig).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{key}:</span>
                                <span className="text-gray-800">
                                  {key.toLowerCase().includes('secret') || 
                                   key.toLowerCase().includes('private') ||
                                   key.toLowerCase().includes('token') ? 
                                    formatSensitiveValue(String(value), showSensitive) : 
                                    String(value)
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(config)}
                        data-testid={`button-edit-${config.id}`}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}