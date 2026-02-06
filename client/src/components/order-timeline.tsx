import { Check, Package, Truck, Home } from "lucide-react";

interface OrderTimelineProps {
  status: string;
}

export default function OrderTimeline({ status }: OrderTimelineProps) {
  const steps = [
    { key: "PAGADO", label: "Pagado", icon: Check },
    { key: "EN_PREPARACION", label: "En Preparación", icon: Package },
    { key: "ENVIADO", label: "Enviado", icon: Truck },
    { key: "ENTREGADO", label: "Entregado", icon: Home },
  ];

  const getStepIndex = (stepKey: string) => {
    return steps.findIndex((step) => step.key === stepKey);
  };

  const currentStepIndex = getStepIndex(status);

  const isStepActive = (stepIndex: number) => {
    return stepIndex <= currentStepIndex;
  };

  return (
    <div className="mb-4">
      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = isStepActive(index);
            
            return (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    isActive ? "tracking-step-active" : "bg-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 w-16 ${
                      isStepActive(index + 1) ? "bg-boom-yellow" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          {steps.map((step) => (
            <span key={step.key} className="text-center w-20">
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Mobile Timeline */}
      <div className="md:hidden space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = isStepActive(index);
          
          return (
            <div key={step.key} className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  isActive ? "tracking-step-active" : "bg-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`font-medium ${
                  isActive ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
              {isActive && index === currentStepIndex && (
                <span className="text-sm text-boom-red font-semibold">Actual</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
