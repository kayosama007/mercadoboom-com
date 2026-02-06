import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { MessageCircle, Plus, Clock, CheckCircle2, AlertCircle, User, Calendar, ArrowLeft, Send } from "lucide-react";
import type { SupportTicket, TicketMessage } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const createTicketSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  subject: z.string().min(1, "El asunto es requerido"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  category: z.enum(["PEDIDO", "PAGO", "TECNICO", "DEVOLUCION", "OTRO"]),
  priority: z.enum(["BAJO", "MEDIO", "ALTO", "URGENTE"]).optional(),
  orderId: z.string().optional(),
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const form = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      name: user?.fullName || "",
      email: user?.email || "",
      subject: "",
      description: "",
      category: "OTRO",
      priority: "MEDIO",
      orderId: "",
    },
  });

  // Fetch user's tickets
  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    enabled: !!user,
  });

  // Fetch selected ticket details with messages
  const { data: ticketDetails } = useQuery<SupportTicket & { messages: TicketMessage[] }>({
    queryKey: ["/api/support/tickets", selectedTicketId],
    enabled: !!selectedTicketId,
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketForm) => 
      apiRequest("POST", "/api/support/tickets", data),
    onSuccess: () => {
      toast({
        title: "¡Ticket Creado!",
        description: "Tu solicitud de soporte ha sido enviada. Te contactaremos pronto.",
      });
      form.reset();
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el ticket. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateTicketForm) => {
    createTicketMutation.mutate(data);
  };

  const sendMessageMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      apiRequest("POST", `/api/support/tickets/${ticketId}/messages`, {
        message,
        senderType: "CLIENTE",
        senderName: user?.fullName || user?.username || "Usuario",
        senderEmail: user?.email || "",
      }),
    onSuccess: () => {
      toast({
        title: "Mensaje Enviado",
        description: "Tu respuesta ha sido enviada al equipo de soporte.",
      });
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedTicketId || !replyMessage.trim()) return;
    sendMessageMutation.mutate({ ticketId: selectedTicketId, message: replyMessage });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      "ABIERTO": "bg-blue-100 text-blue-800",
      "EN_PROCESO": "bg-yellow-100 text-yellow-800",
      "ESPERANDO_CLIENTE": "bg-orange-100 text-orange-800",
      "RESUELTO": "bg-green-100 text-green-800",
      "CERRADO": "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      "BAJO": "bg-green-100 text-green-800",
      "MEDIO": "bg-blue-100 text-blue-800",
      "ALTO": "bg-orange-100 text-orange-800",
      "URGENTE": "bg-red-100 text-red-800",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      "PEDIDO": "📦 Problema con Pedido",
      "PAGO": "💳 Problema de Pago",
      "TECNICO": "⚙️ Problema Técnico",
      "DEVOLUCION": "↩️ Devolución",
      "OTRO": "❓ Otro",
    };
    return labels[category as keyof typeof labels] || category;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Centro de Soporte</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Para crear un ticket de soporte, necesitas iniciar sesión.
            </p>
            <Button onClick={() => window.location.href = "/auth"}>
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4" data-testid="button-back-to-dashboard">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Centro de Soporte</h1>
            <p className="text-gray-600 mt-2">
              Gestiona tus solicitudes de ayuda y encuentra soluciones a tus problemas
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-boom-red hover:bg-red-700"
            data-testid="button-create-ticket"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Crear Nuevo Ticket de Soporte</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-ticket-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-ticket-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asunto</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Describe brevemente tu problema..." 
                            {...field} 
                            data-testid="input-ticket-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || "OTRO"}
                            defaultValue="OTRO"
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-ticket-category">
                                <SelectValue placeholder="Selecciona una categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent position="popper" side="bottom" align="start">
                              <SelectItem value="PEDIDO">📦 Problema con Pedido</SelectItem>
                              <SelectItem value="PAGO">💳 Problema de Pago</SelectItem>
                              <SelectItem value="TECNICO">⚙️ Problema Técnico</SelectItem>
                              <SelectItem value="DEVOLUCION">↩️ Devolución</SelectItem>
                              <SelectItem value="OTRO">❓ Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridad</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || "MEDIO"}
                            defaultValue="MEDIO"
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-ticket-priority">
                                <SelectValue placeholder="Selecciona una prioridad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent position="popper" side="bottom" align="start">
                              <SelectItem value="BAJO">🟢 Baja</SelectItem>
                              <SelectItem value="MEDIO">🔵 Media</SelectItem>
                              <SelectItem value="ALTO">🟠 Alta</SelectItem>
                              <SelectItem value="URGENTE">🔴 Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="orderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID del Pedido (Opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="BB-2024-001" 
                              {...field} 
                              data-testid="input-ticket-order-id"
                            />
                          </FormControl>
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
                        <FormLabel>Descripción Detallada</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={5}
                            placeholder="Explica tu problema con el mayor detalle posible..." 
                            {...field} 
                            data-testid="textarea-ticket-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                      data-testid="button-cancel-ticket"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTicketMutation.isPending}
                      className="bg-boom-red hover:bg-red-700"
                      data-testid="button-submit-ticket"
                    >
                      {createTicketMutation.isPending ? "Creando..." : "Crear Ticket"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Mis Tickets</h2>
          
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-boom-red border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando tickets...</p>
              </CardContent>
            </Card>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes tickets</h3>
                <p className="text-gray-600 mb-4">
                  Cuando necesites ayuda, crea un ticket y nuestro equipo te asistirá.
                </p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-boom-red hover:bg-red-700"
                >
                  Crear mi primer ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {ticket.subject}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            #{ticket.ticketNumber}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {ticket.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('es-ES') : 'Fecha no disponible'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status === "ABIERTO" && <Clock className="w-3 h-3 mr-1" />}
                            {ticket.status === "RESUELTO" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {ticket.status === "EN_PROCESO" && <AlertCircle className="w-3 h-3 mr-1" />}
                            {ticket.status}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {getCategoryLabel(ticket.category)}
                        </div>
                      </div>
                    </div>
                    
                    {ticket.orderId && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-600">
                          <strong>Pedido relacionado:</strong> {ticket.orderId}
                        </p>
                      </div>
                    )}
                    
                    {ticket.resolution && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          <strong>Resolución:</strong> {ticket.resolution}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => setSelectedTicketId(ticket.id)}
                        variant="outline"
                        size="sm"
                        data-testid={`button-view-ticket-${ticket.id}`}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Ver Mensajes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Details Dialog */}
        <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {ticketDetails?.subject}
              </DialogTitle>
              <DialogDescription>
                Ticket #{ticketDetails?.ticketNumber} - {ticketDetails?.status}
              </DialogDescription>
            </DialogHeader>

            {ticketDetails && (
              <div className="space-y-4">
                {/* Original Ticket Description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2"><strong>Descripción Original:</strong></p>
                  <p className="text-sm text-gray-800">{ticketDetails.description}</p>
                </div>

                {/* Messages Thread */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Conversación</h3>
                  {ticketDetails.messages && ticketDetails.messages.length > 0 ? (
                    ticketDetails.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-lg p-4 ${
                          message.senderType === "ADMIN"
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-semibold text-sm">
                              {message.senderName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {message.senderType === "ADMIN" ? "Soporte" : "Tú"}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {message.createdAt ? new Date(message.createdAt).toLocaleString('es-ES') : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{message.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay mensajes aún
                    </p>
                  )}
                </div>

                {/* Reply Form - Only show if ticket is not closed */}
                {ticketDetails.status !== "CERRADO" && ticketDetails.status !== "RESUELTO" && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Enviar Respuesta</h3>
                    <div className="flex gap-2">
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        rows={3}
                        data-testid="textarea-reply-message"
                      />
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!replyMessage.trim() || sendMessageMutation.isPending}
                        className="bg-boom-red hover:bg-red-700"
                        data-testid="button-send-reply"
                      >
                        {sendMessageMutation.isPending ? (
                          <>Enviando...</>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Show message if ticket is closed or resolved */}
                {(ticketDetails.status === "CERRADO" || ticketDetails.status === "RESUELTO") && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      Este ticket está {ticketDetails.status === "CERRADO" ? "cerrado" : "resuelto"}. 
                      {ticketDetails.resolution && (
                        <><br/><strong>Resolución:</strong> {ticketDetails.resolution}</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}