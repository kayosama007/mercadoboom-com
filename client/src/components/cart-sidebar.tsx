import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useState, useEffect } from 'react';
import { CheckoutDialog } from '@/components/checkout-dialog';

export function CartSidebar() {
  const { state, removeFromCart, updateQuantity, closeCart, getTotalPrice, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // Handle ESC key to close cart
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isOpen) {
        event.preventDefault();
        event.stopPropagation();
        closeCart();
      }
    };

    if (state.isOpen) {
      // Use capture phase to intercept ESC before Dialog receives it
      document.addEventListener('keydown', handleEscape, true);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [state.isOpen, closeCart]);

  if (!state.isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-boom-red" />
            <h2 className="text-lg font-semibold">Carrito de Compras</h2>
            {state.items.length > 0 && (
              <Badge variant="secondary">{state.items.length}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={closeCart}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {state.items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-gray-600">
                Agrega productos para comenzar tu compra
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={item.product.id} className="border rounded-lg p-3">
                  <div className="flex gap-3">
                    <img
                      src={item.product.imageUrl || ''}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-boom-red font-bold text-sm">
                        {formatPrice(parseFloat(item.product.price))}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t text-right">
                    <p className="text-sm font-medium">
                      Subtotal: {formatPrice(parseFloat(item.product.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-boom-red">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
            
            <div className="space-y-2">
              <Button 
                className="w-full bg-boom-red hover:bg-boom-red/90 text-white"
                onClick={() => setShowCheckout(true)}
                data-testid="button-checkout"
              >
                Proceder al Pago
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={clearCart}
                data-testid="button-clear-cart"
              >
                Vaciar Carrito
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      {showCheckout && (
        <CheckoutDialog
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          cartItems={state.items}
          onSuccess={() => {
            clearCart();
            closeCart();
            setShowCheckout(false);
          }}
        />
      )}
    </>
  );
}