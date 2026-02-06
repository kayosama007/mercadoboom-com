import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SecurityVerification } from "@/components/security-verification";

interface VerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  title?: string;
  description?: string;
  onVerificationComplete: () => void;
}

export function VerificationDialog({
  isOpen,
  onOpenChange,
  action,
  title = "Verificación de Seguridad Requerida",
  description = "Por tu seguridad, necesitamos verificar tu identidad antes de continuar.",
  onVerificationComplete,
}: VerificationDialogProps) {
  const handleVerificationComplete = () => {
    onOpenChange(false);
    onVerificationComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <SecurityVerification
          action={action}
          required={true}
          onVerificationComplete={handleVerificationComplete}
        />
      </DialogContent>
    </Dialog>
  );
}